'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'

interface ContributorAvatar {
  initials: string
  photoUrl: string | null
}

interface JarImageCarouselProps {
  images: string[]
  alt: string
  description?: string | null
  donorCount?: number
  showDonors?: boolean
  contributorAvatars?: ContributorAvatar[]
}

export default function JarImageCarousel({
  images,
  alt,
  description,
  donorCount = 0,
  contributorAvatars = [],
}: JarImageCarouselProps) {
  // Total slides = images + 1 info card at the end
  const totalSlides = images.length + 1
  const infoIndex = images.length
  const [current, setCurrent] = useState(0)

  const prev = () => setCurrent((i) => Math.max(0, i - 1))
  const next = () => setCurrent((i) => Math.min(totalSlides - 1, i + 1))

  const isFirst = current === 0
  const isLast = current === totalSlides - 1

  return (
    <div className="relative w-full h-80 lg:h-100 overflow-hidden rounded-none md:rounded-xl">
      {/* Image slides */}
      {images.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-transform duration-400 ease-in-out"
          style={{ transform: `translateX(${(i - current) * 100}%)` }}
        >
          <Image
            src={src}
            alt=""
            fill
            className="object-cover scale-110 blur-lg brightness-75"
            priority={i === 0}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src={src}
              alt={i === 0 ? alt : ''}
              width={500}
              height={500}
              className="h-full w-auto object-contain"
              priority={i === 0}
            />
          </div>
        </div>
      ))}

      {/* Info card slide */}
      <div
        className="absolute inset-0 transition-transform duration-400 ease-in-out"
        style={{ transform: `translateX(${(infoIndex - current) * 100}%)` }}
      >
        {/* Use last image as blurred background */}
        {images.length > 0 && (
          <Image
            src={images[images.length - 1]!}
            alt=""
            fill
            className="object-cover scale-110 blur-lg brightness-50"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="bg-white rounded-2xl p-6 w-full shadow-lg">
            {description && (
              <p className="text-sm text-gray-700 line-clamp-4 mb-4 leading-relaxed">
                {description}
              </p>
            )}
            <div className="flex items-center justify-between">
              {contributorAvatars.length > 0 || donorCount > 0 ? (
                <div className="flex items-center gap-2">
                  <AvatarGroup>
                    {contributorAvatars.slice(0, 3).map((a, i) => (
                      <Avatar key={i} className="w-8 h-8 border-2 border-white">
                        {a.photoUrl && <AvatarImage src={a.photoUrl} alt={a.initials} />}
                        <AvatarFallback className="bg-[#EDE8E3] text-[10px] font-semibold text-gray-700">
                          {a.initials}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {donorCount > 3 && (
                      <AvatarGroupCount className="w-8 h-8 text-[10px] bg-[#EDE8E3] text-gray-700">
                        +{donorCount - 3}
                      </AvatarGroupCount>
                    )}
                  </AvatarGroup>
                  <span className="text-sm font-medium text-gray-600">
                    {donorCount} {donorCount === 1 ? 'contribution' : 'contributions'}
                  </span>
                </div>
              ) : (
                <span />
              )}
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ url: window.location.href })
                  } else {
                    navigator.clipboard.writeText(window.location.href)
                  }
                }}
                className="bg-[#1B4332] hover:bg-[#163829] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      {totalSlides > 1 && (
        <div className="absolute bottom-4 inset-x-0 flex items-center justify-between px-4 z-10">
          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
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
              onClick={prev}
              disabled={isFirst}
              className={`w-8 h-8 rounded-full text-white flex items-center justify-center transition-colors ${
                isFirst
                  ? 'bg-black/20 cursor-not-allowed'
                  : 'bg-black/40 hover:bg-black/60'
              }`}
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              disabled={isLast}
              className={`w-8 h-8 rounded-full text-white flex items-center justify-center transition-colors ${
                isLast
                  ? 'bg-black/20 cursor-not-allowed'
                  : 'bg-black/40 hover:bg-black/60'
              }`}
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
