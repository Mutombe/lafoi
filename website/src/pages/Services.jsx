import React, { useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  Stack,
  Lightbulb,
  Palette,
  Wrench,
  Sparkle,
  Trophy,
  CheckCircle,
  DownloadSimple,
  FilePdf,
  PaintBrush,
  GridFour,
  Drop,
} from '@phosphor-icons/react'
import AnimatedSection from '../components/ui/AnimatedSection'
import OptimizedImage from '../components/ui/OptimizedImage'
import HeroSlideshow from '../components/ui/HeroSlideshow'
import AnimatedHeading from '../components/ui/AnimatedHeading'
import { useSEO, breadcrumbsLd, serviceLd } from '../utils/seo'
import { linkifyProse } from '../utils/linkify.jsx'

const SERVICES_HERO_SLIDES = [
  {
    src: '/brand/images/22.png',
    alt: 'La Foi residential install: gloss ceiling with starfield and linear lights',
    vision: 'Residential install with stars and linear LEDs',
  },
  {
    src: '/brand/images/13.png',
    alt: 'La Foi gloss black ceiling with shadow-edge perimeter reveal',
    vision: 'Gloss ceiling with shadow-edge perimeter',
  },
  {
    src: '/brand/images/26.png',
    alt: 'La Foi residential ceiling with concealed back-lighting',
    vision: 'Back-lit residential ceiling',
  },
]

const allServices = [
  {
    slug: 'stretch-ceiling-installation',
    icon: Stack,
    title: 'Stretch Ceiling Installation',
    subtitle: 'Premium membrane systems',
    hero: '/brand/images/12.png',
    heroVision: 'White gloss stretch ceiling with linear LEDs in a contemporary kitchen, a recent La Foi install',
    desc: 'Tensioned PVC and fabric stretch ceilings, matte, satin, gloss, translucent backlit, printed photographic, star ceilings and acoustic perforated. Available across a wide colour range, engineered to disappear into great architecture.',
    features: [
      { label: 'Finish library', detail: 'Matte, satin, gloss, translucent, printed, stars, acoustic' },
      { label: 'Colour range', detail: 'A wide custom colour range' },
      { label: 'Fire rating', detail: 'B-s1, d0, self-extinguishing' },
      { label: 'Moisture proof', detail: 'Bathroom and kitchen rated' },
      { label: 'Installation', detail: '1 to 2 working days per 9 m² standard room' },
      { label: 'Warranty', detail: 'Manufacturer warranty up to 10 years' },
    ],
    applications: [
      'Living rooms & bedrooms',
      'Bathrooms & kitchens',
      'Hotels & restaurants',
      'Office spaces',
      'Medical facilities',
      'Retail showrooms',
    ],
    image: '/brand/images/22.png',
    imageVision: 'La Foi residential install: gloss ceiling with starfield and recessed linear LEDs',
  },
  {
    slug: 'lighting-solutions',
    icon: Lightbulb,
    title: 'Lighting Solutions',
    subtitle: 'Architectural illumination',
    hero: '/brand/images/3.png',
    heroVision: 'Continuous recessed linear LEDs in a La Foi stretch-ceiling install',
    desc: 'From fibre-optic starry skies to programmable LED arrays, our lighting solutions create atmosphere that elevates any interior. Designed alongside the ceiling, never bolted on after.',
    features: [
      { label: 'LED systems', detail: 'Strip, panel and linear integration' },
      { label: 'Fibre optic', detail: 'Starry skies and edge accents' },
      { label: 'Backlit panels', detail: 'Translucent membrane lighting' },
      { label: 'RGB & tunable', detail: 'Colour-changing and white-tunable' },
      { label: 'Scene control', detail: 'Wall plate, app or BMS triggering' },
      { label: 'Energy', detail: 'Dimmable, low-power architecture' },
    ],
    applications: [
      'Master bedrooms',
      'Home cinemas',
      'Spa & wellness centres',
      'Restaurant ambiance',
      'Hospitality lobbies',
      'Retail showrooms',
    ],
    image: '/brand/images/11.png',
    imageVision: 'La Foi install with magnetic track lights recessed into a white stretch ceiling',
  },
  {
    slug: 'design-consultation',
    icon: Palette,
    title: 'Design Consultation & Customisation',
    subtitle: 'Vision to reality',
    hero: '/brand/images/29.png',
    heroVision: 'La Foi home-cinema install with shadow-edge perimeter and recessed spots',
    desc: 'A trained consultant guides you through every step, from material selection and colour matching to lighting layout and visualisation of the finished space. The first conversation costs nothing.',
    features: [
      { label: 'Free consult', detail: 'Initial brief and site visit' },
      { label: 'Site assessment', detail: 'Measured drawings, samples' },
      { label: 'Visualisation', detail: 'Sampled in your light, not ours' },
      { label: 'Material sampling', detail: 'PVC, fabric, finishes, colours' },
      { label: 'Lighting design', detail: 'Layout, control logic, scenes' },
      { label: 'Project management', detail: 'Single point of contact' },
    ],
    applications: [
      'New builds',
      'Renovations',
      'Commercial fit-outs',
      'Interior redesigns',
      'Hospitality refits',
      'Architectural projects',
    ],
    image: '/brand/images/45.png',
    imageVision: 'La Foi printed-marble ceiling above a curated boardroom, specified end to end',
  },
  {
    slug: 'maintenance-support',
    icon: Wrench,
    title: 'Maintenance & Support',
    subtitle: 'Care after handover',
    hero: '/brand/images/62.png',
    heroVision: 'La Foi installation team finishing a stretch-ceiling install in a Harare residence',
    desc: 'Stretch ceilings are designed to be removable and serviceable. We support every install with cleaning guidance, on-site care and a clear warranty path, for as long as the ceiling is yours.',
    features: [
      { label: 'Cleaning', detail: 'Damp-wipe / microfibre, neutral pH' },
      { label: 'Service access', detail: 'Membrane removable, services preserved' },
      { label: 'Warranty', detail: 'Manufacturer warranty up to 10 years' },
      { label: 'Repair', detail: 'Localised re-stretch, panel swap' },
      { label: 'Lighting', detail: 'Driver and fixture replacement' },
      { label: 'Response', detail: 'Same-week site visit across Harare' },
    ],
    applications: [
      'Residential aftercare',
      'Hospitality refits',
      'Office renovations',
      'Retail seasonal restages',
      'Insurance claims',
      'Warranty enquiries',
    ],
    image: '/brand/images/8.png',
    imageVision: 'La Foi installer working on a stretch-ceiling install',
  },
  {
    slug: 'interior-design',
    icon: PaintBrush,
    title: 'Interior Design',
    subtitle: 'Concept to completion',
    hero: '/brand/projects/greystone-park/greystone-2.jpeg',
    heroVision: 'Greystone Park dressing room with high-gloss ceiling and back-lit oval mirrors',
    desc: 'A full interior design service taken from first conversation to final styling, space planning, material palettes, furniture specification, mood boards, and supervised installation. We co-ordinate every trade so the room arrives whole.',
    features: [
      { label: 'Concept design', detail: 'Mood boards, design intent, sample boards' },
      { label: 'Space planning', detail: 'Measured drawings, circulation, zoning' },
      { label: 'Material palette', detail: 'Wall, floor, ceiling, joinery curated together' },
      { label: 'Furniture & FF&E', detail: 'Sourced, specified, scheduled' },
      { label: 'Project supervision', detail: 'Single point of contact across trades' },
      { label: 'Visualisation', detail: '3D renders before commitment' },
    ],
    applications: [
      'New residential builds',
      'Apartment refreshes',
      'Boutique hotels',
      'Restaurants & cafés',
      'Office redesign',
      'Retail showrooms',
    ],
    image: '/brand/projects/shashl-studio/shashl-3.jpeg',
    imageVision: 'Shashl Studio with sculptural cloud-form stretch ceiling and quilted padded walls',
  },
  {
    slug: 'flooring',
    icon: Stack,
    title: 'Flooring',
    subtitle: 'Hardwood, vinyl, laminate, parquet',
    // Pending brand photography; using context-correct stock that clearly
    // shows hardwood/parquet floor as the subject of the frame.
    hero: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=1920&q=80',
    heroVision: 'Wide-plank engineered hardwood floor in a contemporary interior',
    desc: 'Specialist flooring installation across engineered hardwood, luxury vinyl plank, laminate, and patterned parquet. Substrate preparation, perimeter detailing and skirting transitions handled in-house, the floor reads as one continuous plane.',
    features: [
      { label: 'Engineered hardwood', detail: 'Oak, walnut, ash, wide and narrow plank' },
      { label: 'Luxury vinyl (LVP)', detail: 'Waterproof, click-lock, premium underlay' },
      { label: 'Laminate', detail: 'AC4 to AC5 commercial-grade options' },
      { label: 'Parquet patterns', detail: 'Chevron, herringbone, basket weave' },
      { label: 'Substrate prep', detail: 'Self-levelling, moisture barrier, acoustic underlay' },
      { label: 'Detailing', detail: 'Skirting, transitions, expansion joints' },
    ],
    applications: [
      'Residential living spaces',
      'Bedrooms & studies',
      'Office floors',
      'Retail & showroom',
      'Restaurants & lounges',
      'Heritage refurbishment',
    ],
    image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1400&q=80',
    imageVision: 'Wide-plank wood floor in a contemporary interior',
  },
  {
    slug: 'epoxy-flooring',
    icon: Drop,
    title: 'Epoxy Flooring',
    subtitle: 'Seamless resin systems',
    // Pending brand photography; using context-correct stock that clearly
    // shows a glossy seamless epoxy floor surface.
    hero: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=1920&q=80',
    heroVision: 'High-gloss seamless epoxy resin floor in a showroom',
    desc: 'Industrial-strength epoxy resin floors, seamless, hygienic, chemically resistant. Decorative metallic flake, solid colour, self-levelling, and food-grade variants. From garages to commercial kitchens to retail showrooms.',
    features: [
      { label: 'Self-levelling', detail: 'Mirror-flat finish, 2 to 4 mm thick' },
      { label: 'Metallic flake', detail: 'Decorative shimmer for showrooms' },
      { label: 'Anti-slip', detail: 'Quartz aggregate broadcast for wet areas' },
      { label: 'Food-grade', detail: 'HACCP-compatible, seamless coving' },
      { label: 'Chemical resistance', detail: 'Solvent, acid, oil-rated systems' },
      { label: 'Cure time', detail: 'Walkable in 24 hours, full cure in 7 days' },
    ],
    applications: [
      'Garages & workshops',
      'Retail showrooms',
      'Commercial kitchens',
      'Healthcare facilities',
      'Industrial floors',
      'Modern residential',
    ],
    image: 'https://images.unsplash.com/photo-1604762524889-3e2fcc145683?w=1400&q=80',
    imageVision: 'Glossy seamless epoxy floor surface',
  },
]

export default function Services() {
  const { serviceSlug } = useParams()
  const activeService = serviceSlug ? allServices.find((s) => s.slug === serviceSlug) : null

  useSEO(
    activeService
      ? {
          title: `${activeService.title} | La Foi Designs`,
          description: activeService.desc,
          path: `/services/${activeService.slug}`,
          image: activeService.hero,
          jsonLd: [
            breadcrumbsLd([
              { name: 'Home', path: '/' },
              { name: 'Services', path: '/services' },
              { name: activeService.title, path: `/services/${activeService.slug}` },
            ]),
            serviceLd({
              name: activeService.title,
              slug: activeService.slug,
              description: activeService.desc,
              image: activeService.hero,
            }),
          ],
        }
      : {
          title: 'Stretch Ceiling Solutions, Lighting, Interior Design | La Foi Designs',
          description:
            'Explore stretch ceilings, architectural lighting, interior design, flooring, epoxy systems, design consultation and maintenance for residential and commercial spaces in Zimbabwe.',
          path: '/services',
          jsonLd: breadcrumbsLd([
            { name: 'Home', path: '/' },
            { name: 'Services', path: '/services' },
          ]),
        }
  )

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
      <TechnicalGuideBand />
      <Process />
      <WhyChooseUs />
      <ServicesCTA />
    </motion.div>
  )
}

/* ============================================================================
   1. HERO, Single viewport editorial
   ============================================================================ */

function ServicesHero() {
  // Bento Hero, symmetric 6/6 split.
  // LEFT, heading + intro + 4-bullet service list.
  // RIGHT, 2x2 image bento (4 tiles) showing each service capability.
  const bentoTiles = [
    { src: 'https://images.unsplash.com/photo-1638284457192-27d3d0ec51aa?w=900&q=80', label: 'Stretch ceilings', vision: 'Stretch membrane install' },
    { src: 'https://images.unsplash.com/photo-1768270181430-3e3672a32283?w=900&q=80', label: 'Lighting', vision: 'Architectural lighting' },
    { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80', label: 'Interior design', vision: 'Curated residential interior' },
    { src: '/brand/images/45.png', label: 'Interior design', vision: 'Printed-marble boardroom ceiling' },
  ]

  return (
    <section className="relative bg-lafoi-cream pt-32 lg:pt-40 pb-16 lg:pb-24 overflow-hidden">
      <div aria-hidden className="absolute inset-0 mesh-gradient-1 opacity-40 pointer-events-none" />

      {/* Membrane stretch overlay, a faint horizontal grid of subtly arched lines.
          Tensions in on mount (1.4s, scaleY 1.04 → 1) then breathes in a slow loop. */}
      <motion.svg
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none mix-blend-multiply"
        initial={{ scaleY: 1.04, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 0.22 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        preserveAspectRatio="none"
        viewBox="0 0 1000 600"
      >
        <motion.g
          stroke="#1A8A2E"
          strokeWidth="0.5"
          fill="none"
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity }}
        >
          {Array.from({ length: 14 }).map((_, i) => {
            const y = (i + 1) * (600 / 15)
            return <path key={i} d={`M0 ${y} Q 500 ${y - 4} 1000 ${y}`} opacity={0.45} />
          })}
        </motion.g>
      </motion.svg>

      {/* Volume artifact */}
      <div className="absolute inset-x-0 top-28 lg:top-32 z-10 pointer-events-none">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-end gap-3">
          <span className="hidden sm:block w-8 h-px bg-lafoi-dark/20" />
          <span className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray/65">
            Vol.&nbsp;03, 2026 &middot; The Catalogue
          </span>
        </div>
      </div>

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* LEFT 6 cols, heading + bullet list */}
          <motion.div
            className="lg:col-span-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-3 mb-7">
              <span className="block w-12 h-px bg-lafoi-green/60" />
              <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                Four services &middot; One studio
              </p>
            </div>

            <h1
              className="font-display text-lafoi-dark tracking-[-0.035em] leading-[0.98] text-[3rem] sm:text-[4.5rem] lg:text-[5.4rem] xl:text-[5.8rem]"
              style={{ fontVariationSettings: '"opsz" 144' }}
            >
              <AnimatedHeading
                as="span"
                text="Ceilings, light,"
                className="block font-light"
                staggerChildren={0.06}
              />
              <AnimatedHeading
                as="span"
                text="and the craft between."
                className="block italic font-light text-lafoi-green"
                delay={0.2}
                staggerChildren={0.06}
              />
            </h1>

            <p className="mt-7 max-w-md text-base lg:text-[17px] text-lafoi-gray font-body font-light leading-[1.7]">
              {linkifyProse(
                'Eight services, each engineered to stand alone, designed to work together. From the stretch membrane overhead, the architectural lighting calibrated within it, and now the floor, wall, and finish that meet them.'
              )}
            </p>

            {/* Bullet list of all services, each links to its detail page */}
            <ul className="mt-8 space-y-2.5 border-t border-lafoi-dark/10 pt-7">
              {[
                { name: 'Stretch Ceiling Installation', slug: 'stretch-ceiling-installation' },
                { name: 'Lighting Solutions', slug: 'lighting-solutions' },
                { name: 'Interior Design', slug: 'interior-design' },
                { name: 'Flooring', slug: 'flooring' },
                { name: 'Epoxy Flooring', slug: 'epoxy-flooring' },
                { name: 'Design Consultation & Customisation', slug: 'design-consultation' },
                { name: 'Maintenance & Support', slug: 'maintenance-support' },
              ].map((s, i) => (
                <li key={s.slug} className="flex items-baseline gap-4 py-1.5 border-b border-lafoi-dark/8">
                  <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium shrink-0 w-6">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <Link
                    to={`/services/${s.slug}`}
                    className="font-display font-normal text-lafoi-dark text-base lg:text-lg prose-link prose-link-arrow"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
              <a
                href="#catalogue"
                className="group inline-flex items-center gap-3 px-6 py-3 bg-lafoi-dark text-white rounded-full font-body text-sm font-medium hover:bg-lafoi-green-light transition-all duration-500"
              >
                Browse the catalogue
                <ArrowRight size={15} weight="bold" className="group-hover:translate-x-1 transition-transform duration-300" />
              </a>
              <Link
                to="/contact"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-full border border-lafoi-dark/15 bg-white text-lafoi-dark font-body text-sm font-medium hover:border-lafoi-green/40 hover:text-lafoi-green transition-all duration-500"
              >
                Request samples
                <ArrowUpRight size={14} weight="regular" className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
              </Link>
            </div>
          </motion.div>

          {/* RIGHT 6 cols, 2x2 bento */}
          <motion.div
            className="lg:col-span-6"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="grid grid-cols-2 grid-rows-2 gap-3 lg:gap-4 aspect-square max-w-[560px] mx-auto">
              {bentoTiles.map((t, i) => (
                <div
                  key={t.label}
                  className={`relative overflow-hidden bg-lafoi-dark group ${
                    i === 0
                      ? 'rounded-tl-[2rem] rounded-tr-md rounded-bl-md rounded-br-md'
                      : i === 1
                      ? 'rounded-tr-[2rem] rounded-tl-md rounded-bl-md rounded-br-md'
                      : i === 2
                      ? 'rounded-bl-[2rem] rounded-tl-md rounded-tr-md rounded-br-md'
                      : 'rounded-br-[2rem] rounded-tl-md rounded-tr-md rounded-bl-md'
                  }`}
                >
                  <OptimizedImage
                    src={t.src}
                    alt={`${t.label} service preview, ${t.vision}`}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    fill
                    vision={t.vision}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/75 via-lafoi-dark/15 to-transparent" />
                  <span className="absolute bottom-3 left-4 right-4 font-sora text-[10px] tracking-[0.25em] uppercase text-white/95">
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ============================================================================
   2. CATALOGUE, Editorial alternating spreads
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
                Four services.{' '}
                <span className="text-lafoi-green">Read like a magazine.</span>
              </h2>
            </AnimatedSection>
          </div>
          <AnimatedSection delay={0.2} direction="right">
            <p className="font-body text-lafoi-gray max-w-sm leading-relaxed">
              {linkifyProse(
                'Each entry below is a complete service, from stretch ceiling installation to lighting solutions, design consultation and maintenance and support. Click through for specifications, applications, and a request-quote sidebar.'
              )}
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
  // Image-side enters from its outer edge: image-on-left → -X, image-on-right → +X.
  const initialX = isLeft ? -80 : 80

  return (
    <motion.div
      ref={ref}
      className={`grid lg:grid-cols-12 gap-8 lg:gap-16 items-center ${
        !isLeft ? 'lg:[&>*:first-child]:order-2' : ''
      }`}
      initial={{ opacity: 0, x: initialX, y: 30 }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: initialX, y: 30 }}
      transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* image column */}
      <div className="lg:col-span-7">
        <div className="relative aspect-[5/4] rounded-3xl overflow-hidden bg-lafoi-dark group">
          <OptimizedImage
            src={service.image}
            alt={`${service.title}, ${service.imageVision}`}
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
          {linkifyProse(service.desc)}
        </p>

        {/* applications, hairline-divided rows */}
        <div className="space-y-0 border-t border-lafoi-dark/10 mb-8 max-w-md">
          {service.applications.slice(0, 4).map((a, idx) => (
            <div
              key={a}
              className="flex items-baseline gap-4 py-3 border-b border-lafoi-dark/10"
            >
              <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">
                {idx % 2 === 0 ? `0${idx + 1}` : <span>, </span>}
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
   2.5 TECHNICAL GUIDE BAND, downloadable PDF callout
   ============================================================================ */

function TechnicalGuideBand() {
  return (
    <section className="relative py-16 lg:py-24 bg-lafoi-cream overflow-hidden">
      <div className="absolute inset-0 mesh-gradient-1 opacity-50 pointer-events-none" />
      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <AnimatedSection>
          <div className="relative rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-2xl rounded-bl-2xl bg-lafoi-dark text-white overflow-hidden">
            <div aria-hidden className="absolute inset-0 dot-pattern opacity-15 pointer-events-none" />
            <div aria-hidden className="absolute -top-24 -right-12 w-[420px] h-[420px] rounded-full bg-lafoi-green/15 blur-[120px] pointer-events-none" />
            <div aria-hidden className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-lafoi-green-light via-lafoi-green to-lafoi-green/40" />

            <div className="relative grid lg:grid-cols-12 gap-8 lg:gap-12 items-center p-8 lg:p-14">
              <div className="lg:col-span-8">
                <div className="flex items-center gap-3 mb-5">
                  <span className="block w-10 h-px bg-lafoi-green-light/60" />
                  <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green-light">
                    Technical guide &middot; PDF
                  </p>
                </div>
                <h2 className="font-display font-light text-white text-3xl sm:text-4xl lg:text-[2.8rem] leading-[1.1] tracking-[-0.02em] mb-5">
                  What are stretch ceilings?{' '}
                  <span className="font-light italic text-lafoi-green-light">A primer.</span>
                </h2>
                <p className="font-body font-light text-base lg:text-lg text-white/70 leading-[1.7] max-w-xl">
                  A short, illustrated technical guide, covering membranes, edge details, lighting integration,
                  fire ratings, and what to expect on install day. Useful before a brief, indispensable during one.
                </p>
              </div>
              <div className="lg:col-span-4 flex lg:justify-end">
                <a
                  href="/brand/docs/stretch-ceilings-guide.pdf"
                  target="_blank"
                  rel="noopener"
                  download
                  className="group inline-flex items-center gap-3 px-7 py-4 rounded-full bg-lafoi-green-light text-white font-sora text-sm font-semibold hover:bg-lafoi-green transition-all duration-500 shadow-[0_12px_38px_-10px_rgba(34,197,94,0.55)]"
                >
                  <FilePdf size={17} weight="duotone" />
                  Download the guide
                  <DownloadSimple
                    size={14}
                    weight="bold"
                    className="group-hover:translate-y-0.5 transition-transform duration-300"
                  />
                </a>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ============================================================================
   3. PROCESS, Numbered editorial sequence
   ============================================================================ */

function Process() {
  const steps = [
    { num: '01', title: 'Free consultation', desc: 'We assess your space, listen to the brief, and discuss design possibilities. The first conversation costs nothing.' },
    { num: '02', title: 'Custom design', desc: 'Detailed plans with material, lighting and edge-detail selections. Sampled in your light, not ours.' },
    { num: '03', title: 'Manufacturing', desc: 'Your ceiling is custom-made to your exact dimensions using premium PVC or fabric membrane.' },
    { num: '04', title: 'Installation', desc: 'Expert installation, typically completed in a single working day per room, no demolition needed.' },
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
                  {linkifyProse(step.desc, { variant: 'dark' })}
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
   4. WHY CHOOSE US, Editorial 4-up
   ============================================================================ */

function WhyChooseUs() {
  const reasons = [
    {
      title: 'First in Zimbabwe',
      desc: 'We pioneered stretch ceilings in Zimbabwe, bringing technology never before seen in the country.',
      icon: Trophy,
    },
    {
      title: 'Premium membrane',
      desc: 'Premium PVC and fabric membranes meet the highest international quality and safety standards.',
      icon: Sparkle,
    },
    {
      title: 'Trained installers',
      desc: 'Our team trained directly with European manufacturers for fast, flawless installations.',
      icon: CheckCircle,
    },
    {
      title: 'Full warranty',
      desc: 'Every installation is backed by a 10-year manufacturer warranty and 2-year workmanship cover.',
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
                  {linkifyProse(r.desc)}
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
   5. CTA, Cinematic full-bleed
   ============================================================================ */

function ServicesCTA() {
  return (
    <section className="relative min-h-[80vh] lg:min-h-[88vh] flex items-center overflow-hidden bg-lafoi-dark">
      <div className="absolute inset-0">
        <OptimizedImage
          src="https://images.unsplash.com/photo-1639663742190-1b3dba2eebcf?w=2000&q=85"
          alt="Master suite with luminous stretch ceiling and warm perimeter lighting"
          className="w-full h-full object-cover object-center"
          fill
          vision="Master suite with luminous stretch ceiling, invitation to specify"
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

          <AnimatedSection delay={0.25} direction="left">
            <p className="mt-8 max-w-xl text-base lg:text-lg text-white/70 font-body font-light leading-relaxed">
              {linkifyProse(
                "Our consultants walk you through stretch ceiling finishes, lighting solutions compatibility and on-site samples, at no charge. WhatsApp is the fastest channel; email if you'd rather attach drawings, or browse our portfolio first.",
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
   SERVICE DETAIL, /services/:slug
   ============================================================================ */

function ServiceDetail({ service }) {
  const detailSlides = [
    { src: service.hero, alt: `${service.title} service hero, ${service.heroVision}`, vision: service.heroVision },
    {
      src: 'https://images.unsplash.com/photo-1758194090785-8e09b7288199?w=2200&q=85',
      alt: 'Luminous backlit translucent stretch ceiling spanning a hospitality lobby',
      vision: 'Luminous backlit ceiling',
    },
    {
      src: 'https://images.unsplash.com/photo-1639663742190-1b3dba2eebcf?w=2200&q=85',
      alt: 'Master suite with stretch ceiling and integrated cove lighting',
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

        {/* Volume artifact, respects content margin */}
        <div className="absolute inset-x-0 top-28 lg:top-32 z-10 pointer-events-none">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-end gap-3">
            <span className="hidden sm:block w-8 h-px bg-white/30" />
            <span className="font-sora text-[10px] tracking-[0.28em] uppercase text-white/65">
              Service 0{idx + 1} / 0{allServices.length} &middot; {service.subtitle}
            </span>
          </div>
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
                {linkifyProse(service.desc, { variant: 'dark' })}
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

      {/* BODY, two-column with editorial sticky sidebar */}
      <section className="relative py-20 lg:py-32 bg-lafoi-cream overflow-hidden">
        <div className="absolute inset-0 pattern-cross-light opacity-30 pointer-events-none" />

        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            {/* Left, long-form */}
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
                  {linkifyProse(service.desc)}
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
                        {idx % 2 === 0 ? `0${idx + 1}` : <span>, </span>}
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
                    alt={`${service.title}, ${service.imageVision}`}
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

            {/* Right, sticky sidebar */}
            <aside className="lg:col-span-4">
              <AnimatedSection direction="right">
                <div className="sticky top-28 space-y-5">
                  {/* Applications card, glass + asymmetric */}
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
                        Backed by warranty
                      </p>
                    </div>
                    <p className="font-body font-light text-xs text-lafoi-gray leading-relaxed">
                      Manufacturer warranty up to 10 years. Premium PVC and fabric membrane. Class B fire
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
