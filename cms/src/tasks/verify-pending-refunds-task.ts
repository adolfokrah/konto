import { getPaystack } from '@/utilities/initalise'

/**
 * Verify Pending Refunds Task
 *
 * Runs every 25 minutes. Checks in-progress refunds older than 5 minutes
 * against Paystack transfer API and updates their status. Acts as a safety
 * net in case a transfer.success/failed webhook was missed.
 */
export const verifyPendingRefundsTask = {
  slug: 'verify-pending-refunds',
  schedule: [
    {
      cron: '*/25 * * * *',
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
          transactionReference: { not_equals: '' },
          createdAt: { less_than: cutoffTime },
        },
        limit: 100,
        depth: 0,
        overrideAccess: true,
      })

      if (pendingRefunds.docs.length === 0) {
        return { output: { processed: 0, message: 'No in-progress refunds to verify' } }
      }

      console.log(
        `[verify-pending-refunds] Found ${pendingRefunds.docs.length} in-progress refunds`,
      )

      const paystack = getPaystack()
      let processedCount = 0
      let completedCount = 0
      let failedCount = 0

      for (const refund of pendingRefunds.docs as any[]) {
        const { id, transactionReference } = refund

        if (!transactionReference) {
          // No transfer_code yet — process-refund job hasn't run, skip
          continue
        }

        try {
          const result = await paystack.verifyTransfer(transactionReference)

          const statusMap: Record<string, string> = {
            success: 'completed',
            failed: 'failed',
            reversed: 'failed',
            pending: 'in-progress',
          }

          const newStatus = statusMap[result.status] ?? 'in-progress'

          if (newStatus === 'in-progress') {
            // Auto-fail if stuck more than 1 hour
            if (refund.createdAt < maxPendingTime) {
              await payload.update({
                collection: 'refunds' as any,
                id,
                data: { status: 'failed' },
                overrideAccess: true,
              })
              console.log(`[verify-pending-refunds] Auto-failed refund ${id} (pending > 1 hour)`)
              failedCount++
              processedCount++
            }
            continue
          }

          await payload.update({
            collection: 'refunds' as any,
            id,
            data: { status: newStatus },
            overrideAccess: true,
          })

          console.log(`[verify-pending-refunds] Refund ${id} → ${newStatus}`)

          if (newStatus === 'completed') completedCount++
          if (newStatus === 'failed') failedCount++
          processedCount++
        } catch (error: any) {
          console.error(`[verify-pending-refunds] Error verifying refund ${id}:`, error.message)

          if (refund.createdAt < maxPendingTime) {
            try {
              await payload.update({
                collection: 'refunds' as any,
                id,
                data: { status: 'failed' },
                overrideAccess: true,
              })
              console.log(`[verify-pending-refunds] Auto-failed refund ${id} (> 1 hour, API error)`)
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
      return { output: { processed: 0, message: `Error: ${error.message}` } }
    }
  },
}
