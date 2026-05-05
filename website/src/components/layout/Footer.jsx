import React from 'react';
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight, MapPin, Phone, Envelope,
  InstagramLogo, FacebookLogo, LinkedinLogo, ArrowUpRight,
  DownloadSimple,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useState } from 'react'
import AnimatedSection from '../ui/AnimatedSection'
import Logo from '../shared/Logo'

const footerLinks = {
  Solutions: [
    { name: 'Stretch Ceilings', path: '/services/stretch-ceilings' },
    { name: 'Custom Lighting', path: '/services/custom-lighting' },
    { name: 'Design Consultation', path: '/services' },
    { name: 'Maintenance & Support', path: '/services' },
    { name: 'All Products', path: '/products' },
    { name: 'Shop', path: '/shop' },
  ],
  Company: [
    { name: 'Our Story', path: '/about' },
    { name: 'Projects', path: '/projects' },
    { name: 'Portfolio', path: '/portfolio' },
    { name: 'Careers', path: '/careers' },
    { name: 'Blog', path: '/blog' },
    { name: 'FAQs', path: '/faq' },
  ],
  Connect: [
    { name: 'Contact Us', path: '/contact' },
    { name: 'Get a Quote', path: '/contact' },
    { name: 'Book Consultation', path: '/contact' },
  ],
  Resources: [
    { name: 'Company Profile (PDF)', path: '/brand/docs/company-profile.pdf', download: true },
    { name: 'Stretch Ceilings Guide (PDF)', path: '/brand/docs/stretch-ceilings-guide.pdf', download: true },
  ],
}

export default function Footer({ onOpenPolicy, onOpenPrivacy }) {
  const [email, setEmail] = useState('')

  const handleNewsletter = (e) => {
    e.preventDefault()
    if (!email) return
    toast.success('Welcome to the La Foi family!', { description: 'Check your inbox for design inspiration.' })
    setEmail('')
  }

  return (
    <footer className="relative bg-lafoi-dark text-white overflow-hidden isolate">
      {/* Pattern layers — diagonal hairlines + topo dots */}
      <div className="absolute inset-0 pattern-diagonal pointer-events-none" />
      <div className="absolute inset-0 pattern-topo opacity-70 pointer-events-none" />

      {/* Architectural top edge — straight diagonal slope, refined */}
      <div className="absolute top-0 left-0 right-0 h-20 -translate-y-full pointer-events-none">
        <svg viewBox="0 0 1440 80" fill="none" className="w-full h-full" preserveAspectRatio="none">
          <path d="M0 80L1440 80L1440 32L720 64L0 12L0 80Z" fill="#111111" />
        </svg>
      </div>

      {/* Giant brand watermark — editorial */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none select-none overflow-hidden"
      >
        <span
          className="font-display font-light text-white/[0.035] tracking-[-0.05em] leading-none whitespace-nowrap"
          style={{ fontSize: 'clamp(14rem, 36vw, 32rem)' }}
        >
          LA&nbsp;FOI
        </span>
      </div>

      {/* Newsletter CTA band */}
      <div className="relative border-b border-white/10 z-10">
        <div className="absolute top-0 left-1/4 w-96 h-48 bg-lafoi-green/[0.07] rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-20 relative">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <AnimatedSection>
              {/* hairline rule + eyebrow */}
              <div className="flex items-center gap-3 mb-4">
                <span className="block w-10 h-px bg-lafoi-green/60" />
                <p className="text-lafoi-green-light font-sora text-[10px] font-medium tracking-[0.3em] uppercase">
                  Stay inspired
                </p>
              </div>
              <h3 className="font-display text-3xl lg:text-[2.75rem] leading-[1.1] tracking-[-0.02em]">
                Get design trends &<br />
                <span className="font-light italic text-lafoi-green-light">ceiling inspiration</span>
                <span className="text-white"> delivered.</span>
              </h3>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <form onSubmit={handleNewsletter} className="flex gap-3 max-w-md lg:ml-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-5 py-3.5 bg-white/[0.07] border border-white/[0.12] rounded-full text-sm font-general text-white placeholder:text-white/30 outline-none focus:border-lafoi-green/50 focus:bg-white/10 transition-all duration-300"
                />
                <button
                  type="submit"
                  className="px-6 py-3.5 bg-lafoi-green text-white rounded-full font-sora text-sm font-medium hover:bg-lafoi-green-light transition-all duration-300 flex items-center gap-2 group shrink-0 shadow-lg shadow-lafoi-green/20"
                >
                  Subscribe
                  <ArrowRight size={14} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </AnimatedSection>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-10 lg:gap-14">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="inline-block mb-5">
              <Logo tone="light" variant="wordmark" imgClassName="h-10 sm:h-12 w-auto" />
            </Link>
            {/* Issue number — editorial flourish */}
            <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-green-light/80 mb-4">
              N&#xBA; 01 — 2026
            </p>
            <p className="text-sm text-white/50 font-general leading-relaxed max-w-xs mb-6">
              Zimbabwe's first and leading provider of premium stretch ceilings and architectural lighting. Pioneering luminous interiors across Southern Africa from our Belgravia studio.
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm text-white/40">
                <MapPin size={14} weight="regular" className="text-lafoi-green shrink-0" />
                <span>Suite 26, 6 Chelmsford Rd, Belgravia, Harare</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/40">
                <Phone size={14} weight="regular" className="text-lafoi-green shrink-0" />
                <span>+263 712 326 951 | +263 782 931 472</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/40">
                <Envelope size={14} weight="regular" className="text-lafoi-green shrink-0" />
                <span>admin@lafoidesigns.co.zw</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <div className="flex items-center gap-2 mb-5">
                <span className="block w-4 h-px bg-lafoi-green/60" />
                <h4 className="font-sora text-[11px] font-semibold tracking-[0.18em] uppercase text-white">{title}</h4>
              </div>
              <ul className="space-y-3">
                {links.map((link) =>
                  link.download ? (
                    <li key={link.name}>
                      <a
                        href={link.path}
                        target="_blank"
                        rel="noopener"
                        download
                        className="text-sm text-white/40 hover:text-lafoi-green-light transition-colors font-general inline-flex items-center gap-1.5 group"
                      >
                        <DownloadSimple size={12} weight="regular" className="opacity-70 group-hover:opacity-100 transition-opacity" />
                        {link.name}
                      </a>
                    </li>
                  ) : link.external ? (
                    <li key={link.name}>
                      <a
                        href={link.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-white/40 hover:text-lafoi-green-light transition-colors font-general inline-flex items-center gap-1 group"
                      >
                        {link.name}
                        <ArrowUpRight size={12} weight="regular" className="opacity-60 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </li>
                  ) : (
                    <li key={link.name}>
                      <Link
                        to={link.path}
                        className="text-sm text-white/40 hover:text-lafoi-green-light transition-colors font-general inline-flex items-center gap-1 group"
                      >
                        {link.name}
                        <ArrowUpRight size={12} weight="regular" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Pattern band separator — cross hairlines, 1px-ish stripe */}
      <div className="relative z-10 h-6 pattern-cross-light opacity-60 border-t border-white/10" />

      {/* Bottom bar */}
      <div className="relative z-10 border-t border-white/10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30 font-general">
            &copy; 2026 La Foi Designs &middot; <span className="font-display italic">Belgravia, Harare</span>
          </p>
          <div className="flex items-center gap-6">
            <button onClick={onOpenPolicy} className="text-xs text-white/30 hover:text-white/60 transition-colors">
              Terms &amp; Conditions
            </button>
            <button onClick={onOpenPrivacy} className="text-xs text-white/30 hover:text-white/60 transition-colors">
              Privacy Policy
            </button>
            <div className="flex items-center gap-3">
              {[
                { Icon: InstagramLogo, label: 'Instagram' },
                { Icon: FacebookLogo, label: 'Facebook' },
                { Icon: LinkedinLogo, label: 'LinkedIn' },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-lafoi-green/20 hover:text-lafoi-green-light transition-colors text-white/40"
                >
                  <Icon size={14} weight="fill" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Refined ambient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[720px] h-[260px] bg-lafoi-green/[0.06] rounded-full blur-[140px] pointer-events-none" />
    </footer>
  )
}
