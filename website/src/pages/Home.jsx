import React, { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  CalendarRange,
  Ruler,
} from 'lucide-react'
import AnimatedSection from '../components/ui/AnimatedSection'
import OptimizedImage from '../components/ui/OptimizedImage'
import { useSEO } from '../utils/seo'
import { products, projects } from '../data/site'

/* ============================================================================
   HOME — La Foi Designs
   Editorial · Cinematic · Restrained
   ============================================================================
   The site sells light shaped by surface. The homepage is therefore organised
   as a sequence of luminous moments rather than a feature checklist.
   Sections:
     1. Hero            — asymmetric editorial with finish-strip surprise
     2. Manifesto band  — dark pull-quote + credentials chip row
     3. Finish gallery  — horizontal scroll-snap (the signature gesture)
     4. Approach        — sticky-scroll image crossfade with three stages
     5. Stats           — IO-triggered count-up on dark plate
     6. Projects bento  — asymmetric featured projects grid
     7. Testimonial     — single editorial pull-quote, marquee chips
     8. Partners        — two-column European engineering note
     9. CTA             — cinematic full-bleed, soft overlay
   ============================================================================ */

export default function Home() {
  useSEO({
    title: null,
    description:
      "Zimbabwe's first stretch ceiling and architectural lighting studio. German and Estonian engineered membranes paired with bespoke LED design. Founded 2024, Belgravia, Harare.",
    path: '/',
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Hero />
      <Manifesto />
      <FinishGallery />
      <Approach />
      <Stats />
      <ProjectsBento />
      <Testimonial />
      <Partners />
      <CinematicCTA />
    </motion.div>
  )
}

/* ============================================================================
   1. HERO
   Asymmetric editorial. Headline left, metadata card lower-right, finish
   thumbnail strip floats at the bottom of the viewport — a tiny moodboard
   that signals what the studio actually does.
   ============================================================================ */

function Hero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [0, 180])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08])
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  const finishStrip = [
    { name: 'Matte', meta: 'soft · diffused', img: 'https://images.unsplash.com/photo-1638284457192-27d3d0ec51aa?w=600&q=80', slug: 'matte-stretch-membrane' },
    { name: 'Satin', meta: 'pearl · 18% gloss', img: 'https://images.unsplash.com/photo-1768270181430-3e3672a32283?w=600&q=80', slug: 'satin-stretch-membrane' },
    { name: 'Gloss', meta: 'liquid · mirrored', img: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&q=80', slug: 'gloss-lacquer-membrane' },
    { name: 'Translucent', meta: 'backlit · 75%', img: 'https://images.unsplash.com/photo-1758194090785-8e09b7288199?w=600&q=80', slug: 'translucent-backlit-membrane' },
    { name: 'Printed', meta: 'photographic · 1440 dpi', img: 'https://images.unsplash.com/photo-1618259715220-a89a4e4da76b?w=600&q=80', slug: 'printed-photographic-membrane' },
    { name: 'Sculptural', meta: '3D · subframe', img: 'https://images.unsplash.com/photo-1634146601607-9f319f71b5ee?w=600&q=80', slug: '3d-sculptural-membrane' },
  ]

  return (
    <section ref={ref} className="relative min-h-[100svh] overflow-hidden bg-lafoi-dark">
      {/* parallax background */}
      <motion.div className="absolute inset-0" style={{ y, scale }}>
        <OptimizedImage
          src="https://images.unsplash.com/photo-1758194090785-8e09b7288199?w=2000&q=85"
          alt="Luminous translucent stretch ceiling glowing across a hotel ballroom"
          className="w-full h-full object-cover object-center"
          fill
          priority
          vision="Luminous translucent stretch ceiling glowing across a hotel ballroom — single plane of light"
        />
      </motion.div>

      {/* layered overlays — gradient instead of flat dim, preserves the image */}
      <motion.div className="absolute inset-0" style={{ opacity: overlayOpacity }}>
        <div className="absolute inset-0 bg-gradient-to-r from-lafoi-dark/85 via-lafoi-dark/55 to-lafoi-dark/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/80 via-transparent to-lafoi-dark/40" />
      </motion.div>

      {/* CONTENT — asymmetric editorial layout */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 min-h-[100svh] flex flex-col justify-between pt-32 pb-10 lg:pb-14">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 flex-1 items-center">
          {/* Left — headline */}
          <motion.div
            className="lg:col-span-8"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lafoi-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-lafoi-green-light" />
              </span>
              <span className="text-[11px] font-sora text-white/85 font-medium tracking-[0.2em] uppercase">
                Zimbabwe's first stretch ceiling studio
              </span>
            </motion.div>

            <h1 className="heading-xl text-white text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-[5.6rem] xl:text-[6.4rem]">
              <span className="block">Light,</span>
              <span className="block">
                <span className="font-cabinet italic font-light text-white/95">shaped</span>
                <span className="text-white"> by</span>
              </span>
              <span className="block">
                <span className="font-cabinet italic font-light text-white/95">surface</span>
                <span className="text-lafoi-green-light">.</span>
              </span>
            </h1>

            <motion.p
              className="mt-8 lg:mt-10 max-w-xl text-base sm:text-lg text-white/65 font-general leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              German-engineered stretch membranes and Estonian printed ceilings, paired with
              bespoke LED architecture. We design overhead — the surface most often forgotten,
              and the one with the most to give.
            </motion.p>

            <motion.div
              className="mt-10 lg:mt-12 flex flex-wrap items-center gap-x-6 gap-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              <Link
                to="/contact"
                className="group inline-flex items-center gap-3 px-7 py-4 bg-white text-lafoi-dark rounded-full font-sora text-sm font-semibold hover:bg-lafoi-green-light hover:text-white transition-all duration-500 shadow-[0_8px_30px_rgba(255,255,255,0.12)]"
              >
                Start your project
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link
                to="/projects"
                className="group inline-flex items-center gap-2 text-white/80 hover:text-white font-sora text-sm font-medium pb-1 border-b border-white/30 hover:border-lafoi-green-light transition-colors"
              >
                Explore our work
                <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Right — metadata card */}
          <motion.aside
            className="lg:col-span-4 lg:pt-32 hidden lg:block"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 1 }}
          >
            <div className="ml-auto max-w-[260px] border-l border-white/15 pl-6 py-4">
              <p className="font-sora text-[10px] font-semibold tracking-[0.25em] uppercase text-lafoi-green-light mb-4">
                Studio · Est. 2024
              </p>
              <div className="space-y-3 text-white/70 font-general text-sm">
                <p>Belgravia, Harare</p>
                <p>German + Estonian engineered</p>
                <p>15-year manufacturer warranty</p>
                <p>Class A1 fire performance</p>
              </div>
            </div>
          </motion.aside>
        </div>

        {/* finish strip — the signature surprise */}
        <motion.div
          className="mt-12 lg:mt-0"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 1 }}
          style={{ opacity: overlayOpacity }}
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[10px] font-sora text-white/40 tracking-[0.3em] uppercase">
              Six finishes · eighteen products
            </p>
            <p className="text-[10px] font-sora text-white/40 tracking-[0.3em] uppercase hidden sm:block">
              Scroll →
            </p>
          </div>
          <div
            className="flex gap-3 overflow-x-auto pb-1 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 snap-x snap-mandatory scrollbar-thin"
            style={{ scrollbarWidth: 'thin' }}
          >
            {finishStrip.map((f) => (
              <Link
                key={f.slug}
                to={`/products/${f.slug}`}
                className="group relative flex-shrink-0 w-[140px] sm:w-[160px] aspect-[3/4] rounded-2xl overflow-hidden snap-start border border-white/10 hover:border-lafoi-green-light/50 transition-colors duration-500"
              >
                <OptimizedImage
                  src={f.img}
                  alt={`${f.name} stretch ceiling finish`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                  fill
                  vision={`${f.name} stretch ceiling finish — ${f.meta}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/90 via-lafoi-dark/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="font-cabinet italic text-xl text-white leading-none">{f.name}</p>
                  <p className="text-[9px] font-sora text-white/55 tracking-[0.15em] uppercase mt-1.5">
                    {f.meta}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ============================================================================
   2. MANIFESTO BAND
   ============================================================================
   Dark plate, single editorial sentence with italic emphasis. Below it,
   a thin row of credential chips — proof without bombast.
   ============================================================================ */

function Manifesto() {
  return (
    <section className="relative py-24 lg:py-36 bg-lafoi-dark overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-40" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full mesh-gradient-hero" />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="max-w-5xl">
          <AnimatedSection>
            <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green-light mb-8">
              — Studio manifesto
            </p>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h2 className="heading-lg text-white text-3xl sm:text-4xl lg:text-[3.4rem] leading-[1.15] tracking-[-0.02em]">
              We believe a ceiling is the{' '}
              <span className="font-cabinet italic font-light text-lafoi-green-light">sixth surface</span>
              <span className="text-white"> — </span>
              the one most often forgotten, and the one
              <span className="font-cabinet italic font-light text-white/85"> with the most to give.</span>
            </h2>
          </AnimatedSection>
        </div>

        <AnimatedSection delay={0.25} className="mt-16 lg:mt-20">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-8 border-t border-white/10">
            {[
              'German engineered',
              'Estonian printed',
              '220 colour matches',
              '15-year warranty',
              'Class A1 fire-rated',
            ].map((chip, i) => (
              <div key={chip} className="flex items-center gap-3">
                {i > 0 && <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-white/20" />}
                <span className="font-sora text-xs lg:text-sm text-white/55 tracking-wide">
                  {chip}
                </span>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ============================================================================
   3. FINISH GALLERY
   ============================================================================
   Eight finishes pulled from products[]. Horizontal scroll-snap on every
   breakpoint — the gesture itself is the surprise. Tall 3/4 cards with
   italic finish names and a subtle hover reveal.
   ============================================================================ */

function FinishGallery() {
  const stretchProducts = products.filter((p) => p.category === 'Stretch Ceilings').slice(0, 8)

  // small hand-tuned meta lines per finish — characterful copy, not auto-derived
  const finishMeta = {
    Matte: 'plaster-like · zero glare',
    Satin: 'pearl sheen · 18% gloss',
    Gloss: 'liquid mirror · 95% gloss',
    Translucent: 'glowing plane · 75% transmission',
    Printed: 'photographic · 1440 dpi',
    Sculptural: '3D form · hidden subframe',
    Acoustic: 'invisible silence · NRC 0.90',
    Mirror: 'specular field · 98% reflection',
    Suede: 'tactile · acoustic warmth',
  }

  return (
    <section className="relative py-24 lg:py-36 bg-lafoi-cream overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14 lg:mb-20">
          <div className="max-w-2xl">
            <AnimatedSection>
              <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green mb-5">
                — The membrane library
              </p>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <h2 className="heading-xl text-lafoi-dark text-4xl sm:text-5xl lg:text-6xl">
                Eight finishes.
                <br />
                <span className="font-cabinet italic font-light text-lafoi-green">
                  One ceiling that listens.
                </span>
              </h2>
            </AnimatedSection>
          </div>
          <AnimatedSection delay={0.2}>
            <p className="text-lafoi-gray font-general max-w-sm leading-relaxed">
              Every finish answers a different brief — calm or theatrical, silent or sculptural.
              We help you choose the one your space is asking for.
            </p>
          </AnimatedSection>
        </div>

        <AnimatedSection delay={0.15}>
          <div
            className="flex gap-5 lg:gap-6 overflow-x-auto pb-6 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'thin' }}
          >
            {stretchProducts.map((p, i) => (
              <Link
                key={p.slug}
                to={`/products/${p.slug}`}
                className="group relative flex-shrink-0 w-[260px] sm:w-[300px] lg:w-[340px] aspect-[3/4] rounded-3xl overflow-hidden snap-start bg-lafoi-dark"
              >
                <OptimizedImage
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                  fill
                  vision={p.vision}
                />
                {/* dual gradient — bottom for legibility, top corner for index */}
                <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark via-lafoi-dark/30 to-transparent opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-br from-lafoi-dark/40 via-transparent to-transparent opacity-80" />

                {/* index numeral — top corner */}
                <div className="absolute top-5 left-5 right-5 flex items-start justify-between">
                  <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-white/55">
                    0{i + 1} / 0{stretchProducts.length}
                  </span>
                  <span className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:border-lafoi-green-light group-hover:bg-lafoi-green-light/10 transition-all duration-500">
                    <ArrowUpRight
                      size={14}
                      className="text-white/70 group-hover:text-lafoi-green-light group-hover:rotate-45 transition-all duration-500"
                    />
                  </span>
                </div>

                {/* finish name + meta */}
                <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-7">
                  <p className="text-[10px] font-sora text-lafoi-green-light tracking-[0.25em] uppercase mb-2 opacity-80">
                    {p.finish}
                  </p>
                  <h3 className="font-cabinet italic font-light text-3xl lg:text-4xl text-white leading-none">
                    {p.finish}
                  </h3>
                  <p className="text-xs font-sora text-white/55 tracking-wide mt-3">
                    {finishMeta[p.finish] || p.shortDesc}
                  </p>
                  {/* sub-line that slides in on hover */}
                  <p className="mt-4 text-xs font-general text-white/0 group-hover:text-white/75 max-h-0 group-hover:max-h-20 overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
                    {p.shortDesc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.2} className="mt-12 flex justify-center">
          <Link
            to="/products"
            className="group inline-flex items-center gap-3 text-lafoi-dark font-sora text-sm font-medium pb-1 border-b border-lafoi-dark/30 hover:border-lafoi-green hover:text-lafoi-green transition-colors duration-300"
          >
            <span className="font-cabinet italic font-light text-base">Explore the full library</span>
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform duration-300"
            />
          </Link>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ============================================================================
   4. APPROACH — sticky-scroll image crossfade
   ============================================================================
   Three stages of how we work. On the left a sticky image that crossfades
   through three scenes as the user scrolls past three pinned text blocks
   on the right. On mobile, degrades to stacked cards.
   ============================================================================ */

function Approach() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  // active step is derived from scroll progress within the container
  // [0..0.33] = 0, [0.33..0.66] = 1, [0.66..1] = 2
  const [activeStep, setActiveStep] = useState(0)
  useEffect(() => {
    const unsub = scrollYProgress.on('change', (v) => {
      // bias toward middle, since scroll enters from bottom and leaves from top
      const adjusted = Math.max(0, Math.min(1, (v - 0.15) / 0.55))
      const next = adjusted < 0.34 ? 0 : adjusted < 0.67 ? 1 : 2
      setActiveStep(next)
    })
    return unsub
  }, [scrollYProgress])

  const stages = [
    {
      num: '01',
      title: 'Listen',
      copy: 'A site visit, a measured drawing, a long conversation. We learn the room before we suggest a ceiling. Most of our work is here.',
      image: 'https://images.unsplash.com/photo-1638284457192-27d3d0ec51aa?w=1400&q=85',
      vision: 'Calm contemporary living room — site we begin with',
    },
    {
      num: '02',
      title: 'Design',
      copy: 'Membrane, lighting layout, control logic, edge details. We model every project in 3D before fabrication, and we sample the finish in your light, not ours.',
      image: 'https://images.unsplash.com/photo-1758194090785-8e09b7288199?w=1400&q=85',
      vision: 'Ballroom ceiling design rendering — translucent membrane plan',
    },
    {
      num: '03',
      title: 'Install',
      copy: 'A trained two-person crew, a single working day per room, no demolition. The membrane goes up, the lighting comes alive, and the room is yours by sundown.',
      image: 'https://images.unsplash.com/photo-1634146601607-9f319f71b5ee?w=1400&q=85',
      vision: 'Sculptural ceiling fully installed and lit at handover',
    },
  ]

  return (
    <section ref={containerRef} className="relative bg-lafoi-cream py-24 lg:py-36 overflow-hidden">
      <div className="absolute inset-0 mesh-gradient-1 opacity-70" />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* heading */}
        <div className="max-w-3xl mb-16 lg:mb-24">
          <AnimatedSection>
            <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green mb-5">
              — How we work
            </p>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h2 className="heading-xl text-lafoi-dark text-4xl sm:text-5xl lg:text-[4rem] leading-[1.05]">
              Three stages.
              <br />
              <span className="font-cabinet italic font-light text-lafoi-green">No surprises.</span>
            </h2>
          </AnimatedSection>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
          {/* sticky image column */}
          <div className="lg:col-span-6 hidden lg:block">
            <div className="sticky top-24">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-lafoi-dark">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={activeStep}
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <OptimizedImage
                      src={stages[activeStep].image}
                      alt={stages[activeStep].title}
                      className="w-full h-full object-cover"
                      fill
                      vision={stages[activeStep].vision}
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-lafoi-dark/40 via-transparent to-transparent" />
                  </motion.div>
                </AnimatePresence>

                {/* stage indicator dots */}
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {stages.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1 rounded-full transition-all duration-700 ${
                          i === activeStep ? 'w-12 bg-white' : 'w-6 bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="font-cabinet italic text-white text-2xl">
                    {stages[activeStep].title}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* scroll-pinned text blocks */}
          <div className="lg:col-span-6 flex flex-col gap-16 lg:gap-44">
            {stages.map((stage, i) => (
              <ScrollStage key={stage.num} stage={stage} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ScrollStage({ stage, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.35 })

  return (
    <motion.div
      ref={ref}
      className="relative"
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
    >
      {/* mobile-only inline image */}
      <div className="lg:hidden mb-6 rounded-2xl overflow-hidden aspect-[4/3]">
        <OptimizedImage
          src={stage.image}
          alt={stage.title}
          className="w-full h-full object-cover"
          fill
          vision={stage.vision}
        />
      </div>

      <div className="flex items-baseline gap-6 mb-5">
        <span className="font-cabinet italic font-light text-7xl lg:text-8xl text-lafoi-green/15 leading-none">
          {stage.num}
        </span>
        <span className="h-px flex-1 bg-lafoi-dark/15" />
      </div>

      <h3 className="font-cabinet italic font-light text-4xl lg:text-5xl text-lafoi-dark mb-5">
        {stage.title}
      </h3>
      <p className="text-base lg:text-lg text-lafoi-gray font-general leading-relaxed max-w-md">
        {stage.copy}
      </p>
    </motion.div>
  )
}

/* ============================================================================
   5. STATS — IO-triggered count-up
   ============================================================================
   Four numbers, big italic Cabinet, dark plate. Numbers count up once when
   the section enters view.
   ============================================================================ */

function CountUp({ to, duration = 1800, suffix = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!inView) return
    let raf
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      setN(Math.round(eased * to))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, duration])

  return (
    <span ref={ref}>
      {n.toLocaleString()}
      {suffix}
    </span>
  )
}

function Stats() {
  const stats = [
    { value: 5800, suffix: 'm²', label: 'Area engineered overhead' },
    { value: 9, suffix: '', label: 'Documented case studies' },
    { value: 220, suffix: '+', label: 'Membrane colour matches' },
    { value: 40, suffix: '+', label: 'Years of European partner heritage' },
  ]

  return (
    <section className="relative bg-lafoi-dark py-24 lg:py-36 overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-30" />
      {/* soft luminous wash, NOT a blob */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(ellipse at 20% 0%, rgba(34,197,94,0.08), transparent 50%), radial-gradient(ellipse at 100% 100%, rgba(26,138,46,0.06), transparent 50%)',
        }}
      />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="max-w-3xl mb-16 lg:mb-20">
          <AnimatedSection>
            <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green-light mb-5">
              — By the numbers
            </p>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h2 className="heading-xl text-white text-4xl sm:text-5xl lg:text-[3.6rem] leading-[1.1]">
              Quietly,{' '}
              <span className="font-cabinet italic font-light text-lafoi-green-light">
                consistently,
              </span>
              <br />
              we keep raising ceilings.
            </h2>
          </AnimatedSection>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-12 lg:gap-y-16 gap-x-6 lg:gap-x-12 border-t border-white/10 pt-12 lg:pt-16">
          {stats.map((s, i) => (
            <AnimatedSection key={s.label} delay={i * 0.08}>
              <div className="flex flex-col">
                <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-white/40 mb-4">
                  0{i + 1}
                </span>
                <p className="font-cabinet italic font-light text-white text-6xl lg:text-7xl xl:text-[6rem] leading-none tracking-[-0.03em]">
                  <CountUp to={s.value} suffix={s.suffix} />
                </p>
                <p className="mt-5 text-xs lg:text-sm text-white/55 font-sora tracking-wide max-w-[200px] leading-relaxed">
                  {s.label}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================================================================
   6. PROJECTS BENTO
   ============================================================================
   Pulled from projects[] where featured === true. One large hero card on the
   left (col-span 7, row-span 2), then three stacked cards on the right.
   Hover reveals year / location / area.
   ============================================================================ */

function ProjectsBento() {
  const featured = projects.filter((p) => p.featured).slice(0, 4)
  const [hero, ...rest] = featured

  return (
    <section className="relative bg-lafoi-cream py-24 lg:py-36 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14 lg:mb-20">
          <div className="max-w-2xl">
            <AnimatedSection>
              <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green mb-5">
                — Selected work
              </p>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <h2 className="heading-xl text-lafoi-dark text-4xl sm:text-5xl lg:text-6xl">
                Rooms where the
                <br />
                <span className="font-cabinet italic font-light text-lafoi-green">
                  ceiling does the talking.
                </span>
              </h2>
            </AnimatedSection>
          </div>
          <AnimatedSection delay={0.2}>
            <Link
              to="/projects"
              className="group inline-flex items-center gap-3 text-lafoi-dark font-sora text-sm font-medium hover:text-lafoi-green transition-colors duration-300"
            >
              <span className="font-cabinet italic font-light text-base">All case studies</span>
              <span className="w-10 h-10 rounded-full border border-lafoi-dark/20 group-hover:border-lafoi-green group-hover:bg-lafoi-green flex items-center justify-center transition-all duration-300">
                <ArrowRight
                  size={14}
                  className="group-hover:text-white group-hover:translate-x-0.5 transition-all duration-300"
                />
              </span>
            </Link>
          </AnimatedSection>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 auto-rows-[280px] lg:auto-rows-[220px]">
          {/* HERO project — large left, spans 2 rows */}
          <AnimatedSection direction="up" className="lg:col-span-7 lg:row-span-2 h-full">
            <BentoProject project={hero} large />
          </AnimatedSection>

          {/* three small projects, stacked */}
          {rest.map((p, i) => (
            <AnimatedSection
              key={p.slug}
              direction="up"
              delay={0.05 + i * 0.05}
              className={`lg:col-span-5 h-full ${i === 2 ? 'lg:col-span-5 lg:row-span-1' : ''}`}
            >
              <BentoProject project={p} />
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={0.2} className="mt-14 flex justify-center">
          <Link
            to="/projects"
            className="font-cabinet italic font-light text-2xl lg:text-3xl text-lafoi-dark hover:text-lafoi-green transition-colors duration-300 link-underline"
          >
            More transformations →
          </Link>
        </AnimatedSection>
      </div>
    </section>
  )
}

function BentoProject({ project, large = false }) {
  return (
    <Link
      to={`/projects/${project.slug}`}
      className="group relative block w-full h-full rounded-3xl overflow-hidden bg-lafoi-dark"
    >
      <OptimizedImage
        src={project.hero}
        alt={project.title}
        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        fill
        vision={project.vision}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark via-lafoi-dark/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-br from-lafoi-dark/30 via-transparent to-transparent opacity-60" />

      {/* category eyebrow */}
      <div className="absolute top-5 left-5 lg:top-6 lg:left-6">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-sora text-white/85 tracking-[0.2em] uppercase">
          {project.category}
        </span>
      </div>

      {/* title block */}
      <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-7">
        <h3
          className={`font-cabinet italic font-light text-white leading-[1.05] ${
            large ? 'text-3xl sm:text-4xl lg:text-5xl' : 'text-2xl lg:text-3xl'
          }`}
        >
          {project.title}
        </h3>

        {/* metadata row — visible compact, expands on hover */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-[11px] font-sora text-white/65 tracking-wide">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={11} />
            {project.location}
          </span>
          <span className="text-white/30">·</span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarRange size={11} />
            {project.year}
          </span>
          <span className="text-white/30">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Ruler size={11} />
            {project.area}
          </span>
        </div>

        {/* CTA — slides in on hover */}
        <div className="mt-4 flex items-center gap-2 text-lafoi-green-light font-sora text-xs font-semibold tracking-wider uppercase opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
          <span>View case study</span>
          <ArrowUpRight size={13} />
        </div>
      </div>
    </Link>
  )
}

/* ============================================================================
   7. TESTIMONIAL — single editorial pull-quote
   ============================================================================ */

function Testimonial() {
  // pull from real project testimonial
  const featured = projects.find((p) => p.testimonial)
  const t = featured?.testimonial || {
    quote: 'The first house where I do not notice the ceiling — which is exactly what I asked for.',
    author: 'Homeowner',
    role: 'Borrowdale, Harare',
  }

  // a row of small client chips for the marquee
  const clients = [
    'Meikles Hotel',
    'Pearl Spa & Wellness',
    'TechHub Africa',
    'Garden City Mall',
    'The Ivy Restaurant',
    'Sam Levy\'s Village',
  ]

  return (
    <section className="relative bg-lafoi-cream py-28 lg:py-44 overflow-hidden">
      {/* a single, very subtle accent column */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-lafoi-green/10 -translate-x-1/2" />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="max-w-5xl mx-auto text-center">
          <AnimatedSection>
            <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green mb-10">
              — Heard from a client
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            {/* opening quote glyph — purely decorative */}
            <span
              aria-hidden
              className="block font-cabinet italic font-light text-lafoi-green/15 text-[10rem] lg:text-[14rem] leading-none -mb-8 lg:-mb-14"
            >
              “
            </span>
            <blockquote className="font-cabinet italic font-light text-lafoi-dark text-3xl sm:text-4xl lg:text-[3.4rem] xl:text-[3.8rem] leading-[1.2] tracking-[-0.02em]">
              {t.quote}
            </blockquote>
          </AnimatedSection>

          <AnimatedSection delay={0.25} className="mt-10 lg:mt-14">
            <div className="flex flex-col items-center gap-2">
              <span className="block w-10 h-px bg-lafoi-green mb-2" />
              <p className="font-sora text-sm font-semibold text-lafoi-dark">{t.author}</p>
              <p className="text-xs font-general text-lafoi-gray">
                {t.role}
                {featured ? ` · ${featured.title}` : ''}
              </p>
            </div>
          </AnimatedSection>
        </div>

        {/* tasteful client marquee */}
        <AnimatedSection delay={0.4} className="mt-20 lg:mt-28">
          <p className="text-center text-[10px] font-sora text-lafoi-gray tracking-[0.3em] uppercase mb-8">
            — In good company
          </p>
          <div className="relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-lafoi-cream to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-lafoi-cream to-transparent z-10 pointer-events-none" />
            <div className="flex animate-marquee whitespace-nowrap">
              {[...clients, ...clients].map((c, i) => (
                <span
                  key={i}
                  className="mx-8 font-cabinet italic font-light text-2xl lg:text-3xl text-lafoi-gray/60"
                >
                  {c}
                  <span className="inline-block ml-16 w-1 h-1 rounded-full bg-lafoi-green/30 align-middle" />
                </span>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ============================================================================
   8. PARTNERS — two-column European engineering note
   ============================================================================ */

function Partners() {
  return (
    <section className="relative py-24 lg:py-32 bg-lafoi-cream overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-20 items-center">
          {/* left — large italic headline */}
          <AnimatedSection direction="left" className="lg:col-span-7">
            <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green mb-6">
              — Provenance
            </p>
            <h2 className="font-cabinet italic font-light text-lafoi-dark text-4xl sm:text-5xl lg:text-[4.4rem] leading-[1.05] tracking-[-0.02em]">
              Engineered in Europe,
              <br />
              <span className="text-lafoi-green">installed in Zimbabwe.</span>
            </h2>
          </AnimatedSection>

          {/* right — paragraph + provenance badges */}
          <AnimatedSection direction="right" className="lg:col-span-5">
            <p className="text-base lg:text-lg text-lafoi-gray font-general leading-relaxed">
              Every La Foi membrane begins on a German production line that has been making
              stretch ceilings for four decades. Our printed and translucent panels are produced
              in Estonia, Europe's quietest hub for architectural digital print. Our installation
              team trained at both facilities — and we install nowhere else but Zimbabwe.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-10">
              {[
                { country: 'Germany', role: 'Membrane engineering', detail: 'Established 1984' },
                { country: 'Estonia', role: 'Photographic print', detail: 'UV pigment, 1440 dpi' },
              ].map((p) => (
                <div
                  key={p.country}
                  className="p-5 rounded-2xl border border-lafoi-dark/10 bg-white/40 backdrop-blur-sm hover:border-lafoi-green/40 transition-colors duration-500"
                >
                  <p className="font-cabinet italic text-2xl text-lafoi-dark leading-none mb-2">
                    {p.country}
                  </p>
                  <p className="text-[11px] font-sora text-lafoi-green tracking-wider uppercase font-semibold mb-3">
                    {p.role}
                  </p>
                  <p className="text-xs font-general text-lafoi-gray">{p.detail}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

/* ============================================================================
   9. CINEMATIC CTA
   ============================================================================
   Full-bleed background image, soft overlay (bg-black/45 not /80),
   centered editorial copy, two real channels — WhatsApp + Email.
   ============================================================================ */

function CinematicCTA() {
  return (
    <section className="relative min-h-[80vh] lg:min-h-[88vh] flex items-center overflow-hidden bg-lafoi-dark">
      <div className="absolute inset-0">
        <OptimizedImage
          src="https://images.unsplash.com/photo-1639663742190-1b3dba2eebcf?w=2000&q=85"
          alt="Master suite with stretch ceiling and warm cove lighting at dusk"
          className="w-full h-full object-cover object-center"
          fill
          vision="Master suite with luminous stretch ceiling and warm cove lighting — invitation to begin"
        />
        {/* gentler gradient — preserves the image instead of dimming it to mush */}
        <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/85 via-lafoi-dark/30 to-lafoi-dark/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-lafoi-dark/55 via-transparent to-lafoi-dark/30" />
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 w-full py-24 lg:py-32">
        <div className="max-w-3xl">
          <AnimatedSection>
            <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green-light mb-7">
              — Free studio consultation
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <h2 className="heading-xl text-white text-5xl sm:text-6xl lg:text-[5.2rem] xl:text-[6rem] leading-[1.02] tracking-[-0.025em]">
              <span className="block font-cabinet italic font-light">Begin with</span>
              <span className="block">a conversation.</span>
            </h2>
          </AnimatedSection>

          <AnimatedSection delay={0.25}>
            <p className="mt-8 max-w-xl text-base lg:text-lg text-white/70 font-general leading-relaxed">
              We visit, we measure, we listen. The first conversation costs nothing and tends to
              clarify even the briefs that arrive uncertain. WhatsApp is the fastest channel —
              email if you would rather attach drawings.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.4}>
            <div className="mt-12 flex flex-wrap items-center gap-4 lg:gap-5">
              <a
                href="https://wa.me/263712326951"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 px-7 py-4 rounded-full bg-lafoi-green-light text-white font-sora text-sm font-semibold hover:bg-lafoi-green transition-all duration-500 shadow-[0_8px_30px_rgba(34,197,94,0.25)]"
              >
                Message us on WhatsApp
                <ArrowUpRight
                  size={16}
                  className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300"
                />
              </a>
              <a
                href="mailto:admin@lafoidesigns.co.zw"
                className="group inline-flex items-center gap-3 px-7 py-4 rounded-full bg-white/10 backdrop-blur-md text-white font-sora text-sm font-semibold border border-white/20 hover:bg-white/15 hover:border-white/40 transition-all duration-500"
              >
                admin@lafoidesigns.co.zw
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform duration-300"
                />
              </a>
              <Link
                to="/contact"
                className="group inline-flex items-center gap-2 ml-2 text-white/75 hover:text-white font-sora text-sm font-medium pb-1 border-b border-white/25 hover:border-lafoi-green-light transition-colors"
              >
                Or open a brief
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-1 transition-transform duration-300"
                />
              </Link>
            </div>
          </AnimatedSection>

          {/* footer-ish line of contact channels */}
          <AnimatedSection delay={0.55}>
            <div className="mt-16 lg:mt-20 pt-8 border-t border-white/10 flex flex-wrap items-center gap-x-8 gap-y-3">
              {[
                { label: 'Studio', value: 'Belgravia, Harare' },
                { label: 'Phone', value: '+263 712 326 951' },
                { label: 'Hours', value: 'Mon–Fri · 09:00–17:00' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-[10px] font-sora text-lafoi-green-light tracking-[0.25em] uppercase">
                    {item.label}
                  </span>
                  <span className="text-sm font-general text-white/70">{item.value}</span>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}
