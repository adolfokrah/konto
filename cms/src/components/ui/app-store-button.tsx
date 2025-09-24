import React from 'react'
import Link from 'next/link'
import { cn } from '@/utilities/ui'

interface AppStoreButtonProps {
  href: string
  className?: string
  variant?: 'default' | 'light'
}

export const AppStoreButton: React.FC<AppStoreButtonProps> = ({ 
  href, 
  className,
  variant = 'default' 
}) => {
  return (
    <Link
      target="_blank"
      href={href}
      className={cn(
        "inline-flex items-center px-4 py-2 rounded-xl transition-colors duration-200",
        {
          "bg-white text-black hover:bg-gray-100": variant === 'default',
          "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm": variant === 'light'
        },
        className
      )}
    >
      <svg width="35" height="35" viewBox="0 0 24 24" fill="none" className="mr-3">
        <path
          d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 21.99 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 21.99C7.78997 22.03 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"
          fill="currentColor"
        />
      </svg>
      <div className="text-left">
        <div className="text-xs">Download on the</div>
        <div className="text-sm font-semibold">App Store</div>
      </div>
    </Link>
  )
}