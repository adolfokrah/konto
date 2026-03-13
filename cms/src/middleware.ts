import { NextRequest, NextResponse } from 'next/server'

const LOCALES = ['en', 'fr']

// Paths that should never be locale-redirected
const BYPASS_PREFIXES = [
  '/admin',
  '/dashboard',
  '/api',
  '/pay',
  '/congratulations',
  '/email',
  '/_next',
  '/favicon',
  '/media',
  '/robots',
  '/sitemap',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip if already locale-prefixed
  if (LOCALES.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`))) {
    return NextResponse.next()
  }

  // Skip bypass prefixes and static files
  if (BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  // Redirect bare paths like /support → /en/support
  const url = request.nextUrl.clone()
  url.pathname = `/en${pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
