import React from 'react'
import { cn } from '@/utilities/ui'
import { Media } from '@/components/Media'

type Feature = {
  title: string
  description: string
  icon?: any
}

type Props = {
  className?: string
  disableInnerContainer?: boolean
  title?: string
  subtitle?: string
  features?: Feature[]
  backgroundColor?: 'white' | 'gray' | 'dark'
}

export const WhyChooseUsBlock: React.FC<Props> = ({
  className,
  disableInnerContainer,
  title,
  subtitle,
  features,
  backgroundColor = 'white',
}) => {
  const backgroundClasses: Record<string, string> = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    dark: 'bg-gray-900 text-white',
    transparent: 'bg-transparent',
  }

  return (
    <section
      className={cn(
        backgroundClasses[backgroundColor || 'white'],
        className,
      )}
    >
      <div
        className={cn(
          'container mx-auto',
          !disableInnerContainer && 'max-w-7xl',
        )}
      >
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-12 md:mb-16">
            {title && (
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
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

        {/* Features Grid */}
        {features && features.length > 0 && (
          <div className="grid grid-cols-1  lg:grid-cols-3 gap-8 md:gap-12">
            {features.map((feature: Feature, index: number) => {
              // Add borders to middle feature when there are 3 features
              const isMiddleFeature = features.length === 3 && index === 1
              
              return (
                <div
                  key={index}
                  className={cn('group', {
                    'lg:border-l lg:border-r lg:border-e-neutral-200 lg:px-8': isMiddleFeature,
                  })}
                >
                {/* Icon */}
                {feature.icon && typeof feature.icon === 'object' && (
                  <div className="mb-6 flex justify-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                      <Media
                        resource={feature.icon}
                        className="w-8 h-8 md:w-10 md:h-10 mx-auto"
                      />
                    </div>
                  </div>
                )}

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-semibold mb-3">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="leading-relaxed">
                  {feature.description}
                </p>
              </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}