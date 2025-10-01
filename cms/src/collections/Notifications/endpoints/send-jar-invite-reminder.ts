import { addDataAndFileToRequest, PayloadRequest } from 'payload'
import { fcmNotifications } from '@/utilities/fcmPushNotifications'

export const sendJarInviteReminder = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)

    // if (!req.user) {
    //   return Response.json(
    //     {
    //       success: false,
    //       message: 'User not authenticated',
    //     },
    //     { status: 401 },
    //   )
    // }

    const { jarId, collectorId } = req.data || {}

    // Validate required fields
    if (!jarId || !collectorId) {
      return Response.json(
        {
          success: false,
          message: 'All fields are required: jarId, collectorId',
        },
        { status: 400 },
      )
    }

    // Find notification where data.jarId matches the provided jarId and belongs to the collector
    const notifications = await req.payload.find({
      collection: 'notifications',
      where: {
        and: [
          {
            user: {
              equals: collectorId,
            },
          },
          {
            'data.jarId': {
              equals: jarId,
            },
          },
          {
            type: {
              equals: 'jarInvite',
            },
          },
        ],
      },
      depth: 2, // Populate the user relationship to get fcmToken
      limit: 1,
    })

    let notification

    if (!notifications.docs || notifications.docs.length === 0) {
      // No existing notification found, create a new one
      // First get the jar details to create meaningful notification content
      const jar = await req.payload.findByID({
        collection: 'jars',
        id: jarId,
        depth: 1, // Populate creator to get fullName
      })

      if (!jar) {
        return Response.json(
          {
            success: false,
            message: 'Jar not found',
          },
          { status: 404 },
        )
      }

      // Get the jar creator's name for the notification message
      const creator = jar.creator
      const inviterName =
        typeof creator === 'object' && creator?.fullName ? creator.fullName : 'Someone'

      // Create new jar invite notification with consistent message format
      notification = await req.payload.create({
        collection: 'notifications',
        data: {
          type: 'jarInvite',
          title: 'Jar Invitation',
          message: `${inviterName} invited you to contribute to: ${jar.name}`,
          user: collectorId,
          status: 'unread',
          data: {
            jarId: jarId,
          },
        },
        depth: 2, // Populate the user relationship
      })
    } else {
      notification = notifications.docs[0]
    }

    // Get fcmToken from the populated user relationship
    const user = notification.user
    if (!user || typeof user === 'string') {
      return Response.json(
        {
          success: false,
          message: 'User data not properly populated',
        },
        { status: 500 },
      )
    }

    const fcmToken = user.fcmToken

    if (!fcmToken) {
      return Response.json(
        {
          success: false,
          message: 'User does not have FCM token for push notifications',
        },
        { status: 400 },
      )
    }

    // Prepare data as strings (FCM requirement)
    const notificationData: Record<string, string> = {
      notificationId: notification.id,
      type: notification.type,
      jarId: String(jarId),
    }

    // Add notification.data if it exists and is an object
    if (
      notification.data &&
      typeof notification.data === 'object' &&
      !Array.isArray(notification.data)
    ) {
      Object.entries(notification.data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          notificationData[key] = String(value)
        }
      })
    }

    // Send push notification using fcmNotifications
    const pushResult = await fcmNotifications.sendNotification(
      [fcmToken],
      notification.message,
      notification.title,
      notificationData,
    )

    if (!pushResult.success) {
      return Response.json(
        {
          success: false,
          message: 'Failed to send push notification reminder',
          data: {
            successCount: pushResult.successCount,
            failureCount: pushResult.failureCount,
          },
        },
        { status: 500 },
      )
    }

    return Response.json(
      {
        success: true,
        message: 'Jar invite reminder sent successfully',
        data: {
          notificationId: notification.id,
          collectorId: collectorId,
          jarId: jarId,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error sending jar invite reminder:', error)
    return Response.json(
      {
        success: false,
        message: 'Error sending jar invite reminder',
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
