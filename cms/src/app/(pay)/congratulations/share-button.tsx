'use client'

import { useEffect, useState } from 'react'
import { Share2, X } from 'lucide-react'

interface ShareButtonProps {
  jarName: string
  paymentLink: string
}

export function ShareButton({ jarName, paymentLink }: ShareButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const shareText = `Hi, we're raising support for "${jarName}". I've contributed already. You can also support here: ${paymentLink}`

  useEffect(() => {
    const timer = setTimeout(() => setDialogOpen(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText })
      } catch {
        await navigator.clipboard.writeText(shareText)
      }
    } else {
      await navigator.clipboard.writeText(shareText)
    }
  }

  return (
    <>
      {/* Inline section on the page */}
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

      {/* Auto-popup dialog after 3 seconds */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDialogOpen(false)}
          />

          {/* Dialog */}
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setDialogOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-2xl mb-4 mx-auto">
              <Share2 className="w-6 h-6 text-green-600" />
            </div>

            <h3 className="text-lg font-supreme font-bold text-black text-center mb-1">
              Support this cause by inviting others
            </h3>
            <p className="text-sm text-gray-500 font-supreme text-center mb-6 leading-relaxed">
              You just made a difference! Share with friends and family so they can contribute too.
            </p>

            <button
              onClick={() => {
                handleShare()
                setDialogOpen(false)
              }}
              className="w-full flex items-center justify-center gap-2 bg-black text-white rounded-xl px-4 py-3 font-supreme font-semibold hover:bg-gray-900 transition-colors mb-3"
            >
              <Share2 className="w-4 h-4" />
              Share with others
            </button>

            <button
              onClick={() => setDialogOpen(false)}
              className="w-full text-sm text-gray-400 font-supreme hover:text-gray-600 transition-colors py-1"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </>
  )
}
