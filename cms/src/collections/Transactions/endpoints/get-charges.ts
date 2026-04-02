import { PayloadRequest } from 'payload'

/**
 * GET /api/transactions/get-charges?amount=100&jarId=xxx
 *          OR ?amount=100&userId=xxx  (userId still supported directly)
 *
 * Returns the full charge breakdown for a given amount.
 * Processing fee is currently 0.
 */
export const getCharges = async (req: PayloadRequest) => {
  try {
    const url = new URL(req.url || '', 'http://localhost')
    const amountParam = url.searchParams.get('amount')

    if (!amountParam) {
      return Response.json({ success: false, message: 'amount is required' }, { status: 400 })
    }

    const amountContributed = parseFloat(amountParam)
    if (isNaN(amountContributed) || amountContributed <= 0) {
      return Response.json(
        { success: false, message: 'amount must be a positive number' },
        { status: 400 },
      )
    }

    const settings = await req.payload.findGlobal({ slug: 'system-settings', overrideAccess: true })
    const minimumContributionAmount = (settings as any)?.minimumContributionAmount ?? 2

    return Response.json({
      success: true,
      platformCharge: 0,
      amountPaidByContributor: amountContributed,
      hogapayRevenue: 0,
      eganowFees: 0,
      discountPercent: 0,
      discountAmount: 0,
      amountToSendToEganow: amountContributed,
      minimumContributionAmount,
    })
  } catch (error: any) {
    return Response.json(
      { success: false, message: error.message || 'Failed to calculate charges' },
      { status: 500 },
    )
  }
}
