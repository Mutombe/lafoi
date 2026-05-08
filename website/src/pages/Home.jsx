import React, { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Calendar,
  Ruler,
  Compass,
  Lightning,
  PaintBrush,
  ShieldCheck,
  Leaf,
  Sparkle,
  Plus,
  Star,
} from '@phosphor-icons/react'
import AnimatedSection from '../components/ui/AnimatedSection'
import OptimizedImage from '../components/ui/OptimizedImage'
import HeroSlideshow from '../components/ui/HeroSlideshow'
import SectionDivider from '../components/ui/SectionDivider'
import VideoShowcase from '../components/ui/VideoShowcase'
import ScrollReveal from '../components/ui/ScrollReveal'
import MagneticCard from '../components/ui/MagneticCard'
import KineticTextStrip from '../components/ui/KineticTextStrip'
import AnimatedHeading from '../components/ui/AnimatedHeading'
import CountUpUI from '../components/ui/CountUp'
import { useSEO, breadcrumbsLd } from '../utils/seo'
import { products, projects } from '../data/site'
import { reviews, googleRating } from '../data/reviews'
import { linkifyProse } from '../utils/linkify.jsx'

const HOME_HERO_SLIDES = [
  {
    src: '/brand/images/50.png',
    alt: 'Wood-pattern stretch ceiling above a luxury lounge',
    vision: 'Editorial wood-stripe printed ceiling over a designer lounge',
  },
  {
    src: '/brand/images/35.png',
    alt: 'Warm linear pendants over a marble feature wall',
    vision: 'Editorial yellow linear-pendant ceiling against luxury marble',
  },
  {
    src: '/brand/images/1.png',
    alt: 'La Foi signature stretch ceiling installation, editorial cover image',
    vision: 'Brand-supplied editorial hero, signature install',
  },
]

/* ============================================================================
   HOME, La Foi Designs · World-Class UI Elevation
   ============================================================================
   Each section has its OWN aesthetic. Curved/angular dividers connect them.
   Symmetry within sections; rhythm between them.

     1.  Hero, kinetic typography, cinematic slideshow
     ── divider: wave (dark → cream)
     2.  Finish band, Swiss numbered hairline, centre-grow underlines
     ── divider: angular (cream → dark)
     3.  Manifesto, aurora bento, marquee credentials
     ── divider: organic-blob (dark → cream)
     4.  Finish gallery, true bento grid (signature moment)
     ── divider: mirror-angular (cream → dark)
     5.  Approach, sticky scroll, massive ghost numerals, progress rail
     ── divider: arc (dark → cream)  [rendered flipped: cream wave into dark]
     6.  Stats, neumorphic glass cards on aurora
     ── divider: angular (dark → cream)
     7.  Projects bento, asymmetric editorial bento with corner mark
     ── divider: s-curve (cream → cream)
     8.  Video showcase, bento of in-motion captures, modal player
     ── divider: subtle-wave (cream → cream)
     9.  Testimonial, typography-first pull-quote, kinetic name marquee
     ── divider: subtle-wave (cream → cream)
    10.  Why La Foi, 3×2 bento of pillars
     ── divider: big-wave (cream → dark)
    11.  CinematicCTA, split-tone full-bleed
   ============================================================================ */

export default function Home() {
  useSEO({
    title: 'Stretch Ceilings in Zimbabwe',
    description:
      'Modern stretch ceilings, architectural lighting, interior design, flooring, tiling and epoxy systems for homes, offices, hotels, and retail spaces in Zimbabwe. Request a quote from La Foi Designs.',
    path: '/',
    image: '/brand/images/50.png',
    jsonLd: breadcrumbsLd([{ name: 'Home', path: '/' }]),
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Hero />
      <SectionDivider shape="wave" from="dark" to="cream" />
      <FinishBand />
      <SectionDivider shape="angular" from="cream" to="dark" />
      <Manifesto />
      <SectionDivider shape="organic-blob" from="dark" to="cream" />
      <FinishGallery />
      <KineticTextStrip variant="dark" speed={70} />
      <SectionDivider shape="mirror-angular" from="cream" to="cream" />
      <Approach />
      <SectionDivider shape="arc" from="cream" to="dark" />
      <Stats />
      <SectionDivider shape="angular" from="dark" to="cream" />
      <ProjectsBento />
      <SectionDivider shape="s-curve" from="cream" to="cream" />
      <VideoShowcaseSection />
      <SectionDivider shape="subtle-wave" from="cream" to="cream" />
      <Testimonial />
      <SectionDivider shape="subtle-wave" from="cream" to="cream" />
      <WhyLaFoi />
      <SectionDivider shape="big-wave" from="cream" to="dark" />
      <CinematicCTA />
    </motion.div>
  )
}

/* ============================================================================
   1. HERO, kinetic typography over cinematic slideshow
   ============================================================================ */

function Hero() {
  const ref = useRef(null)
  const [mouse, setMouse] = useState({ x: 50, y: 40 })
  const [hoverable, setHoverable] = useState(false)

  // Parallax depth layers, scroll-driven, separate from the slideshow's own parallax.
  // 0.2× background haze, 0.45× dot-pattern mid-layer, 0.8× foreground gradient.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 120])
  const midY = useTransform(scrollYProgress, [0, 1], [0, 270])
  const fgY = useTransform(scrollYProgress, [0, 1], [0, 480])
  const fgOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [0.55, 0.4, 0.15])

  useEffect(() => {
    setHoverable(window.matchMedia('(hover: hover)').matches)
  }, [])

  const onMouseMove = (e) => {
    if (!hoverable || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setMouse({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  // Kinetic word-by-word reveal for the headline
  const headlineWords = [
    { text: 'Light,', weight: 'light', delay: 0.15 },
    { text: 'shaped', weight: 'light', delay: 0.30 },
    { text: 'by', weight: 'normal', delay: 0.55 },
    { text: 'surface', weight: 'normal', delay: 0.75, shimmer: true },
  ]

  return (
    <section
      ref={ref}
      onMouseMove={onMouseMove}
      className="relative h-[100svh] min-h-[640px] overflow-hidden bg-lafoi-dark"
    >
      {/* Parallax depth layer 1, slow background haze (0.2× scroll) */}
      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          y: bgY,
          background:
            'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(34,197,94,0.06), transparent 70%)',
        }}
      />

      <HeroSlideshow slides={HOME_HERO_SLIDES} interval={6500} parallax overlay={false} />

      {/* Parallax depth layer 2, dot-pattern mid-layer (0.45× scroll) */}
      <motion.div
        aria-hidden
        className="absolute inset-0 dot-pattern opacity-25 pointer-events-none"
        style={{ y: midY }}
      />

      {/* refined cinematic overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/90 via-lafoi-dark/40 to-lafoi-dark/55 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-lafoi-dark/55 via-transparent to-lafoi-dark/20 pointer-events-none" />

      {/* Parallax depth layer 3, foreground gradient (0.8× scroll), fades out */}
      <motion.div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
        style={{
          y: fgY,
          opacity: fgOpacity,
          background:
            'linear-gradient(180deg, transparent 0%, rgba(17,17,17,0.35) 60%, rgba(17,17,17,0.6) 100%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          opacity: hoverable ? 0.9 : 0.5,
          background: hoverable
            ? `radial-gradient(560px circle at ${mouse.x}% ${mouse.y}%, rgba(34,197,94,0.06), transparent 55%)`
            : 'radial-gradient(ellipse at 50% 35%, rgba(34,197,94,0.07), transparent 55%)',
        }}
      />

      {/* Volume index, desktop: top-right floating; mobile: rendered inline below the pill (see CONTENT below) */}
      <motion.div
        className="hidden lg:block absolute inset-x-0 top-32 z-10 pointer-events-none"
        initial={{ opacity: 0, filter: 'blur(8px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1.4, delay: 1.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex justify-end">
          <span className="font-sora text-[10px] tracking-[0.35em] uppercase text-white/55">
            Vol.&nbsp;01, 2026
          </span>
        </div>
      </motion.div>

      {/* CONTENT */}
      <div className="relative z-10 h-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col">
        <motion.div
          className="pt-28 lg:pt-32"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/8 backdrop-blur-md border border-white/15">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lafoi-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-lafoi-green-light" />
            </span>
            <span className="text-[10px] sm:text-[11px] font-sora text-white/85 font-medium tracking-[0.22em] uppercase">
              Stretch ceilings · Architectural lighting · Harare
            </span>
          </span>

          {/* Mobile-only Vol.01 sits below the status pill (replaces the floating top-right label on small screens) */}
          <motion.div
            className="lg:hidden mt-3 flex items-center gap-2 pl-1"
            initial={{ opacity: 0, filter: 'blur(8px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.0, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <span aria-hidden className="block w-6 h-px bg-white/35" />
            <span className="font-sora text-[10px] tracking-[0.35em] uppercase text-white/55">
              Vol.&nbsp;01, 2026
            </span>
          </motion.div>
        </motion.div>

        <div className="mt-auto pb-28 sm:pb-24 lg:pb-20 grid lg:grid-cols-12 gap-8 lg:gap-12 items-end">
          <div className="lg:col-span-8">
            {/* KINETIC TYPOGRAPHY, word-by-word reveal */}
            <h1
              className="font-display text-white tracking-[-0.035em] leading-[0.98] text-[3rem] sm:text-[4.5rem] lg:text-[6.4rem] xl:text-[7.2rem]"
              style={{ fontVariationSettings: '"opsz" 144' }}
            >
              <span className="block overflow-hidden">
                <motion.span
                  className="inline-block font-light text-white/95"
                  initial={{ y: '110%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  transition={{ duration: 1.0, delay: 0.10, ease: [0.16, 1, 0.3, 1] }}
                >
                  {headlineWords[0].text}
                </motion.span>{' '}
                <motion.span
                  className="inline-block font-light text-white/95"
                  initial={{ y: '110%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  transition={{ duration: 1.0, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  {headlineWords[1].text}
                </motion.span>
              </span>
              <span className="block overflow-hidden">
                <motion.span
                  className="inline-block font-normal text-white"
                  initial={{ y: '110%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  transition={{ duration: 1.0, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  by
                </motion.span>{' '}
                <motion.span
                  className="inline-block font-normal word-shimmer"
                  initial={{ y: '110%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  transition={{ duration: 1.0, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
                >
                  surface
                </motion.span>
                <motion.span
                  className="inline-block text-lafoi-green-light"
                  initial={{ y: '110%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  transition={{ duration: 1.0, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
                >
                  .
                </motion.span>
              </span>
            </h1>

            <motion.p
              className="mt-6 lg:mt-8 max-w-xl text-sm sm:text-base lg:text-[17px] text-white/70 font-body font-light leading-[1.55]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
            >
              Premium PVC and fabric{' '}
              <Link
                to="/services/stretch-ceiling-installation"
                className="prose-link-dark prose-link-arrow"
              >
                stretch membranes
              </Link>
              , custom{' '}
              <Link
                to="/products/printed-photographic-membrane"
                className="prose-link-dark"
              >
                photographic
              </Link>{' '}
              and{' '}
              <Link
                to="/products/translucent-backlit-membrane"
                className="prose-link-dark"
              >
                translucent
              </Link>{' '}
              panels, paired with bespoke{' '}
              <Link
                to="/services/lighting-solutions"
                className="prose-link-dark prose-link-arrow"
              >
                LED architecture
              </Link>
              . We design the surface most often forgotten.
            </motion.p>

            <motion.div
              className="mt-8 lg:mt-10 flex flex-wrap items-center gap-x-5 gap-y-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                to="/contact"
                className="group inline-flex items-center gap-3 px-7 py-3.5 bg-lafoi-green-light text-white rounded-full font-body text-sm font-medium hover:bg-lafoi-green transition-all duration-500 shadow-[0_10px_40px_-10px_rgba(34,197,94,0.55)]"
              >
                Start your project
                <ArrowRight size={15} weight="bold" className="group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link
                to="/projects"
                className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/25 text-white/85 hover:bg-white/8 hover:border-white/45 hover:text-white font-body text-sm font-medium transition-all duration-500"
              >
                Explore our work
                <ArrowUpRight size={14} weight="regular" className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
              </Link>
            </motion.div>
          </div>

        </div>
      </div>

      {/* scroll cue, pinned to the right edge so it never overlaps the centered carousel dots.
          Hidden on small mobile to keep the bottom area clean. */}
      <motion.div
        className="hidden sm:flex absolute bottom-6 right-6 lg:right-10 z-10 flex-col items-center gap-2 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.5 }}
      >
        <span className="text-[9px] font-sora tracking-[0.35em] uppercase text-white/45">Scroll</span>
        <span className="block w-px h-8 bg-gradient-to-b from-white/45 to-transparent" />
      </motion.div>
    </section>
  )
}

/* ============================================================================
   2. FINISH BAND, Swiss numbered hairline
   ============================================================================ */

function FinishBand() {
  const finishes = [
    { name: 'Matte', slug: 'matte-stretch-membrane' },
    { name: 'Satin', slug: 'satin-stretch-membrane' },
    { name: 'Gloss', slug: 'gloss-lacquer-membrane' },
    { name: 'Translucent', slug: 'translucent-backlit-membrane' },
    { name: 'Printed', slug: 'printed-photographic-membrane' },
    { name: 'Sculptural', slug: '3d-sculptural-membrane' },
  ]

  return (
    <section className="relative bg-lafoi-cream border-b border-lafoi-dark/8">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-7 lg:py-9">
        <div className="flex items-center gap-4 lg:gap-8">
          <span className="hidden sm:inline-block text-[9px] font-sora text-lafoi-gray/70 tracking-[0.3em] uppercase whitespace-nowrap">
            The library
          </span>
          <span className="hidden sm:block flex-shrink-0 w-8 h-px bg-lafoi-dark/15" />
          <ul className="flex items-end gap-x-6 sm:gap-x-9 lg:gap-x-14 overflow-x-auto whitespace-nowrap -mx-1 px-1 scrollbar-none flex-1">
            {finishes.map((f, i) => (
              <li key={f.slug} className="flex flex-col items-start gap-1.5 flex-shrink-0">
                {/* numbered hairline */}
                <span className="font-sora text-[9px] tracking-[0.3em] uppercase text-lafoi-gray/55 leading-none">
                  {String(i + 1).padStart(2, '0')} / {String(finishes.length).padStart(2, '0')}
                </span>
                <Link
                  to={`/products/${f.slug}`}
                  className="finish-link font-display text-base sm:text-lg lg:text-xl text-lafoi-dark hover:text-lafoi-green transition-colors duration-300 tracking-tight leading-none"
                  style={{ fontVariationSettings: '"opsz" 60' }}
                >
                  {f.name}
                </Link>
              </li>
            ))}
          </ul>
          <span className="hidden lg:inline-block text-[9px] font-sora text-lafoi-gray/55 tracking-[0.3em] uppercase whitespace-nowrap">
            Updated 2026
          </span>
        </div>
      </div>
    </section>
  )
}

/* ============================================================================
   3. MANIFESTO, aurora mesh + symmetric bento
   ============================================================================ */

function Manifesto() {
  // Split-Screen Brutalist, borrowed from ContactHero.
  // Section is full-bleed (no max-w-[1440px] constraint).
  // 50/50 grid at lg+: dark plate left, raw image right.
  // Credential marquee floats full-bleed across both halves at the bottom.
  //
  // SUBTLE PARALLAX, the right-side image drifts ~50px down as the section
  // scrolls past, while the dark text plate stays still. Restrained: capped
  // translation, no scale or opacity shift.
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const imageY = useTransform(scrollYProgress, [0, 1], [-30, 60])

  return (
    <section ref={sectionRef} className="relative bg-lafoi-dark overflow-hidden">
      {/* Top region: 50/50 split */}
      <div className="relative grid lg:grid-cols-2 min-h-[88vh] lg:min-h-[92vh]">
        {/* LEFT, dark plate with manifesto */}
        <motion.div
          className="relative bg-lafoi-dark text-white flex items-center order-2 lg:order-1 px-6 sm:px-10 lg:px-16 py-24 lg:py-28 overflow-hidden"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <div aria-hidden className="absolute inset-0 dot-pattern opacity-15 pointer-events-none" />
          <div aria-hidden className="absolute inset-0 aurora-mesh pointer-events-none" />

          <div className="relative w-full max-w-xl ml-auto lg:mr-10">
            <div className="flex items-center gap-3 mb-10">
              <span className="block w-12 h-px bg-lafoi-green-light/70" />
              <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green-light">
                Studio manifesto
              </p>
              <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-white/30">01 / 10</span>
            </div>

            <h2
              className="font-display text-white tracking-[-0.025em] text-[2.4rem] sm:text-5xl lg:text-[3.6rem] xl:text-[4.2rem]"
              style={{ fontVariationSettings: '"opsz" 144', lineHeight: '1.04' }}
            >
              <AnimatedHeading
                as="span"
                text="We believe a ceiling is the"
                className="block font-light"
                staggerChildren={0.05}
              />
              <AnimatedHeading
                as="span"
                text="sixth surface,"
                className="block italic font-light text-lafoi-green-light mt-1"
                delay={0.3}
                staggerChildren={0.05}
              />
              <span className="block font-light mt-2 text-white/90 leading-[1.2] text-[1.8rem] sm:text-[2.4rem] lg:text-[2.4rem] xl:text-[2.6rem]">
                the one most often forgotten, and the one
                <span className="italic text-white/95"> with the most to give.</span>
              </span>
            </h2>

            <div className="mt-12 lg:mt-14 grid grid-cols-2 gap-x-8 gap-y-6">
              {[
                { k: 'Origin', v: 'Belgravia, Harare' },
                { k: 'Founded', v: '2024' },
                { k: 'Membranes', v: 'PVC · Fabric' },
                { k: 'Install', v: '1 to 2 days per room' },
              ].map((m) => (
                <div key={m.k} className="border-t border-white/10 pt-4">
                  <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-white/40 mb-1.5">
                    {m.k}
                  </p>
                  <p className="font-display font-light text-white text-lg lg:text-xl">{m.v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hairline seam, full-height, sits on the right edge of the dark plate */}
          <span aria-hidden className="hidden lg:block absolute top-0 right-0 w-px h-full bg-lafoi-green/30 z-10" />
        </motion.div>

        {/* RIGHT, full-bleed image, NO overlay. Dark fallback bg + overflow-hidden so
            parallax overscan never reveals cream and the curved dividers above/below
            blend seamlessly with the image edge. */}
        <motion.div
          className="relative order-1 lg:order-2 min-h-[420px] lg:min-h-0 bg-lafoi-dark overflow-hidden"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="absolute inset-0 will-change-transform"
            style={{ y: imageY }}
          >
            <ScrollReveal className="absolute inset-0">
              <img
                src="/brand/images/49.png"
                alt="Gold geometric LED ceiling, La Foi studio reference"
                width="1600"
                height="2133"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            </ScrollReveal>
          </motion.div>
          {/* mobile-only soft bottom gradient for legibility against next section seam (none on desktop, pure brutalism) */}
          <div aria-hidden className="absolute inset-0 lg:hidden bg-gradient-to-t from-lafoi-dark/40 via-transparent to-transparent" />

          {/* corner badge, restrained, only visible on the right plate */}
          <div className="absolute top-6 right-6 lg:top-8 lg:right-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/12 backdrop-blur-md border border-white/20">
            <Sparkle size={11} weight="fill" className="text-lafoi-green-light" />
            <span className="font-sora text-[10px] tracking-[0.25em] uppercase text-white/90">
              La Foi Studio
            </span>
          </div>
        </motion.div>
      </div>

      {/* Credential marquee, full-bleed floating band across both halves */}
      <div className="relative border-y border-white/10 py-6 overflow-hidden marquee-pause">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-lafoi-dark to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-lafoi-dark to-transparent z-10 pointer-events-none" />
        <div className="flex marquee-track whitespace-nowrap">
          {[...Array(2)].flatMap((_, k) =>
            [
              'Zimbabwe’s first',
              'PVC & fabric membrane',
              'Wide colour range',
              'Fire-rated B-s1, d0',
              '1 to 2 day install',
            ].map((chip, i) => (
              <span key={`${k}-${i}`} className="inline-flex items-center mx-8">
                <span className="font-sora text-xs lg:text-sm text-white/55 tracking-[0.18em] uppercase">
                  {chip}
                </span>
                <span className="ml-16 inline-block w-1 h-1 rounded-full bg-lafoi-green-light/40 align-middle" />
              </span>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

/* ============================================================================
   4. FINISH GALLERY, true bento grid (signature moment)
   ============================================================================ */

function FinishGallery() {
  const stretchProducts = products.filter((p) => p.category === 'Stretch Ceilings').slice(0, 9)

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

  // Bento layout, 9 cells, asymmetric editorial grid (4 cols × 5 rows)
  // Cell 1: hero (col-span-2 row-span-2), top-left feature
  // Cell 2: col-span-1, top-right
  // Cell 3: col-span-1, top-right
  // Cell 4: col-span-2, middle-right (sits next to hero's bottom half)
  // Cell 5: col-span-1 row-span-2, tall left feature
  // Cell 6: col-span-1
  // Cell 7: col-span-2
  // Cell 8: col-span-1
  // Cell 9: col-span-2
  const bentoSpans = [
    'col-span-2 row-span-2', // 0
    'col-span-1 row-span-1', // 1
    'col-span-1 row-span-1', // 2
    'col-span-2 row-span-1', // 3
    'col-span-1 row-span-2', // 4
    'col-span-1 row-span-1', // 5
    'col-span-2 row-span-1', // 6
    'col-span-1 row-span-1', // 7
    'col-span-2 row-span-1', // 8
  ]

  return (
    <section className="relative py-24 lg:py-36 bg-lafoi-cream overflow-hidden">
      <div className="absolute inset-0 mesh-gradient-1 opacity-50 pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14 lg:mb-20">
          <div className="max-w-2xl">
            <AnimatedSection>
              <div className="flex items-center gap-3 mb-5">
                <span className="block w-10 h-px bg-lafoi-green/60" />
                <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                  The membrane library
                </p>
                <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray/50">03 / 10</span>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <h2 className="heading-xl text-lafoi-dark text-4xl sm:text-5xl lg:text-6xl">
                Nine finishes.
                <br />
                <span className="font-display font-light text-lafoi-green">
                  One ceiling that listens.
                </span>
              </h2>
            </AnimatedSection>
          </div>
          <AnimatedSection delay={0.2} direction="right">
            <p className="text-lafoi-gray font-general max-w-sm leading-relaxed">
              {linkifyProse(
                'Every stretch ceiling finish answers a different brief, calm or theatrical, silent or sculptural. We help you choose the one your space is asking for, drawing on a decade of architectural lighting experience.'
              )}
            </p>
          </AnimatedSection>
        </div>

        {/* DESKTOP, editorial bento grid: 4 cols × 5 rows, asymmetric */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-5 auto-rows-[260px]">
          {stretchProducts.map((p, i) => (
            <AnimatedSection
              key={p.slug}
              direction="scale"
              delay={Math.min(0.4, i * 0.05)}
              amount={0.15}
              className={bentoSpans[i]}
            >
            <MagneticCard strength={0.16} tiltAmplitude={4} className="h-full w-full">
            <Link
              to={`/products/${p.slug}`}
              className={`group relative block h-full w-full rounded-3xl overflow-hidden bg-lafoi-dark shadow-[0_18px_50px_-25px_rgba(17,17,17,0.35)]`}
            >
              <img
                src={p.image}
                alt={`${p.name}, ${p.vision || p.shortDesc || `${p.finish} finish stretch ceiling membrane`}`}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
              />
              {/* Permanent dark glassmorphic gradient at bottom */}
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(17,17,17,0) 0%, rgba(17,17,17,0) 35%, rgba(17,17,17,0.55) 75%, rgba(17,17,17,0.85) 100%)',
                }}
              />
              {/* Top-corner index + arrow */}
              <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10">
                <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-white/80 px-2.5 py-1 rounded-full bg-black/25 backdrop-blur-md border border-white/15">
                  0{i + 1} / 0{stretchProducts.length}
                </span>
                <span className="w-9 h-9 rounded-full border border-white/30 bg-black/20 backdrop-blur-md flex items-center justify-center group-hover:border-lafoi-green-light group-hover:bg-lafoi-green-light/15 transition-all duration-500">
                  <ArrowUpRight size={12} weight="bold" className="text-white" />
                </span>
              </div>
              {/* Bottom label always visible */}
              <div className="absolute inset-x-5 bottom-5 z-10 pointer-events-none">
                <p className="text-[10px] font-sora text-lafoi-green-light tracking-[0.28em] uppercase mb-1.5 opacity-95">
                  {p.finish}
                </p>
                <h3 className="font-display font-light text-white text-xl lg:text-2xl leading-[1.05] tracking-[-0.01em]">
                  {p.name.replace(/ Stretch Membrane$| Membrane$/i, '')}
                </h3>
                <p className="text-[11px] lg:text-xs font-sora text-white/70 tracking-wide mt-1.5 line-clamp-1">
                  {finishMeta[p.finish] || p.shortDesc}
                </p>
              </div>
            </Link>
            </MagneticCard>
            </AnimatedSection>
          ))}
        </div>

        {/* MOBILE, stacked cards */}
        <div className="lg:hidden grid grid-cols-2 gap-3 sm:gap-5">
          {stretchProducts.map((p, i) => (
            <MagneticCard key={p.slug} strength={0.14} tiltAmplitude={3} className="block h-full">
            <Link
              to={`/products/${p.slug}`}
              className="group relative block rounded-3xl overflow-hidden bg-lafoi-dark aspect-[4/5]"
            >
              <img
                src={p.image}
                alt={`${p.name}, ${p.vision || p.shortDesc || `${p.finish} finish stretch ceiling membrane`}`}
                width="800"
                height="1067"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
              />
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(17,17,17,0) 0%, rgba(17,17,17,0) 35%, rgba(17,17,17,0.55) 75%, rgba(17,17,17,0.82) 100%)',
                }}
              />
              <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10">
                <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-white/75">
                  0{i + 1} / 0{stretchProducts.length}
                </span>
                <span className="w-7 h-7 rounded-full border border-white/30 bg-black/15 backdrop-blur-sm flex items-center justify-center">
                  <ArrowUpRight size={11} weight="bold" className="text-white/85" />
                </span>
              </div>
              <div className="absolute inset-x-4 bottom-4 z-10 pointer-events-none">
                <p className="text-[10px] font-sora text-lafoi-green-light tracking-[0.28em] uppercase mb-1 opacity-95">
                  {p.finish}
                </p>
                <h3 className="font-display font-light text-white text-xl leading-none tracking-[-0.01em]">
                  {p.name.replace(/ Stretch Membrane$| Membrane$/i, '')}
                </h3>
              </div>
            </Link>
            </MagneticCard>
          ))}
        </div>

        <AnimatedSection delay={0.2} className="mt-12 flex justify-center">
          <Link
            to="/products"
            className="group inline-flex items-center gap-3 text-lafoi-dark font-sora text-sm font-medium pb-1 border-b border-lafoi-dark/30 hover:border-lafoi-green hover:text-lafoi-green transition-colors duration-300"
          >
            <span className="font-display font-light text-base">Explore the full library</span>
            <ArrowRight
              size={16}
              weight="bold"
              className="group-hover:translate-x-1 transition-transform duration-300"
            />
          </Link>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ============================================================================
   5. APPROACH, sticky scroll · massive ghost numerals · progress rail
   ============================================================================ */

function Approach() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  const [activeStep, setActiveStep] = useState(0)
  const [railProgress, setRailProgress] = useState(0)

  useEffect(() => {
    const unsub = scrollYProgress.on('change', (v) => {
      const adjusted = Math.max(0, Math.min(1, (v - 0.15) / 0.55))
      const next = adjusted < 0.34 ? 0 : adjusted < 0.67 ? 1 : 2
      setActiveStep(next)
      setRailProgress(adjusted)
    })
    return unsub
  }, [scrollYProgress])

  const stages = [
    {
      num: '01',
      title: 'Design',
      copy: 'A site visit, a measured drawing, a long design consultation. Stretch membrane, lighting layout, control logic, edge details, we sample the finish in your light, not ours.',
      image: '/brand/images/11.png',
      vision: 'White gloss kitchen with perimeter LED, magazine-clean design language',
    },
    {
      num: '02',
      title: 'Craft',
      copy: 'Custom-cut stretch membrane, hand-joined seams, architectural lighting prepped to scene before the room is touched. The work happens off-site so the room itself stays calm.',
      image: '/brand/images/15.png',
      vision: 'Dining room with hand-blown glass-globe chandelier, crafted entertaining space',
    },
    {
      num: '03',
      title: 'Reveal',
      copy: 'A trained crew, one to two working days per room, no demolition. The membrane goes up, the lighting comes alive, and the room is yours by sundown, followed by our maintenance and support warranty.',
      image: '/brand/images/20.png',
      vision: 'Bedroom with white gloss ceiling, arched mirrors and timber panelling, finished reveal',
    },
  ]

  return (
    <section ref={containerRef} className="relative bg-lafoi-cream">
      {/* decorative mesh, clipped on its own wrapper so the section stays overflow-visible
          (sticky child requires overflow-visible ancestors) */}
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 mesh-gradient-1 opacity-50" />
      </div>

      {/* 50/50 mirrored split, image LEFT, text RIGHT (Manifesto is the inverse) */}
      <div className="relative grid lg:grid-cols-2 lg:min-h-[100vh]">
        {/* LEFT, full-bleed sticky image, fills the entire left half.
            `lg:bg-lafoi-dark` ensures that when the sticky pane releases at the
            bottom of the section, the column shows dark, which carries the
            image's tone all the way down into the curved divider below. */}
        <div className="relative order-1 lg:order-1 lg:bg-lafoi-dark">
          {/* Mobile: simple full-width image, no sticky */}
          <div className="lg:hidden relative aspect-[4/5] bg-lafoi-dark overflow-hidden">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={`m-${activeStep}`}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                <OptimizedImage
                  src={stages[activeStep].image}
                  alt={`Stage ${stages[activeStep].num} ${stages[activeStep].title}, ${stages[activeStep].vision}`}
                  className="w-full h-full object-cover"
                  fill
                  vision={stages[activeStep].vision}
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-lafoi-dark/40 via-transparent to-transparent" />
              </motion.div>
            </AnimatePresence>
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                {stages.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 rounded-full transition-all duration-700 ${
                      i === activeStep ? 'w-10 bg-white' : 'w-5 bg-white/30'
                    }`}
                  />
                ))}
              </div>
              <p className="font-display font-normal text-white text-xl">
                {stages[activeStep].title}
              </p>
            </div>
          </div>

          {/* Inline SVG defs, clip-path that mirrors the bottom-divider arc.
              The desktop sticky image references this clip via `clipPathUnits=objectBoundingBox`
              so its bottom edge bends in step with the SectionDivider below.
              Path geometry mirrors the divider's `arc` shape (left half: dips from 0,0 to 0.5,0.96;
              right half: rises back to 1,0). The values are normalised 0-1. */}
          <svg aria-hidden width="0" height="0" className="absolute pointer-events-none">
            <defs>
              <clipPath id="approach-arc-clip" clipPathUnits="objectBoundingBox">
                <path d="
                  M 0 0
                  L 1 0
                  L 1 1
                  C 0.75 1, 0.6 0.95, 0.5 0.95
                  C 0.4 0.95, 0.25 1, 0 1
                  Z
                " />
              </clipPath>
            </defs>
          </svg>
          {/* Desktop: sticky full-bleed pane covering the entire left half.
              The pane's bottom edge is clipped with the divider's arc so the image
              bends parallel to the curved white border below. */}
          <div
            className="hidden lg:block lg:sticky lg:top-0 lg:h-screen overflow-hidden bg-lafoi-dark z-10"
            style={{ clipPath: 'url(#approach-arc-clip)' }}
          >
            <AnimatePresence mode="popLayout">
              <motion.div
                key={activeStep}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              >
                <OptimizedImage
                  src={stages[activeStep].image}
                  alt={`Stage ${stages[activeStep].num} ${stages[activeStep].title}, ${stages[activeStep].vision}`}
                  className="w-full h-full object-cover"
                  fill
                  vision={stages[activeStep].vision}
                />
                {/* Subtle vignette for legibility of the corner labels */}
                <div className="absolute inset-0 bg-gradient-to-tr from-lafoi-dark/35 via-transparent to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-lafoi-dark/40 pointer-events-none" />
              </motion.div>
            </AnimatePresence>

            {/* Stage label and dots, pinned to corners of the full pane */}
            <div className="absolute top-8 left-8 flex items-center gap-3 z-10">
              <span className="block w-10 h-px bg-white/50" />
              <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-white/85">
                Stage {stages[activeStep].num}
              </span>
            </div>

            <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between z-10">
              <p className="font-display font-light text-white text-4xl xl:text-5xl tracking-[-0.02em] leading-none">
                {stages[activeStep].title}
              </p>
              <div className="flex items-center gap-2">
                {stages.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 rounded-full transition-all duration-700 ${
                      i === activeStep ? 'w-14 bg-white' : 'w-6 bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Hairline seam, full-height, sits on the right edge of the image plate */}
          <span aria-hidden className="hidden lg:block absolute top-0 right-0 w-px h-full bg-lafoi-green/30 z-10" />
        </div>

        {/* RIGHT, scrolling text plate */}
        <div className="relative order-2 lg:order-2 p-8 sm:p-12 lg:p-16 xl:p-24 lg:py-24">
          {/* vertical progress rail, desktop only, runs down the LEFT edge of the right half just inside the seam */}
          <div className="hidden lg:block absolute top-0 bottom-0 left-0 pointer-events-none">
            <div className="progress-rail h-full" />
            <div
              className="progress-rail-dot"
              style={{ top: `${Math.max(2, Math.min(98, railProgress * 100))}%` }}
            />
          </div>

          {/* heading, section title lives at the top of the right plate */}
          <div className="max-w-2xl mb-16 lg:mb-24">
            <AnimatedSection>
              <div className="flex items-center gap-3 mb-5">
                <span className="block w-10 h-px bg-lafoi-green/60" />
                <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                  How we work
                </p>
                <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray/50">05 / 10</span>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <h2 className="heading-xl text-lafoi-dark text-4xl sm:text-5xl lg:text-[4rem] leading-[1.05]">
                Three stages.
                <br />
                <span className="font-display font-light text-lafoi-green">No surprises.</span>
              </h2>
            </AnimatedSection>
          </div>

          {/* three scroll stages, same data, same component */}
          <div className="flex flex-col gap-20 lg:gap-44">
            {stages.map((stage, i) => (
              <ScrollStage key={stage.num} stage={stage} index={i} active={i === activeStep} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ScrollStage({ stage, index, active }) {
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
          alt={`Stage ${stage.num} ${stage.title}, ${stage.vision}`}
          className="w-full h-full object-cover"
          fill
          vision={stage.vision}
        />
      </div>

      {/* MASSIVE ghost numeral, sits behind text */}
      <span
        aria-hidden
        className="absolute -top-6 -left-2 lg:-top-10 lg:-left-4 font-display font-light text-lafoi-dark/[0.06] leading-none pointer-events-none select-none"
        style={{ fontSize: 'clamp(8rem, 14vw, 16rem)', fontVariationSettings: '"opsz" 144' }}
      >
        {stage.num}
      </span>

      <div className="relative">
        <div className="flex items-center gap-3 mb-5">
          <span className={`font-sora text-[10px] tracking-[0.3em] uppercase transition-colors duration-500 ${active ? 'text-lafoi-green' : 'text-lafoi-gray/55'}`}>
            Stage {stage.num}
          </span>
          <span className="h-px flex-1 bg-lafoi-dark/15" />
        </div>

        <h3 className="font-display font-light text-4xl lg:text-5xl text-lafoi-dark mb-5 tracking-tight">
          {stage.title}
        </h3>
        <p className="text-base lg:text-lg text-lafoi-gray font-general leading-relaxed max-w-md">
          {linkifyProse(stage.copy)}
        </p>
      </div>
    </motion.div>
  )
}

/* ============================================================================
   6. STATS, neumorphic glass cards on aurora
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
    { value: 1, suffix: 'st', label: 'Stretch ceiling studio in Zimbabwe' },
    { value: 4, suffix: '', label: 'Core service lines, end to end' },
    { value: 2, suffix: 'd', label: 'Typical install, start to handover' },
    { value: 15, suffix: 'yr', label: 'Manufacturer warranty on the membrane' },
  ]

  return (
    <section className="relative bg-lafoi-dark py-24 lg:py-36 overflow-hidden">
      <div className="aurora-mesh-cool" />
      <div className="absolute inset-0 dot-pattern opacity-10" />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="max-w-3xl mb-16 lg:mb-20">
          <AnimatedSection>
            <div className="flex items-center gap-3 mb-5">
              <span className="block w-10 h-px bg-lafoi-green-light/60" />
              <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green-light">
                By the numbers
              </p>
              <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-white/30">06 / 10</span>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h2 className="heading-xl text-white text-4xl sm:text-5xl lg:text-[3.6rem] leading-[1.1]">
              Quietly,{' '}
              <span className="font-display font-light text-lafoi-green-light">
                consistently,
              </span>
              <br />
              we keep raising ceilings.
            </h2>
          </AnimatedSection>
        </div>

        {/* SYMMETRIC 4-column grid of neumorphic glass cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {stats.map((s, i) => (
            <AnimatedSection key={s.label} delay={i * 0.08}>
              <div className="conic-ring relative rounded-3xl">
                <div className="neumorph-glass rounded-3xl p-7 lg:p-8 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-6 lg:mb-10">
                    <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-white/40">
                      0{i + 1}
                    </span>
                    <span className="w-7 h-7 rounded-full bg-lafoi-green/15 border border-lafoi-green/30 flex items-center justify-center">
                      <Plus size={11} weight="bold" className="text-lafoi-green-light" />
                    </span>
                  </div>
                  <p
                    className="font-display font-light text-white leading-none tracking-[-0.03em]"
                    style={{ fontSize: 'clamp(3rem, 5vw, 5rem)' }}
                  >
                    <CountUpUI end={s.value} suffix={s.suffix} />
                  </p>
                  <p className="mt-5 lg:mt-6 text-xs lg:text-sm text-white/60 font-sora tracking-wide leading-relaxed">
                    {s.label}
                  </p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================================================================
   7. PROJECTS BENTO, asymmetric editorial bento with brutalist corner mark
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
              <div className="flex items-center gap-3 mb-5">
                <span className="block w-10 h-px bg-lafoi-green/60" />
                <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                  Selected work
                </p>
                <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray/50">07 / 10</span>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <h2 className="heading-xl text-lafoi-dark text-4xl sm:text-5xl lg:text-6xl">
                Rooms where the
                <br />
                <span className="font-display font-light text-lafoi-green">
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
              <span className="font-display font-light text-base">All case studies</span>
              <span className="w-10 h-10 rounded-full border border-lafoi-dark/20 group-hover:border-lafoi-green group-hover:bg-lafoi-green flex items-center justify-center transition-all duration-300">
                <ArrowRight
                  size={14}
                  weight="bold"
                  className="group-hover:text-white group-hover:translate-x-0.5 transition-all duration-300"
                />
              </span>
            </Link>
          </AnimatedSection>
        </div>

        {/* 1 large + 3 small in a column on the right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
          <AnimatedSection direction="up" className="lg:col-span-7">
            <BentoProject project={hero} large />
          </AnimatedSection>

          <div className="lg:col-span-5 grid grid-cols-1 gap-5 lg:gap-6">
            {rest.map((p, i) => (
              <AnimatedSection
                key={p.slug}
                direction="up"
                delay={0.05 + i * 0.05}
                className="h-full"
              >
                <BentoProject project={p} />
              </AnimatedSection>
            ))}
          </div>
        </div>

        <AnimatedSection delay={0.2} className="mt-14 flex justify-center">
          <Link
            to="/projects"
            className="font-display font-light text-2xl lg:text-3xl text-lafoi-dark hover:text-lafoi-green transition-colors duration-300 link-underline"
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
      className={`group relative block w-full rounded-3xl overflow-hidden bg-lafoi-dark ${
        large ? 'aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[640px]' : 'aspect-[16/10] lg:aspect-auto lg:min-h-[200px] lg:h-full'
      }`}
    >
      <OptimizedImage
        src={project.hero}
        alt={`${project.title}, ${project.vision}`}
        className="w-full h-full object-cover object-center group-hover:scale-[1.04] transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        fill
        vision={project.vision}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark via-lafoi-dark/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-br from-lafoi-dark/30 via-transparent to-transparent opacity-60" />

      <div className="absolute top-5 left-5 lg:top-6 lg:left-6">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-sora text-white/85 tracking-[0.2em] uppercase">
          {project.category}
        </span>
      </div>

      {/* brutalist corner mark, appears on hover */}
      <div className="corner-mark">
        <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M64 0 L64 64 L0 64 Z" fill="#1A8A2E" opacity="0.92" />
          <path d="M28 60 L60 28" stroke="#FAFAF8" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
      <div className="absolute bottom-3 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-150 pointer-events-none">
        <span className="font-sora text-[9px] tracking-[0.3em] uppercase text-white/95">
          {project.category}
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-7">
        <h3
          className={`font-display font-light text-white leading-[1.05] ${
            large ? 'text-3xl sm:text-4xl lg:text-[3.4rem]' : 'text-2xl lg:text-3xl'
          }`}
        >
          {project.title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-[11px] font-sora text-white/65 tracking-wide">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={11} weight="regular" />
            {project.location}
          </span>
          <span className="text-white/30">&middot;</span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={11} weight="regular" />
            {project.year}
          </span>
          <span className="text-white/30">&middot;</span>
          <span className="inline-flex items-center gap-1.5">
            <Ruler size={11} weight="regular" />
            {project.area}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2 text-lafoi-green-light font-sora text-xs font-semibold tracking-wider uppercase opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
          <span>View case study</span>
          <ArrowUpRight size={13} weight="bold" />
        </div>
      </div>
    </Link>
  )
}

/* ============================================================================
   8. TESTIMONIAL, typography-first pull-quote
   ============================================================================ */

function ReviewAvatar({ author, avatar }) {
  // Build initials from author name (first letter of first 1-2 words).
  const initials = author
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  if (avatar) {
    return (
      <span className="relative shrink-0 w-10 h-10 rounded-full overflow-hidden ring-2 ring-lafoi-green/20 ring-offset-2 ring-offset-lafoi-cream">
        <img
          src={avatar}
          alt={author}
          width="80"
          height="80"
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
      </span>
    )
  }

  return (
    <span
      className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center ring-2 ring-lafoi-green/20 ring-offset-2 ring-offset-lafoi-cream"
      style={{ background: 'linear-gradient(135deg, #1A8A2E 0%, #2FA841 100%)' }}
      aria-hidden
    >
      <span className="font-display font-light text-white text-sm leading-none tracking-tight">
        {initials || '·'}
      </span>
    </span>
  )
}

function Testimonial() {
  const [active, setActive] = useState(0)

  // auto-advance through real reviews
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % reviews.length), 7500)
    return () => clearInterval(id)
  }, [])

  const t = reviews[active]
  const clientNames = reviews.map((r) => r.author)

  return (
    <section className="relative bg-lafoi-cream py-28 lg:py-44 overflow-hidden">
      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="max-w-5xl mx-auto text-center relative">
          {/* RATING EYEBROW, verified Google reviews */}
          <AnimatedSection>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 mb-4">
              <span className="inline-flex items-center gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} size={14} weight="fill" className="text-lafoi-green-light" />
                ))}
              </span>
              <span className="font-display font-light italic text-lafoi-dark text-lg leading-none">
                {googleRating.average.toFixed(1)}
              </span>
              <span
                aria-hidden
                className="hidden sm:inline-block w-1 h-1 rounded-full bg-lafoi-gray/30"
              />
              <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-gray">
                {googleRating.count} Google reviews &middot; Verified clients
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 mb-10">
              <span className="block w-10 h-px bg-lafoi-green/60" />
              <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                Heard from clients
              </p>
              <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray/50">09 / 10</span>
              <span className="block w-10 h-px bg-lafoi-green/60" />
            </div>
          </AnimatedSection>

          {/* HUGE opening quote glyph behind the text */}
          <span
            aria-hidden
            className="absolute left-1/2 -translate-x-1/2 -top-2 lg:-top-6 font-display font-light italic text-lafoi-green/[0.08] leading-none pointer-events-none select-none"
            style={{ fontSize: 'clamp(10rem, 18vw, 22rem)' }}
          >
            “
          </span>

          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={active}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="font-display font-light italic text-lafoi-dark leading-[1.18] tracking-[-0.02em] mx-auto max-w-4xl"
                style={{ fontSize: 'clamp(1.7rem, 3.6vw, 3.4rem)' }}
              >
                {t.quote}
              </motion.blockquote>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={`meta-${active}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-10 lg:mt-14 flex flex-col items-center gap-3"
              >
                <span className="block w-10 h-px bg-lafoi-green" />
                <div className="flex items-center justify-center gap-3">
                  <ReviewAvatar author={t.author} avatar={t.avatar} />
                  <div className="text-left">
                    <p className="font-sora text-sm font-semibold text-lafoi-dark tracking-wide leading-tight">
                      {t.author}
                    </p>
                    <p className="text-xs font-general text-lafoi-gray leading-tight mt-0.5">
                      {t.role}
                    </p>
                  </div>
                </div>

                {/* Google verified badge, only when source is google */}
                {t.source === 'google' && (
                  <a
                    href={googleRating.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full border border-lafoi-dark/10 bg-white/60 hover:bg-white hover:border-lafoi-green/30 transition-colors duration-300"
                  >
                    <span
                      aria-hidden
                      className="font-display font-normal text-[13px] leading-none tracking-tight"
                      style={{
                        background: 'linear-gradient(135deg, #4285F4 0%, #EA4335 35%, #FBBC05 65%, #34A853 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      G
                    </span>
                    <span className="font-sora text-[10px] tracking-[0.18em] uppercase text-lafoi-gray group-hover:text-lafoi-dark transition-colors">
                      Verified Google review
                    </span>
                    <ArrowUpRight size={10} weight="bold" className="text-lafoi-gray/60 group-hover:text-lafoi-green transition-colors" />
                  </a>
                )}
              </motion.div>
            </AnimatePresence>

            {/* pagination dots */}
            <div className="mt-10 flex items-center justify-center gap-1.5 flex-wrap max-w-md mx-auto">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Show review ${i + 1}`}
                  onClick={() => setActive(i)}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i === active ? 'w-8 bg-lafoi-green' : 'w-3 bg-lafoi-dark/15 hover:bg-lafoi-dark/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* kinetic name marquee, sourced from reviews data */}
        <AnimatedSection delay={0.4} className="mt-20 lg:mt-28">
          <p className="text-center text-[10px] font-sora text-lafoi-gray tracking-[0.3em] uppercase mb-8">
            In good company
          </p>
          <div className="relative overflow-hidden marquee-pause">
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-lafoi-cream to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-lafoi-cream to-transparent z-10 pointer-events-none" />
            <div className="flex marquee-track whitespace-nowrap">
              {[...clientNames, ...clientNames].map((c, i) => (
                <span
                  key={i}
                  className="mx-8 font-display font-light italic text-2xl lg:text-3xl text-lafoi-gray/55"
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
   8.5  VIDEO SHOWCASE, bento of in-motion captures, modal player
   ============================================================================ */

function VideoShowcaseSection() {
  // Catalogue insight: every material category has a "Play video" affordance.
  // We adopt the pattern with our own footage. Five tiles: 1 large + 4 small.
  // Captions are intentionally generic, category-level, no fabricated clients.
  const videos = [
    {
      src: '/brand/videos/7.mp4',
      title: 'Studio in motion',
      caption: 'Stretch membrane install · Residential',
    },
    {
      src: '/brand/videos/27.mp4',
      title: 'Linear lighting reveal',
      caption: 'Custom feature · Office fit-out',
    },
    {
      src: '/brand/videos/35.mp4',
      title: 'Print ceiling installation',
      caption: 'Custom design · Hospitality',
    },
    {
      src: '/brand/videos/47.mp4',
      title: 'Acoustic ceiling',
      caption: 'Commercial space · Harare',
    },
    {
      src: '/brand/videos/28.mp4',
      title: 'Translucent backlit panel',
      caption: 'Hospitality · Feature install',
    },
  ]

  return (
    <section className="relative bg-lafoi-cream py-24 lg:py-36 overflow-hidden">
      <div aria-hidden className="absolute inset-0 mesh-gradient-1 opacity-40 pointer-events-none" />
      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14 lg:mb-20">
          <div className="max-w-2xl">
            <AnimatedSection>
              <div className="flex items-center gap-3 mb-5">
                <span className="block w-10 h-px bg-lafoi-green/60" />
                <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                  In motion
                </p>
                <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray/50">
                  08 / 10
                </span>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <h2 className="heading-xl text-lafoi-dark text-4xl sm:text-5xl lg:text-6xl">
                See it{' '}
                <span className="font-display italic font-light text-lafoi-green">
                  built.
                </span>
              </h2>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <p className="mt-6 max-w-xl text-base lg:text-[17px] text-lafoi-gray font-body font-light leading-[1.7]">
                {linkifyProse(
                  'Short captures from the studio floor, stretch membranes tensioned, lighting solutions calibrated, photographic membranes finished and signed off. The kind of detail that hides between the photographs in our portfolio.'
                )}
              </p>
            </AnimatedSection>
          </div>
          <AnimatedSection delay={0.2}>
            <Link
              to="/portfolio"
              className="group inline-flex items-center gap-3 text-lafoi-dark font-sora text-sm font-medium hover:text-lafoi-green transition-colors duration-300"
            >
              <span className="font-display font-light text-base">More in the gallery</span>
              <span className="w-10 h-10 rounded-full border border-lafoi-dark/20 group-hover:border-lafoi-green group-hover:bg-lafoi-green flex items-center justify-center transition-all duration-300">
                <ArrowRight
                  size={14}
                  weight="bold"
                  className="group-hover:text-white group-hover:translate-x-0.5 transition-all duration-300"
                />
              </span>
            </Link>
          </AnimatedSection>
        </div>

        <VideoShowcase videos={videos} layout="bento" />
      </div>
    </section>
  )
}

/* ============================================================================
   10. WHY LA FOI, 3×2 bento of pillars (replaces flat Partners block)
   ============================================================================ */

function WhyLaFoi() {
  const pillars = [
    {
      icon: Compass,
      title: 'Regional Pioneers',
      copy: 'Zimbabwe’s first dedicated stretch ceiling studio. Founded 2024 in Belgravia.',
    },
    {
      icon: Sparkle,
      title: 'Innovative & Modern',
      copy: 'Premium PVC and fabric membranes paired with bespoke architectural lighting design.',
    },
    {
      icon: Lightning,
      title: 'Fast & Cost Effective',
      copy: 'One to two day install per room, no demolition, no concealed delays.',
    },
    {
      icon: PaintBrush,
      title: 'Design Flexibility',
      copy: 'A wide colour range, photographic prints and translucent panels. Custom-cut to size.',
    },
    {
      icon: ShieldCheck,
      title: 'Durability & Safety',
      copy: 'Fire-rated B-s1 d0, anti-bacterial finish, fifteen-year manufacturer warranty.',
    },
    {
      icon: Leaf,
      title: 'Eco Friendly',
      copy: 'Removable, reusable membranes. Energy-efficient LED systems calibrated to your space.',
    },
  ]

  return (
    <section className="relative py-24 lg:py-32 bg-lafoi-cream overflow-hidden">
      <div className="absolute inset-0 mesh-gradient-1 opacity-50 pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-end mb-14 lg:mb-20">
          <AnimatedSection direction="left" className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-5">
              <span className="block w-10 h-px bg-lafoi-green/60" />
              <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                Why La Foi
              </p>
              <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray/50">10 / 10</span>
            </div>
            <h2 className="font-display font-light text-lafoi-dark text-4xl sm:text-5xl lg:text-[4rem] leading-[1.05] tracking-[-0.02em]">
              Six reasons to put
              <br />
              <span className="text-lafoi-green">our membrane on your ceiling.</span>
            </h2>
          </AnimatedSection>

          <AnimatedSection direction="right" className="lg:col-span-5">
            <p className="text-base lg:text-lg text-lafoi-gray font-general leading-relaxed">
              {linkifyProse(
                'We pioneered stretch ceilings in Zimbabwe and remain the country’s leading installer. Tensioned PVC and fabric membranes go up in one to two days, clean, fire-rated, fully washable, and finished in a wide colour range and printed designs.'
              )}
            </p>
          </AnimatedSection>
        </div>

        {/* SYMMETRIC 3×2 bento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {pillars.map((p, i) => {
            const Icon = p.icon
            return (
              <AnimatedSection key={p.title} delay={i * 0.05}>
                <div className="clay-lift group h-full p-7 lg:p-8 rounded-3xl bg-white/55 backdrop-blur-md border border-lafoi-green/10 hover:border-lafoi-green/30">
                  <div className="flex items-center gap-4 mb-5">
                    <span className="w-12 h-12 rounded-2xl bg-lafoi-green/10 border border-lafoi-green/20 flex items-center justify-center group-hover:bg-lafoi-green/15 transition-colors duration-500">
                      <Icon size={20} weight="duotone" className="text-lafoi-green" />
                    </span>
                    <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray/55">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="font-display font-normal text-2xl text-lafoi-dark leading-tight mb-3 tracking-tight">
                    {p.title}
                  </h3>
                  <p className="text-sm font-general text-lafoi-gray leading-relaxed">
                    {p.copy}
                  </p>
                </div>
              </AnimatedSection>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ============================================================================
   10. CINEMATIC CTA, split-tone, massive serif, symmetric CTAs
   ============================================================================ */

function CinematicCTA() {
  // Subtle "arrival" parallax, the background image scales (1 → 1.05) and
  // gently brightens as the user reaches the bottom of the page. Restrained.
  const ctaRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ctaRef,
    offset: ['start end', 'end end'],
  })
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.0, 1.05])
  const bgFilter = useTransform(scrollYProgress, [0, 1], ['brightness(0.92)', 'brightness(1.00)'])

  return (
    <section ref={ctaRef} className="relative min-h-[80vh] lg:min-h-[88vh] flex items-center overflow-hidden bg-lafoi-dark">
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{ scale: bgScale, filter: bgFilter }}
      >
        <OptimizedImage
          src="/brand/images/10.png"
          alt="Black gloss kitchen with mirror stretch ceiling and warm cove lighting"
          className="w-full h-full object-cover object-center"
          fill
          vision="Black gloss kitchen with mirror ceiling, luxe invitation to begin"
        />
        {/* SPLIT-TONE, dark on left, green-dark on right */}
        <div className="absolute inset-0 bg-gradient-to-r from-lafoi-dark/90 via-lafoi-dark/55 to-lafoi-green-dark/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/85 via-transparent to-lafoi-dark/35" />
      </motion.div>

      {/* limited slots pill, top-right within content margin */}
      <div className="absolute inset-x-0 top-8 lg:top-10 z-20 pointer-events-none">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex justify-end">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-lafoi-green-light pulse-dot" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-lafoi-green-light" />
            </span>
            <span className="font-sora text-[10px] tracking-[0.25em] uppercase text-white/85">
              Limited consultation slots
            </span>
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 w-full py-24 lg:py-32">
        <div className="max-w-4xl">
          <AnimatedSection>
            <div className="flex items-center gap-3 mb-7">
              <span className="block w-10 h-px bg-lafoi-green-light/60" />
              <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green-light">
                Free studio consultation
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <h2
              className="heading-xl text-white leading-[0.98] tracking-[-0.025em]"
              style={{ fontSize: 'clamp(3.5rem, 8vw, 8rem)', fontVariationSettings: '"opsz" 144' }}
            >
              <span className="block font-display font-light">Begin with</span>
              <span className="block">
                a <span className="font-display italic font-light text-lafoi-green-light">conversation.</span>
              </span>
            </h2>
          </AnimatedSection>

          <AnimatedSection delay={0.25}>
            <p className="mt-8 max-w-xl text-base lg:text-lg text-white/70 font-general leading-relaxed">
              {linkifyProse(
                'We visit, we measure, we listen. The first design consultation costs nothing and tends to clarify even the briefs that arrive uncertain. WhatsApp is the fastest channel, email if you would rather attach drawings, or browse our portfolio for context.',
                { variant: 'dark' }
              )}
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.4}>
            <div className="mt-12 flex flex-wrap items-center gap-4 lg:gap-5">
              <Link
                to="/contact"
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-lafoi-green-light text-white font-sora text-sm font-semibold hover:bg-lafoi-green transition-all duration-500 shadow-[0_8px_30px_rgba(34,197,94,0.25)]"
              >
                Start your project
                <ArrowRight
                  size={16}
                  weight="bold"
                  className="group-hover:translate-x-1 transition-transform duration-300"
                />
              </Link>
              <Link
                to="/projects"
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/8 backdrop-blur-md text-white font-sora text-sm font-semibold border border-white/25 hover:bg-white/12 hover:border-white/45 transition-all duration-500"
              >
                Explore portfolio
                <ArrowUpRight
                  size={16}
                  weight="bold"
                  className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300"
                />
              </Link>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.55}>
            <div className="mt-16 lg:mt-20 pt-8 border-t border-white/10 flex flex-wrap items-center gap-x-8 gap-y-3">
              {[
                { label: 'Studio', value: 'Belgravia, Harare' },
                { label: 'Phone', value: '+263 712 326 951' },
                { label: 'Hours', value: 'Mon-Fri · 09:00 to 17:00' },
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
