import { PayloadRequest } from 'payload'
import { getCharges as calculateCharges } from '@/utilities/getCharges'

/**
 * GET /api/transactions/get-charges?amount=100&jarId=xxx
 *
 * Returns the full charge breakdown for a given amount.
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

    const type = url.searchParams.get('type')
    if (type === 'payout') {
      return Response.json({
        success: true,
        originalAmount: amountContributed,
        processingFee: 0,
        netAmount: amountContributed,
      })
    }

    const jarId = url.searchParams.get('jarId')
    let feePaidBy: 'contributor' | 'jar-creator' = 'contributor'
    if (jarId) {
      try {
        const jar = await req.payload.findByID({
          collection: 'jars',
          id: jarId,
          depth: 0,
          overrideAccess: true,
        })
        feePaidBy =
          ((jar as any)?.collectionFeePaidBy as 'contributor' | 'jar-creator') || 'contributor'
      } catch (_) {}
    }

    const charges = await calculateCharges(req.payload, {
      amount: amountContributed,
      type: 'contribution',
      collectionFeePaidBy: feePaidBy,
    })

    return Response.json({ success: true, ...charges, collectionFeePaidBy: feePaidBy })
  } catch (error: any) {
    return Response.json(
      { success: false, message: error.message || 'Failed to calculate charges' },
      { status: 500 },
    )
  }
}
