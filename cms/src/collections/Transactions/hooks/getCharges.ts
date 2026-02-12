import type { CollectionBeforeChangeHook } from 'payload'
import TransactionCharges from '@/utilities/transaction-charges'

export const getCharges: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation === 'create' && data.type === 'contribution') {
    const chargesCalculator = new TransactionCharges({ isCreatorPaysPlatformFees: true })
    const charges = chargesCalculator.calculateAmountAndCharges(data.amountContributed)

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
