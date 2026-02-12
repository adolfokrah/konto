import type { CollectionBeforeChangeHook } from 'payload'

export const setPaymentStatus: CollectionBeforeChangeHook = async ({ data, operation }) => {
  // Set payment status based on payment method for new contributions
  if (operation === 'create') {
    if (data.paymentMethod === 'mobile-money' && data.type == 'contribution') {
      data.paymentStatus = 'pending'
    } else if (
      ['cash', 'bank', 'card', 'apple-pay'].includes(data.paymentMethod) &&
      data.type == 'contribution'
    ) {
      data.paymentStatus = 'completed'
    }
  }

  return data
}
