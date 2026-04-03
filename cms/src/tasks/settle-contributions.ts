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
      cron: '0 * * * *', // Every hour
      queue: 'settle-contributions',
    },
  ],
  handler: async (args: any) => {
    try {
      const payload = args.req?.payload || args.payload

      // Build a per-country settlement delay map from contribution-settings collection
      const DEFAULT_DELAY_HOURS = 0.033
      const contributionSettingsResult = await payload.find({
        collection: 'settlement-delays' as any,
        limit: 100,
        overrideAccess: true,
      })
      const delayByCountry: Record<string, number> = {}
      for (const doc of contributionSettingsResult.docs as any[]) {
        if (doc.country && doc.hours != null) {
          delayByCountry[doc.country.toLowerCase()] = doc.hours
        }
      }

      // Use the minimum delay as the DB query cutoff to cast the widest net,
      // then filter per contribution in memory
      const allDelays = Object.values(delayByCountry)
      const minDelayHours = allDelays.length > 0 ? Math.min(...allDelays) : DEFAULT_DELAY_HOURS
      const cutoffTime = new Date(Date.now() - minDelayHours * 60 * 60 * 1000).toISOString()

      console.log(
        `Settlement delays by country: ${JSON.stringify(delayByCountry)}, cutoff: ${cutoffTime}`,
      )

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

      // Exclude contributions that have a pending or in-progress refund
      const contributionIds = unsettledContributions.docs.map((c: any) => c.id)
      const pendingRefunds = await payload.find({
        collection: 'refunds' as any,
        where: {
          status: { in: ['pending', 'in-progress'] },
          linkedTransaction: { in: contributionIds },
        },
        limit: 500,
        depth: 0,
        overrideAccess: true,
        select: { linkedTransaction: true },
      })

      const refundingIds = new Set(
        pendingRefunds.docs.map((r: any) =>
          typeof r.linkedTransaction === 'object' ? r.linkedTransaction?.id : r.linkedTransaction,
        ),
      )

      const now = Date.now()
      const eligibleContributions = unsettledContributions.docs.filter((c: any) => {
        if (refundingIds.has(c.id)) return false

        // Determine settlement delay for this contribution's jar creator country
        const country =
          typeof c.jar?.creator === 'object' ? c.jar.creator?.country?.toLowerCase() : undefined
        const delayHours =
          country && delayByCountry[country] != null ? delayByCountry[country] : DEFAULT_DELAY_HOURS
        const delayMs = delayHours * 60 * 60 * 1000
        const createdAt = new Date(c.createdAt).getTime()
        return now - createdAt >= delayMs
      })

      if (eligibleContributions.length === 0) {
        return {
          output: {
            settled: 0,
            message: `No contributions to settle (${refundingIds.size} skipped due to pending refunds)`,
          },
        }
      }

      // Group contributions by jar for notifications
      const contributionsByJar = new Map<string, any[]>()

      for (const contribution of eligibleContributions) {
        const jarId = typeof contribution.jar === 'object' ? contribution.jar?.id : contribution.jar
        if (jarId) {
          if (!contributionsByJar.has(jarId)) {
            contributionsByJar.set(jarId, [])
          }
          contributionsByJar.get(jarId)!.push(contribution)
        }
      }

      // Update each contribution to settled
      let settledCount = 0
      for (const contribution of eligibleContributions) {
        await payload.update({
          collection: 'transactions',
          id: contribution.id,
          data: { isSettled: true },
          overrideAccess: true,
          context: { skipCharges: true },
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
