import { getEganow } from '@/utilities/initalise'

const PROVIDER_MAP: Record<string, string> = {
  mtn: 'MTNGH',
  telecel: 'TCELGH',
}

/**
 * Process Referral Withdrawal Task
 *
 * Queued by confirm-withdrawal endpoint. The payout queue ensures sequential
 * processing — only one payout job runs at a time, eliminating race conditions.
 */
export const processReferralWithdrawalTask = {
  slug: 'process-referral-withdrawal',
  inputSchema: [
    { name: 'withdrawalRecordId', type: 'text', required: true },
    { name: 'userId', type: 'text', required: true },
    { name: 'bank', type: 'text', required: true },
    { name: 'accountNumber', type: 'text', required: true },
    { name: 'accountHolder', type: 'text', required: true },
    { name: 'amount', type: 'text', required: true },
  ],
  handler: async (args: any) => {
    const payload = args.req?.payload || args.payload
    const { withdrawalRecordId, userId, bank, accountNumber, accountHolder, amount } = args.input

    try {
      console.log(`🔄 Processing referral withdrawal ${withdrawalRecordId}...`)

      const paypartner = PROVIDER_MAP[bank.toLowerCase()]
      if (!paypartner) {
        await payload.update({
          collection: 'referral-bonuses',
          id: withdrawalRecordId,
          data: {
            status: 'failed',
            description: `Withdrawal failed: unsupported provider "${bank}"`,
          },
          overrideAccess: true,
        })
        return { output: { success: false, message: `Unsupported provider: ${bank}` } }
      }

      // Format phone number to international format
      let phone = accountNumber.replace(/\s+/g, '')
      if (phone.startsWith('0')) phone = '233' + phone.substring(1)
      else if (!phone.startsWith('233')) phone = '233' + phone

      const netAmount = parseFloat(amount)
      const accountSuffix = accountNumber.slice(-4)

      await getEganow().getToken()

      const payoutResult = await getEganow().payout({
        paypartnerCode: paypartner,
        amount: String(netAmount.toFixed(2)),
        accountNoOrCardNoOrMSISDN: phone,
        accountName: accountHolder,
        transactionId: `referral-withdrawal-${withdrawalRecordId}`,
        narration: `Hogapay referral bonus withdrawal`,
        transCurrencyIso: 'GHS',
        expiryDateMonth: 0,
        expiryDateYear: 0,
        cvv: '',
        languageId: 'en',
        callback: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/transactions/eganow-payout-webhook`,
      })

      // Update withdrawal record with Eganow reference
      await payload.update({
        collection: 'referral-bonuses',
        id: withdrawalRecordId,
        data: {
          description: `Withdrawal GHS ${netAmount.toFixed(2)} → ${bank} ****${accountSuffix} | ref: ${payoutResult.eganowReferenceNo}`,
        },
        overrideAccess: true,
      })

      console.log(`✅ Referral withdrawal initiated — ref: ${payoutResult.eganowReferenceNo}`)

      return {
        output: {
          success: true,
          eganowReferenceNo: payoutResult.eganowReferenceNo,
        },
      }
    } catch (error: any) {
      console.error(`❌ Referral withdrawal task error for record ${withdrawalRecordId}:`, error)

      await payload.update({
        collection: 'referral-bonuses',
        id: withdrawalRecordId,
        data: {
          status: 'failed',
          description: `Withdrawal failed: ${error.message}`,
        },
        overrideAccess: true,
      })

      return {
        output: {
          success: false,
          message: `Error: ${error.message}`,
        },
      }
    }
  },
}
