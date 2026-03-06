import type { PayloadRequest } from 'payload'

/**
 * Public endpoint to get recent contributions for a jar.
 * No authentication required — used on the public contribution page.
 * GET /api/jars/:id/recent-contributions?limit=5&page=1
 */
export const getRecentContributions = async (req: PayloadRequest) => {
  const jarId = req.routeParams?.id as string

  if (!jarId) {
    return Response.json({ success: false, message: 'Jar ID is required' }, { status: 400 })
  }

  try {
    const url = new URL(req.url || '', 'http://localhost')
    const limit = Math.min(Number(url.searchParams.get('limit')) || 5, 50)
    const page = Number(url.searchParams.get('page')) || 1

    const contributions = await req.payload.find({
      collection: 'transactions',
      where: {
        jar: { equals: jarId },
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
      },
      limit,
      page,
      sort: '-createdAt',
      depth: 0,
      select: {
        contributor: true,
        amountContributed: true,
        createdAt: true,
        type: true,
      },
      overrideAccess: true,
    })

    return Response.json({
      success: true,
      docs: contributions.docs,
      totalDocs: contributions.totalDocs,
      totalPages: contributions.totalPages,
      hasNextPage: contributions.hasNextPage,
      page: contributions.page,
    })
  } catch (error) {
    console.error('Error fetching recent contributions:', error)
    return Response.json(
      { success: false, message: 'Failed to fetch contributions' },
      { status: 500 },
    )
  }
}
