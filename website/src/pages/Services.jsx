import React, { useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  Stack,
  Lightbulb,
  Printer,
  Cube,
  SpeakerHigh,
  Palette,
  Sparkle,
  Trophy,
  CheckCircle,
} from '@phosphor-icons/react'
import AnimatedSection from '../components/ui/AnimatedSection'
import OptimizedImage from '../components/ui/OptimizedImage'
import HeroSlideshow from '../components/ui/HeroSlideshow'
import { useSEO } from '../utils/seo'

const SERVICES_HERO_SLIDES = [
  {
    src: 'https://images.unsplash.com/photo-1768270181430-3e3672a32283?w=2200&q=85',
    alt: 'Modern lobby with marble floors and decorative ceiling',
    vision: 'Sweeping commercial ceiling',
  },
  {
    src: 'https://images.unsplash.com/photo-1634146601607-9f319f71b5ee?w=2200&q=85',
    alt: 'Building with dramatic architectural ceiling',
    vision: 'Sculptural architectural form',
  },
  {
    src: 'https://images.unsplash.com/photo-1595513279524-fa90ad188c98?w=2200&q=85',
    alt: 'Open-plan office with acoustic ceiling',
    vision: 'Acoustic open office',
  },
]

const allServices = [
  {
    slug: 'stretch-ceilings',
    icon: Stack,
    title: 'Stretch Ceilings',
    subtitle: 'Premium membrane systems',
    hero: 'https://images.unsplash.com/photo-1638284457192-27d3d0ec51aa?w=1920&q=80',
    heroVision: 'Living room with premium stretch ceiling and warm lighting',
    desc: 'Stretch ceilings manufactured from premium PVC and fabric membranes sourced from Germany and Estonia. Available in over 200 colours and multiple finishes — engineered to disappear into great architecture.',
    features: [
      { label: 'Finish library', detail: 'Matte, satin, gloss, translucent, printed' },
      { label: 'Colour matches', detail: '220+ pigment-locked options' },
      { label: 'Class A1 fire', detail: 'B-s1, d0 — self-extinguishing' },
      { label: 'Moisture proof', detail: 'Bathroom and kitchen rated' },
      { label: 'Installation', detail: 'One working day per room' },
      { label: 'Warranty', detail: '15-year manufacturer backing' },
    ],
    applications: [
      'Living rooms & bedrooms',
      'Bathrooms & kitchens',
      'Hotels & restaurants',
      'Office spaces',
      'Medical facilities',
      'Retail showrooms',
    ],
    image: 'https://images.unsplash.com/photo-1638284457192-27d3d0ec51aa?w=1400&q=80',
    imageVision: 'Modern home interior with stretch ceiling',
  },
  {
    slug: 'custom-lighting',
    icon: Lightbulb,
    title: 'Custom Lighting',
    subtitle: 'Architectural illumination',
    hero: 'https://images.unsplash.com/photo-1768270181430-3e3672a32283?w=1920&q=80',
    heroVision: 'Architectural lighting throughout a hospitality lobby',
    desc: 'From fibre-optic starry skies to programmable LED arrays, our lighting solutions create atmosphere and ambiance that elevate any interior to new heights.',
    features: [
      { label: 'LED systems', detail: 'Strip, panel and linear integration' },
      { label: 'Fibre optic', detail: 'Starry skies and edge accents' },
      { label: 'Backlit panels', detail: 'Translucent membrane lighting' },
      { label: 'RGB & tunable', detail: 'Colour-changing and white-tunable' },
      { label: 'Smart control', detail: 'Home-system and DMX-ready' },
      { label: 'Energy', detail: 'Dimmable, low-power architecture' },
    ],
    applications: [
      'Master bedrooms',
      'Home cinemas',
      'Spa & wellness centres',
      'Restaurant ambiance',
      'Lounge & nightclub design',
      "Children's rooms",
    ],
    image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1400&q=80',
    imageVision: 'Spa-like room with translucent backlit ceiling',
  },
  {
    slug: 'printed-ceilings',
    icon: Printer,
    title: 'Printed Ceilings',
    subtitle: 'Custom visual expressions',
    hero: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1920&q=80',
    heroVision: 'Quiet gallery space awaiting a printed ceiling installation',
    desc: 'Transform your ceiling into a canvas with high-resolution UV-printed designs. From photorealistic skies and custom artwork to brand logos — the possibilities are limitless, the resolution exact.',
    features: [
      { label: 'Resolution', detail: '1440 dpi UV pigment' },
      { label: 'Format', detail: 'Seamless large-format' },
      { label: 'Durability', detail: 'UV-resistant, washable' },
      { label: 'Custom artwork', detail: 'Photographs, illustration, brand' },
      { label: 'Themes', detail: 'Sky, geometry, nature, abstraction' },
      { label: 'Colour accuracy', detail: 'Calibrated proofing' },
    ],
    applications: [
      'Swimming pools & spas',
      "Children's rooms & nurseries",
      'Themed restaurants',
      'Corporate branding',
      'Retail environments',
      'Medical & dental clinics',
    ],
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1400&q=80',
    imageVision: 'Contemporary architecture interior with photographic feature',
  },
  {
    slug: '3d-ceilings',
    icon: Cube,
    title: '3D Ceiling Forms',
    subtitle: 'Sculptural architecture',
    hero: 'https://images.unsplash.com/photo-1634146601607-9f319f71b5ee?w=1920&q=80',
    heroVision: 'Building with dramatic architectural ceiling',
    desc: 'Push the boundaries of interior design with three-dimensional ceiling installations. Waves, cones, domes, and custom organic forms that make spaces unforgettable.',
    features: [
      { label: 'Forms', detail: 'Waves, curves, cones, domes' },
      { label: 'Custom geometry', detail: 'Organic and parametric' },
      { label: 'Multi-level', detail: 'Stepped and stratified installs' },
      { label: 'Lighting', detail: 'Integrated cove and accent' },
      { label: 'Construction', detail: 'Lightweight subframe systems' },
      { label: 'Focal points', detail: 'Architectural centrepieces' },
    ],
    applications: [
      'Hotel lobbies',
      'Corporate reception areas',
      'Event venues',
      'Exhibition spaces',
      'Luxury residences',
      'Architectural features',
    ],
    image: 'https://images.unsplash.com/photo-1634146601607-9f319f71b5ee?w=1400&q=80',
    imageVision: 'Dramatic architectural ceiling with skylight',
  },
  {
    slug: 'acoustic',
    icon: SpeakerHigh,
    title: 'Acoustic Solutions',
    subtitle: 'Sound management',
    hero: 'https://images.unsplash.com/photo-1595513279524-fa90ad188c98?w=1920&q=80',
    heroVision: 'Open-plan office with acoustic ceiling treatment',
    desc: 'Micro-perforated stretch ceilings that combine visual elegance with superior sound absorption. For spaces where both aesthetics and acoustics matter equally.',
    features: [
      { label: 'Perforation', detail: 'Micro-perforated membrane' },
      { label: 'NRC rating', detail: 'Up to 0.90 sound absorption' },
      { label: 'Backing', detail: 'Hidden acoustic substrate' },
      { label: 'Appearance', detail: 'Seamless, no visible joints' },
      { label: 'Finishes', detail: 'Available across all colour matches' },
      { label: 'Standards', detail: 'Meets EU acoustic regulations' },
    ],
    applications: [
      'Recording studios',
      'Conference rooms',
      'Open-plan offices',
      'Restaurants & cafes',
      'Cinemas & theatres',
      'Educational facilities',
    ],
    image: 'https://images.unsplash.com/photo-1595513279524-fa90ad188c98?w=1400&q=80',
    imageVision: 'Acoustic office space with treated ceiling',
  },
  {
    slug: 'consulting',
    icon: Palette,
    title: 'Design Consulting',
    subtitle: 'Vision to reality',
    hero: 'https://images.unsplash.com/photo-1768270181430-3e3672a32283?w=1920&q=80',
    heroVision: 'Lobby in design — finishes being specified',
    desc: 'Our trained design consultants guide you through every step — from material selection and colour matching to lighting design and 3D visualisation of your finished space.',
    features: [
      { label: 'Free consult', detail: 'Initial brief and site visit' },
      { label: 'Site assessment', detail: 'Measured drawings, samples' },
      { label: '3D visualisation', detail: 'Render before fabrication' },
      { label: 'Material sampling', detail: 'In your light, not ours' },
      { label: 'Lighting design', detail: 'Layout, control logic, scenes' },
      { label: 'Project management', detail: 'Single point of contact' },
    ],
    applications: [
      'New builds',
      'Renovations',
      'Commercial fit-outs',
      'Interior redesigns',
      'Event installations',
      'Architectural projects',
    ],
    image: 'https://images.unsplash.com/photo-1768270181430-3e3672a32283?w=1400&q=80',
    imageVision: 'Design consulting — lobby fit-out in progress',
  },
]

export default function Services() {
  const { serviceSlug } = useParams()
  const activeService = serviceSlug ? allServices.find((s) => s.slug === serviceSlug) : null

  useSEO({
    title: activeService ? activeService.title : 'Our Services',
    description: activeService
      ? activeService.desc
      : "Explore La Foi Designs' comprehensive ceiling and lighting solutions — stretch ceilings, custom lighting, printed ceilings, 3D forms, and acoustic solutions.",
    path: activeService ? `/services/${activeService.slug}` : '/services',
  })

  if (activeService) return <ServiceDetail service={activeService} />

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ServicesHero />
      <ServicesEditorial />
      <Process />
      <WhyChooseUs />
      <ServicesCTA />
    </motion.div>
  )
}

/* ============================================================================
   1. HERO — Single viewport editorial
   ============================================================================ */

function ServicesHero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <section
      ref={ref}
      className="relative h-[100svh] min-h-[640px] flex flex-col overflow-hidden bg-lafoi-dark"
    >
      <HeroSlideshow slides={SERVICES_HERO_SLIDES} interval={6500} parallax overlay={false} />
      <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/90 via-lafoi-dark/40 to-lafoi-dark/55 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-lafoi-dark/55 via-transparent to-lafoi-dark/20 pointer-events-none" />

      {/* Volume artifact */}
      <div className="absolute top-28 right-6 lg:top-32 lg:right-10 z-10 pointer-events-none flex items-center gap-3">
        <span className="hidden sm:block w-8 h-px bg-white/30" />
        <span className="font-sora text-[10px] tracking-[0.28em] uppercase text-white/65">
          Vol.&nbsp;03 &mdash; 2026 &middot; The Catalogue
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
              Six services &middot; One studio
            </span>
          </span>
        </motion.div>

        <div className="mt-auto pb-10 lg:pb-16 grid lg:grid-cols-12 gap-8 lg:gap-12 items-end">
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
              <span className="block font-light">Ceilings, light,</span>
              <span className="block">
                <span className="font-normal text-white">and the </span>
                <span className="font-normal text-lafoi-green-light">craft</span>
                <span className="text-lafoi-green-light"> between</span>
                <span className="text-lafoi-green-light">.</span>
              </span>
            </h1>

            <motion.p
              className="mt-6 lg:mt-8 max-w-xl text-sm sm:text-base lg:text-[17px] text-white/70 font-body font-light leading-[1.55]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              Six services, each engineered to stand alone — and designed to work together. From
              the membrane overhead to the fibre-optic stars within it.
            </motion.p>

            <motion.div
              className="mt-8 lg:mt-10 flex flex-wrap items-center gap-x-5 gap-y-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              <a
                href="#catalogue"
                className="group inline-flex items-center gap-3 px-7 py-3.5 bg-lafoi-green-light text-white rounded-full font-body text-sm font-medium hover:bg-lafoi-green transition-all duration-500 shadow-[0_10px_40px_-10px_rgba(34,197,94,0.55)]"
              >
                Browse the catalogue
                <ArrowRight
                  size={15}
                  weight="bold"
                  className="group-hover:translate-x-1 transition-transform duration-300"
                />
              </a>
              <Link
                to="/contact"
                className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/25 text-white/85 hover:bg-white/8 hover:border-white/45 hover:text-white font-body text-sm font-medium transition-all duration-500"
              >
                Request samples
                <ArrowUpRight
                  size={14}
                  weight="regular"
                  className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300"
                />
              </Link>
            </motion.div>
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

/* ============================================================================
   2. CATALOGUE — Editorial alternating spreads
   ============================================================================ */

function ServicesEditorial() {
  return (
    <section id="catalogue" className="relative py-20 lg:py-32 bg-lafoi-cream overflow-hidden">
      <div className="absolute inset-0 pattern-cross-light opacity-40 pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16 lg:mb-24">
          <div className="max-w-2xl">
            <AnimatedSection>
              <div className="flex items-center gap-3 mb-5">
                <span className="block w-10 h-px bg-lafoi-green/60" />
                <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                  The catalogue
                </p>
                <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray/50">
                  01 / 04
                </span>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <h2 className="font-display font-light text-lafoi-dark text-4xl sm:text-5xl lg:text-[3.6rem] leading-[1.05] tracking-[-0.02em]">
                Six services.{' '}
                <span className="text-lafoi-green">Read like a magazine.</span>
              </h2>
            </AnimatedSection>
          </div>
          <AnimatedSection delay={0.2}>
            <p className="font-body text-lafoi-gray max-w-sm leading-relaxed">
              Each entry below is a complete service. Click through for specifications, applications,
              and a request-quote sidebar.
            </p>
          </AnimatedSection>
        </div>

        {/* alternating editorial rows */}
        <div className="space-y-24 lg:space-y-36">
          {allServices.map((s, i) => (
            <ServiceRow key={s.slug} service={s} index={i} total={allServices.length} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ServiceRow({ service, index, total }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.25 })
  const isLeft = index % 2 === 0
  const Icon = service.icon

  return (
    <motion.div
      ref={ref}
      className={`grid lg:grid-cols-12 gap-8 lg:gap-16 items-center ${
        !isLeft ? 'lg:[&>*:first-child]:order-2' : ''
      }`}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* image column */}
      <div className="lg:col-span-7">
        <div className="relative aspect-[5/4] rounded-3xl overflow-hidden bg-lafoi-dark group">
          <OptimizedImage
            src={service.image}
            alt={service.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            fill
            vision={service.imageVision}
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-lafoi-dark/30 via-transparent to-transparent" />

          {/* corner index */}
          <div className="absolute top-6 left-6 right-6 flex items-start justify-between">
            <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-white/65 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
              0{index + 1} / 0{total}
            </span>
            <span className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center">
              <Icon size={16} weight="regular" className="text-white" />
            </span>
          </div>
        </div>
      </div>

      {/* text column */}
      <div className="lg:col-span-5">
        <div className="flex items-center gap-3 mb-6">
          <span className="block w-10 h-px bg-lafoi-green/60" />
          <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
            {service.subtitle}
          </p>
        </div>

        <h3 className="font-display font-light text-lafoi-dark text-3xl sm:text-4xl lg:text-[2.8rem] leading-[1.1] tracking-[-0.02em] mb-6">
          {service.title}
        </h3>

        <p className="font-body font-light text-base lg:text-[17px] text-lafoi-gray leading-[1.7] mb-8 max-w-md">
          {service.desc}
        </p>

        {/* applications — hairline-divided rows */}
        <div className="space-y-0 border-t border-lafoi-dark/10 mb-8 max-w-md">
          {service.applications.slice(0, 4).map((a, idx) => (
            <div
              key={a}
              className="flex items-baseline gap-4 py-3 border-b border-lafoi-dark/10"
            >
              <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">
                {idx % 2 === 0 ? `0${idx + 1}` : <span>&mdash;</span>}
              </span>
              <span className="font-body text-sm text-lafoi-dark/85">{a}</span>
            </div>
          ))}
        </div>

        <Link
          to={`/services/${service.slug}`}
          className="group inline-flex items-center gap-3 text-lafoi-dark font-sora text-sm font-medium pb-1 border-b border-lafoi-dark/30 hover:border-lafoi-green hover:text-lafoi-green transition-colors duration-300"
        >
          <span className="font-display font-light text-base">Explore the service</span>
          <ArrowRight
            size={16}
            weight="bold"
            className="group-hover:translate-x-1 transition-transform duration-300"
          />
        </Link>
      </div>
    </motion.div>
  )
}

/* ============================================================================
   3. PROCESS — Numbered editorial sequence
   ============================================================================ */

function Process() {
  const steps = [
    { num: '01', title: 'Free consultation', desc: 'We assess your space, listen to the brief, and discuss design possibilities. The first conversation costs nothing.' },
    { num: '02', title: 'Custom design', desc: 'Detailed plans with material, lighting and edge-detail selections. Sampled in your light, not ours.' },
    { num: '03', title: 'Manufacturing', desc: 'Your ceiling is custom-made by our German and Estonian partners using premium European materials.' },
    { num: '04', title: 'Installation', desc: 'Expert installation, typically completed in a single working day per room — no demolition needed.' },
  ]

  return (
    <section className="relative py-24 lg:py-32 bg-lafoi-dark overflow-hidden">
      <div className="absolute inset-0 pattern-blueprint-light opacity-50 pointer-events-none" />
      <div className="absolute inset-0 dot-pattern opacity-15 pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="max-w-3xl mb-16 lg:mb-20">
          <AnimatedSection>
            <div className="flex items-center gap-3 mb-5">
              <span className="block w-10 h-px bg-lafoi-green-light/60" />
              <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green-light">
                The process
              </p>
              <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-white/30">
                02 / 04
              </span>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h2 className="font-display font-light text-white text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.1] tracking-[-0.02em]">
              Four stages.{' '}
              <span className="text-lafoi-green-light">No surprises.</span>
            </h2>
          </AnimatedSection>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 lg:gap-x-10 gap-y-12 border-t border-white/10 pt-10 lg:pt-14">
          {steps.map((step, i) => (
            <AnimatedSection key={step.num} delay={i * 0.08}>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-3 mb-5">
                  <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-white/40">
                    Stage
                  </span>
                  <span className="font-display font-light text-white text-5xl lg:text-6xl leading-none">
                    {step.num}
                  </span>
                </div>
                <span className="block w-8 h-px bg-lafoi-green-light/60 mb-5" />
                <h3 className="font-display font-light text-white text-2xl lg:text-[1.65rem] mb-3 leading-tight">
                  {step.title}
                </h3>
                <p className="font-body font-light text-sm text-white/55 leading-relaxed">
                  {step.desc}
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
   4. WHY CHOOSE US — Editorial 4-up
   ============================================================================ */

function WhyChooseUs() {
  const reasons = [
    {
      title: 'First in Zimbabwe',
      desc: 'We pioneered stretch ceilings in Zimbabwe — bringing technology never before seen in the country.',
      icon: Trophy,
    },
    {
      title: 'European quality',
      desc: 'German and Estonian manufactured materials meet the highest EU quality and safety standards.',
      icon: Sparkle,
    },
    {
      title: 'Trained installers',
      desc: 'Our team trained directly with European manufacturers for fast, flawless installations.',
      icon: CheckCircle,
    },
    {
      title: 'Full warranty',
      desc: 'Every installation is backed by a 15-year manufacturer warranty and 2-year workmanship cover.',
      icon: Sparkle,
    },
  ]

  return (
    <section className="relative py-24 lg:py-32 bg-lafoi-cream overflow-hidden">
      <div className="absolute inset-0 mesh-gradient-1 pointer-events-none" />
      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="max-w-3xl mb-14 lg:mb-20">
          <AnimatedSection>
            <div className="flex items-center gap-3 mb-5">
              <span className="block w-10 h-px bg-lafoi-green/60" />
              <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                Why choose us
              </p>
              <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray/50">
                03 / 04
              </span>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <h2 className="font-display font-light text-lafoi-dark text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.1] tracking-[-0.02em]">
              Four reasons{' '}
              <span className="text-lafoi-green">we keep being asked back</span>.
            </h2>
          </AnimatedSection>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {reasons.map((r, i) => (
            <AnimatedSection key={r.title} delay={i * 0.08}>
              <div className="group h-full p-7 lg:p-8 rounded-3xl border border-lafoi-dark/10 bg-white hover:border-lafoi-green/30 hover:shadow-xl hover:shadow-black/[0.04] transition-all duration-500">
                <div className="flex items-baseline justify-between mb-7">
                  <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">
                    0{i + 1} / 04
                  </span>
                  <r.icon size={16} weight="regular" className="text-lafoi-green/70 group-hover:text-lafoi-green transition-colors" />
                </div>
                <span className="block w-8 h-px bg-lafoi-green/60 mb-5" />
                <h3 className="font-display font-light text-lafoi-dark text-2xl mb-4 leading-tight">
                  {r.title}
                </h3>
                <p className="font-body font-light text-sm text-lafoi-gray leading-[1.7]">
                  {r.desc}
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
   5. CTA — Cinematic full-bleed
   ============================================================================ */

function ServicesCTA() {
  return (
    <section className="relative min-h-[80vh] lg:min-h-[88vh] flex items-center overflow-hidden bg-lafoi-dark">
      <div className="absolute inset-0">
        <OptimizedImage
          src="https://images.unsplash.com/photo-1639663742190-1b3dba2eebcf?w=2000&q=85"
          alt="Master suite with stretch ceiling"
          className="w-full h-full object-cover object-center"
          fill
          vision="Master suite with luminous stretch ceiling — invitation to specify"
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
                Specifying support
              </p>
              <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-white/30">
                04 / 04
              </span>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <h2 className="font-display text-white text-5xl sm:text-6xl lg:text-[5rem] xl:text-[5.6rem] leading-[1.02] tracking-[-0.025em]">
              <span className="block font-light">Not sure which</span>
              <span className="block font-normal">solution fits?</span>
            </h2>
          </AnimatedSection>

          <AnimatedSection delay={0.25}>
            <p className="mt-8 max-w-xl text-base lg:text-lg text-white/70 font-body font-light leading-relaxed">
              Our consultants walk you through finishes, lighting compatibility and on-site samples
              — at no charge. WhatsApp is the fastest channel; email if you'd rather attach drawings.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.4}>
            <div className="mt-12 flex flex-wrap items-center gap-4 lg:gap-5">
              <Link
                to="/contact"
                className="group inline-flex items-center gap-3 px-7 py-4 rounded-full bg-lafoi-green-light text-white font-sora text-sm font-semibold hover:bg-lafoi-green transition-all duration-500 shadow-[0_8px_30px_rgba(34,197,94,0.25)]"
              >
                Speak to a specialist
                <ArrowRight
                  size={16}
                  weight="bold"
                  className="group-hover:translate-x-1 transition-transform duration-300"
                />
              </Link>
              <Link
                to="/projects"
                className="group inline-flex items-center gap-3 px-7 py-4 rounded-full bg-white/10 backdrop-blur-md text-white font-sora text-sm font-semibold border border-white/20 hover:bg-white/15 hover:border-white/40 transition-all duration-500"
              >
                See products in projects
                <ArrowUpRight
                  size={16}
                  weight="bold"
                  className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300"
                />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

/* ============================================================================
   SERVICE DETAIL — /services/:slug
   ============================================================================ */

function ServiceDetail({ service }) {
  const detailSlides = [
    { src: service.hero, alt: service.title, vision: service.heroVision },
    {
      src: 'https://images.unsplash.com/photo-1758194090785-8e09b7288199?w=2200&q=85',
      alt: 'Luminous lobby ceiling',
      vision: 'Luminous backlit ceiling',
    },
    {
      src: 'https://images.unsplash.com/photo-1639663742190-1b3dba2eebcf?w=2200&q=85',
      alt: 'Master suite with stretch ceiling',
      vision: 'Suite ceiling and lighting',
    },
  ]
    .filter((s, i, arr) => arr.findIndex((x) => x.src === s.src) === i)
    .slice(0, 3)

  // adjacent
  const idx = allServices.findIndex((s) => s.slug === service.slug)
  const prev = allServices[(idx - 1 + allServices.length) % allServices.length]
  const next = allServices[(idx + 1) % allServices.length]

  const Icon = service.icon

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero */}
      <section className="relative h-[100svh] min-h-[640px] flex flex-col overflow-hidden bg-lafoi-dark">
        <HeroSlideshow slides={detailSlides} interval={6500} parallax overlay={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/90 via-lafoi-dark/40 to-lafoi-dark/55 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-lafoi-dark/55 via-transparent to-lafoi-dark/20 pointer-events-none" />

        {/* Volume artifact */}
        <div className="absolute top-28 right-6 lg:top-32 lg:right-10 z-10 pointer-events-none flex items-center gap-3">
          <span className="hidden sm:block w-8 h-px bg-white/30" />
          <span className="font-sora text-[10px] tracking-[0.28em] uppercase text-white/65">
            Service 0{idx + 1} / 0{allServices.length} &middot; {service.subtitle}
          </span>
        </div>

        <div className="relative z-10 flex-1 flex flex-col max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 w-full">
          {/* breadcrumb */}
          <div className="pt-28 lg:pt-32">
            <Link
              to="/services"
              className="group inline-flex items-center gap-2 text-white/65 font-sora text-xs tracking-[0.2em] uppercase hover:text-white transition-colors"
            >
              <ArrowLeft
                size={13}
                weight="regular"
                className="group-hover:-translate-x-0.5 transition-transform"
              />
              Back to catalogue
            </Link>
          </div>

          {/* headline anchored bottom */}
          <div className="mt-auto pb-10 lg:pb-16 grid lg:grid-cols-12 gap-8 items-end">
            <motion.div
              className="lg:col-span-9"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="block w-12 h-px bg-lafoi-green-light/70" />
                <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green-light">
                  {service.subtitle}
                </p>
              </div>
              <h1
                className="font-display text-white tracking-[-0.035em] leading-[0.98] text-[3rem] sm:text-[4.5rem] lg:text-[6rem] xl:text-[6.6rem]"
                style={{ fontVariationSettings: '"opsz" 144' }}
              >
                <span className="block font-light text-white/95">{service.title}</span>
              </h1>
              <p className="mt-6 lg:mt-8 max-w-xl text-sm sm:text-base lg:text-[17px] text-white/70 font-body font-light leading-[1.55]">
                {service.desc}
              </p>
            </motion.div>

            {/* Right metadata card */}
            <motion.aside
              className="lg:col-span-3 hidden lg:block"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="ml-auto max-w-[280px] relative bg-white/[0.06] backdrop-blur-md border border-white/15 rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-lg rounded-bl-lg p-6 overflow-hidden">
                <div aria-hidden className="absolute inset-0 dot-pattern opacity-30 pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-sora text-[10px] font-semibold tracking-[0.28em] uppercase text-lafoi-green-light">
                      The brief
                    </span>
                    <Icon size={16} weight="regular" className="text-white/55" />
                  </div>
                  <div className="space-y-3 font-body font-light text-[13px] text-white/75 leading-relaxed">
                    {service.features.slice(0, 3).map((f) => (
                      <div key={f.label} className="flex items-baseline justify-between gap-3">
                        <span className="text-white/50 shrink-0">{f.label}</span>
                        <span className="text-white text-right">{f.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </section>

      {/* BODY — two-column with editorial sticky sidebar */}
      <section className="relative py-20 lg:py-32 bg-lafoi-cream overflow-hidden">
        <div className="absolute inset-0 pattern-cross-light opacity-30 pointer-events-none" />

        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            {/* Left — long-form */}
            <div className="lg:col-span-8">
              <AnimatedSection>
                <div className="flex items-center gap-3 mb-6">
                  <span className="block w-10 h-px bg-lafoi-green/60" />
                  <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                    The specification
                  </p>
                </div>
                <h2 className="font-display font-light text-lafoi-dark text-3xl sm:text-4xl lg:text-[2.8rem] leading-[1.1] tracking-[-0.02em] mb-6">
                  Features &amp; benefits
                </h2>
                <p className="font-body font-light text-base lg:text-lg text-lafoi-gray leading-[1.75] mb-12 max-w-2xl">
                  {service.desc}
                </p>
              </AnimatedSection>

              {/* Features as hairline-divided rows */}
              <AnimatedSection delay={0.1}>
                <div className="space-y-0 border-t border-lafoi-dark/10 mb-12">
                  {service.features.map((f, idx) => (
                    <div
                      key={f.label}
                      className="flex items-baseline gap-6 py-5 border-b border-lafoi-dark/10"
                    >
                      <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium shrink-0">
                        {idx % 2 === 0 ? `0${idx + 1}` : <span>&mdash;</span>}
                      </span>
                      <span className="font-display font-normal text-lafoi-dark text-lg lg:text-xl shrink-0 min-w-[180px]">
                        {f.label}
                      </span>
                      <span className="font-body font-light text-sm lg:text-base text-lafoi-gray flex-1">
                        {f.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </AnimatedSection>

              {/* Image break */}
              <AnimatedSection delay={0.2}>
                <div className="relative aspect-[16/9] rounded-3xl overflow-hidden bg-lafoi-dark mb-12">
                  <OptimizedImage
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover object-center"
                    fill
                    vision={service.imageVision}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/30 via-transparent to-transparent" />
                </div>
              </AnimatedSection>

              {/* Other services */}
              <AnimatedSection delay={0.25}>
                <div className="pt-10 border-t border-lafoi-dark/10">
                  <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green mb-6">
                    Continue exploring
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Link
                      to={`/services/${prev.slug}`}
                      className="group p-6 rounded-2xl border border-lafoi-dark/10 bg-white hover:border-lafoi-green/30 transition-colors duration-500"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <ArrowLeft size={12} weight="regular" className="text-lafoi-gray-medium group-hover:-translate-x-0.5 transition-transform" />
                        <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">
                          Previous
                        </span>
                      </div>
                      <p className="font-display font-light text-xl text-lafoi-dark group-hover:text-lafoi-green transition-colors">
                        {prev.title}
                      </p>
                    </Link>
                    <Link
                      to={`/services/${next.slug}`}
                      className="group p-6 rounded-2xl border border-lafoi-dark/10 bg-white hover:border-lafoi-green/30 transition-colors duration-500 sm:text-right"
                    >
                      <div className="flex items-center gap-2 mb-3 sm:justify-end">
                        <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">
                          Next
                        </span>
                        <ArrowRight size={12} weight="regular" className="text-lafoi-gray-medium group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="font-display font-light text-xl text-lafoi-dark group-hover:text-lafoi-green transition-colors">
                        {next.title}
                      </p>
                    </Link>
                  </div>
                </div>
              </AnimatedSection>
            </div>

            {/* Right — sticky sidebar */}
            <aside className="lg:col-span-4">
              <AnimatedSection direction="right">
                <div className="sticky top-28 space-y-5">
                  {/* Applications card — glass + asymmetric */}
                  <div className="relative p-7 lg:p-8 rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-2xl rounded-bl-2xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] overflow-hidden">
                    <div aria-hidden className="absolute inset-0 pattern-blueprint opacity-20 pointer-events-none" />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-6">
                        <span className="block w-8 h-px bg-lafoi-green/60" />
                        <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                          Ideal for
                        </p>
                      </div>

                      <div className="space-y-0 border-t border-lafoi-dark/10 mb-7">
                        {service.applications.map((a, idx) => (
                          <div
                            key={a}
                            className="flex items-baseline gap-3 py-3 border-b border-lafoi-dark/10"
                          >
                            <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium shrink-0">
                              0{idx + 1}
                            </span>
                            <span className="font-body text-sm text-lafoi-dark/85">{a}</span>
                          </div>
                        ))}
                      </div>

                      <Link
                        to="/contact"
                        className="group flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-lafoi-green-light text-white rounded-full font-sora text-sm font-semibold hover:bg-lafoi-green transition-all duration-500 shadow-[0_8px_30px_rgba(34,197,94,0.25)]"
                      >
                        Request a quote
                        <ArrowRight
                          size={14}
                          weight="bold"
                          className="group-hover:translate-x-0.5 transition-transform duration-300"
                        />
                      </Link>
                    </div>
                  </div>

                  {/* Trust */}
                  <div className="p-6 rounded-2xl border border-lafoi-dark/10 bg-white">
                    <div className="flex items-center gap-3 mb-3">
                      <Trophy size={14} weight="regular" className="text-lafoi-green" />
                      <p className="font-sora text-[10px] font-semibold tracking-[0.28em] uppercase text-lafoi-dark">
                        Backed by Europe
                      </p>
                    </div>
                    <p className="font-body font-light text-xs text-lafoi-gray leading-relaxed">
                      15-year manufacturer warranty. German &amp; Estonian quality. Class A1 fire
                      performance.
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            </aside>
          </div>
        </div>
      </section>
    </motion.div>
  )
}
