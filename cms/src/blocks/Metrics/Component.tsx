import React from 'react'
import { cn } from '@/utilities/ui'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'

type Statistic = {
  title: string
  subtitle: string
  image?: any
}

type Props = {
  className?: string
  disableInnerContainer?: boolean
  title?: any
  subtitle?: string
  statistics?: Statistic[]
}

export const MetricsBlock: React.FC<Props> = ({
  className,
  disableInnerContainer,
  title,
  subtitle,
  statistics,
}) => {
  return (
    <section className={cn('py-16 md:py-24', className)}>
      <div className={cn('container mx-auto', !disableInnerContainer && 'max-w-7xl')}>
        {/* Header */}
        <div className="mb-16">
          {title && <RichText data={title} enableGutter={false} enableProse={false} />}
          {subtitle && (
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">{subtitle}</p>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 items-center">
          {/* Statistics Display */}
          {statistics &&
            statistics.length > 0 &&
            statistics.map((stat, index) => (
              <div key={index} className="space-y-6 bg-white rounded-3xl relative h-full">
                {index == 0 && (
                  <div className="flex flex-col items-center justify-center">
                    <div className="absolute w-fit top-8 left-10">
                      {/* Statistic Number/Title */}
                      <div className="text-6xl font-chillax font-bold">{stat.title}</div>

                      {/* Statistic Description */}
                      <div className="text-xl">{stat.subtitle}</div>
                    </div>

                    {/* Statistic Image */}
                    {stat.image && (
                      <div className="flex justify-center items-center flex-1 mt-10 xl:mt-0">
                        <Media resource={stat.image} className="w-full object-contain" />
                      </div>
                    )}
                  </div>
                )}

                {index == 1 && (
                  <div className="relative h-full flex flex-col-reverse items-center">
                    <div className="absolute w-fit top-8 left-10">
                      {/* Statistic Description */}
                      <div className="text-xl">{stat.subtitle}</div>
                      {/* Statistic Number/Title */}
                      <div className="text-6xl font-chillax font-bold">{stat.title}</div>
                    </div>

                    {/* Statistic Image */}
                    {stat.image && (
                      <div className="flex flex-col-reverse  items-center px-10 flex-1 mt-10 xl:mt-0 ">
                        <Media
                          resource={stat.image}
                          className="w-full object-contain object-bottom "
                        />
                      </div>
                    )}
                  </div>
                )}

                {index == 2 && (
                  <div className="relative h-full flex flex-col p-5 items-center justify-center">
                    {/* Statistic Image */}
                    {stat.image && (
                      <div className="flex justify-center items-center px-10 flex-1 my-5 xl:mt-0">
                        <Media resource={stat.image} className="w-full object-contain mx-auto" />
                      </div>
                    )}
                    <div className=" w-full top-8 left-10 text-center">
                      {/* Statistic Description */}
                      <div className="text-xl">{stat.subtitle}</div>
                      {/* Statistic Number/Title */}
                      <div className="text-2xl font-chillax font-bold">{stat.title}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </section>
  )
}
