import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from '@phosphor-icons/react'

/* ===========================================================================
   La Foi landing-hero — Editorial concept (the direction the team chose).
   Light, centered, with an interactive finish selector and a showcase strip.
   Route: /hero-preview
   =========================================================================== */

const EASE = [0.16, 1, 0.3, 1]
const img = (n) => `/brand/images/${n}`

const FINISHES = [
  { key: 'Starfield', shots: ['18.png', '22.png', 'mirror.png'] },
  { key: 'Matte', shots: ['22.png', '13.png', 'transluescent1.png'] },
  { key: 'Gloss', shots: ['mirror.png', '35.png', '22.png'] },
  { key: 'Translucent', shots: ['transluescent1.png', '18.png', '13.png'] },
]

export default function HeroPreview() {
  const [fi, setFi] = useState(0)
  const active = FINISHES[fi]

  return (
    <section className="relative min-h-screen bg-lafoi-cream flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="relative z-10 max-w-[1280px] w-full mx-auto px-5 sm:px-6 lg:px-10 pt-5 sm:pt-6 flex items-center justify-between gap-3">
        <span className="font-display text-lg sm:text-xl tracking-tight text-lafoi-dark">La&nbsp;Foi</span>
        <nav className="hidden md:flex items-center gap-1 bg-white rounded-full px-1.5 py-1.5 shadow-[0_8px_30px_-16px_rgba(0,0,0,0.25)] border border-lafoi-dark/5">
          {['Finishes', 'Lighting', 'Projects', 'About', 'Contact'].map((l, i) => (
            <button key={l} className={`px-4 py-2 rounded-full text-sm font-sora transition-colors ${i === 0 ? 'bg-lafoi-dark text-white' : 'text-lafoi-gray hover:text-lafoi-dark'}`}>{l}</button>
          ))}
        </nav>
        <button className="inline-flex items-center gap-2 bg-lafoi-dark text-white rounded-full px-4 sm:px-5 py-2.5 text-sm font-sora font-medium hover:bg-lafoi-green transition-colors">
          <span className="hidden sm:inline">Get a quote</span><span className="sm:hidden">Quote</span>
          <ArrowRight size={14} weight="bold" />
        </button>
      </div>

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
          <button className="inline-flex items-center gap-3 bg-lafoi-dark text-white rounded-full px-6 sm:px-7 py-3.5 text-sm font-sora font-medium hover:bg-lafoi-green transition-colors">
            Explore our finishes <ArrowRight size={15} weight="bold" />
          </button>
        </motion.div>
      </div>

      {/* Interactive 3-image showcase strip — swaps with the selected finish */}
      <div className="relative z-10 max-w-[1280px] w-full mx-auto px-5 sm:px-6 lg:px-10 pb-7 sm:pb-8">
        <motion.div key={active.key} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}
          className="grid grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4">
          {active.shots.map((s, i) => (
            <div key={s + i} className={`group relative aspect-[3/4] sm:aspect-[4/5] overflow-hidden bg-lafoi-dark ${i === 0 ? 'rounded-tl-[28px] sm:rounded-tl-[40px] rounded-br-lg rounded-tr-lg rounded-bl-lg' : i === 2 ? 'rounded-tr-[28px] sm:rounded-tr-[40px] rounded-bl-lg rounded-tl-lg rounded-br-lg' : 'rounded-lg'}`}>
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
