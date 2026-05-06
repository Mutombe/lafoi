import { useRef } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'framer-motion'

/**
 * MagneticCard — soft magnetic pull + 3D tilt on pointer move.
 *
 * Used to wrap project / portfolio / product cards. The pointer subtly drags
 * the card toward itself (translation), and tilts it on its X/Y axes. All
 * motion runs through low-stiffness springs — no bounce, no overshoot.
 *
 * NOTE: this adds a transform to the wrapper. Sticky descendants don't like
 * transformed ancestors — drop the wrapper one level deeper if that breaks.
 *
 * Respects prefers-reduced-motion.
 */
export default function MagneticCard({
  children,
  className = '',
  strength = 0.3,
  tiltAmplitude = 6,
}) {
  const ref = useRef(null)
  const reduce = useReducedMotion()

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 150, damping: 20, mass: 0.5 })
  const sy = useSpring(y, { stiffness: 150, damping: 20, mass: 0.5 })
  const rotateY = useTransform(sx, [-50, 50], [-tiltAmplitude, tiltAmplitude])
  const rotateX = useTransform(sy, [-50, 50], [tiltAmplitude, -tiltAmplitude])

  if (reduce) {
    return <div className={className}>{children}</div>
  }

  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    x.set(dx * strength)
    y.set(dy * strength)
  }
  const onLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy, rotateX, rotateY, transformStyle: 'preserve-3d' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
