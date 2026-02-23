import { PayloadRequest } from 'payload'

export const recalculateCharges = async (req: PayloadRequest) => {
  try {
    const { user } = req
    if (!user || (user as any).role !== 'admin') {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const settings = await req.payload.findGlobal({
      slug: 'system-settings',
      overrideAccess: true,
    })

    const hogapayCollectionFeePercent = settings.hogapayCollectionFeePercent ?? 0.8
    const hogapayTransferFeePercent = settings.hogapayTransferFeePercent ?? 0.5
    const collectionFeePercentage = (settings.collectionFee ?? 0) / 100
    const transferFeePercentage = (settings.transferFeePercentage ?? 0) / 100

    const all = await req.payload.find({
      collection: 'transactions',
      where: { paymentMethod: { equals: 'mobile-money' } },
      pagination: false,
      overrideAccess: true,
      select: {
        type: true,
        paymentMethod: true,
        amountContributed: true,
        chargesBreakdown: true,
      },
    })

    let updated = 0
    for (const tx of all.docs) {
      const amount = tx.amountContributed || 0
      let data: Record<string, any> = {}

      if (tx.type === 'contribution') {
        if (tx.paymentMethod === 'mobile-money') {
          const platformCharge = amount * collectionFeePercentage
          const hogapayRevenue = (amount * hogapayCollectionFeePercent) / 100
          const eganowFees = platformCharge - hogapayRevenue

          data = {
            chargesBreakdown: {
              platformCharge,
              amountPaidByContributor: amount + platformCharge,
              hogapayRevenue,
              eganowFees,
            },
          }
        } else {
          data = {
            chargesBreakdown: {
              platformCharge: 0,
              amountPaidByContributor: amount,
              hogapayRevenue: 0,
              eganowFees: 0,
            },
          }
        }
      }

      if (tx.type === 'payout') {
        const feeAmount = amount * transferFeePercentage
        const netAmount = amount - feeAmount

        if (tx.paymentMethod === 'mobile-money') {
          const hogapayRevenue = (amount * hogapayTransferFeePercent) / 100
          const eganowFees = feeAmount - hogapayRevenue

          data = {
            payoutFeePercentage: settings.transferFeePercentage ?? 0,
            payoutFeeAmount: feeAmount,
            payoutNetAmount: netAmount,
            chargesBreakdown: {
              platformCharge: feeAmount,
              amountPaidByContributor: amount,
              hogapayRevenue,
              eganowFees,
            },
          }
        } else {
          data = {
            payoutFeePercentage: settings.transferFeePercentage ?? 0,
            payoutFeeAmount: feeAmount,
            payoutNetAmount: netAmount,
            chargesBreakdown: {
              platformCharge: feeAmount,
              amountPaidByContributor: amount,
              hogapayRevenue: 0,
              eganowFees: 0,
            },
          }
        }
      }

      if (Object.keys(data).length > 0) {
        await req.payload.update({
          collection: 'transactions',
          id: tx.id,
          data,
          overrideAccess: true,
        })
        updated++
      }
    }

    return Response.json({
      success: true,
      message: `Recalculated charges for ${updated} of ${all.totalDocs} transactions`,
      settings: {
        collectionFee: `${(collectionFeePercentage * 100).toFixed(2)}%`,
        hogapayCollectionFeePercent: `${hogapayCollectionFeePercent}%`,
        transferFee: `${(transferFeePercentage * 100).toFixed(2)}%`,
        hogapayTransferFeePercent: `${hogapayTransferFeePercent}%`,
      },
    })
  } catch (error: any) {
    return Response.json(
      { success: false, message: 'Recalculation failed', error: error.message },
      { status: 500 },
    )
  }
}
