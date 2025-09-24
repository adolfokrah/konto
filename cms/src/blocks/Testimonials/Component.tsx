'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { cn } from '@/utilities/ui'

type Testimonial = {
  quote: string
  authorName: string
  authorTitle?: string
  authorImage?: any
  company?: string
}

type Props = {
  disableInnerContainer?: boolean
  heading?: string
  subheading?: string
  testimonials?: Testimonial[]
  showNavigation?: boolean
}

export const TestimonialsBlock: React.FC<Props> = ({
  disableInnerContainer = false,
  heading = "Building Trust One Contribution at a Time",
  subheading = "Discover how Hoga is transforming the way people give and receive support",
  testimonials = [],
  showNavigation = true,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Function to handle scroll navigation
  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const currentScroll = container.scrollLeft
    
    // Calculate scroll amount based on screen size
    const isMobile = window.innerWidth < 768 // md breakpoint
    let scrollAmount: number
    
    if (isMobile) {
      // On mobile, scroll by container width to show one testimonial at a time
      scrollAmount = container.clientWidth
    } else {
      // On desktop, scroll by card width + gap
      scrollAmount = 628 // Card width (611px) + gap (17px)
    }
    
    if (direction === 'left') {
      container.scrollTo({
        left: currentScroll - scrollAmount,
        behavior: 'smooth'
      })
    } else {
      container.scrollTo({
        left: currentScroll + scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  // Function to check scroll position and update button states
  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const { scrollLeft, scrollWidth, clientWidth } = container
    
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10) // 10px buffer
  }

  // Initialize scroll position check and handle resize
  useEffect(() => {
    const handleResize = () => {
      // Small delay to allow DOM to update after resize
      setTimeout(checkScrollPosition, 50)
    }

    const handleLoad = () => {
      checkScrollPosition()
    }

    // Initial check with multiple attempts to ensure DOM is ready
    const initialCheck = () => {
      checkScrollPosition()
      // Check again after a short delay in case images or content are still loading
      setTimeout(checkScrollPosition, 100)
      setTimeout(checkScrollPosition, 300)
    }

    // Add event listeners
    window.addEventListener('resize', handleResize)
    window.addEventListener('load', handleLoad)
    
    // Initial checks
    initialCheck()

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('load', handleLoad)
    }
  }, [testimonials])

  // Use ResizeObserver to detect container size changes
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver(() => {
      checkScrollPosition()
    })

    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [scrollContainerRef.current])

  // Also check when the ref changes (component mounts/updates)
  useEffect(() => {
    if (scrollContainerRef.current) {
      checkScrollPosition()
    }
  }, [scrollContainerRef.current])

  if (!testimonials || testimonials.length === 0) {
    return null
  }

  const containerClasses = cn(
    'py-[75px] px-3',
    !disableInnerContainer && 'max-w-7xl mx-auto',
  )

  return (
    <section className={cn('bg-white', containerClasses)}>
      <div className="flex flex-col items-start gap-8">
        {/* Header Section */}
        <div className="container flex flex-col items-start ">
          <div className="flex flex-col items-start gap-[15px] w-full max-w-[954px]">
            {/* Main Heading */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="font-['Chillax'] font-bold text-3xl lg:text-5xl leading-[67px] text-black max-w-[567px]"
            >
              {heading}
            </motion.h2>
            
            {/* Subheading */}
            {subheading && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="font-['Supreme'] font-medium text-xl leading-[27px] text-black max-w-[567px]"
              >
                {subheading}
              </motion.p>
            )}

            {/* Navigation Arrows */}
            {showNavigation && testimonials.length > 1 && (
              <div className="relative my-5 h-10">
                <button 
                  onClick={() => handleScroll('left')}
                  disabled={!canScrollLeft}
                  className={cn(
                    "absolute left-0 top-0 flex flex-col justify-center items-center p-2.5 w-10 h-10 rounded-full transition-all duration-200",
                    canScrollLeft 
                          ? "bg-background-light hover:bg-primary-light cursor-pointer" 
                      : "bg-gray-100 cursor-not-allowed opacity-50"
                  )}
                  aria-label="Previous testimonials"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path 
                      d="M12.5 15L7.5 10L12.5 5" 
                      stroke={canScrollLeft ? "black" : "#9CA3AF"} 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button 
                  onClick={() => handleScroll('right')}
                  disabled={!canScrollRight}
                  className={cn(
                    "absolute left-[52px] top-0 flex flex-col justify-center items-center p-2.5 w-10 h-10 rounded-full transition-all duration-200",
                    canScrollRight 
                      ? "bg-background-light hover:bg-primary-light cursor-pointer" 
                      : "bg-gray-100 cursor-not-allowed opacity-50"
                  )}
                  aria-label="Next testimonials"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path 
                      d="M7.5 15L12.5 10L7.5 5" 
                      stroke={canScrollRight ? "black" : "#9CA3AF"} 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Testimonials Scroll Container */}
        <div 
          ref={(el) => {
            scrollContainerRef.current = el
            if (el) {
              // Check scroll position when element is mounted
              setTimeout(checkScrollPosition, 0)
            }
          }}
          className="flex flex-row items-center gap-5 overflow-x-auto overflow-y-hidden w-full scroll-smooth"
          onScroll={checkScrollPosition}
          onLoad={checkScrollPosition}
          style={{
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE/Edge
          }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              onHoverStart={() => setHoveredIndex(index)}
              onHoverEnd={() => setHoveredIndex(null)}
              className="flex flex-col items-start p-6 lg:p-12 gap-2.5 w-full md:w-[611px]  md:h-[320px] bg-primary-light rounded-2xl flex-shrink-0"
            >
              <div className="flex flex-col items-start gap-8 w-full h-full">
                {/* Quote Icon */}
                <div className="w-9 h-9 flex items-start justify-start">
                  <Image 
                    src="/quote.png" 
                    alt="Quote" 
                    width={36}
                    height={36}
                    className="object-contain"
                  />    
                </div>

                {/* Content */}
                <div className="flex flex-col items-start gap-8 w-full flex-1">
                  {/* Quote Text */}
                  <p className=" font-medium text-xl  w-full">
                    {testimonial.quote}
                  </p>

                  {/* Author */}
                  <p className="font-chillax font-medium text-xl leading-7 text-label w-full">
                    {testimonial.authorName}
                    {testimonial.authorTitle && ` — ${testimonial.authorTitle}`}
                    {testimonial.company && ` ${testimonial.company}`}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Custom scrollbar hidden styles */}
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </section>
  )
}