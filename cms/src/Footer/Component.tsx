import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import type { Footer } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'
import Image from 'next/image'

// Social media icon components
const SocialIcon = ({ platform }: { platform: string }) => {
  const iconClass = "w-5 h-5"
  
  switch (platform) {
    case 'twitter':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    case 'facebook':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    case 'linkedin':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      )
    case 'instagram':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.618 5.367 11.987 11.988 11.987s11.987-5.369 11.987-11.987C24.014 5.367 18.635.001 12.017.001zM8.948 4.979c.129-.05.263-.072.397-.072.35 0 .695.15.925.42.23.27.35.627.35.99 0 .362-.12.718-.35.988-.23.27-.575.42-.925.42-.134 0-.268-.022-.397-.072-.5-.193-.823-.678-.823-1.236 0-.558.323-1.043.823-1.238zM8.527 8.895h3.586v11.104H8.527V8.895zm6.033 0h3.586v11.104h-3.586V8.895z"/>
        </svg>
      )
    case 'github':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      )
    case 'youtube':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    case 'tiktok':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
      )
    default:
      return null
  }
}

export async function Footer() {
  const footerData: Footer = await getCachedGlobal('footer', 1)()

  const navItems = footerData?.navItems || []
  const socialLinks = footerData?.socialLinks || []
  const bottomMenuItems = footerData?.bottomMenuItems || []

  return (
    <footer className="mt-auto border-t border-border bg-dark-background dark:bg-card text-white">
      <div className="container py-12 gap-8 flex flex-col md:flex-row md:justify-between">
        <Link className="flex items-center" href="/">
          <Logo />
        </Link>

        <div className="flex flex-col-reverse items-start md:flex-row gap-4 md:items-center">
          <nav className="flex flex-col md:flex-row gap-4">
            {navItems.map(({ link }, i) => {
              return <CMSLink className="text-white hover:underline" key={i} {...link} />
            })}
          </nav>
        </div>

        <div className='flex flex-col md:flex-row gap-4 md:items-center'>
          {socialLinks.length > 0 && (
            <div className="flex gap-4 items-center">
              <span className="text-sm text-gray-300">Follow us:</span>
              <div className="flex gap-3">
                {socialLinks.map((social, index) => (
                  <Link 
                    key={index}
                    href={social.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                    aria-label={`Follow us on ${social.platform}`}
                  >
                    <SocialIcon platform={social.platform} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom section with menu and copyright */}
        <div className="container py-4 mt-7 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          {/* Bottom menu items */}
          {bottomMenuItems.length > 0 && (
            <nav className="flex flex-wrap gap-6">
              {bottomMenuItems.map(({ link }, i) => (
                <CMSLink 
                  key={i} 
                  className="text-sm text-gray-400 hover:text-white transition-colors duration-200" 
                  {...link} 
                />
              ))}
            </nav>
          )}
          
          {/* Copyright */}
          <div className="text-sm text-gray-400">
            © {new Date().getFullYear()} konto inc, All rights reserved.
          </div>
      </div>

      <div className='w-full bg-secondary-surface hidden md:block relative overflow-hidden md:h-47 xl:h-90'>
        <div className='container py-4 relative'>
          <div className="relative top-6">
            <svg 
              viewBox="0 0 1382 470" 
              className="w-full h-auto"
              style={{ 
                fill: 'var(--logo-color, #1D232F)'
              }}
              xmlns="http://www.w3.org/2000/svg"
            >
            <path d="M242.995 150.797C243.118 154.273 241.069 157.46 237.856 158.789L205.572 172.142C202.343 173.477 198.624 172.652 196.262 170.075L99.9959 65.0493C96.0878 60.7855 97.607 53.9303 102.95 51.7205L226.455 0.639035C231.818 -1.57882 237.745 2.23866 237.95 8.04248L242.995 150.797Z"/>
            <path d="M177.415 183.913C179.846 186.4 180.476 190.137 178.996 193.284L164.122 224.92C162.634 228.084 159.33 229.982 155.85 229.67L14.0191 216.953C8.26108 216.436 4.77041 210.345 7.23205 205.11L64.135 84.0853C66.6057 78.8307 73.5553 77.656 77.6129 81.8072L177.415 183.913Z"/>
            <path d="M151.284 258.713C154.754 258.912 157.735 261.249 158.759 264.573L169.057 297.983C170.087 301.325 168.921 304.955 166.139 307.071L52.756 393.298C48.1529 396.799 41.4739 394.651 39.7698 389.122L0.376436 261.309C-1.33395 255.759 3.01188 250.205 8.80451 250.538L151.284 258.713Z"/>
            <path d="M375.791 361.013H312V36H375.791V151.98C392.412 139.842 414.424 132.2 438.683 132.2C506.516 132.2 542.006 175.355 542.006 245.483V361.013L478.215 360.563V251.776C478.215 220.309 461.144 192.438 428.8 192.438C396.904 192.438 375.791 217.612 375.791 252.675V361.013Z"/>
            <path d="M705.23 366.857C636.948 366.857 584.837 313.812 584.837 249.079C584.837 184.796 637.397 131.751 705.23 131.751C773.963 131.751 826.073 185.245 826.073 249.079C826.073 313.812 773.513 366.857 705.23 366.857ZM705.23 307.069C738.024 307.069 762.283 280.996 762.283 249.529C762.283 218.061 738.024 191.988 705.23 191.988C672.437 191.988 648.627 218.061 648.627 249.529C648.627 280.996 672.437 307.069 705.23 307.069Z"/>
            <path d="M972.273 469.351C920.162 469.351 880.181 446.424 859.965 405.067L912.975 376.297C922.858 395.627 941.276 410.911 971.374 410.911C1009.11 410.911 1034.72 384.389 1034.72 340.784V336.738C1022.59 352.022 1001.02 363.71 969.578 363.71C907.135 363.71 857.27 315.16 857.27 249.079C857.27 184.796 909.381 132.2 977.664 132.2C1047.29 132.2 1098.51 182.098 1098.51 249.079V338.986C1098.51 418.104 1044.6 469.351 972.273 469.351ZM976.765 303.473C1008.66 303.473 1033.82 279.647 1033.82 247.73C1033.82 215.813 1008.66 192.438 976.765 192.438C945.319 192.438 920.162 215.813 920.162 247.73C920.162 279.647 945.319 303.473 976.765 303.473Z"/>
            <path d="M1250.73 366.857C1186.04 366.857 1140.67 313.812 1140.67 249.079C1140.67 185.245 1192.78 131.751 1261.06 131.751C1330.7 131.751 1381.91 182.098 1381.91 249.079V361.013H1321.26V334.94C1305.54 354.719 1281.28 366.857 1250.73 366.857ZM1261.06 307.069C1293.86 307.069 1318.12 280.996 1318.12 249.529C1318.12 218.061 1293.86 191.988 1261.06 191.988C1228.27 191.988 1204.46 218.061 1204.46 249.529C1204.46 280.996 1228.27 307.069 1261.06 307.069Z"/>
          </svg>
        </div>
      </div>
    </div>
    </footer>
  )
}
