import { PayloadRequest } from 'payload'
import { calculateCharges } from '../../../utilities/calculateCharges'

/**
 * GET /api/transactions/get-charges?amount=100&jarId=xxx
 *          OR ?amount=100&userId=xxx  (userId still supported directly)
 *
 * Returns the full charge breakdown for a given amount.
 * Resolves the discount percent from the jar creator (via jarId) or directly from userId.
 * Does not require authentication (public — used on contribution pages).
 */
export const getCharges = async (req: PayloadRequest) => {
  try {
    const url = new URL(req.url || '', 'http://localhost')
    const amountParam = url.searchParams.get('amount')
    const jarId = url.searchParams.get('jarId')
    const userId = url.searchParams.get('userId')

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

    // Fetch system settings for fee percentages
    const settings = await req.payload.findGlobal({
      slug: 'system-settings',
      overrideAccess: true,
    })

    const hogapayCollectionFeePercent = (settings.hogapayCollectionFeePercent ?? 0.8) as number
    const collectionFeePercent = (settings.collectionFee ?? 2) as number

    // Resolve the user ID: from jarId (look up creator) or directly from userId param
    let resolvedUserId: string | null = userId

    if (jarId && !resolvedUserId) {
      try {
        const jar = await req.payload.findByID({
          collection: 'jars',
          id: jarId,
          depth: 0,
          overrideAccess: true,
        })
        const creator = (jar as any).creator
        resolvedUserId = typeof creator === 'object' ? creator?.id : (creator ?? null)
        console.log(
          `[get-charges] jarId=${jarId} creator=${JSON.stringify(creator)} resolvedUserId=${resolvedUserId}`,
        )
      } catch (e: any) {
        console.warn(`[get-charges] Jar ${jarId} not found:`, e.message)
      }
    }

    // Fetch the resolved user's discount percent
    let discountPercent = 0
    if (resolvedUserId) {
      try {
        const user = await req.payload.findByID({
          collection: 'users',
          id: resolvedUserId,
          depth: 0,
          overrideAccess: true,
        })
        discountPercent = (user as any).hogapayDiscountPercent ?? 0
        console.log(
          `[get-charges] resolvedUserId=${resolvedUserId} hogapayDiscountPercent=${discountPercent}`,
        )
      } catch (e: any) {
        console.warn(`[get-charges] User ${resolvedUserId} not found:`, e.message)
      }
    } else {
      console.warn(`[get-charges] No resolvedUserId for jarId=${jarId} userId=${userId}`)
    }

    const result = calculateCharges({
      amountContributed,
      hogapayCollectionFeePercent,
      collectionFeePercent,
      discountPercent,
    })

    return Response.json({ success: true, ...result })
  } catch (error: any) {
    console.error('[get-charges] Error:', error.message)
    return Response.json(
      { success: false, message: error.message || 'Failed to calculate charges' },
      { status: 500 },
    )
  }
}
