import type { CollectionBeforeChangeHook } from 'payload'

export const getCharges: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation === 'create' && data.type === 'contribution') {
    if (data.paymentMethod === 'mobile-money') {
      // Calculate 1% platform charge only for mobile money
      const platformCharge = data.amountContributed * 0.01

      data.charges = platformCharge
      data.chargesBreakdown = {
        platformCharge: platformCharge,
        amountPaidByContributor: data.amountContributed,
      }
    } else {
      // No charges for cash or other payment methods
      data.charges = 0
      data.chargesBreakdown = {
        platformCharge: 0,
        amountPaidByContributor: data.amountContributed,
      }
    }
  }

  return data
}
