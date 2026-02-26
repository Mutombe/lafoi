import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Play, ChevronRight, Star, Quote,
  Sparkles, Award, Users, Globe, Layers, Lightbulb,
  Palette, Volume2, Printer, Box, ArrowUpRight, Check
} from 'lucide-react'
import AnimatedSection, { StaggerContainer, StaggerItem } from '../components/ui/AnimatedSection'
import OptimizedImage from '../components/ui/OptimizedImage'
import { useSEO } from '../utils/seo'

export default function Home() {
  useSEO({
    title: null,
    description: "Zimbabwe's premier stretch ceiling and custom lighting solutions provider. German & Estonian engineered products transforming interior spaces since 2024.",
    path: '/',
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <HeroSection />
      <PartnersMarquee />
      <AboutPreview />
      <ServicesShowcase />
      <StatsCounter />
      <PortfolioPreview />
      <ProcessSection />
      <TestimonialsSection />
      <CTASection />
    </motion.div>
  )
}

/* ============================================
   HERO SECTION - Immersive fullscreen hero
   Vision: A grand, cinematic hero with a ceiling installation as backdrop,
   floating geometric elements, and smooth parallax scrolling
   ============================================ */
function HeroSection() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, 150])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1])

  return (
    <section ref={ref} className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image with parallax */}
      {/* Vision: Luxury interior space with a stunning stretch ceiling, ambient LED lighting creating a warm glow, 
          modern living room or hotel lobby with premium furnishings */}
      <motion.div className="absolute inset-0" style={{ y, scale }}>
        <OptimizedImage
          src="https://images.unsplash.com/photo-1639663742190-1b3dba2eebcf?w=1920&q=80"
          alt="Luxury interior with modern ceiling design"
          className="w-full h-full object-cover"
          fill
          priority
          vision="Luxury modern living room with stunning ceiling and warm ambient lighting"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30" />
      </motion.div>

      {/* Floating decorative elements */}
      <div className="absolute top-32 right-20 w-72 h-72 rounded-full bg-lafoi-green/10 blur-[100px] animate-float pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-lafoi-green-light/10 blur-[80px] animate-float-delayed pointer-events-none" />

      {/* Geometric accents */}
      <motion.div
        className="absolute top-40 right-[15%] w-20 h-20 border border-white/10 rounded-2xl hidden lg:block"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute bottom-32 right-[25%] w-12 h-12 border border-lafoi-green/20 rounded-full hidden lg:block"
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Content */}
      <motion.div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 w-full pt-32 pb-20" style={{ opacity }}>
        <div className="max-w-3xl">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-2 h-2 rounded-full bg-lafoi-green animate-pulse" />
            <span className="text-xs font-sora text-white/80 font-medium tracking-wider uppercase">Zimbabwe's First Stretch Ceiling Provider</span>
          </motion.div>

          <motion.h1
            className="heading-xl text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-6"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            Redefining
            <br />
            <span className="relative">
              Ceilings
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <motion.path
                  d="M2 8C50 2 100 2 150 6C200 10 250 4 298 4"
                  stroke="#22C55E"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 1, duration: 1.2, ease: 'easeInOut' }}
                />
              </svg>
            </span>
            {' '}as Art
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-white/80 font-general max-w-lg mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            German-engineered stretch ceilings and bespoke lighting solutions that transform ordinary spaces into extraordinary experiences.
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Link
              to="/contact"
              className="group flex items-center gap-3 px-7 py-4 bg-lafoi-green text-white rounded-full font-sora text-sm font-semibold hover:bg-lafoi-green-light transition-all duration-300 shadow-lg shadow-lafoi-green/25"
            >
              Start Your Project
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/portfolio"
              className="group flex items-center gap-3 px-7 py-4 bg-white/10 backdrop-blur-md text-white rounded-full font-sora text-sm font-semibold border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              <Play size={16} className="group-hover:scale-110 transition-transform" />
              View Our Work
            </Link>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            className="flex flex-wrap gap-8 mt-16 pt-8 border-t border-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {[
              { value: '200+', label: 'Projects Completed' },
              { value: '100%', label: 'Client Satisfaction' },
              { value: '2', label: 'International Partners' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-sora text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/50 font-general mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-[10px] text-white/30 font-sora tracking-widest uppercase">Scroll</span>
        <div className="w-5 h-8 rounded-full border border-white/20 flex justify-center pt-1.5">
          <motion.div
            className="w-1 h-2 rounded-full bg-white/40"
            animate={{ y: [0, 8, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  )
}

/* ============================================
   PARTNERS MARQUEE - Scrolling trust badges
   ============================================ */
function PartnersMarquee() {
  const partners = ['German Precision', 'Estonian Innovation', 'ISO Certified', 'Premium Quality', 'Eco-Friendly', '10 Year Warranty', 'Fire Resistant', 'Moisture Proof']
  return (
    <div className="relative py-6 bg-lafoi-dark overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...partners, ...partners].map((p, i) => (
          <span key={i} className="mx-8 text-sm font-sora text-white/30 flex items-center gap-3">
            <Star size={10} className="text-lafoi-green" />
            {p}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ============================================
   ABOUT PREVIEW - Split layout with offset imagery
   Vision: Elegant split section - left side has text with accent details,
   right side shows overlapping images of ceiling installations
   ============================================ */
function AboutPreview() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 mesh-gradient-1" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-lafoi-green/[0.03] rounded-full blur-[100px]" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Images - Bento-style grid */}
          <AnimatedSection direction="left" className="relative">
            <div className="grid grid-cols-12 gap-4">
              {/* Vision: Stunning stretch ceiling installation with LED backlight in a modern room */}
              <div className="col-span-7 rounded-3xl overflow-hidden h-80">
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1638284457192-27d3d0ec51aa?w=800&q=80"
                  alt="Modern ceiling installation"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  fill
                  vision="Elegant living room with premium ceiling design and sophisticated furnishings"
                />
              </div>
              {/* Vision: Close-up of ceiling texture or lighting detail */}
              <div className="col-span-5 rounded-3xl overflow-hidden h-80">
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1767203330128-b4c27297f320?w=600&q=80"
                  alt="Modern ceiling lighting detail"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  fill
                  vision="Modern ceiling lights with blue and white artistic accents"
                />
              </div>
              {/* Vision: Team at work or installation process */}
              <div className="col-span-5 rounded-3xl overflow-hidden h-52">
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1742440710226-450e3b85c100?w=600&q=80"
                  alt="Design team collaboration"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  fill
                  vision="Designers collaborating in a warm architectural workspace"
                />
              </div>
              {/* Accent card */}
              <div className="col-span-7 rounded-3xl bg-lafoi-green p-8 flex flex-col justify-center h-52">
                <p className="text-white font-sora text-3xl font-bold">Since 2024</p>
                <p className="text-white/70 text-sm font-general mt-2">Zimbabwe's first and leading stretch ceiling provider</p>
              </div>
            </div>
            {/* Floating badge */}
            <motion.div
              className="absolute -top-4 -right-4 w-24 h-24 bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center z-10"
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Globe size={20} className="text-lafoi-green mb-1" />
              <span className="text-xs font-sora font-bold text-lafoi-dark">Global</span>
              <span className="text-[10px] text-lafoi-gray">Standards</span>
            </motion.div>
          </AnimatedSection>

          {/* Text content */}
          <AnimatedSection direction="right">
            <span className="text-lafoi-green font-sora text-sm font-semibold tracking-widest uppercase">About Us</span>
            <h2 className="heading-lg text-3xl sm:text-4xl lg:text-5xl text-lafoi-dark mt-4 mb-6">
              Crafting spaces that
              <span className="text-gradient"> inspire wonder</span>
            </h2>
            <p className="body-text text-base mb-6">
              Founded in January 2024, La Foi Designs is proud to be Zimbabwe's first provider of stretch ceilings, 
              dedicated to transforming interior spaces with elegance and style. We partnered with top-tier suppliers 
              from Germany and Estonia, ensuring our products meet the highest standards of quality and innovation.
            </p>
            <p className="body-text text-base mb-8">
              Our team underwent extensive training with these esteemed suppliers, equipping us with the expertise 
              needed to deliver exceptional craftsmanship and service. We are committed to bringing international 
              standards and cutting-edge design right to your doorstep.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: Award, label: 'German Quality' },
                { icon: Sparkles, label: 'Estonian Innovation' },
                { icon: Users, label: 'Expert Trained Team' },
                { icon: Globe, label: 'International Standards' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-lafoi-green-soft">
                  <div className="w-9 h-9 rounded-lg bg-lafoi-green/10 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-lafoi-green" />
                  </div>
                  <span className="text-sm font-medium text-lafoi-dark">{label}</span>
                </div>
              ))}
            </div>

            <Link
              to="/about"
              className="inline-flex items-center gap-2 font-sora text-sm font-semibold text-lafoi-green hover:text-lafoi-green-dark transition-colors group"
            >
              Learn our full story
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

/* ============================================
   SERVICES SHOWCASE - Asymmetric card layout
   Vision: Services displayed in an offset bento grid with hover animations
   ============================================ */
function ServicesShowcase() {
  const services = [
    {
      icon: Layers,
      title: 'Stretch Ceilings',
      desc: 'Premium PVC and fabric membrane systems in matte, gloss, satin, translucent, and printed finishes. Seamless installation with 10+ year warranty.',
      image: 'https://images.unsplash.com/photo-1638284457192-27d3d0ec51aa?w=800&q=80',
      vision: 'Elegant living room with premium stretch ceiling and sophisticated lighting',
      link: '/services/stretch-ceilings',
      color: 'from-lafoi-green/80 to-emerald-600/80',
    },
    {
      icon: Lightbulb,
      title: 'Custom Lighting',
      desc: 'Architectural LED systems, backlit ceilings, fiber optic starry skies, and programmable ambient lighting solutions designed for your space.',
      image: 'https://images.unsplash.com/photo-1767203330128-b4c27297f320?w=800&q=80',
      vision: 'Modern ceiling lights with artistic blue and white accents creating atmosphere',
      link: '/services/custom-lighting',
      color: 'from-amber-500/80 to-orange-600/80',
    },
    {
      icon: Printer,
      title: 'Printed Ceilings',
      desc: 'Transform your ceiling into a canvas with high-resolution printed designs -- from sky scenes and nature imagery to custom artwork and brand logos.',
      image: 'https://images.unsplash.com/photo-1648858308067-2fdba1ca32f2?w=800&q=80',
      vision: 'Beautiful sky with clouds, inspiration for printed ceiling designs',
      link: '/services/printed-ceilings',
      color: 'from-violet-500/80 to-purple-600/80',
    },
    {
      icon: Box,
      title: '3D Ceiling Forms',
      desc: 'Sculptural ceiling installations that add depth and dimension. Curves, waves, and geometric 3D forms that make your space truly one-of-a-kind.',
      image: 'https://images.unsplash.com/photo-1634146601607-9f319f71b5ee?w=800&q=80',
      vision: 'Dramatic architectural ceiling with skylight creating dynamic 3D forms',
      link: '/services/3d-ceilings',
      color: 'from-cyan-500/80 to-blue-600/80',
    },
    {
      icon: Volume2,
      title: 'Acoustic Solutions',
      desc: 'Micro-perforated stretch ceilings and acoustic panels that combine beauty with sound management for offices, studios, and hospitality venues.',
      image: 'https://images.unsplash.com/photo-1595513279524-fa90ad188c98?w=800&q=80',
      vision: 'Professional recording studio with acoustic ceiling treatment and panels',
      link: '/services/acoustic',
      color: 'from-teal-500/80 to-emerald-600/80',
    },
    {
      icon: Palette,
      title: 'Design Consulting',
      desc: 'End-to-end design consultation from concept to completion. Our trained experts help you choose the perfect ceiling and lighting combination.',
      image: 'https://images.unsplash.com/photo-1768270181430-3e3672a32283?w=800&q=80',
      vision: 'Modern lobby with marble floors and decorative ceiling design',
      link: '/services',
      color: 'from-rose-500/80 to-pink-600/80',
    },
  ]

  return (
    <section className="relative py-24 lg:py-32 bg-lafoi-dark overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30 grid-pattern" />
      <div className="absolute top-20 left-20 w-80 h-80 bg-lafoi-green/5 rounded-full blur-[100px]" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <AnimatedSection>
            <span className="text-lafoi-green font-sora text-sm font-semibold tracking-widest uppercase">Our Solutions</span>
            <h2 className="heading-lg text-3xl sm:text-4xl lg:text-5xl text-white mt-4 mb-5">
              Comprehensive ceiling &<br />lighting solutions
            </h2>
            <p className="text-white/40 font-general">
              From concept to completion, we offer a full spectrum of premium ceiling and lighting services tailored to your vision.
            </p>
          </AnimatedSection>
        </div>

        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" staggerDelay={0.08}>
          {services.map((service) => (
            <StaggerItem key={service.title}>
              <Link
                to={service.link}
                className="group relative block h-80 rounded-3xl overflow-hidden"
              >
                <OptimizedImage
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  fill
                  vision={service.vision}
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${service.color} via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity`} />
                
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                    <service.icon size={20} className="text-white" />
                  </div>
                  <h3 className="font-sora text-xl font-bold text-white mb-2">{service.title}</h3>
                  <p className="text-sm text-white/70 font-general line-clamp-2 group-hover:line-clamp-none transition-all">
                    {service.desc}
                  </p>
                  <div className="flex items-center gap-1 mt-3 text-white/80 text-sm font-sora font-medium opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                    Explore <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <AnimatedSection className="text-center mt-12">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white rounded-full font-sora text-sm font-medium hover:bg-white/10 transition-colors group"
          >
            View All Services
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ============================================
   STATS COUNTER - Animated number counter section
   ============================================ */
function StatsCounter() {
  const stats = [
    { number: '200+', label: 'Projects Delivered', suffix: '' },
    { number: '100%', label: 'Client Satisfaction', suffix: '' },
    { number: '2', label: 'International Partners', suffix: '' },
    { number: '10+', label: 'Year Warranty', suffix: '' },
  ]

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 dot-pattern" />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12" staggerDelay={0.1}>
          {stats.map((stat) => (
            <StaggerItem key={stat.label} className="text-center">
              <p className="font-sora text-4xl sm:text-5xl font-bold text-gradient">{stat.number}</p>
              <p className="text-sm text-lafoi-gray font-general mt-2">{stat.label}</p>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

/* ============================================
   PORTFOLIO PREVIEW - Masonry-style gallery
   Vision: A curated selection of best works in a dynamic masonry layout
   ============================================ */
function PortfolioPreview() {
  const projects = [
    { title: 'The Grand Ballroom', category: 'Commercial', image: 'https://images.unsplash.com/photo-1758194090785-8e09b7288199?w=800&q=80', tall: true, vision: 'Luxurious lobby with modern seating, gold accents, and dramatic ceiling lighting' },
    { title: 'Serene Residence', category: 'Residential', image: 'https://images.unsplash.com/photo-1639663742190-1b3dba2eebcf?w=800&q=80', vision: 'Modern luxury living room with ambient lighting and premium ceiling' },
    { title: 'Azure Pool Spa', category: 'Hospitality', image: 'https://images.unsplash.com/photo-1730367019975-4ad8d9e14ef2?w=800&q=80', vision: 'Indoor pool with stone walls and natural light' },
    { title: 'Corporate HQ', category: 'Office', image: 'https://images.unsplash.com/photo-1595513279524-fa90ad188c98?w=800&q=80', vision: 'Professional recording studio with acoustic ceiling panels' },
    { title: 'Starlit Bedroom', category: 'Residential', image: 'https://images.unsplash.com/photo-1765434670017-c0d28ecde29a?w=800&q=80', tall: true, vision: 'Modern bedroom with large bed and warm ambient lighting' },
    { title: 'Modern Showroom', category: 'Retail', image: 'https://images.unsplash.com/photo-1768270181430-3e3672a32283?w=800&q=80', vision: 'Modern lobby with marble floors and decorative ceiling design' },
  ]

  return (
    <section className="relative py-24 lg:py-32 bg-lafoi-cream overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-14">
          <AnimatedSection>
            <span className="text-lafoi-green font-sora text-sm font-semibold tracking-widest uppercase">Our Work</span>
            <h2 className="heading-lg text-3xl sm:text-4xl lg:text-5xl text-lafoi-dark mt-4">
              Spaces we've<br />
              <span className="text-gradient">transformed</span>
            </h2>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 px-6 py-3 bg-lafoi-dark text-white rounded-full font-sora text-sm font-medium hover:bg-lafoi-green transition-colors group"
            >
              View All Projects
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </AnimatedSection>
        </div>

        <StaggerContainer className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5" staggerDelay={0.08}>
          {projects.map((project, i) => (
            <StaggerItem key={project.title}>
              <Link to="/portfolio" className="group block rounded-3xl overflow-hidden relative break-inside-avoid">
                <div className={project.tall ? 'h-96' : 'h-72'}>
                  <OptimizedImage
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    fill
                    vision={project.vision}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <p className="text-xs font-sora text-lafoi-green-light font-medium uppercase tracking-wider">{project.category}</p>
                  <h3 className="font-sora text-lg font-bold text-white mt-1">{project.title}</h3>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

/* ============================================
   PROCESS SECTION - Horizontal scrolling steps
   ============================================ */
function ProcessSection() {
  const steps = [
    { num: '01', title: 'Consultation', desc: 'We meet to understand your vision, assess the space, and discuss design possibilities tailored to your needs.' },
    { num: '02', title: 'Design & Plan', desc: 'Our team creates detailed designs with material selections, lighting plans, and precise measurements.' },
    { num: '03', title: 'Manufacturing', desc: 'Your custom ceiling is manufactured to exact specifications using premium German and Estonian materials.' },
    { num: '04', title: 'Installation', desc: 'Our trained technicians install your ceiling with precision and care, typically completing within a day.' },
  ]

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 mesh-gradient-hero" />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-lafoi-green font-sora text-sm font-semibold tracking-widest uppercase">Our Process</span>
          <h2 className="heading-lg text-3xl sm:text-4xl lg:text-5xl text-lafoi-dark mt-4 mb-5">
            From vision to<br /><span className="text-gradient">reality, simplified</span>
          </h2>
          <p className="text-lafoi-gray font-general">
            A seamless four-step journey from initial consultation to the stunning reveal.
          </p>
        </AnimatedSection>

        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.1}>
          {steps.map((step, i) => (
            <StaggerItem key={step.num}>
              <div className="relative p-8 rounded-3xl bg-white border border-gray-100 hover:shadow-xl hover:shadow-lafoi-green/5 transition-all duration-500 group h-full">
                <div className="absolute top-8 right-8 font-sora text-6xl font-bold text-lafoi-green/5 group-hover:text-lafoi-green/10 transition-colors">
                  {step.num}
                </div>
                <div className="w-12 h-12 rounded-2xl bg-lafoi-green/10 flex items-center justify-center mb-6 group-hover:bg-lafoi-green group-hover:text-white transition-all duration-300">
                  <span className="font-sora text-sm font-bold text-lafoi-green group-hover:text-white">{step.num}</span>
                </div>
                <h3 className="font-sora text-lg font-bold text-lafoi-dark mb-3">{step.title}</h3>
                <p className="text-sm text-lafoi-gray font-general leading-relaxed">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-[2px] bg-lafoi-green/20" />
                )}
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

/* ============================================
   TESTIMONIALS - Card carousel
   ============================================ */
function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Tatenda M.',
      role: 'Homeowner, Borrowdale',
      text: 'La Foi Designs completely transformed our living room. The stretch ceiling with integrated LED lighting created an atmosphere we never thought possible. Their attention to detail is remarkable.',
      rating: 5,
    },
    {
      name: 'Sarah K.',
      role: 'Interior Designer',
      text: 'As a designer, I recommend La Foi to all my clients. Their printed ceiling for a spa project was breathtaking — a cloud sky that made the entire space feel infinite. World-class quality right here in Harare.',
      rating: 5,
    },
    {
      name: 'Michael C.',
      role: 'Hotel Manager, Harare',
      text: 'The 3D ceiling installations in our hotel lobby have become a talking point for every guest. The team was professional, efficient, and the result exceeded our expectations tenfold.',
      rating: 5,
    },
  ]

  return (
    <section className="relative py-24 lg:py-32 bg-lafoi-dark overflow-hidden">
      <div className="absolute inset-0 opacity-30 grid-pattern" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-lafoi-green/5 rounded-full blur-[120px]" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-lafoi-green font-sora text-sm font-semibold tracking-widest uppercase">Testimonials</span>
          <h2 className="heading-lg text-3xl sm:text-4xl lg:text-5xl text-white mt-4">
            What our clients
            <span className="text-gradient"> say about us</span>
          </h2>
        </AnimatedSection>

        <StaggerContainer className="grid md:grid-cols-3 gap-6" staggerDelay={0.1}>
          {testimonials.map((t, i) => (
            <StaggerItem key={i}>
              <div className="h-full p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                <Quote size={28} className="text-lafoi-green/30 mb-4" />
                <p className="text-white/70 font-general text-sm leading-relaxed mb-6">{t.text}</p>
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={14} className="text-lafoi-green fill-lafoi-green" />
                  ))}
                </div>
                <div>
                  <p className="font-sora text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-white/40 font-general">{t.role}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

/* ============================================
   CTA SECTION - Full-width call to action
   Vision: Dramatic CTA with background image of stunning ceiling installation
   ============================================ */
function CTASection() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Vision: Overhead shot of a stunning stretch ceiling with dramatic lighting, looking up */}
      <div className="absolute inset-0">
        <OptimizedImage
          src="https://images.unsplash.com/photo-1758194090785-8e09b7288199?w=1920&q=80"
          alt="Luxurious interior with dramatic ceiling design"
          className="w-full h-full object-cover"
          fill
          vision="High-end lobby with modern design, dramatic lighting, and elegant ceiling"
        />
        <div className="absolute inset-0 bg-lafoi-dark/85 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <AnimatedSection>
          <motion.div
            className="w-16 h-16 rounded-2xl bg-lafoi-green/20 flex items-center justify-center mx-auto mb-8"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles size={28} className="text-lafoi-green" />
          </motion.div>
          <h2 className="heading-lg text-3xl sm:text-4xl lg:text-5xl text-white mb-6">
            Ready to transform<br />your space?
          </h2>
          <p className="text-white/50 font-general text-lg mb-10 max-w-lg mx-auto">
            Let's create something extraordinary together. Book a free consultation and discover the possibilities.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/contact"
              className="group flex items-center gap-3 px-8 py-4 bg-lafoi-green text-white rounded-full font-sora text-sm font-semibold hover:bg-lafoi-green-light transition-all duration-300 shadow-lg shadow-lafoi-green/25"
            >
              Book Free Consultation
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="tel:+263712326951"
              className="flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-full font-sora text-sm font-semibold border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              Call +263 712 326 951
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
