import type { BasePayload } from 'payload'

export interface ChargesBreakdown {
  initialAmount: number
  processingFee: number
  netAmount: number
  hogapayRevenue: number
  eganowFees: number
}

/**
 * Calculates the fee breakdown for a transaction.
 *
 * type = 'contribution', collectionFeePaidBy = 'contributor':
 *   processingFee is added on top — contributor pays initialAmount + processingFee
 *   netAmount = initialAmount (jar receives the full base amount)
 *
 * type = 'contribution', collectionFeePaidBy = 'jar-creator':
 *   processingFee is deducted from jar — contributor pays initialAmount
 *   netAmount = initialAmount - processingFee
 *
 * type = 'payout':
 *   processingFee deducted from payout amount
 *   netAmount = initialAmount - processingFee (what user receives)
 *
 * type = 'refund':
 *   processingFee deducted from refund amount
 *   netAmount = initialAmount - processingFee
 */
export async function getCharges(
  payload: BasePayload,
  {
    amount,
    type = 'contribution',
    collectionFeePaidBy,
  }: {
    amount: number
    type?: 'contribution' | 'payout' | 'refund'
    collectionFeePaidBy?: 'contributor' | 'jar-creator'
  },
): Promise<ChargesBreakdown> {
  const settings = await payload.findGlobal({ slug: 'system-settings', overrideAccess: true })

  if (type === 'refund') {
    const refundFeePercentage = (settings as any)?.refundFeePercentage ?? 1
    const processingFee = Math.round(amount * (refundFeePercentage / 100) * 100) / 100
    const netAmount = Math.round((amount - processingFee) * 100) / 100
    return {
      initialAmount: amount,
      processingFee,
      netAmount,
      hogapayRevenue: processingFee,
      eganowFees: 0,
    }
  }

  if (type === 'payout') {
    const transferFeePercentage = (settings as any)?.transferFeePercentage ?? 0
    const hogapayTransferFeePercent = (settings as any)?.hogapayTransferFeePercent ?? 0
    const processingFee = Math.round(amount * (transferFeePercentage / 100) * 100) / 100
    const hogapayRevenue = Math.round(amount * (hogapayTransferFeePercent / 100) * 100) / 100
    const eganowFees = Math.round((processingFee - hogapayRevenue) * 100) / 100
    const netAmount = Math.round((amount - processingFee) * 100) / 100
    return { initialAmount: amount, processingFee, netAmount, hogapayRevenue, eganowFees }
  }

  // type === 'contribution'
  const collectionFeePercent = (settings as any)?.collectionFee ?? 1.95
  const hogapayCollectionFeePercent = (settings as any)?.hogapayCollectionFeePercent ?? 0.8
  const feeRate = collectionFeePercent / 100

  let processingFee: number
  let netAmount: number

  if ((collectionFeePaidBy ?? 'contributor') === 'jar-creator') {
    processingFee = Math.round(amount * feeRate * 100) / 100
    netAmount = Math.round((amount - processingFee) * 100) / 100
  } else {
    const grossCharge = amount / (1 - feeRate) + 0.01
    const amountPaid = Math.round(grossCharge * 100) / 100
    processingFee = Math.round((amountPaid - amount) * 100) / 100
    netAmount = amount
  }

  const hogapayRevenue = Math.round(amount * (hogapayCollectionFeePercent / 100) * 100) / 100
  const eganowFees = Math.round((processingFee - hogapayRevenue) * 100) / 100

  return { initialAmount: amount, processingFee, netAmount, hogapayRevenue, eganowFees }
}
