import { getEganow } from '@/utilities/initalise'

/**
 * Verify Pending Refunds Task
 *
 * Runs every 5 minutes. Checks in-progress refunds older than 5 minutes
 * against Eganow API and updates their status. Auto-fails refunds
 * stuck in-progress for more than 1 hour.
 */
export const verifyPendingRefundsTask = {
  slug: 'verify-pending-refunds',
  schedule: [
    {
      cron: '*/25 * * * *', // Every 25 minutes
      queue: 'verify-pending-refunds',
    },
  ],
  handler: async (args: any) => {
    try {
      const payload = args.req?.payload || args.payload

      const cutoffTime = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const maxPendingTime = new Date(Date.now() - 60 * 60 * 1000).toISOString()

      const pendingRefunds = await payload.find({
        collection: 'refunds' as any,
        where: {
          status: { equals: 'in-progress' },
          createdAt: { less_than: cutoffTime },
        },
        limit: 100,
        depth: 0,
        overrideAccess: true,
      })

      if (pendingRefunds.docs.length === 0) {
        return {
          output: { processed: 0, message: 'No in-progress refunds to verify' },
        }
      }

      console.log(
        `[verify-pending-refunds] Found ${pendingRefunds.docs.length} in-progress refunds older than 5 minutes`,
      )

      let processedCount = 0
      let completedCount = 0
      let failedCount = 0

      for (const refund of pendingRefunds.docs as any[]) {
        const { id, transactionReference } = refund

        // No transaction reference means Eganow was never called — auto-fail
        if (!transactionReference) {
          try {
            await payload.update({
              collection: 'refunds' as any,
              id,
              data: { status: 'failed' },
              overrideAccess: true,
            })
            console.log(
              `[verify-pending-refunds] Auto-failed refund ${id}: no transaction reference`,
            )
            failedCount++
          } catch (e: any) {
            console.error(`[verify-pending-refunds] Error failing refund ${id}:`, e.message)
          }
          continue
        }

        try {
          await getEganow().getToken()

          const statusResult = await getEganow().checkTransactionStatus({
            transactionId: `refund-${id}`,
            languageId: 'en',
          })

          console.log(
            `[verify-pending-refunds] Eganow response for refund ${id}:`,
            JSON.stringify(statusResult),
          )

          if (!statusResult.isSuccess) {
            // If older than 1 hour and Eganow doesn't recognize it, fail it
            if (refund.createdAt < maxPendingTime) {
              await payload.update({
                collection: 'refunds' as any,
                id,
                data: { status: 'failed' },
                overrideAccess: true,
              })
              console.log(
                `[verify-pending-refunds] Auto-failed refund ${id} (> 1 hour, not found in Eganow)`,
              )
              failedCount++
            }
            processedCount++
            continue
          }

          const rawStatus = (
            statusResult.transStatus ||
            (statusResult as any).transactionstatus ||
            ''
          ).toUpperCase()

          const statusMap: Record<string, string> = {
            SUCCESSFUL: 'completed',
            SUCCESS: 'completed',
            FAILED: 'failed',
            PENDING: 'in-progress',
          }

          const newStatus = statusMap[rawStatus] || 'in-progress'

          if (newStatus !== 'in-progress') {
            // Update refund status (syncLinkedTransaction hook handles marking original tx as failed)
            await payload.update({
              collection: 'refunds' as any,
              id,
              data: { status: newStatus },
              overrideAccess: true,
            })

            if (newStatus === 'completed') completedCount++
            if (newStatus === 'failed') failedCount++
            console.log(`[verify-pending-refunds] Updated refund ${id} → ${newStatus}`)
          }

          processedCount++
        } catch (error: any) {
          console.error(`[verify-pending-refunds] Error verifying refund ${id}:`, error.message)

          // Auto-fail if stuck longer than 1 hour
          if (refund.createdAt < maxPendingTime) {
            try {
              await payload.update({
                collection: 'refunds' as any,
                id,
                data: { status: 'failed' },
                overrideAccess: true,
              })
              console.log(
                `[verify-pending-refunds] Auto-failed refund ${id} (> 1 hour, Eganow error)`,
              )
              failedCount++
            } catch (e: any) {
              console.error(`[verify-pending-refunds] Error auto-failing refund ${id}:`, e.message)
            }
          }
        }
      }

      console.log(
        `[verify-pending-refunds] Processed: ${processedCount}, Completed: ${completedCount}, Failed: ${failedCount}`,
      )

      return {
        output: {
          total: pendingRefunds.docs.length,
          processed: processedCount,
          completed: completedCount,
          failed: failedCount,
          message: `Verified ${processedCount} refunds, ${completedCount} completed, ${failedCount} failed`,
        },
      }
    } catch (error: any) {
      console.error('[verify-pending-refunds] Task error:', error)
      return {
        output: { processed: 0, message: `Error: ${error.message}` },
      }
    }
  },
}
