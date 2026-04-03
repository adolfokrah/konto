'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { Button } from './ui/button'
import { toast } from 'sonner'
import { Separator } from './ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import CustomFields from './CustomFields'
import type { CustomField } from './ContributionInput'

export type { CustomField }

interface PaymentMethodOption {
  id: string
  type: string
}

interface ContributionInputPaystackProps {
  currency?: string
  isFixedAmount?: boolean
  fixedAmount?: number
  className?: string
  jarId?: string
  jarName?: string
  collectorId?: string | { id: string } | undefined
  allowAnonymousContributions?: boolean
  transactionFeePercentage?: number
  customFields?: CustomField[]
  paymentMethods?: PaymentMethodOption[]
}

function toPaystackChannels(type: string): string[] {
  const lower = type.toLowerCase()
  if (lower.includes('mobile')) return ['mobile_money']
  if (lower.includes('card')) return ['card']
  if (lower.includes('bank')) return ['bank_transfer']
  return ['mobile_money', 'card', 'bank_transfer']
}

export default function ContributionInputPaystack({
  currency = 'GHS',
  isFixedAmount = false,
  fixedAmount = 0,
  className = '',
  jarId = '',
  jarName = 'Jar Contribution',
  collectorId = undefined,
  allowAnonymousContributions = false,
  transactionFeePercentage = 1.95,
  customFields = [],
  paymentMethods = [],
}: ContributionInputPaystackProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(
    () => paymentMethods[0]?.type ?? '',
  )
  const [selectedAmount, setSelectedAmount] = useState<number>(isFixedAmount ? fixedAmount : 50)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [isCustom, setIsCustom] = useState(false)
  const [contributorName, setContributorName] = useState('')
  const [contributorEmail, setContributorEmail] = useState('')
  const [contributorPhoneNumber, setContributorPhoneNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({})
  const [charges, setCharges] = useState<{
    platformCharge: number
    amountPaidByContributor: number
    minimumContributionAmount: number
  } | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Load Paystack inline script once
  useEffect(() => {
    if (document.getElementById('paystack-inline-js')) return
    const script = document.createElement('script')
    script.id = 'paystack-inline-js'
    script.src = 'https://js.paystack.co/v2/inline.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  const presetAmounts =
    currency === 'GHS' ? [500, 200, 100, 50, 10, 5] : [5000, 2000, 1000, 500, 100, 50]

  const handlePresetClick = (amount: number) => {
    if (isFixedAmount) return
    setSelectedAmount(amount)
    setIsCustom(false)
    setCustomAmount('')
  }

  const handleCustomAmountChange = (value: string) => {
    if (isFixedAmount) return
    const numericValue = value.replace(/[^0-9.]/g, '')
    setCustomAmount(numericValue)
    if (numericValue) {
      const amount = parseFloat(numericValue)
      if (!isNaN(amount) && amount > 0) {
        setSelectedAmount(amount)
        setIsCustom(true)
      }
    }
  }

  // Fetch live charge breakdown (debounced)
  useEffect(() => {
    if (selectedAmount <= 0) {
      setCharges(null)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ amount: String(selectedAmount) })
        if (jarId) params.set('jarId', jarId)
        if (selectedPaymentMethod) params.set('paymentMethod', selectedPaymentMethod)
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/transactions/get-charges?${params}`,
        )
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            const feePaidBy = data.collectionFeePaidBy ?? 'contributor'
            const amountPaidByContributor = feePaidBy === 'contributor'
              ? data.initialAmount + data.processingFee
              : data.initialAmount
            setCharges({
              platformCharge: data.processingFee,
              amountPaidByContributor,
              minimumContributionAmount: data.minimumContributionAmount ?? 2,
            })
            return
          }
        }
      } catch {
        // fall through to local fallback
      }
      const feeRate = transactionFeePercentage / 100
      const amountPaidByContributor = Math.round((selectedAmount / (1 - feeRate) + 0.01) * 100) / 100
      const fee = Math.round((amountPaidByContributor - selectedAmount) * 100) / 100
      setCharges({
        platformCharge: fee,
        amountPaidByContributor,
        minimumContributionAmount: 2,
      })
    }, 400)
  }, [selectedAmount, jarId, selectedPaymentMethod]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleContribute = async () => {
    if (selectedAmount <= 0) return

    if (!isAnonymous && !contributorName) {
      toast.error('Missing Information', {
        description: 'Please enter your name to continue',
        duration: 4000,
      })
      return
    }

    if (!isAnonymous && !contributorEmail) {
      toast.error('Missing Information', {
        description: 'Please enter your email address to continue',
        duration: 4000,
      })
      return
    }

    for (const field of customFields) {
      if (field.required) {
        const value = customFieldValues[field.id]
        if (value === undefined || value === null || value === '') {
          toast.error('Missing Information', {
            description: `"${field.label}" is required`,
            duration: 4000,
          })
          return
        }
      }
    }

    setIsLoading(true)

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/transactions/initialize-paystack-payment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jarId,
            contributorName: isAnonymous ? 'Anonymous' : contributorName,
            contributorEmail: isAnonymous
              ? `anonymous.${Date.now()}@contributor.hogapay.com`
              : contributorEmail,
            contributorPhoneNumber,
            amount: selectedAmount,
            paymentMethod: selectedPaymentMethod || undefined,
            channels: toPaystackChannels(selectedPaymentMethod || paymentMethods[0]?.type || ''),
            collector: typeof collectorId === 'object' ? collectorId?.id : collectorId,
            ...(remarks.trim() ? { remarks: remarks.trim() } : {}),
            ...(Object.keys(customFieldValues).length > 0 ? { customFieldValues } : {}),
          }),
        },
      )

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to initialize payment')
      }

      const PaystackPop = (window as any).PaystackPop
      if (!PaystackPop || typeof PaystackPop !== 'function') {
        window.location.href = data.data.authorization_url
        return
      }

      const transactionId = data.data.transactionId
      setPendingTransactionId(transactionId)
      setIsLoading(false)

      const popup = new PaystackPop()
      popup.resumeTransaction(data.data.access_code, {
        onSuccess: (transaction: any) => {
          setPendingTransactionId(null)
          window.location.href = `/pay/callback?reference=${transaction.reference}`
        },
        onCancel: () => {
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/transactions/verify-paystack-payment?reference=${transactionId}`,
          ).catch(() => {})
          setPendingTransactionId(null)
        },
      })
    } catch (error: any) {
      setIsLoading(false)
      toast.error('Contribution Failed', {
        description: error.message || 'Failed to process contribution. Please try again.',
        duration: 5000,
      })
    }
  }

  const formatAmount = (amount: number) => amount.toFixed(2)

  const contributionAmount = selectedAmount
  const totalAmountToPay =
    charges?.amountPaidByContributor ?? contributionAmount * (1 + transactionFeePercentage / 100)
  const transactionFee = totalAmountToPay - contributionAmount

  return (
    <div className={`bg-white ${className}`}>
      <h2 className="text-lg font-supreme font-medium text-black mb-6">Enter your contribution</h2>

      {/* Preset Amount Buttons */}
      {!isFixedAmount && (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-1 mb-6">
          {presetAmounts.map((amount) => (
            <Button
              key={amount}
              onClick={() => handlePresetClick(amount)}
              className={`px-5 hover:text-white hover:bg-black py-7 rounded-2xl border-2 font-supreme font-medium transition-all cursor-pointer duration-200 text-sm sm:text-base ${
                selectedAmount === amount && !isCustom
                  ? 'bg-black text-white border-black hover:text-black'
                  : 'bg-white text-black border-gray-300 hover:border-gray-400'
              }`}
            >
              {currency} {amount}
            </Button>
          ))}
        </div>
      )}

      {/* Custom Amount Input */}
      <div className="mb-6">
        <div className="flex items-center border-2 border-gray-300 rounded-2xl p-4 bg-white focus-within:border-gray-400 transition-colors">
          <span className="text-lg sm:text-xl font-supreme font-medium text-black mr-2 sm:mr-4 shrink-0">
            {currency}
          </span>
          <input
            type="text"
            value={
              isFixedAmount
                ? formatAmount(fixedAmount)
                : isCustom
                  ? customAmount
                  : formatAmount(selectedAmount)
            }
            onChange={(e) => handleCustomAmountChange(e.target.value)}
            placeholder="0.00"
            disabled={isFixedAmount}
            className="flex-1 min-w-0 text-right text-xl sm:text-2xl lg:text-3xl font-supreme font-bold text-black bg-transparent outline-none disabled:opacity-50"
          />
        </div>
      </div>

      {/* Payment Method Select */}
      {paymentMethods.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-supreme font-medium text-gray-700 mb-2">
            Payment method
          </label>
          <div className="relative">
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="w-full p-4 pr-12 border-2 border-gray-300 rounded-2xl font-supreme outline-none focus:border-gray-400 transition-colors bg-white text-black appearance-none"
            >
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.type}>
                  {pm.type}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>
      )}

      {/* Contributor Information */}
      <div className="space-y-4 mb-6">
        {allowAnonymousContributions && (
          <label className="flex items-center">
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            <span className="ml-3 text-sm font-supreme text-gray-700">
              {isAnonymous ? 'You are contributing anonymously' : 'Turn on to contribute anonymously'}
            </span>
          </label>
        )}

        {!isAnonymous && (
          <>
            <input
              type="text"
              placeholder="Your name"
              value={contributorName}
              onChange={(e) => setContributorName(e.target.value)}
              className="w-full p-4 border-2 border-gray-300 rounded-2xl font-supreme outline-none focus:border-gray-400 transition-colors"
            />
            <input
              type="email"
              placeholder="Your email address"
              value={contributorEmail}
              onChange={(e) => setContributorEmail(e.target.value)}
              className="w-full p-4 border-2 border-gray-300 rounded-2xl font-supreme outline-none focus:border-gray-400 transition-colors"
            />
            <input
              type="tel"
              placeholder="Phone number"
              value={contributorPhoneNumber}
              onChange={(e) => setContributorPhoneNumber(e.target.value)}
              className="w-full p-4 border-2 border-gray-300 rounded-2xl font-supreme outline-none focus:border-gray-400 transition-colors"
            />
          </>
        )}

        <CustomFields
          fields={customFields}
          values={customFieldValues}
          onChange={(id, value) => setCustomFieldValues((prev) => ({ ...prev, [id]: value }))}
        />

        <div>
          <textarea
            placeholder="Leave a message for this jar (optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            maxLength={800}
            rows={3}
            className="w-full p-4 border-2 border-gray-300 rounded-2xl font-supreme outline-none focus:border-gray-400 transition-colors resize-none"
          />
          {remarks.length > 0 && (
            <p className="text-xs text-gray-400 text-right mt-1">{remarks.length}/800</p>
          )}
        </div>
      </div>

      <Separator />

      <div className="font-supreme space-y-2">
        <h3 className="font-bold my-2 mb-2">Your contribution</h3>

        <div className="flex justify-between text-gray-700">
          <span>Contribution amount</span>
          <span>
            {currency} {formatAmount(contributionAmount)}
          </span>
        </div>

        <div className="flex justify-between text-gray-700">
          <span>Processing fee</span>
          <span>
            {currency} {formatAmount(transactionFee)}
          </span>
        </div>

        <div className="flex justify-between font-bold text-black pt-2 border-t border-gray-200">
          <span>Total due to pay</span>
          <span>
            {currency} {formatAmount(totalAmountToPay)}
          </span>
        </div>
      </div>

      {charges?.minimumContributionAmount != null && selectedAmount > 0 && selectedAmount < charges.minimumContributionAmount && (
        <p className="text-sm text-red-500 font-supreme mt-2 mb-2">
          Minimum contribution is {currency} {charges.minimumContributionAmount}
        </p>
      )}
      <button
        onClick={handleContribute}
        disabled={
          selectedAmount <= 0 ||
          selectedAmount < (charges?.minimumContributionAmount ?? 2) ||
          isLoading ||
          (!isAnonymous && !contributorName) ||
          (!isAnonymous && !contributorEmail)
        }
        className="w-full bg-black text-white py-4 mt-8 cursor-pointer rounded-full flex items-center justify-center font-supreme font-medium text-lg hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        {isLoading ? <Spinner className="w-5 h-5" /> : 'Contribute'}
      </button>

      <p className="text-sm font-supreme text-gray-600 leading-relaxed">
        Upon completing this contribution, you agree to hoga&apos;s{' '}
        <Link href="https://hogapay.com/terms" className="text-blue-500">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="https://hogapay.com/privacy-policy" className="text-blue-500">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  )
}
