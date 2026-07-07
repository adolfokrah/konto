'use client'

interface ThreeDSModalProps {
  isOpen: boolean
  /** Full HTML document for the 3D Secure challenge (Eganow `redirectUrl`). */
  html: string | null
  onClose: () => void
}

/**
 * Full-screen modal that renders the Eganow 3D Secure challenge page inside a sandboxed
 * iframe. The challenge page posts the result to our card webhook; the parent keeps polling
 * verify-payment and closes this modal once the payment reaches a terminal status.
 */
export default function ThreeDSModal({ isOpen, html, onClose }: ThreeDSModalProps) {
  if (!isOpen || !html) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60">
      <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm">
        <span className="font-supreme font-medium text-black">Secure card verification</span>
        <button
          onClick={onClose}
          className="text-sm font-supreme text-gray-500 hover:text-black transition-colors"
          aria-label="Cancel verification"
        >
          Cancel
        </button>
      </div>
      <iframe
        title="3D Secure Authentication"
        srcDoc={html}
        // allow-same-origin is required: the Eganow challenge page posts its result to our
        // card webhook (the `callback` URL). With an opaque sandbox origin that fetch is
        // cross-origin and blocked by CORS; inheriting our origin makes it same-origin.
        // allow-scripts + allow-forms let the challenge run. Trusted payment-processor HTML.
        sandbox="allow-scripts allow-forms allow-same-origin"
        className="flex-1 w-full border-0 bg-white"
      />
    </div>
  )
}
