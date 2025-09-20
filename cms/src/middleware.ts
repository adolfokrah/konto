import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const referer = request.headers.get('referer')

  // Define your supported locales
  const locales = ['en', 'fr']
  const defaultLocale = 'en'

  // Skip middleware for certain paths
  const shouldSkip = [
    '/api/',
    '/admin/',
    '/_next/',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/media/',
    '/monitoring',
    '/pay/', // Skip pay routes
    '/payload/', // Skip payload admin routes
    '/verify', // Skip KYC verify route
  ].some((path) => pathname.startsWith(path))

  if (shouldSkip) {
    return NextResponse.next()
  }

  // Check if the pathname has a locale (supported or unsupported)
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  )

  // Check if pathname starts with any locale-like pattern (unsupported locales)
  const possibleLocale = pathname.split('/')[1]
  const isUnsupportedLocale =
    possibleLocale &&
    possibleLocale.length === 2 &&
    !locales.includes(possibleLocale) &&
    possibleLocale.match(/^[a-z]{2}$/) // Simple check for 2-letter language codes

  // Handle unsupported locales - redirect to root (English fallback)
  if (isUnsupportedLocale) {
    const pathWithoutLocale = pathname.replace(`/${possibleLocale}`, '') || '/'
    return NextResponse.redirect(new URL(pathWithoutLocale, request.url))
  }

  // If no supported locale in pathname, check if we should preserve locale from referer
  if (!pathnameHasLocale) {
    // Check if the referer has a locale and preserve it
    if (referer) {
      try {
        const refererUrl = new URL(referer)
        const refererPathname = refererUrl.pathname

        // Check if referer has a non-English locale
        const refererLocale = locales.find(
          (locale) =>
            locale !== 'en' &&
            (refererPathname.startsWith(`/${locale}/`) || refererPathname === `/${locale}`),
        )

        if (refererLocale) {
          // Redirect to preserve the locale from referer
          return NextResponse.redirect(new URL(`/${refererLocale}${pathname}`, request.url))
        }
      } catch {
        // Invalid referer URL, continue with default behavior
      }
    }

    // No locale preservation needed, rewrite to default locale internally
    return NextResponse.rewrite(new URL(`/en${pathname}`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Matcher for frontend routes only, excluding API and admin routes
  matcher: [
    // Skip all internal paths (_next) and API routes
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api|admin|media|monitoring|pay|payload|verify).*)',
  ],
}
