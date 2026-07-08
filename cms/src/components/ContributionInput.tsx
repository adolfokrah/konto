'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from './ui/button'
import { toast } from 'sonner'
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import PaymentWaitingModal from './PaymentWaitingModal'
import ThreeDSModal from './ThreeDSModal'
import { ChevronDown } from 'lucide-react'
import useSWRMutation from 'swr/mutation'
import Image from 'next/image'
import CustomFields from './CustomFields'

type PaymentChannel = 'mobile-money' | 'card'

type CardBrand = {
  key: 'visa' | 'mastercard' | 'amex' | 'discover' | 'verve' | 'unknown'
  name: string
  gaps: number[] // positions to insert a space
  maxLength: number // max digits (no spaces)
  cvvLength: number
}

/**
 * Detect card brand from the leading digits (IIN/BIN ranges).
 * Returns formatting rules (grouping + length + CVV length) for the brand.
 */
function detectCardBrand(value: string): CardBrand {
  const d = value.replace(/\D/g, '')

  // American Express: 34, 37 — 15 digits, 4-6-5 grouping, 4-digit CID
  if (/^3[47]/.test(d)) {
    return { key: 'amex', name: 'Amex', gaps: [4, 10], maxLength: 15, cvvLength: 4 }
  }
  // Visa: starts with 4
  if (/^4/.test(d)) {
    return { key: 'visa', name: 'Visa', gaps: [4, 8, 12], maxLength: 16, cvvLength: 3 }
  }
  // Mastercard: 51-55 or 2221-2720
  if (/^5[1-5]/.test(d) || /^2(2[2-9]|[3-6]|7[01]|720)/.test(d)) {
    return { key: 'mastercard', name: 'Mastercard', gaps: [4, 8, 12], maxLength: 16, cvvLength: 3 }
  }
  // Verve (Ghana/Nigeria): 5060, 5061, 650, 5078...
  if (/^(506[01]|650|5078)/.test(d)) {
    return { key: 'verve', name: 'Verve', gaps: [4, 8, 12], maxLength: 19, cvvLength: 3 }
  }
  // Discover: 6011, 644-649, 65
  if (/^(6011|64[4-9]|65)/.test(d)) {
    return { key: 'discover', name: 'Discover', gaps: [4, 8, 12], maxLength: 16, cvvLength: 3 }
  }
  return { key: 'unknown', name: '', gaps: [4, 8, 12], maxLength: 19, cvvLength: 4 }
}

/** Insert spaces into a digit string according to the brand's grouping. */
function formatCardNumber(value: string, brand: CardBrand): string {
  const d = value.replace(/\D/g, '').slice(0, brand.maxLength)
  let out = ''
  for (let i = 0; i < d.length; i++) {
    if (brand.gaps.includes(i)) out += ' '
    out += d[i]
  }
  return out
}

/** Small brand mark shown inside the card number field. */
function CardBrandMark({ brand }: { brand: CardBrand['key'] }) {
  const common = { height: 20, className: 'shrink-0' }
  switch (brand) {
    case 'visa':
      return (
        <svg viewBox="0 0 48 16" width={38} {...common} aria-label="Visa">
          <text x="0" y="14" fontSize="16" fontWeight="700" fontStyle="italic" fill="#1A1F71">
            VISA
          </text>
        </svg>
      )
    case 'mastercard':
      return (
        <svg viewBox="0 0 36 24" width={30} {...common} aria-label="Mastercard">
          <circle cx="14" cy="12" r="10" fill="#EB001B" />
          <circle cx="22" cy="12" r="10" fill="#F79E1B" fillOpacity="0.85" />
        </svg>
      )
    case 'amex':
      return (
        <svg viewBox="0 0 40 16" width={38} {...common} aria-label="American Express">
          <rect width="40" height="16" rx="2" fill="#2E77BC" />
          <text x="4" y="12" fontSize="9" fontWeight="700" fill="#fff">
            AMEX
          </text>
        </svg>
      )
    case 'discover':
      return (
        <svg viewBox="0 0 60 16" width={48} {...common} aria-label="Discover">
          <text x="0" y="13" fontSize="12" fontWeight="700" fill="#F26E21">
            DISCOVER
          </text>
        </svg>
      )
    case 'verve':
      return (
        <svg viewBox="0 0 44 16" width={38} {...common} aria-label="Verve">
          <text x="0" y="13" fontSize="12" fontWeight="700" fill="#00425F">
            Verve
          </text>
        </svg>
      )
    default:
      return null
  }
}

export type CustomField = {
  id: string
  label: string
  fieldType: 'text' | 'number' | 'select' | 'checkbox' | 'phone' | 'email'
  required?: boolean
  placeholder?: string
  options?: { label: string; value: string }[]
}

interface ContributionInputProps {
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
  acceptingContributions?: boolean
  actionLabel?: 'contribute' | 'donate'
}

export default function ContributionInput({
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
  acceptingContributions = true,
  actionLabel = 'contribute',
}: ContributionInputProps) {
  const actionWord = actionLabel === 'donate' ? 'Donate' : 'Contribute'
  const [selectedAmount, setSelectedAmount] = useState<number>(isFixedAmount ? fixedAmount : 50)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [isCustom, setIsCustom] = useState(false)
  const [contributorName, setContributorName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [contributorPhoneNumber, setContributorPhoneNumber] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState<'mtn' | 'telecel'>('mtn')
  const [paymentChannel, setPaymentChannel] = useState<PaymentChannel>('mobile-money')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('') // MM/YY
  const [cardCvv, setCardCvv] = useState('')
  const cardBrand = detectCardBrand(cardNumber)
  const [cardHolderName, setCardHolderName] = useState('')
  const [threeDsHtml, setThreeDsHtml] = useState<string | null>(null)
  const [showThreeDs, setShowThreeDs] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle')
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({})
  const [charges, setCharges] = useState<{
    platformCharge: number
    amountPaidByContributor: number
  } | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const { trigger: createContribution } = useSWRMutation(
    `${process.env.NEXT_PUBLIC_API_URL}/transactions/create-payment-link-contribution`,
    async (url: string, { arg }: { arg: Record<string, any> }) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to create contribution')
      return data
    },
  )

  const { trigger: chargeMomo } = useSWRMutation(
    `${process.env.NEXT_PUBLIC_API_URL}/transactions/charge-momo-eganow`,
    async (url: string, { arg }: { arg: { contributionId: string } }) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to initiate payment')
      return data
    },
  )

  const { trigger: chargeCard } = useSWRMutation(
    `${process.env.NEXT_PUBLIC_API_URL}/transactions/charge-card-eganow`,
    async (
      url: string,
      {
        arg,
      }: {
        arg: {
          contributionId: string
          cardNumber: string
          expiryMonth: number
          expiryYear: number
          cvv: string
          cardHolderName: string
        }
      },
    ) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to initiate card payment')
      return data
    },
  )

  const currencySymbol = currency === 'GHS' ? '₵' : '₦'

  // Preset amounts based on currency
  const presetAmounts =
    currency === 'GHS' ? [500, 200, 100, 50, 10, 5] : [5000, 2000, 1000, 500, 100, 50] // NGN amounts

  const handlePresetClick = (amount: number) => {
    if (isFixedAmount) return // Don't allow changes for fixed amounts

    setSelectedAmount(amount)
    setIsCustom(false)
    setCustomAmount('')
  }

  const handleCustomAmountChange = (value: string) => {
    if (isFixedAmount) return // Don't allow changes for fixed amounts

    // Only allow numbers and decimal point
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

  const verifyPayment = async (reference: string) => {
    try {
      const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/verify-payment-ega-now`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference: reference,
        }),
      })

      const verifyData = await verifyResponse.json()
      console.log('Verify response:', { ok: verifyResponse.ok, data: verifyData })
      return { success: verifyResponse.ok && verifyData.success, data: verifyData.data }
    } catch (error) {
      console.error('Verification error:', error)
      return { success: false, data: null, error }
    }
  }

  const startPaymentPolling = (reference: string) => {
    setPaymentStatus('pending')
    const interval = setInterval(async () => {
      const result = await verifyPayment(reference)
      
      console.log('Polling result:', result)
      
      if (result.success && (result.data?.status === 'completed' || result.data?.status === 'success')) {
        // Payment successful
        console.log('Payment successful, navigating to congratulations page')
        if (pollingInterval) clearInterval(pollingInterval)
        setPollingInterval(null)
        setShowPaymentModal(false)
        setShowThreeDs(false)
        setIsLoading(false)
        setPaymentStatus('success')

        // Redirect to congratulations page
        const congratsParams = new URLSearchParams({
          reference,
          amount: selectedAmount.toString(),
          jarName: jarName,
          contributorName: isAnonymous ? 'Anonymous' : contributorName,
          paymentLink: window.location.href,
        })
        router.push(`/congratulations?${congratsParams.toString()}`)
      } else if (result.data?.status === 'failed') {
        // Payment failed
        if (pollingInterval) clearInterval(pollingInterval)
        setPollingInterval(null)
        setShowPaymentModal(false)
        setShowThreeDs(false)
        setIsLoading(false)
        setPaymentStatus('failed')

        toast.error('Payment Failed', {
          description: result.data?.message || 'Your payment was not successful. Please try again.',
          duration: 5000,
        })
      }
      // If still pending, continue polling
    }, 3000) // Poll every 3 seconds

    setPollingInterval(interval)

    // Set timeout to stop polling after 5 minutes
    setTimeout(() => {
      if (interval) {
        clearInterval(interval)
        setPollingInterval(null)
        setShowPaymentModal(false)
        setShowThreeDs(false)
        setIsLoading(false)
        setPaymentStatus('failed')

        toast.error('Payment Timeout', {
          description: 'Payment verification timed out. Please check your phone and try again.',
          duration: 5000,
        })
      }
    }, 300000) // 5 minutes
  }

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  // Fetch live charge breakdown from backend whenever amount changes (debounced)
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
        params.set('paymentMethod', paymentChannel)
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/transactions/get-charges?${params}`,
        )
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setCharges({
              platformCharge: data.platformCharge,
              amountPaidByContributor: data.amountPaidByContributor,
            })
            return
          }
        }
      } catch {
        // fall through to local fallback
      }
      // Fallback: compute locally if API unavailable
      const feePercent = paymentChannel === 'card' ? 3 : transactionFeePercentage
      const fee = contributionAmount * (feePercent / 100)
      setCharges({
        platformCharge: fee,
        amountPaidByContributor: contributionAmount + fee,
      })
    }, 400)
  }, [selectedAmount, jarId, paymentChannel]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleContribute = async () => {
    if (selectedAmount <= 0) return
    if (!isAnonymous && !contributorName) {
      toast.error('Missing Information', {
        description: 'Please enter your name to continue',
        duration: 4000,
      })
      return
    }

    if (paymentChannel === 'mobile-money' && !isAnonymous && !contributorPhoneNumber) {
      toast.error('Missing Information', {
        description: 'Please enter your phone number to continue',
        duration: 4000,
      })
      return
    }

    if (paymentChannel === 'card') {
      const digits = cardNumber.replace(/\s+/g, '')
      const expiryMatch = cardExpiry.match(/^(\d{2})\s*\/\s*(\d{2})$/)
      // Only Visa and Mastercard are supported for now.
      if (cardBrand.key !== 'visa' && cardBrand.key !== 'mastercard') {
        toast.error('Card not supported', {
          description: 'Only Visa and Mastercard are accepted.',
          duration: 4000,
        })
        return
      }
      // Visa/Mastercard: 16 digits, 3-digit CVV.
      if (digits.length !== 16 || !/^\d+$/.test(digits)) {
        toast.error('Invalid card', { description: 'Enter a valid card number', duration: 4000 })
        return
      }
      if (!expiryMatch || Number(expiryMatch[1]) < 1 || Number(expiryMatch[1]) > 12) {
        toast.error('Invalid card', { description: 'Enter expiry as MM/YY', duration: 4000 })
        return
      }
      if (cardCvv.length !== 3) {
        toast.error('Invalid card', {
          description: 'Enter the 3-digit CVV',
          duration: 4000,
        })
        return
      }
    }

    // Validate required custom fields
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
    setPaymentStatus('idle')

    try {
      // Create contribution record using our custom endpoint with admin access
      const contributionData = await createContribution({
        jarId,
        contributorName: isAnonymous ? 'Anonymous' : contributorName,
        amount: selectedAmount,
        currency,
        paymentMethod: paymentChannel,
        collector: typeof collectorId === 'object' ? collectorId?.id : collectorId,
        ...(paymentChannel === 'mobile-money'
          ? { contributorPhoneNumber, mobileMoneyProvider }
          : {}),
        ...(remarks.trim() ? { remarks: remarks.trim() } : {}),
        ...(Object.keys(customFieldValues).length > 0 ? { customFieldValues } : {}),
      })

      const contributionId = contributionData.data.id

      if (paymentChannel === 'card') {
        const [mm, yy] = cardExpiry.split('/').map((s) => s.trim())
        const chargeData = await chargeCard({
          contributionId,
          cardNumber: cardNumber.replace(/\s+/g, ''),
          expiryMonth: Number(mm),
          expiryYear: Number(yy),
          cvv: cardCvv,
          cardHolderName: isAnonymous ? 'Anonymous' : contributorName,
        })

        const transactionReference = chargeData?.data?.reference

        // Render the 3D Secure challenge only when Eganow returns a real HTML page.
        // Frictionless payments return no challenge — just poll for the final status.
        const redirectHtml = chargeData?.data?.redirectHtml
        if (typeof redirectHtml === 'string' && redirectHtml.includes('<')) {
          setThreeDsHtml(redirectHtml)
          setShowThreeDs(true)
        }
        // Frictionless (no challenge): keep the button spinner while polling — no modal.
        startPaymentPolling(transactionReference)
      } else {
        // Charge mobile money via Eganow
        const chargeData = await chargeMomo({ contributionId })

        // Get transaction reference from charge response
        const transactionReference = chargeData?.data?.reference

        // Show waiting modal
        setShowPaymentModal(true)

        // Start polling for payment verification using transactionReference
        startPaymentPolling(transactionReference)
      }
    } catch (error: any) {
      setIsLoading(false)
      setPaymentStatus('failed')
      toast.error('Contribution Failed', {
        description: error.message || 'Failed to process contribution. Please try again.',
        duration: 5000,
      })
    }
  }

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    try {
      if (navigator.share) {
        await navigator.share({ title: jarName, url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied', { description: 'Share it with friends and family.' })
      }
    } catch {
      // user dismissed the share sheet — ignore
    }
  }

  const formatAmount = (amount: number) => {
    return amount.toFixed(2)
  }

  const contributionAmount = selectedAmount
  // Use live charges from API; fall back to local calculation while loading
  const totalAmountToPay = charges?.amountPaidByContributor ?? contributionAmount * (1 + transactionFeePercentage / 100)
  const transactionFee = totalAmountToPay - contributionAmount

  if (!acceptingContributions) {
    return (
      <div className={`bg-white ${className}`}>
        <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-6 text-center font-supreme">
          <h2 className="text-lg font-medium text-black mb-2">Not accepting contributions yet</h2>
          <p className="text-sm text-gray-600">
            This organizer is completing business verification. Please check back soon.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white ${className}`}>
      {/* Section label */}
      <h2 className="text-xs font-supreme font-bold uppercase tracking-wider text-gray-400 mb-3">
        Enter your {actionLabel === 'donate' ? 'donation' : 'contribution'}
      </h2>

      {/* Preset Amount Buttons */}
      {!isFixedAmount && (
        <div className="grid grid-cols-3 gap-2 mb-2.5">
          {presetAmounts.map((amount) => (
            <Button
              key={amount}
              size="clear"
              onClick={() => handlePresetClick(amount)}
              className={`px-2 hover:text-white hover:bg-black py-4 rounded-2xl border-2 font-supreme font-medium transition-all cursor-pointer duration-200 text-sm sm:text-base tabular-nums ${
                selectedAmount === amount && !isCustom
                  ? 'bg-black text-white border-black hover:text-black'
                  : 'bg-white text-black border-gray-300 hover:border-gray-400'
              }`}
            >
              {currencySymbol}
              {amount}
            </Button>
          ))}
        </div>
      )}

      {/* Custom Amount Input */}
      <div className="mb-6">
        <div className="flex items-center border-2 border-gray-300 rounded-2xl px-4 py-3 bg-white focus-within:border-gray-400 transition-colors">
          <span className="text-base font-supreme font-medium text-black mr-3 flex-shrink-0">
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
            className="flex-1 min-w-0 text-right text-2xl font-supreme font-bold text-black bg-transparent outline-none disabled:opacity-50 tabular-nums"
          />
        </div>
      </div>

      {/* Contributor Information */}
      <div className="space-y-4 mb-6">

        {allowAnonymousContributions && (
          <div>
           <label className='flex items-center'>
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            <span className="ml-3 text-sm font-supreme text-gray-700">
              {isAnonymous ? 'You are contributing anonymously' : 'Turn on to contribute anonymously'}
            </span>
          </label>
        </div>
        )}
        <div>
          <input
            type={isAnonymous ? 'hidden' : 'text'}
            placeholder="Your name"
            value={isAnonymous ? 'Anonymous' :  contributorName}
            onChange={(e) => setContributorName(e.target.value)}
            className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-2xl font-supreme outline-none focus:border-gray-400 transition-colors"
            required
          />
        </div>

        {/* Payment method toggle (vertical, with supported brand logos) */}
        <div>
          <h3 className="text-xs font-supreme font-bold uppercase tracking-wider text-gray-400 mb-3 mt-2">
            Pay with
          </h3>
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => setPaymentChannel('mobile-money')}
              className={`w-full flex items-center justify-between gap-4 px-4 py-3 rounded-2xl border-2 font-supreme font-medium transition-all cursor-pointer ${
                paymentChannel === 'mobile-money'
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-gray-300 hover:border-gray-400'
              }`}
            >
              <span className="text-base">Mobile Money</span>
              <span className="flex items-center rounded-lg bg-white px-2 py-1">
                <Image
                  src="/payment-logos/momo.png"
                  alt="MTN Mobile Money and Telecel Cash"
                  width={92}
                  height={28}
                  className="h-6 w-auto object-contain"
                />
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentChannel('card')}
              className={`w-full flex items-center justify-between gap-4 px-4 py-3 rounded-2xl border-2 font-supreme font-medium transition-all cursor-pointer ${
                paymentChannel === 'card'
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-gray-300 hover:border-gray-400'
              }`}
            >
              <span className="text-base">Card</span>
              <span className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5">
                {(['visa', 'mastercard'] as const).map((b) => (
                  <CardBrandMark key={b} brand={b} />
                ))}
              </span>
            </button>
          </div>
        </div>

        {paymentChannel === 'mobile-money' ? (
          <>
            <div className="relative">
              <select
                value={mobileMoneyProvider}
                onChange={(e) => setMobileMoneyProvider(e.target.value as 'mtn' | 'telecel')}
                className="w-full h-14 border-2 border-gray-300 rounded-2xl font-supreme bg-white text-black hover:border-gray-400 transition-colors px-4 pr-10 appearance-none outline-none focus:border-gray-400"
              >
                <option value="mtn">MTN Mobile Money</option>
                <option value="telecel">Telecel Cash</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>

            {isAnonymous && (
              <div className="mb-2">
                <small className="text-gray-500">
                  We only use your phone number to process your payment. This information is not
                  shared with the organizer.
                </small>
              </div>
            )}

            <div>
              <input
                type={'text'}
                placeholder="Phone number"
                value={contributorPhoneNumber}
                onChange={(e) => setContributorPhoneNumber(e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-2xl font-supreme outline-none focus:border-gray-400 transition-colors"
                required
              />
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="Card number"
                value={cardNumber}
                onChange={(e) => {
                  const brand = detectCardBrand(e.target.value)
                  setCardNumber(formatCardNumber(e.target.value, brand))
                }}
                className="w-full px-4 py-3.5 pr-20 border-2 border-gray-300 rounded-2xl font-supreme outline-none focus:border-gray-400 transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                <CardBrandMark brand={cardBrand.key} />
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/YY"
                value={cardExpiry}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d]/g, '').slice(0, 4)
                  setCardExpiry(v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v)
                }}
                className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-2xl font-supreme outline-none focus:border-gray-400 transition-colors"
              />
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder={cardBrand.cvvLength === 4 ? 'CID (4 digits)' : 'CVV'}
                value={cardCvv}
                onChange={(e) =>
                  setCardCvv(e.target.value.replace(/[^\d]/g, '').slice(0, cardBrand.cvvLength))
                }
                className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-2xl font-supreme outline-none focus:border-gray-400 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Custom fields defined by the jar creator */}
        <CustomFields
          fields={customFields}
          values={customFieldValues}
          onChange={(id, value) => setCustomFieldValues((prev) => ({ ...prev, [id]: value }))}
        />

        <div>
          <textarea
            placeholder="Leave a message for this jar (optional)"
            value={remarks}
            onChange={(e) => setRemarks(()=>e.target.value)}
            maxLength={800}
            rows={3}
            className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-2xl font-supreme outline-none focus:border-gray-400 transition-colors resize-none"
          />
          {remarks.length > 0 && (
            <p className="text-xs text-gray-400 text-right mt-1">{remarks.length}/800</p>
          )}
        </div>
      </div>

      <div className="font-supreme border-t border-dashed border-gray-300 pt-3.5 space-y-1">
        {/* Contribution Amount */}
        <div className="flex justify-between text-sm text-gray-600 tabular-nums py-0.5">
          <span>Contribution amount</span>
          <span>
            {currency} {formatAmount(contributionAmount)}
          </span>
        </div>

        {/* Transaction Fee */}
        <div className="flex justify-between text-sm text-gray-600 tabular-nums py-0.5">
          <span>Processing fee</span>
          <span>
            {currency} {formatAmount(transactionFee)}
          </span>
        </div>

        {/* Total Due */}
        <div className="flex justify-between font-bold text-black pt-2.5 mt-1.5 border-t border-gray-200 tabular-nums">
          <span>Total due to pay</span>
          <span>
            {currency} {formatAmount(totalAmountToPay)}
          </span>
        </div>

        {/* Currency conversion notice (card) */}
        {paymentChannel === 'card' && (
          <p className="text-xs text-gray-500 pt-2">
            If your card is in another currency, your bank will convert the amount to{' '}
            {currency === 'GHS' ? 'Ghana Cedis (₵)' : currency} at their exchange rate.
          </p>
        )}

      </div>

      {/* Contribute Button */}
      <button
        onClick={handleContribute}
        disabled={
          selectedAmount <= 0 ||
          isLoading ||
          paymentStatus === 'pending' ||
          (!isAnonymous && !contributorName) ||
          (paymentChannel === 'mobile-money' && !isAnonymous && !contributorPhoneNumber)
        }
        className="w-full bg-black text-white py-4 mt-5 cursor-pointer rounded-full flex items-center justify-center gap-2 font-supreme font-medium text-base hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Spinner className="w-5 h-5" />
        ) : (
          <>
            {actionWord}
            <b className="font-bold tabular-nums">
              {currency} {formatAmount(totalAmountToPay)}
            </b>
          </>
        )}
      </button>

      {/* Share */}
      <button
        onClick={handleShare}
        type="button"
        className="w-full mt-2.5 mb-4 cursor-pointer rounded-full flex items-center justify-center gap-2 border-2 border-gray-300 py-3 font-supreme font-medium text-black hover:border-gray-400 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M12 3v13M7 8l5-5 5 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Share
      </button>

      {/* Payment Processing Fee Notice */}
      <p className="text-xs font-supreme text-gray-400 leading-relaxed text-center">
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

      {/* Payment Waiting Modal */}
      <PaymentWaitingModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false)
          setIsLoading(false)
          setPaymentStatus('failed')
          if (pollingInterval) {
            clearInterval(pollingInterval)
            setPollingInterval(null)
          }
        }}
        phoneNumber={contributorPhoneNumber}
        provider={mobileMoneyProvider}
      />

      {/* 3D Secure challenge for card payments */}
      <ThreeDSModal
        isOpen={showThreeDs}
        html={threeDsHtml}
        onClose={() => {
          setShowThreeDs(false)
          setIsLoading(false)
          setPaymentStatus('failed')
          if (pollingInterval) {
            clearInterval(pollingInterval)
            setPollingInterval(null)
          }
        }}
      />
    </div>
  )
}