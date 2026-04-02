import { getPaystack } from '@/utilities/initalise'

/**
 * Verify Pending Paystack Payouts Task
 *
 * Scheduled every 15 minutes. Finds payout transactions that are still
 * pending after 5 minutes and polls Paystack's transfer API to sync status.
 * Acts as a safety net in case a transfer.success/failed webhook was missed.
 */
export const verifyPendingPaystackPayoutsTask = {
  slug: 'verify-pending-paystack-payouts',
  handler: async (args: any) => {
    try {
      const payload = args.req?.payload || args.payload

      const cutoffTime = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const maxPendingTime = new Date(Date.now() - 60 * 60 * 1000).toISOString()

      // Find pending Paystack payout transactions older than 5 minutes
      // These have viaPaymentLink: true and a non-empty transactionReference (transfer_code)
      const pendingPayouts = await payload.find({
        collection: 'transactions',
        where: {
          paymentStatus: { equals: 'pending' },
          type: { equals: 'payout' },
          viaPaymentLink: { equals: true },
          transactionReference: { not_equals: '' },
          createdAt: { less_than: cutoffTime },
        },
        limit: 100,
        depth: 0,
        overrideAccess: true,
      })

      if (pendingPayouts.docs.length === 0) {
        return { output: { processed: 0, message: 'No pending Paystack payouts to verify' } }
      }

      console.log(
        `[verify-pending-paystack-payouts] Found ${pendingPayouts.docs.length} pending payouts`,
      )

      const paystack = getPaystack()
      let processedCount = 0
      let failedCount = 0

      for (const transaction of pendingPayouts.docs) {
        const { id, transactionReference } = transaction as any

        // transactionReference is the transfer_code; reference (transaction.id) is what
        // we passed to initiateTransfer — use transaction.id to verify
        if (!transactionReference) {
          // No transfer_code yet — the process-payout-paystack job hasn't run yet, skip
          continue
        }

        try {
          // Paystack verifyTransfer accepts either transfer_code or the reference we passed
          // We stored transfer_code as transactionReference, so use that
          const result = await paystack.verifyTransfer(transactionReference)

          const statusMap: Record<string, 'completed' | 'failed' | 'pending'> = {
            success: 'completed',
            failed: 'failed',
            reversed: 'failed',
            pending: 'pending',
          }

          const newStatus = statusMap[result.status] ?? 'pending'

          if (newStatus === 'pending') {
            // Auto-fail if stuck for more than 1 hour
            const createdAt = (transaction as any).createdAt
            if (createdAt && createdAt < maxPendingTime) {
              await payload.update({
                collection: 'transactions',
                id,
                data: { paymentStatus: 'failed' },
                overrideAccess: true,
                context: { skipCharges: true },
              })
              console.log(
                `[verify-pending-paystack-payouts] Auto-failed transaction ${id} (pending > 1 hour)`,
              )
              failedCount++
              processedCount++
            }
            continue
          }

          await payload.update({
            collection: 'transactions',
            id,
            data: { paymentStatus: newStatus },
            overrideAccess: true,
            context: { skipCharges: true },
          })

          console.log(
            `[verify-pending-paystack-payouts] Transaction ${id} → ${newStatus} (transfer: ${transactionReference})`,
          )

          if (newStatus === 'failed') failedCount++
          processedCount++
        } catch (error: any) {
          console.error(
            `[verify-pending-paystack-payouts] Error verifying transaction ${id}:`,
            error.message,
          )

          // Auto-fail if stuck for more than 1 hour and we can't verify
          const createdAt = (transaction as any).createdAt
          if (createdAt && createdAt < maxPendingTime) {
            try {
              await payload.update({
                collection: 'transactions',
                id,
                data: { paymentStatus: 'failed' },
                overrideAccess: true,
                context: { skipCharges: true },
              })
              console.log(
                `[verify-pending-paystack-payouts] Auto-failed transaction ${id} (pending > 1 hour, API error)`,
              )
              failedCount++
            } catch (e: any) {
              console.error(
                `[verify-pending-paystack-payouts] Error auto-failing transaction ${id}:`,
                e.message,
              )
            }
          }
        }
      }

      console.log(
        `[verify-pending-paystack-payouts] Processed: ${processedCount}, Failed: ${failedCount}`,
      )

      return {
        output: {
          total: pendingPayouts.docs.length,
          processed: processedCount,
          failed: failedCount,
          message: `Verified ${processedCount} payouts, ${failedCount} marked as failed`,
        },
      }
    } catch (error: any) {
      console.error('[verify-pending-paystack-payouts] Task error:', error)
      return { output: { processed: 0, message: `Error: ${error.message}` } }
    }
  },
}
