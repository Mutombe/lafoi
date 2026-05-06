import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  MagnifyingGlass,
  Funnel,
  Package,
  Sparkle,
  Stack,
  Lightbulb,
  Wrench,
  X as XIcon,
} from '@phosphor-icons/react'
import AnimatedSection, { StaggerContainer, StaggerItem } from '../components/ui/AnimatedSection'
import OptimizedImage from '../components/ui/OptimizedImage'
import HeroSlideshow from '../components/ui/HeroSlideshow'
import { useSEO, breadcrumbsLd } from '../utils/seo'
import { products, productCategories, productApplications } from '../data/site'
import { linkifyProse } from '../utils/linkify.jsx'

const PRODUCTS_HERO_SLIDES = [
  {
    src: 'https://images.unsplash.com/photo-1638284457192-27d3d0ec51aa?w=2200&q=85',
    alt: 'Calm contemporary living room with stretch ceiling',
    vision: 'Material-first matte ceiling',
  },
  {
    src: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=2200&q=85',
    alt: 'Spa-like bathroom with skylight ceiling',
    vision: 'Translucent membrane in bathroom',
  },
  {
    src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2200&q=85',
    alt: 'Modern interior with ceiling design',
    vision: 'Surface and light meeting in living space',
  },
]

const categoryIcon = {
  'Stretch Ceilings': Stack,
  Lighting: Lightbulb,
  Accessories: Wrench,
}

export default function Products() {
  const [category, setCategory] = useState('All')
  const [application, setApplication] = useState('All')
  const [query, setQuery] = useState('')

  useSEO({
    title: 'Membranes, Lighting & Accessories Catalogue',
    description:
      'Browse the La Foi Designs catalogue — PVC and fabric stretch membranes (matte, satin, gloss, translucent, printed, sculptural, acoustic, mirror, suede), lighting fixtures, and installation accessories.',
    path: '/products',
    jsonLd: breadcrumbsLd([
      { name: 'Home', path: '/' },
      { name: 'Products', path: '/products' },
    ]),
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      if (category !== 'All' && p.category !== category) return false
      if (application !== 'All' && !(p.applications || []).includes(application)) return false
      if (q) {
        const haystack = `${p.name} ${p.shortDesc} ${p.finish} ${(p.applications || []).join(' ')}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [category, application, query])

  const featured = products.filter((p) => p.featured).slice(0, 4)
  const counts = useMemo(() => {
    const c = { All: products.length }
    productCategories.forEach((cat) => {
      if (cat !== 'All') c[cat] = products.filter((p) => p.category === cat).length
    })
    return c
  }, [])

  const applicationBento = [
    { label: 'Residential', desc: 'Homes that breathe.', img: 'https://images.unsplash.com/photo-1638284457192-27d3d0ec51aa?w=1200&q=80', vision: 'Calm contemporary living room with stretch ceiling' },
    { label: 'Hospitality', desc: 'Rooms that perform.', img: 'https://images.unsplash.com/photo-1758194090785-8e09b7288199?w=1200&q=80', vision: 'Hotel lobby with luminous backlit ceiling' },
    { label: 'Office', desc: 'Spaces that focus.', img: 'https://images.unsplash.com/photo-1595513279524-fa90ad188c98?w=1200&q=80', vision: 'Open-plan office with acoustic ceiling treatment' },
    { label: 'Retail', desc: 'Stores that sell themselves.', img: 'https://images.unsplash.com/photo-1768270181430-3e3672a32283?w=1200&q=80', vision: 'Luxury retail showroom with gloss ceiling and track lighting' },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
      {/* HERO — Swiss Minimalist. Cream BG. No image. Monumental serif. Swatch row. */}
      <section className="relative bg-lafoi-cream pt-32 lg:pt-40 pb-16 lg:pb-24 overflow-hidden">
        <div aria-hidden className="absolute inset-0 mesh-gradient-1 opacity-40 pointer-events-none" />

        {/* Volume artifact */}
        <div className="absolute inset-x-0 top-28 lg:top-32 z-10 pointer-events-none">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex justify-end">
            <span className="font-sora text-[10px] tracking-[0.35em] uppercase text-lafoi-gray/55">
              Vol.&nbsp;10 &mdash; The Library
            </span>
          </div>
        </div>

        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 text-center">
          <motion.div
            className="flex items-center justify-center gap-3 mb-8 lg:mb-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="block w-10 h-px bg-lafoi-green/60" />
            <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
              The Collection &middot; {products.length} products
            </p>
            <span className="block w-10 h-px bg-lafoi-green/60" />
          </motion.div>

          <motion.h1
            className="font-display font-light text-lafoi-dark tracking-[-0.04em] leading-[0.92] mx-auto"
            style={{ fontSize: 'clamp(3.5rem, 10vw, 10rem)', fontVariationSettings: '"opsz" 144' }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            Membranes
            <span className="block italic text-lafoi-green">&amp; lighting.</span>
          </motion.h1>

          <motion.p
            className="mt-8 lg:mt-10 max-w-xl mx-auto text-base lg:text-lg text-lafoi-gray font-body font-light leading-[1.7]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {linkifyProse(
              'Premium PVC and fabric stretch membranes paired with bespoke architectural lighting. A focused product family — matte finish, satin finish, gloss finish, translucent backlit, printed photographic, sculptural and acoustic — engineered to disappear into great architecture.'
            )}
          </motion.p>

          <motion.div
            className="flex flex-wrap items-center justify-center gap-3 mt-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <a
              href="#catalog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-lafoi-dark text-white rounded-full font-sora text-sm font-medium hover:bg-lafoi-green-light transition-colors duration-300 group"
            >
              Browse the catalogue
              <ArrowRight size={14} weight="bold" className="group-hover:translate-x-1 transition-transform" />
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-lafoi-dark/15 text-lafoi-dark rounded-full font-sora text-sm font-medium hover:border-lafoi-green/40 hover:text-lafoi-green transition-colors duration-300"
            >
              Request samples
            </Link>
          </motion.div>

          {/* Swatch row — 8 finishes aligned at the bottom */}
          <motion.div
            className="mt-14 lg:mt-20 pt-8 border-t border-lafoi-dark/10 flex flex-wrap items-center justify-center gap-x-3 gap-y-4 lg:gap-x-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.7 }}
          >
            <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium mr-2">
              The library
            </p>
            {[
              { name: 'Matte', tone: '#E9E6DE' },
              { name: 'Satin', tone: '#D2CFC4' },
              { name: 'Gloss', tone: '#1A1A1A' },
              { name: 'Translucent', tone: '#F4F1E8' },
              { name: 'Printed', tone: '#9DC3D6' },
              { name: '3D', tone: '#1A8A2E' },
              { name: 'Acoustic', tone: '#C9C5BA' },
              { name: 'Mirror', tone: '#A8A8A8' },
            ].map((s) => (
              <div key={s.name} className="flex flex-col items-center gap-1.5">
                <span
                  className="block w-9 h-9 lg:w-11 lg:h-11 rounded-full ring-1 ring-lafoi-dark/10"
                  style={{ background: s.tone }}
                />
                <span className="font-sora text-[9px] tracking-[0.2em] uppercase text-lafoi-gray-medium">
                  {s.name}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURED STRIP — editorial asymmetric */}
      <section className="py-16 lg:py-24 bg-lafoi-cream relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient-1 pointer-events-none" />
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 relative">
          <AnimatedSection>
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
              <div>
                <p className="text-lafoi-green font-sora text-xs font-semibold tracking-widest uppercase mb-3 flex items-center gap-2">
                  <Sparkle size={14} weight="fill" /> Editor&rsquo;s pick
                </p>
                <h2 className="heading-lg text-3xl lg:text-5xl text-lafoi-dark max-w-2xl">
                  Four signatures, <span className="font-display font-light text-lafoi-green">always specified</span>.
                </h2>
              </div>
              <p className="font-general text-lafoi-gray max-w-md">
                {linkifyProse(
                  'The stretch ceiling products our designers reach for first — proven, versatile, and the foundation of most La Foi installations. Each one is documented across our portfolio in real interior settings.'
                )}
              </p>
            </div>
          </AnimatedSection>

          {/* asymmetric: 1 large + 3 stacked */}
          <div className="grid lg:grid-cols-12 gap-5">
            {featured[0] && (
              <AnimatedSection className="lg:col-span-7" direction="left">
                <FeaturedCardLarge product={featured[0]} />
              </AnimatedSection>
            )}
            <div className="lg:col-span-5 grid sm:grid-cols-1 gap-5">
              {featured.slice(1, 4).map((p, i) => (
                <AnimatedSection key={p.slug} delay={0.1 + i * 0.1} direction="right">
                  <FeaturedCardSmall product={p} />
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FILTER BAR + GRID */}
      <section id="catalog" className="py-16 lg:py-24 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <AnimatedSection>
            <div className="mb-12">
              <p className="text-lafoi-green font-sora text-xs font-semibold tracking-widest uppercase mb-3">
                Catalogue
              </p>
              <h2 className="heading-lg text-3xl lg:text-5xl text-lafoi-dark mb-3">
                The full range
              </h2>
              <p className="font-general text-lafoi-gray max-w-2xl">
                {linkifyProse(
                  'Filter by category, application, or search the catalogue directly. Click any stretch ceiling or lighting solution for full specifications, warranty details and case studies in our portfolio.'
                )}
              </p>
            </div>
          </AnimatedSection>

          {/* sticky filter bar — glass + faint blueprint pattern */}
          <div className="sticky top-16 lg:top-20 z-30 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 bg-white/70 backdrop-blur-xl border-y border-white/40 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] py-5 mb-10 relative">
            <div aria-hidden className="absolute inset-0 pattern-blueprint opacity-30 pointer-events-none" />
            <div className="relative flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* category pills */}
                <div className="flex flex-wrap gap-2">
                  {productCategories.map((cat) => {
                    const Icon = categoryIcon[cat] || Package
                    const active = category === cat
                    return (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-sora font-medium transition-all duration-300 ${
                          active
                            ? 'bg-lafoi-dark text-white shadow-md'
                            : 'bg-gray-100 text-lafoi-gray hover:bg-lafoi-green/10 hover:text-lafoi-green'
                        }`}
                      >
                        {cat !== 'All' && <Icon size={13} weight="regular" />}
                        <span>{cat}</span>
                        <span className={`text-[10px] font-mono ${active ? 'text-white/60' : 'text-lafoi-gray-medium'}`}>
                          {counts[cat] || 0}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* search */}
                <div className="relative w-full sm:w-72">
                  <MagnifyingGlass size={14} weight="regular" className="absolute left-4 top-1/2 -translate-y-1/2 text-lafoi-gray-medium" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search products"
                    className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-100 rounded-full text-sm font-general placeholder:text-gray-400 outline-none focus:border-lafoi-green/50 focus:bg-white transition-all duration-300"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                      aria-label="Clear search"
                    >
                      <XIcon size={10} weight="bold" />
                    </button>
                  )}
                </div>
              </div>

              {/* applications row */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-sora font-semibold tracking-widest uppercase text-lafoi-gray-medium pr-2">
                  <Funnel size={11} weight="regular" /> Application
                </span>
                {productApplications.map((app) => {
                  const active = application === app
                  return (
                    <button
                      key={app}
                      onClick={() => setApplication(app)}
                      className={`px-3 py-1 rounded-full text-[11px] font-sora font-medium transition-all duration-300 ${
                        active
                          ? 'bg-lafoi-green text-white'
                          : 'bg-transparent text-lafoi-gray hover:text-lafoi-green'
                      }`}
                    >
                      {app}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* result count */}
          <div className="mb-8 flex items-center justify-between">
            <p className="text-sm font-general text-lafoi-gray-medium">
              <span className="font-medium text-lafoi-dark">{filtered.length}</span>{' '}
              {filtered.length === 1 ? 'product' : 'products'}
              {category !== 'All' && <> in <span className="text-lafoi-green">{category}</span></>}
              {application !== 'All' && <> for <span className="text-lafoi-green">{application}</span></>}
            </p>
            {(category !== 'All' || application !== 'All' || query) && (
              <button
                onClick={() => {
                  setCategory('All')
                  setApplication('All')
                  setQuery('')
                }}
                className="text-xs font-sora text-lafoi-gray-medium hover:text-lafoi-green transition-colors inline-flex items-center gap-1"
              >
                Clear all <XIcon size={11} weight="bold" />
              </button>
            )}
          </div>

          {/* product grid */}
          {filtered.length > 0 ? (
            <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {filtered.map((p) => (
                <StaggerItem key={p.slug}>
                  <ProductCard product={p} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <div className="py-24 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <MagnifyingGlass size={20} weight="regular" className="text-lafoi-gray-medium" />
              </div>
              <p className="font-sora text-lafoi-dark font-medium mb-1">No products match those filters</p>
              <p className="text-sm text-lafoi-gray-medium font-general">Try clearing or broadening your selection.</p>
            </div>
          )}
        </div>
      </section>

      {/* APPLICATION BENTO */}
      <section className="py-16 lg:py-24 bg-lafoi-cream">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <AnimatedSection>
            <div className="mb-12 max-w-2xl">
              <p className="text-lafoi-green font-sora text-xs font-semibold tracking-widest uppercase mb-3">
                By application
              </p>
              <h2 className="heading-lg text-3xl lg:text-5xl text-lafoi-dark">
                Find what fits <span className="font-display font-light text-lafoi-green">your space</span>.
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {applicationBento.map((b, i) => (
              <AnimatedSection key={b.label} delay={i * 0.08} direction="up">
                <button
                  onClick={() => {
                    setApplication(b.label)
                    setCategory('All')
                    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="group relative block w-full aspect-[3/4] rounded-3xl overflow-hidden text-left card-shine"
                >
                  <OptimizedImage
                    src={b.img}
                    alt={`${b.label} application — ${b.vision}`}
                    className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                    fill
                    vision={b.vision}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute inset-0 p-7 flex flex-col justify-end text-white">
                    <p className="text-[10px] font-sora font-semibold tracking-widest uppercase text-white/60 mb-1">
                      0{i + 1}
                    </p>
                    <h3 className="heading-lg text-2xl mb-1">{b.label}</h3>
                    <p className="text-sm font-general text-white/70 mb-4">{b.desc}</p>
                    <span className="inline-flex items-center gap-1.5 text-xs font-sora font-medium text-lafoi-green-light group-hover:gap-3 transition-all duration-300">
                      Browse range <ArrowUpRight size={13} weight="bold" />
                    </span>
                  </div>
                </button>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <OptimizedImage
            src="https://images.unsplash.com/photo-1639663742190-1b3dba2eebcf?w=1920&q=80"
            alt="Refined residential interior with stretch ceiling and integrated lighting"
            className="w-full h-full object-cover"
            fill
            vision="Refined interior with luxury ceiling design"
          />
          <div className="absolute inset-0 bg-lafoi-dark/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-lafoi-dark/80 via-lafoi-dark/40 to-transparent" />
        </div>
        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <AnimatedSection>
            <div className="max-w-2xl">
              <p className="text-lafoi-green-light font-sora text-xs font-semibold tracking-widest uppercase mb-3">
                Specifying support
              </p>
              <h2 className="heading-lg text-3xl lg:text-5xl text-white mb-4">
                Need help <span className="font-display font-light">choosing</span>?
              </h2>
              <p className="text-white/70 font-general text-lg mb-8 max-w-lg">
                {linkifyProse(
                  'Our consultants will walk you through stretch ceiling finishes, lighting solutions compatibility, and on-site samples — at no charge. Browse our portfolio to see products in real interiors.',
                  { variant: 'dark' }
                )}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-lafoi-green text-white rounded-full font-sora text-sm font-medium hover:bg-lafoi-green-light transition-colors duration-300 shadow-lg shadow-lafoi-green/30 group"
                >
                  Speak to a specialist
                  <ArrowRight size={14} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/projects"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-sora text-sm font-medium hover:bg-white/15 transition-colors duration-300"
                >
                  See products in projects
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
// CARDS
// ----------------------------------------------------------------------------

function FeaturedCardLarge({ product }) {
  return (
    <Link
      to={`/products/${product.slug}`}
      className="group block relative rounded-3xl overflow-hidden bg-white shadow-sm hover:shadow-2xl transition-shadow duration-500 h-full min-h-[440px] card-shine"
    >
      <div className="absolute inset-0">
        <OptimizedImage
          src={product.image}
          alt={`${product.name} — ${product.vision || `${product.finish} finish ${product.category.toLowerCase()}`}`}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          fill
          vision={product.vision}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      </div>
      <div className="relative z-10 h-full min-h-[440px] flex flex-col justify-end p-8 lg:p-10 text-white">
        <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 mb-5">
          <Sparkle size={11} weight="fill" className="text-lafoi-green-light" />
          <span className="text-[10px] font-sora font-semibold tracking-widest uppercase">Editor&rsquo;s pick</span>
        </div>
        <p className="text-[11px] font-sora font-semibold tracking-widest uppercase text-lafoi-green-light mb-2">
          {product.category} · {product.finish}
        </p>
        <h3 className="heading-lg text-3xl lg:text-4xl mb-3">{product.name}</h3>
        <p className="font-general text-white/75 text-base max-w-lg mb-5">{product.shortDesc}</p>
        <span className="inline-flex items-center gap-2 text-sm font-sora font-medium text-white group-hover:gap-3 transition-all duration-300">
          View product <ArrowUpRight size={15} weight="bold" />
        </span>
      </div>
    </Link>
  )
}

function FeaturedCardSmall({ product }) {
  return (
    <Link
      to={`/products/${product.slug}`}
      className="group flex items-stretch rounded-3xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-shadow duration-500 h-full min-h-[140px]"
    >
      <div className="relative w-1/3 sm:w-2/5 shrink-0 overflow-hidden">
        <OptimizedImage
          src={product.image}
          alt={`${product.name} — ${product.vision || `${product.finish} finish ${product.category.toLowerCase()}`}`}
          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          fill
          vision={product.vision}
        />
      </div>
      <div className="flex-1 p-5 flex flex-col justify-center">
        <p className="text-[10px] font-sora font-semibold tracking-widest uppercase text-lafoi-green mb-1">
          {product.finish}
        </p>
        <h4 className="font-sora text-base lg:text-lg font-bold text-lafoi-dark mb-1.5 group-hover:text-lafoi-green transition-colors">
          {product.name}
        </h4>
        <p className="text-xs font-general text-lafoi-gray line-clamp-2 mb-2">{product.shortDesc}</p>
        <span className="inline-flex items-center gap-1 text-[11px] font-sora font-medium text-lafoi-gray-medium group-hover:text-lafoi-green group-hover:gap-2 transition-all duration-300">
          View <ArrowUpRight size={11} weight="bold" />
        </span>
      </div>
    </Link>
  )
}

function ProductCard({ product }) {
  return (
    <Link
      to={`/products/${product.slug}`}
      className="group block bg-white border border-gray-100 rounded-3xl overflow-hidden hover:border-lafoi-green/30 hover:shadow-xl hover:shadow-black/[0.04] transition-all duration-500 h-full flex flex-col"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <OptimizedImage
          src={product.image}
          alt={`${product.name} — ${product.vision || `${product.finish} finish ${product.category.toLowerCase()}`}`}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          fill
          vision={product.vision}
        />
        {product.featured && (
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-sora font-semibold tracking-wider uppercase text-lafoi-dark">
            <Sparkle size={10} weight="fill" className="text-lafoi-green" /> Featured
          </div>
        )}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-lafoi-dark/80 backdrop-blur-md text-[10px] font-sora font-medium tracking-wider uppercase text-white">
          {product.origin}
        </div>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <p className="text-[10px] font-sora font-semibold tracking-widest uppercase text-lafoi-green mb-2">
          {product.category} · {product.finish}
        </p>
        <h3 className="font-sora text-lg font-bold text-lafoi-dark mb-2 group-hover:text-lafoi-green transition-colors duration-300">
          {product.name}
        </h3>
        <p className="text-sm font-general text-lafoi-gray mb-4 line-clamp-2 flex-1">{product.shortDesc}</p>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-1">
            {(product.applications || []).slice(0, 2).map((a) => (
              <span key={a} className="text-[10px] font-sora text-lafoi-gray-medium px-2 py-0.5 rounded-full bg-gray-50">
                {a}
              </span>
            ))}
            {product.applications && product.applications.length > 2 && (
              <span className="text-[10px] font-sora text-lafoi-gray-medium px-2 py-0.5">
                +{product.applications.length - 2}
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-sora font-medium text-lafoi-dark group-hover:text-lafoi-green group-hover:gap-2 transition-all duration-300">
            View <ArrowUpRight size={12} weight="bold" />
          </span>
        </div>
      </div>
    </Link>
  )
}
