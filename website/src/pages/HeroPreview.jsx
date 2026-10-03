import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight, Play, CaretLeft, CaretRight, MagnifyingGlass, UserCircle,
  Heart, ShareNetwork, Plus, SquaresFour, MapPin, InstagramLogo, FacebookLogo,
  WhatsappLogo, Copy,
} from '@phosphor-icons/react'

/* ===========================================================================
   Three La Foi landing-hero concepts for team review. Each signals clearly
   that La Foi does stretch ceilings + architectural lighting in Zimbabwe.
   Routes: /hero-preview  (switcher) and /hero-preview/1|2|3
   =========================================================================== */

const EASE = [0.16, 1, 0.3, 1]
const img = (n) => `/brand/images/${n}`

/* ---------------------------------------------------------------------------
   VARIANT 1 — Editorial (light, centered, 3-image showcase strip)
   inspired by the "Qlick / Human Expression" layout
   --------------------------------------------------------------------------- */
function HeroEditorial() {
  const shots = ['22.png', 'mirror.png', 'transluescent1.png']
  return (
    <section className="relative min-h-screen bg-lafoi-cream flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="relative z-10 max-w-[1280px] w-full mx-auto px-6 lg:px-10 pt-6 flex items-center justify-between">
        <span className="font-display text-xl tracking-tight text-lafoi-dark">La&nbsp;Foi</span>
        <nav className="hidden md:flex items-center gap-1 bg-white rounded-full px-1.5 py-1.5 shadow-[0_8px_30px_-16px_rgba(0,0,0,0.25)] border border-lafoi-dark/5">
          {['Finishes', 'Lighting', 'Projects', 'About', 'Contact'].map((l, i) => (
            <span key={l} className={`px-4 py-2 rounded-full text-sm font-sora ${i === 0 ? 'bg-lafoi-dark text-white' : 'text-lafoi-gray'}`}>{l}</span>
          ))}
        </nav>
        <span className="inline-flex items-center gap-2 bg-lafoi-dark text-white rounded-full px-5 py-2.5 text-sm font-sora font-medium">
          Get a quote <ArrowRight size={14} weight="bold" />
        </span>
      </div>

      {/* Centered headline */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pt-10 pb-6">
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}
          className="font-sora text-[11px] tracking-[0.3em] uppercase text-lafoi-green mb-6">
          Stretch ceilings · Architectural lighting · Harare
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.05 }}
          className="font-display font-light text-lafoi-dark leading-[1.02] tracking-[-0.03em] text-[2.6rem] sm:text-[3.6rem] lg:text-[4.6rem] max-w-[14ch]">
          The ceiling,
          <span className="inline-flex align-middle mx-3 h-[0.72em] w-[1.5em] rounded-full overflow-hidden ring-1 ring-lafoi-dark/10 translate-y-[-0.05em]">
            <img src={img('35.png')} alt="" className="w-full h-full object-cover" />
          </span>
          rebuilt in <span className="italic text-lafoi-green">light</span> & surface.
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-6 max-w-xl text-base text-lafoi-gray font-general leading-relaxed">
          Zimbabwe’s first dedicated stretch-ceiling studio — matte, gloss, translucent, printed and starfield finishes with bespoke lighting, installed in two to four days.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="mt-8">
          <span className="inline-flex items-center gap-3 bg-lafoi-dark text-white rounded-full px-7 py-3.5 text-sm font-sora font-medium">
            Explore our finishes <ArrowRight size={15} weight="bold" />
          </span>
        </motion.div>
      </div>

      {/* 3-image showcase strip with soft top curve */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
        className="relative z-10 max-w-[1280px] w-full mx-auto px-6 lg:px-10 pb-8">
        <div className="grid grid-cols-3 gap-3 lg:gap-4" style={{ borderTopLeftRadius: 40, borderTopRightRadius: 40 }}>
          {shots.map((s, i) => (
            <div key={s} className={`relative aspect-[3/4] sm:aspect-[4/5] overflow-hidden bg-lafoi-dark ${i === 0 ? 'rounded-tl-[40px] rounded-br-lg rounded-tr-lg rounded-bl-lg' : i === 2 ? 'rounded-tr-[40px] rounded-bl-lg rounded-tl-lg rounded-br-lg' : 'rounded-lg'}`}>
              <picture>
                <source srcSet={`/brand/images/${s.replace(/\.(png|jpe?g)$/i, '.webp')}`} type="image/webp" />
                <img src={img(s)} alt="La Foi stretch ceiling" className="absolute inset-0 w-full h-full object-cover" />
              </picture>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

/* ---------------------------------------------------------------------------
   VARIANT 2 — Dark luxe (left headline + accent line, staggered right collage)
   inspired by the "Lighting / Classic & Modern" layout
   --------------------------------------------------------------------------- */
function HeroLuxe() {
  const slices = [
    { src: '22.png', h: 'h-[62%]', t: 'top-[8%]' },
    { src: '13.png', h: 'h-[78%]', t: 'top-[4%]' },
    { src: 'transluescent1.png', h: 'h-[58%]', t: 'top-[22%]' },
    { src: 'stretch-mirror.png', h: 'h-[72%]', t: 'top-[12%]' },
  ]
  return (
    <section className="relative min-h-screen bg-lafoi-dark text-white overflow-hidden">
      {/* top nav */}
      <div className="relative z-20 max-w-[1440px] mx-auto px-6 lg:px-12 pt-7 flex items-center justify-between">
        <span className="font-display text-xl">La Foi</span>
        <nav className="hidden lg:flex items-center gap-6 text-sm font-general text-white/75">
          {['Home', 'About', 'Finishes', 'Lighting', 'Projects', 'Contact'].map((l, i) => (
            <span key={l} className="flex items-center gap-6">{l}{i < 5 && <span className="w-1 h-1 rounded-full bg-lafoi-green-light/60" />}</span>
          ))}
        </nav>
        <div className="flex items-center gap-4 text-white/80"><MagnifyingGlass size={18} /><UserCircle size={20} /></div>
      </div>

      {/* left vertical rail */}
      <div className="hidden lg:flex flex-col items-center gap-4 absolute left-5 top-1/2 -translate-y-1/2 z-20 text-white/55">
        {[FacebookLogo, InstagramLogo, WhatsappLogo].map((Ic, i) => <Ic key={i} size={16} />)}
        <span className="w-px h-16 bg-white/20 my-1" />
        <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] tracking-[0.25em] text-white/45">+263 782 931 472</span>
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-10 items-center" style={{ minHeight: 'calc(100vh - 90px)' }}>
        {/* left text */}
        <div className="relative lg:pl-12">
          <span aria-hidden className="absolute -top-6 -left-2 font-display font-light text-white/[0.04] text-[6rem] lg:text-[9rem] leading-none select-none pointer-events-none">STRETCH</span>
          <p className="relative font-sora text-[11px] tracking-[0.3em] uppercase text-lafoi-green-light mb-5">La Foi Designs · Est. 2024 · Harare</p>
          <h1 className="relative font-display font-light leading-[1.02] tracking-[-0.02em] text-[2.8rem] sm:text-[3.6rem] lg:text-[4.4rem]">
            Perfect synergy of
            <br /><span className="text-lafoi-green-light">surface &amp; light.</span>
          </h1>
          <p className="relative mt-6 max-w-md text-[15px] text-white/70 font-general leading-relaxed">
            Tensioned stretch ceilings — matte, gloss, translucent, printed and fibre-optic starfields — engineered with bespoke architectural lighting. Clean, fire-rated, installed in two to four days.
          </p>
          <button className="relative mt-9 group inline-flex items-center gap-4">
            <span className="w-14 h-14 rounded-full border border-white/30 flex items-center justify-center group-hover:bg-lafoi-green group-hover:border-lafoi-green transition-colors">
              <Play size={16} weight="fill" className="text-white ml-0.5" />
            </span>
            <span className="font-sora text-xs tracking-[0.25em] uppercase text-white/85">Explore finishes</span>
          </button>
        </div>

        {/* right staggered collage */}
        <div className="relative h-[52vh] lg:h-[70vh]">
          <div className="absolute inset-0 flex gap-3 justify-center lg:justify-end">
            {slices.map((s, i) => (
              <motion.div key={s.src} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 + i * 0.1, ease: EASE }}
                className={`relative ${s.t} ${s.h} w-[22%] max-w-[150px] rounded-sm overflow-hidden bg-black shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)]`}>
                <picture>
                  <source srcSet={`/brand/images/${s.src.replace(/\.(png|jpe?g)$/i, '.webp')}`} type="image/webp" />
                  <img src={img(s.src)} alt="La Foi ceiling" className="absolute inset-0 w-full h-full object-cover" />
                </picture>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* bottom bar */}
      <div className="relative z-20 max-w-[1440px] mx-auto px-6 lg:px-12 pb-6 flex items-center justify-between text-white/55 text-[11px] font-sora tracking-[0.2em] uppercase">
        <span className="flex items-center gap-3"><span className="text-white">01</span><span className="w-10 h-px bg-white/25" />Starfield ceilings</span>
        <span>Scroll</span>
        <span className="flex items-center gap-3"><CaretLeft size={14} /><CaretRight size={14} /></span>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------------------
   VARIANT 3 — Glass coverflow (visionOS frosted cards on a dark ambient scene)
   inspired by the "Rome Explorer" layout
   --------------------------------------------------------------------------- */
function HeroGlass() {
  const cards = [
    { src: '18.png', name: 'Starfield Ceiling', side: 'far-left' },
    { src: 'transluescent1.png', name: 'Translucent Backlit', side: 'left' },
    { src: '22.png', name: 'Starfield Ceiling', side: 'center' },
    { src: 'mirror.png', name: 'Mirror Gloss', side: 'right' },
    { src: '35.png', name: 'Printed Marble', side: 'far-right' },
  ]
  const tf = {
    'far-left': 'translateX(-62%) scale(.62) perspective(1400px) rotateY(32deg)',
    left: 'translateX(-40%) scale(.78) perspective(1400px) rotateY(24deg)',
    center: 'translateX(0) scale(1)',
    right: 'translateX(40%) scale(.78) perspective(1400px) rotateY(-24deg)',
    'far-right': 'translateX(62%) scale(.62) perspective(1400px) rotateY(-32deg)',
  }
  const z = { 'far-left': 10, left: 20, center: 40, right: 20, 'far-right': 10 }
  const op = { 'far-left': 0.4, left: 0.7, center: 1, right: 0.7, 'far-right': 0.4 }

  return (
    <section className="relative min-h-screen overflow-hidden bg-lafoi-dark text-white flex flex-col">
      {/* ambient blurred backdrop */}
      <div aria-hidden className="absolute inset-0">
        <img src={img('22.png')} alt="" className="w-full h-full object-cover scale-110 blur-2xl opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-lafoi-dark/70 via-lafoi-dark/40 to-lafoi-dark/90" />
      </div>

      {/* floating chrome pill */}
      <div className="relative z-20 pt-6 flex justify-center px-4">
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/15 rounded-full px-3 py-2 text-white/80">
          <SquaresFour size={15} /><CaretLeft size={14} /><CaretRight size={14} />
          <span className="mx-2 px-4 py-1 rounded-full bg-black/25 text-xs font-sora tracking-wide">La Foi · Finishes</span>
          <Plus size={14} /><ShareNetwork size={14} /><Copy size={14} />
        </div>
      </div>

      {/* left icon rail */}
      <div className="hidden sm:flex flex-col gap-2 absolute left-5 top-1/2 -translate-y-1/2 z-20">
        {[Heart, UserCircle].map((Ic, i) => (
          <span key={i} className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white/75"><Ic size={15} /></span>
        ))}
      </div>

      {/* coverflow */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4">
        <div className="relative w-full max-w-[560px] h-[64vh] max-h-[560px]" style={{ perspective: '1400px' }}>
          {cards.map((c) => (
            <div key={c.name + c.side} className="absolute inset-0 transition-all duration-500" style={{ transform: tf[c.side], zIndex: z[c.side], opacity: op[c.side] }}>
              <div className="w-full h-full rounded-[22px] overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.8)] flex flex-col">
                <div className="relative flex-1">
                  <picture>
                    <source srcSet={`/brand/images/${c.src.replace(/\.(png|jpe?g)$/i, '.webp')}`} type="image/webp" />
                    <img src={img(c.src)} alt={c.name} className="absolute inset-0 w-full h-full object-cover" />
                  </picture>
                  {c.side === 'center' && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur text-[11px] font-sora">1 / 7</span>
                  )}
                </div>
                {c.side === 'center' && (
                  <div className="p-5 bg-black/30 backdrop-blur-md">
                    <h3 className="font-display font-light text-2xl">{c.name}</h3>
                    <p className="mt-1.5 text-[13px] text-white/70 font-general leading-snug">
                      A black mirror membrane set with a field of fibre-optic lights — a living night sky installed in days, over any room.
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-white/60"><MapPin size={12} /> Belgravia, Harare</span>
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-lafoi-green text-white text-xs font-sora font-medium">Explore <ArrowRight size={12} weight="bold" /></span>
                    </div>
                  </div>
                )}
                {c.side !== 'center' && (
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-sm font-sora">{c.name}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* bottom glass pill */}
      <div className="relative z-20 pb-7 flex justify-center px-4">
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/15 rounded-full pl-2 pr-3 py-2">
          <CaretLeft size={16} className="text-white/70" />
          <span className="w-9 h-9 rounded-full overflow-hidden"><img src={img('mirror.png')} alt="" className="w-full h-full object-cover" /></span>
          <div className="leading-tight pr-1">
            <p className="text-sm font-sora">La Foi Designs</p>
            <p className="text-[11px] text-white/55">Stretch ceilings &amp; lighting · Harare</p>
          </div>
          <CaretRight size={16} className="text-white/70" />
        </div>
      </div>
    </section>
  )
}

const VARIANTS = [
  { n: 1, label: 'Editorial', el: <HeroEditorial /> },
  { n: 2, label: 'Dark luxe', el: <HeroLuxe /> },
  { n: 3, label: 'Glass', el: <HeroGlass /> },
]

export default function HeroPreview() {
  const { n } = useParams()
  const navigate = useNavigate()
  const active = Math.min(3, Math.max(1, parseInt(n || '1', 10) || 1))
  const current = VARIANTS.find((v) => v.n === active) || VARIANTS[0]

  return (
    <div className="relative">
      {current.el}
      {/* Review switcher */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-1.5 bg-black/80 backdrop-blur-xl border border-white/15 rounded-full px-2 py-2 shadow-2xl">
        <span className="px-3 text-[10px] font-sora tracking-[0.22em] uppercase text-white/45 hidden sm:inline">Concept</span>
        {VARIANTS.map((v) => (
          <button key={v.n} onClick={() => navigate(`/hero-preview/${v.n}`)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-sora font-medium transition-colors ${v.n === active ? 'bg-white text-black' : 'text-white/75 hover:text-white'}`}>
            {v.n} · {v.label}
          </button>
        ))}
        <a href="/" className="ml-1 px-3 py-1.5 rounded-full text-xs font-sora text-white/55 hover:text-white">Live site ↗</a>
      </div>
    </div>
  )
}
