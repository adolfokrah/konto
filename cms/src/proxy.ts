import { NextRequest, NextResponse } from 'next/server'

function proxy(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname
    const referer = request.headers.get('referer')

    // Define your supported locales
    const locales = ['en', 'fr']

    // Skip middleware for certain paths
    const shouldSkip =
      [
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
        '/congratulations', // Skip congratulations page
        '/reset-password', // Skip reset password page
        '/forgot-password', // Skip forgot password page
        '/email-confirmation', // Skip email confirmation page
        '/Logo.svg',
        '/fonts/',
        '/next/',
        '/email',
        '/404',
        '/500',
      ].some((path) => pathname.startsWith(path)) ||
      // Skip static image files
      pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|js|css|woff|woff2|ttf)$/i)

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
  } catch (error) {
    // If middleware fails, just continue without modification
    console.error('Proxy error:', error)
    return NextResponse.next()
  }
}

// Export both default and named for maximum compatibility
export { proxy }
export default proxy

export const config = {
  matcher: [
    // Match root and language-specific paths, excluding API and static assets
    '/((?!api|_next|admin|media|monitoring|pay|payload|verify|email|robots.txt|sitemap.xml|favicon.ico|Logo.svg|fonts).*)',
  ],
}
