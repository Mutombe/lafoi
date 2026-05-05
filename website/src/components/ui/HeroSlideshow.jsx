import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import OptimizedImage from './OptimizedImage'

export default function HeroSlideshow({
  slides = [],
  interval = 6500,
  overlay = true,
  parallax = true,
  className = '',
}) {
  const [active, setActive] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const containerRef = useRef(null)

  // Autoplay
  useEffect(() => {
    if (!slides || slides.length < 2) return
    const id = setInterval(() => {
      setActive((i) => (i + 1) % slides.length)
    }, interval)
    return () => clearInterval(id)
  }, [slides, interval])

  // Parallax — scroll listener active only while in viewport
  useEffect(() => {
    if (!parallax) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setScrollY(window.scrollY))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [parallax])

  const goTo = useCallback((i) => setActive(i), [])

  if (!slides || slides.length === 0) return null

  const parallaxY = parallax ? scrollY * 0.18 : 0

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
    >
      {/* Slides — soft seamless crossfade with subtle scale + blur on the outgoing layer */}
      {slides.map((slide, i) => {
        const isActive = i === active
        return (
          <div
            key={`${slide.src}-${i}`}
            className="absolute inset-0"
            style={{
              opacity: isActive ? 1 : 0,
              filter: isActive ? 'blur(0px)' : 'blur(6px)',
              transform: isActive ? 'scale(1)' : 'scale(1.04)',
              transition:
                'opacity 2.2s cubic-bezier(0.22, 1, 0.36, 1), filter 2.2s cubic-bezier(0.22, 1, 0.36, 1), transform 2.2s cubic-bezier(0.22, 1, 0.36, 1)',
              willChange: 'opacity, filter, transform',
            }}
            aria-hidden={!isActive}
          >
            <motion.div
              className="absolute inset-0"
              style={{ y: parallaxY }}
            >
              <motion.div
                key={`kb-${i}-${active}`}
                className="absolute inset-0"
                initial={{ scale: 1.0 }}
                animate={isActive ? { scale: 1.06 } : { scale: 1.0 }}
                transition={{ duration: interval / 1000, ease: 'linear' }}
              >
                <OptimizedImage
                  src={slide.src}
                  alt={slide.alt || ''}
                  className="w-full h-full object-cover object-center"
                  fill
                  priority={i === 0}
                  vision={slide.vision || slide.alt || ''}
                />
              </motion.div>
            </motion.div>
          </div>
        )
      })}

      {/* Overlays — preserved on top of all slides */}
      {overlay && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/90 via-lafoi-dark/40 to-lafoi-dark/55 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-lafoi-dark/55 via-transparent to-lafoi-dark/20 pointer-events-none" />
        </>
      )}

      {/* Indicators — bottom center, hairline pills */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {slides.map((_, i) => {
            const isActive = i === active
            return (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1 rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isActive
                    ? 'w-8 bg-lafoi-green-light'
                    : 'w-1.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
