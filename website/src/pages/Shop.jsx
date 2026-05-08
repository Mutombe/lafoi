import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ShoppingBag,
  ArrowRight,
  WhatsappLogo,
  Phone,
  Envelope,
  MapPin,
  CheckCircle,
} from '@phosphor-icons/react'
import AnimatedSection, { StaggerContainer, StaggerItem } from '../components/ui/AnimatedSection'
import OptimizedImage from '../components/ui/OptimizedImage'
import SectionDivider from '../components/ui/SectionDivider'
import { useSEO, breadcrumbsLd } from '../utils/seo'
import { linkifyProse } from '../utils/linkify.jsx'
import { shopProducts, shopCategories, featuredShopProducts } from '../data/shop'
import { useCart } from '../store/cart'

/* ============================================================================
   La Foi Designs, Shop
   A small companion line for our ceilings: lamps, humidifiers, lighting
   accessories and care kits. Cart persists across sessions; checkout is
   handled via WhatsApp.
   ============================================================================ */

export default function Shop() {
  const [category, setCategory] = useState('All')

  useSEO({
    title: 'Shop, Lamps, Humidifiers & Companion Pieces',
    description:
      'A curated companion line of lamps, humidifiers, lighting accessories, and care kits to live alongside your stretch ceiling. Order via WhatsApp.',
    path: '/shop',
    jsonLd: breadcrumbsLd([
      { name: 'Home', path: '/' },
      { name: 'Shop', path: '/shop' },
    ]),
  })

  const filtered = useMemo(() => {
    if (category === 'All') return shopProducts
    return shopProducts.filter((p) => p.category === category)
  }, [category])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ShopHero />
      <SectionDivider shape="subtle-wave" from="cream" to="cream" />
      <FilterAndGrid
        category={category}
        setCategory={setCategory}
        filtered={filtered}
      />
      <SectionDivider shape="s-curve" from="cream" to="cream" />
      <HowOrderingWorks />
      <SectionDivider shape="wave" from="cream" to="dark" />
      <ShopCTA />
    </motion.div>
  )
}

/* ============================================================================
   1. HERO, Cream, editorial, Swiss minimalist with a 2x2 thumbnail grid
   ============================================================================ */
function ShopHero() {
  const heroProducts = featuredShopProducts.slice(0, 4)

  return (
    <section className="relative bg-lafoi-cream pt-32 lg:pt-40 pb-16 lg:pb-24 overflow-hidden">
      <div aria-hidden className="absolute inset-0 mesh-gradient-1 opacity-40 pointer-events-none" />

      {/* Volume artifact */}
      <div className="absolute inset-x-0 top-28 lg:top-32 z-10 pointer-events-none">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex justify-end">
          <span className="font-sora text-[10px] tracking-[0.35em] uppercase text-lafoi-gray/55">
            Shop &middot; Vol.&nbsp;11, 2026
          </span>
        </div>
      </div>

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* LEFT, editorial column */}
          <div className="lg:col-span-7">
            <motion.div
              className="flex items-center gap-3 mb-6 lg:mb-8"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="block w-10 h-px bg-lafoi-green/60" />
              <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                The Companion Line &middot; {shopProducts.length} pieces
              </p>
            </motion.div>

            <motion.h1
              className="font-display font-light text-lafoi-dark tracking-[-0.035em] leading-[0.95]"
              style={{ fontSize: 'clamp(3rem, 7.5vw, 7rem)' }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              Companion{' '}
              <span className="italic text-lafoi-green">pieces.</span>
            </motion.h1>

            <motion.div
              className="mt-7 lg:mt-9 max-w-xl text-base lg:text-lg text-lafoi-gray font-general leading-relaxed whitespace-pre-line"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {linkifyProse(
                "A curated selection of lamps, humidifiers and care kits chosen to live alongside our stretch ceilings. Pieces are sourced from our partners, honest companions, not branded merchandise.\n\nOrder via WhatsApp. We handle delivery in Harare and shipping nationwide, and confirm everything before you pay."
              )}
            </motion.div>

            <motion.div
              className="mt-8 flex flex-wrap items-center gap-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <a
                href="#shop-grid"
                className="inline-flex items-center gap-2 px-6 py-3 bg-lafoi-dark text-white rounded-full font-sora text-sm font-medium hover:bg-lafoi-green transition-colors duration-300 group"
              >
                Browse the line
                <ArrowRight size={14} weight="bold" className="group-hover:translate-x-1 transition-transform" />
              </a>
              <span className="font-sora text-[11px] tracking-[0.18em] uppercase text-lafoi-gray-medium">
                Sample collection &middot; pricing in USD
              </span>
            </motion.div>
          </div>

          {/* RIGHT, 2x2 featured thumbnail */}
          <motion.div
            className="lg:col-span-5"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="grid grid-cols-2 gap-3 lg:gap-4">
              {heroProducts.map((p, i) => (
                <div
                  key={p.slug}
                  className={`relative rounded-2xl overflow-hidden bg-lafoi-dark/[0.04] ${
                    i === 0 ? 'aspect-[4/5]' : i === 1 ? 'aspect-[4/5] mt-8 lg:mt-12' : i === 2 ? 'aspect-[4/5]' : 'aspect-[4/5] mt-8 lg:mt-12'
                  }`}
                >
                  <OptimizedImage
                    src={p.images[0]}
                    alt={`${p.name}, ${p.category} sample piece from La Foi Designs`}
                    fill
                    className="hover:scale-105 transition-transform duration-700"
                    vision={`${p.name}, featured shop piece`}
                  />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-sora font-medium text-lafoi-dark tracking-wide uppercase">
                      {p.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-lafoi-dark/80 text-white text-[11px] font-sora font-medium">
                      ${p.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-lafoi-gray-medium font-general italic text-center lg:text-right">
              Featured this volume.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ============================================================================
   2. FILTER + GRID
   ============================================================================ */
function FilterAndGrid({ category, setCategory, filtered }) {
  return (
    <section id="shop-grid" className="relative bg-lafoi-cream py-16 lg:py-24">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Header */}
        <AnimatedSection>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="block w-8 h-px bg-lafoi-green/60" />
                <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                  The Selection
                </p>
              </div>
              <h2 className="font-display font-light text-lafoi-dark tracking-[-0.02em] leading-[1.05]"
                style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}>
                Twelve pieces, <span className="italic text-lafoi-green">four families.</span>
              </h2>
            </div>
            <p className="text-sm text-lafoi-gray font-general max-w-md lg:text-right">
              Filter by family. Each piece links to a brief description; add to cart and we'll handle the rest by WhatsApp.
            </p>
          </div>
        </AnimatedSection>

        {/* Filter chips */}
        <AnimatedSection delay={0.1}>
          <div className="flex flex-wrap gap-2 mb-10">
            {shopCategories.map((cat) => {
              const isActive = cat === category
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-full font-sora text-xs font-medium tracking-wide transition-all duration-300 ${
                    isActive
                      ? 'bg-lafoi-green text-white shadow-md shadow-lafoi-green/20'
                      : 'bg-white border border-lafoi-dark/[0.08] text-lafoi-gray hover:border-lafoi-green/40 hover:text-lafoi-dark'
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </AnimatedSection>

        {/* Product grid */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
          {filtered.map((product) => (
            <StaggerItem key={product.slug}>
              <ProductCard product={product} />
            </StaggerItem>
          ))}
        </StaggerContainer>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-sm text-lafoi-gray-medium font-general">
              No pieces in this family yet, check back soon.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

/* ============================================================================
   3. PRODUCT CARD
   ============================================================================ */
function ProductCard({ product }) {
  const { addItem } = useCart()

  const handleAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product, 1)
  }

  return (
    <motion.div
      className="group flex flex-col"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-lafoi-dark/[0.04] mb-4">
        <OptimizedImage
          src={product.images[0]}
          alt={`${product.name}, ${product.category} sample piece from La Foi Designs`}
          fill
          className="group-hover:scale-105 transition-transform duration-700 ease-out"
          vision={`${product.name}, ${product.category} sample piece`}
        />
        {product.featured && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-sora font-medium text-lafoi-green tracking-wide uppercase">
              Featured
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1">
        <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-1.5">
          {product.category}
        </p>
        <div className="flex items-baseline justify-between gap-3 mb-1.5">
          <h3 className="font-display text-lg lg:text-[1.15rem] text-lafoi-dark leading-tight tracking-tight">
            {product.name}
          </h3>
          <span className="font-sora text-sm font-medium text-lafoi-dark shrink-0">
            ${product.price}
          </span>
        </div>
        <p className="text-xs text-lafoi-gray font-general leading-relaxed line-clamp-2 mb-4 flex-1">
          {product.shortDesc}
        </p>

        <button
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-lafoi-dark/15 rounded-full font-sora text-[12px] font-medium text-lafoi-dark hover:bg-lafoi-green hover:text-white hover:border-lafoi-green transition-all duration-300 group/btn"
        >
          <ShoppingBag size={14} weight="regular" />
          <span>Add to cart</span>
        </button>
      </div>
    </motion.div>
  )
}

/* ============================================================================
   4. HOW ORDERING WORKS, three steps
   ============================================================================ */
function HowOrderingWorks() {
  const steps = [
    {
      n: '01',
      title: 'Add to cart',
      body: 'Pick the lamps, humidifiers or care kits you would like. Your cart saves automatically, feel free to come back later.',
    },
    {
      n: '02',
      title: 'Send via WhatsApp',
      body: 'Tap Checkout via WhatsApp. We pre-fill the order summary, you press send, we confirm availability within the hour.',
    },
    {
      n: '03',
      title: 'Confirm and pay',
      body: 'Pay on delivery in Harare, or via EcoCash, ZIPIT or USD bank transfer for nationwide shipping. No card processing on the site.',
    },
  ]

  return (
    <section className="relative bg-lafoi-cream py-20 lg:py-28">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <AnimatedSection>
          <div className="max-w-2xl mb-12 lg:mb-16">
            <div className="flex items-center gap-3 mb-3">
              <span className="block w-8 h-px bg-lafoi-green/60" />
              <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                Ordering
              </p>
            </div>
            <h2 className="font-display font-light text-lafoi-dark tracking-[-0.02em] leading-[1.05]"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}>
              How <span className="italic text-lafoi-green">it works.</span>
            </h2>
            <p className="mt-5 text-base text-lafoi-gray font-general leading-relaxed">
              We keep the loop short, a small line of products deserves a small, human checkout. Three steps from cart to delivery.
            </p>
          </div>
        </AnimatedSection>

        <StaggerContainer className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((s) => (
            <StaggerItem key={s.n}>
              <div className="relative bg-white rounded-2xl p-7 lg:p-8 border border-lafoi-dark/[0.06] h-full">
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-display text-3xl font-light text-lafoi-green tracking-tight">
                    {s.n}
                  </span>
                  <span className="block flex-1 h-px bg-lafoi-dark/[0.08]" />
                  <CheckCircle size={16} weight="regular" className="text-lafoi-green/70" />
                </div>
                <h3 className="font-display text-xl text-lafoi-dark leading-tight mb-2 tracking-tight">
                  {s.title}
                </h3>
                <p className="text-sm text-lafoi-gray font-general leading-relaxed">
                  {s.body}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

/* ============================================================================
   5. CTA, dark plate
   ============================================================================ */
function ShopCTA() {
  return (
    <section className="relative bg-lafoi-dark text-white py-20 lg:py-28 overflow-hidden">
      <div aria-hidden className="absolute inset-0 pattern-diagonal opacity-30 pointer-events-none" />
      <div aria-hidden className="absolute -top-20 right-1/4 w-[600px] h-[300px] bg-lafoi-green/[0.08] rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <AnimatedSection direction="left" className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-5">
              <span className="block w-10 h-px bg-lafoi-green-light/70" />
              <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green-light">
                Have a question first?
              </p>
            </div>
            <h2 className="font-display font-light tracking-[-0.025em] leading-[1.02]"
              style={{ fontSize: 'clamp(2.25rem, 4.5vw, 3.75rem)' }}>
              We're a phone call away ,{' '}
              <span className="italic text-lafoi-green-light">always.</span>
            </h2>
            <p className="mt-6 text-base text-white/65 font-general leading-relaxed max-w-xl">
              Not sure which humidifier suits a 40m² room, or whether the linear pendant fits your dining space? Send us a note. We'd rather have the conversation than the return.
            </p>
          </AnimatedSection>

          <AnimatedSection direction="right" delay={0.1} className="lg:col-span-5">
            <div className="space-y-3">
              <a
                href="https://wa.me/263782931472?text=Hello%20La%20Foi%20Designs%2C%20I%20have%20a%20question%20about%20the%20shop."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-2xl transition-colors group"
              >
                <div className="w-11 h-11 rounded-xl bg-[#25D366]/20 flex items-center justify-center shrink-0">
                  <WhatsappLogo size={20} weight="fill" className="text-[#25D366]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-white/50 mb-0.5">
                    WhatsApp
                  </p>
                  <p className="font-display text-base text-white leading-tight">+263 782 931 472</p>
                </div>
                <ArrowRight size={16} weight="bold" className="text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </a>

              <a
                href="mailto:admin@lafoidesigns.co.zw"
                className="flex items-center gap-4 p-5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-2xl transition-colors group"
              >
                <div className="w-11 h-11 rounded-xl bg-lafoi-green/20 flex items-center justify-center shrink-0">
                  <Envelope size={18} weight="regular" className="text-lafoi-green-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-white/50 mb-0.5">
                    Email
                  </p>
                  <p className="font-display text-base text-white leading-tight">admin@lafoidesigns.co.zw</p>
                </div>
                <ArrowRight size={16} weight="bold" className="text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </a>

              <Link
                to="/contact"
                className="flex items-center gap-4 p-5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-2xl transition-colors group"
              >
                <div className="w-11 h-11 rounded-xl bg-lafoi-green/20 flex items-center justify-center shrink-0">
                  <MapPin size={18} weight="regular" className="text-lafoi-green-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-white/50 mb-0.5">
                    Visit
                  </p>
                  <p className="font-display text-base text-white leading-tight">Suite 26, 6 Chelmsford Rd, Belgravia</p>
                </div>
                <ArrowRight size={16} weight="bold" className="text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>
            </div>

            <p className="mt-5 text-xs text-white/45 font-general italic">
              Prefer a brochure? Download our{' '}
              <a
                href="/brand/docs/company-profile.pdf"
                download
                className="prose-link-dark"
              >
                company profile
              </a>{' '}, full studio details, services and contacts.
            </p>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}
