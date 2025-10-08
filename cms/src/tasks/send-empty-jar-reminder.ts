import { Payload } from 'payload'
import { fcmNotifications } from '@/utilities/fcmPushNotifications'

// Simple in-memory cache to prevent duplicate notifications within a short time window
const recentlyProcessedUsers = new Map<string, number>()
const DUPLICATE_PREVENTION_WINDOW = 5 * 60 * 1000 // 5 minutes

interface TaskInput {
  userId: string
  userFcmToken: string
  userName?: string
}

interface TaskOutput {
  success: boolean
  message: string
  userId: string
  results: {
    userProcessed: boolean
    jarsChecked: number
    emptyJarsFound: number
    notificationSent: boolean
    notificationError?: string
  }
}

export const sendEmptyJarReminderTask = {
  slug: 'send-empty-jar-reminder',
  handler: async (args: any) => {
    // Try different ways to access payload and input
    console.log('🔍 Args received:', Object.keys(args))

    const payload = args.payload || args.req?.payload
    const input = args.input || args.job?.input || args
    const { userId, userFcmToken, userName } = input as TaskInput

    if (!payload) {
      console.error('❌ Payload is undefined. Available args:', Object.keys(args))
      return {
        success: false,
        message: 'Payload instance not available',
        userId: userId || 'unknown',
        results: {
          userProcessed: false,
          jarsChecked: 0,
          emptyJarsFound: 0,
          notificationSent: false,
          notificationError: 'Payload instance not available',
        },
      }
    }

    try {
      // Find all jars created by this specific user
      const userJars = await payload.find({
        collection: 'jars',
        where: {
          creator: {
            equals: userId,
          },
          status: {
            equals: 'open', // Only consider active jars
          },
        },
        pagination: false,
      })

      if (userJars.docs.length === 0) {
        return {
          success: true,
          message: 'User has no jars',
          userId,
          results: {
            userProcessed: true,
            jarsChecked: 0,
            emptyJarsFound: 0,
            notificationSent: false,
          },
        }
      }

      // Check each jar for contributions
      const emptyJars: any[] = []

      for (const jar of userJars.docs) {
        try {
          // Find contributions for this jar
          const contributions = await payload.find({
            collection: 'contributions',
            where: {
              jar: {
                equals: jar.id,
              },
              status: {
                notEqualls: 'failed',
              },
            },
            limit: 1, // We only need to know if any exist
          })

          if (contributions.docs.length === 0) {
            emptyJars.push(jar)
          }
        } catch (error) {
          console.error(`❌ Error checking contributions for jar ${jar.id}:`, error)
          // Continue with other jars even if one fails
        }
      }

      if (emptyJars.length === 0) {
        console.log(`✅ User ${userId} has no empty jars, no notification needed`)
        return {
          success: true,
          message: 'User has no empty jars',
          userId,
          results: {
            userProcessed: true,
            jarsChecked: userJars.docs.length,
            emptyJarsFound: 0,
            notificationSent: false,
          },
        }
      }

      console.log(`📭 User ${userId} has ${emptyJars.length} empty jars, sending notification...`)

      // Send push notification to this user
      try {
        const jarCount = emptyJars.length
        const jarWord = jarCount === 1 ? 'jar' : 'jars'

        const data = await fcmNotifications.sendNotification(
          [userFcmToken], // tokens array
          `You have ${jarCount} empty ${jarWord} waiting for contributions. Start receiving today!`, // message
          `Don't forget about your ${jarWord}! 🏺`, // title
          {
            type: 'empty_jar_reminder',
            userId: userId,
            jarCount: jarCount.toString(),
            action: 'view_jars',
          }, // data
        )

        console.log('FCM response data:', data)

        console.log(
          `✅ Successfully sent empty jar reminder to user ${userId} (${jarCount} empty ${jarWord})`,
        )

        return {
          success: true,
          message: `Empty jar reminder sent successfully`,
          userId,
          results: {
            userProcessed: true,
            jarsChecked: userJars.docs.length,
            emptyJarsFound: emptyJars.length,
            notificationSent: true,
          },
        }
      } catch (notificationError: any) {
        console.error(`❌ Failed to send push notification to user ${userId}:`, notificationError)

        return {
          success: false,
          message: `Failed to send notification`,
          userId,
          results: {
            userProcessed: true,
            jarsChecked: userJars.docs.length,
            emptyJarsFound: emptyJars.length,
            notificationSent: false,
            notificationError: notificationError.message,
          },
        }
      }
    } catch (error: any) {
      console.error(`❌ Error processing empty jar reminder for user ${userId}:`, error)
      return {
        success: false,
        message: `Failed to process user: ${error.message}`,
        userId,
        results: {
          userProcessed: false,
          jarsChecked: 0,
          emptyJarsFound: 0,
          notificationSent: false,
          notificationError: error.message,
        },
      }
    }
  },
}
