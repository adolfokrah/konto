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
    if (data.paymentStatus === 'completed' && previousDoc?.paymentStatus == 'pending') {
      const jar = await req.payload.findByID({
        collection: 'jars',
        id: data.jar,
        depth: 2, // Populate relationships
      })

      if (jar) {
        const receipt = `Your contribution of ${jar.currency} ${Number(data.chargesBreakdown.amountPaidByContributor).toFixed(2)} to "${jar.name}" was successful. ${jar.thankYouMessage || ''}`

        if (data.contributorPhoneNumber && data.type == 'contribution') {
          sendSMS([data.contributorPhoneNumber], receipt)
        }
        const creatorToken = typeof jar.creator === 'object' ? jar.creator?.fcmToken : null

        const tokens = [creatorToken]

        const collectorObject = await req.payload.findByID({
          collection: 'users',
          id: data?.collector,
        })

        if (collectorObject?.fcmToken && data.type == 'contribution') {
          tokens.push(collectorObject.fcmToken)
        }

        // Send notification to jar creator and collector
        try {
          const validTokens = tokens.filter(
            (token): token is string =>
              token !== null && token !== undefined && typeof token === 'string',
          )

          let message = `You have received a contribution of ${jar.currency} ${Number(data.amountContributed).toFixed(2)} for "${jar.name}"`
          let title = 'New Contribution Received 🤑'

          if (data.type === 'transfer') {
            message = `We sent you a transfer of ${jar.currency} ${Number(data.amountContributed).toFixed(2)} for "${jar.name}"`
            title = 'New Transfer Sent 💸'
          }

          if (validTokens.length > 0) {
            fcmNotifications.sendNotification(validTokens, message, title, {
              type: 'contribution',
              jarId: jar.id,
              contributionId: doc?.id,
            })
          }
        } catch (error) {
          // Silently handle FCM notification errors
        }
      }
    }
  }
}
