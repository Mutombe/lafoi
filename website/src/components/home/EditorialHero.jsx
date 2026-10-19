import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from '@phosphor-icons/react'

/* ===========================================================================
   La Foi landing-hero — Editorial concept (the direction the team chose).
   Light, centered hero content: headline, an interactive finish selector and
   an enlarged mobile showcase strip. The site header/navigation is supplied
   globally by SiteNav (see components/layout/SiteNav), so this component is
   just the hero body and clears the fixed nav with top padding.
   =========================================================================== */

const EASE = [0.16, 1, 0.3, 1]
const img = (n) => `/brand/images/${n}`
const noBar = '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

const FINISHES = [
  { key: 'Starfield', shots: ['18.png', '22.png', 'mirror.png'] },
  { key: 'Matte', shots: ['22.png', '13.png', 'transluescent1.png'] },
  { key: 'Gloss', shots: ['mirror.png', '35.png', '22.png'] },
  { key: 'Translucent', shots: ['transluescent1.png', '18.png', '13.png'] },
]

export default function EditorialHero() {
  const [fi, setFi] = useState(0)
  const active = FINISHES[fi]

  return (
    <section className="relative min-h-screen bg-lafoi-cream flex flex-col overflow-hidden pt-24 sm:pt-28">
      {/* Centered headline */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-5 sm:px-6 pt-4 sm:pt-6 pb-5">
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
          Zimbabwe’s first dedicated stretch-ceiling studio. Matte, gloss, translucent, printed and starfield finishes, each with its lighting designed in and fitted in two to four days.
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
                <img src={img(s)} alt={`${active.key} finish stretch ceiling with integrated lighting by La Foi Designs, Harare`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105" />
              </picture>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
