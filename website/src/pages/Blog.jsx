import React, { useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Clock,
  Newspaper,
  PaperPlaneRight,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import AnimatedSection from '../components/ui/AnimatedSection'
import { linkifyProse } from '../utils/linkify.jsx'
import OptimizedImage from '../components/ui/OptimizedImage'
import HeroSlideshow from '../components/ui/HeroSlideshow'
import { useSEO } from '../utils/seo'

const BLOG_HERO_SLIDES = [
  {
    src: 'https://images.unsplash.com/photo-1638284457192-27d3d0ec51aa?w=2200&q=85',
    alt: 'Calm contemporary living room',
    vision: 'Editorial blog cover',
  },
  {
    src: 'https://images.unsplash.com/photo-1618259715220-a89a4e4da76b?w=2200&q=85',
    alt: 'Country hotel interior with elegant design',
    vision: 'Stories from the field',
  },
  {
    src: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=2200&q=85',
    alt: 'Minimalist gallery space',
    vision: 'Quiet contemplation',
  },
]

const posts = [
  {
    id: 1,
    title: '5 Ways Stretch Ceilings Transform Small Spaces',
    excerpt:
      'Discover how stretch ceilings create the illusion of more space, add depth with lighting, and elevate the design of compact rooms.',
    category: 'Design Tips',
    date: 'Feb 15, 2026',
    readTime: '4 min',
    image: 'https://images.unsplash.com/photo-1638284457192-27d3d0ec51aa?w=1600&q=85',
    vision: 'Elegant living room with premium stretch ceiling and refined furnishings',
    featured: true,
  },
  {
    id: 2,
    title: 'The Science Behind Acoustic Stretch Ceilings',
    excerpt:
      'How micro-perforated membranes reduce noise levels while maintaining elegant aesthetics in offices and hospitality venues.',
    category: 'Innovation',
    date: 'Feb 8, 2026',
    readTime: '6 min',
    image: 'https://images.unsplash.com/photo-1595513279524-fa90ad188c98?w=1200&q=80',
    vision: 'Professional studio with acoustic ceiling treatment',
  },
  {
    id: 3,
    title: 'Fiber Optic Starry Skies: The Ultimate Bedroom Upgrade',
    excerpt:
      'Everything you need to know about creating a magical starry sky effect in your bedroom with fiber optic ceiling technology.',
    category: 'Lighting',
    date: 'Jan 28, 2026',
    readTime: '5 min',
    image: 'https://images.unsplash.com/photo-1765434670017-c0d28ecde29a?w=1200&q=80',
    vision: 'Modern ceiling lights with blue and white artistic accents',
  },
  {
    id: 4,
    title: 'Stretch Ceilings vs Traditional Plastering: A Complete Guide',
    excerpt:
      'Comparing cost, durability, installation time, and aesthetics between stretch ceilings and traditional ceiling finishes.',
    category: 'Guides',
    date: 'Jan 20, 2026',
    readTime: '7 min',
    image: 'https://images.unsplash.com/photo-1639663742190-1b3dba2eebcf?w=1200&q=80',
    vision: 'Luxury modern living room with premium ceiling',
  },
  {
    id: 5,
    title: 'Inside the Stretch Membrane Manufacturing Process',
    excerpt:
      'A behind-the-scenes look at how our premium PVC membranes are manufactured to exacting European quality standards.',
    category: 'Behind the Scenes',
    date: 'Jan 12, 2026',
    readTime: '5 min',
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1200&q=80',
    vision: 'Designers collaborating in a warm wooden architectural space',
  },
  {
    id: 6,
    title: 'Top Interior Design Trends in Zimbabwe for 2026',
    excerpt:
      'From biophilic design to statement ceilings, explore the trends shaping Zimbabwean interior spaces this year.',
    category: 'Trends',
    date: 'Jan 5, 2026',
    readTime: '6 min',
    image: 'https://images.unsplash.com/photo-1618259715220-a89a4e4da76b?w=1200&q=80',
    vision: 'Country hotel interior with elegant design and sophisticated ceiling',
  },
]

export default function Blog() {
  const featured = posts.find((p) => p.featured)
  const regular = posts.filter((p) => !p.featured)

  // build category list
  const allCategories = useMemo(
    () => ['All', ...Array.from(new Set(posts.map((p) => p.category)))],
    [],
  )
  const [filter, setFilter] = useState('All')

  const filtered = filter === 'All' ? regular : regular.filter((p) => p.category === filter)

  useSEO({
    title: 'Field Notes & Design Insights',
    description:
      'Expert insights on stretch ceilings, lighting design, interior trends, and more from La Foi Designs.',
    path: '/blog',
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <BlogHero />
      {featured && <FeaturedPost post={featured} />}
      <PostsGrid
        posts={filtered}
        categories={allCategories}
        filter={filter}
        setFilter={setFilter}
      />
      <NewsletterBand />
    </motion.div>
  )
}

function BlogHero() {
  // Magazine Cover. Cream BG. LEFT — magazine stamp + headline + subtitle. RIGHT — 3x2 thumb grid.
  const thumbs = [
    'https://images.unsplash.com/photo-1638284457192-27d3d0ec51aa?w=600&q=80',
    'https://images.unsplash.com/photo-1639663742190-1b3dba2eebcf?w=600&q=80',
    'https://images.unsplash.com/photo-1730367019975-4ad8d9e14ef2?w=600&q=80',
    'https://images.unsplash.com/photo-1768270181430-3e3672a32283?w=600&q=80',
    'https://images.unsplash.com/photo-1758194090785-8e09b7288199?w=600&q=80',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&q=80',
  ]

  return (
    <section className="relative bg-lafoi-cream pt-32 lg:pt-40 pb-16 lg:pb-24 overflow-hidden">
      <div aria-hidden className="absolute inset-0 mesh-gradient-1 opacity-40 pointer-events-none" />

      {/* Volume artifact */}
      <div className="absolute inset-x-0 top-28 lg:top-32 z-10 pointer-events-none">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-end gap-3">
          <span className="hidden sm:block w-8 h-px bg-lafoi-dark/20" />
          <span className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray/65">
            Vol.&nbsp;08 &mdash; 2026 &middot; Field notes
          </span>
        </div>
      </div>

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* LEFT — magazine masthead */}
          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Stamp */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-lafoi-dark/15 bg-white/70 mb-7">
              <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-dark font-semibold">
                Field notes
              </span>
              <span className="text-lafoi-dark/30">/</span>
              <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">
                Vol. 08
              </span>
              <span className="text-lafoi-dark/30">/</span>
              <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">
                2026
              </span>
            </div>

            <h1
              className="font-display text-lafoi-dark tracking-[-0.035em] leading-[0.95] text-[3rem] sm:text-[4.5rem] lg:text-[6rem] xl:text-[6.8rem]"
              style={{ fontVariationSettings: '"opsz" 144' }}
            >
              <span className="block font-light">Notes from</span>
              <span className="block italic font-light text-lafoi-green">the studio.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base lg:text-[17px] text-lafoi-gray font-body font-light leading-[1.7]">
              {linkifyProse(
                'Essays on stretch ceilings, architectural lighting and the small craft decisions that change a room. Written between projects, edited slowly — and cross-linked to our portfolio where the ideas were tested in practice.'
              )}
            </p>

            <p className="mt-8 font-sora text-[11px] tracking-[0.3em] uppercase text-lafoi-gray-medium">
              {posts.length} entries &middot; Curated journal
            </p>
          </motion.div>

          {/* RIGHT — 3x2 thumb grid */}
          <motion.div
            className="lg:col-span-5"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="grid grid-cols-3 grid-rows-2 gap-2 lg:gap-3 max-w-[420px] ml-auto">
              {thumbs.map((src, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-md overflow-hidden bg-lafoi-dark/10"
                >
                  <OptimizedImage
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                    fill
                    vision="Field notes thumbnail"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function FeaturedPost({ post }) {
  return (
    <section className="relative py-20 lg:py-32 bg-lafoi-cream overflow-hidden">
      <div className="absolute inset-0 pattern-cross-light opacity-35 pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-10 lg:mb-14">
          <AnimatedSection>
            <div className="flex items-center gap-3 mb-5">
              <span className="block w-10 h-px bg-lafoi-green/60" />
              <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                The cover essay
              </p>
              <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray/50">
                01 / 03
              </span>
            </div>
            <h2 className="font-display font-light text-lafoi-dark text-3xl sm:text-4xl lg:text-5xl leading-[1.1] tracking-[-0.02em]">
              This week,{' '}
              <span className="text-lafoi-green">on the studio desk</span>.
            </h2>
          </AnimatedSection>
        </div>

        <AnimatedSection delay={0.1}>
          <article className="group grid lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {/* duotone image — magazine cover */}
            <a
              href="#"
              className="lg:col-span-7 block relative aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-2xl rounded-bl-2xl overflow-hidden bg-lafoi-green"
              aria-label={post.title}
            >
              <OptimizedImage
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                fill
                vision={post.vision}
              />
              {/* duotone overlay — only on this one card */}
              <div
                aria-hidden
                className="absolute inset-0 bg-lafoi-green mix-blend-multiply pointer-events-none"
                style={{ opacity: 0.32 }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/55 via-lafoi-dark/10 to-transparent" />

              {/* corner artifact */}
              <div className="absolute top-6 left-6 right-6 flex items-start justify-between">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-sora text-white tracking-[0.25em] uppercase">
                  Cover &middot; {post.category}
                </span>
                <span className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-all duration-500">
                  <ArrowUpRight
                    size={14}
                    weight="regular"
                    className="text-white group-hover:rotate-45 transition-transform duration-500"
                  />
                </span>
              </div>

              {/* bottom legend */}
              <div className="absolute bottom-0 left-0 right-0 p-7 lg:p-9">
                <span className="block w-10 h-px bg-white/70 mb-3" />
                <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-white/85">
                  {post.date} &middot; {post.readTime} read
                </p>
              </div>
            </a>

            {/* text column */}
            <div className="lg:col-span-5">
              <div className="flex items-center gap-3 mb-6">
                <span className="block w-10 h-px bg-lafoi-green/60" />
                <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                  {post.category}
                </p>
              </div>

              <h3 className="font-display font-light text-lafoi-dark text-3xl sm:text-4xl lg:text-[2.8rem] xl:text-[3.2rem] leading-[1.1] tracking-[-0.02em] mb-6 group-hover:text-lafoi-green transition-colors duration-500">
                {post.title}
              </h3>

              <p className="font-body font-light text-base lg:text-lg text-lafoi-gray leading-[1.75] mb-8 max-w-md">
                {post.excerpt}
              </p>

              <div className="space-y-0 border-t border-lafoi-dark/10 mb-8 max-w-md">
                <div className="flex items-baseline justify-between gap-3 py-3 border-b border-lafoi-dark/10">
                  <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium inline-flex items-center gap-2">
                    <Calendar size={11} weight="regular" />
                    Published
                  </span>
                  <span className="font-display font-normal text-base text-lafoi-dark">
                    {post.date}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3 py-3 border-b border-lafoi-dark/10">
                  <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium inline-flex items-center gap-2">
                    <Clock size={11} weight="regular" />
                    Read time
                  </span>
                  <span className="font-display font-normal text-base text-lafoi-dark">
                    {post.readTime}
                  </span>
                </div>
              </div>

              <a
                href="#"
                className="group/cta inline-flex items-center gap-3 text-lafoi-dark font-sora text-sm font-medium pb-1 border-b border-lafoi-dark/30 hover:border-lafoi-green hover:text-lafoi-green transition-colors duration-300"
              >
                <span className="font-display font-light text-base">Read the article</span>
                <ArrowRight
                  size={15}
                  weight="bold"
                  className="group-hover/cta:translate-x-1 transition-transform duration-300"
                />
              </a>
            </div>
          </article>
        </AnimatedSection>
      </div>
    </section>
  )
}

function PostsGrid({ posts, categories, filter, setFilter }) {
  return (
    <section className="relative py-20 lg:py-32 bg-lafoi-cream overflow-hidden">
      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12 lg:mb-16">
          <div className="max-w-2xl">
            <AnimatedSection>
              <div className="flex items-center gap-3 mb-5">
                <span className="block w-10 h-px bg-lafoi-green/60" />
                <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                  All field notes
                </p>
                <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray/50">
                  02 / 03
                </span>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <h2 className="font-display font-light text-lafoi-dark text-3xl sm:text-4xl lg:text-5xl leading-[1.1] tracking-[-0.02em]">
                {posts.length} {posts.length === 1 ? 'entry' : 'entries'},{' '}
                <span className="text-lafoi-green">read in any order</span>.
              </h2>
            </AnimatedSection>
          </div>
        </div>

        {/* glass filter pills */}
        <AnimatedSection delay={0.15}>
          <div className="mb-12 lg:mb-16 flex flex-wrap items-center gap-2 sm:gap-3 px-5 lg:px-6 py-3 rounded-full bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)]">
            <span className="hidden sm:inline-flex items-center gap-2 font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray-medium pr-3 mr-1 border-r border-lafoi-dark/15">
              Filter
            </span>
            {categories.map((cat) => {
              const active = filter === cat
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-sora font-medium transition-all duration-300 ${
                    active
                      ? 'bg-gradient-to-b from-lafoi-green-light to-lafoi-green text-white shadow-[0_8px_24px_-12px_rgba(34,197,94,0.45)]'
                      : 'bg-white/60 text-lafoi-gray hover:bg-lafoi-green/8 hover:text-lafoi-green border border-lafoi-dark/10'
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </AnimatedSection>

        {/* asymmetric editorial bento — varied aspects */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={filter}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-6 lg:gap-8"
          >
            {posts.length === 0 ? (
              <div className="col-span-full py-16 text-center border-t border-b border-lafoi-dark/10">
                <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium block mb-3">
                  No entries
                </span>
                <p className="font-display font-light text-2xl text-lafoi-dark">
                  Nothing in this category yet.
                </p>
              </div>
            ) : (
              posts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

const ASPECT_PATTERN = ['aspect-[4/5]', 'aspect-[16/11]', 'aspect-square', 'aspect-[4/5]', 'aspect-[16/11]']
const SPAN_PATTERN = [
  'sm:col-span-3 lg:col-span-7',
  'sm:col-span-3 lg:col-span-5',
  'sm:col-span-3 lg:col-span-4',
  'sm:col-span-3 lg:col-span-4',
  'sm:col-span-6 lg:col-span-4',
]

function PostCard({ post, index }) {
  const aspect = ASPECT_PATTERN[index % ASPECT_PATTERN.length]
  const span = SPAN_PATTERN[index % SPAN_PATTERN.length]

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className={`group ${span}`}
    >
      <a href="#" className="block" aria-label={post.title}>
        {/* image with varied aspect */}
        <div
          className={`relative ${aspect} rounded-3xl overflow-hidden bg-lafoi-dark mb-5`}
        >
          <OptimizedImage
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover object-center group-hover:scale-[1.04] transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            fill
            vision={post.vision}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="absolute top-5 left-5">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] font-sora text-white tracking-[0.22em] uppercase">
              {post.category}
            </span>
          </div>
        </div>

        {/* category eyebrow with hairline */}
        <div className="flex items-center gap-3 mb-3">
          <span className="block w-8 h-px bg-lafoi-green/60" />
          <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
            {post.category}
          </p>
        </div>

        <h3 className="font-display font-light text-lafoi-dark text-2xl lg:text-[1.7rem] xl:text-[1.85rem] leading-[1.15] tracking-[-0.01em] mb-3 group-hover:text-lafoi-green group-hover:translate-x-1 transition-all duration-500">
          {post.title}
        </h3>

        <p className="font-body font-light text-sm lg:text-[15px] text-lafoi-gray leading-[1.65] mb-5 line-clamp-2">
          {linkifyProse(post.excerpt)}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-lafoi-dark/10">
          <div className="flex items-center gap-3 text-[10px] font-sora text-lafoi-gray-medium tracking-[0.18em] uppercase">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={11} weight="regular" />
              {post.date}
            </span>
            <span className="text-lafoi-dark/20">&middot;</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={11} weight="regular" />
              {post.readTime}
            </span>
          </div>
          <ArrowUpRight
            size={15}
            weight="regular"
            className="text-lafoi-dark/40 group-hover:text-lafoi-green group-hover:rotate-45 transition-all duration-500"
          />
        </div>
      </a>
    </motion.article>
  )
}

function NewsletterBand() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }
    setSubmitted(true)
    toast.success('Welcome to the conversation', {
      description: 'You will receive an essay every other week.',
    })
  }

  return (
    <section className="relative py-24 lg:py-36 bg-lafoi-cream overflow-hidden border-t border-lafoi-dark/8">
      <div className="absolute inset-0 pattern-cross-light opacity-50 pointer-events-none" />
      <div className="absolute inset-0 mesh-gradient-1 pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* left — copy */}
          <AnimatedSection direction="left" className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-5">
              <span className="block w-10 h-px bg-lafoi-green/60" />
              <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                The studio letter
              </p>
              <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray/50">
                03 / 03
              </span>
            </div>
            <h2 className="font-display font-light text-lafoi-dark text-4xl sm:text-5xl lg:text-[3.8rem] leading-[1.05] tracking-[-0.02em]">
              Stay in the{' '}
              <span className="text-lafoi-green">conversation</span>.
            </h2>
            <p className="mt-6 font-body font-light text-base lg:text-lg text-lafoi-gray leading-[1.7] max-w-lg">
              {linkifyProse(
                'An essay every other Friday — on craft, architectural lighting, materials and the small studio decisions that shape a room. No promotions, just thinking out loud, with the occasional link to our portfolio.'
              )}
            </p>
          </AnimatedSection>

          {/* right — input */}
          <AnimatedSection direction="right" className="lg:col-span-5">
            {submitted ? (
              <div className="border-t border-lafoi-dark/10 pt-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="block w-10 h-px bg-lafoi-green" />
                  <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                    Subscribed
                  </p>
                </div>
                <p className="font-display font-light text-2xl lg:text-3xl text-lafoi-dark leading-tight mb-3">
                  Welcome aboard.
                </p>
                <p className="font-body font-light text-base text-lafoi-gray leading-relaxed">
                  The first letter will land in {email} on the next publishing Friday.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false)
                    setEmail('')
                  }}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-sora text-lafoi-green hover:text-lafoi-green-dark transition-colors pb-1 border-b border-lafoi-green/30"
                >
                  Subscribe another address
                  <ArrowRight size={13} weight="bold" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <label className="block">
                  <span className="font-sora text-[10px] font-semibold tracking-[0.28em] uppercase text-lafoi-dark mb-3 block">
                    Email address
                  </span>
                  <div className="flex items-center gap-4 border-b border-lafoi-dark/25 focus-within:border-lafoi-green transition-colors duration-300 pb-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1 bg-transparent font-body text-base lg:text-lg text-lafoi-dark placeholder:text-lafoi-gray-medium outline-none"
                    />
                    <button
                      type="submit"
                      className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-lafoi-green-light text-white font-sora text-sm font-semibold hover:bg-lafoi-green transition-all duration-500 shadow-[0_8px_24px_-10px_rgba(34,197,94,0.45)] shrink-0"
                    >
                      <PaperPlaneRight size={14} weight="regular" />
                      Subscribe
                      <ArrowRight
                        size={13}
                        weight="bold"
                        className="group-hover:translate-x-0.5 transition-transform duration-300"
                      />
                    </button>
                  </div>
                </label>
                <p className="mt-4 font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium">
                  Unsubscribe anytime &middot; No spam, ever
                </p>
              </form>
            )}
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}
