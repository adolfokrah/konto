'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import PaystackPop from '@paystack/inline-js'
import { toast } from 'sonner'

interface ContributionInputProps {
  currency?: string
  isFixedAmount?: boolean
  fixedAmount?: number
  className?: string
  jarId?: string
  jarName?: string
}

export default function ContributionInput({ 
  currency = 'GHS',
  isFixedAmount = false,
  fixedAmount = 0,
  className = "",
  jarId = "",
  jarName = "Jar Contribution"
}: ContributionInputProps) {
  
  const [selectedAmount, setSelectedAmount] = useState<number>(isFixedAmount ? fixedAmount : 50)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [isCustom, setIsCustom] = useState(false)
  const [contributorEmail, setContributorEmail] = useState('')
  const [contributorName, setContributorName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  
  // Preset amounts based on currency
  const presetAmounts = currency === 'GHS' 
    ? [500, 100, 50, 10, 5] 
    : [5000, 1000, 500, 100, 50] // NGN amounts
  
  
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
      const verifyResponse = await fetch('/api/contributions/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference: reference,
        }),
      })
      
      const verifyData = await verifyResponse.json()
      return { success: verifyResponse.ok && verifyData.success, data: verifyData }
    } catch (error) {
      console.error('Verification error:', error)
      return { success: false, data: null, error }
    }
  }
  
  const handleContribute = async () => {
    if (selectedAmount <= 0) return
    if (!contributorEmail || !contributorName) {
      toast.error('Missing Information', {
        description: 'Please enter your email and name to continue',
        duration: 4000,
      })
      return
    }
    
    setIsLoading(true)

    //here insert the contibution logic

    try {
      // Generate unique reference

      // Create contribution record using our custom endpoint with admin access
      const contributionResponse = await fetch('/api/contributions/create-payment-link-contribution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jarId,
          contributorName,
          contributorEmail,
          amount: selectedAmount,
          currency,
        }),
      })

      const contributionData = await contributionResponse.json()

      if (!contributionResponse.ok) {
        throw new Error(contributionData.message || 'Failed to create contribution')
      }


      // Use the calculated amount including fees from the response
      const amountInSmallestUnit = contributionData.data?.chargesBreakdown?.amountPaidByContributor * 100
    

      const popup = new PaystackPop()

      const reference = contributionData.data.id


      popup.resumeTransaction(reference)
      
      popup.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_your_test_key',
        email: contributorEmail,
        amount: amountInSmallestUnit,
        currency: currency === 'GHS' ? 'GHS' : 'NGN',
        reference: reference,
        metadata: {
          custom_fields: [
            {
              display_name: "Jar ID",
              variable_name: "jar_id",
              value: jarId
            },
            {
              display_name: "Jar Name",
              variable_name: "jar_name", 
              value: jarName
            },
            {
              display_name: "Contributor Name",
              variable_name: "contributor_name",
              value: contributorName
            },
            {
              display_name: "Original Amount",
              variable_name: "original_amount",
              value: selectedAmount.toString()
            }
          ]
        },
        onSuccess: async (response: any) => {
          console.log('Payment successful:', response)
          
          const verificationResult = await verifyPayment(response.reference)
          
          if (verificationResult.success) {
            // Redirect to congratulations page with success data
            const congratsParams = new URLSearchParams({
              reference: response.reference,
              amount: selectedAmount.toString(),
              jarName: jarName,
              contributorName: contributorName,
            })
            
            router.push(`/congratulations?${congratsParams.toString()}`)
          } else {
            toast.error('Verification Failed', {
              description: `Payment completed but verification failed: ${verificationResult.data?.message || 'Unknown error'}`,
              duration: 5000,
            })
            setIsLoading(false)
          }
        },
        onCancel: async () => {
          console.log('Payment cancelled')
          
          const verificationResult = await verifyPayment(reference)
          console.log('Cancel verification result:', verificationResult.data)
          
          setIsLoading(false)
          alert('Payment was cancelled')
        }
      })
    } catch (error: any) {
      console.error('Error creating contribution:', error)
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
  
  return (
    <div className={`bg-white ${className}`}>
      {/* Header */}
      <h2 className="text-lg font-supreme font-medium text-black mb-6">
        Enter your contribution
      </h2>
      
      {/* Preset Amount Buttons */}
      {!isFixedAmount && (
        <div className="flex flex-wrap justify-evenly gap-1 mb-6">
          {presetAmounts.map((amount) => (
            <Button
              key={amount}
              onClick={() => handlePresetClick(amount)}
              className={`px-6 py-3 rounded-full border-2 font-supreme font-medium transition-all duration-200 ${
                selectedAmount === amount && !isCustom
                  ? 'bg-black text-white border-black'
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
            <span className="text-xl font-supreme font-medium text-black mr-4">
              {currency}
            </span>
            <input
              type="text"
              value={isFixedAmount ? formatAmount(fixedAmount) : (isCustom ? customAmount : formatAmount(selectedAmount))}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              placeholder="0.00"
              disabled={isFixedAmount}
              className="flex-1 text-right text-3xl font-supreme font-bold text-black bg-transparent outline-none disabled:opacity-50"
            />
          </div>
        </div>
      </div>
      
      {/* Contributor Information */}
      <div className="space-y-4 mb-6">
        <div>
          <input
            type="text"
            placeholder="Your name"
            value={contributorName}
            onChange={(e) => setContributorName(e.target.value)}
            className="w-full p-4 border-2 border-gray-300 rounded-2xl font-supreme outline-none focus:border-gray-400 transition-colors"
          />
        </div>
        <div>
          <input
            type="email"
            placeholder="Your email address"
            value={contributorEmail}
            onChange={(e) => setContributorEmail(e.target.value)}
            className="w-full p-4 border-2 border-gray-300 rounded-2xl font-supreme outline-none focus:border-gray-400 transition-colors"
          />
        </div>
      </div>
      
      {/* Contribute Button */}
      <button
        onClick={handleContribute}
        disabled={selectedAmount <= 0 || isLoading}
        className="w-full bg-black text-white py-4 rounded-full font-supreme font-medium text-lg hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        {isLoading ? 'Processing...' : 'Contribute'}
      </button>
      
      {/* Payment Processing Fee Notice */}
      <p className="text-sm font-supreme text-gray-600 leading-relaxed">
        Transactions include a <span className="font-medium">1.95%</span> payment processing fee, which will be added to the above amount.
      </p>
    </div>
  )
}
