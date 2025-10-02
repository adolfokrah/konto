import { PayloadRequest } from 'payload'

export const cleanupOldNotifications = async (req: PayloadRequest) => {
  try {
    // Calculate the date 4 days ago (middle of 3-5 days range)
    const fourDaysAgo = new Date()
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 5)

    // Find all read notifications older than 4 days
    const oldReadNotifications = await req.payload.find({
      collection: 'notifications',
      where: {
        and: [
          {
            status: {
              equals: 'read',
            },
          },
          {
            createdAt: {
              less_than: fourDaysAgo.toISOString(),
            },
          },
        ],
      },
      pagination: false,
    })

    let deletedCount = 0
    let errorCount = 0
    const results = []

    for (const notification of oldReadNotifications.docs) {
      try {
        await req.payload.delete({
          collection: 'notifications',
          id: notification.id,
          overrideAccess: true,
        })

        results.push({
          notificationId: notification.id,
          title: (notification as any).title,
          createdAt: (notification as any).createdAt,
          status: 'deleted',
        })

        deletedCount++
      } catch (error: any) {
        results.push({
          notificationId: notification.id,
          title: (notification as any).title,
          createdAt: (notification as any).createdAt,
          status: 'error',
          error: error.message,
        })
        errorCount++
      }
    }

    const data = {
      success: true,
      message: 'Notification cleanup completed',
      totalFound: oldReadNotifications.docs.length,
      deletedCount,
      errorCount,
      cutoffDate: fourDaysAgo.toISOString(),
      results,
    }

    return Response.json(data, { status: 200 })
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: 'An error occurred during notification cleanup',
        error: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
