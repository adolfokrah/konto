import { addDataAndFileToRequest, PayloadRequest } from 'payload'
import { fcmNotifications } from '@/utilities/fcmPushNotifications'

export const testPushNotification = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)

    const { token, title, message, data } = req.data || {}

    // Validate required fields
    if (!token) {
      return Response.json(
        {
          success: false,
          message: 'FCM token is required',
        },
        { status: 400 },
      )
    }

    // Send push notification
    const result = await fcmNotifications.sendNotification(
      [token],
      message || 'Test notification from Hogapay',
      title || 'Test Notification 🔔',
      data || { test: 'true' },
    )

    console.log('FCM Push Notification Result:', {
      success: result.success,
      successCount: result.successCount,
      failureCount: result.failureCount,
      token: token.substring(0, 20) + '...',
    })

    return Response.json(
      {
        success: result.success,
        message: result.success
          ? 'Push notification sent successfully'
          : 'Failed to send push notification. Check server logs for details.',
        result: {
          successCount: result.successCount,
          failureCount: result.failureCount,
        },
      },
      { status: result.success ? 200 : 500 },
    )
  } catch (error: any) {
    console.error('Error sending test push notification:', error)
    return Response.json(
      {
        success: false,
        message: 'Failed to send test push notification',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
