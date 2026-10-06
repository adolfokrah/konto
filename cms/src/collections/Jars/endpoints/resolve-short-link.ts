import type { PayloadRequest } from 'payload'

/**
 * GET /api/jars/short/:code?username=<collector>
 *
 * Public: resolves a short share link to the jar it opens (and the collector to attribute
 * contributions to). The /j/<code> page route calls this through the API rather than its
 * own database, the same way the pay page loads jars, so short links work on every
 * deployment of the site.
 */
export const resolveShortLink = async (req: PayloadRequest) => {
  const code = req.routeParams?.code as string
  if (!code) {
    return Response.json({ success: false, message: 'Code is required' }, { status: 400 })
  }

  const jar = (
    await req.payload.find({
      collection: 'jars',
      where: { shortCode: { equals: code } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
  ).docs[0]
  if (!jar) {
    return Response.json({ success: false, message: 'Link not found' }, { status: 404 })
  }

  let collectorId: string | null = null
  const username = String(req.searchParams?.get('username') ?? '')
    .trim()
    .toLowerCase()
  if (username) {
    // An unknown username still opens the jar, just without collector attribution.
    collectorId =
      (
        await req.payload.find({
          collection: 'users',
          where: { username: { equals: username } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
      ).docs[0]?.id ?? null
  }

  return Response.json({
    success: true,
    data: { jarId: jar.id, name: jar.name, collectorId },
  })
}
