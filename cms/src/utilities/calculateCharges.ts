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
  eganowFees: number // Eganow's cut
  discountPercent: number // 0 if no discount
  discountAmount: number // GHS Hogapay absorbs (0 if no discount)
}

/**
 * Calculates all charges for a mobile-money contribution.
 *
 * Math:
 *   discountAmount     = amountContributed × (hogapayFee%) × (discountPercent / 100)
 *   amountToEganow     = amountContributed - discountAmount
 *   eganowCharge       = amountToEganow × (eganowFee%)
 *   hogapayRevenue     = amountContributed × (hogapayFee%) × (1 - discountPercent / 100)
 *   platformCharge     = eganowCharge + hogapayRevenue   (total added on top for contributor)
 *   amountPaidByContributor = amountToEganow × (1 + totalFee%)
 */
export function calculateCharges(input: ChargesInput): ChargesResult {
  const {
    amountContributed,
    hogapayCollectionFeePercent,
    collectionFeePercent,
    discountPercent = 0,
  } = input

  const hogapayFee = hogapayCollectionFeePercent / 100
  const totalFee = collectionFeePercent / 100
  const eganowFeePercent = totalFee - hogapayFee // e.g. 2% - 0.8% = 1.2%

  const fullHogapayRevenue = amountContributed * hogapayFee // e.g. 0.80
  const discountAmount = fullHogapayRevenue * (discountPercent / 100) // e.g. 0.56 at 70%
  const hogapayRevenue = fullHogapayRevenue - discountAmount // e.g. 0.24

  const amountToSendToEganow = amountContributed - discountAmount // used internally for fee calc

  // Mirror Eganow's internal pesewa arithmetic: convert to pesewas, apply fee, ceil, convert back.
  // Use integer multiplier (basis points) to avoid IEEE 754 floating point errors where
  // e.g. 5000 * 1.02 = 5100.0000000000001, causing Math.ceil to round up by 1 extra pesewa.
  const amountToSendPesewas = Math.round(amountToSendToEganow * 100)
  const feeMultiplierBps = Math.round(collectionFeePercent * 100) + 10000 // e.g. 10200 for 2%
  const amountPaidPesewas = Math.ceil((amountToSendPesewas * feeMultiplierBps) / 10000)
  const amountPaidByContributor = amountPaidPesewas / 100

  const eganowFees = amountToSendToEganow * eganowFeePercent // Eganow's cut
  const platformCharge = amountPaidByContributor - amountToSendToEganow

  return {
    platformCharge: round2(platformCharge),
    amountPaidByContributor: round2(amountPaidByContributor),
    hogapayRevenue: round2(hogapayRevenue),
    eganowFees: round2(eganowFees),
    discountPercent,
    discountAmount: round2(discountAmount),
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}
