export interface ChargesInput {
  amountContributed: number
  hogapayCollectionFeePercent: number // e.g. 0.8
  collectionFeePercent: number // total e.g. 2
  discountPercent?: number // 0-100, from user.hogapayDiscountPercent
}

export interface ChargesResult {
  platformCharge: number // total fee added on top
  amountPaidByContributor: number // what contributor pays
  hogapayRevenue: number // Hogapay's cut after discount
  discountPercent: number // 0 if no discount
  discountAmount: number // GHS Hogapay absorbs (0 if no discount)
}

/**
 * Calculates platform charges for a mobile-money contribution.
 *
 * Math:
 *   discountAmount          = amountContributed × hogapayFee% × discountPercent / 100
 *   hogapayRevenue          = amountContributed × hogapayFee% × (1 - discountPercent / 100)
 *   amountPaidByContributor = amountContributed × (1 + totalFee%)
 *   platformCharge          = amountPaidByContributor - amountContributed
 */
export function calculateCharges(input: ChargesInput): ChargesResult {
  const {
    amountContributed,
    hogapayCollectionFeePercent,
    collectionFeePercent,
    discountPercent = 0,
  } = input

  const hogapayFee = hogapayCollectionFeePercent / 100

  const fullHogapayRevenue = amountContributed * hogapayFee
  const discountAmount = fullHogapayRevenue * (discountPercent / 100)
  const hogapayRevenue = fullHogapayRevenue - discountAmount

  const amountPesewas = Math.round(amountContributed * 100)
  const feeMultiplierBps = Math.round(collectionFeePercent * 100) + 10000
  const amountPaidPesewas = Math.ceil((amountPesewas * feeMultiplierBps) / 10000)
  const amountPaidByContributor = amountPaidPesewas / 100

  const platformCharge = amountPaidByContributor - amountContributed

  return {
    platformCharge: round2(platformCharge),
    amountPaidByContributor: round2(amountPaidByContributor),
    hogapayRevenue: round2(hogapayRevenue),
    discountPercent,
    discountAmount: round2(discountAmount),
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}
