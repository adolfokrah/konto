import type { CollectionBeforeChangeHook } from 'payload'

export const setPaymentStatus: CollectionBeforeChangeHook = async ({ data, operation }) => {
  // Set payment status based on payment method for new contributions
  if (operation === 'create') {
    if (data.paymentMethod === 'mobile-money') {
      data.paymentStatus = 'pending'
    } else if (data.paymentMethod === 'cash' || data.paymentMethod === 'bank-transfer') {
      data.paymentStatus = 'completed'
    }
  }

  return data
}
