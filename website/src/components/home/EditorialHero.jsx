import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, List, X, CaretDown } from '@phosphor-icons/react'
import Logo from '../shared/Logo'
import { navGroups } from '../layout/navData'

/* ===========================================================================
   La Foi landing-hero — Editorial concept (the direction the team chose).
   Light, centered, self-contained header that doubles as the homepage's one
   and only navigation: a sticky editorial pill carrying the full site nav
   (Home + the Discover / Services / Connect dropdowns + Shop), shared with the
   global Navbar via navData so the two can never drift apart. Also an
   interactive finish selector and an enlarged mobile showcase strip.
   Used as the site's main hero and on the /hero-preview review route.
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [openGroup, setOpenGroup] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const active = FINISHES[fi]
  const location = useLocation()
  const path = location.pathname
  const homeActive = path === '/' || path === '/hero-preview'
  const shopActive = path === '/shop'

  // The header is fixed, so once the page scrolls we drop in a cream glass
  // backdrop to keep the dark logo and links legible over the content below.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close any open desktop dropdown whenever the route changes.
  useEffect(() => { setOpenGroup(null); setMenuOpen(false) }, [path])

  return (
    <section className="relative min-h-screen bg-lafoi-cream flex flex-col overflow-hidden pt-20 sm:pt-24">
      {/* Sticky header — the homepage's single navigation */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-lafoi-cream/90 backdrop-blur-md border-b border-lafoi-dark/5 shadow-[0_8px_30px_-20px_rgba(0,0,0,0.35)]' : ''
      }`}>
        <div className="relative max-w-[1280px] w-full mx-auto px-5 sm:px-6 lg:px-10 py-3.5 sm:py-4 flex items-center justify-between gap-3">
          <Link to="/" className="group inline-flex items-center shrink-0" aria-label="La Foi Designs, home">
            <Logo tone="dark" variant="wordmark" imgClassName="h-8 sm:h-10 lg:h-11 w-auto group-hover:scale-105 transition-transform duration-300" />
          </Link>

          {/* Desktop pill nav — full site navigation with dropdowns */}
          <nav className="hidden lg:flex items-center gap-1 bg-white rounded-full px-1.5 py-1.5 shadow-[0_8px_30px_-16px_rgba(0,0,0,0.25)] border border-lafoi-dark/5">
            <Link to="/" className={`px-4 py-2 rounded-full text-sm font-sora transition-colors ${homeActive ? 'bg-lafoi-dark text-white' : 'text-lafoi-gray hover:text-lafoi-dark'}`}>
              Home
            </Link>
            {navGroups.map((group) => (
              <PillDropdown
                key={group.label}
                group={group}
                open={openGroup === group.label}
                onToggle={() => setOpenGroup((g) => (g === group.label ? null : group.label))}
                onClose={() => setOpenGroup(null)}
                pathname={path}
              />
            ))}
            <Link to="/shop" className={`px-4 py-2 rounded-full text-sm font-sora transition-colors ${shopActive ? 'bg-lafoi-dark text-white' : 'text-lafoi-gray hover:text-lafoi-dark'}`}>
              Shop
            </Link>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <Link to="/contact" className="inline-flex items-center gap-2 bg-lafoi-dark text-white rounded-full px-4 sm:px-5 py-2.5 text-sm font-sora font-medium hover:bg-lafoi-green transition-colors">
              <span className="hidden sm:inline">Get a quote</span><span className="sm:hidden">Quote</span>
              <ArrowRight size={14} weight="bold" />
            </Link>
            {/* Mobile / tablet menu toggle */}
            <button onClick={() => setMenuOpen(true)} aria-label="Open menu"
              className="lg:hidden w-11 h-11 rounded-full bg-white border border-lafoi-dark/5 shadow-[0_8px_30px_-16px_rgba(0,0,0,0.25)] flex items-center justify-center text-lafoi-dark">
              <List size={20} weight="regular" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu — light editorial sheet with the full navigation */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-lafoi-dark/30 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)} />
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3, ease: EASE }}
              className="fixed z-[70] top-3 inset-x-3 rounded-[24px] bg-lafoi-cream border border-lafoi-dark/5 shadow-2xl p-5 lg:hidden max-h-[92vh] flex flex-col">
              <div className="flex items-center justify-between shrink-0">
                <Logo tone="dark" variant="wordmark" imgClassName="h-8 w-auto" />
                <button onClick={() => setMenuOpen(false)} aria-label="Close menu"
                  className="w-10 h-10 rounded-full bg-white border border-lafoi-dark/5 flex items-center justify-center text-lafoi-dark">
                  <X size={20} weight="regular" />
                </button>
              </div>

              <nav className={`mt-3 flex flex-col overflow-y-auto ${noBar}`}>
                <Link to="/" onClick={() => setMenuOpen(false)}
                  className={`py-2.5 font-display font-light tracking-[-0.02em] text-[1.7rem] leading-tight border-b border-lafoi-dark/5 transition-colors ${homeActive ? 'text-lafoi-green' : 'text-lafoi-dark hover:text-lafoi-green'}`}>
                  Home
                </Link>

                {navGroups.map((group) => (
                  <div key={group.label} className="py-3 border-b border-lafoi-dark/5">
                    <p className="font-sora text-[10px] tracking-[0.25em] uppercase text-lafoi-gray/60 mb-1.5">{group.label}</p>
                    <div className="flex flex-col">
                      {group.items.map((item) => {
                        const act = path.startsWith(item.path) && item.path !== '/'
                        return (
                          <Link key={item.name} to={item.path} onClick={() => setMenuOpen(false)}
                            className={`py-1.5 font-general text-[1.05rem] transition-colors ${act ? 'text-lafoi-green' : 'text-lafoi-dark hover:text-lafoi-green'}`}>
                            {item.name}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}

                <Link to="/shop" onClick={() => setMenuOpen(false)}
                  className={`py-2.5 font-display font-light tracking-[-0.02em] text-[1.7rem] leading-tight transition-colors ${shopActive ? 'text-lafoi-green' : 'text-lafoi-dark hover:text-lafoi-green'}`}>
                  Shop
                </Link>
              </nav>

              <Link to="/contact" onClick={() => setMenuOpen(false)}
                className="mt-4 shrink-0 inline-flex w-full items-center justify-center gap-2 bg-lafoi-dark text-white rounded-full px-6 py-3.5 text-sm font-sora font-medium hover:bg-lafoi-green transition-colors">
                Get a quote <ArrowRight size={15} weight="bold" />
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Centered headline */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-5 sm:px-6 pt-6 sm:pt-8 pb-5">
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

/* Editorial-styled dropdown for the sticky pill nav. Click to open, click away
   (or follow a link) to close — mirrors the global navbar's dropdown behaviour. */
function PillDropdown({ group, open, onToggle, onClose, pathname }) {
  const ref = useRef(null)
  const activeGroup = group.items.some((it) => it.path !== '/' && pathname.startsWith(it.path))

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, onClose])

  return (
    <div className="relative" ref={ref}>
      <button onClick={onToggle} aria-expanded={open}
        className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-sora transition-colors ${activeGroup || open ? 'bg-lafoi-dark text-white' : 'text-lafoi-gray hover:text-lafoi-dark'}`}>
        {group.label}
        <CaretDown size={13} weight="bold" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50">
            <div className="w-64 bg-white rounded-2xl shadow-xl shadow-black/[0.08] border border-lafoi-dark/5 p-2">
              {group.items.map((item) => (
                <Link key={item.name} to={item.path} onClick={onClose}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-lafoi-green/5 transition-colors group">
                  <div className="w-9 h-9 rounded-full bg-lafoi-green/10 flex items-center justify-center shrink-0 group-hover:bg-lafoi-green/20 transition-colors">
                    <item.icon size={16} className="text-lafoi-green" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-lafoi-dark group-hover:text-lafoi-green transition-colors">{item.name}</p>
                    <p className="text-xs text-lafoi-gray mt-0.5">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
