import React, { useRef } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
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
  DownloadSimple,
  FilePdf,
} from '@phosphor-icons/react'
import AnimatedSection from '../components/ui/AnimatedSection'
import OptimizedImage from '../components/ui/OptimizedImage'
import SectionDivider from '../components/ui/SectionDivider'
import ScrollReveal from '../components/ui/ScrollReveal'
import AnimatedHeading from '../components/ui/AnimatedHeading'
import KineticTextStrip from '../components/ui/KineticTextStrip'
import { useSEO, breadcrumbsLd } from '../utils/seo'
import { linkifyProse } from '../utils/linkify.jsx'

export default function About() {
  useSEO({
    title: 'About La Foi Designs | Stretch Ceiling Experts',
    description:
      "Learn about La Foi Designs, Zimbabwe's stretch ceiling and architectural lighting specialist. Founded January 2024 in Belgravia, Harare. Our team, our standards, our approach.",
    path: '/about',
    image: '/brand/images/30.png',
    jsonLd: breadcrumbsLd([
      { name: 'Home', path: '/' },
      { name: 'About', path: '/about' },
    ]),
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <AboutHero />
      <SectionDivider shape="angular" from="cream" to="dark" />
      <Mission />
      <StoryTimeline />
      <SectionDivider shape="organic-blob" from="dark" to="cream" />
      <Values />
      <KineticTextStrip variant="dark" speed={70} />
      <SectionDivider shape="s-curve" from="cream" to="cream" />
      <Partners />
      <SectionDivider shape="big-wave" from="cream" to="dark" />
      <Team />
      <AboutCTA />
    </motion.div>
  )
}

/* ============================================================================
   1. HERO, Editorial heritage cover
   ============================================================================ */

function AboutHero() {
  // Full-bleed warm hero. The brand image fills the whole section including
  // the area behind the transparent navbar. Sepia / honey overlays warm it
  // toward the brand tone; a left-side cream gradient keeps the headline
  // legible without dimming the right side.
  return (
    <section className="relative bg-lafoi-cream overflow-hidden -mt-16 lg:-mt-20 pt-40 lg:pt-52 pb-20 lg:pb-28">
      {/* Base, full-bleed brand stretch-ceiling photograph */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url(/brand/images/1.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 1,
        }}
      />

      {/* Warm sepia / honey wash, multiply-blends with the photo so the room reads candlelit, never magazine-flat */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none mix-blend-multiply"
        style={{
          background:
            'linear-gradient(125deg, rgba(255,228,180,0.30) 0%, rgba(228,180,120,0.14) 45%, rgba(212,140,80,0.10) 100%)',
        }}
      />

      {/* Localized scrim behind the typography column only — radial fade in the bottom-left quadrant so the headline holds against any tonal surprise in the image, and the rest of the picture stays open and visible */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 80% at 22% 60%, rgba(17,17,17,0.55) 0%, rgba(17,17,17,0.25) 45%, rgba(17,17,17,0) 70%)',
        }}
      />

      {/* Top fade, so the white wordmark in the navbar holds against the image */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-40 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(17,17,17,0.45) 0%, rgba(17,17,17,0) 100%)',
        }}
      />

      {/* Volume artifact, respects content margin */}
      <div className="absolute inset-x-0 top-32 lg:top-40 z-10 pointer-events-none">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-end gap-3">
          <span className="hidden sm:block w-8 h-px bg-white/45" />
          <span className="font-sora text-[10px] tracking-[0.28em] uppercase text-white/80">
            Vol.&nbsp;02, 2026 &middot; Heritage
          </span>
        </div>
      </div>

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-stretch">
          {/* LEFT, typography sits over the warm image, breathing room on the right */}
          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-3 mb-7">
              <span className="block w-12 h-px bg-lafoi-green-light/80" />
              <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green-light">
                Who we are
              </p>
            </div>

            <h1
              className="font-display text-white tracking-[-0.035em] leading-[0.98] text-[3rem] sm:text-[4.5rem] lg:text-[5.5rem] xl:text-[6rem] [text-shadow:0_2px_30px_rgba(0,0,0,0.35)]"
              style={{ fontVariationSettings: '"opsz" 144' }}
            >
              <AnimatedHeading
                as="span"
                text="A studio of"
                className="block font-light"
                staggerChildren={0.06}
              />
              <AnimatedHeading
                as="span"
                text="attention."
                className="block italic font-light text-lafoi-green-light"
                delay={0.18}
                staggerChildren={0.06}
              />
            </h1>

            <div className="mt-8 space-y-5 font-body font-light text-base lg:text-[17px] text-white/90 leading-[1.7] max-w-md [text-shadow:0_1px_12px_rgba(0,0,0,0.4)]">
              <p>
                {linkifyProse(
                  'Founded January 2024 in Belgravia, Harare, Zimbabwe’s first dedicated stretch ceiling and architectural lighting studio.'
                )}
              </p>
              <p className="text-white/80">
                {linkifyProse(
                  'Built around a single conviction: the ceiling deserves the same care as the floor it sits above. Premium PVC and fabric stretch membranes, paired with bespoke lighting solutions, installed in one to two days per room.'
                )}
              </p>
            </div>

            {/* Stat strip, 3 hairline-divided cells with cascade reveal */}
            <div className="mt-10 pt-7 border-t border-white/20 grid grid-cols-3 gap-x-4">
              {[
                { k: 'Founded', v: '2024' },
                { k: 'Studio', v: 'Belgravia' },
                { k: 'Origin', v: 'Regional first' },
              ].map((s, i) => (
                <AnimatedSection key={s.k} direction="up" delay={i * 0.08}>
                  <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-white/60 mb-2">
                    {s.k}
                  </p>
                  <p className="font-display font-light text-white text-lg lg:text-xl leading-tight">
                    {s.v}
                  </p>
                </AnimatedSection>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}

/* ============================================================================
   2. MISSION, Duotone tile + offset stacked images
   ============================================================================ */

function Mission() {
  // Brutalist split-screen, full-bleed, dark plate (left) + raw image (right).
  // SUBTLE PARALLAX on the right photo, drifts ~50px down as the section
  // scrolls past, while the dark text plate stays still.
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const photoY = useTransform(scrollYProgress, [0, 1], [-30, 60])

  return (
    <section ref={sectionRef} className="relative bg-lafoi-dark overflow-hidden">
      <div className="grid lg:grid-cols-2 lg:min-h-[88vh]">
        {/* LEFT, dark plate with mission copy */}
        <div className="relative bg-lafoi-dark order-2 lg:order-1">
          <div aria-hidden className="absolute inset-0 aurora-mesh pointer-events-none" />

          {/* Hairline green seam, right edge of dark plate (desktop only) */}
          <span
            aria-hidden
            className="hidden lg:block absolute top-0 right-0 w-px h-full bg-lafoi-green/30 pointer-events-none z-10"
          />

          <div className="relative h-full p-8 lg:p-16 xl:p-24 flex flex-col justify-center">
            <AnimatedSection>
              <div className="flex items-center gap-3 mb-7">
                <span className="block w-12 h-px bg-lafoi-green-light/60" />
                <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green-light">
                  Our mission
                </p>
                <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-white/30">
                  01 / 06
                </span>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <h2 className="font-display font-light text-white text-3xl sm:text-4xl lg:text-[3.2rem] xl:text-[3.6rem] leading-[1.08] tracking-[-0.02em] mb-8 max-w-xl">
                World-class ceiling technology,{' '}
                <span className="italic text-lafoi-green-light">brought home</span>{' '}
                to Zimbabwe.
              </h2>
            </AnimatedSection>

            <AnimatedSection delay={0.18} direction="left">
              <div className="space-y-5 font-body font-light text-base lg:text-[17px] text-white/70 leading-[1.7] max-w-lg">
                <p>
                  {linkifyProse(
                    'We transform interior spaces with durable, visually stunning, and versatile stretch ceilings that meet the highest standards of quality and design, pioneering a finish that, until 2024, no studio in Zimbabwe could specify.',
                    { variant: 'dark' }
                  )}
                </p>
                <p className="text-white/55">
                  {linkifyProse(
                    'Founded in 2024 in Belgravia, Harare, around a single conviction: the ceiling, not the floor, is where a room begins. Read the full company profile or browse our portfolio to see the work.',
                    { variant: 'dark' }
                  )}
                </p>
              </div>
            </AnimatedSection>

            {/* Slim metric strip, hairline divided */}
            <AnimatedSection delay={0.25}>
              <div className="mt-10 pt-7 border-t border-white/15 grid grid-cols-3 gap-x-4 max-w-lg">
                <div>
                  <p className="font-display font-light text-2xl lg:text-3xl text-white leading-none">
                    1<span className="text-base lg:text-lg">st</span>
                  </p>
                  <p className="text-[10px] font-sora tracking-[0.22em] uppercase text-white/45 mt-2 leading-snug">
                    In Zimbabwe
                  </p>
                </div>
                <div className="border-l border-white/10 pl-4">
                  <p className="font-display font-light text-2xl lg:text-3xl text-white leading-none">
                    1 to 2<span className="text-base lg:text-lg">d</span>
                  </p>
                  <p className="text-[10px] font-sora tracking-[0.22em] uppercase text-white/45 mt-2 leading-snug">
                    Typical install
                  </p>
                </div>
                <div className="border-l border-white/10 pl-4">
                  <p className="font-display font-light text-2xl lg:text-3xl text-white leading-none">
                    10<span className="text-base lg:text-lg">yr</span>
                  </p>
                  <p className="text-[10px] font-sora tracking-[0.22em] uppercase text-white/45 mt-2 leading-snug">
                    Mfr. warranty
                  </p>
                </div>
              </div>
            </AnimatedSection>

            {/* Downloads, restyled for dark BG: transparent card, green accent border */}
            <AnimatedSection delay={0.32}>
              <div className="mt-10 relative rounded-tl-[1.6rem] rounded-br-[1.6rem] rounded-tr-2xl rounded-bl-2xl bg-white/[0.04] backdrop-blur-sm border border-lafoi-green-light/25 overflow-hidden max-w-lg">
                <span
                  aria-hidden
                  className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-lafoi-green-light via-lafoi-green-light/70 to-lafoi-green-light/30"
                />
                <div className="p-6 lg:p-7">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-9 h-9 rounded-xl bg-lafoi-green-light/15 border border-lafoi-green-light/30 flex items-center justify-center">
                      <FilePdf size={16} weight="duotone" className="text-lafoi-green-light" />
                    </span>
                    <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-green-light font-semibold">
                      Resources &middot; PDF
                    </p>
                  </div>
                  <h3 className="font-display font-light text-xl lg:text-2xl text-white leading-tight tracking-tight mb-4">
                    Take the studio with you.
                  </h3>
                  <a
                    href="/brand/docs/company-profile.pdf"
                    target="_blank"
                    rel="noopener"
                    download
                    className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-lafoi-green-light text-lafoi-dark font-sora text-sm font-semibold hover:bg-white transition-all duration-300 shadow-[0_8px_24px_-8px_rgba(34,197,94,0.45)]"
                  >
                    <DownloadSimple size={15} weight="bold" />
                    Download our Company Profile
                  </a>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <a
                      href="/brand/docs/stretch-ceilings-guide.pdf"
                      target="_blank"
                      rel="noopener"
                      download
                      className="group inline-flex items-center gap-2 text-sm font-sora text-white/65 hover:text-lafoi-green-light transition-colors duration-300"
                    >
                      <DownloadSimple
                        size={13}
                        weight="regular"
                        className="opacity-70 group-hover:opacity-100"
                      />
                      <span className="font-display font-light text-base">
                        Read the Stretch Ceilings Guide
                      </span>
                      <ArrowUpRight
                        size={13}
                        weight="bold"
                        className="opacity-60 group-hover:translate-x-0.5 group-hover:opacity-100 transition-all"
                      />
                    </a>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>

        {/* RIGHT, raw image (the original hero photo), full-bleed, no overlay.
            Restrained parallax: drifts ~90px while the left dark plate stays still. */}
        <motion.div
          className="relative order-1 lg:order-2 aspect-[4/3] lg:aspect-auto lg:min-h-full will-change-transform"
          style={{ y: photoY }}
        >
          <ScrollReveal className="absolute inset-0">
            <OptimizedImage
              src="/brand/images/30.png"
              alt="La Foi Designs team at a branded event in Harare"
              className="w-full h-full object-cover object-center"
              fill
              vision="The team behind every install, Belgravia, Harare"
            />
          </ScrollReveal>
        </motion.div>
      </div>
    </section>
  )
}

/* ============================================================================
   3. STORY TIMELINE, Editorial alternating spreads
   ============================================================================ */

function StoryTimeline() {
  const milestones = [
    {
      year: '2024',
      sub: 'January',
      title: 'The beginning',
      copy: 'La Foi Designs is founded with a single bold mission, to bring world-class stretch ceiling technology to Zimbabwe for the very first time.',
    },
    {
      year: '01',
      sub: 'Pioneer',
      title: 'A regional first',
      copy: 'We become Zimbabwe’s first dedicated stretch ceiling installer, introducing a finish that, until then, no one in the country could specify or build.',
    },
    {
      year: '02',
      sub: 'Studio',
      title: 'A home in Belgravia',
      copy: 'The studio settles at Suite 26, 6 Chelmsford Road, a quiet office in Belgravia, central enough to drive a same-day site visit anywhere in Harare.',
    },
    {
      year: '03',
      sub: 'Craft',
      title: 'A team trained for the work',
      copy: 'Four leads, managing, operations, projects, marketing, and a trained installation crew. Every membrane goes up under the eyes of someone who has done it before.',
    },
    {
      year: '04',
      sub: 'Today',
      title: 'Transforming Zimbabwe',
      copy: 'Bedrooms, kitchens, spas, offices, conference rooms, the kind of work where the ceiling is now the first thing the room is photographed for.',
    },
  ]

  return (
    <section className="relative py-24 lg:py-36 bg-lafoi-dark overflow-hidden">
      <div className="aurora-mesh" />
      <div className="absolute inset-0 dot-pattern opacity-12 pointer-events-none" />

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

        {/* Milestones, alternating left/right with massive numerals */}
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
  // Alternate the entry direction: even rows enter from LEFT, odd from RIGHT.
  const initialX = align === 'right' ? 80 : -80

  return (
    <motion.div
      ref={ref}
      className={`grid lg:grid-cols-12 gap-8 lg:gap-12 items-center ${
        align === 'right' ? 'lg:[&>*:first-child]:order-2' : ''
      }`}
      initial={{ opacity: 0, x: initialX, y: 30 }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: initialX, y: 30 }}
      transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
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
          {linkifyProse(m.copy, { variant: 'dark' })}
        </p>
      </div>
    </motion.div>
  )
}

/* ============================================================================
   4. VALUES, Editorial bento (2 image features + 4 typographic)
   ============================================================================ */

function Values() {
  const values = [
    {
      key: 'excellence',
      title: 'Excellence',
      desc: 'Premium PVC and fabric stretch membranes, clean edge details, and finishes that read calm, not loud.',
      image: '/brand/images/9.png',
      vision: 'Excellence, La Foi installer in branded uniform on a ladder',
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
      desc: 'Starfields, translucent backlit panels, custom photographic prints, finishes Zimbabwe simply could not specify before.',
      image: '/brand/images/44.png',
      vision: 'Innovation, installers mounting an LED frame in branded shirts',
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
          <AnimatedSection delay={0.2} direction="right">
            <p className="font-body text-lafoi-gray max-w-sm leading-relaxed">
              {linkifyProse(
                'More than a company, a team united by shared values that inform every project we accept. See our portfolio for projects that show how those values play out in finished work.'
              )}
            </p>
          </AnimatedSection>
        </div>

        {/* Bento, 6 cells across 12 cols, 2 are large image features */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 auto-rows-auto">
          {/* Excellence, image feature, spans 6 */}
          <AnimatedSection direction="up" className="lg:col-span-6 lg:row-span-2">
            <ValueImageCard v={values[0]} index={0} />
          </AnimatedSection>

          {/* Passion, typographic */}
          <AnimatedSection direction="up" delay={0.05} className="lg:col-span-3">
            <ValueTypoCard v={values[1]} index={1} />
          </AnimatedSection>

          {/* Integrity, typographic */}
          <AnimatedSection direction="up" delay={0.1} className="lg:col-span-3">
            <ValueTypoCard v={values[2]} index={2} />
          </AnimatedSection>

          {/* Collaboration, typographic */}
          <AnimatedSection direction="up" delay={0.15} className="lg:col-span-3">
            <ValueTypoCard v={values[4]} index={4} />
          </AnimatedSection>

          {/* Precision, typographic */}
          <AnimatedSection direction="up" delay={0.2} className="lg:col-span-3">
            <ValueTypoCard v={values[5]} index={5} />
          </AnimatedSection>

          {/* Innovation, image feature, spans 12 */}
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
        alt={v.vision || `La Foi Designs ${v.title.toLowerCase()}, studio principle`}
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
          {linkifyProse(v.desc, { variant: 'dark' })}
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
      <p className="font-body font-light text-sm text-lafoi-gray leading-[1.7]">{linkifyProse(v.desc)}</p>
    </div>
  )
}

/* ============================================================================
   5. PARTNERS, Two tall editorial cards
   ============================================================================ */

function Partners() {
  const partners = [
    {
      country: 'Pioneer',
      role: 'A Zimbabwean first',
      title: 'Zimbabwe’s first',
      desc: 'La Foi Designs introduced stretch ceilings to Zimbabwe, and remains the country’s leading installer. The finish is everywhere in Europe; we made it specifiable here.',
      features: [
        { label: 'Fast', detail: '1 to 2 days to install vs. days for gypsum' },
        { label: 'Clean', detail: 'No demolition, no plaster dust, no painting' },
        { label: 'Flexible', detail: 'A wide colour range, matte to mirror gloss' },
        { label: 'Backed', detail: 'Manufacturer-warranted PVC membrane' },
      ],
      pattern: true,
    },
    {
      country: 'Engineered',
      role: 'PVC & fabric membrane',
      title: 'Built to last',
      desc: 'Stretch ceilings are tensioned PVC or fabric membranes, fire-rated, water-resistant, 100% washable, and engineered to outlast the room beneath them.',
      features: [
        { label: 'Fire-rated', detail: 'B-s1, d0 self-extinguishing membrane' },
        { label: 'Water-tight', detail: 'Holds water in a leak, protects below' },
        { label: 'Acoustic', detail: 'Perforated options for sound absorption' },
        { label: 'Eco', detail: 'Recyclable membrane, low-VOC install' },
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
              Pioneers,{' '}
              <span className="text-lafoi-green">in our own light</span>.
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
          {linkifyProse(p.desc)}
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
   6. TEAM, Restrained editorial
   ============================================================================ */

function Team() {
  const credentials = [
    '5+ years combined construction & interior design experience',
    'In-house project management, logistics & quality control',
    'Same-day site visits across greater Harare',
    'A trained installation crew on every job',
  ]

  const leads = [
    { name: 'Takudzwa Mhembere', role: 'Managing Director' },
    { name: 'Ashley Tafirenyika', role: 'Operations Manager' },
    { name: 'Tendekayi K. Mavunga', role: 'Projects Director' },
    { name: 'Faith Mhembere', role: 'Co-Founder & Head of Marketing' },
  ]

  return (
    <section className="relative py-24 lg:py-32 bg-lafoi-dark overflow-hidden">
      <div className="aurora-mesh-cool" />
      <div className="absolute inset-0 dot-pattern opacity-10 pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          {/* Left, copy */}
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
                Four leads.{' '}
                <span className="text-lafoi-green-light">One studio.</span>
              </h2>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <p className="font-body font-light text-base lg:text-lg text-white/65 leading-[1.75] mb-10 max-w-xl">
                A small, deliberate team. Managing Director, Operations, Projects, Marketing, each one client-facing, each one accountable. Plus a trained install crew that
                shows up on time, in branded shirts, and finishes the room by sundown.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={0.25}>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5 mb-10">
                {leads.map((lead, i) => (
                  <div key={lead.name} className="flex items-baseline gap-3">
                    <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-green-light/70 shrink-0 pt-1">
                      0{i + 1}
                    </span>
                    <div>
                      <p className="font-display font-normal text-white text-lg lg:text-xl leading-tight">
                        {lead.name}
                      </p>
                      <p className="font-sora text-[11px] tracking-[0.18em] uppercase text-white/55 mt-1">
                        {lead.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
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

          {/* Right, typographic leadership plate (no portrait) */}
          <AnimatedSection direction="right" className="lg:col-span-6 relative">
            <div className="relative aspect-[4/5] rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-2xl rounded-bl-2xl overflow-hidden border border-white/10 bg-lafoi-green">
              <div aria-hidden className="absolute inset-0 dot-pattern opacity-25 pointer-events-none" />
              <div
                aria-hidden
                className="absolute inset-0 opacity-70 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse at 80% 0%, rgba(255,255,255,0.18), transparent 55%), radial-gradient(ellipse at 0% 100%, rgba(0,0,0,0.35), transparent 55%)',
                }}
              />

              <div className="relative z-10 h-full flex flex-col p-8 lg:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <span className="block w-10 h-px bg-white/70" />
                  <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-white/85">
                    Leadership
                  </p>
                </div>

                <div className="flex-1 flex flex-col justify-center space-y-7">
                  {leads.map((lead, i) => (
                    <div key={lead.name} className="flex items-baseline gap-4">
                      <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-white/55 shrink-0 pt-1">
                        0{i + 1}
                      </span>
                      <div>
                        <p className="font-display font-light text-white text-2xl lg:text-[1.75rem] leading-[1.1]">
                          {lead.name}
                        </p>
                        <p className="font-sora text-[11px] tracking-[0.18em] uppercase text-white/70 mt-1.5">
                          {lead.role}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 mt-8 border-t border-white/20">
                  <p className="font-display font-normal text-white text-xl lg:text-2xl leading-tight mb-1">
                    Locally dedicated.
                  </p>
                  <p className="font-display font-light text-white/80 text-xl lg:text-2xl leading-tight">
                    Belgravia, Harare.
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
   7. CTA, Cinematic full-bleed
   ============================================================================ */

function AboutCTA() {
  return (
    <section className="relative min-h-[80vh] lg:min-h-[88vh] flex items-center overflow-hidden bg-lafoi-dark">
      <div className="absolute inset-0">
        <OptimizedImage
          src="/brand/images/29.png"
          alt="Home theatre with deep recliners and a starfield stretch ceiling"
          className="w-full h-full object-cover object-center"
          fill
          vision="Home theatre with starfield ceiling, invitation to begin"
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

          <AnimatedSection delay={0.25} direction="left">
            <p className="mt-8 max-w-xl text-base lg:text-lg text-white/70 font-body font-light leading-relaxed">
              {linkifyProse(
                "Experience the La Foi difference. Book a free design consultation and let us show you what's possible, at no cost, no obligation, no rush. Browse our portfolio first, or read the technical guide.",
                { variant: 'dark' }
              )}
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
                href="tel:+263782931472"
                className="group inline-flex items-center gap-3 px-7 py-4 rounded-full bg-white/10 backdrop-blur-md text-white font-sora text-sm font-semibold border border-white/20 hover:bg-white/15 hover:border-white/40 transition-all duration-500"
              >
                +263 782 931 472
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
                { label: 'Hours', value: 'Mon-Fri · 09:00 to 17:00' },
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
