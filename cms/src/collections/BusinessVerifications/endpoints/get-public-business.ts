import type { PayloadRequest } from 'payload'

/**
 * Public detail for one APPROVED organization, keyed by the owner's USER id
 * (so the mobile app can share `/organizations/{userId}` without a lookup):
 * profile + all their open jars (campaigns) so a contributor can pick one
 * and jump to the contribution page (/pay/[jarId]/[name]).
 */
export const getPublicBusiness = async (req: PayloadRequest) => {
  const id = req.routeParams?.id as string
  if (!id) {
    return Response.json({ success: false, message: 'User ID is required' }, { status: 400 })
  }

  try {
    const res = await req.payload.find({
      collection: 'business-verifications',
      where: { user: { equals: id }, status: { equals: 'approved' } },
      depth: 2,
      limit: 1,
      sort: '-createdAt',
      overrideAccess: true,
    })

    const b: any = res.docs[0]
    if (!b) {
      return Response.json(
        { success: false, message: 'Business not found or not approved' },
        { status: 404 },
      )
    }

    const user = typeof b.user === 'object' ? b.user : null
    if (!user) {
      return Response.json({ success: false, message: 'Business owner not found' }, { status: 404 })
    }

    const jars = await req.payload.find({
      collection: 'jars',
      where: { creator: { equals: user.id }, status: { equals: 'open' } },
      depth: 2, // populate jar image
      pagination: false,
      sort: '-createdAt',
      overrideAccess: true,
    })

    const campaigns = await Promise.all(
      jars.docs.map(async (j: any) => {
        const tx = await req.payload.find({
          collection: 'transactions',
          where: {
            jar: { equals: j.id },
            paymentStatus: { equals: 'completed' },
            type: { equals: 'contribution' },
          },
          pagination: false,
          select: { amountContributed: true },
          overrideAccess: true,
        })
        const raised = tx.docs.reduce((s: number, t: any) => s + (t.amountContributed || 0), 0)

        const img = j.image
        const imageUrl =
          img && typeof img === 'object'
            ? (img.sizes?.card?.url ?? img.sizes?.thumbnail?.url ?? img.url ?? null)
            : null

        return {
          id: j.id,
          name: j.name,
          imageUrl,
          goalAmount: j.goalAmount ?? null,
          currency: j.currency ?? 'GHS',
          showGoal: j.paymentPage?.showGoal === true,
          donationLabel: j.paymentPage?.donationLabel === 'donate' ? 'donate' : 'contribute',
          raised: Number(raised.toFixed(2)),
          donors: tx.totalDocs,
          deadline: j.deadline ?? null,
        }
      }),
    )

    const photo = user.photo
    const photoUrl =
      photo && typeof photo === 'object'
        ? (photo.sizes?.card?.url ?? photo.sizes?.thumbnail?.url ?? photo.url ?? null)
        : null

    return Response.json({
      success: true,
      data: {
        id: b.id,
        businessName: b.businessName ?? 'Business',
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        username: user.username ?? null,
        country: user.country ?? null,
        photoUrl,
        campaignCount: jars.totalDocs,
        supporters: campaigns.reduce((s, c) => s + c.donors, 0),
        campaigns,
      },
    })
  } catch (error) {
    console.error('Error fetching public business:', error)
    return Response.json({ success: false, message: 'Failed to load business' }, { status: 500 })
  }
}
