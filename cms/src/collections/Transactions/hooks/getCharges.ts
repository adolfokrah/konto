import type { CollectionBeforeChangeHook } from 'payload'

export const getCharges: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation === 'create' && data.type === 'contribution') {
    // Calculate 1% platform charge
    const platformCharge = data.amountContributed * 0.01

    data.charges = platformCharge
    data.chargesBreakdown = {
      platformCharge: platformCharge,
      amountPaidByContributor: data.amountContributed,
    }
  }

  return data
}
