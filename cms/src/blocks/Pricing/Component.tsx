'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/utilities/ui'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import TransactionCharges from '@/utilities/transaction-charges'
import Ring from '@/components/ui/ring'

type FeePayerOption = {
  label: string
  value: string
}

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
    feePayerLabel?: string
    feePayerOptions?: FeePayerOption[]
    chargesBreakdownLabel?: string
    telcoFeeLabel?: string
    platformFeeLabel?: string
    contributorPaysLabel?: string
    youReceiveLabel?: string
  }
  feeStructure?: {
    telcoTransactionFee?: number
    platformFeeMax?: number
  }
  features?: Feature[]
  ctaButton?: {
    text?: string
  }
  poweredBy?: {
    text?: string
    logo?: any
  }
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
}) => {
  const [requestAmount, setRequestAmount] = useState<number>(50)
  const [feePayer, setFeePayer] = useState<string>('organizer')
  const [calculations, setCalculations] = useState({
    totalAmount: 0,
    paystackCharge: 0,
    platformCharge: 0,
    amountAfterCharges: 0,
  })

  // Ref for the input to focus on button click
  const amountInputRef = React.useRef<HTMLInputElement>(null)

  const handleDoTheMathClick = () => {
    amountInputRef.current?.focus()
  }

  useEffect(() => {
    const isCreatorPaysPlatformFees = feePayer === 'organizer'
    const chargesCalculator = new TransactionCharges({ isCreatorPaysPlatformFees })
    const result = chargesCalculator.calculateAmountAndCharges(requestAmount)

    setCalculations({
      totalAmount: result.totalAmount,
      paystackCharge: result.paystackCharge,
      platformCharge: result.platformCharge,
      amountAfterCharges: result.amountAfterCharges,
    })
  }, [requestAmount, feePayer])

  // Get fee rates from the utility for display
  const chargesCalculator = new TransactionCharges()
  const paystackFeeRate = chargesCalculator.paystackFeeRate

  return (
    <section
      className={cn(
        'bg-dark-surface text-white py-16 md:py-70 relative',
        className,
      )}
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

            {/* Fee Payer Selection */}
            <div>
              <label className="block text-sm text-gray-400 mb-3">
                {calculatorSection?.feePayerLabel}
              </label>
              <select
                value={feePayer}
                onChange={(e) => setFeePayer(e.target.value)}
                className="w-full bg-dark-background border-dark-background rounded-xl px-4 h-18 text-white text-2xl focus:outline-none"
              >
                {calculatorSection?.feePayerOptions?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Charges Breakdown */}
            <div>
              <h4 className="text-lg my-7">{calculatorSection?.chargesBreakdownLabel}</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">
                    {calculatorSection?.telcoFeeLabel} {(paystackFeeRate * 100).toFixed(2)}%
                  </span>
                  <span className="font-medium">GHS {calculations.paystackCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">{calculatorSection?.platformFeeLabel}</span>
                  <span className="font-medium">GHS {calculations.platformCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">{calculatorSection?.contributorPaysLabel}</span>
                  <span className="font-medium">GHS {calculations.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* You Receive */}
            <div className="  pt-4">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-medium">{calculatorSection?.youReceiveLabel}</span>
                <span className="text-2xl font-bold">
                  GHS {calculations.amountAfterCharges.toFixed(2)}
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
      <div className='overflow-hidden absolute top-0 left-0 w-full h-full '>
       <div className='mx-auto  max-w-[2000px]'>
         <Ring className="absolute top-50 -right-160 lg:top-50 lg:-right-70 border-[#1A1F2A] border-70 w-[900px] h-[900px]" />
          <Ring className="absolute -left-100  -top-200 lg:-top-190 xl:-top-150 lg:left-20 border-[#1A1F2A] border-70 w-[900px] h-[900px]" />
          <Ring className="absolute -bottom-200 -left-50  lg:-bottom-170 xl:-bottom-150 lg:left-0 xl:left-30 border-[#1A1F2A] border-70 w-[900px] h-[900px]" />
       </div>
      </div>
    </section>
  )
}
