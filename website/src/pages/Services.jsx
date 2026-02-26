import React from 'react';
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Check, Layers, Lightbulb, Printer, Box, Volume2, Palette, ChevronRight, Sparkles, Star, ArrowUpRight } from 'lucide-react'
import AnimatedSection, { StaggerContainer, StaggerItem } from '../components/ui/AnimatedSection'
import OptimizedImage from '../components/ui/OptimizedImage'
import { useSEO } from '../utils/seo'

const allServices = [
  {
    slug: 'stretch-ceilings',
    icon: Layers,
    title: 'Stretch Ceilings',
    subtitle: 'Premium Membrane Systems',
    hero: 'https://images.unsplash.com/photo-1638284457192-27d3d0ec51aa?w=1920&q=80',
    heroVision: 'Elegant living room with premium stretch ceiling and warm lighting',
    desc: 'Our stretch ceilings are manufactured from premium PVC and fabric membranes sourced from Germany and Estonia. Available in over 200 colors and multiple finishes, they transform any space into a masterpiece.',
    features: ['Matte, Gloss & Satin finishes', 'Over 200 color options', 'Translucent & Backlit options', 'Moisture & mildew resistant', 'Fire-rated (Class B-s1, d0)', 'Quick installation (usually 1 day)', '10-year manufacturer warranty', 'Eco-friendly & recyclable'],
    applications: ['Living rooms & bedrooms', 'Bathrooms & kitchens', 'Hotels & restaurants', 'Office spaces', 'Medical facilities', 'Retail showrooms'],
    image: 'https://images.unsplash.com/photo-1638284457192-27d3d0ec51aa?w=800&q=80',
    imageVision: 'Modern home interior with smooth stretch ceiling and integrated lighting',
    color: 'from-lafoi-green to-emerald-600',
    bgAccent: 'bg-lafoi-green/10',
  },
  {
    slug: 'custom-lighting',
    icon: Lightbulb,
    title: 'Custom Lighting',
    subtitle: 'Architectural Illumination',
    hero: 'https://images.unsplash.com/photo-1767203330128-b4c27297f320?w=1920&q=80',
    heroVision: 'Modern ceiling lights with artistic blue and white accents',
    desc: 'From fiber optic starry skies to programmable LED arrays, our lighting solutions create atmosphere and ambiance that elevate any interior to new heights.',
    features: ['LED strip integration', 'Fiber optic starry sky effects', 'Backlit ceiling panels', 'Color-changing RGB systems', 'Smart home integration', 'Energy-efficient solutions', 'Dimmable controls', 'Custom light patterns'],
    applications: ['Master bedrooms', 'Home cinemas', 'Spa & wellness centers', 'Restaurant ambiance', 'Nightclub & lounge design', 'Children\'s rooms'],
    image: 'https://images.unsplash.com/photo-1767203330128-b4c27297f320?w=800&q=80',
    imageVision: 'Room with LED integrated ceiling creating atmospheric lighting',
    color: 'from-amber-500 to-orange-600',
    bgAccent: 'bg-amber-500/10',
  },
  {
    slug: 'printed-ceilings',
    icon: Printer,
    title: 'Printed Ceilings',
    subtitle: 'Custom Visual Expressions',
    hero: 'https://images.unsplash.com/photo-1648858308067-2fdba1ca32f2?w=1920&q=80',
    heroVision: 'Beautiful sky with clouds, inspiration for printed ceiling designs',
    desc: 'Transform your ceiling into a canvas with high-resolution UV-printed designs. From photorealistic sky scenes to custom artwork and brand logos, the possibilities are limitless.',
    features: ['UV-resistant HD printing', 'Custom artwork & photos', 'Brand logo integration', 'Nature scenes & sky effects', 'Geometric patterns', 'Washable & durable', 'Seamless large format', 'Color-accurate reproduction'],
    applications: ['Swimming pools & spas', 'Children\'s rooms & nurseries', 'Themed restaurants', 'Corporate branding', 'Retail environments', 'Medical & dental clinics'],
    image: 'https://images.unsplash.com/photo-1648858308067-2fdba1ca32f2?w=800&q=80',
    imageVision: 'Sky with clouds creating beautiful natural patterns',
    color: 'from-violet-500 to-purple-600',
    bgAccent: 'bg-violet-500/10',
  },
  {
    slug: '3d-ceilings',
    icon: Box,
    title: '3D Ceiling Forms',
    subtitle: 'Sculptural Architecture',
    hero: 'https://images.unsplash.com/photo-1634146601607-9f319f71b5ee?w=1920&q=80',
    heroVision: 'Large modern building with dramatic architectural ceiling with skylight',
    desc: 'Push the boundaries of interior design with three-dimensional ceiling installations. Waves, cones, domes, and custom organic forms that make spaces unforgettable.',
    features: ['Wave & curve forms', 'Cone & dome shapes', 'Custom organic designs', 'Multi-level installations', 'Integrated lighting options', 'Lightweight construction', 'Architectural focal points', 'Unlimited shape possibilities'],
    applications: ['Hotel lobbies', 'Corporate reception areas', 'Event venues', 'Exhibition spaces', 'Luxury residences', 'Architectural features'],
    image: 'https://images.unsplash.com/photo-1634146601607-9f319f71b5ee?w=800&q=80',
    imageVision: 'Dramatic architectural ceiling with skylight creating dynamic forms',
    color: 'from-cyan-500 to-blue-600',
    bgAccent: 'bg-cyan-500/10',
  },
  {
    slug: 'acoustic',
    icon: Volume2,
    title: 'Acoustic Solutions',
    subtitle: 'Sound Management',
    hero: 'https://images.unsplash.com/photo-1595513279524-fa90ad188c98?w=1920&q=80',
    heroVision: 'Professional recording studio with acoustic treatment',
    desc: 'Micro-perforated stretch ceilings that combine visual elegance with superior sound absorption. Perfect for spaces where both aesthetics and acoustics matter.',
    features: ['Micro-perforated membranes', 'NRC up to 0.90', 'Hidden acoustic backing', 'Seamless appearance', 'All finishes available', 'Sound level reduction', 'Echo elimination', 'Meets acoustic standards'],
    applications: ['Recording studios', 'Conference rooms', 'Open-plan offices', 'Restaurants & cafes', 'Cinemas & theatres', 'Educational facilities'],
    image: 'https://images.unsplash.com/photo-1595513279524-fa90ad188c98?w=800&q=80',
    imageVision: 'Professional recording studio with acoustic treatment panels',
    color: 'from-teal-500 to-emerald-600',
    bgAccent: 'bg-teal-500/10',
  },
  {
    slug: 'consulting',
    icon: Palette,
    title: 'Design Consulting',
    subtitle: 'Vision to Reality',
    hero: 'https://images.unsplash.com/photo-1768270181430-3e3672a32283?w=1920&q=80',
    heroVision: 'Modern lobby with marble floors and decorative ceiling design',
    desc: 'Our trained design consultants guide you through every step -- from material selection and color matching to lighting design and 3D visualization of your finished space.',
    features: ['Free initial consultation', 'Site assessment', '3D visualization', 'Material sampling', 'Color matching', 'Lighting design', 'Budget planning', 'Project management'],
    applications: ['New builds', 'Renovations', 'Commercial fit-outs', 'Interior redesigns', 'Event installations', 'Architectural projects'],
    image: 'https://images.unsplash.com/photo-1768270181430-3e3672a32283?w=800&q=80',
    imageVision: 'Modern lobby with marble floors and beautiful decorative ceiling',
    color: 'from-rose-500 to-pink-600',
    bgAccent: 'bg-rose-500/10',
  },
]

export default function Services() {
  const { serviceSlug } = useParams()
  const [activeService, setActiveService] = useState(
    serviceSlug ? allServices.find(s => s.slug === serviceSlug) || allServices[0] : null
  )

  useSEO({
    title: activeService ? activeService.title : 'Our Services',
    description: activeService
      ? activeService.desc
      : 'Explore La Foi Designs\' comprehensive ceiling and lighting solutions -- stretch ceilings, custom lighting, printed ceilings, 3D forms, and acoustic solutions.',
    path: activeService ? `/services/${activeService.slug}` : '/services',
  })

  if (activeService) return <ServiceDetail service={activeService} />

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ServicesHero />
      <ServicesGrid />
      <ProcessOverview />
      <WhyChooseUs />
      <ServicesCTA />
    </motion.div>
  )
}

function ServicesHero() {
  return (
    <section className="relative min-h-[65vh] flex items-center bg-lafoi-dark overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute top-20 right-20 w-96 h-96 bg-lafoi-green/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-lafoi-green/5 rounded-full blur-[100px]" />

      {/* Decorative geometric elements */}
      <motion.div
        className="absolute top-40 right-[15%] w-20 h-20 border border-white/5 rounded-2xl hidden lg:block"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute bottom-32 right-[25%] w-12 h-12 border border-lafoi-green/10 rounded-full hidden lg:block"
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 w-full pt-32 pb-20">
        <motion.div
          className="max-w-3xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-2 h-2 rounded-full bg-lafoi-green animate-pulse" />
            <span className="text-xs font-sora text-white/70 font-medium tracking-wider uppercase">Our Solutions</span>
          </motion.div>

          <h1 className="heading-xl text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white mt-4 mb-6">
            Ceiling & lighting
            <br />
            <span className="text-gradient">solutions catalog</span>
          </h1>
          <p className="text-white/60 font-general text-lg max-w-xl leading-relaxed">
            From premium stretch ceilings to bespoke lighting design, discover the full range of services that make La Foi Designs Zimbabwe's leading interior ceiling provider.
          </p>

          {/* Quick service pills */}
          <motion.div
            className="flex flex-wrap gap-3 mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {allServices.map((s) => (
              <Link
                key={s.slug}
                to={`/services/${s.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-sora font-medium hover:bg-lafoi-green/20 hover:border-lafoi-green/30 hover:text-white transition-all duration-300"
              >
                <s.icon size={12} />
                {s.title}
              </Link>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function ServicesGrid() {
  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-lafoi-green font-sora text-sm font-semibold tracking-widest uppercase">What We Offer</span>
          <h2 className="heading-lg text-3xl sm:text-4xl text-lafoi-dark mt-4 mb-5">
            Comprehensive solutions for <span className="text-gradient">every space</span>
          </h2>
          <p className="text-lafoi-gray font-general">
            Each service is backed by German and Estonian engineering, installed by certified professionals, and protected by comprehensive warranties.
          </p>
        </AnimatedSection>

        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.08}>
          {allServices.map((service) => (
            <StaggerItem key={service.slug}>
              <Link
                to={`/services/${service.slug}`}
                className="group block h-full rounded-3xl overflow-hidden border border-gray-100 bg-white hover:shadow-2xl hover:shadow-black/[0.06] transition-all duration-500"
              >
                <div className="relative h-56 overflow-hidden">
                  <OptimizedImage
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    fill
                    vision={service.imageVision}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                  <div className={`absolute top-4 left-4 w-11 h-11 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center shadow-lg`}>
                    <service.icon size={18} className="text-white" />
                  </div>
                  {/* Hover arrow */}
                  <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-white/20 backdrop-blur-sm transition-all duration-300">
                    <ArrowUpRight size={16} className="text-white" />
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-xs text-lafoi-green font-sora font-semibold uppercase tracking-wider mb-2">{service.subtitle}</p>
                  <h3 className="font-sora text-xl font-bold text-lafoi-dark mb-3 group-hover:text-lafoi-green transition-colors duration-300">{service.title}</h3>
                  <p className="text-sm text-lafoi-gray font-general line-clamp-3 mb-5 leading-relaxed">{service.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-sora font-semibold text-lafoi-green group-hover:gap-2.5 transition-all duration-300">
                    Learn More <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

function ProcessOverview() {
  const steps = [
    { num: '01', title: 'Free Consultation', desc: 'We assess your space and discuss design possibilities.' },
    { num: '02', title: 'Custom Design', desc: 'We create detailed plans with material and lighting selections.' },
    { num: '03', title: 'Manufacturing', desc: 'Your ceiling is custom-made using premium European materials.' },
    { num: '04', title: 'Installation', desc: 'Expert installation, typically completed in just one day.' },
  ]

  return (
    <section className="py-20 lg:py-28 bg-lafoi-dark relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="heading-lg text-2xl sm:text-3xl text-white">
            Our simple <span className="text-gradient">4-step process</span>
          </h2>
        </AnimatedSection>

        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.1}>
          {steps.map((step, i) => (
            <StaggerItem key={step.num}>
              <div className="relative p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all duration-300 group h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-lafoi-green/20 flex items-center justify-center group-hover:bg-lafoi-green transition-colors duration-300">
                    <span className="font-sora text-sm font-bold text-lafoi-green group-hover:text-white transition-colors">{step.num}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block flex-1 h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
                  )}
                </div>
                <h3 className="font-sora text-base font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-white/40 font-general leading-relaxed">{step.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

function WhyChooseUs() {
  const reasons = [
    { title: 'First in Zimbabwe', desc: 'We pioneered stretch ceilings in Zimbabwe, bringing technology never before seen in the country.', icon: Star },
    { title: 'International Quality', desc: 'German and Estonian manufactured materials meet the highest European quality and safety standards.', icon: Sparkles },
    { title: 'Expert Installation', desc: 'Our team trained directly with European manufacturers for flawless, fast installations.', icon: Check },
    { title: 'Full Warranty', desc: 'Every installation is backed by comprehensive manufacturer warranties of 10+ years.', icon: Sparkles },
  ]

  return (
    <section className="py-24 lg:py-32 bg-lafoi-green-soft relative overflow-hidden">
      <div className="absolute inset-0 mesh-gradient-1" />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-lafoi-green font-sora text-sm font-semibold tracking-widest uppercase">Why Us</span>
          <h2 className="heading-lg text-3xl sm:text-4xl text-lafoi-dark mt-4">Why choose <span className="text-gradient">La Foi Designs?</span></h2>
        </AnimatedSection>
        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.1}>
          {reasons.map((r) => (
            <StaggerItem key={r.title}>
              <div className="p-6 rounded-2xl bg-white border border-gray-100 h-full hover:shadow-xl hover:shadow-lafoi-green/[0.05] transition-all duration-500 group">
                <div className="w-11 h-11 rounded-xl bg-lafoi-green/10 flex items-center justify-center mb-4 group-hover:bg-lafoi-green transition-colors duration-300">
                  <r.icon size={18} className="text-lafoi-green group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-sora text-base font-bold text-lafoi-dark mb-2">{r.title}</h3>
                <p className="text-sm text-lafoi-gray font-general leading-relaxed">{r.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

function ServicesCTA() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0">
        <OptimizedImage
          src="https://images.unsplash.com/photo-1758194090785-8e09b7288199?w=1920&q=80"
          alt="Luxury interior"
          className="w-full h-full object-cover"
          fill
          vision="Luxurious hotel lobby with dramatic lighting and gold accents"
        />
        <div className="absolute inset-0 bg-lafoi-dark/85 backdrop-blur-sm" />
      </div>
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <AnimatedSection>
          <h2 className="heading-lg text-3xl sm:text-4xl lg:text-5xl text-white mb-6">
            Not sure which solution<br />is right for you?
          </h2>
          <p className="text-white/50 font-general text-lg mb-10 max-w-lg mx-auto">
            Book a free consultation and our design experts will help you choose the perfect ceiling and lighting combination for your space.
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

function ServiceDetail({ service }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero */}
      <section className="relative min-h-[65vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <OptimizedImage
            src={service.hero}
            alt={service.title}
            className="w-full h-full object-cover"
            fill
            priority
            vision={service.heroVision}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30" />
        </div>
        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 w-full pb-16 pt-40">
          <Link to="/services" className="inline-flex items-center gap-1.5 text-white/60 text-sm font-general mb-6 hover:text-white transition-colors group">
            <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
            Back to Services
          </Link>
          <div className="flex items-center gap-5 mb-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center shadow-xl`}>
              <service.icon size={28} className="text-white" />
            </div>
            <div>
              <p className="text-lafoi-green text-xs font-sora font-semibold uppercase tracking-wider mb-1">{service.subtitle}</p>
              <h1 className="heading-xl text-3xl sm:text-4xl lg:text-5xl text-white">{service.title}</h1>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <AnimatedSection>
                <p className="body-text text-lg mb-10 leading-relaxed">{service.desc}</p>
              </AnimatedSection>
              <AnimatedSection delay={0.1}>
                <h3 className="font-sora text-xl font-bold text-lafoi-dark mb-6">Features & Benefits</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {service.features.map((f) => (
                    <div key={f} className="flex items-center gap-3 p-3.5 rounded-xl bg-lafoi-green-soft border border-lafoi-green/[0.06] hover:border-lafoi-green/20 transition-colors">
                      <div className="w-6 h-6 rounded-lg bg-lafoi-green/10 flex items-center justify-center shrink-0">
                        <Check size={14} className="text-lafoi-green" />
                      </div>
                      <span className="text-sm text-lafoi-dark font-medium">{f}</span>
                    </div>
                  ))}
                </div>
              </AnimatedSection>

              {/* Related services */}
              <AnimatedSection delay={0.2} className="mt-12">
                <h3 className="font-sora text-lg font-bold text-lafoi-dark mb-4">Explore Other Services</h3>
                <div className="flex flex-wrap gap-3">
                  {allServices.filter(s => s.slug !== service.slug).slice(0, 3).map((s) => (
                    <Link
                      key={s.slug}
                      to={`/services/${s.slug}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm font-sora font-medium text-lafoi-dark hover:bg-lafoi-green/5 hover:border-lafoi-green/20 hover:text-lafoi-green transition-all duration-300"
                    >
                      <s.icon size={14} />
                      {s.title}
                    </Link>
                  ))}
                </div>
              </AnimatedSection>
            </div>

            {/* Sidebar */}
            <div>
              <AnimatedSection direction="right">
                <div className="sticky top-28 space-y-6">
                  <div className="p-6 rounded-3xl bg-lafoi-green-soft border border-lafoi-green/10">
                    <h3 className="font-sora text-lg font-bold text-lafoi-dark mb-5">Ideal For</h3>
                    <div className="space-y-3 mb-6">
                      {service.applications.map((a) => (
                        <div key={a} className="flex items-center gap-2.5">
                          <ChevronRight size={14} className="text-lafoi-green" />
                          <span className="text-sm text-lafoi-gray font-general">{a}</span>
                        </div>
                      ))}
                    </div>
                    <Link
                      to="/contact"
                      className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-lafoi-green text-white rounded-full font-sora text-sm font-semibold hover:bg-lafoi-green-light transition-colors shadow-lg shadow-lafoi-green/20 group"
                    >
                      Get a Free Quote
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>

                  {/* Trust signals */}
                  <div className="p-5 rounded-2xl bg-white border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex -space-x-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} size={14} className="text-lafoi-green fill-lafoi-green" />
                        ))}
                      </div>
                      <span className="text-xs text-lafoi-gray font-general">100% Satisfaction</span>
                    </div>
                    <p className="text-xs text-lafoi-gray-medium font-general leading-relaxed">
                      Backed by 10-year manufacturer warranty. German and Estonian quality standards.
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  )
}
