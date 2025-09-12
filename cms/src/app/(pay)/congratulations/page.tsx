'use client'

import { useSearchParams } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

export default function CongratulationsPage() {
  const searchParams = useSearchParams()
  const reference = searchParams.get('reference')
  const amount = searchParams.get('amount')
  const jarName = searchParams.get('jarName')
  const contributorName = searchParams.get('contributorName')

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl  p-8 text-center">
        
        {/* Success Icon */}
        <div className="mb-6">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto animate-pulse" />
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-supreme font-bold text-black mb-2">
          Contribution Successful! 🎉
        </h1>
        
        <p className="text-gray-600 font-supreme mb-6">
          Thank you {contributorName ? `${contributorName}` : ''} for your generous contribution!
        </p>

        {/* Contribution Details */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
          {jarName && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-supreme">Jar:</span>
              <span className="font-supreme font-medium text-black">{jarName}</span>
            </div>
          )}
          
          {amount && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-supreme">Amount:</span>
              <span className="font-supreme font-bold text-green-600">
                GHS {parseFloat(amount).toFixed(2)}
              </span>
            </div>
          )}
          
          {reference && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-supreme">Reference:</span>
              <span className="font-supreme font-mono text-xs text-gray-800">
                {reference.substring(0, 20)}...
              </span>
            </div>
          )}
        </div>

      

        {/* Footer Message */}
        <p className="text-xs text-gray-500 font-supreme mt-6 leading-relaxed">
          Your contribution has been recorded and the organizer will be notified. 
          You'll receive an email confirmation shortly.
        </p>
      </div>
    </div>
  )
}
