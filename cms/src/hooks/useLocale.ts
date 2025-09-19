import { useParams, usePathname, useRouter } from 'next/navigation'

/**
 * Hook to get the current locale and locale utilities for App Router
 */
export function useLocale() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()

  const defaultLocale = 'en'
  const locales = ['en', 'fr']

  // If we have a locale param, use it; otherwise, determine from pathname
  const currentLocale = (() => {
    if (params?.locale) {
      return params.locale as string
    }
    // If no locale param, check if pathname starts with a locale
    const segments = pathname?.split('/').filter(Boolean) || []
    if (segments.length > 0 && locales.includes(segments[0])) {
      return segments[0]
    }
    // Default to English if no locale found (root path case)
    return 'en'
  })()

  /**
   * Switch to a different locale
   */
  const switchLocale = (locale: string) => {
    if (!pathname) return

    // Handle root path case
    if (pathname === '/') {
      if (locale === 'en') {
        router.push('/') // Stay on root for English
      } else {
        router.push(`/${locale}`) // Go to locale-specific path for non-English
      }
      return
    }

    // Check if current path has a locale prefix
    const segments = pathname.split('/').filter(Boolean)
    const hasLocalePrefix = locales.includes(segments[0])

    if (hasLocalePrefix) {
      // Currently on a locale-prefixed path
      if (locale === 'en') {
        // For English, remove locale prefix (go to root-based path)
        segments.shift()
        const newPath = '/' + segments.join('/')
        router.push(newPath)
      } else {
        // For other locales, replace the locale
        segments[0] = locale
        const newPath = '/' + segments.join('/')
        router.push(newPath)
      }
    } else {
      // Currently on a root-based path (English)
      if (locale === 'en') {
        // Stay on current path for English
        return
      } else {
        // Add locale prefix for non-English
        const newPath = `/${locale}${pathname}`
        router.push(newPath)
      }
    }
  }

  /**
   * Get a localized path for the current locale
   */
  const getLocalizedPath = (path: string, locale?: string) => {
    const targetLocale = locale || currentLocale

    // If target locale is English, return root path (no locale prefix)
    if (targetLocale === 'en') {
      return path.startsWith('/') ? path : `/${path}`
    }

    // For other locales, add locale prefix
    if (path.startsWith('/')) {
      return `/${targetLocale}${path}`
    }
    return `/${targetLocale}/${path}`
  }

  /**
   * Get path without locale prefix
   */
  const getPathWithoutLocale = () => {
    if (!pathname) return '/'

    const segments = pathname.split('/').filter(Boolean)
    if (locales.includes(segments[0])) {
      segments.shift() // Remove locale
    }
    return '/' + segments.join('/')
  }

  /**
   * Check if current locale is the default locale
   */
  const isDefaultLocale = currentLocale === defaultLocale

  return {
    currentLocale,
    defaultLocale,
    locales,
    switchLocale,
    getLocalizedPath,
    getPathWithoutLocale,
    isDefaultLocale,
  }
}

/**
 * Type for supported locales
 */
export type SupportedLocale = 'en' | 'fr'

/**
 * Utility to check if a string is a supported locale
 */
export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return ['en', 'fr'].includes(locale)
}
