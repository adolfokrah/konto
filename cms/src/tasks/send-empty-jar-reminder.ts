import { Payload, getPayload } from 'payload'
import { fcmNotifications } from '@/utilities/fcmPushNotifications'

// Simple in-memory cache to prevent duplicate notifications within a short time window
const recentlyProcessedUsers = new Map<string, number>()
const DUPLICATE_PREVENTION_WINDOW = 5 * 60 * 1000 // 5 minutes

interface TaskInput {
  userId: string
  emptyJarCounts: number
  message?: string
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
    const input = args.input || args.job?.input || args
    const { userId, emptyJarCounts, message } = input as TaskInput

    try {
      // Get payload instance using getPayload - we'll pass the args payload
      const payload = args.payload || args.req?.payload

      // Find the user
      const user = await payload.findByID({
        collection: 'users',
        id: userId,
        overrideAccess: true,
      })

      if (!user) {
        return {
          success: false,
          message: 'User not found',
          userId,
          results: {
            userProcessed: false,
            jarsChecked: 0,
            emptyJarsFound: emptyJarCounts,
            notificationSent: false,
          },
        }
      }

      // Check if user has FCM token for notifications
      if (!user.fcmToken) {
        return {
          success: false,
          message: 'User has no FCM token',
          userId,
          results: {
            userProcessed: true,
            jarsChecked: 0,
            emptyJarsFound: emptyJarCounts,
            notificationSent: false,
            notificationError: 'No FCM token',
          },
        }
      }

      // Send notification
      const notificationResult = await fcmNotifications.sendNotification(
        [user.fcmToken],
        message ||
          `You have ${emptyJarCounts} jar${emptyJarCounts > 1 ? 's' : ''} with no contributions yet!`,
        "Don't forget your empty jars! 🫙",
      )

      return {
        success: true,
        message: 'Empty jar reminder sent successfully',
        userId,
        results: {
          userProcessed: true,
          jarsChecked: 0,
          emptyJarsFound: emptyJarCounts,
          notificationSent: true,
        },
      }
    } catch (error: any) {
      console.error('Error in empty jar reminder task:', error)
      return {
        success: false,
        message: 'Failed to send empty jar reminder',
        userId,
        results: {
          userProcessed: false,
          jarsChecked: 0,
          emptyJarsFound: emptyJarCounts || 0,
          notificationSent: false,
          notificationError: error.message,
        },
      }
    }
  },
}
