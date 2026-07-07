import { getEganow } from '@/utilities/initalise'
import { getWebhookBaseURL } from '@/utilities/getURL'

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
    { name: 'type', type: 'text' },
    { name: 'provider', type: 'text', required: true },
    { name: 'accountNumber', type: 'text', required: true },
    { name: 'accountHolder', type: 'text', required: true },
    { name: 'amount', type: 'text', required: true },
  ],
  handler: async (args: any) => {
    const payload = args.req?.payload || args.payload
    const { withdrawalRecordId, userId, type, provider, accountNumber, accountHolder, amount } =
      args.input

    try {
      console.log(`🔄 Processing referral withdrawal ${withdrawalRecordId}...`)

      const netAmount = parseFloat(amount)
      const accountSuffix = String(accountNumber).slice(-4)
      const isBankAccount = type === 'bank'

      let paypartner: string
      let accountNoOrCardNoOrMSISDN: string

      if (isBankAccount) {
        // Bank: paypartnerCode is the bank code; account number sent as-is.
        paypartner = String(provider)
        accountNoOrCardNoOrMSISDN = String(accountNumber).replace(/\s+/g, '')
      } else {
        // Mobile money: map provider → Eganow code, format phone to 233…
        const mapped = PROVIDER_MAP[String(provider).toLowerCase()]
        if (!mapped) {
          await payload.update({
            collection: 'referral-bonuses',
            id: withdrawalRecordId,
            data: {
              status: 'failed',
              description: `Withdrawal failed: unsupported provider "${provider}"`,
            },
            overrideAccess: true,
          })
          return { output: { success: false, message: `Unsupported provider: ${provider}` } }
        }
        paypartner = mapped

        let phone = String(accountNumber).replace(/\s+/g, '')
        if (phone.startsWith('0')) phone = '233' + phone.substring(1)
        else if (!phone.startsWith('233')) phone = '233' + phone
        accountNoOrCardNoOrMSISDN = phone
      }

      await getEganow().getToken()

      const payoutPayload = {
        paypartnerCode: paypartner,
        amount: String(netAmount.toFixed(2)),
        accountNoOrCardNoOrMSISDN,
        accountName: accountHolder,
        transactionId: `referral-withdrawal-${withdrawalRecordId}`,
        narration: `Hogapay referral bonus withdrawal`,
        transCurrencyIso: 'GHS',
        expiryDateMonth: 0,
        expiryDateYear: 0,
        cvv: '',
        languageId: 'en',
        callback: `${getWebhookBaseURL()}/api/transactions/eganow-payout-webhook`,
      }
      console.log('[Eganow] referral payout request:', JSON.stringify(payoutPayload))
      const payoutResult = await getEganow().payout(payoutPayload)
      console.log('[Eganow] referral payout response:', JSON.stringify(payoutResult))

      // Update withdrawal record with Eganow reference
      await payload.update({
        collection: 'referral-bonuses',
        id: withdrawalRecordId,
        data: {
          description: `Withdrawal GHS ${netAmount.toFixed(2)} → ${provider} ****${accountSuffix} | ref: ${payoutResult.eganowReferenceNo}`,
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
