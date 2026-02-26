import React from 'react';
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, Clock, ArrowUpRight } from 'lucide-react'
import AnimatedSection, { StaggerContainer, StaggerItem } from '../components/ui/AnimatedSection'
import OptimizedImage from '../components/ui/OptimizedImage'
import { useSEO } from '../utils/seo'

const posts = [
  {
    id: 1,
    title: '5 Ways Stretch Ceilings Transform Small Spaces',
    excerpt: 'Discover how stretch ceilings create the illusion of more space, add depth with lighting, and elevate the design of compact rooms.',
    category: 'Design Tips',
    date: 'Feb 15, 2026',
    readTime: '4 min',
    image: 'https://images.unsplash.com/photo-1638284457192-27d3d0ec51aa?w=800&q=80',
    vision: 'Elegant living room with premium stretch ceiling and refined furnishings',
    featured: true,
  },
  {
    id: 2,
    title: 'The Science Behind Acoustic Stretch Ceilings',
    excerpt: 'How micro-perforated membranes reduce noise levels while maintaining elegant aesthetics in offices and hospitality venues.',
    category: 'Innovation',
    date: 'Feb 8, 2026',
    readTime: '6 min',
    image: 'https://images.unsplash.com/photo-1595513279524-fa90ad188c98?w=800&q=80',
    vision: 'Professional studio with acoustic ceiling treatment',
  },
  {
    id: 3,
    title: 'Fiber Optic Starry Skies: The Ultimate Bedroom Upgrade',
    excerpt: 'Everything you need to know about creating a magical starry sky effect in your bedroom with fiber optic ceiling technology.',
    category: 'Lighting',
    date: 'Jan 28, 2026',
    readTime: '5 min',
    image: 'https://images.unsplash.com/photo-1767203330128-b4c27297f320?w=800&q=80',
    vision: 'Modern ceiling lights with blue and white artistic accents',
  },
  {
    id: 4,
    title: 'Stretch Ceilings vs Traditional Plastering: A Complete Guide',
    excerpt: 'Comparing cost, durability, installation time, and aesthetics between stretch ceilings and traditional ceiling finishes.',
    category: 'Guides',
    date: 'Jan 20, 2026',
    readTime: '7 min',
    image: 'https://images.unsplash.com/photo-1639663742190-1b3dba2eebcf?w=800&q=80',
    vision: 'Luxury modern living room with premium ceiling',
  },
  {
    id: 5,
    title: 'Our German Partners: Inside the Manufacturing Process',
    excerpt: 'A behind-the-scenes look at how our premium PVC membranes are manufactured to exacting European quality standards.',
    category: 'Behind the Scenes',
    date: 'Jan 12, 2026',
    readTime: '5 min',
    image: 'https://images.unsplash.com/photo-1742440710226-450e3b85c100?w=800&q=80',
    vision: 'Designers collaborating in a warm wooden architectural space',
  },
  {
    id: 6,
    title: 'Top Interior Design Trends in Zimbabwe for 2026',
    excerpt: 'From biophilic design to statement ceilings, explore the trends shaping Zimbabwean interior spaces this year.',
    category: 'Trends',
    date: 'Jan 5, 2026',
    readTime: '6 min',
    image: 'https://images.unsplash.com/photo-1618259715220-a89a4e4da76b?w=800&q=80',
    vision: 'Country hotel interior with elegant design and sophisticated ceiling',
  },
]

export default function Blog() {
  const featured = posts.find(p => p.featured)
  const regular = posts.filter(p => !p.featured)

  useSEO({
    title: 'Blog & Design Insights',
    description: 'Expert insights on stretch ceilings, lighting design, interior trends, and more from La Foi Designs.',
    path: '/blog',
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero */}
      <section className="relative min-h-[45vh] flex items-center bg-lafoi-cream overflow-hidden">
        <div className="absolute inset-0 mesh-gradient-hero" />
        <div className="absolute inset-0 dot-pattern opacity-40" />
        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 w-full pt-32 pb-16">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="text-lafoi-green font-sora text-sm font-semibold tracking-widest uppercase">Blog</span>
            <h1 className="heading-xl text-4xl sm:text-5xl text-lafoi-dark mt-4 mb-6">
              Design insights &<br /><span className="text-gradient">inspiration</span>
            </h1>
            <p className="body-text text-lg max-w-xl">
              Expert articles on stretch ceilings, interior design trends, lighting innovation, and the stories behind our transformations.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured Post */}
      {featured && (
        <section className="py-16">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
            <AnimatedSection>
              <div className="grid lg:grid-cols-2 gap-8 items-center rounded-3xl bg-white border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-500 group cursor-pointer">
                <div className="h-72 lg:h-96 overflow-hidden">
                  <OptimizedImage
                    src={featured.image}
                    alt={featured.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    fill
                    vision={featured.vision}
                  />
                </div>
                <div className="p-8 lg:p-10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 rounded-full bg-lafoi-green/10 text-lafoi-green text-xs font-sora font-semibold">{featured.category}</span>
                    <span className="text-xs text-lafoi-gray-medium font-general flex items-center gap-1"><Calendar size={12} /> {featured.date}</span>
                    <span className="text-xs text-lafoi-gray-medium font-general flex items-center gap-1"><Clock size={12} /> {featured.readTime}</span>
                  </div>
                  <h2 className="font-sora text-2xl lg:text-3xl font-bold text-lafoi-dark mb-4 group-hover:text-lafoi-green transition-colors">{featured.title}</h2>
                  <p className="text-lafoi-gray font-general mb-6">{featured.excerpt}</p>
                  <span className="inline-flex items-center gap-2 text-sm font-sora font-semibold text-lafoi-green">
                    Read Article <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* Blog Grid */}
      <section className="pb-24 lg:pb-32">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.08}>
            {regular.map((post) => (
              <StaggerItem key={post.id}>
                <div className="group rounded-3xl overflow-hidden bg-white border border-gray-100 hover:shadow-xl transition-shadow duration-500 cursor-pointer h-full flex flex-col">
                  <div className="h-52 overflow-hidden">
                    <OptimizedImage
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      fill
                      vision={post.vision}
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-2.5 py-1 rounded-full bg-lafoi-green/10 text-lafoi-green text-xs font-sora font-semibold">{post.category}</span>
                      <span className="text-xs text-lafoi-gray-medium font-general">{post.readTime}</span>
                    </div>
                    <h3 className="font-sora text-lg font-bold text-lafoi-dark mb-2 group-hover:text-lafoi-green transition-colors">{post.title}</h3>
                    <p className="text-sm text-lafoi-gray font-general line-clamp-2 flex-1">{post.excerpt}</p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <span className="text-xs text-lafoi-gray-medium font-general flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                      <ArrowUpRight size={16} className="text-lafoi-green opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </motion.div>
  )
}
