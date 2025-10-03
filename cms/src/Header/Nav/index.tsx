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
  const [activeSection, setActiveSection] = useState('')

  // Scroll-based section detection
  useEffect(() => {
    const handleScroll = () => {
      // Get all anchor IDs from navigation links
      const anchorIds: string[] = []
      navItems.forEach(({ link }) => {
        if (link?.anchor) {
          const cleanAnchor = link.anchor.startsWith('#') ? link.anchor.slice(1) : link.anchor
          anchorIds.push(cleanAnchor)
        }
      })

      if (anchorIds.length === 0) return

      // Find which section is currently in view
      let currentSection = ''
      const scrollPosition = window.scrollY + window.innerHeight / 3 // Trigger when section is 1/3 into view

      for (const anchorId of anchorIds) {
        const element = document.getElementById(anchorId)
        if (element) {
          const elementTop = element.offsetTop
          const elementBottom = elementTop + element.offsetHeight

          if (scrollPosition >= elementTop && scrollPosition <= elementBottom) {
            currentSection = anchorId
            break
          }
        }
      }

      // If we're at the top of the page and no section is active, clear active section
      if (window.scrollY < 100 && !currentSection) {
        setActiveSection('')
      } else if (currentSection) {
        setActiveSection(currentSection)
      }
    }

    // Set up scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Initial check
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [navItems])

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
      const pathMatches = normalizedPathname === normalizedPage || normalizedPathname === `/${normalizedPage}`
      
      // If link has an anchor, check if it matches currently active section
      if (link.anchor) {
        const cleanAnchor = link.anchor.startsWith('#') ? link.anchor.slice(1) : link.anchor
        return pathMatches && activeSection === cleanAnchor
      }
      
      // If link has no anchor but there's an active section, this link should not be active
      if (activeSection && !link.anchor) {
        return false
      }
      
      return pathMatches
    }

    // Handle custom URL links
    if (link.type === 'custom' && link.url) {
      const normalizedUrl = link.url === '/' || link.url === '/home' ? 'home' : link.url
      const pathMatches = normalizedPathname === normalizedUrl || normalizedPathname === `/${normalizedUrl}`
      
      // If link has an anchor, check if it matches currently active section
      if (link.anchor) {
        const cleanAnchor = link.anchor.startsWith('#') ? link.anchor.slice(1) : link.anchor
        return pathMatches && activeSection === cleanAnchor
      }
      
      // If link has no anchor but there's an active section, this link should not be active
      if (activeSection && !link.anchor) {
        return false
      }
      
      return pathMatches
    }

    return false
  }

  return (
    <nav className={cn('flex gap-5 items-center', className)}>
      {navItems.map(({ link }, i) => {
        const isActive = isLinkActive(link)
        return (
          <HoverHighlighter key={i} link={link} isActive={isActive}>
            <CMSLink {...link} className="!no-underline text-black" appearance="link" />
          </HoverHighlighter>
        )
      })}
    </nav>
  )
}
