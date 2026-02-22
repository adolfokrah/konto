'use client'

import React, { useState } from 'react'
import { cn } from '@/utilities/ui'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import Ring from '@/components/ui/ring'

type Feature = {
  feature: string
}

type Props = {
  className?: string
  disableInnerContainer?: boolean
  title?: string
  description?: any
  calculatorSection?: {
    requestLabel?: string
    chargesBreakdownLabel?: string
    contributorPaysLabel?: string
    transferFeeLabel?: string
    youReceiveLabel?: string
  }
  feeStructure?: {
    collectionFee?: number
    transferFeePercentage?: number
  }
  features?: Feature[]
  ctaButton?: {
    text?: string
  }
  poweredBy?: {
    text?: string
    logo?: any
  }
  anchor?: string
}

export const PricingBlock: React.FC<Props> = ({
  className,
  disableInnerContainer,
  title,
  description,
  calculatorSection,
  feeStructure,
  features,
  ctaButton,
  poweredBy,
  anchor,
}) => {
  const [requestAmount, setRequestAmount] = useState<number>(200)

  // Fee percentages from CMS system settings
  const collectionFee = feeStructure?.collectionFee ?? 1.95
  const transferFee = feeStructure?.transferFeePercentage ?? 1

  // Calculations
  const contributorPays = requestAmount + (requestAmount * collectionFee) / 100
  const transferFeeAmount = (requestAmount * transferFee) / 100
  const youReceive = requestAmount - transferFeeAmount

  // Ref for the input to focus on button click
  const amountInputRef = React.useRef<HTMLInputElement>(null)

  const handleDoTheMathClick = () => {
    amountInputRef.current?.focus()
  }

  return (
    <section
      id={anchor || undefined}
      className={cn('bg-dark-surface text-white py-16 md:py-70 relative', className)}
    >
      <div className={cn('container mx-auto relative z-10', !disableInnerContainer && 'max-w-7xl')}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left Column - Content */}
          <div className="space-y-8">
            {/* Title */}
            {title && (
              <h2 className="font-chillax font-bold text-3xl md:text-4xl lg:text-5xl leading-tight">
                {title}
              </h2>
            )}

            {/* Description */}
            {description && (
              <div className="text-gray-300 text-lg leading-relaxed">
                <RichText data={description} enableGutter={false} />
              </div>
            )}

            {/* CTA Button */}
            {ctaButton && ctaButton.text && (
              <div className="pt-4">
                <button
                  onClick={handleDoTheMathClick}
                  className="inline-flex items-center px-8 py-4 bg-secondary-background text-black rounded-full font-medium text-lg hover:bg-secondary-dark transition-colors"
                >
                  {ctaButton.text}
                </button>
              </div>
            )}

            {/* Powered By */}
            {poweredBy && poweredBy.text && (
              <div className="pt-8">
                <p className="text-gray-400 text-sm">{poweredBy.text}</p>
                {poweredBy.logo && <Media resource={poweredBy.logo} className="h-4 w-auto" />}
              </div>
            )}
          </div>

          {/* Right Column - Calculator */}
          <div className=" md:p-8 space-y-6">
            {/* Request Amount */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {calculatorSection?.requestLabel}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg font-medium">
                  GHS
                </span>
                <input
                  type="number"
                  ref={amountInputRef}
                  min="1"
                  max="10000"
                  step="1"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(Number(e.target.value) || 0)}
                  className="w-full pl-16 pr-4 h-18 bg-dark-background border border-dark-background rounded-xl text-white text-2xl md:text-3xl font-bold focus:outline-none "
                  placeholder="200.00"
                />
              </div>
            </div>

            {/* Charges Breakdown */}
            <div className="pt-4 space-y-4">
              <h3 className="text-lg font-medium">
                {calculatorSection?.chargesBreakdownLabel || 'Charges break down'}
              </h3>

              {/* Contributor pays */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">
                  {calculatorSection?.contributorPaysLabel || `Contributor pays`} + {collectionFee}% telco fees
                </span>
                <span className="text-sm font-medium">GHS {contributorPays.toFixed(2)}</span>
              </div>

              {/* Transfer fee */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">
                  {calculatorSection?.transferFeeLabel || 'Transfer fee'} {transferFee}%
                </span>
                <span className="text-sm font-medium">GHS {transferFeeAmount.toFixed(2)}</span>
              </div>

              {/* You Receive */}
              <div className="flex justify-between items-center pt-2">
                <span className="text-2xl font-medium">{calculatorSection?.youReceiveLabel || 'You receive'}</span>
                <span className="text-2xl font-bold">
                  GHS {youReceive.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Features */}
            {features && features.length > 0 && (
              <div className="pt-6 space-y-3">
                {features.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-300">{item.feature}</span>

                      <svg
                        className="w-5 h-5 text-green-200 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    {/* Divider - only show between items, not after the last one */}
                    {index < features.length - 1 && (
                      <div className="border-t border-gray-800 mt-3"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="overflow-hidden absolute top-0 left-0 w-full h-full ">
        <div className="mx-auto  max-w-[2000px]">
          <Ring className="absolute top-50 -right-160 lg:top-50 lg:-right-70 border-[#1A1F2A] border-70 w-[900px] h-[900px]" />
          <Ring className="absolute -left-100  -top-200 lg:-top-190 xl:-top-150 lg:left-20 border-[#1A1F2A] border-70 w-[900px] h-[900px]" />
          <Ring className="absolute -bottom-200 -left-50  lg:-bottom-170 xl:-bottom-150 lg:left-0 xl:left-30 border-[#1A1F2A] border-70 w-[900px] h-[900px]" />
        </div>
      </div>
    </section>
  )
}
