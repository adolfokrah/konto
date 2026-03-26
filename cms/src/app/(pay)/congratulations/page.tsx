import { CheckCircle } from 'lucide-react'
import { Metadata } from 'next'
import Link from 'next/link'
import { ShareButton } from './share-button'

const APP_STORE_URL = 'https://apps.apple.com/de/app/hogapay/id6755120879'
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.hoganame.hogapay&hl=de&pli=1'

export const metadata: Metadata = {
  title: 'Congratulations',
}

interface CongratulationsPageProps {
  searchParams: Promise<{
    reference?: string
    amount?: string
    jarName?: string
    contributorName?: string
    paymentLink?: string
  }>
}

export default async function CongratulationsPage({ searchParams }: CongratulationsPageProps) {
  const { reference, amount, jarName, contributorName, paymentLink } = await searchParams

  return (
    <div className="pt-10 lg:pt-30 pb-10 lg:pb-40 bg-primary-light flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl  p-8 text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto animate-pulse" />
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-supreme font-bold text-black mb-2">
          Contribution Successful! 🎉
        </h1>

        <p className="text-gray-600 font-supreme mb-6">
          {contributorName && contributorName.toLowerCase() !== 'anonymous'
            ? `Thank you ${contributorName} for your generous contribution!`
            : 'Thank you for your generous contribution!'}
        </p>

        {/* Contribution Details */}
        <div className="rounded-xl p-4 mb-6 space-y-2">
          {jarName && (
            <div className="flex justify-between items-start gap-4">
              <span className="text-gray-600 font-supreme shrink-0">Jar:</span>
              <span className="font-supreme font-medium text-black text-right">{jarName}</span>
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
              <span className="font-supreme text-xs text-gray-800">
                {reference.substring(0, 20)}...
              </span>
            </div>
          )}
        </div>

        {/* Footer Message */}
        <p className="text-xs text-gray-500 font-supreme mt-6 leading-relaxed">
          Your contribution has been recorded and the organizer will be notified. You&apos;ll
          receive an email confirmation shortly.
        </p>

        {/* Contribute Again */}
        {paymentLink && (
          <div className="mt-4">
            <Link
              href={paymentLink}
              className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-supreme font-semibold text-black hover:bg-gray-50 transition-colors"
            >
              Contribute Again
            </Link>
          </div>
        )}

        {/* Share with others */}
        {jarName && paymentLink && (
          <ShareButton jarName={jarName} paymentLink={paymentLink} />
        )}

        {/* Marketing — convert donors to jar creators */}
        <div className="mt-8 border-t border-gray-100 pt-8">
          <p className="text-sm font-supreme font-semibold text-black mb-1">
            Are people always contributing to you?
          </p>
          <p className="text-xs text-gray-500 font-supreme mb-5 leading-relaxed">
            Make it easy — create your own jar on Hogapay and share the link. Your people can
            contribute directly from their phones, no stress.
          </p>

          {/* App Store buttons */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-black text-white rounded-xl px-4 py-2.5 hover:bg-gray-900 transition-colors"
            >
              {/* Apple logo */}
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" aria-hidden="true">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <div className="text-left leading-tight">
                <div className="text-[9px] font-supreme opacity-80">Download on the</div>
                <div className="text-sm font-supreme font-semibold">App Store</div>
              </div>
            </Link>

            <Link
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-black text-white rounded-xl px-4 py-2.5 hover:bg-gray-900 transition-colors"
            >
              {/* Google Play triangle logo */}
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" aria-hidden="true">
                <path d="M3 20.5v-17c0-.83 1-.99 1.43-.43l14 8.5c.39.24.39.82 0 1.06l-14 8.5C3.99 21.49 3 21.33 3 20.5z" />
              </svg>
              <div className="text-left leading-tight">
                <div className="text-[9px] font-supreme opacity-80">GET IT ON</div>
                <div className="text-sm font-supreme font-semibold">Google Play</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
