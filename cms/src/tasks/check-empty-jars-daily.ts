import { FCMPushNotifications } from '@/utilities/fcmPushNotifications'

/**
 * Check Inactive Jars Daily Task
 *
 * Scheduled to run once per day at 9 AM.
 * For each open jar with no completed contribution in the last 3 days, sends
 * a notification to the jar creator mentioning the specific jar name.
 * Differentiates between jars that have never received a contribution and
 * jars that had activity but have gone quiet.
 */
export const checkEmptyJarsDailyTask = {
  slug: 'check-empty-jars-daily',
  schedule: [
    {
      cron: '0 9 * * *', // Every day at 9:00 AM
      queue: 'check-empty-jars-daily',
    },
  ],
  handler: async (args: any) => {
    try {
      const payload = args.req?.payload || args.payload
      const fcmNotifications = new FCMPushNotifications()

      console.log('🔍 Starting daily inactive jar check...')

      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

      // Fetch only open jars idle for 3+ days using lastActivityAt index.
      // Jars with no lastActivityAt (never had a contribution) are also included.
      const inactiveJarsResult = await payload.find({
        collection: 'jars',
        where: {
          and: [
            { status: { equals: 'open' } },
            { lastActivityAt: { exists: true } },
            { lastActivityAt: { less_than: threeDaysAgo } },
          ],
        },
        pagination: false,
        depth: 1,
        overrideAccess: true,
      })

      const inactiveJars = inactiveJarsResult.docs

      console.log(`Found ${inactiveJars.length} jars inactive for 3+ days`)

      if (inactiveJars.length === 0) {
        return {
          output: {
            success: true,
            message: 'All open jars have recent activity',
            stats: { totalInactiveJars: 0, notificationsSent: 0, notificationsFailed: 0 },
          },
        }
      }

      let successCount = 0
      let failureCount = 0

      for (const jar of inactiveJars) {
        try {
          const creator = typeof jar.creator === 'string' ? null : jar.creator
          if (!creator?.fcmToken) {
            failureCount++
            continue
          }

          const jarName = jar.name ?? jar.title ?? 'Your jar'
          const daysSinceActivity = jar.lastActivityAt
            ? Math.floor(
                (Date.now() - new Date(jar.lastActivityAt).getTime()) / (24 * 60 * 60 * 1000),
              )
            : null

          const { title, message } =
            daysSinceActivity !== null
              ? {
                  title: `${jarName} has gone quiet 🫙`,
                  message: `"${jarName}" hasn't received any new contributions in the last ${daysSinceActivity} day${daysSinceActivity === 1 ? '' : 's'}. Share your link to keep the momentum going!`,
                }
              : {
                  title: `${jarName} is still empty 🫙`,
                  message: `"${jarName}" hasn't received any contributions yet. Share your link to get started!`,
                }

          await fcmNotifications.sendNotification([creator.fcmToken], message, title, {
            type: 'inactive-jar-reminder',
            jarId: jar.id,
          })

          successCount++
          console.log(`✅ Notified creator ${creator.id} about jar "${jarName}"`)
        } catch (error: any) {
          console.error(`❌ Failed to notify for jar ${jar.id}:`, error)
          failureCount++
        }
      }

      return {
        output: {
          success: true,
          message: `Inactive jar check completed. Sent ${successCount} notifications.`,
          stats: {
            totalInactiveJars: inactiveJars.length,
            notificationsSent: successCount,
            notificationsFailed: failureCount,
          },
        },
      }
    } catch (error: any) {
      console.error('❌ Error in inactive jar check:', error)
      return {
        output: { success: false, message: `Error: ${error.message}` },
      }
    }
  },
}
