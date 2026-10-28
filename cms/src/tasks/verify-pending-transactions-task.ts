import { getEganow } from '@/utilities/initalise'
import { reconcileChangoJar } from '@/utilities/changoReconcile'

/** Chango's checkout session lasts a day; a payment still missing after that isn't coming. */
const CHANGO_PENDING_LIMIT_MS = 24 * 60 * 60 * 1000

/**
 * Confirms pending Chango contributions against each jar's campaign on Chango, then fails the
 * ones that never arrived.
 */
async function reconcilePendingChango(payload: any) {
  const { docs: pending } = await payload.find({
    collection: 'transactions',
    where: {
      paymentStatus: { equals: 'pending' },
      type: { equals: 'contribution' },
      changoInvoiceId: { exists: true },
    },
    pagination: false,
    depth: 1,
    overrideAccess: true,
  })

  const jars = new Map<string, any>()
  for (const t of pending) if (t.jar && typeof t.jar === 'object') jars.set(t.jar.id, t.jar)

  const confirmed = new Set<string>()
  for (const jar of jars.values()) {
    try {
      for (const id of await reconcileChangoJar(payload, jar)) confirmed.add(id)
    } catch (err: any) {
      console.error(
        `[verify-pending-transactions] Chango check failed for jar ${jar.id}:`,
        err?.message,
      )
    }
  }

  let expired = 0
  const limit = Date.now() - CHANGO_PENDING_LIMIT_MS
  for (const t of pending) {
    if (confirmed.has(t.id) || Date.parse(t.createdAt) > limit) continue
    await payload.update({
      collection: 'transactions',
      id: t.id,
      data: { paymentStatus: 'failed' },
      overrideAccess: true,
      context: { skipCharges: true },
    })
    expired++
  }

  if (pending.length) {
    console.log(
      `[verify-pending-transactions] Chango: ${pending.length} pending, ${confirmed.size} confirmed, ${expired} expired`,
    )
  }
  return { pending: pending.length, confirmed: confirmed.size, expired }
}

/**
 * Verify Pending Transactions Task
 *
 * Scheduled every hour via Payload's autoRun.
 * Checks pending mobile-money transactions older than 5 minutes
 * against the Eganow API and updates their status accordingly.
 */
export const verifyPendingTransactionsTask = {
  slug: 'verify-pending-transactions',
  schedule: [
    {
      cron: '*/15 * * * *', // Every 15 minutes
      queue: 'verify-pending-transactions',
    },
  ],
  handler: async (args: any) => {
    try {
      const payload = args.req?.payload || args.payload

      const chango = await reconcilePendingChango(payload)

      // 5 minutes ago — transactions must be at least 5 min old before we check
      const cutoffTime = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      // 1 hour ago — transactions older than this are auto-failed
      const maxPendingTime = new Date(Date.now() - 60 * 60 * 1000).toISOString()

      // Find pending mobile-money, card and bank transactions older than 5 minutes
      // (bank = bank payouts). Covers both contributions and payouts.
      const pendingTransactions = await payload.find({
        collection: 'transactions',
        where: {
          paymentStatus: { equals: 'pending' },
          paymentMethod: { in: ['mobile-money', 'card', 'bank'] },
          createdAt: { less_than: cutoffTime },
          // Chango contributions are checked against Chango above; Eganow has never seen them.
          changoInvoiceId: { exists: false },
        },
        limit: 500,
        depth: 2,
        overrideAccess: true,
      })

      if (pendingTransactions.docs.length === 0) {
        return {
          output: {
            processed: 0,
            chango,
            message: 'No pending transactions to verify',
          },
        }
      }

      console.log(
        `[verify-pending-transactions] Found ${pendingTransactions.docs.length} pending transactions older than 5 minutes`,
      )

      let processedCount = 0
      let failedCount = 0

      for (const transaction of pendingTransactions.docs) {
        const { transactionReference, id, collector, jar, type, paymentMethod } = transaction as any

        const collectorId = typeof collector === 'string' ? collector : collector?.id
        const jarId = typeof jar === 'string' ? jar : jar?.id

        // Reconstruct the id Eganow recognises for status lookup:
        // - payouts: "payout-{id}"
        // - card contributions: the Eganow reference (Eganow does not recognise our id for cards)
        // - mobile money contributions: raw id
        const eganowTransactionId =
          type === 'payout' ? `payout-${id}` : paymentMethod === 'card' ? transactionReference : id

        // No collector or no transaction reference → mark as failed
        if (!collector || !transactionReference) {
          try {
            await payload.update({
              collection: 'transactions',
              id,
              data: {
                paymentStatus: 'failed',
                ...(jarId ? { jar: jarId } : {}),
                ...(collectorId ? { collector: collectorId } : {}),
              },
              overrideAccess: true,
            })
          } catch (e: any) {
            console.error(
              `[verify-pending-transactions] Error marking transaction ${id} as failed:`,
              e.message,
            )
          }
          failedCount++
          continue
        }

        // Verify with Eganow
        try {
          const statusResult = await getEganow().checkTransactionStatus({
            transactionId: eganowTransactionId,
            languageId: 'en',
          })

          console.log(
            `[verify-pending-transactions] Eganow response for ${id}:`,
            JSON.stringify(statusResult),
          )

          // If Eganow says transaction doesn't exist, mark as failed
          if (!statusResult.isSuccess) {
            await payload.update({
              collection: 'transactions',
              id,
              data: {
                paymentStatus: 'failed',
                ...(jarId ? { jar: jarId } : {}),
                ...(collectorId ? { collector: collectorId } : {}),
              },
              overrideAccess: true,
            })
            console.log(
              `[verify-pending-transactions] Marked ${id} as failed: ${statusResult.message}`,
            )
            failedCount++
            processedCount++
            continue
          }

          const rawStatus = (
            statusResult.transStatus ||
            (statusResult as any).transactionstatus ||
            ''
          ).toUpperCase()

          const statusMap: Record<string, 'completed' | 'failed' | 'pending'> = {
            SUCCESSFUL: 'completed',
            SUCCESS: 'completed',
            APPROVED: 'completed',
            DECLINED: 'failed',
            FAILED: 'failed',
            EXPIRED: 'failed',
            CANCELLED: 'failed',
            PENDING: 'pending',
          }

          const newStatus = statusMap[rawStatus] || 'pending'

          // Skip no-op updates — only write to DB when status actually changes.
          // This prevents a race condition where two CMS instances both pick up
          // the same pending transaction: one resolves to 'completed' and the
          // other resolves to 'pending', overwriting the completed status.
          if (newStatus === 'pending') {
            processedCount++
            continue
          }

          await payload.update({
            collection: 'transactions',
            id,
            data: {
              paymentStatus: newStatus,
              ...(jarId ? { jar: jarId } : {}),
              ...(collectorId ? { collector: collectorId } : {}),
            },
            overrideAccess: true,
          })

          if (newStatus === 'failed') failedCount++
          processedCount++
        } catch (error: any) {
          // Eganow sometimes returns a plain-text "Failed. Please try again later."
          // with HTTP 200 for transactions it can't look up right now. Treat this
          // as a transient error — skip and let the next scheduled run retry.
          const isTransient =
            typeof error.message === 'string' &&
            error.message.includes('non-JSON response') &&
            error.message.includes('Failed')

          if (isTransient) {
            console.warn(
              `[verify-pending-transactions] Transient Eganow error for ${id}, will retry next run`,
            )
            continue
          }

          console.error(
            `[verify-pending-transactions] Error verifying transaction ${id}:`,
            error.message,
          )

          // Auto-fail transactions older than 1 hour that we can't verify
          const createdAt = (transaction as any).createdAt
          if (createdAt && createdAt < maxPendingTime) {
            try {
              await payload.update({
                collection: 'transactions',
                id,
                data: {
                  paymentStatus: 'failed',
                  ...(jarId ? { jar: jarId } : {}),
                  ...(collectorId ? { collector: collectorId } : {}),
                },
                overrideAccess: true,
              })
              console.log(
                `[verify-pending-transactions] Auto-failed transaction ${id} (pending > 1 hour, Eganow error: ${error.message})`,
              )
              failedCount++
            } catch (e: any) {
              console.error(
                `[verify-pending-transactions] Error auto-failing transaction ${id}:`,
                e.message,
              )
            }
          }
        }
      }

      console.log(
        `[verify-pending-transactions] Processed: ${processedCount}, Failed: ${failedCount}`,
      )

      return {
        output: {
          total: pendingTransactions.docs.length,
          processed: processedCount,
          failed: failedCount,
          chango,
          message: `Verified ${processedCount} transactions, ${failedCount} marked as failed`,
        },
      }
    } catch (error: any) {
      console.error('[verify-pending-transactions] Task error:', error)
      return {
        output: {
          processed: 0,
          message: `Error: ${error.message}`,
        },
      }
    }
  },
}
