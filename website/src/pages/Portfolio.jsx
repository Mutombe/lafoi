import React from 'react';
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { ArrowUpRight, X } from 'lucide-react'
import AnimatedSection, { StaggerContainer, StaggerItem } from '../components/ui/AnimatedSection'
import OptimizedImage from '../components/ui/OptimizedImage'
import { useSEO } from '../utils/seo'

const categories = ['All', 'Residential', 'Commercial', 'Hospitality', 'Retail']

const projects = [
  { id: 1, title: 'Borrowdale Residence', category: 'Residential', image: 'https://images.unsplash.com/photo-1638284457192-27d3d0ec51aa?w=800&q=80', desc: 'Matte white stretch ceiling with perimeter LED cove lighting in a luxury home.', tall: true, vision: 'Elegant living room with premium ceiling design and sophisticated furnishings' },
  { id: 2, title: 'Meikles Hotel Ballroom', category: 'Hospitality', image: 'https://images.unsplash.com/photo-1758194090785-8e09b7288199?w=800&q=80', desc: 'Translucent backlit ceiling spanning the entire ballroom with color-changing LED.', vision: 'Luxurious lobby with modern seating, gold accents, and dramatic ceiling lighting' },
  { id: 3, title: 'TechHub Office', category: 'Commercial', image: 'https://images.unsplash.com/photo-1595513279524-fa90ad188c98?w=800&q=80', desc: 'Acoustic micro-perforated ceilings across an open-plan office.', vision: 'Professional studio with acoustic ceiling treatment and panels' },
  { id: 4, title: 'Garden City Mall', category: 'Retail', image: 'https://images.unsplash.com/photo-1634146601607-9f319f71b5ee?w=800&q=80', desc: '3D wave-form ceilings creating dynamic visual flow through the retail space.', tall: true, vision: 'Large building with dramatic architectural ceiling and skylight' },
  { id: 5, title: 'Avondale Villa', category: 'Residential', image: 'https://images.unsplash.com/photo-1765434670017-c0d28ecde29a?w=800&q=80', desc: 'Fiber optic starry sky ceiling in a master bedroom suite.', vision: 'Modern bedroom with large bed and ambient lighting design' },
  { id: 6, title: 'The Ivy Restaurant', category: 'Hospitality', image: 'https://images.unsplash.com/photo-1618259715220-a89a4e4da76b?w=800&q=80', desc: 'Printed cloud ceiling with ambient warm lighting for a fine dining atmosphere.', vision: 'Country hotel interior with elegant design and warm atmosphere' },
  { id: 7, title: 'Pearl Spa & Wellness', category: 'Hospitality', image: 'https://images.unsplash.com/photo-1730367019975-4ad8d9e14ef2?w=800&q=80', desc: 'Printed blue sky ceiling over the pool area with moisture-proof stretch membrane.', tall: true, vision: 'Indoor pool with stone walls and natural light from above' },
  { id: 8, title: 'Sam Levy\'s Village', category: 'Retail', image: 'https://images.unsplash.com/photo-1768270181430-3e3672a32283?w=800&q=80', desc: 'Glossy stretch ceiling with integrated spotlighting for a modern retail showroom.', vision: 'Modern lobby with marble floors and decorative ceiling' },
  { id: 9, title: 'Highlands Home', category: 'Residential', image: 'https://images.unsplash.com/photo-1639663742190-1b3dba2eebcf?w=800&q=80', desc: 'Full home installation -- living room, bedrooms, and bathroom stretch ceilings.', vision: 'Luxury modern living room with premium ceiling and furniture' },
]

export default function Portfolio() {
  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState(null)

  const filtered = filter === 'All' ? projects : projects.filter(p => p.category === filter)

  useSEO({
    title: 'Our Portfolio',
    description: 'Explore La Foi Designs\' portfolio of stunning stretch ceiling and lighting installations across Zimbabwe.',
    path: '/portfolio',
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero */}
      <section className="relative min-h-[55vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <OptimizedImage
            src="https://images.unsplash.com/photo-1758194090785-8e09b7288199?w=1920&q=80"
            alt="Luxury interior showcasing ceiling design"
            className="w-full h-full object-cover"
            fill
            priority
            vision="Luxurious lobby with modern seating, gold accents, and dramatic ceiling lighting"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-lafoi-dark/90 via-lafoi-dark/75 to-lafoi-dark/50" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
        </div>
        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 w-full pt-32 pb-16">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-2 h-2 rounded-full bg-lafoi-green animate-pulse" />
              <span className="text-xs font-sora text-white/80 font-medium tracking-wider uppercase">Portfolio</span>
            </motion.div>
            <h1 className="heading-xl text-4xl sm:text-5xl lg:text-6xl text-white mt-4 mb-6">
              Spaces we've<br /><span className="text-gradient">transformed</span>
            </h1>
            <p className="text-white/70 font-general text-lg max-w-xl">
              Every project tells a story of transformation. Explore our curated collection of stretch ceiling and lighting installations across Zimbabwe.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filter & Gallery */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-12 justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-sora font-medium transition-all duration-300 ${
                  filter === cat
                    ? 'bg-lafoi-green text-white shadow-lg shadow-lafoi-green/20'
                    : 'bg-gray-100 text-lafoi-gray hover:bg-lafoi-green/10 hover:text-lafoi-green'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Masonry Grid */}
          <motion.div layout className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
            <AnimatePresence mode="popLayout">
              {filtered.map((project) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  className="break-inside-avoid"
                >
                  <button
                    onClick={() => setSelected(project)}
                    className="group block w-full rounded-3xl overflow-hidden relative text-left"
                  >
                    <div className={project.tall ? 'h-96' : 'h-72'}>
                      <OptimizedImage
                        src={project.image}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        fill
                        vision={project.vision}
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <p className="text-xs font-sora text-lafoi-green-light font-medium uppercase tracking-wider">{project.category}</p>
                      <h3 className="font-sora text-lg font-bold text-white mt-1 flex items-center gap-2">
                        {project.title} <ArrowUpRight size={16} />
                      </h3>
                    </div>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelected(null)} />
            <motion.div
              className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition-colors"
              >
                <X size={18} />
              </button>
              <div className="h-80 sm:h-96">
                <OptimizedImage
                  src={selected.image}
                  alt={selected.title}
                  className="w-full h-full object-cover"
                  fill
                  priority
                  vision={selected.vision}
                />
              </div>
              <div className="p-8">
                <p className="text-xs font-sora text-lafoi-green font-semibold uppercase tracking-wider">{selected.category}</p>
                <h3 className="font-sora text-2xl font-bold text-lafoi-dark mt-2 mb-3">{selected.title}</h3>
                <p className="text-lafoi-gray font-general">{selected.desc}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
