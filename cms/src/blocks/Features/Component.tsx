import React from 'react'
import { cn } from '@/utilities/ui'
import { Media } from '@/components/Media'
import { CMSLink } from '@/components/Link'
import DownloadButton from '@/components/ui/download-button'

type Feature = {
  title: string
  subtitle?: string
  image?: any
  link?: any
  showLink?: boolean
}

type Props = {
  disableInnerContainer?: boolean
  title?: string
  features?: Feature[]
}

// Reusable component for features 2-5 (standard card layout)
const StandardFeatureCard: React.FC<{
  feature: Feature
  colorClass: string
  isLargeCard?: boolean
    className?: string
}> = ({ feature, colorClass, className }) => {
  return (
    <div className={cn(
      'rounded-3xl p-6 text-white min-h-[244px]',
      colorClass,
      className
    )}>
      <div className="flex flex-col justify-center items-center h-full gap-4">
        <div className="flex flex-col gap-2.5 text-center">
          <h3 className="font-supreme font-medium text-xl leading-[27px]">
            {feature.title}
          </h3>
          {feature.subtitle && (
            <p className="font-supreme font-normal text-xs leading-4 opacity-90">
              {feature.subtitle}
            </p>
          )}
        </div>
        
        {/* Image */}
        {feature.image && (
          <div className="flex-1 flex items-center justify-center">
            <Media
              resource={feature.image}
              className={cn(
                "h-auto"
              )}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export const FeaturesBlock: React.FC<Props> = ({
  title,
  features,
}) => {
  // Predefined background colors for the cards
  const cardColors = [
    'bg-[#1C222E]', // Dark blue-gray
    'bg-[#FF5697]', // Pink
    'bg-[#FE6D0B]', // Orange
    'bg-[#4E50FB]', // Blue
    'bg-[#921EFE]', // Purple
  ]

  return (
    <section >
      <div
        className={cn(
          'container mx-auto',
        )}
      >
        {/* Title */}
        {title && (
          <h2 className="font-chillax text-center font-bold w-full lg:max-w-[80%] mx-auto text-2xl md:text-4xl lg:text-5xl mb-12 md:mb-16">
            {title}
          </h2>
        )}

        {/* Features Grid */}
        {features && features.length > 0 && (
          <div className="flex flex-col gap-3 mx-auto ">
            {/* First Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Feature 1 - Special layout */}
              {features[0] && (
                <div className={cn(
                  'col-span-1 sm:col-span-2 lg:col-span-2 p-5 rounded-3xl sm:px-10 text-white',
                  cardColors[0]
                )}>
                  <div className="flex flex-col mt-2 sm:mt-0 sm:flex-row items-center justify-between h-full">
                     <div>
                      <div>
                        <h3 className="font-supreme font-medium text-xl leading-[27px] text-center sm:text-left">
                          {features[0].title}
                        </h3>
                        {features[0].subtitle && (
                          <p className="font-supreme font-normal text-sm leading-4 opacity-90 text-center sm:text-left">
                            {features[0].subtitle}
                          </p>
                        )}
                      </div>
                      
                      {/* Link/Button */}
                      <div className='w-fit mx-auto mt-4 sm:ml-0'>
                        {features[0].showLink && features[0].link && (
                        <CMSLink
                          {...features[0].link}
                          label={''}
                          className='px-0 w-fit'
                          appearance="ghost hover:bg-transparent"
                        >
                         
                          <DownloadButton title= {features[0].link.label || 'Create a jar'}/>
                        </CMSLink>
                      )}
                        </div>
                    </div>
                    
                    {/* Image/Illustration */}
                    {features[0].image && (
                      <div className="flex-shrink-0 mb-4 sm:ml-4 sm:mb-0">
                        <Media
                          resource={features[0].image}
                          className="w-48 h-auto mx-auto"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Feature 2 - Standard card */}
              {features[1] && (
                <StandardFeatureCard 
                  feature={features[1]}
                  colorClass={cardColors[1]}
                  className="col-span-1"
                />
              )}

              {features[2] && (
                <StandardFeatureCard 
                  feature={features[2]}
                  colorClass={cardColors[2]}
                  className="col-span-1"
                />
              )}

              {features[3] && (
                <StandardFeatureCard 
                  feature={features[3]}
                  colorClass={cardColors[3]}
                  className="col-span-1"
                />
              )}

              {features[4] && (
                <StandardFeatureCard 
                  feature={features[4]}
                  colorClass={cardColors[4]}
                  className="col-span-1"
                />
              )}
            </div>

           
          </div>
        )}
      </div>
    </section>
  )
}