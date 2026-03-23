'use client'

import { Share2 } from 'lucide-react'

interface ShareButtonProps {
  jarName: string
  paymentLink: string
}

export function ShareButton({ jarName, paymentLink }: ShareButtonProps) {
  const shareText = `Hi, we're raising support for "${jarName}". I've contributed already. You can also support here: ${paymentLink}`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText })
      } catch {
        // User cancelled or error — fall back to clipboard
        await navigator.clipboard.writeText(shareText)
      }
    } else {
      await navigator.clipboard.writeText(shareText)
    }
  }

  return (
    <div className="mt-6 border-t border-gray-100 pt-6">
      <p className="text-sm font-supreme font-semibold text-black mb-1">
        Support this cause by inviting others
      </p>
      <p className="text-xs text-gray-500 font-supreme mb-4 leading-relaxed">
        Share this jar with friends and family so they can contribute too.
      </p>
      <button
        onClick={handleShare}
        className="w-full flex items-center justify-center gap-2 bg-black text-white rounded-xl px-4 py-3 font-supreme font-semibold hover:bg-gray-900 transition-colors"
      >
        <Share2 className="w-4 h-4" />
        Share with others
      </button>
    </div>
  )
}
