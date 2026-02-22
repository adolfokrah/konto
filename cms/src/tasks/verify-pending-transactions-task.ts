import { eganow } from '@/utilities/initalise'

/**
 * Verify Pending Transactions Task
 *
 * Scheduled every hour via Payload's autoRun.
 * Checks pending mobile-money transactions older than 30 minutes
 * against the Eganow API and updates their status accordingly.
 */
export const verifyPendingTransactionsTask = {
  slug: 'verify-pending-transactions',
  schedule: [
    {
      cron: '0 * * * *', // Every hour
      queue: 'verify-pending-transactions',
    },
  ],
  handler: async (args: any) => {
    try {
      const payload = args.req?.payload || args.payload

      // 30 minutes ago
      const cutoffTime = new Date(Date.now() - 30 * 60 * 1000).toISOString()

      // Find pending mobile-money transactions older than 30 minutes
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
        `[verify-pending-transactions] Found ${pendingTransactions.docs.length} pending transactions older than 30 minutes`,
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
          await eganow.getToken()

          const statusResult = await eganow.checkTransactionStatus({
            transactionId: id,
            languageId: 'en',
          })

          const statusMap: Record<string, 'completed' | 'failed' | 'pending'> = {
            SUCCESSFUL: 'completed',
            SUCCESS: 'completed',
            FAILED: 'failed',
            PENDING: 'pending',
          }

          const newStatus = statusMap[statusResult.transStatus?.toUpperCase()] || 'failed'

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
