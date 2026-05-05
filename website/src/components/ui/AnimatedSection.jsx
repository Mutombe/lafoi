import React, { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

/**
 * AnimatedSection — scroll-triggered reveal wrapper.
 *
 * Props
 *   direction: 'up' | 'down' | 'left' | 'right' | 'scale' | 'blur' | 'none'
 *              left  → enters FROM left (slides toward centre from -X)
 *              right → enters FROM right (slides toward centre from +X)
 *   duration:  motion duration in seconds (default 0.8)
 *   delay:     motion delay in seconds (default 0)
 *   once:      animate only once (default true)
 *   amount:    viewport intersection threshold (default 0.3)
 *   threshold: legacy alias for amount (kept for back-compat)
 *   tag:       html tag to render (default 'div')
 *
 * Respects prefers-reduced-motion via framer-motion's useReducedMotion —
 * if reduced motion is requested, content renders fully visible without
 * any transform / filter animation.
 */
export default function AnimatedSection({
  children,
  className = '',
  delay = 0,
  duration = 0.8,
  direction = 'up',
  once = true,
  amount,
  threshold = 0.3,
  tag = 'div',
}) {
  const ref = useRef(null)
  const inViewAmount = amount ?? threshold
  const isInView = useInView(ref, { once, amount: inViewAmount })
  const reduceMotion = useReducedMotion()

  // Reduced motion — render visible, no transforms.
  if (reduceMotion) {
    const Tag = motion[tag] || motion.div
    return (
      <Tag ref={ref} className={className} initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
        {children}
      </Tag>
    )
  }

  // Direction → initial transform map.
  // left enters FROM left (negative X), right enters FROM right (positive X).
  const initials = {
    up:    { opacity: 0, y: 40, x: 0 },
    down:  { opacity: 0, y: -40, x: 0 },
    left:  { opacity: 0, x: -60, y: 0 },
    right: { opacity: 0, x: 60, y: 0 },
    scale: { opacity: 0, scale: 0.92 },
    blur:  { opacity: 0, filter: 'blur(8px)' },
    none:  { opacity: 0 },
  }
  const animates = {
    up:    { opacity: 1, y: 0, x: 0 },
    down:  { opacity: 1, y: 0, x: 0 },
    left:  { opacity: 1, x: 0, y: 0 },
    right: { opacity: 1, x: 0, y: 0 },
    scale: { opacity: 1, scale: 1 },
    blur:  { opacity: 1, filter: 'blur(0px)' },
    none:  { opacity: 1 },
  }

  const initial = initials[direction] || initials.up
  const animate = animates[direction] || animates.up

  const Tag = motion[tag] || motion.div

  return (
    <Tag
      ref={ref}
      className={className}
      initial={initial}
      animate={isInView ? animate : initial}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </Tag>
  )
}

/* ----------------------------------------------------------------------------
   Stagger primitives — used for cascaded grid/list reveals.
   ---------------------------------------------------------------------------- */

export function StaggerContainer({ children, className = '', staggerDelay = 0.1, amount = 0.1 }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount })
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduceMotion ? 'visible' : 'hidden'}
      animate={isInView || reduceMotion ? 'visible' : 'hidden'}
      variants={{
        visible: {
          transition: { staggerChildren: reduceMotion ? 0 : staggerDelay },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = '' }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  )
}
