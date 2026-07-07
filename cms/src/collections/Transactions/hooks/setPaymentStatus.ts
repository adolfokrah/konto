import type { CollectionBeforeChangeHook } from 'payload'

export const setPaymentStatus: CollectionBeforeChangeHook = async ({ data, operation }) => {
  // Set payment status based on payment method for new contributions.
  // mobile-money and card go through async gateway → start pending; webhook flips.
  // cash/bank/apple-pay settle immediately.
  if (operation === 'create') {
    if (['mobile-money', 'card'].includes(data.paymentMethod) && data.type == 'contribution') {
      data.paymentStatus = 'pending'
    } else if (
      ['cash', 'bank', 'apple-pay'].includes(data.paymentMethod) &&
      data.type == 'contribution'
    ) {
      data.paymentStatus = 'completed'
    }
  }

  return data
}
