import { sendSMS } from '@/utilities/sms'
import type { CollectionAfterChangeHook } from 'payload'

export const sendContributionReceipt: CollectionAfterChangeHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation === 'create') {
    if (data.paymentStatus === 'completed') {
      const jar = await req.payload.findByID({
        collection: 'jars',
        id: data.jar,
      })

      if (jar) {
        const receipt = `Your contribution of ${jar.currency} ${data.amountContributed} to "${jar.name}" was successful. ${jar.thankYouMessage || ''}`

        if (data.contributorPhoneNumber) {
          sendSMS([data.contributorPhoneNumber], receipt)
        }
      }
    }
  }
}
