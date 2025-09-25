import React from 'react'
import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'
import {
  Lightbulb,
  Target,
  Gem,
  Heart,
  Crosshair,
  Star,
} from 'lucide-react'
import Ring from '@/components/ui/ring'
import { Logo } from '@/components/Logo/Logo'

interface MissionVisionValuesItem {
  title: string
  description: string
  icon: string
}

interface MissionVisionValuesBlock {
  title?: any
  subtitle?: string
  items?: MissionVisionValuesItem[]
  anchor?: string
}

const iconMap = {
  lightbulb: Lightbulb,
  bullseye: Crosshair,
  gem: Gem,
  heart: Heart,
  target: Target,
  star: Star,
}

export const MissionVisionValuesComponent: React.FC<
  MissionVisionValuesBlock & {
    className?: string
  }
> = ({ title,  items, className, anchor }) => {
  return (
    <section 
      className={cn(
        ' px-5 py-16 m-auto ',
        className
      )}
      id={anchor || undefined}
    >
      {/* Container with background */}
      <div className='rounded-2xl relative overflow-hidden bg-secondary-background mx-auto py-16 lg:py-20 xl:py-34 max-w-[2080px]'>
      <div className="z-10 relative container">
          {/* Content */}
            
            {/* Header */}
            <div className="mb-12 lg:mb-[58px] max-w-[405px] mx-auto">
              {title && (
                <div className="mb-[14px]">
                  <RichText
                    data={title}
                    enableGutter={false}
                    enableProse={false}
                  />
                </div>
              )}
              
            </div>
            
            {/* Items Grid */}
            {items && items.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
                {items.map((item: MissionVisionValuesItem, index: number) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-8 lg:px-[34px] lg:py-[47px] text-center duration-300 min-h-[312px] flex flex-col justify-center items-center"
                  >
                    {/* Icon */}
                    <div className="w-[60px] h-[60px] bg-secondary-background rounded-full flex items-center justify-center mx-auto mb-[22px]">
                      {(() => {
                        const IconComponent = iconMap[item.icon as keyof typeof iconMap] || Lightbulb
                        return <IconComponent size={20} className="text-black" />
                      })()}
                    </div>
                    
                    {/* Content */}
                    <div className="max-w-[341px]">
                      <h3 className="text-2xl lg:text-[32px] lg:leading-[45px] font-semibold font-chillax mb-[10px]text-center">
                        {item.title}
                      </h3>
                      <p className="lg:leading-[27px]text-center font-medium">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}

                <Logo className='absolute top-0 left-10 brightness-0 hidden lg:block' color="black" />
              </div>
            )}
      </div>

      <Ring className='absolute -top-70 w-[600px] -right-20 h-[600px] xl:-top-100 xl:-right-50 border-90 xl:w-[1000px] xl:h-[1000px]   border-secondary-dark' />
      <Ring className='absolute -bottom-70 w-[600px] h-[600px] -left-20 xl:-bottom-100 xl:-left-50 border-90 xl:w-[1000px] xl:h-[1000px]   border-secondary-dark' />
      </div>
    </section>
  )
}