'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from './ui/button'
import { toast } from 'sonner'
import { Separator } from './ui/separator'
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import PaymentWaitingModal from './PaymentWaitingModal'
import { ChevronDown } from 'lucide-react'

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
}: ContributionInputProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(isFixedAmount ? fixedAmount : 50)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [isCustom, setIsCustom] = useState(false)
  const [contributorName, setContributorName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [contributorPhoneNumber, setContributorPhoneNumber] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState<'mtn' | 'airteltigo' | 'telecel'>('mtn')
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle')
  const router = useRouter()

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
      const verifyResponse = await fetch('/api/transactions/verify-payment-ega-now', {
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
        setIsLoading(false)
        setPaymentStatus('success')

        // Redirect to congratulations page
        const congratsParams = new URLSearchParams({
          reference,
          amount: selectedAmount.toString(),
          jarName: jarName,
          contributorName: isAnonymous ? 'Anonymous' : contributorName,
        })
        router.push(`/congratulations?${congratsParams.toString()}`)
      } else if (result.data?.status === 'failed') {
        // Payment failed
        if (pollingInterval) clearInterval(pollingInterval)
        setPollingInterval(null)
        setShowPaymentModal(false)
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

  const handleContribute = async () => {
    if (selectedAmount <= 0) return
    if (!isAnonymous && !contributorName) {
      toast.error('Missing Information', {
        description: 'Please enter your name to continue',
        duration: 4000,
      })
      return
    }

    if (!isAnonymous && !contributorPhoneNumber) {
      toast.error('Missing Information', {
        description: 'Please enter your phone number to continue',
        duration: 4000,
      })
      return
    }

    setIsLoading(true)
    setPaymentStatus('idle')

    try {
      // Create contribution record using our custom endpoint with admin access
      const contributionResponse = await fetch(
        '/api/transactions/create-payment-link-contribution',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jarId,
            contributorName: isAnonymous ? 'Anonymous' : contributorName,
            amount: selectedAmount,
            currency,
            contributorPhoneNumber: contributorPhoneNumber,
            mobileMoneyProvider: mobileMoneyProvider,
            collector: typeof collectorId === 'object' ? collectorId?.id : collectorId,
          }),
        },
      )

      const contributionData = await contributionResponse.json()

      if (!contributionResponse.ok) {
        throw new Error(contributionData.message || 'Failed to create contribution')
      }

      const contributionId = contributionData.data.id

      // Charge mobile money via Eganow
      const chargeResponse = await fetch('/api/transactions/charge-momo-eganow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contributionId: contributionId,
        }),
      })

      const chargeData = await chargeResponse.json()

      if (!chargeResponse.ok) {
        throw new Error(chargeData.message || 'Failed to initiate payment')
      }


      // Get transaction reference from charge response
      const transactionReference = chargeData?.data?.reference


      // Show waiting modal
      setShowPaymentModal(true)

      // Start polling for payment verification using transactionReference
      startPaymentPolling(transactionReference)

    } catch (error: any) {
      setIsLoading(false)
      setPaymentStatus('failed')
      toast.error('Contribution Failed', {
        description: error.message || 'Failed to process contribution. Please try again.',
        duration: 5000,
      })
    }
  }

  const formatAmount = (amount: number) => {
    return amount.toFixed(2)
  }

  // Calculate transaction fee from system settings (percentage is stored as 1.95, not 0.0195)
  const contributionAmount = selectedAmount
  const transactionFee = contributionAmount * (transactionFeePercentage / 100)
  const totalAmountToPay = contributionAmount + transactionFee

  return (
    <div className={`bg-white ${className}`}>
      {/* Header */}
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
        <div className="relative">
          <div className="flex items-center border-2 border-gray-300 rounded-2xl p-4 bg-white focus-within:border-gray-400 transition-colors">
            <span className="text-lg sm:text-xl font-supreme font-medium text-black mr-2 sm:mr-4 flex-shrink-0">
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
            className="w-full p-4 border-2 border-gray-300 rounded-2xl font-supreme outline-none focus:border-gray-400 transition-colors"
            required
          />
        </div>

          <div className="relative">
            <select
              value={mobileMoneyProvider}
              onChange={(e) => setMobileMoneyProvider(e.target.value as 'mtn' | 'airteltigo' | 'telecel')}
              className="w-full h-14 border-2 border-gray-300 rounded-2xl font-supreme bg-white text-black hover:border-gray-400 transition-colors px-4 pr-10 appearance-none outline-none focus:border-gray-400"
            >
              <option value="mtn">MTN Mobile Money</option>
              <option value="airteltigo">AirtelTigo Money</option>
              <option value="telecel">Telecel Cash</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          </div>

        {isAnonymous && (<div className='mb-2'>
          <small className="text-gray-500">We only use your phone number to process your payment. This information is not saved or shared.</small>
        </div>)}

        <div>
           
          <input
            type={'text'}
            placeholder="Phone number"
            value={contributorPhoneNumber}
            onChange={(e) => setContributorPhoneNumber(e.target.value)}
            className="w-full p-4 border-2 border-gray-300 rounded-2xl font-supreme outline-none focus:border-gray-400 transition-colors"
            required
          />
        </div>
      </div>

      <Separator />

      <div className="font-supreme space-y-2">
        <h3 className="font-bold my-2 mb-2">Your contribution</h3>

        {/* Contribution Amount */}
        <div className="flex justify-between text-gray-700">
          <span>Contribution amount</span>
          <span>
            {currency} {formatAmount(contributionAmount)}
          </span>
        </div>

        {/* Transaction Fee */}
        <div className="flex justify-between text-gray-700">
          <span>Transaction fee ({transactionFeePercentage}%)</span>
          <span>
            {currency} {formatAmount(transactionFee)}
          </span>
        </div>

        {/* Total Due */}
        <div className="flex justify-between font-bold text-black pt-2 border-t border-gray-200">
          <span>Total due to pay</span>
          <span>
            {currency} {formatAmount(totalAmountToPay)}
          </span>
        </div>
      </div>

      {/* Contribute Button */}
      <button
        onClick={handleContribute}
        disabled={
          selectedAmount <= 0 || isLoading || paymentStatus === 'pending' || (!isAnonymous && !contributorName) || (!isAnonymous && !contributorPhoneNumber)
        }
        className="w-full bg-black text-white py-4 mt-8 cursor-pointer rounded-full flex items-center justify-center font-supreme font-medium text-lg hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        {isLoading ? <Spinner className='w-5 h-5'/> : 'Contribute'}
      </button>

      {/* Payment Processing Fee Notice */}
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
      />
    </div>
  )
}