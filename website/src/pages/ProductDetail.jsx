import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useParams, Navigate } from 'react-router-dom'
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Download,
  X as XIcon,
  Globe,
  Shield,
  Clock,
} from 'lucide-react'
import AnimatedSection, { StaggerContainer, StaggerItem } from '../components/ui/AnimatedSection'
import OptimizedImage from '../components/ui/OptimizedImage'
import { useSEO } from '../utils/seo'
import {
  getProductBySlug,
  getRelatedProducts,
  getAdjacentProducts,
  getProjectsByProduct,
} from '../data/site'

export default function ProductDetail() {
  const { slug } = useParams()
  const product = getProductBySlug(slug)

  if (!product) return <Navigate to="/products" replace />

  const related = getRelatedProducts(product)
  const adjacent = getAdjacentProducts(product.slug)
  const linkedProjects = getProjectsByProduct(product.slug).slice(0, 3)

  const [lightbox, setLightbox] = useState(null)

  useSEO({
    title: `${product.name} — ${product.category}`,
    description: product.shortDesc,
    path: `/products/${product.slug}`,
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
      {/* HERO — full bleed product image */}
      <section className="relative min-h-[60vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <OptimizedImage
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover object-center"
            fill
            priority
            vision={product.vision}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/95 via-lafoi-dark/40 to-lafoi-dark/30" />
        </div>
        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 w-full pt-32 pb-12">
          {/* breadcrumb */}
          <motion.nav
            className="flex items-center gap-2 text-xs font-sora text-white/60 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={11} />
            <Link to="/products" className="hover:text-white transition-colors">Products</Link>
            <ChevronRight size={11} />
            <span className="text-white/90 truncate max-w-[180px] sm:max-w-none">{product.name}</span>
          </motion.nav>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-sora font-semibold tracking-widest uppercase text-white">
                {product.category}
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lafoi-green text-[10px] font-sora font-semibold tracking-widest uppercase text-white">
                {product.finish}
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-sora font-semibold tracking-widest uppercase text-white">
                <Globe size={10} /> {product.origin}
              </span>
            </div>
            <h1 className="heading-xl text-4xl sm:text-5xl lg:text-6xl text-white max-w-3xl">
              {product.name}
            </h1>
            <p className="font-general text-white/75 text-lg max-w-xl mt-5">{product.shortDesc}</p>
          </motion.div>
        </div>
      </section>

      {/* TWO-COLUMN BODY */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            {/* main copy */}
            <div className="lg:col-span-7">
              <AnimatedSection>
                <p className="text-lafoi-green font-sora text-xs font-semibold tracking-widest uppercase mb-4">
                  About this product
                </p>
                <div className="font-general text-lafoi-gray text-base lg:text-lg leading-[1.8] space-y-5">
                  {product.longDesc.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.1}>
                <div className="mt-12">
                  <p className="text-lafoi-green font-sora text-xs font-semibold tracking-widest uppercase mb-5">
                    Highlights
                  </p>
                  <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3.5">
                    {product.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-3">
                        <span className="w-5 h-5 mt-0.5 rounded-full bg-lafoi-green/15 flex items-center justify-center shrink-0">
                          <Check size={11} className="text-lafoi-green" strokeWidth={3} />
                        </span>
                        <span className="text-sm font-general text-lafoi-gray leading-relaxed">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.15}>
                <div className="mt-12">
                  <p className="text-lafoi-green font-sora text-xs font-semibold tracking-widest uppercase mb-5">
                    Suitable for
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(product.applications || []).map((a) => (
                      <span
                        key={a}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-lafoi-cream border border-gray-100 text-xs font-sora font-medium text-lafoi-dark"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-lafoi-green" />
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            </div>

            {/* sticky sidebar */}
            <aside className="lg:col-span-5">
              <div className="lg:sticky lg:top-28 space-y-6">
                {/* spec table */}
                <AnimatedSection direction="right">
                  <div className="bg-lafoi-cream border border-gray-100 rounded-3xl p-7 lg:p-8 relative overflow-hidden">
                    <div className="absolute inset-0 dot-pattern opacity-40 pointer-events-none" />
                    <div className="relative">
                      <p className="text-lafoi-green font-sora text-[10px] font-semibold tracking-widest uppercase mb-1">
                        Press kit
                      </p>
                      <h3 className="heading-lg text-2xl text-lafoi-dark mb-6">Specifications</h3>
                      <dl className="space-y-2.5 font-mono">
                        {Object.entries(product.specs).map(([k, v]) => (
                          <div key={k} className="flex items-baseline gap-3 py-2 border-b border-dotted border-gray-300/80 last:border-b-0">
                            <dt className="text-[11px] uppercase tracking-wider text-lafoi-gray-medium font-sora font-semibold shrink-0 w-32">
                              {k}
                            </dt>
                            <dd className="text-xs text-lafoi-dark font-general flex-1 text-right">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                </AnimatedSection>

                {/* CTA card */}
                <AnimatedSection direction="right" delay={0.1}>
                  <div className="relative bg-lafoi-dark text-white rounded-3xl p-7 lg:p-8 overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-lafoi-green/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative">
                      <p className="text-lafoi-green-light font-sora text-[10px] font-semibold tracking-widest uppercase mb-2">
                        Specify this product
                      </p>
                      <h4 className="heading-lg text-xl mb-2">Request a quote</h4>
                      <p className="text-sm text-white/65 font-general mb-6">
                        Free site assessment, sample swatches and a written specification within 5 working days.
                      </p>
                      <Link
                        to="/contact"
                        className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 bg-lafoi-green hover:bg-lafoi-green-light text-white rounded-full font-sora text-sm font-medium transition-colors duration-300 group mb-3"
                      >
                        Request a quote
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 bg-white/[0.06] hover:bg-white/[0.1] border border-white/15 rounded-full font-sora text-xs font-medium text-white/85 transition-colors duration-300"
                      >
                        <Download size={13} /> Download spec sheet
                      </button>
                      <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-white/10">
                        <div className="flex items-center gap-2 text-xs text-white/60 font-general">
                          <Shield size={13} className="text-lafoi-green-light" />
                          <span>{product.specs.Warranty || '15 years'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/60 font-general">
                          <Clock size={13} className="text-lafoi-green-light" />
                          <span>1-day install</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* GALLERY STRIP */}
      {product.gallery && product.gallery.length > 0 && (
        <section className="py-16 lg:py-24 bg-lafoi-cream">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
            <AnimatedSection>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
                <div>
                  <p className="text-lafoi-green font-sora text-xs font-semibold tracking-widest uppercase mb-3">
                    In context
                  </p>
                  <h2 className="heading-lg text-3xl lg:text-4xl text-lafoi-dark">Seen in <span className="font-display font-light text-lafoi-green">the field</span></h2>
                </div>
                <p className="text-sm font-general text-lafoi-gray-medium max-w-xs">
                  Click any image to view at full size. Real installations from the La Foi project archive.
                </p>
              </div>
            </AnimatedSection>

            <div className="grid sm:grid-cols-3 gap-4 lg:gap-5">
              {product.gallery.slice(0, 3).map((src, i) => (
                <AnimatedSection key={i} delay={i * 0.08}>
                  <button
                    onClick={() => setLightbox(src)}
                    className="group relative block w-full aspect-[4/5] rounded-2xl overflow-hidden card-shine"
                  >
                    <OptimizedImage
                      src={src}
                      alt={`${product.name} — view ${i + 1}`}
                      className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                      fill
                      vision={product.vision}
                    />
                    <div className="absolute inset-0 bg-lafoi-dark/0 group-hover:bg-lafoi-dark/20 transition-colors duration-500" />
                    <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      <ArrowUpRight size={15} className="text-lafoi-dark" />
                    </div>
                  </button>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PROJECTS USING THIS PRODUCT */}
      {linkedProjects.length > 0 && (
        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
            <AnimatedSection>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
                <div>
                  <p className="text-lafoi-green font-sora text-xs font-semibold tracking-widest uppercase mb-3">
                    Specified in
                  </p>
                  <h2 className="heading-lg text-3xl lg:text-4xl text-lafoi-dark">
                    Projects featuring this product
                  </h2>
                </div>
                <Link
                  to="/projects"
                  className="inline-flex items-center gap-2 text-sm font-sora font-medium text-lafoi-dark hover:text-lafoi-green transition-colors group self-start sm:self-end"
                >
                  All case studies
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </AnimatedSection>

            <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {linkedProjects.map((proj) => (
                <StaggerItem key={proj.slug}>
                  <Link
                    to={`/projects/${proj.slug}`}
                    className="group block bg-white border border-gray-100 rounded-3xl overflow-hidden hover:border-lafoi-green/30 hover:shadow-xl hover:shadow-black/[0.04] transition-all duration-500"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <OptimizedImage
                        src={proj.thumb}
                        alt={proj.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                        fill
                        vision={proj.vision}
                      />
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-sora font-semibold tracking-wider uppercase text-lafoi-dark">
                        {proj.category}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-sora text-lg font-bold text-lafoi-dark mb-1 group-hover:text-lafoi-green transition-colors">
                        {proj.title}
                      </h3>
                      <p className="text-xs font-general text-lafoi-gray-medium">
                        {proj.location} · {proj.year} · {proj.area}
                      </p>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* RELATED PRODUCTS */}
      {related.length > 0 && (
        <section className="py-16 lg:py-24 bg-lafoi-cream">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
            <AnimatedSection>
              <div className="mb-12">
                <p className="text-lafoi-green font-sora text-xs font-semibold tracking-widest uppercase mb-3">
                  More from {product.category}
                </p>
                <h2 className="heading-lg text-3xl lg:text-4xl text-lafoi-dark">Related products</h2>
              </div>
            </AnimatedSection>

            <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map((p) => (
                <StaggerItem key={p.slug}>
                  <Link
                    to={`/products/${p.slug}`}
                    className="group block bg-white border border-gray-100 rounded-3xl overflow-hidden hover:border-lafoi-green/30 hover:shadow-xl hover:shadow-black/[0.04] transition-all duration-500"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <OptimizedImage
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                        fill
                        vision={p.vision}
                      />
                    </div>
                    <div className="p-6">
                      <p className="text-[10px] font-sora font-semibold tracking-widest uppercase text-lafoi-green mb-1.5">
                        {p.finish}
                      </p>
                      <h3 className="font-sora text-base font-bold text-lafoi-dark mb-1.5 group-hover:text-lafoi-green transition-colors">
                        {p.name}
                      </h3>
                      <p className="text-xs font-general text-lafoi-gray line-clamp-2">{p.shortDesc}</p>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* PREV/NEXT NAV */}
      <section className="border-t border-gray-100 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            <Link
              to={`/products/${adjacent.prev.slug}`}
              className="group py-10 lg:py-12 pr-0 sm:pr-8 flex items-center gap-4 hover:bg-lafoi-cream/40 transition-colors duration-300 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10"
            >
              <ArrowLeft size={18} className="text-lafoi-gray-medium group-hover:text-lafoi-green group-hover:-translate-x-1 transition-all duration-300 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-sora font-semibold tracking-widest uppercase text-lafoi-gray-medium mb-1">
                  Previous product
                </p>
                <p className="font-sora text-base lg:text-lg font-bold text-lafoi-dark group-hover:text-lafoi-green transition-colors">
                  {adjacent.prev.name}
                </p>
              </div>
            </Link>
            <Link
              to={`/products/${adjacent.next.slug}`}
              className="group py-10 lg:py-12 pl-0 sm:pl-8 flex items-center gap-4 justify-end hover:bg-lafoi-cream/40 transition-colors duration-300 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10"
            >
              <div className="flex-1 text-right">
                <p className="text-[10px] font-sora font-semibold tracking-widest uppercase text-lafoi-gray-medium mb-1">
                  Next product
                </p>
                <p className="font-sora text-base lg:text-lg font-bold text-lafoi-dark group-hover:text-lafoi-green transition-colors">
                  {adjacent.next.name}
                </p>
              </div>
              <ArrowRight size={18} className="text-lafoi-gray-medium group-hover:text-lafoi-green group-hover:translate-x-1 transition-all duration-300 shrink-0" />
            </Link>
          </div>
        </div>
      </section>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setLightbox(null)} />
            <motion.div
              className="relative w-full max-w-5xl rounded-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <button
                onClick={() => setLightbox(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              >
                <XIcon size={18} />
              </button>
              <img
                src={lightbox}
                alt={product.name}
                className="w-full h-auto max-h-[85vh] object-contain bg-black"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
