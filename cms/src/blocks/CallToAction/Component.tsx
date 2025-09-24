import React from 'react'
import Image from 'next/image'

import type { CallToActionBlock as CTABlockProps } from '@/payload-types'

import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'
import { Media } from '@/components/Media'
import Ring from '@/components/ui/ring'
import Link from 'next/link'

export const CallToActionBlock: React.FC<CTABlockProps> = ({
  title,
  description,
  image,
  appStoreButton,
  googlePlayButton,
}) => {
  return (
    <section className={cn('bg-dark-surface text-white pt-10 md:pt-34 relative overflow-hidden')}>
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
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4">
            {appStoreButton?.show && (
              <Link
                target='_blank'
                href={appStoreButton.url || '#'}
                className="inline-flex items-center bg-white text-black px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
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
            )}

            {googlePlayButton?.show && (
              <Link
                target='_blank'
                href={googlePlayButton.url || '#'}
                className="inline-flex items-center bg-white text-black px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
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
            )}
          </div>

          {/* Mobile App Images */}
          {image && (
            <div className="pt-8 w-full max-w-4xl">
              <Media resource={image} className="w-full h-auto" />
            </div>
          )}
        </div>
      </div>

      <div className='overflow-hidden absolute top-0 left-0 w-full h-full '>
             <div className='mx-auto  max-w-[2000px]'>
               <Ring className="absolute top-50 -right-160 lg:top-50 lg:-right-70 border-[#1A1F2A] border-70 w-[900px] h-[900px]" />
                <Ring className="absolute -left-100  -top-200 lg:-top-190 xl:-top-150 lg:left-120 border-[#1A1F2A] border-70 w-[900px] h-[900px]" />
                <Ring className="absolute -bottom-200 -left-190  lg:-bottom-170 xl:-bottom-150 lg:left-0 xl:left-30 border-[#1A1F2A] border-70 w-[900px] h-[900px]" />
             </div>
            </div>
    </section>
  )
}
