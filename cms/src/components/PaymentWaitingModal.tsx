'use client'

import React, { useEffect } from 'react'

interface PaymentWaitingModalProps {
  isOpen: boolean
  onClose: () => void
  phoneNumber: string
}

export default function PaymentWaitingModal({
  isOpen,
  onClose,
  phoneNumber,
}: PaymentWaitingModalProps) {
  useEffect(() => {
    // Prevent body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-xl">
        <div className="flex flex-col items-center text-center">
          {/* Loading Spinner */}
          <div className="mb-6">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-supreme font-semibold text-black mb-3">
            Waiting for Payment
          </h3>

          {/* Description */}
          <p className="text-gray-600 mb-2">
            A payment prompt has been sent to
          </p>
          <p className="text-black font-medium mb-6">
            {phoneNumber}
          </p>

          {/* Instructions */}
          <div className="bg-gray-50 rounded-2xl p-4 w-full">
            <p className="text-sm text-gray-700">
              Please check your phone and follow the prompt to complete the payment. This may take a
              few moments.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
