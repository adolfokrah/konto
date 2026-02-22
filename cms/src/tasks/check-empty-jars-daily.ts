import { FCMPushNotifications } from '@/utilities/fcmPushNotifications'

/**
 * Check Empty Jars Daily Task
 *
 * Scheduled to run once per day at 9 AM.
 * Finds all users with empty jars and sends them reminder notifications directly.
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

      console.log('🔍 Starting daily empty jar check...')

      // Find all open jars
      const openJars = await payload.find({
        collection: 'jars',
        where: {
          status: {
            equals: 'open',
          },
        },
        pagination: false,
        depth: 1,
        overrideAccess: true,
      })

      // Find which of these jars have completed contributions
      const openJarIds = openJars.docs.map((jar: any) => jar.id)
      const jarsWithContributions = new Set<string>()

      if (openJarIds.length > 0) {
        const contributions = await payload.find({
          collection: 'transactions',
          where: {
            jar: { in: openJarIds },
            paymentStatus: { equals: 'completed' },
            type: { equals: 'contribution' },
          },
          pagination: false,
          select: { jar: true },
          overrideAccess: true,
        })

        for (const tx of contributions.docs as any[]) {
          const jarId = typeof tx.jar === 'string' ? tx.jar : tx.jar?.id
          if (jarId) jarsWithContributions.add(jarId)
        }
      }

      // Filter to jars with no contributions
      const emptyJars = {
        docs: openJars.docs.filter((jar: any) => !jarsWithContributions.has(jar.id)),
      }

      console.log(`Found ${emptyJars.docs.length} empty jars`)

      if (emptyJars.docs.length === 0) {
        return {
          output: {
            success: true,
            message: 'No empty jars found',
            stats: {
              totalEmptyJars: 0,
              usersNotified: 0,
              notificationsSent: 0,
              notificationsFailed: 0,
            },
          },
        }
      }

      // Group jars by user and get user details
      const userEmptyJarCounts = emptyJars.docs.reduce((acc: any, jar: any) => {
        const userId = typeof jar.creator === 'string' ? jar.creator : jar.creator?.id
        const creator = typeof jar.creator === 'string' ? null : jar.creator

        if (userId && creator) {
          if (!acc[userId]) {
            acc[userId] = {
              userId,
              user: creator,
              emptyJarCounts: 0,
            }
          }
          acc[userId].emptyJarCounts++
        }
        return acc
      }, {})

      const usersWithEmptyJars = Object.values(userEmptyJarCounts) as Array<{
        userId: string
        user: any
        emptyJarCounts: number
      }>

      console.log(`Found ${usersWithEmptyJars.length} users with empty jars`)

      // Send notifications directly to each user
      let successCount = 0
      let failureCount = 0

      for (const userWithEmptyJars of usersWithEmptyJars) {
        try {
          const { user, emptyJarCounts } = userWithEmptyJars

          // Check if user has FCM token
          if (!user.fcmToken) {
            console.log(`⚠️ User ${user.id} has no FCM token, skipping`)
            failureCount++
            continue
          }

          // Create message
          const message = `You have ${emptyJarCounts} jar${emptyJarCounts > 1 ? 's' : ''} with no contributions yet!`
          const title = "Don't forget your empty jars! 🫙"

          // Send notification
          await fcmNotifications.sendNotification([user.fcmToken], message, title, {
            type: 'empty-jar-reminder',
            emptyJarCounts: emptyJarCounts.toString(),
          })

          successCount++
          console.log(`✅ Sent empty jar reminder to user ${user.id} for ${emptyJarCounts} jar(s)`)
        } catch (error: any) {
          console.error(
            `❌ Failed to send notification to user ${userWithEmptyJars.userId}:`,
            error,
          )
          failureCount++
        }
      }

      return {
        output: {
          success: true,
          message: `Daily empty jar check completed. Sent ${successCount} notifications.`,
          stats: {
            totalEmptyJars: emptyJars.docs.length,
            usersNotified: successCount,
            notificationsSent: successCount,
            notificationsFailed: failureCount,
          },
        },
      }
    } catch (error: any) {
      console.error('❌ Error in daily empty jar check:', error)
      return {
        output: {
          success: false,
          message: `Error: ${error.message}`,
        },
      }
    }
  },
}
