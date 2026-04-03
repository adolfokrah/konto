import type { BasePayload } from 'payload'

export interface ChargesBreakdown {
  initialAmount: number
  processingFee: number
  netAmount: number
  hogapayRevenue: number
  eganowFees: number
  minimumContributionAmount?: number
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
  const settings = await payload.findGlobal({ slug: 'system-settings', overrideAccess: true })

  // ── REFUND ────────────────────────────────────────────────────────────────
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

  // ── PAYOUT ────────────────────────────────────────────────────────────────
  if (type === 'payout') {
    const s = settings as any

    let transferFeePercentage: number
    let hogapayTransferFeePercent: number
    let flatFeeThreshold: number
    let flatFeeAmount: number

    // Try country+paymentMethod based payout-fees collection first
    const feeRecord = await resolvePayoutFee(payload, country, paymentMethod)

    if (feeRecord) {
      transferFeePercentage = feeRecord.fee
      hogapayTransferFeePercent = feeRecord.hogapaySplit
      flatFeeThreshold = feeRecord.flatFeeThreshold
      flatFeeAmount = feeRecord.flatFee
    } else {
      // Fall back to system-settings
      const isBank = paymentMethod === 'bank' || paymentMethod === 'bank-transfer'
      transferFeePercentage = isBank
        ? (s?.bankPayoutFeePercentage ?? s?.transferFeePercentage ?? 0)
        : (s?.transferFeePercentage ?? 0)
      hogapayTransferFeePercent = isBank
        ? (s?.hogapayBankPayoutFeePercent ?? s?.hogapayTransferFeePercent ?? 0)
        : (s?.hogapayTransferFeePercent ?? 0)
      flatFeeThreshold = isBank
        ? (s?.bankPayoutFlatFeeThreshold ?? s?.payoutFlatFeeThreshold ?? 100)
        : (s?.payoutFlatFeeThreshold ?? 100)
      flatFeeAmount = isBank
        ? (s?.bankPayoutFlatFeeAmount ?? s?.payoutFlatFeeAmount ?? 1)
        : (s?.payoutFlatFeeAmount ?? 1)
    }

    const percentageFee = Math.round(amount * (transferFeePercentage / 100) * 100) / 100
    const flatFee = amount < flatFeeThreshold ? flatFeeAmount : 0
    const processingFee = Math.round((percentageFee + flatFee) * 100) / 100
    const hogapayRevenue = Math.round(amount * (hogapayTransferFeePercent / 100) * 100) / 100
    const eganowFees = Math.round((processingFee - hogapayRevenue) * 100) / 100
    const netAmount = Math.round((amount - processingFee) * 100) / 100
    return { initialAmount: amount, processingFee, netAmount, hogapayRevenue, eganowFees }
  }

  // ── CONTRIBUTION ──────────────────────────────────────────────────────────
  const s = settings as any
  let collectionFeePercent: number
  let hogapayCollectionFeePercent: number

  // Try country+paymentMethod based collection-fees collection first
  const feeRecord = await resolveCollectionFee(payload, country, paymentMethod)

  let minimumContributionAmount: number | undefined
  if (feeRecord) {
    collectionFeePercent = feeRecord.fee
    hogapayCollectionFeePercent = feeRecord.hogapaySplit
    minimumContributionAmount = feeRecord.minimumContributionAmount
  } else {
    // Fall back to system-settings per payment method
    if (paymentMethod === 'mobile-money') {
      collectionFeePercent = s?.mobileMoneyCollectionFee ?? 1.95
      hogapayCollectionFeePercent = s?.mobileMoneyHogapayFeePercent ?? 0.8
    } else if (paymentMethod === 'bank' || paymentMethod === 'bank-transfer') {
      collectionFeePercent = s?.bankTransferCollectionFee ?? 1.95
      hogapayCollectionFeePercent = s?.bankTransferHogapayFeePercent ?? 0.8
    } else if (paymentMethod === 'card') {
      collectionFeePercent = s?.cardCollectionFee ?? 1.95
      hogapayCollectionFeePercent = s?.cardHogapayFeePercent ?? 0.8
    } else {
      collectionFeePercent = s?.mobileMoneyCollectionFee ?? 1.95
      hogapayCollectionFeePercent = s?.mobileMoneyHogapayFeePercent ?? 0.8
    }
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
      where: { country: { equals: country.toLowerCase() } },
      depth: 1,
      limit: 50,
      overrideAccess: true,
    })
    const match = (result.docs as any[]).find(
      (r) => r.paymentMethod?.type?.toLowerCase() === paymentMethod.toLowerCase(),
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
} | null> {
  if (!country || !paymentMethod) return null
  try {
    const result = await payload.find({
      collection: 'payout-fees' as any,
      where: { country: { equals: country.toLowerCase() } },
      depth: 1,
      limit: 50,
      overrideAccess: true,
    })
    const match = (result.docs as any[]).find(
      (r) => r.paymentMethod?.type?.toLowerCase() === paymentMethod.toLowerCase(),
    )
    if (match)
      return {
        fee: match.fee,
        hogapaySplit: match.hogapaySplit,
        flatFeeThreshold: match.flatFeeThreshold,
        flatFee: match.flatFee,
      }
  } catch (_) {}
  return null
}
