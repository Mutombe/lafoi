import { useEffect, useRef, useState } from 'react'
import { useInView, animate, useReducedMotion } from 'framer-motion'

/**
 * CountUp — viewport-triggered numeric easing from 0 → end.
 *
 * Used in stats strips. Animates once on first entry, then holds. Numbers are
 * rendered with `tabular-nums` so the width stays stable mid-tween. Suffix
 * and prefix are inlined as plain text — pass `decimals` for fractional ends.
 *
 * Honours prefers-reduced-motion: jumps straight to the final value.
 */
export default function CountUp({
  end,
  duration = 2.2,
  suffix = '',
  prefix = '',
  decimals = 0,
}) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const inView = useInView(ref, { once: true, margin: '-20%' })
  const [val, setVal] = useState(reduce ? end : 0)

  useEffect(() => {
    if (reduce) {
      setVal(end)
      return
    }
    if (!inView) return
    const controls = animate(0, end, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setVal(v),
    })
    return () => controls.stop()
  }, [inView, end, duration, reduce])

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {val.toFixed(decimals)}
      {suffix}
    </span>
  )
}
