import React from 'react'
import { AppStoreIcon } from './app-store-icon'
import { GooglePlayIcon } from './google-play-icon'
import { cn } from '@/utilities/ui'

interface AppStoreIconsProps {
  appleAppStoreUrl?: string | null
  googlePlayStoreUrl?: string | null
  variant?: 'default' | 'light'
  className?: string
}

export const AppStoreIcons: React.FC<AppStoreIconsProps> = ({
  appleAppStoreUrl,
  googlePlayStoreUrl,
  variant = 'default',
  className
}) => {
  const hasIcons = appleAppStoreUrl || googlePlayStoreUrl
  
  if (!hasIcons) return null

  return (
    <div className={cn("flex gap-2", className)}>
      {appleAppStoreUrl && (
        <AppStoreIcon 
          href={appleAppStoreUrl} 
          variant={variant}
        />
      )}
      
      {googlePlayStoreUrl && (
        <GooglePlayIcon 
          href={googlePlayStoreUrl} 
          variant={variant}
        />
      )}
    </div>
  )
}