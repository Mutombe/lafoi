import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, List, X } from '@phosphor-icons/react'
import Logo from '../shared/Logo'

/* ===========================================================================
   La Foi landing-hero — Editorial concept (the direction the team chose).
   Light, centered, self-contained header (real logo + pill nav + mobile menu),
   an interactive finish selector and an enlarged mobile showcase strip.
   Used as the site's main hero and on the /hero-preview review route.
   =========================================================================== */

const EASE = [0.16, 1, 0.3, 1]
const img = (n) => `/brand/images/${n}`
const noBar = '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

const NAV = [
  { label: 'Home', to: '/' },
  { label: 'Finishes', to: '/portfolio' },
  { label: 'Lighting', to: '/services/lighting-solutions' },
  { label: 'Projects', to: '/projects' },
  { label: 'Contact', to: '/contact' },
]

const FINISHES = [
  { key: 'Starfield', shots: ['18.png', '22.png', 'mirror.png'] },
  { key: 'Matte', shots: ['22.png', '13.png', 'transluescent1.png'] },
  { key: 'Gloss', shots: ['mirror.png', '35.png', '22.png'] },
  { key: 'Translucent', shots: ['transluescent1.png', '18.png', '13.png'] },
]

export default function EditorialHero() {
  const [fi, setFi] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const active = FINISHES[fi]
  const location = useLocation()
  const isActive = (to) => location.pathname === to || (to === '/' && location.pathname === '/hero-preview')

  return (
    <section className="relative min-h-screen bg-lafoi-cream flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="relative z-30 max-w-[1280px] w-full mx-auto px-5 sm:px-6 lg:px-10 pt-4 sm:pt-6 flex items-center justify-between gap-3">
        <Link to="/" className="group inline-flex items-center" aria-label="La Foi Designs — home">
          <Logo tone="dark" variant="wordmark" imgClassName="h-8 sm:h-10 lg:h-11 w-auto group-hover:scale-105 transition-transform duration-300" />
        </Link>

        {/* Desktop pill nav */}
        <nav className="hidden md:flex items-center gap-1 bg-white rounded-full px-1.5 py-1.5 shadow-[0_8px_30px_-16px_rgba(0,0,0,0.25)] border border-lafoi-dark/5">
          {NAV.map((l) => (
            <Link key={l.label} to={l.to}
              className={`px-4 py-2 rounded-full text-sm font-sora transition-colors ${isActive(l.to) ? 'bg-lafoi-dark text-white' : 'text-lafoi-gray hover:text-lafoi-dark'}`}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/contact" className="inline-flex items-center gap-2 bg-lafoi-dark text-white rounded-full px-4 sm:px-5 py-2.5 text-sm font-sora font-medium hover:bg-lafoi-green transition-colors">
            <span className="hidden sm:inline">Get a quote</span><span className="sm:hidden">Quote</span>
            <ArrowRight size={14} weight="bold" />
          </Link>
          {/* Mobile menu toggle */}
          <button onClick={() => setMenuOpen(true)} aria-label="Open menu"
            className="md:hidden w-11 h-11 rounded-full bg-white border border-lafoi-dark/5 shadow-[0_8px_30px_-16px_rgba(0,0,0,0.25)] flex items-center justify-center text-lafoi-dark">
            <List size={20} weight="regular" />
          </button>
        </div>
      </div>

      {/* Mobile menu — light editorial sheet */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-lafoi-dark/30 backdrop-blur-sm md:hidden" onClick={() => setMenuOpen(false)} />
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3, ease: EASE }}
              className="fixed z-50 top-3 inset-x-3 rounded-[24px] bg-lafoi-cream border border-lafoi-dark/5 shadow-2xl p-5 md:hidden">
              <div className="flex items-center justify-between">
                <Logo tone="dark" variant="wordmark" imgClassName="h-8 w-auto" />
                <button onClick={() => setMenuOpen(false)} aria-label="Close menu"
                  className="w-10 h-10 rounded-full bg-white border border-lafoi-dark/5 flex items-center justify-center text-lafoi-dark">
                  <X size={20} weight="regular" />
                </button>
              </div>
              <nav className="mt-4 flex flex-col">
                {NAV.map((l, i) => (
                  <motion.div key={l.label} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.05, duration: 0.35, ease: EASE }}>
                    <Link to={l.to} onClick={() => setMenuOpen(false)}
                      className={`block py-3 font-display font-light tracking-[-0.02em] text-[1.9rem] leading-tight border-b border-lafoi-dark/5 transition-colors ${isActive(l.to) ? 'text-lafoi-green' : 'text-lafoi-dark hover:text-lafoi-green'}`}>
                      {l.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <Link to="/contact" onClick={() => setMenuOpen(false)}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-lafoi-dark text-white rounded-full px-6 py-3.5 text-sm font-sora font-medium hover:bg-lafoi-green transition-colors">
                Get a quote <ArrowRight size={15} weight="bold" />
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Centered headline */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-5 sm:px-6 pt-8 sm:pt-10 pb-5">
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}
          className="font-sora text-[10px] sm:text-[11px] tracking-[0.25em] sm:tracking-[0.3em] uppercase text-lafoi-green mb-5 sm:mb-6">
          Stretch ceilings · Architectural lighting · Harare
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.05 }}
          className="font-display font-light text-lafoi-dark leading-[1.04] tracking-[-0.03em] text-[2.3rem] sm:text-[3.6rem] lg:text-[4.6rem] max-w-[14ch]">
          The ceiling, rebuilt in <span className="italic text-lafoi-green">light</span> & surface.
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-5 sm:mt-6 max-w-xl text-[15px] sm:text-base text-lafoi-gray font-general leading-relaxed">
          Zimbabwe’s first dedicated stretch-ceiling studio — matte, gloss, translucent, printed and starfield finishes with bespoke lighting, installed in two to four days.
        </motion.p>

        {/* Interactive finish selector */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.28 }}
          className="mt-7 flex flex-wrap items-center justify-center gap-2">
          {FINISHES.map((f, i) => (
            <button key={f.key} onClick={() => setFi(i)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-sora transition-colors border ${i === fi ? 'bg-lafoi-dark text-white border-lafoi-dark' : 'bg-white/70 text-lafoi-gray border-lafoi-dark/10 hover:border-lafoi-dark/30'}`}>
              {f.key}
            </button>
          ))}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.36 }} className="mt-6">
          <Link to="/portfolio" className="inline-flex items-center gap-3 bg-lafoi-dark text-white rounded-full px-6 sm:px-7 py-3.5 text-sm font-sora font-medium hover:bg-lafoi-green transition-colors">
            Explore our finishes <ArrowRight size={15} weight="bold" />
          </Link>
        </motion.div>
      </div>

      {/* Showcase strip — large swipeable cards on mobile, 3-up grid on desktop */}
      <div className="relative z-10 max-w-[1280px] w-full mx-auto pb-7 sm:pb-8">
        <motion.div key={active.key} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}
          className={`flex sm:grid sm:grid-cols-3 gap-3 lg:gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none px-5 sm:px-6 lg:px-10 ${noBar}`}>
          {active.shots.map((s, i) => (
            <div key={s + i} className={`group relative shrink-0 snap-center w-[78%] sm:w-auto aspect-[4/5] overflow-hidden bg-lafoi-dark ${i === 0 ? 'rounded-tl-[32px] sm:rounded-tl-[40px] rounded-br-lg rounded-tr-lg rounded-bl-lg' : i === 2 ? 'rounded-tr-[32px] sm:rounded-tr-[40px] rounded-bl-lg rounded-tl-lg rounded-br-lg' : 'rounded-lg'}`}>
              <picture>
                <source srcSet={`/brand/images/${s.replace(/\.(png|jpe?g)$/i, '.webp')}`} type="image/webp" />
                <img src={img(s)} alt="La Foi stretch ceiling" className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105" />
              </picture>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
