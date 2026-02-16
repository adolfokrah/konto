import { FCMPushNotifications } from '@/utilities/fcmPushNotifications'

/**
 * Settle Contributions Task
 *
 * Scheduled every 5 minutes via Payload's autoRun.
 * Marks mobile money contributions as settled if they are:
 * - type: 'contribution'
 * - paymentMethod: 'mobile-money'
 * - paymentStatus: 'completed'
 * - isSettled: false
 * - createdAt is older than the configured settlement delay
 */
export const settleContributionsTask = {
  slug: 'settle-contributions',
  schedule: [
    {
      cron: '*/5 * * * *', // Every 5 minutes
      queue: 'settle-contributions',
    },
  ],
  handler: async (args: any) => {
    try {
      const payload = args.req?.payload || args.payload

      // Fetch system settings to get settlement delay
      const systemSettings = await payload.findGlobal({
        slug: 'system-settings',
        overrideAccess: true,
      })

      // Get settlement delay in hours (default to ~2 minutes if not set)
      const settlementDelayHours = systemSettings?.settlementDelayHours || 0.033

      // Convert hours to milliseconds
      const settlementDelayMs = settlementDelayHours * 60 * 60 * 1000

      // Calculate the cutoff time
      const cutoffTime = new Date(Date.now() - settlementDelayMs).toISOString()

      console.log(`Settlement delay: ${settlementDelayHours} hours (${settlementDelayMs}ms)`)

      // Find all unsettled completed mobile money contributions older than cutoff time
      const unsettledContributions = await payload.find({
        collection: 'transactions',
        where: {
          type: { equals: 'contribution' },
          paymentMethod: { equals: 'mobile-money' },
          paymentStatus: { equals: 'completed' },
          isSettled: { equals: false },
          createdAt: { less_than: cutoffTime },
        },
        limit: 500,
        depth: 2,
        overrideAccess: true,
      })

      if (unsettledContributions.docs.length === 0) {
        return {
          output: {
            settled: 0,
            message: 'No contributions to settle',
          },
        }
      }

      // Group contributions by jar for notifications
      const contributionsByJar = new Map<string, any[]>()

      for (const contribution of unsettledContributions.docs) {
        if (typeof contribution.jar === 'object' && contribution.jar) {
          const jarId = contribution.jar.id
          if (!contributionsByJar.has(jarId)) {
            contributionsByJar.set(jarId, [])
          }
          contributionsByJar.get(jarId)!.push(contribution)
        }
      }

      // Update each contribution to settled
      let settledCount = 0
      for (const contribution of unsettledContributions.docs) {
        await payload.update({
          collection: 'transactions',
          id: contribution.id,
          data: { isSettled: true },
          overrideAccess: true,
        })
        settledCount++
      }

      console.log(`Settled ${settledCount} contributions`)

      // Send notifications to jar creators
      const fcmNotifications = new FCMPushNotifications()

      for (const [jarId, contributions] of contributionsByJar.entries()) {
        const jar = contributions[0].jar
        const creatorToken = typeof jar.creator === 'object' ? jar.creator?.fcmToken : null

        if (creatorToken) {
          const totalAmount = contributions.reduce((sum, c) => sum + (c.amountContributed || 0), 0)
          const contributionsCount = contributions.length

          const message =
            contributionsCount === 1
              ? `${jar.currency} ${totalAmount.toFixed(2)} contribution for "${jar.name}" has been settled`
              : `${contributionsCount} contributions totaling ${jar.currency} ${totalAmount.toFixed(2)} for "${jar.name}" have been settled`

          const title = 'Contributions Settled 💰'

          await fcmNotifications.sendNotification([creatorToken], message, title, {
            type: 'settlement',
            jarId: jar.id,
          })
        }
      }

      return {
        output: {
          settled: settledCount,
          message: `Settled ${settledCount} contributions`,
        },
      }
    } catch (error: any) {
      console.error('Error in settle-contributions task:', error)
      return {
        output: {
          settled: 0,
          message: `Error: ${error.message}`,
        },
      }
    }
  },
}
