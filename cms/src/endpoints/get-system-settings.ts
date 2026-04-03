import type { PayloadRequest } from 'payload'

/**
 * GET /api/system-settings?country=ghana
 *
 * Returns per-country settings: min contribution, min payout, settlement delay.
 * - settlementDelayHours from settlement-delays collection
 * - minimumContributionAmount from collection-fees (minimum across all methods for the country)
 * - minimumPayoutAmount from payout-fees (minimum across all methods for the country)
 */
export const getSystemSettings = async (req: PayloadRequest) => {
  try {
    const { payload } = req
    const url = new URL(req.url || '', 'http://localhost')
    const country = url.searchParams.get('country')?.toLowerCase()

    let minimumContributionAmount = 2
    let minimumPayoutAmount = 10
    let settlementDelayHours = 0.033

    if (country) {
      const [delayResult, collectionFeesResult, payoutFeesResult] = await Promise.all([
        payload.find({
          collection: 'settlement-delays' as any,
          where: { country: { equals: country } },
          limit: 1,
          overrideAccess: true,
        }),
        payload.find({
          collection: 'collection-fees' as any,
          where: { country: { equals: country } },
          limit: 100,
          overrideAccess: true,
        }),
        payload.find({
          collection: 'payout-fees' as any,
          where: { country: { equals: country } },
          limit: 100,
          overrideAccess: true,
        }),
      ])

      const delayDoc = delayResult.docs[0] as any
      if (delayDoc) {
        settlementDelayHours = delayDoc.hours ?? settlementDelayHours
      }

      const collectionFeeAmounts = (collectionFeesResult.docs as any[])
        .map((d) => d.minimumContributionAmount)
        .filter((v) => v != null)
      if (collectionFeeAmounts.length > 0) {
        minimumContributionAmount = Math.min(...collectionFeeAmounts)
      }

      const payoutFeeAmounts = (payoutFeesResult.docs as any[])
        .map((d) => d.minimumPayoutAmount)
        .filter((v) => v != null)
      if (payoutFeeAmounts.length > 0) {
        minimumPayoutAmount = Math.min(...payoutFeeAmounts)
      }
    }

    return Response.json(
      {
        success: true,
        data: {
          minimumContributionAmount,
          minimumPayoutAmount,
          settlementDelayHours,
        },
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error('Error fetching system settings:', error)
    return Response.json(
      { success: false, message: 'Failed to fetch system settings', error: error.message },
      { status: 500 },
    )
  }
}
