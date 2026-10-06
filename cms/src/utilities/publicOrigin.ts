import type { NextRequest } from 'next/server'

/**
 * The public origin the visitor used. Behind a proxy (Railway), `req.url` carries the
 * internal address (e.g. https://localhost:8080), so prefer the forwarded host.
 */
export function publicOrigin(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  if (!host) return req.nextUrl.origin
  const proto =
    req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
    req.nextUrl.protocol.replace(':', '')
  return `${proto}://${host.split(',')[0].trim()}`
}
