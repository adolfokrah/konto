import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'
import { fcmNotifications } from '@/utilities/fcmPushNotifications'

export const sendKYCReminder = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)

    // Find all users who haven't completed KYC verification and have FCM tokens
    const unverifiedUsers = await req.payload.find({
      collection: 'users',
      where: {
        and: [
          {
            isKYCVerified: {
              equals: false,
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

    if (!unverifiedUsers.docs.length) {
      return Response.json(
        {
          success: true,
          message: 'No unverified users with FCM tokens found',
          count: 0,
        },
        { status: 200 },
      )
    }

    // Extract FCM tokens from users
    const fcmTokens = unverifiedUsers.docs
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
          message: 'No valid FCM tokens found for unverified users',
          count: 0,
        },
        { status: 200 },
      )
    }

    // Send push notifications to all unverified users
    const pushResult = await fcmNotifications.sendNotification(
      fcmTokens,
      'Please complete your KYC verification to access all features of your Hoga account. This is required to create jars and contribute securely.',
      'Complete KYC Verification',
      {
        type: 'kyc_reminder',
        actionRequired: 'true',
      },
    )

    return Response.json(
      {
        success: true,
        message: `KYC reminders sent to ${unverifiedUsers.docs.length} unverified users`,
        results: {
          totalUsers: unverifiedUsers.docs.length,
          validFcmTokens: fcmTokens.length,
          pushNotificationSuccess: pushResult.successCount,
          pushNotificationFailure: pushResult.failureCount,
        },
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error('Error sending KYC reminders:', error)
    return Response.json(
      {
        success: false,
        message: 'Failed to send KYC reminders',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
