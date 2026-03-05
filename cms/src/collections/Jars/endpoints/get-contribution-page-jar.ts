import type { PayloadRequest } from 'payload'

/**
 * Public endpoint to get jar data for the contribution page.
 * No authentication required — returns jar info, system settings,
 * and total contributions for an open jar.
 */
export const getContributionPageJar = async (req: PayloadRequest) => {
  const jarId = req.routeParams?.id as string

  if (!jarId) {
    return Response.json({ success: false, message: 'Jar ID is required' }, { status: 400 })
  }

  try {
    const jar = await req.payload.find({
      collection: 'jars',
      where: {
        id: { equals: jarId },
        status: { equals: 'open' },
      },
      depth: 2,
      limit: 1,
      overrideAccess: true,
    })

    if (jar.docs.length === 0) {
      return Response.json(
        { success: false, message: 'Jar not found or not open' },
        { status: 404 },
      )
    }

    const jarDoc = jar.docs[0]

    // Get system settings for transaction fee
    const systemSettings = await req.payload.findGlobal({
      slug: 'system-settings',
      overrideAccess: true,
    })

    // Get completed contributions total
    const contributions = await req.payload.find({
      collection: 'transactions',
      where: {
        jar: { equals: jarId },
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
      },
      pagination: false,
      select: { amountContributed: true },
      overrideAccess: true,
    })

    const totalContributedAmount = contributions.docs.reduce(
      (sum: number, tx: any) => sum + (tx.amountContributed || 0),
      0,
    )

    return Response.json({
      success: true,
      data: {
        ...jarDoc,
        balanceBreakDown: {
          totalContributedAmount: Number(totalContributedAmount.toFixed(2)),
        },
      },
      systemSettings: {
        collectionFee: systemSettings.collectionFee,
      },
    })
  } catch (error) {
    console.error('Error fetching contribution page jar:', error)
    return Response.json({ success: false, message: 'Failed to fetch jar data' }, { status: 500 })
  }
}
