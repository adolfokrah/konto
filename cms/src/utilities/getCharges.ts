import type { BasePayload } from 'payload'

export interface ChargesBreakdown {
  initialAmount: number
  processingFee: number
  netAmount: number
  hogapayRevenue: number
  eganowFees: number
  feeRate?: number
  minimumContributionAmount?: number
  minimumPayoutAmount?: number
}

/**
 * Calculates the fee breakdown for a transaction.
 *
 * Looks up fees from the country+paymentMethod based fee collections first
 * (collection-fees / payout-fees), then falls back to system-settings globals.
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
    paymentMethod,
    country,
  }: {
    amount: number
    type?: 'contribution' | 'payout' | 'refund'
    collectionFeePaidBy?: 'contributor' | 'jar-creator'
    paymentMethod?: string
    country?: string
  },
): Promise<ChargesBreakdown> {
  // ── REFUND ────────────────────────────────────────────────────────────────
  if (type === 'refund') {
    let refundFeePercentage = 1
    if (country) {
      try {
        const result = await payload.find({
          collection: 'refund-fees' as any,
          where: { country: { equals: country.toLowerCase().trim() } },
          limit: 1,
          overrideAccess: true,
        })
        if (result.docs.length > 0) {
          refundFeePercentage = (result.docs[0] as any).fee
        }
      } catch (_) {}
    }
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

  // ── PAYOUT ────────────────────────────────────────────────────────────────
  if (type === 'payout') {
    const feeRecord = await resolvePayoutFee(payload, country, paymentMethod)

    let transferFeePercentage: number
    let hogapayTransferFeePercent: number
    let flatFeeThreshold: number
    let flatFeeAmount: number

    if (feeRecord) {
      transferFeePercentage = feeRecord.fee
      hogapayTransferFeePercent = feeRecord.hogapaySplit
      flatFeeThreshold = feeRecord.flatFeeThreshold
      flatFeeAmount = feeRecord.flatFee
    } else {
      // Hard-coded defaults if no fee record found
      transferFeePercentage = 1.3
      hogapayTransferFeePercent = 0.35
      flatFeeThreshold = 100
      flatFeeAmount = 1
    }

    const percentageFee = Math.round(amount * (transferFeePercentage / 100) * 100) / 100
    const flatFee = amount < flatFeeThreshold ? flatFeeAmount : 0
    const processingFee = Math.round((percentageFee + flatFee) * 100) / 100
    const hogapayRevenue = Math.round(amount * (hogapayTransferFeePercent / 100) * 100) / 100
    const eganowFees = Math.round((processingFee - hogapayRevenue) * 100) / 100
    const netAmount = Math.round((amount - processingFee) * 100) / 100
    return {
      initialAmount: amount,
      processingFee,
      netAmount,
      hogapayRevenue,
      eganowFees,
      feeRate: transferFeePercentage,
      minimumPayoutAmount: feeRecord?.minimumPayoutAmount,
    }
  }

  // ── CONTRIBUTION ──────────────────────────────────────────────────────────
  const feeRecord = await resolveCollectionFee(payload, country, paymentMethod)

  let collectionFeePercent: number
  let hogapayCollectionFeePercent: number
  let minimumContributionAmount: number | undefined

  if (feeRecord) {
    collectionFeePercent = feeRecord.fee
    hogapayCollectionFeePercent = feeRecord.hogapaySplit
    minimumContributionAmount = feeRecord.minimumContributionAmount
  } else {
    // Hard-coded defaults if no fee record found
    collectionFeePercent = 1.95
    hogapayCollectionFeePercent = 0.8
    minimumContributionAmount = 2
  }

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

  return {
    initialAmount: amount,
    processingFee,
    netAmount,
    hogapayRevenue,
    eganowFees,
    minimumContributionAmount,
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function resolveCollectionFee(
  payload: BasePayload,
  country?: string,
  paymentMethod?: string,
): Promise<{ fee: number; hogapaySplit: number; minimumContributionAmount?: number } | null> {
  if (!country || !paymentMethod) return null
  try {
    const result = await payload.find({
      collection: 'collection-fees' as any,
      where: { country: { equals: country.toLowerCase().trim() } },
      depth: 1,
      limit: 50,
      overrideAccess: true,
    })
    const match = (result.docs as any[]).find(
      (r) =>
        r.paymentMethod?.slug?.toLowerCase() === paymentMethod.toLowerCase() ||
        r.paymentMethod?.type?.toLowerCase() === paymentMethod.toLowerCase(),
    )
    if (match)
      return {
        fee: match.fee,
        hogapaySplit: match.hogapaySplit,
        minimumContributionAmount: match.minimumContributionAmount,
      }
  } catch (_) {}
  return null
}

async function resolvePayoutFee(
  payload: BasePayload,
  country?: string,
  paymentMethod?: string,
): Promise<{
  fee: number
  hogapaySplit: number
  flatFeeThreshold: number
  flatFee: number
  minimumPayoutAmount?: number
} | null> {
  if (!country || !paymentMethod) return null
  try {
    const result = await payload.find({
      collection: 'payout-fees' as any,
      where: { country: { equals: country.toLowerCase().trim() } },
      depth: 1,
      limit: 50,
      overrideAccess: true,
    })
    const match = (result.docs as any[]).find(
      (r) =>
        r.paymentMethod?.slug?.toLowerCase() === paymentMethod.toLowerCase() ||
        r.paymentMethod?.type?.toLowerCase() === paymentMethod.toLowerCase(),
    )
    if (match)
      return {
        fee: match.fee,
        hogapaySplit: match.hogapaySplit,
        flatFeeThreshold: match.flatFeeThreshold,
        flatFee: match.flatFee,
        minimumPayoutAmount: match.minimumPayoutAmount,
      }
  } catch (_) {}
  return null
}
