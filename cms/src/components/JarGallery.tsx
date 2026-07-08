'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface JarGalleryProps {
  images: string[]
  alt: string
}

/**
 * GoFundMe-style gallery: a large hero showing the sharp image centered
 * over a blurred fill of itself (so portrait shots don't leave empty
 * bars), with dot + arrow navigation, plus a clickable thumbnail strip.
 */
export default function JarGallery({ images, alt }: JarGalleryProps) {
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef<number | null>(null)

  if (images.length === 0) return null

  const total = images.length
  const heroSrc = images[current]!
  const isFirst = current === 0
  const isLast = current === total - 1

  const prev = () => setCurrent((i) => Math.max(0, i - 1))
  const next = () => setCurrent((i) => Math.min(total - 1, i + 1))

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]!.clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0]!.clientX
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev()
    touchStartX.current = null
  }

  return (
    <div>
      {/* Hero */}
      <div
        className="relative w-full aspect-video overflow-hidden rounded-2xl bg-gray-100"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Blurred backdrop fills the frame */}
        <Image
          src={heroSrc}
          alt=""
          fill
          className="object-cover scale-110 blur-2xl brightness-90"
          priority
          aria-hidden="true"
        />
        {/* Sharp, fully-visible image on top */}
        <Image
          src={heroSrc}
          alt={alt}
          fill
          className="object-contain"
          priority
          sizes="(max-width: 940px) 100vw, 680px"
        />
        {/* Gradient scrim for depth */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

        {/* Navigation — dots + arrows */}
        {total > 1 && (
          <div className="absolute bottom-4 inset-x-0 flex items-center justify-between px-4 z-10">
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    i === current ? 'w-5 bg-white' : 'w-2 bg-white/50'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            {/* Prev / Next */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prev}
                disabled={isFirst}
                className={`w-8 h-8 rounded-full text-white flex items-center justify-center transition-colors ${
                  isFirst ? 'bg-black/20 cursor-not-allowed' : 'bg-black/40 hover:bg-black/60'
                }`}
                aria-label="Previous image"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={next}
                disabled={isLast}
                className={`w-8 h-8 rounded-full text-white flex items-center justify-center transition-colors ${
                  isLast ? 'bg-black/20 cursor-not-allowed' : 'bg-black/40 hover:bg-black/60'
                }`}
                aria-label="Next image"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail strip — hidden on mobile (nav dots/arrows handle it there) */}
      <div className="hidden lg:grid grid-cols-5 gap-2.5 mt-2.5">
        {images.slice(0, 5).map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setCurrent(i)}
            aria-label={`View photo ${i + 1}`}
            className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-colors cursor-pointer ${
              i === current ? 'border-black' : 'border-transparent hover:border-gray-300'
            }`}
          >
            <Image src={src} alt="" fill className="object-cover" sizes="140px" />
          </button>
        ))}
      </div>
    </div>
  )
}
