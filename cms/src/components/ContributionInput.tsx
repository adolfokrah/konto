'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from './ui/button'
import { toast } from 'sonner'
import TransactionCharges from '@/utilities/transaction-charges'
import { Separator } from './ui/separator'
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import PaymentWaitingModal from './PaymentWaitingModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ContributionInputProps {
  currency?: string
  isFixedAmount?: boolean
  fixedAmount?: number
  className?: string
  jarId?: string
  jarName?: string
  isCreatorPaysPlatformFees?: boolean
  collectorId?: string | { id: string } | undefined
  allowAnonymousContributions?: boolean
}

export default function ContributionInput({
  currency = 'GHS',
  isFixedAmount = false,
  fixedAmount = 0,
  className = '',
  jarId = '',
  jarName = 'Jar Contribution',
  isCreatorPaysPlatformFees = true,
  collectorId = undefined,
  allowAnonymousContributions = false,
}: ContributionInputProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(isFixedAmount ? fixedAmount : 50)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [isCustom, setIsCustom] = useState(false)
  const [contributorEmail, setContributorEmail] = useState('')
  const [contributorName, setContributorName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [contributorPhoneNumber, setContributorPhoneNumber] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState<'mtn' | 'airteltigo' | 'telecel'>('mtn')
  const router = useRouter()

  // Preset amounts based on currency
  const presetAmounts =
    currency === 'GHS' ? [500, 200, 100, 50, 10, 5] : [5000, 2000, 1000, 500, 100, 50] // NGN amounts

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleEmailChange = (email: string) => {
    setContributorEmail(email)
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address')
    } else {
      setEmailError('')
    }
  }

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
      const verifyResponse = await fetch('/api/contributions/verify-payment-ega-now', {
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
    if (!contributorEmail || (!isAnonymous && !contributorName)) {
      toast.error('Missing Information', {
        description: isAnonymous ? 'Please enter your email to continue' : 'Please enter your email and name to continue',
        duration: 4000,
      })
      return
    }

    // Validate email format
    if (!validateEmail(contributorEmail)) {
      toast.error('Invalid Email', {
        description: 'Please enter a valid email address',
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

    try {
      // Create contribution record using our custom endpoint with admin access
      const contributionResponse = await fetch(
        '/api/contributions/create-payment-link-contribution',
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
      const chargeResponse = await fetch('/api/contributions/charge-momo-eganow', {
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

      console.log('Payment initiated:', { contributionId, transactionReference })

      // Show waiting modal
      setShowPaymentModal(true)

      // Start polling for payment verification using transactionReference
      startPaymentPolling(transactionReference)

    } catch (error: any) {
      setIsLoading(false)
      toast.error('Contribution Failed', {
        description: error.message || 'Failed to process contribution. Please try again.',
        duration: 5000,
      })
    }
  }

  const formatAmount = (amount: number) => {
    return amount.toFixed(2)
  }

  const transactionCharges = new TransactionCharges({ isCreatorPaysPlatformFees })

  const { totalAmount, paystackCharge, platformCharge } =
    transactionCharges.calculateAmountAndCharges(isFixedAmount ? fixedAmount : selectedAmount)

  const charges = isCreatorPaysPlatformFees ? paystackCharge : paystackCharge + platformCharge

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
              className={`px-5 hover:text-white py-7 rounded-2xl border-2 font-supreme font-medium transition-all cursor-pointer duration-200 text-sm sm:text-base ${
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

          <Select value={mobileMoneyProvider} onValueChange={(value: 'mtn' | 'airteltigo' | 'telecel') => setMobileMoneyProvider(value)}>
            <SelectTrigger className="w-full h-14 border-2 border-gray-300 rounded-2xl font-supreme bg-white text-black hover:border-gray-400 transition-colors">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent className="bg-white text-black">
              <SelectItem value="mtn" className="text-black">MTN Mobile Money</SelectItem>
              <SelectItem value="airteltigo" className="text-black">AirtelTigo Money</SelectItem>
              <SelectItem value="telecel" className="text-black">Telecel Cash</SelectItem>
            </SelectContent>
          </Select>

        {isAnonymous && (<div className='mb-2'>
          <small className="text-gray-500">We only use your phone number and email to send you a receipt for your payment. This information is not saved or shared.</small>
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

        

        <div>
          <input
            type="email"
            placeholder="Your email address"
            value={contributorEmail}
            onChange={(e) => handleEmailChange(e.target.value)}
            className={`w-full p-4 border-2 rounded-2xl font-supreme outline-none transition-colors ${
              emailError
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-300 focus:border-gray-400'
            }`}
          />
          {emailError && (
            <p className="text-red-500 text-sm font-supreme mt-2 ml-1">{emailError}</p>
          )}
        </div>
      </div>

      <Separator />

      <div className="font-supreme space-y-2">
        <h3 className="font-bold my-2 mb-2">Your contribution</h3>
        <div className="flex justify-between text-gray-600">
          <span>Your donation</span>
          <span>
            {currency}{' '}
            {isFixedAmount
              ? formatAmount(fixedAmount)
              : isCustom
                ? customAmount
                : formatAmount(selectedAmount)}
          </span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Transaction Fee</span>
          <span>
            {currency} {charges.toFixed(2)}
          </span>
        </div>
      </div>
      <Separator />
      <div className="flex justify-between">
        <span>Total due to pay</span>
        <span>
          {currency} {totalAmount}
        </span>
      </div>

      {/* Contribute Button */}
      <button
        onClick={handleContribute}
        disabled={
          selectedAmount <= 0 || isLoading || !!emailError || !contributorEmail || (!isAnonymous && !contributorName) || (!isAnonymous && !contributorPhoneNumber)
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