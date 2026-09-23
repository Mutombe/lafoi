import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, ArrowRight } from '@phosphor-icons/react'
import Logo from '../shared/Logo'

const STORAGE_KEY = 'lafoi-welcome-ts'
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000 // don't re-show for 7 days

// Genuine La Foi credentials only (no borrowed certifications).
const POINTS = [
  '10-year manufacturer warranty',
  'Premium PVC & fabric stretch ceilings',
  'Fire-rated (B-s1, d0) & anti-bacterial finish',
  'Zimbabwe’s first dedicated stretch-ceiling studio',
  'Wide colour range & custom photographic prints',
  'Architectural lighting, designed in — not bolted on',
  'Removable, reusable & fully washable',
  'Free design consultation & site visit',
  'Installed in 2 to 4 days, depending on the design',
]

export default function WelcomeModal() {
  const [open, setOpen] = useState(false)

  // Show once per visitor (with a 7-day cooldown), a short beat after load.
  useEffect(() => {
    let show = true
    try {
      const ts = Number(localStorage.getItem(STORAGE_KEY) || 0)
      if (ts && Date.now() - ts < COOLDOWN_MS) show = false
    } catch { /* storage blocked — still show */ }
    if (!show) return
    const t = setTimeout(() => setOpen(true), 1100)
    return () => clearTimeout(t)
  }, [])

  const close = () => {
    setOpen(false)
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch { /* ignore */ }
  }

  // Lock scroll + close on Escape while open.
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[190] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-lafoi-dark/55 backdrop-blur-[2px]"
            onClick={close}
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Welcome to La Foi Designs"
            className="relative w-full max-w-[430px] max-h-[90vh] overflow-y-auto bg-white rounded-sm border border-lafoi-dark/10 shadow-[0_30px_80px_-24px_rgba(17,17,17,0.45)]"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* close */}
            <button
              onClick={close}
              aria-label="Close"
              className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full flex items-center justify-center text-lafoi-gray hover:bg-lafoi-dark/5 hover:text-lafoi-dark transition-colors"
            >
              <X size={18} weight="regular" />
            </button>

            <div className="p-7 sm:p-8">
              {/* header */}
              <Logo tone="dark" variant="wordmark" imgClassName="h-8 w-auto" />
              <p className="mt-3 font-sora text-[9.5px] tracking-[0.24em] uppercase text-lafoi-gray-medium">
                Stretch Ceilings &amp; Lighting &middot; Design &middot; Installation &middot; Care
              </p>

              <h2 className="mt-6 font-display font-light text-lafoi-dark text-[2rem] leading-[1.05] tracking-[-0.02em]">
                Welcome to <span className="text-lafoi-green">La&nbsp;Foi</span>.
              </h2>
              <p className="mt-3 text-sm text-lafoi-gray font-general leading-relaxed">
                Zimbabwe’s first dedicated stretch-ceiling and architectural lighting studio — every
                project backed by real expertise, warranty and professional installation.
              </p>

              <div className="mt-6 flex items-center gap-3">
                <span className="block w-8 h-px bg-lafoi-green/50" />
                <p className="font-sora text-[10px] font-semibold tracking-[0.28em] uppercase text-lafoi-green">
                  Why designers choose us
                </p>
              </div>

              <ul className="mt-4 divide-y divide-lafoi-dark/[0.07]">
                {POINTS.map((p) => (
                  <li key={p} className="flex items-start gap-3 py-2.5">
                    <CheckCircle size={18} weight="fill" className="text-lafoi-green shrink-0 mt-0.5" />
                    <span className="text-sm text-lafoi-dark/85 font-general leading-snug">{p}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  to="/contact"
                  onClick={close}
                  className="inline-flex items-center justify-center gap-2 flex-1 px-5 py-3 bg-lafoi-green text-white rounded-sm font-sora text-sm font-medium hover:bg-lafoi-green-light transition-colors"
                >
                  Get a Free Quote
                  <ArrowRight size={15} weight="bold" />
                </Link>
                <Link
                  to="/products"
                  onClick={close}
                  className="inline-flex items-center justify-center px-5 py-3 rounded-sm border border-lafoi-dark/15 text-lafoi-dark font-sora text-sm font-medium hover:border-lafoi-green/40 hover:text-lafoi-green transition-colors"
                >
                  Browse the finishes
                </Link>
              </div>

              <p className="mt-6 text-center font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium">
                www.lafoidesigns.com
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
