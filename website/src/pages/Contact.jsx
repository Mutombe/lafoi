import React, { useState, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  MapPin,
  Phone,
  Envelope,
  Clock,
  PaperPlaneRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle,
  Sparkle,
  WhatsappLogo,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import AnimatedSection from '../components/ui/AnimatedSection'
import OptimizedImage from '../components/ui/OptimizedImage'
import HeroSlideshow from '../components/ui/HeroSlideshow'
import { useSEO } from '../utils/seo'

const CONTACT_HERO_SLIDES = [
  {
    src: 'https://images.unsplash.com/photo-1638284457192-27d3d0ec51aa?w=2200&q=85',
    alt: 'Calm contemporary living room',
    vision: 'Welcoming residential space',
  },
  {
    src: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=2200&q=85',
    alt: 'Restaurant fine dining interior',
    vision: 'Warm hospitality space',
  },
  {
    src: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=2200&q=85',
    alt: 'Luxe hotel suite',
    vision: 'Refined room awaiting brief',
  },
]

export default function Contact() {
  useSEO({
    title: 'Contact Us',
    description:
      'Get in touch with La Foi Designs for a free consultation. Visit our Belgravia showroom or call us today.',
    path: '/contact',
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ContactHero />
      <ContactBento />
      <ContactForm />
      <WhatsAppCallout />
      <MapSection />
    </motion.div>
  )
}

/* ============================================================================
   1. HERO
   ============================================================================ */

function ContactHero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <section
      ref={ref}
      className="relative h-[100svh] min-h-[640px] flex flex-col overflow-hidden bg-lafoi-dark"
    >
      <HeroSlideshow slides={CONTACT_HERO_SLIDES} interval={6500} parallax overlay={false} />
      <div className="absolute inset-0 bg-gradient-to-t from-lafoi-dark/90 via-lafoi-dark/40 to-lafoi-dark/55 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-lafoi-dark/55 via-transparent to-lafoi-dark/20 pointer-events-none" />

      <div className="absolute top-28 right-6 lg:top-32 lg:right-10 z-10 pointer-events-none flex items-center gap-3">
        <span className="hidden sm:block w-8 h-px bg-white/30" />
        <span className="font-sora text-[10px] tracking-[0.28em] uppercase text-white/65">
          Vol.&nbsp;05 &mdash; 2026 &middot; Conversations begin here
        </span>
      </div>

      <motion.div
        className="relative z-10 flex-1 flex flex-col max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 w-full"
        style={{ opacity }}
      >
        <motion.div
          className="pt-28 lg:pt-32"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/8 backdrop-blur-md border border-white/15">
            <PaperPlaneRight size={12} weight="regular" className="text-lafoi-green-light" />
            <span className="text-[10px] sm:text-[11px] font-sora text-white/85 font-medium tracking-[0.22em] uppercase">
              Belgravia, Harare &middot; Open today
            </span>
          </span>
        </motion.div>

        <div className="mt-auto pb-10 lg:pb-16 grid lg:grid-cols-12 gap-8 lg:gap-12 items-end">
          <motion.div
            className="lg:col-span-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1
              className="font-display text-white tracking-[-0.035em] leading-[0.98] text-[3rem] sm:text-[4.5rem] lg:text-[6.2rem] xl:text-[6.8rem]"
              style={{ fontVariationSettings: '"opsz" 144' }}
            >
              <span className="block font-light text-white/95">Begin with</span>
              <span className="block">
                <span className="font-normal text-white">a </span>
                <span className="font-normal text-lafoi-green-light">conversation</span>
                <span className="text-lafoi-green-light">.</span>
              </span>
            </h1>

            <motion.p
              className="mt-6 lg:mt-8 max-w-xl text-sm sm:text-base lg:text-[17px] text-white/70 font-body font-light leading-[1.55]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              We visit, we measure, we listen. The first conversation costs nothing — and tends to
              clarify even the briefs that arrive uncertain.
            </motion.p>
          </motion.div>

          {/* duotone metadata card */}
          <motion.aside
            className="lg:col-span-4 hidden lg:block"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="ml-auto max-w-[300px] relative bg-white/[0.06] backdrop-blur-md border border-white/15 rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-lg rounded-bl-lg p-6 overflow-hidden">
              <div aria-hidden className="absolute inset-0 dot-pattern opacity-30 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <span className="block w-6 h-px bg-lafoi-green-light/70" />
                  <p className="font-sora text-[10px] font-semibold tracking-[0.28em] uppercase text-lafoi-green-light">
                    Studio
                  </p>
                </div>
                <div className="space-y-3 font-body font-light text-[13px] text-white/75 leading-relaxed">
                  <p className="text-white">Suite 26, 6 Chelmsford Road</p>
                  <p className="text-white/60">Belgravia, Harare</p>
                  <p className="text-white/60 pt-2 border-t border-white/10">
                    Mon–Fri &middot; 08:00 – 17:00
                  </p>
                  <p className="text-white/60">Sat &middot; 09:00 – 13:00</p>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.1 }}
      >
        <span className="text-[9px] font-sora tracking-[0.35em] uppercase text-white/45">Scroll</span>
        <span className="block w-px h-8 bg-gradient-to-b from-white/45 to-transparent" />
      </motion.div>
    </section>
  )
}

/* ============================================================================
   2. CONTACT BENTO — 2x2 editorial
   ============================================================================ */

function ContactBento() {
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
                  Four ways to reach us
                </p>
                <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray/50">
                  01 / 04
                </span>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <h2 className="font-display font-light text-lafoi-dark text-3xl sm:text-4xl lg:text-[3.4rem] leading-[1.1] tracking-[-0.02em]">
                Pick the channel{' '}
                <span className="text-lafoi-green">that suits you</span>.
              </h2>
            </AnimatedSection>
          </div>
        </div>

        {/* 2x2 — 2 large primary, 2 smaller */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
          {/* Phone — large */}
          <AnimatedSection direction="up" className="lg:col-span-7">
            <ContactCardLarge
              eyebrow="01 / Phone"
              icon={Phone}
              label="Call us"
              value="+263 712 326 951"
              alt="+263 782 931 472"
              detail="Speak to a consultant directly"
              href="tel:+263712326951"
              accent
            />
          </AnimatedSection>

          {/* Email — medium */}
          <AnimatedSection direction="up" delay={0.05} className="lg:col-span-5">
            <ContactCardLarge
              eyebrow="02 / Email"
              icon={Envelope}
              label="Email us"
              value="admin@lafoidesigns.co.zw"
              detail="Attach drawings, photos or briefs"
              href="mailto:admin@lafoidesigns.co.zw"
            />
          </AnimatedSection>

          {/* Address — small */}
          <AnimatedSection direction="up" delay={0.1} className="lg:col-span-5">
            <ContactCardSmall
              eyebrow="03 / Studio"
              icon={MapPin}
              label="Visit us"
              lines={['Suite 26, 6 Chelmsford Road', 'Belgravia, Harare']}
              detail="By appointment, please"
            />
          </AnimatedSection>

          {/* Hours — small */}
          <AnimatedSection direction="up" delay={0.15} className="lg:col-span-7">
            <ContactCardSmall
              eyebrow="04 / Hours"
              icon={Clock}
              label="Open today"
              lines={['Mon – Fri · 08:00 – 17:00', 'Saturday · 09:00 – 13:00']}
              detail="Closed Sundays and public holidays"
            />
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

function ContactCardLarge({ eyebrow, icon: Icon, label, value, alt, detail, href, accent = false }) {
  const Tag = href ? 'a' : 'div'
  return (
    <Tag
      href={href}
      className={`group block h-full relative p-8 lg:p-10 rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-2xl rounded-bl-2xl border overflow-hidden transition-all duration-500 ${
        accent
          ? 'bg-lafoi-dark border-lafoi-dark hover:border-lafoi-green-light/40'
          : 'bg-white border-lafoi-dark/10 hover:border-lafoi-green/30 hover:shadow-xl hover:shadow-black/[0.04]'
      }`}
    >
      {accent && (
        <div aria-hidden className="absolute inset-0 pattern-blueprint-light opacity-40 pointer-events-none" />
      )}
      <div className="relative h-full flex flex-col">
        <div className="flex items-baseline justify-between mb-8">
          <p
            className={`font-sora text-[10px] font-semibold tracking-[0.3em] uppercase ${
              accent ? 'text-lafoi-green-light' : 'text-lafoi-green'
            }`}
          >
            {eyebrow}
          </p>
          <Icon
            size={18}
            weight="regular"
            className={accent ? 'text-white/60' : 'text-lafoi-green/70'}
          />
        </div>

        <span
          className={`block w-10 h-px mb-6 ${
            accent ? 'bg-lafoi-green-light/70' : 'bg-lafoi-green/60'
          }`}
        />

        <p
          className={`font-sora text-[10px] tracking-[0.28em] uppercase mb-3 ${
            accent ? 'text-white/55' : 'text-lafoi-gray-medium'
          }`}
        >
          {label}
        </p>

        <p
          className={`font-display font-light text-3xl lg:text-4xl xl:text-[2.6rem] leading-[1.1] tracking-[-0.01em] mb-3 ${
            accent ? 'text-white' : 'text-lafoi-dark'
          }`}
        >
          {value}
        </p>

        {alt && (
          <p
            className={`font-display font-light text-xl lg:text-2xl mb-3 ${
              accent ? 'text-white/70' : 'text-lafoi-gray'
            }`}
          >
            {alt}
          </p>
        )}

        <p
          className={`mt-auto pt-6 font-body font-light text-sm leading-relaxed ${
            accent ? 'text-white/55' : 'text-lafoi-gray'
          }`}
        >
          {detail}
        </p>

        {href && (
          <span
            className={`mt-5 inline-flex items-center gap-2 font-sora text-xs font-semibold tracking-wider uppercase ${
              accent ? 'text-lafoi-green-light' : 'text-lafoi-green'
            } opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all duration-500`}
          >
            <span>Reach out</span>
            <ArrowUpRight size={13} weight="bold" />
          </span>
        )}
      </div>
    </Tag>
  )
}

function ContactCardSmall({ eyebrow, icon: Icon, label, lines, detail }) {
  return (
    <div className="group h-full p-7 lg:p-8 rounded-3xl border border-lafoi-dark/10 bg-white/60 backdrop-blur-sm hover:bg-white hover:border-lafoi-green/30 transition-all duration-500">
      <div className="flex items-baseline justify-between mb-6">
        <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
          {eyebrow}
        </p>
        <Icon size={16} weight="regular" className="text-lafoi-green/70 group-hover:text-lafoi-green transition-colors duration-500" />
      </div>
      <span className="block w-8 h-px bg-lafoi-green/60 mb-5" />
      <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray-medium mb-3">
        {label}
      </p>
      <div className="space-y-1 mb-4">
        {lines.map((line, i) => (
          <p
            key={line}
            className={`font-display font-light leading-tight ${
              i === 0 ? 'text-lafoi-dark text-2xl' : 'text-lafoi-gray text-xl'
            }`}
          >
            {line}
          </p>
        ))}
      </div>
      <p className="font-body font-light text-xs text-lafoi-gray-medium leading-relaxed">
        {detail}
      </p>
    </div>
  )
}

/* ============================================================================
   3. CONTACT FORM — Editorial hairline inputs
   ============================================================================ */

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields')
      return
    }
    setSubmitted(true)
    toast.success('Message sent successfully', {
      description: "We'll get back to you within 24 hours.",
    })
  }

  return (
    <section className="relative py-20 lg:py-32 bg-white overflow-hidden">
      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Left — copy */}
          <div className="lg:col-span-4">
            <AnimatedSection>
              <div className="flex items-center gap-3 mb-5">
                <span className="block w-10 h-px bg-lafoi-green/60" />
                <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                  Open a brief
                </p>
                <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray/50">
                  02 / 04
                </span>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <h2 className="font-display font-light text-lafoi-dark text-3xl sm:text-4xl lg:text-[2.6rem] leading-[1.1] tracking-[-0.02em] mb-6">
                Tell us about{' '}
                <span className="text-lafoi-green">your space</span>.
              </h2>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <p className="font-body font-light text-base text-lafoi-gray leading-[1.7] mb-8">
                Fill in the details below — we'll review the brief and reach out within 24 hours
                with next steps. Free of charge, no obligation.
              </p>
            </AnimatedSection>
            <AnimatedSection delay={0.3}>
              <div className="space-y-0 border-t border-lafoi-dark/10">
                {[
                  { label: 'Reply within', value: '24 hours' },
                  { label: 'Site visit', value: 'Free' },
                  { label: 'First sketch', value: 'No charge' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-baseline justify-between gap-3 py-3 border-b border-lafoi-dark/10"
                  >
                    <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">
                      {item.label}
                    </span>
                    <span className="font-display font-normal text-base text-lafoi-dark">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>

          {/* Right — form */}
          <div className="lg:col-span-8">
            <AnimatedSection direction="right">
              {submitted ? (
                <motion.div
                  className="p-12 lg:p-16 rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-2xl rounded-bl-2xl bg-lafoi-cream border border-lafoi-green/20 text-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-lafoi-green/10 flex items-center justify-center">
                    <CheckCircle size={28} weight="regular" className="text-lafoi-green" />
                  </div>
                  <span className="block w-10 h-px bg-lafoi-green mx-auto mb-5" />
                  <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-green mb-4">
                    Message received
                  </p>
                  <h3 className="font-display font-light text-3xl lg:text-4xl text-lafoi-dark mb-4 leading-tight">
                    Thank you.
                  </h3>
                  <p className="font-body font-light text-base text-lafoi-gray mb-8 max-w-md mx-auto">
                    Our team will be in touch within 24 hours.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false)
                      setFormData({ name: '', email: '', phone: '', service: '', message: '' })
                    }}
                    className="inline-flex items-center gap-2 text-sm font-sora text-lafoi-green hover:text-lafoi-green-dark transition-colors pb-1 border-b border-lafoi-green/30"
                  >
                    Send another message
                    <ArrowRight size={13} weight="bold" />
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-7">
                  <FormField
                    label="Full name"
                    required
                    value={formData.name}
                    onChange={(v) => setFormData({ ...formData, name: v })}
                    placeholder="Your name"
                  />

                  <div className="grid sm:grid-cols-2 gap-7">
                    <FormField
                      label="Email"
                      required
                      type="email"
                      value={formData.email}
                      onChange={(v) => setFormData({ ...formData, email: v })}
                      placeholder="your@email.com"
                    />
                    <FormField
                      label="Phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(v) => setFormData({ ...formData, phone: v })}
                      placeholder="+263..."
                    />
                  </div>

                  <FormSelect
                    label="Service"
                    value={formData.service}
                    onChange={(v) => setFormData({ ...formData, service: v })}
                    options={[
                      { value: '', label: 'Select a service' },
                      { value: 'stretch-ceilings', label: 'Stretch Ceilings' },
                      { value: 'custom-lighting', label: 'Custom Lighting' },
                      { value: 'printed-ceilings', label: 'Printed Ceilings' },
                      { value: '3d-ceilings', label: '3D Ceiling Forms' },
                      { value: 'acoustic', label: 'Acoustic Solutions' },
                      { value: 'consulting', label: 'Design Consulting' },
                    ]}
                  />

                  <FormTextarea
                    label="Project details"
                    required
                    value={formData.message}
                    onChange={(v) => setFormData({ ...formData, message: v })}
                    placeholder="Tell us about your project — space type, approximate size, desired look..."
                  />

                  <button
                    type="submit"
                    className="group inline-flex items-center gap-3 px-8 py-4 bg-lafoi-green-light text-white rounded-full font-sora text-sm font-semibold hover:bg-lafoi-green transition-all duration-500 shadow-[0_8px_30px_rgba(34,197,94,0.25)]"
                  >
                    <PaperPlaneRight size={15} weight="regular" />
                    Send the brief
                    <ArrowRight
                      size={14}
                      weight="bold"
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                </form>
              )}
            </AnimatedSection>
          </div>
        </div>
      </div>
    </section>
  )
}

function FormField({ label, required, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <label className="flex items-center justify-between mb-3">
        <span className="font-sora text-[10px] font-semibold tracking-[0.28em] uppercase text-lafoi-dark">
          {label}
        </span>
        {required && (
          <span className="font-sora text-[10px] tracking-[0.2em] uppercase text-lafoi-green">
            Required
          </span>
        )}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pb-3 bg-transparent border-b border-lafoi-dark/20 font-body text-base text-lafoi-dark placeholder:text-lafoi-gray-medium outline-none focus:border-lafoi-green transition-colors duration-300"
      />
    </div>
  )
}

function FormSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block mb-3">
        <span className="font-sora text-[10px] font-semibold tracking-[0.28em] uppercase text-lafoi-dark">
          {label}
        </span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pb-3 bg-transparent border-b border-lafoi-dark/20 font-body text-base text-lafoi-dark outline-none focus:border-lafoi-green transition-colors duration-300 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function FormTextarea({ label, required, value, onChange, placeholder }) {
  return (
    <div>
      <label className="flex items-center justify-between mb-3">
        <span className="font-sora text-[10px] font-semibold tracking-[0.28em] uppercase text-lafoi-dark">
          {label}
        </span>
        {required && (
          <span className="font-sora text-[10px] tracking-[0.2em] uppercase text-lafoi-green">
            Required
          </span>
        )}
      </label>
      <textarea
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pb-3 bg-transparent border-b border-lafoi-dark/20 font-body text-base text-lafoi-dark placeholder:text-lafoi-gray-medium outline-none focus:border-lafoi-green transition-colors duration-300 resize-none"
      />
    </div>
  )
}

/* ============================================================================
   4. WHATSAPP CALLOUT — glass card with prominent CTA
   ============================================================================ */

function WhatsAppCallout() {
  return (
    <section className="relative py-20 lg:py-28 bg-lafoi-cream overflow-hidden">
      <div className="absolute inset-0 pattern-diagonal opacity-30 pointer-events-none" />
      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <AnimatedSection>
          <div className="relative rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-2xl rounded-bl-2xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.08)] overflow-hidden">
            <div aria-hidden className="absolute inset-0 pattern-blueprint opacity-20 pointer-events-none" />

            <div className="relative grid lg:grid-cols-12 gap-8 lg:gap-12 items-center p-8 lg:p-14">
              <div className="lg:col-span-7">
                <div className="flex items-center gap-3 mb-6">
                  <span className="block w-10 h-px bg-lafoi-green/60" />
                  <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                    The fastest channel
                  </p>
                  <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray/50">
                    03 / 04
                  </span>
                </div>

                <h2 className="font-display font-light text-lafoi-dark text-3xl sm:text-4xl lg:text-[2.8rem] leading-[1.1] tracking-[-0.02em] mb-6">
                  WhatsApp us{' '}
                  <span className="text-lafoi-green">directly</span>.
                </h2>

                <p className="font-body font-light text-base lg:text-lg text-lafoi-gray leading-[1.75] mb-8 max-w-lg">
                  Send a photo of your space, a sketch, or just a brief message. Most enquiries get
                  a personal reply within the hour during business days.
                </p>

                <a
                  href="https://wa.me/263712326951"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-lafoi-green-light text-white font-sora text-sm font-semibold hover:bg-lafoi-green transition-all duration-500 shadow-[0_10px_40px_-10px_rgba(34,197,94,0.55)]"
                >
                  <WhatsappLogo size={18} weight="regular" />
                  Message us on WhatsApp
                  <ArrowUpRight
                    size={15}
                    weight="bold"
                    className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300"
                  />
                </a>
              </div>

              <div className="lg:col-span-5">
                <div className="space-y-0 border-t border-lafoi-dark/10">
                  {[
                    { eyebrow: 'Number', value: '+263 712 326 951' },
                    { eyebrow: 'Backup', value: '+263 782 931 472' },
                    { eyebrow: 'Reply time', value: 'Usually under an hour' },
                    { eyebrow: 'Hours', value: 'Mon – Sat · 08:00 – 18:00' },
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
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ============================================================================
   5. MAP
   ============================================================================ */

function MapSection() {
  return (
    <section className="relative pb-24 lg:pb-32 bg-lafoi-cream">
      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <AnimatedSection>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8 lg:mb-10">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="block w-10 h-px bg-lafoi-green/60" />
                <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
                  Visit the studio
                </p>
                <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray/50">
                  04 / 04
                </span>
              </div>
              <h2 className="font-display font-light text-lafoi-dark text-3xl sm:text-4xl leading-[1.1] tracking-[-0.02em]">
                Suite 26, Belgravia.
              </h2>
            </div>
            <p className="font-body font-light text-sm text-lafoi-gray max-w-md">
              By appointment between Monday and Saturday. Coffee and a tour of the membrane library
              included.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div className="relative rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-2xl rounded-bl-2xl overflow-hidden h-80 lg:h-[440px] border border-lafoi-green/20">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3798.5!2d31.0429!3d-17.8052!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sBelgravia%2C+Harare%2C+Zimbabwe!5e0!3m2!1sen!2s!4v1"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="La Foi Designs Location"
            />
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.15}>
          <p className="mt-6 font-sora text-[11px] tracking-[0.25em] uppercase text-lafoi-gray-medium text-center">
            Suite 26, 6 Chelmsford Road &middot; Belgravia, Harare
          </p>
        </AnimatedSection>
      </div>
    </section>
  )
}
