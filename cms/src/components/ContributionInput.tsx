'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from './ui/button'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import useSWRMutation from 'swr/mutation'
import CustomFields from './CustomFields'

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
  /** No longer shown: the payer sees the fee on Eganow's hosted page. */
  transactionFeePercentage?: number
  customFields?: CustomField[]
  acceptingContributions?: boolean
  actionLabel?: 'contribute' | 'donate'
  /** Short share path for this page (/j/<code>[/<username>]); falls back to the page URL. */
  sharePath?: string
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
  customFields = [],
  acceptingContributions = true,
  actionLabel = 'contribute',
  sharePath,
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
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>(
    'idle',
  )
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({})
  const router = useRouter()

  /** The link to share for this jar: the short link when there is one, else this page. */
  const shareUrl = () =>
    typeof window === 'undefined'
      ? ''
      : sharePath
        ? `${window.location.origin}${sharePath}`
        : window.location.href

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

  const { trigger: createHostedCheckout } = useSWRMutation(
    `${process.env.NEXT_PUBLIC_API_URL}/transactions/charge-hosted-checkout-eganow`,
    async (url: string, { arg }: { arg: { contributionId: string } }) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to start payment')
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
      const verifyResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/transactions/verify-payment-ega-now`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reference: reference,
          }),
        },
      )

      const verifyData = await verifyResponse.json()
      console.log('Verify response:', { ok: verifyResponse.ok, data: verifyData })
      return { success: verifyResponse.ok && verifyData.success, data: verifyData.data }
    } catch (error) {
      console.error('Verification error:', error)
      return { success: false, data: null, error }
    }
  }

  // Back from Eganow's hosted checkout: verify the contribution named in `?reference=`
  // and only congratulate once it has actually settled.
  useEffect(() => {
    const reference = new URLSearchParams(window.location.search).get('reference')
    if (!reference) return

    let settled = false
    setIsLoading(true)
    setPaymentStatus('pending')

    // Drop the reference so a refresh or share doesn't re-run the check.
    const clearReference = () => {
      const url = new URL(window.location.href)
      url.searchParams.delete('reference')
      window.history.replaceState(null, '', url.toString())
    }

    const finish = (status: 'failed', title: string, description: string) => {
      settled = true
      setIsLoading(false)
      setPaymentStatus(status)
      clearReference()
      toast.error(title, { description, duration: 6000 })
    }

    const tick = async () => {
      if (settled) return
      const result = await verifyPayment(reference)
      if (settled) return
      const data = result.data

      if (result.success && (data?.status === 'success' || data?.status === 'completed')) {
        settled = true
        const params = new URLSearchParams({ reference })
        if (data.amount != null) params.set('amount', String(data.amount))
        params.set('jarName', data.jarName || jarName)
        if (data.contributor) params.set('contributorName', data.contributor)
        params.set('paymentLink', shareUrl())
        router.replace(`/congratulations?${params.toString()}`)
        return
      }

      if (data?.status === 'failed') {
        finish(
          'failed',
          'Payment Failed',
          'Your card payment was not completed. No money has left your account.',
        )
      }
    }

    void tick()
    const interval = setInterval(tick, 3000)
    const timeout = setTimeout(() => {
      if (!settled) {
        finish(
          'failed',
          'Still confirming',
          'We have not had confirmation yet. If your card was debited, the contribution will appear once the payment settles.',
        )
      }
    }, 120000)

    return () => {
      settled = true
      clearInterval(interval)
      clearTimeout(timeout)
    }
    // Runs once on arrival; the reference comes from the URL, not from state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleContribute = async () => {
    if (selectedAmount <= 0) return
    if (!isAnonymous && !contributorName) {
      toast.error('Missing Information', {
        description: 'Please enter your name to continue',
        duration: 4000,
      })
      return
    }

    if (!contributorPhoneNumber.trim()) {
      toast.error('Missing Information', {
        description: 'Please enter your phone number to continue',
        duration: 4000,
      })
      return
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
        contributorPhoneNumber: contributorPhoneNumber.trim(),
        amount: selectedAmount,
        currency,
        // The payer picks card or mobile money on Eganow's page; the webhook tells us which.
        paymentMethod: 'mobile-money',
        collector: typeof collectorId === 'object' ? collectorId?.id : collectorId,
        ...(remarks.trim() ? { remarks: remarks.trim() } : {}),
        ...(Object.keys(customFieldValues).length > 0 ? { customFieldValues } : {}),
      })

      const contributionId = contributionData.data.id

      // Eganow hosts the payment page, so we hand the payer over and let their page take
      // it from here. They come back to this page with `?reference=<id>`, and the effect
      // above verifies the payment before sending them to the congratulations page.
      const checkoutData = await createHostedCheckout({ contributionId })
      const checkoutUrl = checkoutData?.data?.checkoutUrl

      if (!checkoutUrl) {
        throw new Error('Could not start the payment. Please try again.')
      }

      window.location.href = checkoutUrl
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
    const url = shareUrl()
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
            <label className="flex items-center">
              <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              <span className="ml-3 text-sm font-supreme text-gray-700">
                {isAnonymous
                  ? 'You are contributing anonymously'
                  : 'Turn on to contribute anonymously'}
              </span>
            </label>
          </div>
        )}
        <div>
          <input
            type={isAnonymous ? 'hidden' : 'text'}
            placeholder="Your name"
            value={isAnonymous ? 'Anonymous' : contributorName}
            onChange={(e) => setContributorName(e.target.value)}
            className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-2xl font-supreme outline-none focus:border-gray-400 transition-colors"
            required
          />
        </div>

        {isAnonymous && (
          <div className="mb-2">
            <small className="text-gray-500">
              We only use your phone number to process your payment. This information is not shared
              with the organizer.
            </small>
          </div>
        )}

        <div>
          <input
            type="tel"
            placeholder="Phone number"
            value={contributorPhoneNumber}
            onChange={(e) => setContributorPhoneNumber(e.target.value)}
            className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-2xl font-supreme outline-none focus:border-gray-400 transition-colors"
            required
          />
        </div>

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
            onChange={(e) => setRemarks(() => e.target.value)}
            maxLength={800}
            rows={3}
            className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-2xl font-supreme outline-none focus:border-gray-400 transition-colors resize-none"
          />
          {remarks.length > 0 && (
            <p className="text-xs text-gray-400 text-right mt-1">{remarks.length}/800</p>
          )}
        </div>
      </div>

      <p className="text-xs font-supreme text-gray-500">
        You&apos;ll pay with mobile money or card on our payment partner&apos;s secure page, then
        come straight back here.
      </p>

      {/* Contribute Button */}
      <button
        onClick={handleContribute}
        disabled={
          selectedAmount <= 0 ||
          isLoading ||
          paymentStatus === 'pending' ||
          (!isAnonymous && !contributorName) ||
          !contributorPhoneNumber.trim()
        }
        className="w-full bg-black text-white py-4 mt-5 cursor-pointer rounded-full flex items-center justify-center gap-2 font-supreme font-medium text-base hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <Spinner className="w-5 h-5" /> : actionWord}
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
    </div>
  )
}
