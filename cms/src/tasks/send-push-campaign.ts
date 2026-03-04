import { FCMPushNotifications } from '@/utilities/fcmPushNotifications'

const BATCH_SIZE = 500

/**
 * Send Push Campaign Task
 *
 * Queued by the dashboard when admin sends or schedules a campaign.
 * Fetches all users with FCM tokens and sends the notification in batches.
 */
export const sendPushCampaignTask = {
  slug: 'send-push-campaign',
  inputSchema: [{ name: 'campaignId', type: 'text', required: true }],
  handler: async (args: any) => {
    const payload = args.req?.payload || args.payload
    const { campaignId } = args.input

    try {
      const campaign = await payload.findByID({
        collection: 'push-campaigns',
        id: campaignId,
        overrideAccess: true,
      })

      if (!campaign) {
        return { output: { success: false, message: 'Campaign not found' } }
      }

      if (campaign.status === 'sent' || campaign.status === 'sending') {
        return { output: { success: false, message: `Campaign already ${campaign.status}` } }
      }

      // Mark as sending
      await payload.update({
        collection: 'push-campaigns',
        id: campaignId,
        data: { status: 'sending' },
        overrideAccess: true,
      })

      // Collect users based on target audience
      let allUsers: { id: string; fcmToken: string }[] = []

      if (
        campaign.targetAudience === 'selected' &&
        Array.isArray(campaign.recipients) &&
        campaign.recipients.length > 0
      ) {
        // Selected users — resolve IDs (may be populated objects or plain IDs)
        const recipientIds = campaign.recipients.map((r: any) => (typeof r === 'object' ? r.id : r))

        let page = 1
        let hasMore = true
        while (hasMore) {
          const usersResult = await payload.find({
            collection: 'users',
            where: {
              id: { in: recipientIds },
              fcmToken: { exists: true },
            },
            select: { fcmToken: true },
            limit: BATCH_SIZE,
            page,
            overrideAccess: true,
          })
          for (const u of usersResult.docs as any[]) {
            if (u.fcmToken && u.fcmToken.trim().length > 0) {
              allUsers.push({ id: u.id, fcmToken: u.fcmToken })
            }
          }
          hasMore = usersResult.hasNextPage
          page++
        }
      } else {
        // All users with FCM tokens
        let page = 1
        let hasMore = true
        while (hasMore) {
          const usersResult = await payload.find({
            collection: 'users',
            where: { fcmToken: { exists: true } },
            select: { fcmToken: true },
            limit: BATCH_SIZE,
            page,
            overrideAccess: true,
          })
          for (const u of usersResult.docs as any[]) {
            if (u.fcmToken && u.fcmToken.trim().length > 0) {
              allUsers.push({ id: u.id, fcmToken: u.fcmToken })
            }
          }
          hasMore = usersResult.hasNextPage
          page++
        }
      }

      const allTokens = allUsers.map((u) => u.fcmToken)

      if (allTokens.length === 0) {
        await payload.update({
          collection: 'push-campaigns',
          id: campaignId,
          data: {
            status: 'sent',
            sentAt: new Date().toISOString(),
            recipientCount: 0,
            successCount: 0,
            failureCount: 0,
          },
          overrideAccess: true,
        })
        return { output: { success: true, message: 'No recipients with FCM tokens' } }
      }

      // Build data payload — FCM data values must be strings
      const notificationData: Record<string, string> = {
        type: 'campaign',
        campaignId,
      }
      if (campaign.data && typeof campaign.data === 'object') {
        for (const [key, value] of Object.entries(campaign.data)) {
          notificationData[key] = String(value)
        }
      }

      // Send in batches of 500 (FCM multicast limit)
      const fcm = new FCMPushNotifications()
      let totalSuccess = 0
      let totalFailure = 0

      for (let i = 0; i < allTokens.length; i += BATCH_SIZE) {
        const batch = allTokens.slice(i, i + BATCH_SIZE)
        const result = await fcm.sendNotification(
          batch,
          campaign.message,
          campaign.title,
          notificationData,
        )
        totalSuccess += result.successCount
        totalFailure += result.failureCount
      }

      // Create Notification records for each recipient user
      for (const user of allUsers) {
        try {
          await payload.create({
            collection: 'notifications',
            data: {
              type: 'campaign',
              title: campaign.title,
              message: campaign.message,
              data: campaign.data || undefined,
              user: user.id,
              status: 'unread',
            },
            context: { skipPush: true },
            overrideAccess: true,
          })
        } catch (e) {
          // Log but don't fail the campaign for notification record errors
          console.error(`Failed to create notification for user ${user.id}:`, (e as Error).message)
        }
      }

      // Update campaign with results
      await payload.update({
        collection: 'push-campaigns',
        id: campaignId,
        data: {
          status: 'sent',
          sentAt: new Date().toISOString(),
          recipientCount: allTokens.length,
          successCount: totalSuccess,
          failureCount: totalFailure,
        },
        overrideAccess: true,
      })

      console.log(
        `✅ Campaign "${campaign.title}" sent: ${totalSuccess}/${allTokens.length} delivered`,
      )

      return {
        output: {
          success: true,
          recipientCount: allTokens.length,
          successCount: totalSuccess,
          failureCount: totalFailure,
        },
      }
    } catch (error: any) {
      console.error(`❌ Campaign ${campaignId} failed:`, error)

      // Mark as failed
      try {
        await payload.update({
          collection: 'push-campaigns',
          id: campaignId,
          data: { status: 'failed' },
          overrideAccess: true,
        })
      } catch {}

      return { output: { success: false, message: error.message } }
    }
  },
}
