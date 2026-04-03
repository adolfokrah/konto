import { redirect, RedirectType } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { XCircle } from 'lucide-react'
import Link from 'next/link'

interface CallbackPageProps {
  searchParams: Promise<{ reference?: string; trxref?: string }>
}

export default async function PaystackCallbackPage({ searchParams }: CallbackPageProps) {
  const { reference, trxref } = await searchParams
  const ref = reference || trxref

  if (!ref) {
    return <CallbackError message="No payment reference found." />
  }

  try {
    // Use localhost for server-to-server calls to avoid external IP routing issues
    const apiUrl = process.env.INTERNAL_API_URL || 'http://localhost:3000/api'
    const res = await fetch(
      `${apiUrl}/transactions/verify-paystack-payment?reference=${encodeURIComponent(ref)}`,
      { cache: 'no-store' },
    )

    const data = await res.json()

    if (data.success && data.data?.status === 'completed') {
      const { amount, contributorName, jarId, jarName, transactionId } = data.data

      const paymentLink = jarId
        ? `${process.env.NEXT_PUBLIC_SERVER_URL || ''}/pay/${jarId}/${encodeURIComponent(jarName || 'jar')}`
        : ''

      const params = new URLSearchParams({
        reference: transactionId || ref,
        amount: String(amount || ''),
        jarName: jarName || '',
        contributorName: contributorName || '',
        paymentLink,
      })

      redirect(`/congratulations?${params.toString()}`)
    }

    // Payment failed or still pending
    const message =
      data.data?.status === 'pending'
        ? 'Your payment is still being processed. Please check back shortly.'
        : data.message || 'Payment was not successful.'

    return <CallbackError message={message} />
  } catch (error) {
    // Re-throw Next.js redirect — must not be swallowed
    if (isRedirectError(error)) throw error
    console.error('Paystack callback error:', error)
    return <CallbackError message="Something went wrong while verifying your payment. Please contact support." />
  }
}

function CallbackError({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-primary-light flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center">
        <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
        <h1 className="text-2xl font-supreme font-bold text-black mb-2">Payment Unsuccessful</h1>
        <p className="text-gray-600 font-supreme mb-6">{message}</p>
        <Link
          href="/"
          className="inline-flex w-full items-center justify-center rounded-xl bg-black px-4 py-3 text-sm font-supreme font-semibold text-white hover:bg-gray-800 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
