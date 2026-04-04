import { getPaystack } from '@/utilities/initalise'

/**
 * Process Referral Withdrawal Task
 *
 * Queued by confirm-withdrawal endpoint. The payout-paystack queue ensures
 * sequential processing — only one payout job runs at a time.
 */
export const processReferralWithdrawalTask = {
  slug: 'process-referral-withdrawal',
  inputSchema: [
    { name: 'withdrawalRecordId', type: 'text', required: true },
    { name: 'userId', type: 'text', required: true },
    { name: 'bank', type: 'text', required: true },
    { name: 'bankCode', type: 'text', required: false },
    { name: 'accountNumber', type: 'text', required: true },
    { name: 'accountHolder', type: 'text', required: true },
    { name: 'amount', type: 'text', required: true },
  ],
  handler: async (args: any) => {
    const payload = args.req?.payload || args.payload
    const {
      withdrawalRecordId,
      userId,
      bank,
      bankCode: storedBankCode,
      accountNumber,
      accountHolder,
      amount,
    } = args.input

    try {
      console.log(`🔄 Processing referral withdrawal ${withdrawalRecordId}...`)

      const bankCodeMap: Record<string, string> = {
        mtn: 'MTN',
        telecel: 'VOD',
        vodafone: 'VOD',
        airteltigo: 'ATL',
        atl: 'ATL',
      }
      const bankSlug = bank?.toLowerCase()
      const bankCode = storedBankCode || (bankSlug ? bankCodeMap[bankSlug] : null)
      if (!bankCode) {
        await payload.update({
          collection: 'referral-bonuses',
          id: withdrawalRecordId,
          data: {
            status: 'failed',
            description: `Withdrawal failed: unsupported provider "${bank}"`,
          },
          overrideAccess: true,
        })
        return { output: { success: false, message: `Unsupported mobile money provider` } }
      }

      const netAmount = parseFloat(amount)
      if (netAmount < 1) {
        await payload.update({
          collection: 'referral-bonuses',
          id: withdrawalRecordId,
          data: {
            status: 'failed',
            description: 'Withdrawal failed: amount below minimum GHS 1.00',
          },
          overrideAccess: true,
        })
        return { output: { success: false, message: 'Amount below minimum GHS 1.00' } }
      }

      const accountSuffix = accountNumber.slice(-4)
      const paystack = getPaystack()

      const recipient = await paystack.createTransferRecipient({
        type: 'mobile_money',
        name: accountHolder,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'GHS',
      })

      const amountInPesewas = Math.round(netAmount * 100)
      const transfer = await paystack.initiateTransfer({
        source: 'balance',
        amount: amountInPesewas,
        recipient: recipient.recipient_code,
        reason: 'Hogapay referral bonus withdrawal',
        currency: 'GHS',
        reference: withdrawalRecordId,
      })

      await payload.update({
        collection: 'referral-bonuses',
        id: withdrawalRecordId,
        data: {
          description: `Withdrawal GHS ${netAmount.toFixed(2)} → ${bank} ****${accountSuffix} | transfer: ${transfer.transfer_code}`,
        },
        overrideAccess: true,
      })

      console.log(`✅ Referral withdrawal initiated — transfer: ${transfer.transfer_code}`)

      return {
        output: {
          success: true,
          transferCode: transfer.transfer_code,
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
