import React from 'react'
import Link from 'next/link'
import { cn } from '@/utilities/ui'

interface GooglePlayButtonProps {
  href: string
  className?: string
  variant?: 'default' | 'light'
}

export const GooglePlayButton: React.FC<GooglePlayButtonProps> = ({
  href,
  className,
  variant = 'default',
}) => {
  return (
    <Link
      target="_blank"
      href={href}
      className={cn(
        'inline-flex items-center px-4 py-2 rounded-xl transition-colors duration-200',
        {
          'bg-white text-black hover:bg-gray-100': variant === 'default',
          'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm': variant === 'light',
        },
        className,
      )}
    >
      <svg width="35" height="35" viewBox="0 0 24 24" fill="none" className="mr-3">
        <path
          d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.61 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.5 12.92 20.16 13.19L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z"
          fill="currentColor"
        />
      </svg>
      <div className="text-left">
        <div className="text-xs">GET IT ON</div>
        <div className="text-sm font-semibold">Google Play</div>
      </div>
    </Link>
  )
}
