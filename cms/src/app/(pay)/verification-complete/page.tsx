import { ShieldCheck } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verification Submitted',
}

export default function VerificationCompletePage() {
  return (
    <div className="pt-10 lg:pt-30 pb-10 lg:pb-40 bg-primary-light flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center">
        {/* Icon */}
        <div className="mb-6">
          <ShieldCheck className="w-20 h-20 text-green-500 mx-auto" />
        </div>

        {/* Message */}
        <h1 className="text-2xl font-supreme font-bold text-black mb-2">
          Verification Submitted
        </h1>

        <p className="text-gray-600 font-supreme mb-6">
          Your identity verification has been submitted successfully. You can now return to the Hoga
          app.
        </p>

        {/* Info */}
        <div className="rounded-xl bg-gray-50 p-4 mb-6 text-left space-y-2">
          <p className="text-sm text-gray-600 font-supreme">
            <span className="font-medium text-black">What happens next?</span>
          </p>
          <ul className="text-sm text-gray-600 font-supreme list-disc list-inside space-y-1">
            <li>Your documents are being reviewed</li>
            <li>You&apos;ll be notified once verification is complete</li>
            <li>This usually takes a few minutes</li>
          </ul>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 font-supreme mt-6 leading-relaxed">
          You can safely close this page and return to the Hoga app.
        </p>
      </div>
    </div>
  )
}
