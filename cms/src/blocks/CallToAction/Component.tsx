import React from 'react'
import Image from 'next/image'

import type { CallToActionBlock as CTABlockProps } from '@/payload-types'

import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'
import { Media } from '@/components/Media'
import Ring from '@/components/ui/ring'
import { AppStoreButtons } from '@/components/ui'

export const CallToActionBlock: React.FC<CTABlockProps & { anchor?: string }> = ({
  title,
  description,
  image,
  appStoreButton,
  googlePlayButton,
  anchor,
}) => {
  return (
    <section
      id={anchor || undefined}
      className={cn('bg-dark-surface text-white pt-10 md:pt-34 relative overflow-hidden')}
    >
      <div className={cn('container mx-auto relative z-10')}>
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Title */}
          {title && (
            <div className="font-chillax font-bold text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-bold">
              <RichText data={title} enableGutter={false} />
            </div>
          )}

          {/* Description */}
          {description && (
            <div className="text-lg md:text-xl leading-relaxed max-w-2xl">
              <RichText data={description} enableGutter={false} />
            </div>
          )}

          {/* App Store Buttons */}
          <AppStoreButtons
            appStoreButton={appStoreButton}
            googlePlayButton={googlePlayButton}
            className="pt-4"
          />

          {/* Mobile App Images */}
          {image && (
            <div className="pt-8 w-full max-w-4xl">
              <Media resource={image} className="w-full h-auto" />
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden absolute top-0 left-0 w-full h-full ">
        <div className="mx-auto  max-w-[2000px]">
          <Ring className="absolute top-50 -right-160 lg:top-50 lg:-right-70 border-[#1A1F2A] border-70 w-[900px] h-[900px]" />
          <Ring className="absolute -left-100  -top-200 lg:-top-190 xl:-top-150 lg:left-120 border-[#1A1F2A] border-70 w-[900px] h-[900px]" />
          <Ring className="absolute -bottom-200 -left-190  lg:-bottom-170 xl:-bottom-150 lg:left-0 xl:left-30 border-[#1A1F2A] border-70 w-[900px] h-[900px]" />
        </div>
      </div>
    </section>
  )
}
