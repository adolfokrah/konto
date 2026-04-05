import { PayloadRequest } from 'payload'
import { getCharges } from '@/utilities/getCharges'

/**
 * GET /api/transactions/get-collection-minimum?jarId=xxx&paymentMethod=xxx
 *
 * Returns the minimum contribution amount for a given jar and payment method.
 */
export const getCollectionMinimum = async (req: PayloadRequest) => {
  try {
    const url = new URL(req.url || '', 'http://localhost')
    const jarId = url.searchParams.get('jarId')
    const paymentMethod = url.searchParams.get('paymentMethod') ?? undefined

    if (!jarId) {
      return Response.json({ success: false, message: 'jarId is required' }, { status: 400 })
    }

    const jar = await req.payload.findByID({
      collection: 'jars',
      id: jarId,
      depth: 1,
      overrideAccess: true,
    })

    if (!jar) {
      return Response.json({ success: false, message: 'Jar not found' }, { status: 404 })
    }

    const feePaidBy =
      ((jar as any)?.collectionFeePaidBy as 'contributor' | 'jar-creator') || 'contributor'
    const creator = (jar as any)?.creator
    const country =
      (typeof creator === 'object' ? creator?.country : undefined)?.toLowerCase().trim() ??
      undefined

    const charges = await getCharges(req.payload, {
      amount: 0,
      type: 'contribution',
      collectionFeePaidBy: feePaidBy,
      paymentMethod,
      country,
    })

    return Response.json({
      success: true,
      minimumContributionAmount: charges.minimumContributionAmount,
    })
  } catch (error: any) {
    return Response.json(
      { success: false, message: error.message || 'Failed to fetch collection minimum' },
      { status: 500 },
    )
  }
}
