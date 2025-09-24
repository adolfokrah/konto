import React from 'react'
import { AppStoreButton } from './app-store-button'
import { GooglePlayButton } from './google-play-button'
import { cn } from '@/utilities/ui'

interface AppStoreButtonsProps {
  appStoreButton?: {
    show?: boolean | null
    url?: string | null
  }
  googlePlayButton?: {
    show?: boolean | null
    url?: string | null
  }
  variant?: 'default' | 'light'
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

export const AppStoreButtons: React.FC<AppStoreButtonsProps> = ({
  appStoreButton,
  googlePlayButton,
  variant = 'default',
  className,
  orientation = 'horizontal'
}) => {
  const hasButtons = (appStoreButton?.show && appStoreButton?.url) || (googlePlayButton?.show && googlePlayButton?.url)
  
  if (!hasButtons) return null

  return (
    <div className={cn(
      "flex gap-4 items-center justify-center",
      {
        "flex-col sm:flex-row": orientation === 'horizontal',
        "flex-col": orientation === 'vertical'
      },
      className
    )}>
      {appStoreButton?.show && appStoreButton?.url && (
        <AppStoreButton 
          href={appStoreButton.url} 
          variant={variant}
        />
      )}
      
      {googlePlayButton?.show && googlePlayButton?.url && (
        <GooglePlayButton 
          href={googlePlayButton.url} 
          variant={variant}
        />
      )}
    </div>
  )
}