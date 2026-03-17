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
    const [contributions, recentContributors] = await Promise.all([
      req.payload.find({
        collection: 'transactions',
        where: {
          jar: { equals: jarId },
          paymentStatus: { equals: 'completed' },
          type: { equals: 'contribution' },
        },
        pagination: false,
        select: { amountContributed: true },
        overrideAccess: true,
      }),
      req.payload.find({
        collection: 'transactions',
        where: {
          jar: { equals: jarId },
          paymentStatus: { equals: 'completed' },
          type: { equals: 'contribution' },
        },
        limit: 10,
        sort: '-createdAt',
        depth: 2,
        overrideAccess: true,
      }),
    ])

    const totalContributedAmount = contributions.docs.reduce(
      (sum: number, tx: any) => sum + (tx.amountContributed || 0),
      0,
    )

    // Build deduplicated contributor avatars (dedupe by name, photo from collector if available)
    const seenNames = new Set<string>()
    const contributorAvatars: { initials: string; photoUrl: string | null }[] = []
    for (const tx of recentContributors.docs as any[]) {
      const name: string = tx.contributor || ''
      if (!name || seenNames.has(name)) continue
      seenNames.add(name)

      const parts = name.trim().split(' ').filter(Boolean)
      const initials =
        parts.length >= 2
          ? (parts[0][0] + parts[1][0]).toUpperCase()
          : (parts[0]?.[0] ?? '?').toUpperCase()

      const photo = typeof tx.collector === 'object' ? tx.collector?.photo : null
      const photoUrl =
        photo && typeof photo === 'object'
          ? (photo.sizes?.thumbnail?.url ?? photo.url ?? null)
          : null

      contributorAvatars.push({ initials, photoUrl })
      if (contributorAvatars.length >= 3) break
    }

    return Response.json({
      success: true,
      data: {
        ...jarDoc,
        balanceBreakDown: {
          totalContributedAmount: Number(totalContributedAmount.toFixed(2)),
        },
      },
      donorCount: contributions.totalDocs,
      contributorAvatars,
      systemSettings: {
        collectionFee: systemSettings.collectionFee,
      },
    })
  } catch (error) {
    console.error('Error fetching contribution page jar:', error)
    return Response.json({ success: false, message: 'Failed to fetch jar data' }, { status: 500 })
  }
}
