import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import {
  ArrowUpRight,
  X,
  Sparkle,
  CaretLeft,
  CaretRight,
  MapPin,
} from '@phosphor-icons/react'
import AnimatedSection from '../components/ui/AnimatedSection'
import OptimizedImage from '../components/ui/OptimizedImage'
import HeroSlideshow from '../components/ui/HeroSlideshow'
import { useSEO } from '../utils/seo'

const PORTFOLIO_HERO_SLIDES = [
  {
    src: 'https://images.unsplash.com/photo-1758194090785-8e09b7288199?w=2200&q=85',
    alt: 'Luxurious lobby with backlit ceiling',
    vision: 'Editorial portfolio cover',
  },
  {
    src: 'https://images.unsplash.com/photo-1639663742190-1b3dba2eebcf?w=2200&q=85',
    alt: 'Luxury modern living room with premium ceiling',
    vision: 'Residential transformation',
  },
  {
    src: 'https://images.unsplash.com/photo-1730367019975-4ad8d9e14ef2?w=2200&q=85',
    alt: 'Indoor pool with stone walls and natural light',
    vision: 'Hospitality wellness',
  },
]

const categories = ['All', 'Residential', 'Commercial', 'Hospitality', 'Retail']

const projects = [
  {
    id: 1,
    title: 'Borrowdale Residence',
    category: 'Residential',
    location: 'Borrowdale',
    year: '2024',
    image: 'https://images.unsplash.com/photo-1638284457192-27d3d0ec51aa?w=1200&q=80',
    desc: 'Matte white stretch ceiling with perimeter LED cove lighting in a luxury home.',
    tall: true,
    vision: 'Elegant living room with premium ceiling design',
  },
  {
    id: 2,
    title: 'Meikles Hotel Ballroom',
    category: 'Hospitality',
    location: 'CBD, Harare',
    year: '2024',
    image: 'https://images.unsplash.com/photo-1758194090785-8e09b7288199?w=1200&q=80',
    desc: 'Translucent backlit ceiling spanning the entire ballroom with colour-changing LED.',
    vision: 'Luxurious lobby with backlit ceiling',
  },
  {
    id: 3,
    title: 'TechHub Office',
    category: 'Commercial',
    location: 'Belgravia',
    year: '2024',
    image: 'https://images.unsplash.com/photo-1595513279524-fa90ad188c98?w=1200&q=80',
    desc: 'Acoustic micro-perforated ceilings across an open-plan office.',
    vision: 'Open-plan office with acoustic ceiling',
  },
  {
    id: 4,
    title: 'Garden City Mall',
    category: 'Retail',
    location: 'Harare',
    year: '2024',
    image: 'https://images.unsplash.com/photo-1634146601607-9f319f71b5ee?w=1200&q=80',
    desc: '3D wave-form ceilings creating dynamic visual flow through the retail space.',
    tall: true,
    vision: 'Building with dramatic architectural ceiling',
  },
  {
    id: 5,
    title: 'Avondale Villa',
    category: 'Residential',
    location: 'Avondale',
    year: '2024',
    image: 'https://images.unsplash.com/photo-1765434670017-c0d28ecde29a?w=1200&q=80',
    desc: 'Fibre-optic starry sky ceiling in a master bedroom suite.',
    vision: 'Modern bedroom with ambient lighting',
  },
  {
    id: 6,
    title: 'The Ivy Restaurant',
    category: 'Hospitality',
    location: 'Avondale',
    year: '2025',
    image: 'https://images.unsplash.com/photo-1618259715220-a89a4e4da76b?w=1200&q=80',
    desc: 'Printed cloud ceiling with ambient warm lighting for a fine-dining atmosphere.',
    vision: 'Country hotel interior with elegant design',
  },
  {
    id: 7,
    title: 'Pearl Spa & Wellness',
    category: 'Hospitality',
    location: 'Harare',
    year: '2025',
    image: 'https://images.unsplash.com/photo-1730367019975-4ad8d9e14ef2?w=1200&q=80',
    desc: 'Printed blue sky ceiling over the pool area with moisture-proof stretch membrane.',
    tall: true,
    vision: 'Indoor pool with natural light from above',
  },
  {
    id: 8,
    title: "Sam Levy's Village",
    category: 'Retail',
    location: 'Borrowdale',
    year: '2025',
    image: 'https://images.unsplash.com/photo-1768270181430-3e3672a32283?w=1200&q=80',
    desc: 'Glossy stretch ceiling with integrated spotlighting for a modern retail showroom.',
    vision: 'Modern lobby with marble floors and decorative ceiling',
  },
  {
    id: 9,
    title: 'Highlands Home',
    category: 'Residential',
    location: 'Highlands',
    year: '2025',
    image: 'https://images.unsplash.com/photo-1639663742190-1b3dba2eebcf?w=1200&q=80',
    desc: 'Full home installation — living room, bedrooms, and bathroom stretch ceilings.',
    vision: 'Luxury modern living room with premium ceiling',
  },
]

export default function Portfolio() {
  const [filter, setFilter] = useState('All')
  const [selectedIndex, setSelectedIndex] = useState(null)

  const filtered = filter === 'All' ? projects : projects.filter((p) => p.category === filter)

  useSEO({
    title: 'Our Portfolio',
    description:
      "Explore La Foi Designs' portfolio of stunning stretch ceiling and lighting installations across Zimbabwe.",
    path: '/portfolio',
  })

  // keyboard nav for lightbox
  useEffect(() => {
    if (selectedIndex === null) return
    const handleKey = (e) => {
      if (e.key === 'Escape') setSelectedIndex(null)
      if (e.key === 'ArrowRight') setSelectedIndex((i) => (i + 1) % filtered.length)
      if (e.key === 'ArrowLeft')
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selectedIndex, filtered.length])

  const selected = selectedIndex !== null ? filtered[selectedIndex] : null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <PortfolioHero />

      {/* Filter & Gallery */}
      <section className="relative py-20 lg:py-28 bg-lafoi-cream overflow-hidden">
        <div className="absolute inset-0 mesh-gradient-1 pointer-events-none" />
        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          {/* header */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12 lg:mb-16">
            <div className="max-w-2xl">
              <AnimatedSection>
                <div className="flex items-center gap-3 mb-5">
                  <span className="block w-10 h-px bg-lafoi-green/60" />
                  <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                    The gallery
                  </p>
                  <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray/50">
                    {filtered.length} {filtered.length === 1 ? 'frame' : 'frames'}
                  </span>
                </div>
              </AnimatedSection>
              <AnimatedSection delay={0.1}>
                <h2 className="font-display font-light text-lafoi-dark text-3xl sm:text-4xl lg:text-5xl leading-[1.1] tracking-[-0.02em]">
                  Filter by{' '}
                  <span className="text-lafoi-green">category</span>.
                </h2>
              </AnimatedSection>
            </div>
          </div>

          {/* Glass filter bar */}
          <div className="relative mb-12 lg:mb-16 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 py-4 lg:py-5 bg-white/70 backdrop-blur-xl border-y border-white/40 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)]">
            <div aria-hidden className="absolute inset-0 pattern-blueprint opacity-25 pointer-events-none" />
            <div className="relative flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="hidden sm:inline-flex items-center gap-2 font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray-medium pr-3 mr-2 border-r border-lafoi-dark/15">
                Filter
              </span>
              {categories.map((cat) => {
                const active = filter === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-sora font-medium transition-all duration-300 ${
                      active
                        ? 'bg-lafoi-dark text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)]'
                        : 'bg-white/60 text-lafoi-gray hover:bg-lafoi-green/10 hover:text-lafoi-green border border-lafoi-dark/10'
                    }`}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Masonry */}
          <motion.div layout className="columns-1 sm:columns-2 lg:columns-3 gap-5 lg:gap-6 space-y-5 lg:space-y-6">
            <AnimatePresence mode="popLayout">
              {filtered.map((project, i) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="break-inside-avoid"
                >
                  <button
                    onClick={() => setSelectedIndex(i)}
                    className="group relative block w-full rounded-3xl overflow-hidden text-left bg-lafoi-dark"
                  >
                    {/* hairline reveal — top */}
                    <span
                      aria-hidden
                      className="absolute top-0 left-0 right-0 h-px bg-lafoi-green-light origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] z-20"
                    />
                    <div className={project.tall ? 'h-[480px]' : 'h-[340px]'}>
                      <OptimizedImage
                        src={project.image}
                        alt={project.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                        fill
                        vision={project.vision}
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/85 via-lafoi-dark/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* index — top */}
                    <div className="absolute top-5 left-5 right-5 flex items-start justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-white/70 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
                        0{i + 1} / 0{filtered.length}
                      </span>
                      <span className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center">
                        <ArrowUpRight size={14} weight="regular" className="text-white" />
                      </span>
                    </div>

                    {/* details — bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-7 translate-y-3 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                      <span className="block w-8 h-px bg-lafoi-green-light/70 mb-3" />
                      <p className="text-[10px] font-sora text-lafoi-green-light tracking-[0.28em] uppercase mb-2">
                        {project.category}
                      </p>
                      <h3 className="font-display font-light text-white text-2xl lg:text-3xl leading-tight mb-3">
                        {project.title}
                      </h3>
                      <div className="flex items-center gap-3 text-[11px] font-sora text-white/60 tracking-wide">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={11} weight="regular" />
                          {project.location}
                        </span>
                        <span className="text-white/30">&middot;</span>
                        <span>{project.year}</span>
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 lg:p-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-lafoi-dark/85 backdrop-blur-md"
              onClick={() => setSelectedIndex(null)}
            />

            <motion.div
              className="relative w-full max-w-5xl rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-2xl rounded-bl-2xl overflow-hidden border border-lafoi-green-light/20 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)]"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="grid lg:grid-cols-12 bg-white">
                {/* Image */}
                <div className="lg:col-span-7 relative h-72 sm:h-96 lg:h-[560px] bg-lafoi-dark">
                  <OptimizedImage
                    src={selected.image}
                    alt={selected.title}
                    className="w-full h-full object-cover object-center"
                    fill
                    priority
                    vision={selected.vision}
                  />
                  <span className="absolute top-5 left-5 font-sora text-[10px] tracking-[0.3em] uppercase text-white/85 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                    0{selectedIndex + 1} / 0{filtered.length}
                  </span>
                </div>

                {/* Body */}
                <div className="lg:col-span-5 p-7 lg:p-10 flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="block w-8 h-px bg-lafoi-green/60" />
                    <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                      {selected.category}
                    </p>
                  </div>

                  <h3 className="font-display font-light text-lafoi-dark text-3xl lg:text-4xl leading-[1.1] tracking-[-0.01em] mb-5">
                    {selected.title}
                  </h3>

                  <p className="font-body font-light text-sm lg:text-base text-lafoi-gray leading-relaxed mb-8">
                    {selected.desc}
                  </p>

                  <div className="space-y-0 border-t border-lafoi-dark/10 mt-auto">
                    <div className="flex items-baseline justify-between gap-3 py-3 border-b border-lafoi-dark/10">
                      <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">
                        Location
                      </span>
                      <span className="font-body text-sm text-lafoi-dark">{selected.location}</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 py-3 border-b border-lafoi-dark/10">
                      <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">
                        Year
                      </span>
                      <span className="font-body text-sm text-lafoi-dark">{selected.year}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <button
                onClick={() => setSelectedIndex(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-lafoi-dark/70 backdrop-blur-md flex items-center justify-center text-white hover:bg-lafoi-dark transition-colors"
                aria-label="Close"
              >
                <X size={16} weight="bold" />
              </button>
              <button
                onClick={() =>
                  setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length)
                }
                className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-lafoi-dark/70 backdrop-blur-md items-center justify-center text-white hover:bg-lafoi-dark transition-colors"
                aria-label="Previous"
              >
                <CaretLeft size={18} weight="bold" />
              </button>
              <button
                onClick={() => setSelectedIndex((i) => (i + 1) % filtered.length)}
                className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-lafoi-dark/70 backdrop-blur-md items-center justify-center text-white hover:bg-lafoi-dark transition-colors"
                aria-label="Next"
              >
                <CaretRight size={18} weight="bold" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ============================================================================
   HERO
   ============================================================================ */

function PortfolioHero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <section
      ref={ref}
      className="relative h-[100svh] min-h-[640px] flex flex-col overflow-hidden bg-lafoi-dark"
    >
      <HeroSlideshow slides={PORTFOLIO_HERO_SLIDES} interval={6500} parallax overlay={false} />
      <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/90 via-lafoi-dark/40 to-lafoi-dark/55 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-lafoi-dark/55 via-transparent to-lafoi-dark/20 pointer-events-none" />

      {/* Volume artifact */}
      <div className="absolute top-28 right-6 lg:top-32 lg:right-10 z-10 pointer-events-none flex items-center gap-3">
        <span className="hidden sm:block w-8 h-px bg-white/30" />
        <span className="font-sora text-[10px] tracking-[0.28em] uppercase text-white/65">
          Vol.&nbsp;04 &mdash; 2026 &middot; The Gallery
        </span>
      </div>

      <motion.div
        className="relative z-10 flex-1 flex flex-col max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 w-full"
        style={{ opacity }}
      >
        <motion.div
          className="pt-28 lg:pt-32"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/8 backdrop-blur-md border border-white/15">
            <Sparkle size={12} weight="fill" className="text-lafoi-green-light" />
            <span className="text-[10px] sm:text-[11px] font-sora text-white/85 font-medium tracking-[0.22em] uppercase">
              {projects.length} frames &middot; Across Zimbabwe
            </span>
          </span>
        </motion.div>

        <div className="mt-auto pb-10 lg:pb-16 grid lg:grid-cols-12 gap-8 items-end">
          <motion.div
            className="lg:col-span-9"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1
              className="font-display text-white tracking-[-0.035em] leading-[0.98] text-[3rem] sm:text-[4.5rem] lg:text-[6.4rem] xl:text-[7rem]"
              style={{ fontVariationSettings: '"opsz" 144' }}
            >
              <span className="block font-light text-white/95">Spaces, in</span>
              <span className="block">
                <span className="font-normal text-lafoi-green-light">fragments</span>
                <span className="text-lafoi-green-light">.</span>
              </span>
            </h1>

            <motion.p
              className="mt-6 lg:mt-8 max-w-xl text-sm sm:text-base lg:text-[17px] text-white/70 font-body font-light leading-[1.55]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              Every project tells a story of transformation. A curated collection of frames from
              residential, commercial, hospitality and retail installations across Zimbabwe.
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.1 }}
      >
        <span className="text-[9px] font-sora tracking-[0.35em] uppercase text-white/45">Scroll</span>
        <span className="block w-px h-8 bg-gradient-to-b from-white/45 to-transparent" />
      </motion.div>
    </section>
  )
}
