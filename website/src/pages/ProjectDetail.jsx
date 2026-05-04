import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useParams, Navigate } from 'react-router-dom'
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  CaretRight,
  Check,
  X as XIcon,
  Quotes,
  MapPin,
  Calendar,
  Ruler,
  Clock,
  User,
} from '@phosphor-icons/react'
import AnimatedSection, { StaggerContainer, StaggerItem } from '../components/ui/AnimatedSection'
import OptimizedImage from '../components/ui/OptimizedImage'
import HeroSlideshow from '../components/ui/HeroSlideshow'
import { useSEO } from '../utils/seo'
import {
  getProjectBySlug,
  getRelatedProjects,
  getAdjacentProjects,
  getProductBySlug,
} from '../data/site'

export default function ProjectDetail() {
  const { slug } = useParams()
  const project = getProjectBySlug(slug)

  if (!project) return <Navigate to="/projects" replace />

  const related = getRelatedProjects(project)
  const adjacent = getAdjacentProjects(project.slug)
  const products = (project.productsUsed || []).map(getProductBySlug).filter(Boolean)

  // Build 3-image hero slideshow from hero + gallery + sane fallbacks
  const projectHeroSlides = React.useMemo(() => {
    const seen = new Set()
    const result = []
    const push = (src, alt, vision) => {
      if (!src || seen.has(src)) return
      seen.add(src)
      result.push({ src, alt, vision: vision || alt })
    }
    push(project.hero, project.title, project.vision)
    ;(project.gallery || []).forEach((g, i) => {
      const src = typeof g === 'string' ? g : g.src
      push(src, g.alt || `${project.title} — view ${i + 1}`, g.vision || project.vision)
    })
    const fallbacks = [
      'https://images.unsplash.com/photo-1758194090785-8e09b7288199?w=2200&q=85',
      'https://images.unsplash.com/photo-1639663742190-1b3dba2eebcf?w=2200&q=85',
      'https://images.unsplash.com/photo-1638284457192-27d3d0ec51aa?w=2200&q=85',
    ]
    fallbacks.forEach((f) => push(f, project.title, project.vision))
    return result.slice(0, 3)
  }, [project])

  const [lightboxIdx, setLightboxIdx] = useState(null)

  useSEO({
    title: project.title,
    description: project.brief,
    path: `/projects/${project.slug}`,
  })

  const closeLightbox = () => setLightboxIdx(null)
  const nextImg = () =>
    setLightboxIdx((idx) => (idx === null ? null : (idx + 1) % project.gallery.length))
  const prevImg = () =>
    setLightboxIdx((idx) => (idx === null ? null : (idx - 1 + project.gallery.length) % project.gallery.length))

  // keyboard nav for lightbox
  React.useEffect(() => {
    if (lightboxIdx === null) return
    const handler = (e) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') nextImg()
      if (e.key === 'ArrowLeft') prevImg()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIdx])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
      {/* HERO — slideshow */}
      <section className="relative min-h-[75vh] flex items-end overflow-hidden bg-lafoi-dark">
        <HeroSlideshow slides={projectHeroSlides} interval={6500} parallax overlay={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/95 via-lafoi-dark/30 to-lafoi-dark/40 pointer-events-none" />
        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 w-full pt-32 pb-14 lg:pb-20">
          {/* breadcrumb */}
          <motion.nav
            className="flex items-center gap-2 text-xs font-sora text-white/60 mb-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <CaretRight size={11} weight="regular" />
            <Link to="/projects" className="hover:text-white transition-colors">Projects</Link>
            <CaretRight size={11} weight="regular" />
            <span className="text-white/90 truncate max-w-[180px] sm:max-w-none">{project.title}</span>
          </motion.nav>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lafoi-green text-[10px] font-sora font-semibold tracking-widest uppercase text-white mb-5">
              {project.category}
            </span>
            <h1 className="heading-xl text-4xl sm:text-5xl lg:text-7xl text-white max-w-4xl">
              {project.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-sora text-white/70 mt-6">
              <span className="inline-flex items-center gap-2"><MapPin size={14} weight="regular" />{project.location}</span>
              <span className="text-white/30">&middot;</span>
              <span className="inline-flex items-center gap-2"><Calendar size={14} weight="regular" />{project.year}</span>
              <span className="text-white/30">&middot;</span>
              <span className="inline-flex items-center gap-2"><Ruler size={14} weight="regular" />{project.area}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* QUICK FACTS BAND */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
            <Fact icon={User} label="Client" value={project.client} />
            <Fact icon={MapPin} label="Location" value={project.location} />
            <Fact icon={Calendar} label="Year" value={String(project.year)} />
            <Fact icon={Clock} label="Duration" value={project.duration} />
          </div>
        </div>
      </section>

      {/* BRIEF / APPROACH / OUTCOME */}
      <section className="py-16 lg:py-28 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            {/* sticky title side */}
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <p className="text-lafoi-green font-sora text-xs font-semibold tracking-widest uppercase mb-4">
                  The story
                </p>
                <h2 className="heading-lg text-3xl lg:text-4xl text-lafoi-dark mb-5">
                  How <span className="font-display font-light text-lafoi-green">{project.title.split(' ')[0]}</span> came together
                </h2>
                <p className="font-general text-lafoi-gray text-base leading-relaxed">
                  Three short chapters: the brief our client brought us, the design response we proposed, and the measurable outcome on completion.
                </p>
              </div>
            </div>
            {/* steps */}
            <div className="lg:col-span-8 space-y-12 lg:space-y-16">
              <Chapter
                number="01"
                title="The brief"
                body={project.brief}
                dropCap
              />
              <Chapter number="02" title="The approach" body={project.approach} />
              <Chapter number="03" title="The outcome" body={project.outcome} />
            </div>
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      {project.highlights && project.highlights.length > 0 && (
        <section className="py-16 lg:py-24 bg-lafoi-cream relative overflow-hidden">
          <div className="absolute inset-0 mesh-gradient-1 pointer-events-none" />
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 relative">
            <AnimatedSection>
              <div className="mb-12 max-w-2xl">
                <p className="text-lafoi-green font-sora text-xs font-semibold tracking-widest uppercase mb-3">
                  Project highlights
                </p>
                <h2 className="heading-lg text-3xl lg:text-5xl text-lafoi-dark">
                  What makes this <span className="font-display font-light text-lafoi-green">special</span>
                </h2>
              </div>
            </AnimatedSection>

            <StaggerContainer className="grid sm:grid-cols-2 gap-x-10 gap-y-5">
              {project.highlights.map((h) => (
                <StaggerItem key={h}>
                  <div className="flex items-start gap-4 py-2">
                    <span className="w-8 h-8 mt-0.5 rounded-full bg-lafoi-green/15 flex items-center justify-center shrink-0">
                      <Check size={14} weight="bold" className="text-lafoi-green" />
                    </span>
                    <p className="text-base font-general text-lafoi-gray leading-relaxed">{h}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* METRICS BAND */}
      {project.metrics && project.metrics.length > 0 && (
        <section className="py-16 lg:py-24 bg-lafoi-dark text-white relative overflow-hidden">
          <div className="absolute inset-0 dot-pattern opacity-30 pointer-events-none" />
          <div className="absolute -top-32 right-1/4 w-96 h-96 bg-lafoi-green/15 rounded-full blur-[120px] pointer-events-none" />
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 relative">
            <AnimatedSection>
              <div className="text-center max-w-xl mx-auto mb-12">
                <p className="text-lafoi-green-light font-sora text-xs font-semibold tracking-widest uppercase mb-3">
                  Project metrics
                </p>
                <h2 className="heading-lg text-3xl lg:text-4xl">
                  Measured in numbers
                </h2>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {project.metrics.map((m, i) => (
                <AnimatedSection key={m.label} delay={i * 0.08}>
                  <div className="text-center">
                    <p className="heading-xl text-4xl lg:text-5xl mb-2">
                      <span className="text-gradient">{m.value}</span>
                    </p>
                    <p className="text-xs font-sora text-white/55 uppercase tracking-wider">{m.label}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* GALLERY — masonry */}
      {project.gallery && project.gallery.length > 0 && (
        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
            <AnimatedSection>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
                <div>
                  <p className="text-lafoi-green font-sora text-xs font-semibold tracking-widest uppercase mb-3">
                    Project gallery
                  </p>
                  <h2 className="heading-lg text-3xl lg:text-4xl text-lafoi-dark">
                    {project.gallery.length} images from <span className="font-display font-light text-lafoi-green">the install</span>
                  </h2>
                </div>
                <p className="text-sm font-general text-lafoi-gray-medium max-w-xs">
                  Click any image to view at full size. Use arrow keys to navigate.
                </p>
              </div>
            </AnimatedSection>

            <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
              {project.gallery.map((g, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIdx(i)}
                  className="group relative w-full block break-inside-avoid rounded-3xl overflow-hidden text-left mb-5 card-shine"
                >
                  <div className={i % 3 === 1 ? 'h-72 sm:h-80' : i % 3 === 2 ? 'h-96' : 'h-64 sm:h-72'}>
                    <OptimizedImage
                      src={g.src}
                      alt={g.alt}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                      fill
                      vision={g.vision || project.vision}
                    />
                  </div>
                  {g.caption && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                  {g.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-3 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <p className="text-sm font-sora text-white font-medium">{g.caption}</p>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowUpRight size={13} weight="bold" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PRODUCTS USED */}
      {products.length > 0 && (
        <section className="py-16 lg:py-24 bg-lafoi-cream">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
            <AnimatedSection>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
                <div>
                  <p className="text-lafoi-green font-sora text-xs font-semibold tracking-widest uppercase mb-3">
                    Specified for this project
                  </p>
                  <h2 className="heading-lg text-3xl lg:text-4xl text-lafoi-dark">Products used</h2>
                </div>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 text-sm font-sora font-medium text-lafoi-dark hover:text-lafoi-green transition-colors group self-start sm:self-end"
                >
                  Full catalogue
                  <ArrowRight size={14} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </AnimatedSection>

            <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((p) => (
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
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-lafoi-dark/80 backdrop-blur-md text-[10px] font-sora font-medium tracking-wider uppercase text-white">
                        {p.origin}
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-[10px] font-sora font-semibold tracking-widest uppercase text-lafoi-green mb-1.5">
                        {p.category} · {p.finish}
                      </p>
                      <h3 className="font-sora text-lg font-bold text-lafoi-dark mb-2 group-hover:text-lafoi-green transition-colors">
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

      {/* TESTIMONIAL */}
      {project.testimonial && (
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 text-center">
            <AnimatedSection>
              <Quotes size={36} weight="fill" className="text-lafoi-green mx-auto mb-6" />
              <blockquote className="font-display font-light text-2xl sm:text-3xl lg:text-4xl text-lafoi-dark leading-snug tracking-tight">
                &ldquo;{project.testimonial.quote}&rdquo;
              </blockquote>
              <div className="mt-8 flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full bg-lafoi-green/15 flex items-center justify-center">
                  <User size={18} weight="regular" className="text-lafoi-green" />
                </div>
                <div className="text-left">
                  <p className="font-sora text-sm font-bold text-lafoi-dark">{project.testimonial.author}</p>
                  <p className="text-xs font-general text-lafoi-gray-medium">{project.testimonial.role}</p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* PREV/NEXT — full bleed */}
      <section className="grid sm:grid-cols-2">
        <PrevNextLink direction="prev" project={adjacent.prev} />
        <PrevNextLink direction="next" project={adjacent.next} />
      </section>

      {/* RELATED PROJECTS */}
      {related.length > 0 && (
        <section className="py-16 lg:py-24 bg-lafoi-cream">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
            <AnimatedSection>
              <div className="mb-12">
                <p className="text-lafoi-green font-sora text-xs font-semibold tracking-widest uppercase mb-3">
                  More from {project.category}
                </p>
                <h2 className="heading-lg text-3xl lg:text-4xl text-lafoi-dark">
                  Related case studies
                </h2>
              </div>
            </AnimatedSection>

            <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map((p) => (
                <StaggerItem key={p.slug}>
                  <Link
                    to={`/projects/${p.slug}`}
                    className="group block bg-white border border-gray-100 rounded-3xl overflow-hidden hover:border-lafoi-green/30 hover:shadow-xl hover:shadow-black/[0.04] transition-all duration-500"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <OptimizedImage
                        src={p.thumb}
                        alt={p.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                        fill
                        vision={p.vision}
                      />
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-sora font-semibold tracking-wider uppercase text-lafoi-dark">
                        {p.category}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-sora text-lg font-bold text-lafoi-dark mb-1 group-hover:text-lafoi-green transition-colors">
                        {p.title}
                      </h3>
                      <p className="text-xs font-general text-lafoi-gray-medium">
                        {p.location} · {p.year} · {p.area}
                      </p>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* LIGHTBOX */}
      <AnimatePresence>
        {lightboxIdx !== null && project.gallery && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={closeLightbox} />
            <motion.div
              key={lightboxIdx}
              className="relative w-full max-w-6xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <button
                onClick={closeLightbox}
                className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              >
                <XIcon size={18} weight="bold" />
              </button>
              <button
                onClick={prevImg}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                aria-label="Previous"
              >
                <ArrowLeft size={18} weight="regular" />
              </button>
              <button
                onClick={nextImg}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                aria-label="Next"
              >
                <ArrowRight size={18} weight="regular" />
              </button>
              <img
                src={project.gallery[lightboxIdx].src}
                alt={project.gallery[lightboxIdx].alt}
                className="w-full h-auto max-h-[85vh] object-contain bg-black rounded-2xl"
              />
              {project.gallery[lightboxIdx].caption && (
                <p className="text-center text-white/70 text-sm font-general mt-4">
                  {project.gallery[lightboxIdx].caption}
                </p>
              )}
              <p className="text-center text-white/30 text-xs font-mono mt-2">
                {lightboxIdx + 1} / {project.gallery.length}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ----------------------------------------------------------------------------
// PIECES
// ----------------------------------------------------------------------------

function Fact({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 py-6 lg:py-8 px-4 sm:px-8">
      <div className="w-11 h-11 rounded-full bg-lafoi-green/10 flex items-center justify-center shrink-0">
        <Icon size={16} weight="regular" className="text-lafoi-green" />
      </div>
      <div>
        <p className="text-[10px] font-sora font-semibold tracking-widest uppercase text-lafoi-gray-medium mb-0.5">
          {label}
        </p>
        <p className="font-sora text-sm font-medium text-lafoi-dark leading-snug">{value}</p>
      </div>
    </div>
  )
}

function Chapter({ number, title, body, dropCap = false }) {
  return (
    <AnimatedSection direction="up">
      <div className="flex items-center gap-4 mb-5">
        <span className="font-mono text-sm text-lafoi-green tracking-widest">{number}</span>
        <span className="h-px flex-1 bg-gradient-to-r from-lafoi-green/30 to-transparent" />
      </div>
      <h3 className="heading-lg text-2xl lg:text-3xl text-lafoi-dark mb-5">{title}</h3>
      <p
        className={`font-general text-lafoi-gray text-base lg:text-lg leading-[1.8] ${
          dropCap
            ? 'first-letter:font-sora first-letter:text-5xl first-letter:font-bold first-letter:text-lafoi-green first-letter:float-left first-letter:mr-3 first-letter:leading-[0.9]'
            : ''
        }`}
      >
        {body}
      </p>
    </AnimatedSection>
  )
}

function PrevNextLink({ direction, project }) {
  const isPrev = direction === 'prev'
  return (
    <Link
      to={`/projects/${project.slug}`}
      className="group relative block min-h-[280px] lg:min-h-[340px] overflow-hidden"
    >
      <div className="absolute inset-0">
        <OptimizedImage
          src={project.thumb}
          alt={project.title}
          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          fill
          vision={project.vision}
        />
        <div className="absolute inset-0 bg-lafoi-dark/65 group-hover:bg-lafoi-dark/45 transition-colors duration-500" />
      </div>
      <div className={`relative z-10 h-full min-h-[280px] lg:min-h-[340px] flex flex-col justify-center px-8 lg:px-14 py-10 ${isPrev ? 'items-start' : 'items-end text-right'}`}>
        <p className="text-[10px] font-sora font-semibold tracking-widest uppercase text-lafoi-green-light mb-3 inline-flex items-center gap-2">
          {isPrev && <ArrowLeft size={11} weight="regular" className="group-hover:-translate-x-1 transition-transform" />}
          {isPrev ? 'Previous case study' : 'Next case study'}
          {!isPrev && <ArrowRight size={11} weight="regular" className="group-hover:translate-x-1 transition-transform" />}
        </p>
        <h3 className="heading-lg text-2xl lg:text-3xl text-white mb-2">{project.title}</h3>
        <p className="font-sora text-xs text-white/60">
          {project.location} · {project.year}
        </p>
      </div>
    </Link>
  )
}
