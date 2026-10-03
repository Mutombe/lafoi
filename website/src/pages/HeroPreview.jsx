import React, { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Play, CaretLeft, CaretRight, MagnifyingGlass, UserCircle,
  Heart, ShareNetwork, Plus, SquaresFour, MapPin, InstagramLogo, FacebookLogo,
  WhatsappLogo, Copy,
} from '@phosphor-icons/react'

/* ===========================================================================
   Three La Foi landing-hero concepts for team review. Each signals clearly
   that La Foi does stretch ceilings + architectural lighting in Zimbabwe.
   All three are interactive and mobile-responsive.
   Routes: /hero-preview  (switcher) and /hero-preview/1|2|3
   =========================================================================== */

const EASE = [0.16, 1, 0.3, 1]
const img = (n) => `/brand/images/${n}`
const noBar = '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

/* ---------------------------------------------------------------------------
   VARIANT 1 — Editorial (light, centered, interactive finish selector)
   inspired by the "Qlick / Human Expression" layout
   --------------------------------------------------------------------------- */
const FINISHES = [
  { key: 'Starfield', chip: '18.png', shots: ['18.png', '22.png', 'mirror.png'] },
  { key: 'Matte', chip: '22.png', shots: ['22.png', '13.png', 'transluescent1.png'] },
  { key: 'Gloss', chip: 'mirror.png', shots: ['mirror.png', '35.png', '22.png'] },
  { key: 'Translucent', chip: 'transluescent1.png', shots: ['transluescent1.png', '18.png', '13.png'] },
]

function HeroEditorial() {
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
          The ceiling,
          <span className="inline-flex align-middle mx-2 sm:mx-3 h-[0.72em] w-[1.5em] rounded-full overflow-hidden ring-1 ring-lafoi-dark/10 translate-y-[-0.05em] bg-lafoi-dark">
            <AnimatePresence mode="wait">
              <motion.img key={active.chip} src={img(active.chip)} alt="" initial={{ opacity: 0, scale: 1.15 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="w-full h-full object-cover" />
            </AnimatePresence>
          </span>
          rebuilt in <span className="italic text-lafoi-green">light</span> & surface.
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

/* ---------------------------------------------------------------------------
   VARIANT 2 — Dark luxe (left headline + accent line, interactive collage)
   inspired by the "Lighting / Classic & Modern" layout
   --------------------------------------------------------------------------- */
const SLICES = [
  { src: '22.png', name: 'Starfield ceiling', hLg: 'lg:h-[62%]', tLg: 'lg:top-[8%]' },
  { src: '13.png', name: 'Gloss stretch', hLg: 'lg:h-[78%]', tLg: 'lg:top-[4%]' },
  { src: 'transluescent1.png', name: 'Translucent backlit', hLg: 'lg:h-[58%]', tLg: 'lg:top-[22%]' },
  { src: 'stretch-mirror.png', name: 'Mirror gloss', hLg: 'lg:h-[72%]', tLg: 'lg:top-[12%]' },
]

function HeroLuxe() {
  const [ai, setAi] = useState(0)
  const n = SLICES.length
  const itemRefs = useRef([])

  useEffect(() => {
    const el = itemRefs.current[ai]
    if (el && typeof window !== 'undefined' && window.innerWidth < 1024) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [ai])

  const prev = () => setAi((v) => (v - 1 + n) % n)
  const next = () => setAi((v) => (v + 1) % n)

  return (
    <section className="relative min-h-screen bg-lafoi-dark text-white overflow-hidden flex flex-col">
      {/* top nav */}
      <div className="relative z-20 max-w-[1440px] w-full mx-auto px-5 sm:px-6 lg:px-12 pt-6 lg:pt-7 flex items-center justify-between gap-3">
        <span className="font-display text-lg sm:text-xl">La Foi</span>
        <nav className="hidden lg:flex items-center gap-6 text-sm font-general text-white/75">
          {['Home', 'About', 'Finishes', 'Lighting', 'Projects', 'Contact'].map((l, i) => (
            <button key={l} className="flex items-center gap-6 hover:text-white transition-colors">{l}{i < 5 && <span className="w-1 h-1 rounded-full bg-lafoi-green-light/60" />}</button>
          ))}
        </nav>
        <div className="flex items-center gap-3 sm:gap-4 text-white/80"><MagnifyingGlass size={18} /><UserCircle size={20} /></div>
      </div>

      {/* left vertical rail */}
      <div className="hidden lg:flex flex-col items-center gap-4 absolute left-5 top-1/2 -translate-y-1/2 z-20 text-white/55">
        {[FacebookLogo, InstagramLogo, WhatsappLogo].map((Ic, i) => <Ic key={i} size={16} />)}
        <span className="w-px h-16 bg-white/20 my-1" />
        <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] tracking-[0.25em] text-white/45">+263 782 931 472</span>
      </div>

      {/* content — extra top padding so it is not wedged under the nav */}
      <div className="relative z-10 flex-1 max-w-[1440px] w-full mx-auto px-5 sm:px-6 lg:px-12 grid lg:grid-cols-2 gap-8 lg:gap-10 items-center pt-10 sm:pt-12 lg:pt-6 pb-6">
        {/* left text */}
        <div className="relative lg:pl-12 order-1">
          <span aria-hidden className="absolute -top-3 lg:-top-6 -left-1 lg:-left-2 font-display font-light text-white/[0.04] text-[4.5rem] sm:text-[6rem] lg:text-[9rem] leading-none select-none pointer-events-none">STRETCH</span>
          <p className="relative font-sora text-[10px] sm:text-[11px] tracking-[0.28em] sm:tracking-[0.3em] uppercase text-lafoi-green-light mb-4 sm:mb-5">La Foi Designs · Est. 2024 · Harare</p>
          <h1 className="relative font-display font-light leading-[1.04] tracking-[-0.02em] text-[2.4rem] sm:text-[3.6rem] lg:text-[4.4rem]">
            Perfect synergy of
            <br /><span className="text-lafoi-green-light">surface &amp; light.</span>
          </h1>
          <p className="relative mt-5 sm:mt-6 max-w-md text-[14px] sm:text-[15px] text-white/70 font-general leading-relaxed">
            Tensioned stretch ceilings — matte, gloss, translucent, printed and fibre-optic starfields — engineered with bespoke architectural lighting. Clean, fire-rated, installed in two to four days.
          </p>
          <button className="relative mt-7 sm:mt-9 group inline-flex items-center gap-4">
            <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-white/30 flex items-center justify-center group-hover:bg-lafoi-green group-hover:border-lafoi-green transition-colors">
              <Play size={16} weight="fill" className="text-white ml-0.5" />
            </span>
            <span className="font-sora text-xs tracking-[0.25em] uppercase text-white/85 group-hover:text-white transition-colors">Explore finishes</span>
          </button>
        </div>

        {/* right interactive collage */}
        <div className="relative order-2 mt-2 lg:mt-0 h-[40vh] sm:h-[46vh] lg:h-[70vh]">
          <div className={`absolute inset-0 flex gap-3 items-center lg:items-start justify-start lg:justify-end overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:snap-none px-0.5 lg:px-0 ${noBar}`}>
            {SLICES.map((s, i) => (
              <motion.button
                key={s.src}
                ref={(el) => (itemRefs.current[i] = el)}
                onClick={() => setAi(i)}
                aria-label={s.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.15 + i * 0.1, ease: EASE }}
                className={`relative snap-center shrink-0 w-[58%] sm:w-[38%] lg:w-[22%] lg:max-w-[150px] h-[88%] ${s.hLg} ${s.tLg} rounded-sm overflow-hidden bg-black transition-all duration-300 ${ai === i ? 'ring-2 ring-lafoi-green-light shadow-[0_24px_60px_-28px_rgba(42,160,70,0.6)] lg:scale-[1.05] z-10' : 'opacity-70 hover:opacity-100'}`}>
                <picture>
                  <source srcSet={`/brand/images/${s.src.replace(/\.(png|jpe?g)$/i, '.webp')}`} type="image/webp" />
                  <img src={img(s.src)} alt={s.name} className="absolute inset-0 w-full h-full object-cover" />
                </picture>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* bottom bar — live caption + working prev/next */}
      <div className="relative z-20 max-w-[1440px] w-full mx-auto px-5 sm:px-6 lg:px-12 pb-5 sm:pb-6 flex items-center justify-between text-white/55 text-[10px] sm:text-[11px] font-sora tracking-[0.2em] uppercase">
        <span className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-white">{String(ai + 1).padStart(2, '0')}</span>
          <span className="w-6 sm:w-10 h-px bg-white/25 shrink-0" />
          <AnimatePresence mode="wait">
            <motion.span key={ai} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }} className="truncate">
              {SLICES[ai].name}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className="hidden sm:inline">Scroll</span>
        <span className="flex items-center gap-1">
          <button onClick={prev} aria-label="Previous" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 hover:text-white transition-colors"><CaretLeft size={16} /></button>
          <button onClick={next} aria-label="Next" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 hover:text-white transition-colors"><CaretRight size={16} /></button>
        </span>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------------------
   VARIANT 3 — Glass coverflow (working visionOS frosted-card carousel)
   inspired by the "Rome Explorer" layout
   --------------------------------------------------------------------------- */
const CARDS = [
  { src: '18.png', name: 'Starfield Ceiling', desc: 'A black mirror membrane set with a field of fibre-optic lights — a living night sky installed in days, over any room.' },
  { src: 'transluescent1.png', name: 'Translucent Backlit', desc: 'A light-diffusing membrane backlit to glow as one seamless luminous plane — even, shadowless, architectural.' },
  { src: '22.png', name: 'Gloss Lacquer', desc: 'A high-gloss tensioned finish that mirrors the room and doubles the daylight — depth without the weight.' },
  { src: 'mirror.png', name: 'Mirror Gloss', desc: 'A flawless reflective ceiling that lifts low rooms and amplifies every fixture you hang beneath it.' },
  { src: '35.png', name: 'Printed Marble', desc: 'Any image or texture printed into the membrane at full span — marble, sky, brand, bespoke.' },
]

function HeroGlass() {
  const n = CARDS.length
  const [center, setCenter] = useState(2)

  const sideFor = (i) => {
    const rel = ((i - center) % n + n) % n
    if (rel === 0) return 'center'
    if (rel === 1) return 'right'
    if (rel === 2) return 'far-right'
    if (rel === n - 1) return 'left'
    if (rel === n - 2) return 'far-left'
    return 'hidden'
  }
  const tf = {
    'far-left': 'translateX(-62%) scale(.62) perspective(1400px) rotateY(32deg)',
    left: 'translateX(-40%) scale(.78) perspective(1400px) rotateY(24deg)',
    center: 'translateX(0) scale(1)',
    right: 'translateX(40%) scale(.78) perspective(1400px) rotateY(-24deg)',
    'far-right': 'translateX(62%) scale(.62) perspective(1400px) rotateY(-32deg)',
    hidden: 'translateX(0) scale(.5)',
  }
  const z = { 'far-left': 10, left: 20, center: 40, right: 20, 'far-right': 10, hidden: 0 }
  const op = { 'far-left': 0.4, left: 0.7, center: 1, right: 0.7, 'far-right': 0.4, hidden: 0 }

  const prev = () => setCenter((v) => (v - 1 + n) % n)
  const next = () => setCenter((v) => (v + 1) % n)
  const cur = CARDS[center]

  return (
    <section className="relative min-h-screen overflow-hidden bg-lafoi-dark text-white flex flex-col">
      {/* ambient blurred backdrop follows the centred finish */}
      <div aria-hidden className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.img key={cur.src} src={img(cur.src)} alt="" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="w-full h-full object-cover scale-110 blur-2xl" />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-lafoi-dark/70 via-lafoi-dark/40 to-lafoi-dark/90" />
      </div>

      {/* floating chrome pill — carets work */}
      <div className="relative z-20 pt-5 sm:pt-6 flex justify-center px-4">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-xl border border-white/15 rounded-full px-2.5 sm:px-3 py-2 text-white/80">
          <SquaresFour size={15} />
          <button onClick={prev} aria-label="Previous" className="p-1 rounded-full hover:bg-white/15 transition-colors"><CaretLeft size={14} /></button>
          <button onClick={next} aria-label="Next" className="p-1 rounded-full hover:bg-white/15 transition-colors"><CaretRight size={14} /></button>
          <span className="mx-1 sm:mx-2 px-3 sm:px-4 py-1 rounded-full bg-black/25 text-[11px] sm:text-xs font-sora tracking-wide whitespace-nowrap">La Foi · Finishes</span>
          <Plus size={14} /><ShareNetwork size={14} className="hidden sm:block" /><Copy size={14} className="hidden sm:block" />
        </div>
      </div>

      {/* left icon rail */}
      <div className="hidden sm:flex flex-col gap-2 absolute left-5 top-1/2 -translate-y-1/2 z-20">
        {[Heart, UserCircle].map((Ic, i) => (
          <span key={i} className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white/75"><Ic size={15} /></span>
        ))}
      </div>

      {/* coverflow — click a side card to centre it */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4">
        <div className="relative w-full max-w-[560px] h-[60vh] sm:h-[64vh] max-h-[560px]" style={{ perspective: '1400px' }}>
          {CARDS.map((c, i) => {
            const side = sideFor(i)
            const isCenter = side === 'center'
            return (
              <div
                key={c.name + i}
                onClick={() => !isCenter && side !== 'hidden' && setCenter(i)}
                role={isCenter ? undefined : 'button'}
                aria-label={isCenter ? undefined : `Show ${c.name}`}
                className={`absolute inset-0 transition-all duration-500 ${isCenter ? '' : side === 'hidden' ? 'pointer-events-none' : 'cursor-pointer'}`}
                style={{ transform: tf[side], zIndex: z[side], opacity: op[side] }}>
                <div className="w-full h-full rounded-[22px] overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.8)] flex flex-col">
                  <div className="relative flex-1">
                    <picture>
                      <source srcSet={`/brand/images/${c.src.replace(/\.(png|jpe?g)$/i, '.webp')}`} type="image/webp" />
                      <img src={img(c.src)} alt={c.name} className="absolute inset-0 w-full h-full object-cover" />
                    </picture>
                    {isCenter && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur text-[11px] font-sora">{center + 1} / {n}</span>
                    )}
                  </div>
                  {isCenter ? (
                    <div className="p-4 sm:p-5 bg-black/30 backdrop-blur-md">
                      <AnimatePresence mode="wait">
                        <motion.div key={cur.name + center} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
                          <h3 className="font-display font-light text-xl sm:text-2xl">{cur.name}</h3>
                          <p className="mt-1.5 text-[12px] sm:text-[13px] text-white/70 font-general leading-snug">{cur.desc}</p>
                        </motion.div>
                      </AnimatePresence>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-white/60"><MapPin size={12} /> Belgravia, Harare</span>
                        <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-lafoi-green hover:bg-lafoi-green-light text-white text-xs font-sora font-medium transition-colors">Explore <ArrowRight size={12} weight="bold" /></button>
                      </div>
                    </div>
                  ) : side !== 'hidden' && (
                    <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                      <p className="text-sm font-sora">{c.name}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* bottom glass pill — working carets */}
      <div className="relative z-20 pb-6 sm:pb-7 flex justify-center px-4">
        <div className="flex items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-xl border border-white/15 rounded-full pl-2 pr-2 sm:pr-3 py-2">
          <button onClick={prev} aria-label="Previous" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors"><CaretLeft size={16} className="text-white/80" /></button>
          <span className="w-9 h-9 rounded-full overflow-hidden"><img src={img(cur.src)} alt="" className="w-full h-full object-cover" /></span>
          <div className="leading-tight pr-1 min-w-0">
            <p className="text-sm font-sora truncate">{cur.name}</p>
            <p className="text-[11px] text-white/55 truncate">Stretch ceilings &amp; lighting · Harare</p>
          </div>
          <button onClick={next} aria-label="Next" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors"><CaretRight size={16} className="text-white/80" /></button>
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
      <div className={`fixed bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-1 sm:gap-1.5 bg-black/80 backdrop-blur-xl border border-white/15 rounded-full px-1.5 sm:px-2 py-1.5 sm:py-2 shadow-2xl max-w-[calc(100vw-1.5rem)] overflow-x-auto ${noBar}`}>
        <span className="px-3 text-[10px] font-sora tracking-[0.22em] uppercase text-white/45 hidden md:inline">Concept</span>
        {VARIANTS.map((v) => (
          <button key={v.n} onClick={() => navigate(`/hero-preview/${v.n}`)}
            className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-sora font-medium transition-colors whitespace-nowrap ${v.n === active ? 'bg-white text-black' : 'text-white/75 hover:text-white'}`}>
            {v.n} · {v.label}
          </button>
        ))}
        <a href="/" className="ml-0.5 sm:ml-1 px-3 py-1.5 rounded-full text-xs font-sora text-white/55 hover:text-white whitespace-nowrap">Live ↗</a>
      </div>
    </div>
  )
}
