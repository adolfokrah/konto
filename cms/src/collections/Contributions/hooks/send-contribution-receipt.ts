import { fcmNotifications } from '@/utilities/fcmPushNotifications'
import { sendSMS } from '@/utilities/sms'
import type { CollectionAfterChangeHook } from 'payload'

export const sendContributionReceipt: CollectionAfterChangeHook = async ({
  data,
  operation,
  req,
  doc,
  previousDoc,
}) => {
  if (operation === 'create' || operation === 'update') {
    if (
      data.paymentStatus === 'completed' &&
      data.type === 'contribution' &&
      previousDoc?.paymentStatus !== 'completed'
    ) {
      const jar = await req.payload.findByID({
        collection: 'jars',
        id: data.jar,
        depth: 2, // Populate relationships
      })

      if (jar) {
        const receipt = `Your contribution of ${jar.currency} ${Number(data.chargesBreakdown.amountPaidByContributor).toFixed(2)} to "${jar.name}" was successful. ${jar.thankYouMessage || ''}`

        if (data.contributorPhoneNumber) {
          sendSMS([data.contributorPhoneNumber], receipt)
        }
        const creatorToken = typeof jar.creator === 'object' ? jar.creator?.fcmToken : null

        const tokens = [creatorToken]

        if (req?.user && jar.invitedCollectors) {
          // Check if current user is part of invited collectors
          const isInvitedCollector = jar.invitedCollectors.some((collector: any) => {
            const collectorId = typeof collector === 'object' ? collector.id : collector
            return collectorId === req.user?.id
          })

          if (isInvitedCollector && req.user.fcmToken) {
            tokens.push(req.user.fcmToken)
          }
        }

        // Send notification to jar creator and collector
        try {
          const validTokens = tokens.filter(
            (token): token is string =>
              token !== null && token !== undefined && typeof token === 'string',
          )

          if (validTokens.length > 0) {
            fcmNotifications.sendNotification(
              validTokens,
              `You have received a contribution of ${jar.currency} ${Number(data.amountContributed).toFixed(2)} for "${jar.name}"`,
              'New Contribution Received 🤑',
              { type: 'contribution', jarId: jar.id, contributionId: doc?.id },
            )
          }
        } catch (error) {
          // Silently handle FCM notification errors
        }
      }
    }
  }
}
