import React from 'react';
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ArrowRight, HelpCircle, MessageCircle } from 'lucide-react'
import AnimatedSection from '../components/ui/AnimatedSection'
import { useSEO } from '../utils/seo'

const faqCategories = [
  {
    category: 'General',
    questions: [
      { q: 'What are stretch ceilings?', a: 'Stretch ceilings are a modern ceiling finishing system made from PVC or fabric membranes that are stretched and fixed to a perimeter track. They create a perfectly smooth, seamless surface that can be customized with different colors, finishes, prints, and lighting integration.' },
      { q: 'Is La Foi Designs the first stretch ceiling company in Zimbabwe?', a: 'Yes! Founded in January 2024, La Foi Designs is proud to be Zimbabwe\'s first and leading provider of stretch ceiling solutions. We pioneered this technology in the country through our partnerships with top manufacturers in Germany and Estonia.' },
      { q: 'What areas do you service?', a: 'We primarily service Harare and surrounding areas, but we take on projects across Zimbabwe. For large-scale commercial or hospitality projects, we welcome inquiries from anywhere in the country.' },
    ],
  },
  {
    category: 'Products & Materials',
    questions: [
      { q: 'What finishes are available?', a: 'We offer a comprehensive range including matte, gloss (mirror-like), satin, translucent (for backlighting), perforated (acoustic), suede, and printed finishes. Each is available in over 200 colors.' },
      { q: 'Are your ceilings fire-rated?', a: 'Yes, all our PVC membranes are fire-rated to European standards (Class B-s1, d0). They are self-extinguishing and do not produce toxic fumes — making them safe for residential and commercial use.' },
      { q: 'Are stretch ceilings waterproof?', a: 'Absolutely. PVC stretch ceilings are 100% waterproof and can hold up to 100 liters of water per square meter in case of a leak from above, protecting your furniture and flooring from water damage.' },
      { q: 'How long do stretch ceilings last?', a: 'With proper care, stretch ceilings last 15-25 years. Our products come with a 10-year manufacturer warranty backed by our German and Estonian partners.' },
    ],
  },
  {
    category: 'Installation',
    questions: [
      { q: 'How long does installation take?', a: 'A standard room (20-30 sqm) can be completed in 4-8 hours. Larger spaces or complex designs with lighting integration may take 1-2 days. We work efficiently to minimize disruption.' },
      { q: 'Is the installation process messy?', a: 'No. One of the biggest advantages of stretch ceilings is the clean installation process. Unlike traditional plastering, there\'s minimal dust and debris. We also protect all furniture and surfaces during installation.' },
      { q: 'Do I need to remove existing ceilings?', a: 'No! Stretch ceilings are installed below your existing ceiling using a perimeter track system. They\'re perfect for covering imperfections, cracks, or uneven surfaces without demolition work.' },
      { q: 'Can stretch ceilings be installed in bathrooms?', a: 'Yes. PVC stretch ceilings are ideal for bathrooms and kitchens due to their moisture resistance. They won\'t develop mold, mildew, or condensation stains.' },
    ],
  },
  {
    category: 'Pricing & Process',
    questions: [
      { q: 'How much do stretch ceilings cost?', a: 'Pricing depends on the area size, ceiling type, finish, and lighting requirements. We provide free consultations and detailed quotations. Contact us for a personalized quote tailored to your project.' },
      { q: 'Do you offer free consultations?', a: 'Yes! We offer completely free initial consultations where we assess your space, discuss options, and provide recommendations. There\'s no obligation — we want you to make an informed decision.' },
      { q: 'What is your warranty policy?', a: 'All installations come with a 10-year manufacturer warranty on materials and a 2-year warranty on installation workmanship. Our German and Estonian partners stand behind every product.' },
    ],
  },
]

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState('General')

  useSEO({
    title: 'Frequently Asked Questions',
    description: 'Find answers to common questions about stretch ceilings, installation, pricing, and more from La Foi Designs.',
    path: '/faq',
  })

  const activeQuestions = faqCategories.find(c => c.category === activeCategory)?.questions || []

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <section className="relative min-h-[50vh] flex items-center bg-lafoi-dark overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-lafoi-green/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-20 w-64 h-64 bg-lafoi-green/5 rounded-full blur-[80px]" />
        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 w-full pt-32 pb-20">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <HelpCircle size={14} className="text-lafoi-green" />
              <span className="text-xs font-sora text-white/70 font-medium tracking-wider uppercase">Support</span>
            </motion.div>
            <h1 className="heading-xl text-4xl sm:text-5xl lg:text-6xl text-white mt-4 mb-6">
              Frequently asked<br /><span className="text-gradient">questions</span>
            </h1>
            <p className="text-white/60 font-general text-lg max-w-xl">
              Everything you need to know about stretch ceilings, our process, and what makes La Foi Designs different.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 mb-10 justify-center">
            {faqCategories.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setActiveCategory(cat.category)}
                className={`px-5 py-2.5 rounded-full text-sm font-sora font-medium transition-all duration-300 ${
                  activeCategory === cat.category
                    ? 'bg-lafoi-green text-white'
                    : 'bg-gray-100 text-lafoi-gray hover:bg-lafoi-green/10'
                }`}
              >
                {cat.category}
              </button>
            ))}
          </div>

          {/* Questions */}
          <div className="space-y-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {activeQuestions.map((item, i) => (
                  <FAQItem key={i} item={item} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* CTA */}
          <AnimatedSection className="mt-16 p-8 rounded-3xl bg-lafoi-green-soft border border-lafoi-green/10 text-center">
            <MessageCircle size={28} className="text-lafoi-green mx-auto mb-4" />
            <h3 className="font-sora text-xl font-bold text-lafoi-dark mb-3">Still have questions?</h3>
            <p className="text-sm text-lafoi-gray font-general mb-6">Our team is here to help. Reach out and we'll respond within 24 hours.</p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-lafoi-green text-white rounded-full text-sm font-sora font-semibold hover:bg-lafoi-green-light transition-colors group"
            >
              Contact Us <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </motion.div>
  )
}

function FAQItem({ item }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden hover:shadow-md hover:shadow-black/[0.03] transition-shadow duration-300">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <HelpCircle size={18} className="text-lafoi-green shrink-0" />
          <span className="font-sora text-sm font-semibold text-lafoi-dark">{item.q}</span>
        </div>
        <ChevronDown
          size={18}
          className={`text-lafoi-gray-medium shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-5 pb-5 pl-12">
              <p className="text-sm text-lafoi-gray font-general leading-relaxed">{item.a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
