import { sendSms, normalisePhone } from '@/utilities/deywuroSms'

const BATCH_SIZE = 100

export const sendSmsCampaignTask = {
  slug: 'send-sms-campaign',
  inputSchema: [{ name: 'campaignId', type: 'text', required: true }],
  handler: async (args: any) => {
    const payload = args.req?.payload || args.payload
    const { campaignId } = args.input

    try {
      const campaign = await payload.findByID({
        collection: 'sms-campaigns',
        id: campaignId,
        overrideAccess: true,
      })

      if (!campaign) {
        return { output: { success: false, message: 'Campaign not found' } }
      }

      if (campaign.status === 'sent' || campaign.status === 'sending') {
        return { output: { success: false, message: `Campaign already ${campaign.status}` } }
      }

      await payload.update({
        collection: 'sms-campaigns',
        id: campaignId,
        data: { status: 'sending' },
        overrideAccess: true,
      })

      // Collect user phone numbers based on target audience
      let allPhones: string[] = []

      if (
        campaign.targetAudience === 'selected' &&
        Array.isArray(campaign.recipients) &&
        campaign.recipients.length > 0
      ) {
        const recipientIds = campaign.recipients.map((r: any) => (typeof r === 'object' ? r.id : r))
        let page = 1
        let hasMore = true
        while (hasMore) {
          const result = await payload.find({
            collection: 'users',
            where: { id: { in: recipientIds }, phoneNumber: { exists: true } },
            select: { phoneNumber: true },
            limit: BATCH_SIZE,
            page,
            overrideAccess: true,
          })
          for (const u of result.docs as any[]) {
            const normalised = normalisePhone(u.phoneNumber || '')
            if (normalised) allPhones.push(normalised)
          }
          hasMore = result.hasNextPage
          page++
        }
      } else {
        const platformFilter =
          campaign.targetAudience === 'android' || campaign.targetAudience === 'ios'
            ? { platform: { equals: campaign.targetAudience } }
            : {}
        let page = 1
        let hasMore = true
        while (hasMore) {
          const result = await payload.find({
            collection: 'users',
            where: { phoneNumber: { exists: true }, ...platformFilter },
            select: { phoneNumber: true },
            limit: BATCH_SIZE,
            page,
            overrideAccess: true,
          })
          for (const u of result.docs as any[]) {
            const normalised = normalisePhone(u.phoneNumber || '')
            if (normalised) allPhones.push(normalised)
          }
          hasMore = result.hasNextPage
          page++
        }
      }

      // Deduplicate
      allPhones = [...new Set(allPhones)]

      if (allPhones.length === 0) {
        await payload.update({
          collection: 'sms-campaigns',
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
        return { output: { success: true, message: 'No recipients with phone numbers' } }
      }

      // Send in batches
      let totalSuccess = 0
      let totalFailure = 0

      for (let i = 0; i < allPhones.length; i += BATCH_SIZE) {
        const batch = allPhones.slice(i, i + BATCH_SIZE)
        const result = await sendSms(batch, campaign.message)
        totalSuccess += result.successCount
        totalFailure += result.failureCount
      }

      await payload.update({
        collection: 'sms-campaigns',
        id: campaignId,
        data: {
          status: 'sent',
          sentAt: new Date().toISOString(),
          recipientCount: allPhones.length,
          successCount: totalSuccess,
          failureCount: totalFailure,
        },
        overrideAccess: true,
      })

      console.log(`✅ SMS campaign sent: ${totalSuccess}/${allPhones.length} delivered`)

      return {
        output: {
          success: true,
          recipientCount: allPhones.length,
          successCount: totalSuccess,
          failureCount: totalFailure,
        },
      }
    } catch (error: any) {
      console.error(`❌ SMS campaign ${campaignId} failed:`, error)
      try {
        await payload.update({
          collection: 'sms-campaigns',
          id: campaignId,
          data: { status: 'failed' },
          overrideAccess: true,
        })
      } catch {}
      return { output: { success: false, message: error.message } }
    }
  },
}
