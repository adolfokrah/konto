import { getEganow } from '@/utilities/initalise'

/**
 * Process Payout Task
 *
 * Always called with an existingTransactionId — the endpoint creates the
 * pending transaction record before queuing this job, so any duplicate
 * payout request is rejected at the endpoint level before it ever reaches here.
 *
 * Safety net: if somehow two pending transactions exist for the same jar
 * (e.g. a race that slipped through), this task fails the transaction and
 * aborts rather than sending money twice.
 */
export const processPayoutTask = {
  slug: 'process-payout',
  inputSchema: [
    { name: 'jarId', type: 'text', required: true },
    { name: 'userId', type: 'text', required: true },
    { name: 'userBank', type: 'text', required: true },
    { name: 'userAccountNumber', type: 'text', required: true },
    { name: 'userAccountHolder', type: 'text', required: true },
    { name: 'existingTransactionId', type: 'text', required: true },
  ],
  handler: async (args: any) => {
    const payload = args.req?.payload || args.payload
    const { jarId, userId, userBank, userAccountNumber, userAccountHolder, existingTransactionId } =
      args.input

    try {
      console.log(`🔄 Processing payout for jar ${jarId}, transaction ${existingTransactionId}...`)

      // Step 1 — fetch the transaction and confirm it is still pending
      const transaction = await payload.findByID({
        collection: 'transactions',
        id: existingTransactionId,
        overrideAccess: true,
      })

      if (!transaction) {
        return { output: { success: false, message: 'Transaction not found' } }
      }

      if (transaction.paymentStatus !== 'pending') {
        console.warn(
          `⚠️ Transaction ${existingTransactionId} is already ${transaction.paymentStatus}, skipping`,
        )
        return {
          output: {
            success: false,
            message: `Transaction is already ${transaction.paymentStatus}`,
          },
        }
      }

      // Step 2 — safety net: ensure there is exactly one pending payout for this jar
      const pendingPayouts = await payload.find({
        collection: 'transactions',
        where: {
          jar: { equals: jarId },
          type: { equals: 'payout' },
          paymentStatus: { equals: 'pending' },
        },
        limit: 2,
        select: { id: true },
        overrideAccess: true,
      })

      if (pendingPayouts.totalDocs > 1) {
        console.error(
          `❌ Multiple pending payouts detected for jar ${jarId} — failing transaction ${existingTransactionId}`,
        )
        await payload.update({
          collection: 'transactions',
          id: existingTransactionId,
          data: { paymentStatus: 'failed' },
          overrideAccess: true,
        })
        return {
          output: {
            success: false,
            message: 'Multiple pending payouts detected — transaction failed for safety',
          },
        }
      }

      // Step 3 — validate jar
      const jar = await payload.findByID({
        collection: 'jars',
        id: jarId,
        depth: 0,
        overrideAccess: true,
      })

      if (!jar) {
        await payload.update({
          collection: 'transactions',
          id: existingTransactionId,
          data: { paymentStatus: 'failed' },
          overrideAccess: true,
        })
        return { output: { success: false, message: 'Jar not found' } }
      }

      if (jar.status === 'frozen') {
        await payload.update({
          collection: 'transactions',
          id: existingTransactionId,
          data: { paymentStatus: 'failed' },
          overrideAccess: true,
        })
        return { output: { success: false, message: 'Jar is frozen' } }
      }

      // Step 4 — map provider and format phone
      const providerMap: Record<string, string> = { mtn: 'MTNGH', telecel: 'TCELGH' }
      const paypartner = providerMap[userBank.toLowerCase()]
      if (!paypartner) {
        await payload.update({
          collection: 'transactions',
          id: existingTransactionId,
          data: { paymentStatus: 'failed' },
          overrideAccess: true,
        })
        return { output: { success: false, message: 'Unsupported mobile money provider' } }
      }

      let phoneNumber = userAccountNumber.replace(/\s+/g, '')
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '233' + phoneNumber.substring(1)
      } else if (!phoneNumber.startsWith('233')) {
        phoneNumber = '233' + phoneNumber
      }

      const grossAmount = Math.abs(transaction.amountContributed ?? 0)

      // Step 5 — call Eganow
      try {
        await getEganow().getToken()

        const payoutResult = await getEganow().payout({
          paypartnerCode: paypartner,
          amount: String(grossAmount.toFixed(2)),
          accountNoOrCardNoOrMSISDN: phoneNumber,
          accountName: userAccountHolder,
          transactionId: `payout-${existingTransactionId}`,
          narration: `Payout for jar ${jar.name}`,
          transCurrencyIso: jar.currency || 'GHS',
          expiryDateMonth: 0,
          expiryDateYear: 0,
          cvv: '',
          languageId: 'en',
          callback: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/transactions/eganow-payout-webhook`,
        })

        // Step 6 — update transaction with Eganow reference
        await payload.update({
          collection: 'transactions',
          id: existingTransactionId,
          data: { transactionReference: payoutResult.eganowReferenceNo },
          overrideAccess: true,
        })

        console.log(
          `✅ Payout initiated — transaction ${existingTransactionId}, ref: ${payoutResult.eganowReferenceNo}`,
        )

        return {
          output: {
            success: true,
            message: 'Payout initiated successfully',
            transactionId: existingTransactionId,
            eganowReferenceNo: payoutResult.eganowReferenceNo,
          },
        }
      } catch (eganowError: any) {
        await payload.update({
          collection: 'transactions',
          id: existingTransactionId,
          data: { paymentStatus: 'failed' },
          overrideAccess: true,
        })
        console.error(
          `❌ Eganow payout failed for transaction ${existingTransactionId}:`,
          eganowError,
        )
        throw eganowError
      }
    } catch (error: any) {
      console.error(`❌ Payout task error for jar ${jarId}:`, error)
      return { output: { success: false, message: `Error: ${error.message}` } }
    }
  },
}
