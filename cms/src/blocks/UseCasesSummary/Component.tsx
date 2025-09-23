import React from 'react'
import { cn } from '@/utilities/ui'
import { Media } from '@/components/Media'
import { CMSLink } from '@/components/Link'
import RichText from '@/components/RichText'
import DownloadButton from '@/components/ui/download-button'
import Marquee from '@/components/ui/marquee'

type UseCase = {
  image: any
  useCase: string
  title: string
  description: any
  imagePosition?: 'left' | 'right'
  showLink?: boolean
  link?: any
}

type Props = {
  className?: string
  disableInnerContainer?: boolean
  title?: string
  subtitle?: string
  useCases?: UseCase[]
}

export const UseCasesSummaryBlock: React.FC<Props> = ({
  className,
  disableInnerContainer,
  title,
  subtitle,
  useCases,
}) => {
  return (
    <section className={cn(className)}>
      <div className={cn('container mx-auto mt-16', !disableInnerContainer && 'max-w-7xl')}>
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-12 md:mb-16">
            {title && (
              <h2 className="font-chillax text-center font-bold w-full lg:max-w-[80%] mx-auto text-2xl md:text-4xl lg:text-5xl mb-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Use Cases */}
        {useCases && useCases.length > 0 && (
          <div className="space-y-16 md:space-y-24">
            {useCases.map((useCase, index) => {
              const isImageLeft = useCase.imagePosition === 'left'

              return (
                <div
                  key={index}
                  className={cn(
                    'grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center',
                    isImageLeft ? 'lg:grid-flow-col' : 'lg:grid-flow-col-dense',
                  )}
                >
                  {/* Image */}
                  <div className={cn('relative', isImageLeft ? 'lg:order-1' : 'lg:order-2')}>
                    {useCase.image && (
                      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                        <Media resource={useCase.image} className="w-full h-auto object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className={cn('space-y-6', isImageLeft ? 'lg:order-2' : 'lg:order-1')}>
                    {/* Use Case Category */}
                    <div className="inline-block">
                      <span className="text-sm font-supreme font-medium text-gray-500 uppercase tracking-wider">
                        {useCase.useCase}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-chillax  text-2xl md:text-3xl lg:text-4xl text-gray-900">
                      {useCase.title}
                    </h3>

                    {/* Description */}
                    <div className="space-y-4">
                      <div className="font-supreme text-gray-600 leading-relaxed">
                        <RichText data={useCase.description} enableGutter={false} />
                      </div>
                    </div>

                    {/* Link/Button */}
                    {useCase.showLink && useCase.link && (
                      <div className="pt-2">
                        <CMSLink
                          {...useCase.link}
                          label={''}
                          className="px-0 w-fit"
                          appearance="ghost hover:bg-transparent"
                        >
                          <DownloadButton
                            title={useCase.link.label || 'Download App'}
                            variant="invert"
                          />
                        </CMSLink>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Scrolling Use Cases Marquee */}
      <div className="border-y border-y-black mt-14">
        <Marquee pauseOnHover className="py-4" speed={30}>
          <div className="flex items-center gap-8 whitespace-nowrap">
            <span className="text-lg md:text-xl">School Fundraisers</span>
            <span className="text-2xl">•</span>
            <span className="text-lg md:text-xl">Church Building Projects</span>
            <span className="text-2xl">•</span>
            <span className="text-lg md:text-xl">Alumni and Old Students Associations</span>
            <span className="text-2xl">•</span>
            <span className="text-lg md:text-xl">Church Offering</span>
            <span className="text-2xl">•</span>
            <span className="text-lg md:text-xl">Community Development Initiatives</span>
            <span className="text-2xl">•</span>
            <span className="text-lg md:text-xl">Sports Teams</span>
            <span className="text-2xl">•</span>
            <span className="text-lg md:text-xl">Charity Organizations</span>
            <span className="text-2xl">•</span>
            <span className="text-lg md:text-xl">Medical Fundraising</span>
            <span className="text-2xl">•</span>
            <span className="text-lg md:text-xl">Wedding Contributions</span>
            <span className="text-2xl">•</span>
            <span className="text-lg md:text-xl">Funeral Support</span>
            <span className="text-2xl">•</span>
            <span className="text-lg md:text-xl">Business Startups</span>
            <span className="text-2xl">•</span>
            <span className="text-lg md:text-xl">Emergency Relief</span>
            <span className="text-2xl">•</span>
            <span className="text-lg md:text-xl">Educational Scholarships</span>
            <span className="text-2xl">•</span>
          </div>
        </Marquee>
      </div>
    </section>
  )
}
