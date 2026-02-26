import React from 'react';
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, MapPin, Phone, Mail, Instagram, Facebook, Linkedin, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import AnimatedSection from '../ui/AnimatedSection'

const footerLinks = {
  Solutions: [
    { name: 'Stretch Ceilings', path: '/services/stretch-ceilings' },
    { name: 'Custom Lighting', path: '/services/custom-lighting' },
    { name: 'Printed Ceilings', path: '/services/printed-ceilings' },
    { name: '3D Installations', path: '/services/3d-ceilings' },
    { name: 'Acoustic Solutions', path: '/services/acoustic' },
  ],
  Company: [
    { name: 'Our Story', path: '/about' },
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
    <footer className="relative bg-lafoi-dark text-white overflow-hidden">
      {/* Decorative top curve */}
      <div className="absolute top-0 left-0 right-0 h-24 -translate-y-full">
        <svg viewBox="0 0 1440 96" fill="none" className="w-full h-full" preserveAspectRatio="none">
          <path d="M0 96L1440 96L1440 0C1440 0 1080 96 720 96C360 96 0 0 0 0L0 96Z" fill="#111111" />
        </svg>
      </div>

      {/* Newsletter CTA band */}
      <div className="relative border-b border-white/10">
        <div className="absolute top-0 left-1/4 w-96 h-48 bg-lafoi-green/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <AnimatedSection>
              <p className="text-lafoi-green font-sora text-sm font-medium tracking-widest uppercase mb-3">Stay Inspired</p>
              <h3 className="font-sora text-3xl lg:text-4xl font-bold leading-tight">
                Get design trends &<br />
                <span className="text-gradient">ceiling inspiration</span> delivered.
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
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </AnimatedSection>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 lg:gap-16">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="inline-block mb-5">
              <img src="/logo.png" alt="La Foi Designs" className="h-20 sm:h-24 w-auto brightness-0 invert" />
            </Link>
            <p className="text-sm text-white/50 font-general leading-relaxed max-w-xs mb-6">
              Zimbabwe's premier stretch ceiling and custom lighting solutions provider. Transforming spaces with German & Estonian engineered excellence.
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm text-white/40">
                <MapPin size={14} className="text-lafoi-green shrink-0" />
                <span>Suite 26, 6 Chelmsford Rd, Belgravia, Harare</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/40">
                <Phone size={14} className="text-lafoi-green shrink-0" />
                <span>+263 712 326 951 | +263 782 931 472</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/40">
                <Mail size={14} className="text-lafoi-green shrink-0" />
                <span>admin@lafoidesigns.co.zw</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-sora text-sm font-semibold text-white mb-5">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-sm text-white/40 hover:text-lafoi-green transition-colors font-general inline-flex items-center gap-1 group"
                    >
                      {link.name}
                      <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30 font-general">
            © 2026 La Foi Designs. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <button onClick={onOpenPolicy} className="text-xs text-white/30 hover:text-white/60 transition-colors">
              Terms & Conditions
            </button>
            <button onClick={onOpenPrivacy} className="text-xs text-white/30 hover:text-white/60 transition-colors">
              Privacy Policy
            </button>
            <div className="flex items-center gap-3">
              {[Instagram, Facebook, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-lafoi-green/20 hover:text-lafoi-green transition-colors text-white/40">
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ambient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-lafoi-green/5 rounded-full blur-[120px] pointer-events-none" />
    </footer>
  )
}
