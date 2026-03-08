import { getEganow } from '@/utilities/initalise'

/**
 * Verify Pending Top-Ups Task
 *
 * Runs every 5 minutes.
 * Checks pending ledger top-ups older than 5 minutes against the Eganow API
 * and updates their status. Auto-fails top-ups older than 1 hour.
 */
export const verifyPendingTopupsTask = {
  slug: 'verify-pending-topups',
  schedule: [
    {
      cron: '*/7 * * * *',
      queue: 'verify-pending-topups',
    },
  ],
  handler: async (args: any) => {
    try {
      const payload = args.req?.payload || args.payload

      const cutoffTime = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const maxPendingTime = new Date(Date.now() - 60 * 60 * 1000).toISOString()

      const pendingTopups = await payload.find({
        collection: 'ledger-topups',
        where: {
          status: { equals: 'pending' },
          createdAt: { less_than: cutoffTime },
        },
        limit: 100,
        overrideAccess: true,
      })

      if (pendingTopups.docs.length === 0) {
        return {
          output: { processed: 0, message: 'No pending top-ups to verify' },
        }
      }

      console.log(`[verify-pending-topups] Found ${pendingTopups.docs.length} pending top-ups`)

      let processedCount = 0
      let failedCount = 0

      for (const topup of pendingTopups.docs) {
        const { id } = topup as any
        const eganowTransactionId = `topup-${id}`

        try {
          await getEganow().getToken()

          const statusResult = await getEganow().checkTransactionStatus({
            transactionId: eganowTransactionId,
            languageId: 'en',
          })

          console.log(
            `[verify-pending-topups] Eganow response for ${id}:`,
            JSON.stringify(statusResult),
          )

          if (!statusResult.isSuccess) {
            await payload.update({
              collection: 'ledger-topups',
              id,
              data: { status: 'failed' },
              overrideAccess: true,
            })
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
            collection: 'ledger-topups',
            id,
            data: { status: newStatus },
            overrideAccess: true,
          })

          if (newStatus === 'failed') failedCount++
          processedCount++
        } catch (error: any) {
          console.error(`[verify-pending-topups] Error verifying top-up ${id}:`, error.message)

          // Auto-fail top-ups older than 1 hour
          const createdAt = (topup as any).createdAt
          if (createdAt && createdAt < maxPendingTime) {
            try {
              await payload.update({
                collection: 'ledger-topups',
                id,
                data: { status: 'failed' },
                overrideAccess: true,
              })
              console.log(`[verify-pending-topups] Auto-failed top-up ${id} (pending > 1 hour)`)
              failedCount++
            } catch (e: any) {
              console.error(`[verify-pending-topups] Error auto-failing ${id}:`, e.message)
            }
          }
        }
      }

      return {
        output: {
          total: pendingTopups.docs.length,
          processed: processedCount,
          failed: failedCount,
          message: `Verified ${processedCount} top-ups, ${failedCount} marked as failed`,
        },
      }
    } catch (error: any) {
      console.error('[verify-pending-topups] Task error:', error)
      return {
        output: { processed: 0, message: `Error: ${error.message}` },
      }
    }
  },
}
