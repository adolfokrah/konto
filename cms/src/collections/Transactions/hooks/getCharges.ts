import type { CollectionBeforeChangeHook } from 'payload'

export const getCharges: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation === 'create' || operation === 'update') {
    // Pull fee percentages from system settings
    const settings = await req.payload.findGlobal({
      slug: 'system-settings',
      overrideAccess: true,
    })

    const hogapayCollectionFeePercent = settings.hogapayCollectionFeePercent ?? 0.8
    const hogapayTransferFeePercent = settings.hogapayTransferFeePercent ?? 0.5

    if (data.type === 'contribution') {
      const feePercentage = (settings.collectionFee ?? 0) / 100

      if (data.paymentMethod === 'mobile-money') {
        const platformCharge = data.amountContributed * feePercentage
        const hogapayRevenue = (data.amountContributed * hogapayCollectionFeePercent) / 100
        const eganowFees = platformCharge - hogapayRevenue

        data.chargesBreakdown = {
          platformCharge: platformCharge,
          amountPaidByContributor: data.amountContributed + platformCharge,
          hogapayRevenue: hogapayRevenue,
          eganowFees: eganowFees,
        }
      } else {
        // No charges for cash or other payment methods
        data.chargesBreakdown = {
          platformCharge: 0,
          amountPaidByContributor: data.amountContributed,
          hogapayRevenue: 0,
          eganowFees: 0,
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

      if (data.paymentMethod === 'mobile-money') {
        const hogapayRevenue = (data.amountContributed * hogapayTransferFeePercent) / 100
        const eganowFees = feeAmount - hogapayRevenue

        data.chargesBreakdown = {
          ...data.chargesBreakdown,
          hogapayRevenue: hogapayRevenue,
          eganowFees: eganowFees,
        }
      } else {
        data.chargesBreakdown = {
          ...data.chargesBreakdown,
          hogapayRevenue: 0,
          eganowFees: 0,
        }
      }
    }
  }

  return data
}
