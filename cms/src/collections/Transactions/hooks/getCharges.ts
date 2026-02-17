import type { CollectionBeforeChangeHook } from 'payload'

export const getCharges: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation === 'create') {
    // Pull fee percentages from system settings
    const settings = await req.payload.findGlobal({
      slug: 'system-settings',
      overrideAccess: true,
    })

    if (data.type === 'contribution') {
      const feePercentage = (settings.collectionFee ?? 0) / 100

      if (data.paymentMethod === 'mobile-money') {
        const platformCharge = data.amountContributed * feePercentage

        data.chargesBreakdown = {
          platformCharge: platformCharge,
          amountPaidByContributor: data.amountContributed + platformCharge,
        }
      } else {
        // No charges for cash or other payment methods
        data.chargesBreakdown = {
          platformCharge: 0,
          amountPaidByContributor: data.amountContributed,
        }
      }
    }

    if (data.type === 'payout') {
      const transferFee = (settings.transferFeePercentage ?? 0) / 100
      const feeAmount = data.amountContributed * transferFee
      const netAmount = data.amountContributed - feeAmount

      data.payoutFeePercentage = settings.transferFeePercentage ?? 0
      data.payoutFeeAmount = feeAmount
      data.payoutNetAmount = netAmount
    }
  }

  return data
}
