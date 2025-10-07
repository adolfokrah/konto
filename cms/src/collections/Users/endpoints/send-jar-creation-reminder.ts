import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'
import { fcmNotifications } from '@/utilities/fcmPushNotifications'

export const sendJarCreationReminder = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)

    // Find all users who are KYC verified but haven't created any jars
    const verifiedUsers = await req.payload.find({
      collection: 'users',
      where: {
        and: [
          {
            isKYCVerified: {
              equals: true,
            },
          },
          {
            role: {
              equals: 'user', // Only send to regular users, not admins
            },
          },
          {
            fcmToken: {
              exists: true,
            },
          },
        ],
      },
      pagination: false, // Adjust limit as needed
    })

    if (!verifiedUsers.docs.length) {
      return Response.json(
        {
          success: true,
          message: 'No KYC verified users with FCM tokens found',
          count: 0,
        },
        { status: 200 },
      )
    }

    // Filter users who haven't created any jars
    const usersWithoutJars = []

    for (const user of verifiedUsers.docs) {
      // Check if user has created any jars
      const userJars = await req.payload.find({
        collection: 'jars',
        where: {
          creator: {
            equals: user.id,
          },
        },
        limit: 1,
      })

      // If user has no jars, add them to the reminder list
      if (userJars.docs.length === 0) {
        usersWithoutJars.push(user)
      }
    }

    if (usersWithoutJars.length === 0) {
      return Response.json(
        {
          success: true,
          message: 'No KYC verified users without jars found',
          count: 0,
        },
        { status: 200 },
      )
    }

    // Extract FCM tokens from users without jars
    const fcmTokens = usersWithoutJars
      .map((user) => user.fcmToken)
      .filter((token): token is string => {
        return (
          token !== null &&
          token !== undefined &&
          typeof token === 'string' &&
          token.trim().length > 0
        )
      })

    if (fcmTokens.length === 0) {
      return Response.json(
        {
          success: true,
          message: 'No valid FCM tokens found for verified users without jars',
          count: 0,
        },
        { status: 200 },
      )
    }

    // Send push notifications to all verified users without jars
    const pushResult = await fcmNotifications.sendNotification(
      fcmTokens,
      "You're all set up! Create your first jar to start collecting contributions for your events, projects, or causes.",
      'Create Your First Jar',
      {
        type: 'jar_creation_reminder',
        actionRequired: 'true',
      },
    )

    return Response.json(
      {
        success: true,
        message: `Jar creation reminders sent to ${usersWithoutJars.length} verified users without jars`,
        results: {
          totalVerifiedUsers: verifiedUsers.docs.length,
          usersWithoutJars: usersWithoutJars.length,
          validFcmTokens: fcmTokens.length,
          pushNotificationSuccess: pushResult.successCount,
          pushNotificationFailure: pushResult.failureCount,
        },
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error('Error sending jar creation reminders:', error)
    return Response.json(
      {
        success: false,
        message: 'Failed to send jar creation reminders',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
