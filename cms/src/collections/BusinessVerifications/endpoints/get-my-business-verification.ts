import { PayloadRequest } from 'payload'

/**
 * Return the authenticated user's latest business verification (status + reason),
 * or a `none` status if they have not submitted yet.
 */
export const getMyBusinessVerification = async (req: PayloadRequest) => {
  try {
    if (!req.user) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    const res = await req.payload.find({
      collection: 'business-verifications',
      where: { user: { equals: req.user.id } },
      limit: 1,
      sort: '-createdAt',
      overrideAccess: true,
    })

    const doc = res.docs[0] as any

    return Response.json({
      success: true,
      data: doc
        ? {
            id: doc.id,
            status: doc.status,
            rejectionReason: doc.rejectionReason ?? null,
            businessName: doc.businessName ?? null,
          }
        : { status: 'none' },
    })
  } catch (error: any) {
    return Response.json(
      { success: false, message: error?.message || 'Failed to fetch business verification' },
      { status: 500 },
    )
  }
}
