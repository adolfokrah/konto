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
      (data.paymentStatus === 'completed' &&
        data.type === 'contribution' &&
        data.paymentMethod != 'mobile-money' &&
        data.paymentMethod != 'paystack') ||
      (previousDoc?.paymentStatus == 'pending' &&
        data.paymentStatus === 'completed' &&
        data.type == 'contribution')
    ) {
      const jar = await req.payload.findByID({
        collection: 'jars',
        id: data.jar,
        depth: 2, // Populate relationships
      })

      if (jar) {
        const amount = data.amountContributed
        const receipt = `Your contribution of ${jar.currency} ${Number(amount).toFixed(2)} to "${jar.name}" was successful. ${jar.thankYouMessage || ''}`

        if (data.contributorPhoneNumber) {
          sendSMS([data.contributorPhoneNumber], receipt)
        }
        const creatorToken = typeof jar.creator === 'object' ? jar.creator?.fcmToken : null

        const tokens = [creatorToken]

        const collector = jar?.invitedCollectors?.find((invitedCollector) => {
          const collectorId =
            typeof invitedCollector.collector === 'string'
              ? invitedCollector.collector
              : invitedCollector.collector?.id
          return collectorId === data.collector
        })

        if (collector) {
          const collectorUser = typeof collector.collector === 'object' ? collector.collector : null
          if (collectorUser?.fcmToken) {
            tokens.push(collectorUser.fcmToken)
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
