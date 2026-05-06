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
        <span
          key={i}
          style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top' }}
        >
          <motion.span
            style={{ display: 'inline-block', willChange: 'transform' }}
            initial={{ y: '110%' }}
            whileInView={{ y: '0%' }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{
              duration: 0.9,
              delay: delay + i * staggerChildren,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}
