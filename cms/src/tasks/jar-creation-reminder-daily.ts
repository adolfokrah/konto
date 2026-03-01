import { FCMPushNotifications } from '@/utilities/fcmPushNotifications'

/**
 * Jar Creation Reminder Daily Task
 *
 * Scheduled to run once per day at 11 AM.
 * Finds KYC-verified users who haven't created any jars and sends them a reminder.
 */
export const jarCreationReminderDailyTask = {
  slug: 'jar-creation-reminder-daily',
  handler: async (args: any) => {
    try {
      const payload = args.req?.payload || args.payload
      const fcmNotifications = new FCMPushNotifications()

      console.log('🔍 Starting daily jar creation reminder check...')

      // Find all KYC-verified users with FCM tokens
      const verifiedUsers = await payload.find({
        collection: 'users',
        where: {
          and: [
            { isKYCVerified: { equals: true } },
            { role: { equals: 'user' } },
            { fcmToken: { exists: true } },
          ],
        },
        pagination: false,
        overrideAccess: true,
      })

      if (!verifiedUsers.docs.length) {
        return {
          output: {
            success: true,
            message: 'No KYC verified users with FCM tokens found',
            stats: {
              totalVerifiedUsers: 0,
              usersWithoutJars: 0,
              notificationsSent: 0,
              notificationsFailed: 0,
            },
          },
        }
      }

      console.log(
        `Found ${verifiedUsers.docs.length} verified users, checking for jar ownership...`,
      )

      // Filter users who haven't created any jars
      const usersWithoutJars = []

      for (const user of verifiedUsers.docs) {
        const userJars = await payload.find({
          collection: 'jars',
          where: {
            creator: { equals: user.id },
          },
          limit: 1,
          overrideAccess: true,
        })

        if (userJars.docs.length === 0) {
          usersWithoutJars.push(user)
        }
      }

      if (usersWithoutJars.length === 0) {
        return {
          output: {
            success: true,
            message: 'All verified users have created jars',
            stats: {
              totalVerifiedUsers: verifiedUsers.docs.length,
              usersWithoutJars: 0,
              notificationsSent: 0,
              notificationsFailed: 0,
            },
          },
        }
      }

      console.log(`Found ${usersWithoutJars.length} verified users without jars`)

      // Send notifications
      let successCount = 0
      let failureCount = 0

      for (const user of usersWithoutJars) {
        try {
          if (
            !user.fcmToken ||
            typeof user.fcmToken !== 'string' ||
            user.fcmToken.trim().length === 0
          ) {
            failureCount++
            continue
          }

          await fcmNotifications.sendNotification(
            [user.fcmToken],
            "You're all set up! Create your first jar to start collecting contributions for your events, projects, or causes.",
            'Create Your First Jar',
            {
              type: 'jar_creation_reminder',
              actionRequired: 'true',
            },
          )

          successCount++
          console.log(`✅ Sent jar creation reminder to user ${user.id}`)
        } catch (error: any) {
          console.error(`❌ Failed to send notification to user ${user.id}:`, error)
          failureCount++
        }
      }

      return {
        output: {
          success: true,
          message: `Jar creation reminder completed. Sent ${successCount} notifications.`,
          stats: {
            totalVerifiedUsers: verifiedUsers.docs.length,
            usersWithoutJars: usersWithoutJars.length,
            notificationsSent: successCount,
            notificationsFailed: failureCount,
          },
        },
      }
    } catch (error: any) {
      console.error('❌ Error in jar creation reminder task:', error)
      return {
        output: {
          success: false,
          message: `Error: ${error.message}`,
        },
      }
    }
  },
}
