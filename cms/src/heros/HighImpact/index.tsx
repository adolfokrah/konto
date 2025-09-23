import React from 'react'
import type { Page } from '@/payload-types'
import DownloadButton from '@/components/ui/download-button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { CMSLink } from '@/components/Link'
import Ring from '@/components/ui/ring'
import { Media } from '@/components/Media'

export const HighImpactHero: React.FC<Page['hero']> = ({
  media,
  buttonTitle,
  title = 'The Simple Way to Collect Contributions',
  subTitle = 'Build trust with real time records and digital receipts for every contribution',
  avatarsSection,
}) => {
  return (
    <div className="w-full px-2 max-w-[2080px] mx-auto grid grid-cols-1 gap-1 lg:grid-cols-2 mt-10 md:mt-15">
      <div className="bg-dark rounded-xl p-10 lg:p-26 text-white">
        <div className="w-full xl:max-w-[80%]">
          <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-7xl font-bold font-chillax ">
            {title}
          </h1>
          <p className="my-4 xl:max-w-[60%]">{subTitle}</p>
          <DownloadButton variant="invert" title={buttonTitle || 'Download App'} />
        </div>

        <div className="flex  flex-col md:flex-row w-full mt-30 lg:mt-50 xl:mt-90 md:items-center gap-4 justify-between">
          {/* Downloads Section with Avatars */}
          {avatarsSection?.enabled && (
            <div className="flex items-center gap-2">
              {avatarsSection.avatars && avatarsSection.avatars.length > 0 && (
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {avatarsSection.avatars.slice(0, 5).map((avatar, index) => (
                      <Avatar
                        key={index}
                        className="w-10 h-10 border-2 border-secondary-background"
                      >
                        {avatar.image && typeof avatar.image === 'object' && (
                          <AvatarImage src={avatar.image.url || ''} alt={avatar.name} />
                        )}
                        <AvatarFallback className="bg-gray-400 text-white text-sm">
                          {avatar.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {avatarsSection.avatars.length > 5 && (
                      <div className="w-10 h-10 rounded-full bg-gray-600/80 border-2 border-white flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          +{avatarsSection.avatars.length - 5}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                {avatarsSection.title && (
                  <h3 className="text-white text-xl font-semibold">{avatarsSection.title}</h3>
                )}
                <p className="text-label text-sm">{avatarsSection.subtitle}</p>
              </div>
            </div>
          )}

          {/* Available on section - now properly positioned on the right */}
          <div className="flex items-center gap-2">
            <p className="text-white">{avatarsSection?.appStoreLinks?.title || 'Available on'}</p>
            <div className="flex gap-2">
              {/* Apple App Store */}
              {avatarsSection?.appStoreLinks?.appleAppStoreUrl && (
                <CMSLink
                  type="custom"
                  url={avatarsSection.appStoreLinks.appleAppStoreUrl}
                  newTab={true}
                >
                  <div className="w-8 h-8 bg-white backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                    <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                  </div>
                </CMSLink>
              )}

              {/* Google Play Store */}
              {avatarsSection?.appStoreLinks?.googlePlayStoreUrl && (
                <CMSLink
                  type="custom"
                  url={avatarsSection.appStoreLinks.googlePlayStoreUrl}
                  newTab={true}
                >
                  <div className="w-8 h-8 bg-white backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                    <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                    </svg>
                  </div>
                </CMSLink>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-secondary-background rounded-xl h-[400px] lg:min-h-full p-20 text-white overflow-hidden relative">
        <Ring className="absolute -right-120 -top-70  md:-right-50 md:-top-50  lg:-right-30 lg:-top-30" />

        <Ring className="absolute -left-70 -bottom-120 md:-left-60 md:-bottom-120  lg:-left-20 lg:-bottom-80" />

        {media && typeof media === 'object' && (
          <Media
            fill
            imgClassName="z-10 object-contain object-bottom lg:pt-20 pl-20"
            priority
            resource={media}
          />
        )}
      </div>
    </div>
  )
}
