import React from 'react'

import type { Page } from '@/payload-types'
import Ring from '@/components/ui/ring'
import { AppStoreButtons } from '@/components/ui'

export const MediumImpactHero: React.FC<Page['hero']> = ({ 
  title, 
  subTitle, 
  appStoreLinks 
}) => {
  return (
    <div className="bg-secondary-background py-40  lg:py-50 2xl:py-70 relative overflow-hidden">
      <div className="container relative z-10">
          {title && <h1 className="text-3xl lg:text-4xl xl:text-5xl 2xl:text-7xl font-semibold font-chillax max-w-5xl  lg:leading-16  2xl:leading-25 mx-auto text-center">{title}</h1>}
          {subTitle && (
            <div className="mb-8 text-lg text-center mx-auto max-w-2xl mt-2">
             {subTitle}
            </div>
          )}
          
          {/* App Store Buttons */}
          {appStoreLinks && (
            <AppStoreButtons
              appStoreButton={{
                show: !!appStoreLinks.appleAppStoreUrl,
                url: appStoreLinks.appleAppStoreUrl
              }}
              googlePlayButton={{
                show: !!appStoreLinks.googlePlayStoreUrl,
                url: appStoreLinks.googlePlayStoreUrl
              }}
              className="mt-8"
            />
          )}
      </div>

      <Ring className='absolute -bottom-100 w-[600px] h-[600px] lg:-bottom-180 border-90 lg:w-[1200px] lg:h-[1200px] left-1/2 transform -translate-x-1/2  border-secondary-dark' />


    </div>
  )
}
