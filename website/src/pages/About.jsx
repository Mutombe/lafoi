import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Award, Globe, Heart, Shield, Target, Users, Zap, CheckCircle2, Sparkles, Star } from 'lucide-react'
import AnimatedSection, { StaggerContainer, StaggerItem } from '../components/ui/AnimatedSection'
import OptimizedImage from '../components/ui/OptimizedImage'
import { useSEO } from '../utils/seo'

export default function About() {
  useSEO({
    title: 'Our Story',
    description: "Learn about La Foi Designs — Zimbabwe's first stretch ceiling provider. Our journey, values, and commitment to excellence.",
    path: '/about',
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <AboutHero />
      <MissionStatement />
      <StoryTimeline />
      <ValuesSection />
      <PartnersSection />
      <TeamSection />
      <AboutCTA />
    </motion.div>
  )
}

function AboutHero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, 80])
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <section ref={ref} className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* Background image with parallax */}
      <motion.div className="absolute inset-0" style={{ y }}>
        <OptimizedImage
          src="https://images.unsplash.com/photo-1639663742190-1b3dba2eebcf?w=1920&q=80"
          alt="Luxury interior with modern design"
          className="w-full h-full object-cover"
          fill
          priority
          vision="Luxury modern living room with elegant furnishings and ambient lighting"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20" />
      </motion.div>

      {/* Decorative elements */}
      <div className="absolute top-32 right-20 w-72 h-72 rounded-full bg-lafoi-green/10 blur-[100px] animate-float pointer-events-none" />

      <motion.div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 w-full pt-32 pb-20" style={{ opacity }}>
        <motion.div
          className="max-w-3xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-2 h-2 rounded-full bg-lafoi-green animate-pulse" />
            <span className="text-xs font-sora text-white/80 font-medium tracking-wider uppercase">Our Story</span>
          </motion.div>

          <h1 className="heading-xl text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-white mb-6">
            Born from passion,
            <br />
            <span className="text-gradient">built on excellence</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/75 font-general max-w-xl leading-relaxed">
            From our founding in January 2024 to becoming Zimbabwe's premier stretch ceiling provider, every step has been driven by a vision to elevate interior design in Africa.
          </p>

          {/* Quick stats */}
          <motion.div
            className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {[
              { value: 'Since 2024', label: 'Founded' },
              { value: '200+', label: 'Projects Completed' },
              { value: '2', label: 'International Partners' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-sora text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/40 font-general mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}

function MissionStatement() {
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      <div className="absolute inset-0 mesh-gradient-1" />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <AnimatedSection className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-lafoi-green/10 flex items-center justify-center mx-auto mb-8">
            <Sparkles size={28} className="text-lafoi-green" />
          </div>
          <h2 className="heading-lg text-2xl sm:text-3xl lg:text-4xl text-lafoi-dark mb-6">
            Our mission is to bring <span className="text-gradient">world-class ceiling technology</span> to every space in Zimbabwe
          </h2>
          <p className="body-text text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            We believe every room deserves to be extraordinary. By partnering with the finest European manufacturers and investing deeply in our team's expertise, we deliver ceiling solutions that transform ordinary spaces into experiences.
          </p>
        </AnimatedSection>
      </div>
    </section>
  )
}

function StoryTimeline() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden bg-lafoi-cream">
      <div className="absolute inset-0 dot-pattern opacity-30" />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-lafoi-green font-sora text-sm font-semibold tracking-widest uppercase">Our Journey</span>
          <h2 className="heading-lg text-3xl sm:text-4xl text-lafoi-dark mt-4">
            A journey of <span className="text-gradient">firsts</span>
          </h2>
        </AnimatedSection>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <AnimatedSection>
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/10">
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1638284457192-27d3d0ec51aa?w=800&q=80"
                  alt="Modern interior with elegant ceiling design"
                  className="w-full h-[500px] object-cover"
                  fill
                  vision="Elegant living room showcasing premium interior finishes and lighting"
                />
              </div>
              <motion.div
                className="absolute -bottom-6 -right-6 w-44 h-44 rounded-2xl overflow-hidden border-4 border-white shadow-xl"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1742440710226-450e3b85c100?w=400&q=80"
                  alt="Design team collaboration"
                  className="w-full h-full object-cover"
                  fill
                  vision="Designers collaborating in a warm wooden architectural space"
                />
              </motion.div>
              {/* Floating badge */}
              <motion.div
                className="absolute -top-4 -left-4 w-24 h-24 bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center z-10"
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Globe size={20} className="text-lafoi-green mb-1" />
                <span className="text-xs font-sora font-bold text-lafoi-dark">Global</span>
                <span className="text-[10px] text-lafoi-gray">Standards</span>
              </motion.div>
            </div>
          </AnimatedSection>

          <AnimatedSection direction="right">
            <div className="space-y-8">
              {[
                {
                  year: 'January 2024',
                  title: 'The Beginning',
                  desc: 'La Foi Designs was founded with a bold mission: to bring world-class stretch ceiling technology to Zimbabwe for the very first time.',
                  highlight: true,
                },
                {
                  year: 'Q1 2024',
                  title: 'International Partnerships',
                  desc: 'We partnered with top-tier suppliers from Germany and Estonia, gaining access to the highest quality materials and most advanced ceiling technologies in the world.',
                },
                {
                  year: 'Q2 2024',
                  title: 'Expert Training',
                  desc: 'Our team underwent intensive hands-on training with our European partners, mastering installation techniques, design principles, and quality standards.',
                },
                {
                  year: '2024 — Present',
                  title: 'Transforming Zimbabwe',
                  desc: 'With over 200 projects completed, we\'ve become the trusted name in stretch ceilings across residential, commercial, and hospitality sectors.',
                  highlight: true,
                },
              ].map((item, i) => (
                <div key={i} className={`relative pl-8 border-l-2 ${item.highlight ? 'border-lafoi-green' : 'border-lafoi-green/20'}`}>
                  <div className={`absolute left-0 top-0 w-3.5 h-3.5 rounded-full -translate-x-[9px] ${item.highlight ? 'bg-lafoi-green shadow-lg shadow-lafoi-green/30' : 'bg-lafoi-green/40'}`} />
                  <p className="text-xs font-sora text-lafoi-green font-semibold tracking-wider uppercase">{item.year}</p>
                  <h3 className="font-sora text-lg font-bold text-lafoi-dark mt-1 mb-2">{item.title}</h3>
                  <p className="text-sm text-lafoi-gray font-general leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

function ValuesSection() {
  const values = [
    { icon: Award, title: 'Excellence', desc: 'Every project meets international standards backed by our German and Estonian partners.', color: 'from-emerald-500 to-green-600' },
    { icon: Heart, title: 'Passion', desc: 'We are driven by a genuine love for transforming spaces and exceeding expectations.', color: 'from-rose-500 to-pink-600' },
    { icon: Shield, title: 'Integrity', desc: 'Transparent pricing, honest timelines, and unwavering commitment to quality.', color: 'from-blue-500 to-indigo-600' },
    { icon: Zap, title: 'Innovation', desc: 'Constantly adopting the latest technologies and design techniques from around the world.', color: 'from-amber-500 to-orange-600' },
    { icon: Users, title: 'Collaboration', desc: 'We work closely with clients, designers, and architects to bring visions to life.', color: 'from-violet-500 to-purple-600' },
    { icon: Target, title: 'Precision', desc: 'Every measurement, cut, and installation is executed with meticulous attention to detail.', color: 'from-teal-500 to-cyan-600' },
  ]

  return (
    <section className="py-24 lg:py-32 bg-lafoi-dark relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-20 right-20 w-96 h-96 bg-lafoi-green/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-lafoi-green/5 rounded-full blur-[100px]" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-lafoi-green font-sora text-sm font-semibold tracking-widest uppercase">Our Values</span>
          <h2 className="heading-lg text-3xl sm:text-4xl text-white mt-4 mb-5">
            The principles that <span className="text-gradient">guide everything</span> we do
          </h2>
          <p className="text-white/40 font-general">
            More than just a company, we are a team united by shared values that inform every decision and every project.
          </p>
        </AnimatedSection>

        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.08}>
          {values.map((v) => (
            <StaggerItem key={v.title}>
              <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-500 h-full group">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${v.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <v.icon size={22} className="text-white" />
                </div>
                <h3 className="font-sora text-lg font-bold text-white mb-3">{v.title}</h3>
                <p className="text-sm text-white/50 font-general leading-relaxed">{v.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

function PartnersSection() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 mesh-gradient-1" />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-lafoi-green font-sora text-sm font-semibold tracking-widest uppercase">Our Partners</span>
          <h2 className="heading-lg text-3xl sm:text-4xl text-lafoi-dark mt-4 mb-5">
            Backed by <span className="text-gradient">world leaders</span> in ceiling technology
          </h2>
          <p className="text-lafoi-gray font-general">
            Our partnerships with Germany and Estonia's finest manufacturers ensure every product we deliver meets the highest international standards.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 gap-8">
          {[
            {
              country: 'Germany',
              flag: '\u{1F1E9}\u{1F1EA}',
              title: 'German Engineering',
              desc: 'Precision-manufactured PVC and fabric membranes meeting strict EU quality and fire safety standards. Our German partners bring decades of stretch ceiling expertise.',
              features: ['Fire-rated materials', 'UV-resistant finishes', 'Eco-friendly production', '15-year warranty backing'],
              accent: 'border-l-4 border-l-lafoi-green',
            },
            {
              country: 'Estonia',
              flag: '\u{1F1EA}\u{1F1EA}',
              title: 'Estonian Innovation',
              desc: 'Cutting-edge printing technology and LED integration systems from one of Europe\'s most innovative ceiling technology companies.',
              features: ['HD printing capability', 'Smart LED systems', 'Acoustic solutions', 'Custom manufacturing'],
              accent: 'border-l-4 border-l-lafoi-green-light',
            },
          ].map((partner) => (
            <AnimatedSection key={partner.country}>
              <div className={`p-8 lg:p-10 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-lafoi-green/[0.06] transition-all duration-500 h-full ${partner.accent}`}>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-4xl">{partner.flag}</span>
                  <div>
                    <h3 className="font-sora text-xl font-bold text-lafoi-dark">{partner.title}</h3>
                    <p className="text-xs text-lafoi-gray-medium font-general">{partner.country}</p>
                  </div>
                </div>
                <p className="text-sm text-lafoi-gray font-general leading-relaxed mb-6">{partner.desc}</p>
                <div className="grid grid-cols-2 gap-3">
                  {partner.features.map((f) => (
                    <div key={f} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-lafoi-green-soft">
                      <CheckCircle2 size={14} className="text-lafoi-green shrink-0" />
                      <span className="text-xs text-lafoi-dark font-medium">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

function TeamSection() {
  return (
    <section className="py-24 lg:py-32 bg-lafoi-cream relative overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-30" />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <AnimatedSection>
            <span className="text-lafoi-green font-sora text-sm font-semibold tracking-widest uppercase">Our Team</span>
            <h2 className="heading-lg text-3xl sm:text-4xl text-lafoi-dark mt-4 mb-6">
              Trained experts, <span className="text-gradient">passionate creators</span>
            </h2>
            <p className="text-lafoi-gray font-general mb-6 leading-relaxed">
              Our team underwent extensive training with our German and Estonian partners, mastering the art and science of stretch ceiling installation. Every member brings dedication, skill, and an unwavering eye for detail.
            </p>
            <div className="space-y-4 mb-8">
              {[
                'Certified by European manufacturing partners',
                'Specialized in residential and commercial installations',
                'Ongoing training in latest ceiling technologies',
                'Dedicated project managers for every job',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-lafoi-green/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={14} className="text-lafoi-green" />
                  </div>
                  <span className="text-sm text-lafoi-dark font-medium">{item}</span>
                </div>
              ))}
            </div>
            <Link
              to="/careers"
              className="inline-flex items-center gap-2 font-sora text-sm font-semibold text-lafoi-green hover:text-lafoi-green-dark transition-colors group"
            >
              Join our team
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </AnimatedSection>

          <AnimatedSection direction="right" className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/10">
              <OptimizedImage
                src="https://images.unsplash.com/photo-1758691736975-9f7f643d178e?w=1200&q=80"
                alt="La Foi Designs Team"
                className="w-full h-[420px] object-cover"
                fill
                vision="Professional diverse team smiling, collaborative workplace environment"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <p className="text-white font-sora text-lg font-semibold">Internationally Trained. Locally Dedicated.</p>
                <p className="text-white/60 text-sm font-general mt-1">Our expert team brings world-class standards to every project.</p>
              </div>
            </div>
            {/* Floating stat */}
            <motion.div
              className="absolute -top-4 -right-4 px-5 py-3 bg-lafoi-green rounded-2xl shadow-xl z-10"
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="flex items-center gap-2">
                <Star size={16} className="text-white fill-white" />
                <span className="text-white font-sora text-sm font-bold">100% Satisfaction</span>
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

function AboutCTA() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0">
        <OptimizedImage
          src="https://images.unsplash.com/photo-1758194090785-8e09b7288199?w=1920&q=80"
          alt="Luxury interior space"
          className="w-full h-full object-cover"
          fill
          vision="Luxurious high-end lobby with modern seating, gold accents, and dramatic lighting"
        />
        <div className="absolute inset-0 bg-lafoi-dark/85 backdrop-blur-sm" />
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative z-10">
        <AnimatedSection>
          <motion.div
            className="w-16 h-16 rounded-2xl bg-lafoi-green/20 flex items-center justify-center mx-auto mb-8"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles size={28} className="text-lafoi-green" />
          </motion.div>
          <h2 className="heading-lg text-3xl sm:text-4xl lg:text-5xl text-white mb-6">
            Ready to work with<br />the best?
          </h2>
          <p className="text-white/60 font-general text-lg mb-10 max-w-lg mx-auto">
            Experience the La Foi difference. Book a free consultation and let us show you what's possible.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/contact"
              className="group flex items-center gap-3 px-8 py-4 bg-lafoi-green text-white rounded-full font-sora text-sm font-semibold hover:bg-lafoi-green-light transition-all duration-300 shadow-lg shadow-lafoi-green/25"
            >
              Get Started Today
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
