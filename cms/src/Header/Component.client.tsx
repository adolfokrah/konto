'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'
import { MobileNav } from './MobileNav'
import DownloadButton from '@/components/ui/download-button'

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  const toggleMobileNav = () => {
    setIsMobileNavOpen(!isMobileNavOpen)
  }

  return (
    <header className="fixed w-full py-4 z-20 " {...(theme ? { 'data-theme': theme } : {})}>
      <div className="container mx-auto">
        <div className="bg-primary-light rounded-[40px] p-4 px-6">
          <div className="flex justify-between items-center">
            <Link href="/">
              <Logo loading="eager" priority="high" color="black" />
            </Link>
            <HeaderNav data={data} className="hidden md:flex" />
            <div className="flex items-center gap-4">
              <DownloadButton />
              <button
                onClick={toggleMobileNav}
                className="md:hidden p-2 rounded-lg transition-colors relative w-10 h-10 flex items-center justify-center"
                aria-label="Toggle mobile menu"
              >
                <div className="w-6 h-5 relative">
                  {/* Top bar */}
                  <span
                    className={`absolute h-0.5 w-6 bg-black transform transition-all duration-300 ease-in-out origin-center ${
                      isMobileNavOpen ? 'rotate-45 top-2' : 'rotate-0 top-0'
                    }`}
                  />
                  {/* Middle bar */}
                  <span
                    className={`absolute h-0.5 w-6 bg-black transform transition-all duration-300 ease-in-out top-2 ${
                      isMobileNavOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
                    }`}
                  />
                  {/* Bottom bar */}
                  <span
                    className={`absolute h-0.5 w-6 bg-black transform transition-all duration-300 ease-in-out origin-center ${
                      isMobileNavOpen ? '-rotate-45 top-2' : 'rotate-0 top-4'
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>
          {isMobileNavOpen && <MobileNav data={data} className="md:hidden" />}
        </div>
      </div>
    </header>
  )
}
