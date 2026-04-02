import type { BasePayload } from 'payload'

export interface ChargesBreakdown {
  platformCharge: number
  amountPaidByContributor: number
  hogapayRevenue: number
  eganowFees: number
  discountPercent: number
  discountAmount: number
  amountToSendToEganow: number
  minimumContributionAmount: number
}

/**
 * Calculates the Paystack fee passthrough breakdown for a given contribution amount.
 * Formula: charge = (amount / (1 - feeRate)) + 0.01
 */
export async function calculatePaystackCharges(
  amount: number,
  payload: BasePayload,
): Promise<ChargesBreakdown> {
  const settings = await payload.findGlobal({ slug: 'system-settings', overrideAccess: true })
  const minimumContributionAmount = (settings as any)?.minimumContributionAmount ?? 2

  const feeRate = 0.0195
  const rawCharge = amount / (1 - feeRate) + 0.01
  const amountPaidByContributor = Math.round(rawCharge * 100) / 100
  const platformCharge = Math.round((amountPaidByContributor - amount) * 100) / 100

  return {
    platformCharge,
    amountPaidByContributor,
    hogapayRevenue: 0,
    eganowFees: platformCharge,
    discountPercent: 0,
    discountAmount: 0,
    amountToSendToEganow: amount,
    minimumContributionAmount,
  }
}
