import React from 'react'

import type { Page, Post } from '@/payload-types'
import { CMSLink } from '@/components/Link'

type LowImpactHeroType = Page['hero'] & {
  children?: React.ReactNode
}

export const LowImpactHero: React.FC<LowImpactHeroType> = ({ title, subTitle, links, dateLabel, date }) => {
  return (
    <section className='bg-secondary-background pt-16 pb-8 lg:pt-45 lg:pb-12 '>
      <div className="container">
        <div className="max-w-4xl">
          {title && (
            <h1 className="font-chillax text-4xl lg:text-5xl xl:text-6xl font-semibold text-black mb-6 lg:mb-8">
              {title}
            </h1>
          )}
        </div>

        <div className='flex flex-col lg:flex-row lg:justify-between mt-7 lg:items-end  gap-6 lg:gap-8'>
          {subTitle && (
            <div>
              <h2 className="text-lg lg:text-xl  max-w-2xl">
                {subTitle}
              </h2>
            <p className='text-sm text-label mt-2'>
              {dateLabel} {(() => {
                if (!date) return '';
                const dateObj = new Date(date);
                return `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate()}`;
              })()}
            </p>
            </div>
          )}

          {links && links.length > 0 && (
            <div className="flex flex-row gap-1 lg:flex-shrink-0">
              {links.map((linkItem, index) => (
                <CMSLink
                  key={index}
                  {...linkItem.link}
                  appearance="default"
                  className="inline-flex items-center font-regular justify-center px-6 py-3 rounded-none bg-black text-white  hover:bg-gray-800 transition-colors duration-200 text-sm font-medium whitespace-nowrap"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
