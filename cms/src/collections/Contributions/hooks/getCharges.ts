import type { CollectionBeforeChangeHook } from 'payload'

import TransactionCharges from '@/utilities/transaction-charges'

export const getCharges: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  // Set payment status based on payment method for new contributions
  if (operation === 'create') {
    if (
      ['mobile-money', 'card', 'apple-pay'].includes(data.paymentMethod) &&
      data.type == 'contribution'
    ) {
      // if(data.amountContributed < 2){
      //   throw new Error('Minimum contribution amount is 2 cedis')
      // }

      const jar = await req.payload.findByID({
        collection: 'jars',
        id: data?.jar,
        depth: 0,
      })

      const transactionCharges = new TransactionCharges({
        isCreatorPaysPlatformFees: jar?.whoPaysPlatformFees === 'creator',
      })

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

      //  console.log(amountAfterCharges,  'amount after charges');
    }

    if (data.paymentMethod === 'cash') {
      //do cash charges calculations

      data.chargesBreakdown = {
        paystackTransferFeeMomo: 0,
        platformCharge: 0.01 * data.amountContributed, //1% platform charge for cash
        amountPaidByContributor: data.amountContributed,
        paystackCharge: 0,
      }
    }
  }

  return data
}
