import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * AnimatedHeading — word-by-word reveal for display headings.
 *
 * Each word lifts from below an `overflow:hidden` mask line, staggered. Tuned
 * for hero / page-defining headings only. Pass `text` (a single string) and
 * the wrapper tag (defaults to h2). All other classes flow through `className`
 * so the surrounding type style is preserved.
 *
 * Honours prefers-reduced-motion.
 */
export default function AnimatedHeading({
  text,
  as: Tag = 'h2',
  className = '',
  delay = 0,
  staggerChildren = 0.05,
}) {
  const reduce = useReducedMotion()

  if (reduce) {
    return <Tag className={className}>{text}</Tag>
  }

  const words = text.split(' ')
  return (
    <Tag className={className}>
      {words.map((word, i) => (
        <React.Fragment key={i}>
          <span
            style={{
              display: 'inline-block',
              overflow: 'hidden',
              // Tiny bottom pad keeps descenders (g, p, y) from being clipped
              // when the parent uses tight line-height for editorial headings.
              paddingBottom: '0.12em',
              marginBottom: '-0.12em',
            }}
          >
            <motion.span
              style={{ display: 'inline-block', willChange: 'transform' }}
              initial={{ y: '110%' }}
              whileInView={{ y: '0%' }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{
                duration: 0.9,
                delay: delay + i * staggerChildren,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {word}
            </motion.span>
          </span>
          {/* Render the inter-word space as a real text node OUTSIDE the
              inline-block mask, so word-wrap works and words don't crash
              into each other. */}
          {i < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
    </Tag>
  )
}
