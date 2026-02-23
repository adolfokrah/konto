import { getEganow } from '@/utilities/initalise'

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
      cron: '*/2 * * * *', // Every 2 minutes (testing)
      queue: 'verify-pending-transactions',
    },
  ],
  handler: async (args: any) => {
    try {
      const payload = args.req?.payload || args.payload

      // 5 minutes ago — transactions must be at least 5 min old before we check
      const cutoffTime = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      // 1 hour ago — transactions older than this are auto-failed
      const maxPendingTime = new Date(Date.now() - 60 * 60 * 1000).toISOString()

      // Find pending mobile-money transactions older than 5 minutes
      const pendingTransactions = await payload.find({
        collection: 'transactions',
        where: {
          paymentStatus: { equals: 'pending' },
          paymentMethod: { equals: 'mobile-money' },
          createdAt: { less_than: cutoffTime },
        },
        limit: 500,
        depth: 2,
        overrideAccess: true,
      })

      if (pendingTransactions.docs.length === 0) {
        return {
          output: {
            processed: 0,
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
        const { transactionReference, id, collector, jar } = transaction as any

        const collectorId = typeof collector === 'string' ? collector : collector?.id
        const jarId = typeof jar === 'string' ? jar : jar?.id

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
          await getEganow().getToken()

          const statusResult = await getEganow().checkTransactionStatus({
            transactionId: id,
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
            FAILED: 'failed',
            PENDING: 'pending',
          }

          const newStatus = statusMap[rawStatus] || 'pending'

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
