/**
 * Send Scheduled Campaigns Task
 *
 * Runs every minute via cron. Finds campaigns with status 'scheduled'
 * and scheduledFor <= now, then queues a send-push-campaign job for each.
 */
export const sendScheduledCampaignsTask = {
  slug: 'send-scheduled-campaigns',
  handler: async (args: any) => {
    const payload = args.req?.payload || args.payload

    try {
      const now = new Date().toISOString()

      const dueCampaigns = await payload.find({
        collection: 'push-campaigns',
        where: {
          status: { equals: 'scheduled' },
          scheduledFor: { less_than_equal: now },
        },
        limit: 50,
        overrideAccess: true,
      })

      if (dueCampaigns.docs.length === 0) {
        return { output: { success: true, queued: 0 } }
      }

      let queued = 0
      for (const campaign of dueCampaigns.docs) {
        try {
          await payload.jobs.queue({
            task: 'send-push-campaign',
            input: { campaignId: campaign.id },
          })
          queued++
        } catch (err: any) {
          console.error(`❌ Failed to queue campaign ${campaign.id}:`, err.message)
        }
      }

      // Run queued jobs
      await payload.jobs.run()

      console.log(`📨 Queued ${queued} scheduled campaign(s) for sending`)
      return { output: { success: true, queued } }
    } catch (error: any) {
      console.error('❌ send-scheduled-campaigns error:', error)
      return { output: { success: false, message: error.message } }
    }
  },
}
