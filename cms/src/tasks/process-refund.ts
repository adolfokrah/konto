import { getEganow } from '@/utilities/initalise'

/**
 * Process Refund Task
 *
 * Queued by the refund-contribution endpoint. Sends money back to the
 * contributor's phone number via Eganow payout API.
 */
export const processRefundTask = {
  slug: 'process-refund',
  inputSchema: [
    { name: 'originalTransactionId', type: 'text', required: true },
    { name: 'jarId', type: 'text', required: true },
    { name: 'contributorPhone', type: 'text', required: true },
    { name: 'contributorName', type: 'text', required: true },
    { name: 'mobileMoneyProvider', type: 'text', required: true },
    { name: 'amount', type: 'text', required: true },
  ],
  handler: async (args: any) => {
    const payload = args.req?.payload || args.payload
    const {
      originalTransactionId,
      jarId,
      contributorPhone,
      contributorName,
      mobileMoneyProvider,
      amount,
    } = args.input

    try {
      console.log(`🔄 Processing refund for transaction ${originalTransactionId}...`)

      const refundAmount = parseFloat(amount)

      // Fetch the jar for currency info
      const jar = await payload.findByID({
        collection: 'jars',
        id: jarId,
        depth: 0,
        overrideAccess: true,
      })

      if (!jar) {
        return { output: { success: false, message: 'Jar not found' } }
      }

      // Map provider
      const providerMap: Record<string, string> = {
        mtn: 'MTNGH',
        telecel: 'TCELGH',
      }

      const paypartner = providerMap[mobileMoneyProvider.toLowerCase()]
      if (!paypartner) {
        return { output: { success: false, message: 'Unsupported mobile money provider' } }
      }

      // Format phone number
      let phoneNumber = contributorPhone.replace(/\s+/g, '')
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '233' + phoneNumber.substring(1)
      } else if (!phoneNumber.startsWith('233')) {
        phoneNumber = '233' + phoneNumber
      }

      // Re-check for existing refund before creating (guards against race condition from concurrent requests)
      const existingRefund = await payload.find({
        collection: 'transactions',
        where: {
          linkedTransaction: { equals: originalTransactionId },
          type: { equals: 'refund' },
          paymentStatus: { in: ['pending', 'completed'] },
        },
        limit: 1,
        overrideAccess: true,
      })

      if (existingRefund.docs.length > 0) {
        console.log(`⚠️ Refund already exists for ${originalTransactionId}, aborting`)
        return {
          output: {
            success: false,
            message: 'A refund has already been issued for this transaction',
          },
        }
      }

      // Create refund transaction (negative amount, like payout)
      const transaction = await payload.create({
        collection: 'transactions',
        data: {
          paymentStatus: 'pending',
          paymentMethod: 'mobile-money',
          transactionReference: '',
          jar: jarId,
          mobileMoneyProvider: mobileMoneyProvider,
          amountContributed: -refundAmount,
          contributor: contributorName,
          contributorPhoneNumber: contributorPhone,
          type: 'refund',
          linkedTransaction: originalTransactionId,
        },
        overrideAccess: true,
      })

      console.log(`✅ Refund transaction created: ${transaction.id}`)

      try {
        // Get Eganow token and initiate payout to contributor
        await getEganow().getToken()

        const payoutData = {
          paypartnerCode: paypartner,
          amount: String(refundAmount.toFixed(2)),
          accountNoOrCardNoOrMSISDN: phoneNumber,
          accountName: contributorName,
          transactionId: `refund-${transaction.id}`,
          narration: `Refund for contribution to ${jar.name}`,
          transCurrencyIso: jar.currency || 'GHS',
          expiryDateMonth: 0,
          expiryDateYear: 0,
          cvv: '',
          languageId: 'en',
          callback: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/transactions/eganow-payout-webhook`,
        }

        const payoutResult = await getEganow().payout(payoutData)

        // Update with Eganow reference
        await payload.update({
          collection: 'transactions',
          id: transaction.id,
          data: { transactionReference: payoutResult.eganowReferenceNo },
          overrideAccess: true,
        })

        console.log(`✅ Refund initiated — ref: ${payoutResult.eganowReferenceNo}`)

        return {
          output: {
            success: true,
            message: 'Refund initiated successfully',
            transactionId: transaction.id,
            eganowReferenceNo: payoutResult.eganowReferenceNo,
            amount: refundAmount,
          },
        }
      } catch (eganowError: any) {
        // Eganow call failed — mark refund as failed
        await payload.update({
          collection: 'transactions',
          id: transaction.id,
          data: { paymentStatus: 'failed' },
          overrideAccess: true,
        })

        console.error(`❌ Eganow refund failed for transaction ${transaction.id}:`, eganowError)
        throw eganowError
      }
    } catch (error: any) {
      console.error(`❌ Refund task error for transaction ${originalTransactionId}:`, error)
      return {
        output: {
          success: false,
          message: `Error: ${error.message}`,
        },
      }
    }
  },
}
