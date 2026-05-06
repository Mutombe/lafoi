import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

/**
 * ScrollReveal — editorial scroll-linked image reveal.
 *
 * As the wrapper passes through the viewport, the inner content scales from
 * 1.15 → 1, a soft inset clip-path opens out (8% → 0%), and opacity drifts
 * 0.4 → 1 → 0.85. Restrained, slow — designed to whisper, not shout.
 *
 * Honours prefers-reduced-motion: returns children with no transform.
 */
export default function ScrollReveal({
  children,
  className = '',
  range = ['start end', 'end start'],
}) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: range })
  const scale = useTransform(scrollYProgress, [0, 1], [1.15, 1])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.8, 1], [0.4, 1, 1, 0.85])
  const clip = useTransform(
    scrollYProgress,
    [0, 0.3],
    ['inset(8% 8% 8% 8%)', 'inset(0% 0% 0% 0%)']
  )

  if (reduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <div ref={ref} className={className} style={{ overflow: 'hidden' }}>
      <motion.div
        style={{ scale, opacity, clipPath: clip, height: '100%', width: '100%' }}
      >
        {children}
      </motion.div>
    </div>
  )
}
