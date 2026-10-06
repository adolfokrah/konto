import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

import configPromise from '@payload-config'

/**
 * Short share links: /j/<code> and /j/<code>/<username>.
 *
 * Resolves the jar's short code (and the collector's username, when present) and redirects
 * to the full contribution page, /pay/<jarId>/<name>?collectorId=<userId>, so the page
 * itself and collector attribution work exactly as before.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string; username?: string[] }> },
): Promise<Response> {
  const { code, username } = await params
  const payload = await getPayload({ config: configPromise })

  const jarResult = await payload.find({
    collection: 'jars',
    where: { shortCode: { equals: code } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const jar = jarResult.docs[0]
  if (!jar) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const target = new URL(
    `/pay/${jar.id}/${encodeURIComponent(String(jar.name).trim().replace(/\s+/g, '-'))}`,
    req.url,
  )
  // Keep any extra query params (e.g. utm tags) the link was shared with.
  req.nextUrl.searchParams.forEach((value, key) => target.searchParams.set(key, value))

  const handle = username?.[0]?.trim().toLowerCase()
  if (handle) {
    const userResult = await payload.find({
      collection: 'users',
      where: { username: { equals: handle } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    // An unknown username still opens the jar, just without collector attribution.
    if (userResult.docs[0]) target.searchParams.set('collectorId', userResult.docs[0].id)
  }

  return NextResponse.redirect(target)
}
