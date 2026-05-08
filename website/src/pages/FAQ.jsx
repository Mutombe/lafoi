import React, { useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  CaretDown,
  ArrowRight,
  ArrowUpRight,
  Question,
  MagnifyingGlass,
  ChatCircleDots,
  EnvelopeSimple,
  WhatsappLogo,
} from '@phosphor-icons/react'
import AnimatedSection from '../components/ui/AnimatedSection'
import HeroSlideshow from '../components/ui/HeroSlideshow'
import { useSEO, breadcrumbsLd, faqLd } from '../utils/seo'
import { linkifyProse } from '../utils/linkify.jsx'

const FAQ_HERO_SLIDES = [
  {
    src: 'https://images.unsplash.com/photo-1638284457192-27d3d0ec51aa?w=2200&q=85',
    alt: 'Calm contemporary living room',
    vision: 'Reassuring quiet space',
  },
  {
    src: 'https://images.unsplash.com/photo-1758194090785-8e09b7288199?w=2200&q=85',
    alt: 'Luxurious lobby with backlit ceiling',
    vision: 'Editorial answer space',
  },
  {
    src: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=2200&q=85',
    alt: 'Contemporary architecture interior',
    vision: 'Architectural confidence',
  },
]

const faqCategories = [
  {
    category: 'General',
    questions: [
      {
        q: 'What are stretch ceilings?',
        a: 'Stretch ceilings are a modern ceiling finishing system made from PVC or fabric membranes that are stretched and fixed to a perimeter track. They create a perfectly smooth, seamless surface that can be customized with different colors, finishes, prints, and lighting integration.',
      },
      {
        q: 'Is La Foi Designs the first stretch ceiling company in Zimbabwe?',
        a: "Yes. Founded in January 2024, La Foi Designs is proud to be Zimbabwe's first and leading provider of stretch ceiling solutions. We pioneered this technology in the country through our work introducing premium membrane technology to the country.",
      },
      {
        q: 'What areas do you service?',
        a: 'We primarily service Harare and surrounding areas, but we take on projects across Zimbabwe. For large-scale commercial or hospitality projects, we welcome inquiries from anywhere in the country.',
      },
    ],
  },
  {
    category: 'Products & Materials',
    questions: [
      {
        q: 'What finishes are available?',
        a: 'We offer a comprehensive range including matte, gloss (mirror-like), satin, translucent (for backlighting), perforated (acoustic), suede, and printed finishes. Each is available in over 200 colors.',
      },
      {
        q: 'Are your ceilings fire-rated?',
        a: 'Yes, all our PVC membranes are fire-rated to European standards (Class B-s1, d0). They are self-extinguishing and do not produce toxic fumes, making them safe for residential and commercial use.',
      },
      {
        q: 'Are stretch ceilings waterproof?',
        a: 'Absolutely. PVC stretch ceilings are 100% waterproof and can hold up to 100 liters of water per square meter in case of a leak from above, protecting your furniture and flooring from water damage.',
      },
      {
        q: 'How long do stretch ceilings last?',
        a: 'With proper care, stretch ceilings can last 15 to 25 years. Our products come with a manufacturer warranty up to 10 years on the membrane and a workmanship cover from La Foi Designs.',
      },
    ],
  },
  {
    category: 'Installation',
    questions: [
      {
        q: 'How long does installation take?',
        a: 'A standard room (20 to 30 sqm) can be completed in 4 to 8 hours. Larger spaces or complex designs with lighting integration may take 1 to 2 days. We work efficiently to minimize disruption.',
      },
      {
        q: 'Is the installation process messy?',
        a: "No. One of the biggest advantages of stretch ceilings is the clean installation process. Unlike traditional plastering, there's minimal dust and debris. We also protect all furniture and surfaces during installation.",
      },
      {
        q: 'Do I need to remove existing ceilings?',
        a: "No. Stretch ceilings are installed below your existing ceiling using a perimeter track system. They're perfect for covering imperfections, cracks, or uneven surfaces without demolition work.",
      },
      {
        q: 'Can stretch ceilings be installed in bathrooms?',
        a: "Yes. PVC stretch ceilings are ideal for bathrooms and kitchens due to their moisture resistance. They won't develop mold, mildew, or condensation stains.",
      },
    ],
  },
  {
    category: 'Pricing & Process',
    questions: [
      {
        q: 'How much do stretch ceilings cost?',
        a: 'Pricing depends on the area size, ceiling type, finish, and lighting requirements. We provide free consultations and detailed quotations. Contact us for a personalized quote tailored to your project.',
      },
      {
        q: 'Do you offer free consultations?',
        a: "Yes. We offer completely free initial consultations where we assess your space, discuss options, and provide recommendations. There's no obligation, we want you to make an informed decision.",
      },
      {
        q: 'What is your warranty policy?',
        a: 'All installations come with a manufacturer warranty up to 10 years on the membrane and a 2-year warranty on installation workmanship. The manufacturer warranty stands behind every product.',
      },
    ],
  },
]

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState('General')
  const [query, setQuery] = useState('')

  useSEO({
    title: 'Frequently Asked Questions',
    description:
      'Stretch ceiling installation, lighting integration, lead times, materials, warranty, and pricing, answers to the most-asked questions.',
    path: '/faq',
    jsonLd: [
      breadcrumbsLd([
        { name: 'Home', path: '/' },
        { name: 'FAQ', path: '/faq' },
      ]),
      faqLd(faqCategories.flatMap((c) => c.questions.map((it) => ({ q: it.q, a: it.a })))),
    ],
  })

  const activeQuestions = useMemo(() => {
    const cat = faqCategories.find((c) => c.category === activeCategory)
    if (!cat) return []
    if (!query.trim()) return cat.questions
    const needle = query.trim().toLowerCase()
    return cat.questions.filter(
      (q) => q.q.toLowerCase().includes(needle) || q.a.toLowerCase().includes(needle),
    )
  }, [activeCategory, query])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <FAQHero />
      <FAQAccordion
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        query={query}
        setQuery={setQuery}
        activeQuestions={activeQuestions}
      />
      <FAQContactCard />
    </motion.div>
  )
}

function FAQHero() {
  // Brutalist / Memphis-light. Cream BG. Big serif "?" glyph + floating geometric shapes.
  return (
    <section className="relative bg-lafoi-cream pt-32 lg:pt-40 pb-20 lg:pb-28 overflow-hidden">
      <div aria-hidden className="absolute inset-0 mesh-gradient-1 opacity-40 pointer-events-none" />

      {/* Volume artifact */}
      <div className="absolute inset-x-0 top-28 lg:top-32 z-10 pointer-events-none">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-end gap-3">
          <span className="hidden sm:block w-8 h-px bg-lafoi-dark/20" />
          <span className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray/65">
            Vol.&nbsp;07, 2026 &middot; Questions answered
          </span>
        </div>
      </div>

      {/* Massive ghost "?" glyph, upper-right */}
      <span
        aria-hidden
        className="absolute right-[-2vw] top-12 lg:top-20 font-display font-light italic text-lafoi-green/10 leading-none pointer-events-none select-none"
        style={{ fontSize: 'clamp(14rem, 32vw, 32rem)' }}
      >
        ?
      </span>

      {/* Floating geometric shapes, Memphis */}
      <motion.span
        aria-hidden
        className="absolute hidden lg:block top-[16rem] left-[6vw] w-12 h-12 rounded-full bg-lafoi-green/20 pointer-events-none"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.span
        aria-hidden
        className="absolute hidden lg:block top-[24rem] right-[34vw] w-10 h-10 bg-lafoi-green/15 pointer-events-none rotate-12"
        animate={{ rotate: [12, 22, 12] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.span
        aria-hidden
        className="absolute hidden lg:block bottom-[6rem] left-[28vw] w-0 h-0 pointer-events-none"
        style={{
          borderLeft: '24px solid transparent',
          borderRight: '24px solid transparent',
          borderBottom: '40px solid rgba(26, 138, 46, 0.18)',
        }}
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-3 mb-7">
              <span className="block w-12 h-px bg-lafoi-green/60" />
              <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                Support &middot; Frequently asked
              </p>
            </div>
          </motion.div>

          <motion.h1
            className="font-display text-lafoi-dark tracking-[-0.035em] leading-[0.98] text-[3.2rem] sm:text-[5rem] lg:text-[7rem] xl:text-[8rem]"
            style={{ fontVariationSettings: '"opsz" 144' }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="block font-normal">Questions,</span>
            <span className="block italic font-light text-lafoi-green">answered.</span>
          </motion.h1>

          <motion.p
            className="mt-8 max-w-xl text-sm sm:text-base lg:text-[17px] text-lafoi-gray font-body font-light leading-[1.7]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {linkifyProse(
              'Everything we are usually asked about stretch ceilings and lighting solutions, gathered in one quiet room. If yours is missing, our studio is one message away, or browse our portfolio for context.'
            )}
          </motion.p>
        </div>
      </div>
    </section>
  )
}

function FAQAccordion({ activeCategory, setActiveCategory, query, setQuery, activeQuestions }) {
  const totalCount = faqCategories.reduce((acc, c) => acc + c.questions.length, 0)

  return (
    <section className="relative py-20 lg:py-32 bg-lafoi-cream overflow-hidden">
      <div className="absolute inset-0 pattern-cross-light opacity-40 pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12 lg:mb-16">
          <div className="max-w-2xl">
            <AnimatedSection>
              <div className="flex items-center gap-3 mb-5">
                <span className="block w-10 h-px bg-lafoi-green/60" />
                <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                  The catalogue of answers
                </p>
                <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray/50">
                  01 / 02
                </span>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <h2 className="font-display font-light text-lafoi-dark text-3xl sm:text-4xl lg:text-5xl leading-[1.1] tracking-[-0.02em]">
                {totalCount} questions, four{' '}
                <span className="text-lafoi-green">categories</span>.
              </h2>
            </AnimatedSection>
          </div>
          <AnimatedSection delay={0.2} direction="right">
            <p className="font-body font-light text-lafoi-gray max-w-sm leading-relaxed">
              {linkifyProse(
                'Pick a category, search by phrase, or scroll through. The longer answers tend to be the ones worth reading twice, and link out to the technical guide where appropriate.'
              )}
            </p>
          </AnimatedSection>
        </div>

        {/* Search bar, glass strip */}
        <AnimatedSection delay={0.15}>
          <div className="mb-6 lg:mb-8">
            <div className="relative flex items-center gap-3 px-5 lg:px-6 py-4 rounded-full bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] focus-within:border-lafoi-green/40 focus-within:shadow-[0_8px_32px_-8px_rgba(34,197,94,0.18)] transition-all duration-500">
              <MagnifyingGlass size={16} weight="regular" className="text-lafoi-gray-medium shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search questions, try 'warranty' or 'installation'…"
                className="flex-1 bg-transparent font-body text-sm lg:text-base text-lafoi-dark placeholder:text-lafoi-gray-medium outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-[10px] font-sora tracking-[0.25em] uppercase text-lafoi-gray-medium hover:text-lafoi-green transition-colors px-2 shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </AnimatedSection>

        {/* Category tabs, glass pills */}
        <AnimatedSection delay={0.2}>
          <div className="mb-12 lg:mb-16 flex flex-wrap items-center gap-2 sm:gap-3 px-5 lg:px-6 py-3 rounded-full bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)]">
            <span className="hidden sm:inline-flex items-center gap-2 font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray-medium pr-3 mr-1 border-r border-lafoi-dark/15">
              Filter
            </span>
            {faqCategories.map((cat) => {
              const active = activeCategory === cat.category
              return (
                <button
                  key={cat.category}
                  onClick={() => {
                    setActiveCategory(cat.category)
                    setQuery('')
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-sora font-medium transition-all duration-300 ${
                    active
                      ? 'bg-gradient-to-b from-lafoi-green-light to-lafoi-green text-white shadow-[0_8px_24px_-12px_rgba(34,197,94,0.45)]'
                      : 'bg-white/60 text-lafoi-gray hover:bg-lafoi-green/8 hover:text-lafoi-green border border-lafoi-dark/10'
                  }`}
                >
                  {cat.category}
                  <span
                    className={`ml-2 text-[9px] tracking-[0.2em] ${
                      active ? 'text-white/70' : 'text-lafoi-gray-medium'
                    }`}
                  >
                    {cat.questions.length}
                  </span>
                </button>
              )
            })}
          </div>
        </AnimatedSection>

        {/* Accordion */}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeCategory + (query ? '-search' : '')}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="border-t border-lafoi-dark/10"
            >
              {activeQuestions.length === 0 ? (
                <div className="py-16 text-center border-b border-lafoi-dark/10">
                  <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium block mb-3">
                    No matches
                  </span>
                  <p className="font-display font-light text-2xl text-lafoi-dark mb-3">
                    Nothing here yet.
                  </p>
                  <p className="font-body font-light text-sm text-lafoi-gray max-w-md mx-auto">
                    Try a different category or message the studio directly, most briefs benefit
                    from a conversation anyway.
                  </p>
                </div>
              ) : (
                activeQuestions.map((item, i) => (
                  <FAQItem key={`${activeCategory}-${i}`} item={item} index={i} />
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

function FAQItem({ item, index }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="border-b border-lafoi-dark/10"
    >
      <button
        onClick={() => setOpen(!open)}
        className="group w-full flex items-start justify-between gap-6 lg:gap-10 py-7 lg:py-8 text-left"
      >
        <div className="flex items-baseline gap-5 lg:gap-7 flex-1 min-w-0">
          <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium shrink-0 mt-2 hidden sm:block">
            0{index + 1}
          </span>
          <h3 className="font-display font-normal text-lafoi-dark text-xl lg:text-2xl xl:text-[1.7rem] leading-[1.25] tracking-[-0.01em] group-hover:text-lafoi-green transition-colors duration-300">
            {item.q}
          </h3>
        </div>
        <span
          className={`shrink-0 mt-2 w-9 h-9 lg:w-10 lg:h-10 rounded-full border flex items-center justify-center transition-all duration-500 ${
            open
              ? 'border-lafoi-green bg-lafoi-green text-white rotate-180'
              : 'border-lafoi-dark/20 text-lafoi-dark group-hover:border-lafoi-green group-hover:text-lafoi-green'
          }`}
        >
          <CaretDown size={14} weight="regular" />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-9 lg:pb-10 sm:pl-[calc(2.5rem+1.25rem)] lg:pl-[calc(2.5rem+1.75rem)] pr-12 lg:pr-16">
              <span className="block w-10 h-px bg-lafoi-green/60 mb-5" />
              <p className="font-body font-light text-base lg:text-[17px] text-lafoi-gray leading-[1.7] max-w-3xl">
                {linkifyProse(item.a)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function FAQContactCard() {
  return (
    <section className="relative py-20 lg:py-32 bg-lafoi-cream overflow-hidden">
      <div className="absolute inset-0 pattern-diagonal opacity-25 pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <AnimatedSection>
          <div className="relative rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-2xl rounded-bl-2xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.08)] overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 pattern-blueprint opacity-20 pointer-events-none"
            />

            <div className="relative grid lg:grid-cols-12 gap-8 lg:gap-14 items-center p-8 lg:p-14">
              <div className="lg:col-span-7">
                <div className="flex items-center gap-3 mb-6">
                  <span className="block w-10 h-px bg-lafoi-green/60" />
                  <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                    Still wondering
                  </p>
                  <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray/50">
                    02 / 02
                  </span>
                </div>

                <h2 className="font-display font-light text-lafoi-dark text-3xl sm:text-4xl lg:text-[3rem] leading-[1.1] tracking-[-0.02em] mb-6">
                  Still wondering?{' '}
                  <span className="text-lafoi-green">Ask the studio.</span>
                </h2>

                <p className="font-body font-light text-base lg:text-lg text-lafoi-gray leading-[1.75] mb-9 max-w-xl">
                  Most briefs are clarified in a single conversation. WhatsApp is fastest, email if
                  you would rather attach drawings or photographs.
                </p>

                <div className="flex flex-wrap items-center gap-4 lg:gap-5">
                  <a
                    href="https://wa.me/263712326951"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-3 px-7 py-4 rounded-full bg-lafoi-green-light text-white font-sora text-sm font-semibold hover:bg-lafoi-green transition-all duration-500 shadow-[0_10px_40px_-10px_rgba(34,197,94,0.55)]"
                  >
                    <WhatsappLogo size={17} weight="regular" />
                    Message us on WhatsApp
                    <ArrowUpRight
                      size={15}
                      weight="bold"
                      className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300"
                    />
                  </a>
                  <a
                    href="mailto:admin@lafoidesigns.co.zw"
                    className="group inline-flex items-center gap-3 px-7 py-4 rounded-full bg-white/70 backdrop-blur-md border border-lafoi-dark/15 text-lafoi-dark font-sora text-sm font-semibold hover:bg-white hover:border-lafoi-green/40 transition-all duration-500"
                  >
                    <EnvelopeSimple size={17} weight="regular" />
                    admin@lafoidesigns.co.zw
                    <ArrowRight
                      size={14}
                      weight="bold"
                      className="group-hover:translate-x-1 transition-transform duration-300"
                    />
                  </a>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="space-y-0 border-t border-lafoi-dark/10">
                  {[
                    { eyebrow: 'Reply', value: 'Within 24 hours' },
                    { eyebrow: 'Studio', value: 'Belgravia, Harare' },
                    { eyebrow: 'Phone', value: '+263 712 326 951' },
                    { eyebrow: 'Hours', value: 'Mon-Sat · 08:00 to 18:00' },
                  ].map((row) => (
                    <div
                      key={row.eyebrow}
                      className="flex items-baseline justify-between gap-4 py-4 border-b border-lafoi-dark/10"
                    >
                      <span className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-gray-medium shrink-0">
                        {row.eyebrow}
                      </span>
                      <span className="font-display font-normal text-base text-lafoi-dark text-right">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/contact"
                  className="group inline-flex items-center gap-2 mt-7 text-lafoi-dark font-sora text-xs font-medium pb-1 border-b border-lafoi-dark/30 hover:border-lafoi-green hover:text-lafoi-green transition-colors duration-300 uppercase tracking-[0.2em]"
                >
                  <ChatCircleDots size={13} weight="regular" />
                  Open the contact page
                  <ArrowRight
                    size={12}
                    weight="bold"
                    className="group-hover:translate-x-0.5 transition-transform duration-300"
                  />
                </Link>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
