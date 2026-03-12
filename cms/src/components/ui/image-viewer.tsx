'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/utilities/ui'

export type ImageViewerImage = {
  url: string
  alt?: string
}

type ImageViewerProps = {
  images: ImageViewerImage[]
  initialIndex?: number
  open: boolean
  onClose: () => void
}

export function ImageViewer({ images, initialIndex = 0, open, onClose }: ImageViewerProps) {
  const [index, setIndex] = useState(initialIndex)

  useEffect(() => {
    setIndex(initialIndex)
  }, [initialIndex, open])

  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.stopPropagation(); prev() }
      if (e.key === 'ArrowRight') { e.stopPropagation(); next() }
    }
    window.addEventListener('keydown', handleKey, { capture: true })
    return () => window.removeEventListener('keydown', handleKey, { capture: true })
  }, [open, prev, next])

  if (images.length === 0) return null

  const current = images[index]

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed inset-0 z-50 flex items-center justify-center focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <DialogPrimitive.Title className="sr-only">Image viewer</DialogPrimitive.Title>
          {/* Close */}
          <button
            className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

        {/* Download */}
        <a
          href={current.url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-4 right-14 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
          aria-label="Download"
        >
          <Download className="h-5 w-5" />
        </a>

        {/* Prev */}
        {images.length > 1 && (
          <button
            className="absolute left-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            onClick={prev}
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Image */}
        <div className="flex items-center justify-center w-full h-full p-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={current.url}
            src={current.url}
            alt={current.alt ?? `Image ${index + 1}`}
            className="max-w-full max-h-full rounded-lg object-contain shadow-2xl"
          />
        </div>

        {/* Next */}
        {images.length > 1 && (
          <button
            className="absolute right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            onClick={next}
            aria-label="Next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Counter dots */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60',
                )}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
