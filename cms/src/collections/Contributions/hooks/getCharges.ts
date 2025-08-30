import type { CollectionBeforeChangeHook } from 'payload'

import TransactionCharges from '@/lib/utils/transaction-charges'

export const getCharges: CollectionBeforeChangeHook = async ({ data, operation }) => {
  // Set payment status based on payment method for new contributions
  if (operation === 'create') {
    if (data.paymentMethod === 'mobile-money' && data.type == 'contribution') {
      const transactionCharges = new TransactionCharges()
      const {
        totalAmount,
        paystackCharge,
        platformCharge,
        amountAfterCharges,
        paystackTransferFeeMomo,
      } = transactionCharges.calculateAmountAndCharges(data.amountContributed)

      // Update the contribution amount to the amount recipient actually receives
      data.amountContributed = amountAfterCharges

      // Store detailed charge breakdown
      data.chargesBreakdown = {
        paystackTransferFeeMomo,
        platformCharge,
        amountPaidByContributor: totalAmount,
        paystackCharge,
      }
    }
  }

  return data
}
