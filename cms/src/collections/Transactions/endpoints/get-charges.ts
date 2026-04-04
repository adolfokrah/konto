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
      const paymentMethod = url.searchParams.get('paymentMethod') ?? undefined
      const country = url.searchParams.get('country') ?? undefined
      const charges = await calculateCharges(req.payload, {
        amount: amountContributed,
        type: 'payout',
        paymentMethod,
        country: country?.toLowerCase().trim(),
      })
      return Response.json({ success: true, ...charges })
    }

    const jarId = url.searchParams.get('jarId')
    let feePaidBy: 'contributor' | 'jar-creator' = 'contributor'
    let creatorCountry: string | undefined
    if (jarId) {
      try {
        const jar = await req.payload.findByID({
          collection: 'jars',
          id: jarId,
          depth: 1,
          overrideAccess: true,
        })
        feePaidBy =
          ((jar as any)?.collectionFeePaidBy as 'contributor' | 'jar-creator') || 'contributor'
        const creator = (jar as any)?.creator
        const rawCountry: string | undefined =
          typeof creator === 'object' ? creator?.country : undefined
        creatorCountry = rawCountry?.toLowerCase().trim()
      } catch (_) {}
    }

    const paymentMethod = url.searchParams.get('paymentMethod') ?? undefined

    const charges = await calculateCharges(req.payload, {
      amount: amountContributed,
      type: 'contribution',
      collectionFeePaidBy: feePaidBy,
      paymentMethod,
      country: creatorCountry,
    })

    return Response.json({ success: true, ...charges, collectionFeePaidBy: feePaidBy })
  } catch (error: any) {
    return Response.json(
      { success: false, message: error.message || 'Failed to calculate charges' },
      { status: 500 },
    )
  }
}
