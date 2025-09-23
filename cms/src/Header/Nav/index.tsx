'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

import type { Header as HeaderType } from '@/payload-types'
import { Highlighter } from '@/components/ui/highlighter'
import { CMSLink } from '@/components/Link'
import { cn } from '@/utilities/tw-merge'

const HoverHighlighter = ({
  children,
  link,
  isActive,
}: {
  children: React.ReactNode
  link: any
  isActive: boolean
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [showHighlight, setShowHighlight] = useState(isActive)

  useEffect(() => {
    setShowHighlight(isActive)
  }, [isActive])

  const handleMouseEnter = () => {
    if (!isActive) {
      setIsHovered(true)
      // Small delay to allow the highlight animation to show
      setTimeout(() => setShowHighlight(true), 50)
    }
  }

  const handleMouseLeave = () => {
    if (!isActive) {
      setIsHovered(false)
      setShowHighlight(false)
    }
  }

  const shouldShowHighlight = isActive || isHovered

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="relative">
      {shouldShowHighlight && (
        <div
          className={`absolute inset-0 transition-opacity duration-200 ${showHighlight ? 'opacity-100' : 'opacity-0'}`}
        >
          <Highlighter action="highlight" color="#FF9800" animationDuration={300}>
            {children}
          </Highlighter>
        </div>
      )}
      <div
        className={`transition-opacity duration-200 ${shouldShowHighlight ? 'opacity-0' : 'opacity-100'}`}
      >
        {children}
      </div>
    </div>
  )
}

export const HeaderNav: React.FC<{ data: HeaderType; className?: string }> = ({
  data,
  className,
}) => {
  const navItems = data?.navItems || []
  const pathname = usePathname()

  const isLinkActive = (link: any) => {
    if (!link || !pathname) return false

    // Remove locale prefix from pathname (/en, /fr, etc.)
    const localeRegex = /^\/[a-z]{2}(\/|$)/
    const pathWithoutLocale = pathname.replace(localeRegex, '/')

    // Normalize pathname - treat both '/' and '/home' as home
    const normalizedPathname =
      pathWithoutLocale === '/' || pathWithoutLocale === '/home' ? 'home' : pathWithoutLocale

    // Handle reference links
    if (link.type === 'reference' && link.reference?.value) {
      const page =
        typeof link.reference.value === 'string' ? link.reference.value : link.reference.value.slug

      const normalizedPage = page === '/' || page === 'home' ? 'home' : page
      return normalizedPathname === normalizedPage || normalizedPathname === `/${normalizedPage}`
    }

    // Handle custom URL links
    if (link.type === 'custom' && link.url) {
      const normalizedUrl = link.url === '/' || link.url === '/home' ? 'home' : link.url
      return normalizedPathname === normalizedUrl || normalizedPathname === `/${normalizedUrl}`
    }

    return false
  }

  return (
    <nav className={cn('flex gap-5 items-center', className)}>
      {navItems.map(({ link }, i) => {
        const isActive = isLinkActive(link)
        return (
          <HoverHighlighter key={i} link={link} isActive={isActive}>
            <CMSLink {...link} className="!no-underline" appearance="link" />
          </HoverHighlighter>
        )
      })}
    </nav>
  )
}
