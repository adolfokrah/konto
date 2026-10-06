import { NextRequest, NextResponse } from 'next/server'

import { publicOrigin } from '@/utilities/publicOrigin'

/**
 * Short share links: /j/<code> and /j/<code>/<username>.
 *
 * Resolves the jar's short code (and the collector's username, when present) through the
 * API and redirects to the full contribution page, /pay/<jarId>/<name>?collectorId=<userId>,
 * so the page itself and collector attribution work exactly as before.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string; username?: string[] }> },
): Promise<Response> {
  const { code, username } = await params
  const origin = publicOrigin(req)

  // Resolve through the API (like the pay page loads jars), not this deployment's database:
  // a site deployment may be connected to a different database than the API.
  const lookup = new URL(
    `${process.env.NEXT_PUBLIC_API_URL}/jars/short/${encodeURIComponent(code)}`,
  )
  const handle = username?.[0]?.trim()
  if (handle) lookup.searchParams.set('username', handle)

  let resolved: { jarId: string; name: string; collectorId: string | null } | null = null
  try {
    const res = await fetch(lookup, { cache: 'no-store' })
    if (res.ok) resolved = (await res.json())?.data ?? null
  } catch (error: any) {
    console.error(`[short-link] lookup failed for ${code}: ${error?.message}`)
  }

  if (!resolved) {
    return NextResponse.redirect(new URL('/', origin))
  }

  const target = new URL(
    `/pay/${resolved.jarId}/${encodeURIComponent(String(resolved.name).trim().replace(/\s+/g, '-'))}`,
    origin,
  )
  // Keep any extra query params (e.g. utm tags) the link was shared with.
  req.nextUrl.searchParams.forEach((value, key) => target.searchParams.set(key, value))
  if (resolved.collectorId) target.searchParams.set('collectorId', resolved.collectorId)

  return NextResponse.redirect(target)
}
