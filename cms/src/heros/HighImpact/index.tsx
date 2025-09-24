import React from 'react'
import type { Page } from '@/payload-types'
import DownloadButton from '@/components/ui/download-button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { AppStoreIcons } from '@/components/ui'
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
    <div className="w-full px-2 max-w-[2080px] mx-auto grid grid-cols-1 gap-1 lg:grid-cols-2 mt-25 md:mt-30">
      <div className="bg-dark rounded-xl p-10 lg:p-26 text-white">
        <div className="w-full xl:max-w-[80%]">
          <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-7xl font-bold font-chillax ">
            {title}
          </h1>
          <p className="my-4 xl:max-w-[60%]">{subTitle}</p>
          <DownloadButton variant="invert" title={buttonTitle || 'Download App'} />
        </div>

        <div className="flex  flex-col md:flex-row w-full mt-30 lg:mt-40 xl:mt-90 md:items-center gap-4 justify-between">
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
            <AppStoreIcons
              appleAppStoreUrl={avatarsSection?.appStoreLinks?.appleAppStoreUrl}
              googlePlayStoreUrl={avatarsSection?.appStoreLinks?.googlePlayStoreUrl}
            />
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
            key={`hero-media-${media.id || media.url}`}
          />
        )}
      </div>
    </div>
  )
}
