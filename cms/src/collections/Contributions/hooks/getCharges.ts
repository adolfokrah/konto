import type { CollectionBeforeChangeHook } from 'payload'

export const getCharges: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation === 'create') {
    // No fees — amount in = amount out
    data.chargesBreakdown = {
      platformCharge: 0,
      amountPaidByContributor: data.amountContributed,
    }
  }

  return data
}
