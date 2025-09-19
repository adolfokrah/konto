'use client'

import Link from 'next/link'
import { useLocale } from '@/hooks/useLocale'
import { ComponentProps } from 'react'

interface LocaleLinkProps extends Omit<ComponentProps<typeof Link>, 'href'> {
  href: string
  locale?: string // Optional: specify a different locale for this link
}

/**
 * Locale-aware Link component that automatically handles locale prefixes
 * - For English: uses root paths (no locale prefix)
 * - For other locales: adds locale prefix
 * - Preserves current locale unless explicitly overridden
 */
export function LocaleLink({ href, locale, ...props }: LocaleLinkProps) {
  const { getLocalizedPath } = useLocale()
  
  // Get the localized version of the href
  const localizedHref = getLocalizedPath(href, locale)
  
  return <Link href={localizedHref} {...props} />
}

// Re-export the default Link for external URLs and non-locale links
export { default as Link } from 'next/link'