import React, { useState, useMemo, useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Calendar,
  Ruler,
  Camera,
  Sparkle,
} from '@phosphor-icons/react'
import AnimatedSection, { StaggerContainer, StaggerItem } from '../components/ui/AnimatedSection'
import OptimizedImage from '../components/ui/OptimizedImage'
import HeroSlideshow from '../components/ui/HeroSlideshow'
import { useSEO } from '../utils/seo'
import { projects, projectCategories, totalStats } from '../data/site'
import { linkifyProse } from '../utils/linkify.jsx'

const PROJECTS_HERO_SLIDES = [
  {
    src: 'https://images.unsplash.com/photo-1758194090785-8e09b7288199?w=2200&q=85',
    alt: 'Luminous hotel ballroom ceiling backlit and glowing across full plane',
    vision: 'Transformation hero — backlit hotel ballroom',
  },
  {
    src: 'https://images.unsplash.com/photo-1634146601607-9f319f71b5ee?w=2200&q=85',
    alt: 'Building with dramatic architectural ceiling',
    vision: 'Sculptural ceiling drama',
  },
  {
    src: 'https://images.unsplash.com/photo-1730367019975-4ad8d9e14ef2?w=2200&q=85',
    alt: 'Indoor pool with stone walls and natural light',
    vision: 'Spa hospitality transformation',
  },
]

// asymmetric aspect rotation for the editorial grid
const aspectRotation = ['aspect-[3/4]', 'aspect-[4/3]', 'aspect-[3/4]', 'aspect-square', 'aspect-[3/4]', 'aspect-[4/3]', 'aspect-square', 'aspect-[3/4]', 'aspect-[4/3]']

export default function Projects() {
  const [filter, setFilter] = useState('All')

  useSEO({
    title: 'Case Studies & Projects',
    description:
      "Explore deep case studies of La Foi Designs' stretch ceiling and architectural lighting installations across Zimbabwe — residential, commercial, hospitality and retail transformations.",
    path: '/projects',
  })

  const filtered = useMemo(() => (filter === 'All' ? projects : projects.filter((p) => p.category === filter)), [filter])

  const featured = projects.find((p) => p.featured) || projects[0]
  // exclude featured from the grid below if it's a featured-style hero
  const gridProjects = filtered.filter((p) => p.slug !== featured.slug)

  const counts = useMemo(() => {
    const c = { All: projects.length }
    projectCategories.forEach((cat) => {
      if (cat !== 'All') c[cat] = projects.filter((p) => p.category === cat).length
    })
    return c
  }, [])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
      {/* HERO — Dark Masonry: three vertical strips with overlaid centre headline */}
      <section className="relative bg-lafoi-dark overflow-hidden">
        {/* Volume artifact */}
        <div className="absolute inset-x-0 top-28 lg:top-32 z-30 pointer-events-none">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex justify-end">
            <span className="font-sora text-[10px] tracking-[0.35em] uppercase text-white/55">
              Vol.&nbsp;09 &mdash; The Archive
            </span>
          </div>
        </div>

        <div className="relative grid grid-cols-3 h-[88vh] min-h-[640px]">
          {/* Three image strips, hairline-separated. Different images from those used on Home. */}
          {[
            { src: '/brand/images/55.png', alt: 'Spa pool with photographic sky ceiling' },
            { src: '/brand/images/13.png', alt: 'Kitchen with framed black gloss panel' },
            { src: '/brand/images/29.png', alt: 'Home theatre with starfield ceiling' },
          ].map((s, i) => (
            <motion.div
              key={i}
              className="relative overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <OptimizedImage
                src={s.src}
                alt={s.alt}
                className="w-full h-full object-cover object-center"
                fill
                vision={s.alt}
              />
              <div className="absolute inset-0 bg-lafoi-dark/45" />
              {i < 2 && (
                <span aria-hidden className="absolute right-0 top-0 bottom-0 w-px bg-white/8" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Overlaid centre — massive headline + tags */}
        <div className="absolute inset-0 z-20 flex items-center pointer-events-none">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 w-full">
            <motion.div
              className="max-w-3xl mx-auto text-center"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center justify-center gap-3 mb-6 pointer-events-auto">
                <span className="block w-10 h-px bg-lafoi-green-light/70" />
                <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green-light">
                  The Archive &middot; {projects.length} case studies
                </p>
                <span className="block w-10 h-px bg-lafoi-green-light/70" />
              </div>

              <h1
                className="font-display font-light text-white tracking-[-0.04em] leading-[0.92]"
                style={{ fontSize: 'clamp(3.5rem, 9vw, 8rem)', fontVariationSettings: '"opsz" 144' }}
              >
                Case studies in
                <span className="block italic text-lafoi-green-light">transformation.</span>
              </h1>

              <p className="mt-8 max-w-lg mx-auto text-base lg:text-lg text-white/75 font-body font-light leading-[1.65]">
                {linkifyProse(
                  'Deep case studies across residence, hospitality, commercial and retail. Brief, approach, outcome — and the stretch ceiling and lighting solutions specified for each project.',
                  { variant: 'dark' }
                )}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURED PROJECT — full bleed editorial */}
      <section className="bg-lafoi-dark text-white relative overflow-hidden">
        <div className="grid lg:grid-cols-12 min-h-[60vh]">
          {/* image */}
          <div className="lg:col-span-7 relative min-h-[400px] lg:min-h-0">
            <OptimizedImage
              src={featured.hero}
              alt={featured.title}
              className="w-full h-full object-cover object-center"
              fill
              vision={featured.vision}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-lafoi-dark/40 lg:to-lafoi-dark" />
          </div>
          {/* copy */}
          <div className="lg:col-span-5 flex items-center px-6 sm:px-10 lg:px-14 py-14 lg:py-20 relative">
            <AnimatedSection direction="left">
              <p className="text-lafoi-green-light font-sora text-[10px] font-semibold tracking-widest uppercase mb-4 inline-flex items-center gap-2">
                <Sparkle size={11} weight="fill" /> Featured case study &middot; {featured.category}
              </p>
              <h2 className="heading-xl text-3xl sm:text-4xl lg:text-5xl mb-3">
                {featured.title}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs font-sora text-white/55 mb-5">
                <span className="inline-flex items-center gap-1.5"><MapPin size={12} weight="regular" />{featured.location}</span>
                <span className="text-white/30">&middot;</span>
                <span className="inline-flex items-center gap-1.5"><Calendar size={12} weight="regular" />{featured.year}</span>
                <span className="text-white/30">&middot;</span>
                <span className="inline-flex items-center gap-1.5"><Ruler size={12} weight="regular" />{featured.area}</span>
              </div>
              <p className="font-general text-white/70 text-base leading-relaxed mb-7 max-w-md">
                {linkifyProse(featured.brief, { variant: 'dark' })}
              </p>
              <Link
                to={`/projects/${featured.slug}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-lafoi-green hover:bg-lafoi-green-light text-white rounded-full font-sora text-sm font-medium transition-colors duration-300 group shadow-lg shadow-lafoi-green/20"
              >
                Read case study
                <ArrowRight size={14} weight="bold" className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* FILTER + GRID */}
      <section className="py-16 lg:py-24 bg-lafoi-cream relative">
        <div className="absolute inset-0 mesh-gradient-1 pointer-events-none" />
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 relative">
          <AnimatedSection>
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="block w-10 h-px bg-lafoi-green/60" />
                  <p className="text-lafoi-green font-sora text-xs font-semibold tracking-widest uppercase">
                    All projects
                  </p>
                </div>
                <h2 className="heading-lg text-3xl lg:text-5xl text-lafoi-dark">
                  The complete <span className="font-display font-light text-lafoi-green">archive</span>
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {projectCategories.map((cat) => {
                  const active = filter === cat
                  return (
                    <button
                      key={cat}
                      onClick={() => setFilter(cat)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-sora font-medium transition-all duration-300 ${
                        active
                          ? 'bg-lafoi-dark text-white shadow-md'
                          : 'bg-white/70 backdrop-blur-md border border-gray-100 text-lafoi-gray hover:bg-lafoi-green/10 hover:text-lafoi-green'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className={`text-[10px] font-mono ${active ? 'text-white/60' : 'text-lafoi-gray-medium'}`}>
                        {counts[cat] || 0}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </AnimatedSection>

          {/* asymmetric editorial grid */}
          {gridProjects.length > 0 ? (
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {gridProjects.map((proj, i) => (
                <StaggerItem
                  key={proj.slug}
                  className={i === 0 ? 'sm:col-span-2 lg:col-span-2 lg:row-span-2' : ''}
                >
                  <ProjectCard project={proj} large={i === 0} aspect={i === 0 ? 'aspect-[4/3] sm:aspect-[16/9] lg:aspect-auto lg:h-full' : aspectRotation[(i + 1) % aspectRotation.length]} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <div className="py-24 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white flex items-center justify-center">
                <Camera size={20} weight="regular" className="text-lafoi-gray-medium" />
              </div>
              <p className="font-sora text-lafoi-dark font-medium mb-1">No projects in this category yet</p>
              <p className="text-sm text-lafoi-gray-medium font-general">Switch filter or view all.</p>
            </div>
          )}
        </div>
      </section>

      {/* STATS BAND */}
      <section className="py-16 lg:py-24 bg-lafoi-dark text-white relative overflow-hidden">
        <div className="absolute inset-0 pattern-blueprint-light opacity-50 pointer-events-none" />
        <div className="absolute inset-0 dot-pattern opacity-15 pointer-events-none" />
        <div className="absolute -top-24 left-1/4 w-96 h-96 bg-lafoi-green/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 relative">
          <AnimatedSection>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-lafoi-green-light font-sora text-xs font-semibold tracking-widest uppercase mb-3">
                The numbers
              </p>
              <h2 className="heading-lg text-3xl lg:text-5xl">
                Proof in <span className="font-display font-light">square metres</span>
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
            <StatItem value={1} suffix="st" label="Stretch ceiling studio in Zimbabwe" />
            <StatItem value={totalStats.servicesOffered} suffix="" label="Core service lines" />
            <StatItem value={totalStats.totalProjects} suffix="" label="Case studies on record" />
            <StatItem value={totalStats.warrantyYears} suffix="yr" label="Manufacturer warranty" />
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <OptimizedImage
            src="https://images.unsplash.com/photo-1730367019975-4ad8d9e14ef2?w=1920&q=80"
            alt="Start your project"
            className="w-full h-full object-cover"
            fill
            vision="Spa interior with photographic ceiling and warm lighting"
          />
          <div className="absolute inset-0 bg-lafoi-dark/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-lafoi-dark/85 via-lafoi-dark/40 to-transparent" />
        </div>
        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <AnimatedSection>
            <div className="max-w-2xl">
              <p className="text-lafoi-green-light font-sora text-xs font-semibold tracking-widest uppercase mb-3">
                Start your project
              </p>
              <h2 className="heading-lg text-3xl lg:text-5xl text-white mb-4">
                Become the <span className="font-display font-light">next case study</span>.
              </h2>
              <p className="text-white/70 font-general text-lg mb-8 max-w-lg">
                Every project on this page started with a site visit. Free, no-obligation assessment within 5 working days of contact.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-lafoi-green text-white rounded-full font-sora text-sm font-medium hover:bg-lafoi-green-light transition-colors duration-300 shadow-lg shadow-lafoi-green/30 group"
                >
                  Book a site visit
                  <ArrowRight size={14} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-sora text-sm font-medium hover:bg-white/15 transition-colors duration-300"
                >
                  Browse the catalogue
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </motion.div>
  )
}

// ----------------------------------------------------------------------------
// PROJECT CARD
// ----------------------------------------------------------------------------

function ProjectCard({ project, large = false, aspect = 'aspect-[3/4]' }) {
  return (
    <Link
      to={`/projects/${project.slug}`}
      className={`group relative block overflow-hidden rounded-3xl ${aspect} card-shine`}
    >
      <OptimizedImage
        src={project.thumb}
        alt={project.title}
        className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        fill
        vision={project.vision}
      />
      {/* default overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      {/* hover overlay reveal */}
      <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/95 via-lafoi-dark/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* category pill */}
      <div className="absolute top-5 left-5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-sora font-semibold tracking-widest uppercase text-lafoi-dark">
        {project.category}
      </div>

      {/* corner CTA */}
      <div className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all duration-500">
        <ArrowUpRight size={14} weight="bold" />
      </div>

      {/* default bottom info (always visible) */}
      <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-7 text-white">
        <h3 className={`font-sora font-bold ${large ? 'text-2xl lg:text-3xl' : 'text-lg lg:text-xl'} mb-1`}>
          {project.title}
        </h3>
        <p className="text-xs font-sora text-white/65 inline-flex items-center gap-1.5">
          <MapPin size={11} weight="regular" />
          {project.location}
        </p>

        {/* hover-revealed meta */}
        <div className="grid grid-cols-3 gap-3 mt-4 max-h-0 group-hover:max-h-32 opacity-0 group-hover:opacity-100 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
          <Meta label="Year" value={project.year} />
          <Meta label="Area" value={project.area} />
          <Meta label="Duration" value={project.duration} />
        </div>
      </div>
    </Link>
  )
}

function Meta({ label, value }) {
  return (
    <div>
      <p className="text-[9px] font-sora font-semibold tracking-widest uppercase text-lafoi-green-light mb-0.5">
        {label}
      </p>
      <p className="text-xs font-sora font-medium text-white">{value}</p>
    </div>
  )
}

// ----------------------------------------------------------------------------
// STATS — IO-triggered count up
// ----------------------------------------------------------------------------

function StatItem({ value, suffix = '', label }) {
  return (
    <div className="text-center">
      <CountUp to={value} suffix={suffix} />
      <p className="text-xs sm:text-sm font-sora text-white/55 mt-3 max-w-[180px] mx-auto leading-snug">
        {label}
      </p>
    </div>
  )
}

function CountUp({ to, suffix = '', duration = 1600 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!inView) return
    let raf
    const start = performance.now()
    const animate = (t) => {
      const p = Math.min((t - start) / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(to * eased))
      if (p < 1) raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, duration])

  return (
    <p ref={ref} className="heading-xl text-5xl lg:text-6xl text-white tabular-nums">
      <span className="text-gradient">{n.toLocaleString()}</span>
      <span className="text-lafoi-green-light">{suffix}</span>
    </p>
  )
}
