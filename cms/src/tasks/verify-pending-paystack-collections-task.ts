import { getPaystack } from '@/utilities/initalise'

/**
 * Verify Pending Paystack Collections Task
 *
 * Scheduled every 15 minutes. Finds pending contribution transactions that
 * went through Paystack (viaPaymentLink: true) and polls Paystack's
 * transaction verify API to sync status.
 * Acts as a safety net in case a charge.success/failed webhook was missed.
 */
export const verifyPendingPaystackCollectionsTask = {
  slug: 'verify-pending-paystack-collections',
  schedule: [
    {
      cron: '*/10 * * * *', // Every 15 minutes
      queue: 'verify-pending-transactions',
    },
  ],
  handler: async (args: any) => {
    try {
      const payload = args.req?.payload || args.payload

      const cutoffTime = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const maxPendingTime = new Date(Date.now() - 60 * 60 * 1000).toISOString()

      // Find pending Paystack contribution transactions older than 5 minutes
      const pendingTransactions = await payload.find({
        collection: 'transactions',
        where: {
          paymentStatus: { equals: 'pending' },
          type: { equals: 'contribution' },
          viaPaymentLink: { equals: true },
          transactionReference: { not_equals: '' },
          createdAt: { less_than: cutoffTime },
        },
        limit: 200,
        depth: 0,
        overrideAccess: true,
      })

      if (pendingTransactions.docs.length === 0) {
        return { output: { processed: 0, message: 'No pending Paystack collections to verify' } }
      }

      console.log(
        `[verify-pending-paystack-collections] Found ${pendingTransactions.docs.length} pending collections`,
      )

      const paystack = getPaystack()
      let processedCount = 0
      let failedCount = 0

      for (const transaction of pendingTransactions.docs) {
        const { id, transactionReference } = transaction as any

        if (!transactionReference) continue

        try {
          const verification = await paystack.verifyTransaction(transactionReference)

          const statusMap: Record<string, 'completed' | 'failed' | 'pending'> = {
            success: 'completed',
            failed: 'failed',
            abandoned: 'failed',
            pending: 'pending',
          }

          const newStatus = statusMap[verification.status] ?? 'pending'

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
                `[verify-pending-paystack-collections] Auto-failed transaction ${id} (pending > 1 hour)`,
              )
              failedCount++
              processedCount++
            }
            continue
          }

          await payload.update({
            collection: 'transactions',
            id,
            data: {
              paymentStatus: newStatus,
              webhookResponse: verification as any,
            },
            overrideAccess: true,
            context: { skipCharges: true },
          })

          console.log(
            `[verify-pending-paystack-collections] Transaction ${id} → ${newStatus} (ref: ${transactionReference})`,
          )

          if (newStatus === 'failed') failedCount++
          processedCount++
        } catch (error: any) {
          console.error(
            `[verify-pending-paystack-collections] Error verifying transaction ${id}:`,
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
                `[verify-pending-paystack-collections] Auto-failed transaction ${id} (pending > 1 hour, API error)`,
              )
              failedCount++
            } catch (e: any) {
              console.error(
                `[verify-pending-paystack-collections] Error auto-failing transaction ${id}:`,
                e.message,
              )
            }
          }
        }
      }

      console.log(
        `[verify-pending-paystack-collections] Processed: ${processedCount}, Failed: ${failedCount}`,
      )

      return {
        output: {
          total: pendingTransactions.docs.length,
          processed: processedCount,
          failed: failedCount,
          message: `Verified ${processedCount} collections, ${failedCount} marked as failed`,
        },
      }
    } catch (error: any) {
      console.error('[verify-pending-paystack-collections] Task error:', error)
      return { output: { processed: 0, message: `Error: ${error.message}` } }
    }
  },
}
