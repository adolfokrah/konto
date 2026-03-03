import { getEganow } from '@/utilities/initalise'

/**
 * Process Payout Task
 *
 * Queued by the payout endpoint. The queue ensures sequential processing —
 * only one payout job runs at a time, eliminating race conditions.
 */
export const processPayoutTask = {
  slug: 'process-payout',
  inputSchema: [
    { name: 'jarId', type: 'text', required: true },
    { name: 'userId', type: 'text', required: true },
    { name: 'userBank', type: 'text', required: true },
    { name: 'userAccountNumber', type: 'text', required: true },
    { name: 'userAccountHolder', type: 'text', required: true },
  ],
  handler: async (args: any) => {
    const payload = args.req?.payload || args.payload
    const { jarId, userId, userBank, userAccountNumber, userAccountHolder } = args.input

    try {
      console.log(`🔄 Processing payout for jar ${jarId}...`)

      // Check if there's already a pending payout for this jar
      const pendingPayout = await payload.find({
        collection: 'transactions',
        where: {
          jar: { equals: jarId },
          type: { equals: 'payout' },
          paymentStatus: { equals: 'pending' },
        },
        limit: 1,
        overrideAccess: true,
      })

      if (pendingPayout.docs.length > 0) {
        console.log(`⚠️ Jar ${jarId} already has a pending payout, skipping`)
        return {
          output: {
            success: false,
            message: 'A payout is already pending for this jar',
          },
        }
      }

      // Fetch the jar
      const jar = await payload.findByID({
        collection: 'jars',
        id: jarId,
        depth: 1,
        overrideAccess: true,
      })

      if (!jar) {
        return { output: { success: false, message: 'Jar not found' } }
      }

      if (jar.status === 'frozen') {
        return { output: { success: false, message: 'Jar is frozen' } }
      }

      // Verify ownership
      const creatorId = typeof jar.creator === 'string' ? jar.creator : jar.creator?.id
      if (creatorId !== userId) {
        return { output: { success: false, message: 'Not the jar creator' } }
      }

      // Calculate balance
      const allTransactions = await payload.find({
        collection: 'transactions',
        where: { jar: { equals: jarId } },
        limit: 10000,
        overrideAccess: true,
      })

      const settledContributionsSum = allTransactions.docs
        .filter(
          (tx: any) =>
            tx.type === 'contribution' && tx.paymentStatus === 'completed' && tx.isSettled === true,
        )
        .reduce((sum: number, tx: any) => sum + tx.amountContributed, 0)

      const payoutsSum = allTransactions.docs
        .filter(
          (tx: any) =>
            (tx.type === 'payout' || tx.type === 'refund') &&
            (tx.paymentStatus === 'pending' || tx.paymentStatus === 'completed'),
        )
        .reduce((sum: number, tx: any) => sum + tx.amountContributed, 0)

      const netBalance = settledContributionsSum + payoutsSum

      if (netBalance <= 0) {
        return { output: { success: false, message: 'No balance available for payout' } }
      }

      // Get system settings for fee
      const systemSettings = await payload.findGlobal({ slug: 'system-settings' })
      const transferFeePercentage = systemSettings?.transferFeePercentage || 1
      const transferFee = (netBalance * transferFeePercentage) / 100
      const expectedNetAmount = netBalance - transferFee

      // Map provider
      const providerMap: Record<string, string> = {
        mtn: 'MTNGH',
        airteltigo: 'ATGH',
        telecel: 'TCELGH',
      }

      const paypartner = providerMap[userBank.toLowerCase()]
      if (!paypartner) {
        return { output: { success: false, message: 'Unsupported mobile money provider' } }
      }

      // Format phone number
      let phoneNumber = userAccountNumber.replace(/\s+/g, '')
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '233' + phoneNumber.substring(1)
      } else if (!phoneNumber.startsWith('233')) {
        phoneNumber = '233' + phoneNumber
      }

      // Create payout transaction
      const transaction = await payload.create({
        collection: 'transactions',
        data: {
          paymentStatus: 'pending',
          paymentMethod: 'mobile-money',
          transactionReference: '',
          jar: jarId,
          mobileMoneyProvider: userBank,
          amountContributed: -netBalance,
          collector: userId,
          contributorPhoneNumber: userAccountNumber,
          contributor: userAccountHolder,
          type: 'payout',
          payoutFeePercentage: transferFeePercentage,
          payoutFeeAmount: transferFee,
          payoutNetAmount: expectedNetAmount,
        },
        overrideAccess: true,
      })

      console.log(`✅ Payout transaction created: ${transaction.id}`)

      try {
        // Get Eganow token and initiate payout
        await getEganow().getToken()

        const payoutData = {
          paypartnerCode: paypartner,
          amount: String(netBalance.toFixed(2)),
          accountNoOrCardNoOrMSISDN: phoneNumber,
          accountName: userAccountHolder,
          transactionId: `payout-${transaction.id}`,
          narration: `Payout for jar ${jar.name}`,
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

        console.log(`✅ Payout initiated — ref: ${payoutResult.eganowReferenceNo}`)

        return {
          output: {
            success: true,
            message: 'Payout initiated successfully',
            transactionId: transaction.id,
            eganowReferenceNo: payoutResult.eganowReferenceNo,
            grossAmount: netBalance,
            transferFee,
            netAmount: expectedNetAmount,
          },
        }
      } catch (eganowError: any) {
        // Eganow call failed — mark transaction as failed
        await payload.update({
          collection: 'transactions',
          id: transaction.id,
          data: { paymentStatus: 'failed' },
          overrideAccess: true,
        })
        console.error(`❌ Eganow payout failed for transaction ${transaction.id}:`, eganowError)
        throw eganowError
      }
    } catch (error: any) {
      console.error(`❌ Payout task error for jar ${jarId}:`, error)
      return {
        output: {
          success: false,
          message: `Error: ${error.message}`,
        },
      }
    }
  },
}
