import React, { useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Trophy,
  Heart,
  Shield,
  Target,
  Users,
  Lightbulb,
  Sparkle,
  Buildings,
} from '@phosphor-icons/react'
import AnimatedSection from '../components/ui/AnimatedSection'
import OptimizedImage from '../components/ui/OptimizedImage'
import HeroSlideshow from '../components/ui/HeroSlideshow'
import { useSEO } from '../utils/seo'

const ABOUT_HERO_SLIDES = [
  {
    src: 'https://images.unsplash.com/photo-1639663742190-1b3dba2eebcf?w=2200&q=85',
    alt: 'Master suite with luminous stretch ceiling',
    vision: 'Heritage room — quiet light',
  },
  {
    src: 'https://images.unsplash.com/photo-1618259715220-a89a4e4da76b?w=2200&q=85',
    alt: 'Country hotel interior with elegant design',
    vision: 'Studio warmth and craft',
  },
  {
    src: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=2200&q=85',
    alt: 'Minimalist gallery space',
    vision: 'Restraint as a discipline',
  },
]

export default function About() {
  useSEO({
    title: 'Our Story',
    description:
      "Learn about La Foi Designs — Zimbabwe's first stretch ceiling provider. Our journey, values, and commitment to excellence.",
    path: '/about',
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <AboutHero />
      <Mission />
      <StoryTimeline />
      <Values />
      <Partners />
      <Team />
      <AboutCTA />
    </motion.div>
  )
}

/* ============================================================================
   1. HERO — Editorial heritage cover
   ============================================================================ */

function AboutHero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <section
      ref={ref}
      className="relative h-[100svh] min-h-[640px] flex flex-col overflow-hidden bg-lafoi-dark"
    >
      <HeroSlideshow slides={ABOUT_HERO_SLIDES} interval={6500} parallax overlay={false} />
      <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/90 via-lafoi-dark/40 to-lafoi-dark/55 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-lafoi-dark/55 via-transparent to-lafoi-dark/20 pointer-events-none" />

      {/* Volume artifact — top right */}
      <div className="absolute top-28 right-6 lg:top-32 lg:right-10 z-10 pointer-events-none flex items-center gap-3">
        <span className="hidden sm:block w-8 h-px bg-white/30" />
        <span className="font-sora text-[10px] tracking-[0.28em] uppercase text-white/65">
          Vol.&nbsp;02 &mdash; 2026 &middot; Heritage
        </span>
      </div>

      <motion.div
        className="relative z-10 flex-1 flex flex-col max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 w-full"
        style={{ opacity }}
      >
        {/* Eyebrow at top */}
        <motion.div
          className="pt-28 lg:pt-32"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/8 backdrop-blur-md border border-white/15">
            <Sparkle size={12} weight="fill" className="text-lafoi-green-light" />
            <span className="text-[10px] sm:text-[11px] font-sora text-white/85 font-medium tracking-[0.22em] uppercase">
              The studio &middot; Founded January 2024
            </span>
          </span>
        </motion.div>

        {/* Headline anchored bottom */}
        <div className="mt-auto pb-10 lg:pb-16 grid lg:grid-cols-12 gap-8 lg:gap-12 items-end">
          <motion.div
            className="lg:col-span-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1
              className="font-display text-white tracking-[-0.035em] leading-[0.98] text-[3rem] sm:text-[4.5rem] lg:text-[6.2rem] xl:text-[6.8rem]"
              style={{ fontVariationSettings: '"opsz" 144' }}
            >
              <span className="block font-light text-white/95">A studio</span>
              <span className="block">
                <span className="font-normal text-white">of </span>
                <span className="font-normal text-lafoi-green-light">attention</span>
                <span className="text-lafoi-green-light">.</span>
              </span>
            </h1>

            <motion.p
              className="mt-6 lg:mt-8 max-w-xl text-sm sm:text-base lg:text-[17px] text-white/70 font-body font-light leading-[1.55]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              Founded January 2024 in Belgravia, Harare. Built around a single conviction —
              the ceiling deserves the same care as the floor it sits above.
            </motion.p>
          </motion.div>

          {/* Asymmetric metadata card */}
          <motion.aside
            className="lg:col-span-4 hidden lg:block"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="ml-auto max-w-[300px] relative bg-white/[0.06] backdrop-blur-md border border-white/15 rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-lg rounded-bl-lg p-6 overflow-hidden">
              <div aria-hidden className="absolute inset-0 dot-pattern opacity-30 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <span className="block w-6 h-px bg-lafoi-green-light/70" />
                  <p className="font-sora text-[10px] font-semibold tracking-[0.28em] uppercase text-lafoi-green-light">
                    The numbers
                  </p>
                </div>
                <div className="space-y-3 font-body font-light text-[13px] text-white/75 leading-relaxed">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-white/50">Founded</span>
                    <span className="text-white">Jan 2024</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-white/50">Projects</span>
                    <span className="text-white">200+</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-white/50">Partners</span>
                    <span className="text-white">DE &middot; EE</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-white/50">Warranty</span>
                    <span className="text-white">15 years</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </motion.div>

      {/* scroll cue */}
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

/* ============================================================================
   2. MISSION — Duotone tile + offset stacked images
   ============================================================================ */

function Mission() {
  return (
    <section className="relative py-20 lg:py-32 bg-lafoi-cream overflow-hidden">
      <div className="absolute inset-0 pattern-cross-light opacity-50 pointer-events-none" />
      <div className="absolute inset-0 mesh-gradient-1 pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          {/* Text column */}
          <AnimatedSection direction="left" className="lg:col-span-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="block w-12 h-px bg-lafoi-green/60" />
              <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                Our mission
              </p>
              <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray/50">
                01 / 06
              </span>
            </div>

            <h2 className="font-display font-light text-lafoi-dark text-3xl sm:text-4xl lg:text-[3.4rem] leading-[1.1] tracking-[-0.02em] mb-8">
              World-class ceiling technology,{' '}
              <span className="text-lafoi-green">brought home</span>{' '}
              to Zimbabwe.
            </h2>

            <div className="space-y-5 font-body font-light text-base lg:text-[17px] text-lafoi-gray leading-[1.7] max-w-xl">
              <p>
                We believe every room deserves to be extraordinary. By partnering with the finest
                European manufacturers and investing deeply in our team's expertise, we deliver
                ceiling solutions that transform ordinary spaces into experiences.
              </p>
              <p className="text-lafoi-gray/85">
                Founded in January 2024 to bring a technology Zimbabwe had never seen — and built
                around the conviction that the ceiling, not the floor, is where a room begins.
              </p>
            </div>

            <div className="mt-10 pt-8 border-t border-lafoi-dark/10 flex items-center gap-6">
              <div>
                <p className="font-display font-light text-3xl text-lafoi-dark leading-none">200+</p>
                <p className="text-[11px] font-sora tracking-[0.2em] uppercase text-lafoi-gray-medium mt-2">
                  Rooms transformed
                </p>
              </div>
              <span className="block w-px h-12 bg-lafoi-dark/15" />
              <div>
                <p className="font-display font-light text-3xl text-lafoi-dark leading-none">2</p>
                <p className="text-[11px] font-sora tracking-[0.2em] uppercase text-lafoi-gray-medium mt-2">
                  European partners
                </p>
              </div>
              <span className="block w-px h-12 bg-lafoi-dark/15" />
              <div>
                <p className="font-display font-light text-3xl text-lafoi-dark leading-none">15<span className="text-xl">y</span></p>
                <p className="text-[11px] font-sora tracking-[0.2em] uppercase text-lafoi-gray-medium mt-2">
                  Warranty
                </p>
              </div>
            </div>
          </AnimatedSection>

          {/* Image column — duotone + offset */}
          <AnimatedSection direction="right" className="lg:col-span-6 relative">
            <div className="relative h-[440px] lg:h-[560px]">
              {/* Back image — rotated, low opacity */}
              <div
                className="absolute -top-4 -left-4 w-[60%] h-[55%] rounded-3xl overflow-hidden opacity-60 hidden lg:block"
                style={{ transform: 'rotate(-3deg)' }}
              >
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=900&q=80"
                  alt=""
                  className="w-full h-full object-cover grayscale"
                  fill
                  vision="Calm gallery space — secondary frame"
                />
              </div>

              {/* Front — duotone over green panel */}
              <div className="absolute top-0 right-0 w-full lg:w-[80%] h-full rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-2xl rounded-bl-2xl overflow-hidden bg-lafoi-green">
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1638284457192-27d3d0ec51aa?w=1200&q=80"
                  alt="La Foi Designs studio scene"
                  className="w-full h-full object-cover object-center"
                  fill
                  vision="Calm contemporary living room — duotone studio scene"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-lafoi-green mix-blend-multiply"
                  style={{ opacity: 0.55 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/30 via-transparent to-transparent" />

                {/* Caption — bottom left */}
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="block w-8 h-px bg-white/60 mb-3" />
                  <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-white/85">
                    Belgravia, Harare &middot; The studio
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

/* ============================================================================
   3. STORY TIMELINE — Editorial alternating spreads
   ============================================================================ */

function StoryTimeline() {
  const milestones = [
    {
      year: '2024',
      sub: 'January',
      title: 'The beginning',
      copy: 'La Foi Designs is founded with a single bold mission — to bring world-class stretch ceiling technology to Zimbabwe for the very first time.',
    },
    {
      year: 'Q1',
      sub: '2024',
      title: 'European partnerships',
      copy: 'We partnered with top-tier suppliers from Germany and Estonia, gaining access to the highest quality materials and most advanced ceiling technologies in the world.',
    },
    {
      year: 'Q2',
      sub: '2024',
      title: 'Expert training',
      copy: 'Our team underwent intensive hands-on training with our European partners, mastering installation techniques, design principles, and quality standards.',
    },
    {
      year: '200+',
      sub: 'Rooms',
      title: 'Transforming Zimbabwe',
      copy: "With over 200 projects completed, we've become the trusted name in stretch ceilings across residential, commercial, and hospitality sectors.",
    },
  ]

  return (
    <section className="relative py-24 lg:py-36 bg-lafoi-dark overflow-hidden">
      <div className="absolute inset-0 pattern-blueprint-light opacity-50 pointer-events-none" />
      <div className="absolute inset-0 dot-pattern opacity-15 pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Section header */}
        <div className="max-w-3xl mb-16 lg:mb-24">
          <AnimatedSection>
            <div className="flex items-center gap-3 mb-6">
              <span className="block w-12 h-px bg-lafoi-green-light/60" />
              <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green-light">
                The journey
              </p>
              <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-white/30">
                02 / 06
              </span>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h2 className="font-display font-light text-white text-4xl sm:text-5xl lg:text-[3.6rem] leading-[1.1] tracking-[-0.02em]">
              A short history of{' '}
              <span className="text-lafoi-green-light">firsts</span>.
            </h2>
          </AnimatedSection>
        </div>

        {/* Milestones — alternating left/right with massive numerals */}
        <div className="space-y-20 lg:space-y-32">
          {milestones.map((m, i) => {
            const isLeft = i % 2 === 0
            return (
              <Milestone
                key={m.title}
                m={m}
                index={i}
                total={milestones.length}
                align={isLeft ? 'left' : 'right'}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Milestone({ m, index, total, align }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <motion.div
      ref={ref}
      className={`grid lg:grid-cols-12 gap-8 lg:gap-12 items-center ${
        align === 'right' ? 'lg:[&>*:first-child]:order-2' : ''
      }`}
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Massive year numeral */}
      <div className={`lg:col-span-5 ${align === 'right' ? 'lg:text-right' : ''}`}>
        <div className="flex items-baseline gap-4 mb-2">
          <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-green-light/70">
            0{index + 1} / 0{total}
          </span>
          <span className="block w-16 h-px bg-white/20" />
        </div>
        <p
          className="font-display font-light text-lafoi-green-light leading-[0.85] tracking-[-0.04em] text-[7rem] sm:text-[10rem] lg:text-[11rem]"
          style={{ fontVariationSettings: '"opsz" 144' }}
        >
          {m.year}
        </p>
        <p className="font-sora text-xs tracking-[0.28em] uppercase text-white/55 mt-3">
          {m.sub}
        </p>
      </div>

      {/* Body */}
      <div className="lg:col-span-7">
        <span className="block w-10 h-px bg-lafoi-green-light/60 mb-6" />
        <h3 className="font-display font-light text-white text-3xl sm:text-4xl lg:text-5xl leading-[1.1] mb-5 tracking-[-0.01em]">
          {m.title}
        </h3>
        <p className="font-body font-light text-white/65 text-base lg:text-lg leading-[1.7] max-w-2xl">
          {m.copy}
        </p>
      </div>
    </motion.div>
  )
}

/* ============================================================================
   4. VALUES — Editorial bento (2 image features + 4 typographic)
   ============================================================================ */

function Values() {
  const values = [
    {
      key: 'excellence',
      title: 'Excellence',
      desc: 'Every project meets international standards backed by our German and Estonian partners.',
      image: 'https://images.unsplash.com/photo-1768270181430-3e3672a32283?w=1200&q=80',
      vision: 'Excellence — refined retail showroom ceiling',
      icon: Trophy,
      feature: true,
    },
    {
      key: 'passion',
      title: 'Passion',
      desc: 'We are driven by a genuine love for transforming spaces and exceeding expectations.',
      icon: Heart,
    },
    {
      key: 'integrity',
      title: 'Integrity',
      desc: 'Transparent pricing, honest timelines, and unwavering commitment to quality.',
      icon: Shield,
    },
    {
      key: 'innovation',
      title: 'Innovation',
      desc: 'Constantly adopting the latest technologies and design techniques from around the world.',
      image: 'https://images.unsplash.com/photo-1758194090785-8e09b7288199?w=1200&q=80',
      vision: 'Innovation — luminous translucent ceiling installation',
      icon: Lightbulb,
      feature: true,
    },
    {
      key: 'collaboration',
      title: 'Collaboration',
      desc: 'We work closely with clients, designers, and architects to bring visions to life.',
      icon: Users,
    },
    {
      key: 'precision',
      title: 'Precision',
      desc: 'Every measurement, cut, and installation is executed with meticulous attention to detail.',
      icon: Target,
    },
  ]

  return (
    <section className="relative py-24 lg:py-32 bg-lafoi-cream overflow-hidden">
      <div className="absolute inset-0 mesh-gradient-1 pointer-events-none" />
      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14 lg:mb-20">
          <div className="max-w-2xl">
            <AnimatedSection>
              <div className="flex items-center gap-3 mb-5">
                <span className="block w-10 h-px bg-lafoi-green/60" />
                <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                  What we hold
                </p>
                <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray/50">
                  03 / 06
                </span>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <h2 className="font-display font-light text-lafoi-dark text-4xl sm:text-5xl lg:text-[3.6rem] leading-[1.05] tracking-[-0.02em]">
                Six principles.{' '}
                <span className="text-lafoi-green">One studio.</span>
              </h2>
            </AnimatedSection>
          </div>
          <AnimatedSection delay={0.2}>
            <p className="font-body text-lafoi-gray max-w-sm leading-relaxed">
              More than a company — a team united by shared values that inform every decision and
              every project we accept.
            </p>
          </AnimatedSection>
        </div>

        {/* Bento — 6 cells across 12 cols, 2 are large image features */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 auto-rows-auto">
          {/* Excellence — image feature, spans 6 */}
          <AnimatedSection direction="up" className="lg:col-span-6 lg:row-span-2">
            <ValueImageCard v={values[0]} index={0} />
          </AnimatedSection>

          {/* Passion — typographic */}
          <AnimatedSection direction="up" delay={0.05} className="lg:col-span-3">
            <ValueTypoCard v={values[1]} index={1} />
          </AnimatedSection>

          {/* Integrity — typographic */}
          <AnimatedSection direction="up" delay={0.1} className="lg:col-span-3">
            <ValueTypoCard v={values[2]} index={2} />
          </AnimatedSection>

          {/* Collaboration — typographic */}
          <AnimatedSection direction="up" delay={0.15} className="lg:col-span-3">
            <ValueTypoCard v={values[4]} index={4} />
          </AnimatedSection>

          {/* Precision — typographic */}
          <AnimatedSection direction="up" delay={0.2} className="lg:col-span-3">
            <ValueTypoCard v={values[5]} index={5} />
          </AnimatedSection>

          {/* Innovation — image feature, spans 12 */}
          <AnimatedSection direction="up" delay={0.25} className="lg:col-span-12">
            <ValueImageCard v={values[3]} index={3} wide />
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

function ValueImageCard({ v, index, wide = false }) {
  return (
    <div
      className={`relative h-full overflow-hidden bg-lafoi-dark ${
        wide ? 'aspect-[16/6] rounded-3xl' : 'min-h-[420px] rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-2xl rounded-bl-2xl'
      }`}
    >
      <OptimizedImage
        src={v.image}
        alt={v.title}
        className="w-full h-full object-cover object-center"
        fill
        vision={v.vision}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark via-lafoi-dark/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-br from-lafoi-dark/40 via-transparent to-transparent opacity-70" />

      <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
        <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-white/65">
          0{index + 1} / 06
        </span>
        <span className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">
          <v.icon size={14} weight="regular" className="text-white/75" />
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-7 lg:p-9">
        <span className="block w-10 h-px bg-lafoi-green-light/70 mb-4" />
        <h3 className="font-display font-light text-white text-3xl lg:text-4xl xl:text-5xl leading-[1.05] mb-4">
          {v.title}
        </h3>
        <p className="font-body font-light text-white/70 text-sm lg:text-base leading-relaxed max-w-md">
          {v.desc}
        </p>
      </div>
    </div>
  )
}

function ValueTypoCard({ v, index }) {
  return (
    <div className="group h-full p-7 lg:p-8 rounded-3xl border border-lafoi-dark/10 bg-white/40 backdrop-blur-sm hover:bg-white hover:border-lafoi-green/30 transition-all duration-500">
      <div className="flex items-baseline justify-between mb-6">
        <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">
          0{index + 1}
        </span>
        <v.icon size={16} weight="regular" className="text-lafoi-green/70 group-hover:text-lafoi-green transition-colors duration-500" />
      </div>
      <span className="block w-8 h-px bg-lafoi-green/60 mb-5" />
      <h3 className="font-display font-light text-lafoi-dark text-2xl lg:text-3xl mb-4 leading-[1.1]">
        {v.title}
      </h3>
      <p className="font-body font-light text-sm text-lafoi-gray leading-[1.7]">{v.desc}</p>
    </div>
  )
}

/* ============================================================================
   5. PARTNERS — Two tall editorial cards
   ============================================================================ */

function Partners() {
  const partners = [
    {
      country: 'Germany',
      role: 'Membrane engineering',
      title: 'German Engineering',
      desc: 'Precision-manufactured PVC and fabric membranes meeting strict EU quality and fire safety standards. Our German partners bring decades of stretch ceiling expertise.',
      features: [
        { label: 'Fire-rated', detail: 'Class B-s1, d0 — self-extinguishing' },
        { label: 'UV-resistant', detail: 'Pigment-locked, colour-stable' },
        { label: 'Eco-friendly', detail: 'REACH-compliant production' },
        { label: 'Warranty', detail: '15-year manufacturer backing' },
      ],
      pattern: true,
    },
    {
      country: 'Estonia',
      role: 'Photographic print',
      title: 'Estonian Innovation',
      desc: "Cutting-edge printing technology and LED integration systems from one of Europe's most innovative ceiling technology companies.",
      features: [
        { label: 'HD printing', detail: '1440 dpi UV pigment, large format' },
        { label: 'Smart LED', detail: 'DMX, DALI and home-system ready' },
        { label: 'Acoustic', detail: 'Micro-perforated, NRC up to 0.90' },
        { label: 'Custom', detail: 'Bespoke runs from a single panel' },
      ],
    },
  ]

  return (
    <section className="relative py-24 lg:py-32 bg-lafoi-cream overflow-hidden">
      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="max-w-3xl mb-16 lg:mb-20">
          <AnimatedSection>
            <div className="flex items-center gap-3 mb-5">
              <span className="block w-10 h-px bg-lafoi-green/60" />
              <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                Provenance
              </p>
              <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray/50">
                04 / 06
              </span>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h2 className="font-display font-light text-lafoi-dark text-4xl sm:text-5xl lg:text-[3.6rem] leading-[1.05] tracking-[-0.02em]">
              Engineered in Europe,{' '}
              <span className="text-lafoi-green">installed in Zimbabwe</span>.
            </h2>
          </AnimatedSection>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {partners.map((p, i) => (
            <AnimatedSection key={p.country} delay={i * 0.08} direction="up">
              <PartnerCard p={p} />
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

function PartnerCard({ p }) {
  return (
    <div className="relative h-full p-8 lg:p-10 rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-2xl rounded-bl-2xl border border-lafoi-dark/10 bg-white overflow-hidden hover:border-lafoi-green/30 transition-colors duration-500">
      {p.pattern && (
        <div aria-hidden className="absolute inset-0 pattern-blueprint opacity-25 pointer-events-none" />
      )}

      <div className="relative">
        <div className="flex items-baseline justify-between mb-8">
          <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
            {p.country}
          </p>
          <span className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray-medium">
            {p.role}
          </span>
        </div>

        <h3 className="font-display font-light text-lafoi-dark text-3xl lg:text-4xl xl:text-[2.6rem] leading-[1.1] mb-6 tracking-[-0.01em]">
          {p.title}
        </h3>

        <p className="font-body font-light text-base text-lafoi-gray leading-relaxed mb-10 max-w-md">
          {p.desc}
        </p>

        {/* Features as hairline-divided rows, alternating em-dash / hairline */}
        <div className="space-y-0 border-t border-lafoi-dark/10">
          {p.features.map((f, idx) => (
            <div
              key={f.label}
              className="flex items-baseline justify-between gap-6 py-4 border-b border-lafoi-dark/10"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">
                  0{idx + 1}
                </span>
                <span className="font-display font-normal text-lafoi-dark text-lg">{f.label}</span>
              </div>
              <span className="font-body font-light text-xs lg:text-sm text-lafoi-gray text-right max-w-[60%]">
                {f.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ============================================================================
   6. TEAM — Restrained editorial
   ============================================================================ */

function Team() {
  const credentials = [
    'Certified by European manufacturing partners',
    'Specialised in residential and commercial installations',
    'Ongoing training in latest ceiling technologies',
    'Dedicated project managers for every job',
  ]

  return (
    <section className="relative py-24 lg:py-32 bg-lafoi-dark overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-15 pointer-events-none" />
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 100% 0%, rgba(34,197,94,0.08), transparent 50%), radial-gradient(ellipse at 0% 100%, rgba(26,138,46,0.06), transparent 50%)',
        }}
      />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          {/* Left — copy */}
          <div className="lg:col-span-6">
            <AnimatedSection>
              <div className="flex items-center gap-3 mb-6">
                <span className="block w-12 h-px bg-lafoi-green-light/60" />
                <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green-light">
                  The team
                </p>
                <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-white/30">
                  05 / 06
                </span>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <h2 className="font-display font-light text-white text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.1] tracking-[-0.02em] mb-7">
                Trained in Europe.{' '}
                <span className="text-lafoi-green-light">Patient at home.</span>
              </h2>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <p className="font-body font-light text-base lg:text-lg text-white/65 leading-[1.75] mb-10 max-w-xl">
                Our team underwent extensive training with our German and Estonian partners,
                mastering the art and science of stretch ceiling installation. Every member brings
                dedication, skill, and an unwavering eye for detail.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <div className="space-y-0 border-t border-white/10 mb-10">
                {credentials.map((c, i) => (
                  <div
                    key={c}
                    className="flex items-baseline gap-5 py-4 border-b border-white/10"
                  >
                    <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-green-light/70 shrink-0">
                      0{i + 1}
                    </span>
                    <span className="font-body font-light text-sm lg:text-base text-white/80 leading-snug">
                      {c}
                    </span>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.4}>
              <Link
                to="/careers"
                className="group inline-flex items-center gap-3 text-white font-sora text-sm font-medium pb-1 border-b border-white/30 hover:border-lafoi-green-light hover:text-lafoi-green-light transition-colors duration-300"
              >
                <span className="font-display font-light text-base">Join the team</span>
                <ArrowUpRight
                  size={14}
                  weight="bold"
                  className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300"
                />
              </Link>
            </AnimatedSection>
          </div>

          {/* Right — single team frame, glass border + asymmetric corners */}
          <AnimatedSection direction="right" className="lg:col-span-6 relative">
            <div className="relative aspect-[4/5] rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-2xl rounded-bl-2xl overflow-hidden border border-white/10">
              <OptimizedImage
                src="https://images.unsplash.com/photo-1758691736975-9f7f643d178e?w=1200&q=80"
                alt="La Foi Designs team"
                className="w-full h-full object-cover object-center"
                fill
                vision="Internationally trained team — locally dedicated"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/85 via-lafoi-dark/15 to-transparent" />

              {/* metadata strip — bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-7 lg:p-9">
                <span className="block w-10 h-px bg-lafoi-green-light/70 mb-4" />
                <p className="font-display font-normal text-white text-2xl lg:text-3xl leading-tight mb-2">
                  Internationally trained.
                </p>
                <p className="font-display font-light text-white/85 text-2xl lg:text-3xl leading-tight">
                  Locally dedicated.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

/* ============================================================================
   7. CTA — Cinematic full-bleed
   ============================================================================ */

function AboutCTA() {
  return (
    <section className="relative min-h-[80vh] lg:min-h-[88vh] flex items-center overflow-hidden bg-lafoi-dark">
      <div className="absolute inset-0">
        <OptimizedImage
          src="https://images.unsplash.com/photo-1758194090785-8e09b7288199?w=2000&q=85"
          alt="Luxury interior with luminous ceiling"
          className="w-full h-full object-cover object-center"
          fill
          vision="Luminous translucent ceiling — invitation to begin"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/85 via-lafoi-dark/30 to-lafoi-dark/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-lafoi-dark/55 via-transparent to-lafoi-dark/30" />
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 w-full py-24 lg:py-32">
        <div className="max-w-3xl">
          <AnimatedSection>
            <div className="flex items-center gap-3 mb-7">
              <span className="block w-12 h-px bg-lafoi-green-light/70" />
              <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green-light">
                Free studio consultation
              </p>
              <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-white/30">
                06 / 06
              </span>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <h2 className="font-display text-white text-5xl sm:text-6xl lg:text-[5.2rem] xl:text-[6rem] leading-[1.02] tracking-[-0.025em]">
              <span className="block font-light">Ready to work</span>
              <span className="block font-normal">with the best?</span>
            </h2>
          </AnimatedSection>

          <AnimatedSection delay={0.25}>
            <p className="mt-8 max-w-xl text-base lg:text-lg text-white/70 font-body font-light leading-relaxed">
              Experience the La Foi difference. Book a free consultation and let us show you what's
              possible — at no cost, no obligation, no rush.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.4}>
            <div className="mt-12 flex flex-wrap items-center gap-4 lg:gap-5">
              <Link
                to="/contact"
                className="group inline-flex items-center gap-3 px-7 py-4 rounded-full bg-lafoi-green-light text-white font-sora text-sm font-semibold hover:bg-lafoi-green transition-all duration-500 shadow-[0_8px_30px_rgba(34,197,94,0.25)]"
              >
                Begin a conversation
                <ArrowRight
                  size={16}
                  weight="bold"
                  className="group-hover:translate-x-1 transition-transform duration-300"
                />
              </Link>
              <a
                href="tel:+263712326951"
                className="group inline-flex items-center gap-3 px-7 py-4 rounded-full bg-white/10 backdrop-blur-md text-white font-sora text-sm font-semibold border border-white/20 hover:bg-white/15 hover:border-white/40 transition-all duration-500"
              >
                +263 712 326 951
                <ArrowUpRight
                  size={16}
                  weight="bold"
                  className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300"
                />
              </a>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.55}>
            <div className="mt-16 lg:mt-20 pt-8 border-t border-white/10 flex flex-wrap items-center gap-x-8 gap-y-3">
              {[
                { label: 'Studio', value: 'Belgravia, Harare' },
                { label: 'Email', value: 'admin@lafoidesigns.co.zw' },
                { label: 'Hours', value: 'Mon–Fri · 09:00–17:00' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-[10px] font-sora text-lafoi-green-light tracking-[0.25em] uppercase">
                    {item.label}
                  </span>
                  <span className="text-sm font-body text-white/70">{item.value}</span>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}
