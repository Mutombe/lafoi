import React from 'react';
import { motion } from 'framer-motion'
import { useState } from 'react'
import { MapPin, Phone, Mail, Clock, Send, ArrowRight, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import AnimatedSection from '../components/ui/AnimatedSection'
import { useSEO } from '../utils/seo'

export default function Contact() {
  useSEO({
    title: 'Contact Us',
    description: 'Get in touch with La Foi Designs for a free consultation. Visit our Belgravia showroom or call us today.',
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
      <ContactContent />
      <MapSection />
    </motion.div>
  )
}

function ContactHero() {
  return (
    <section className="relative min-h-[50vh] flex items-center overflow-hidden bg-lafoi-cream">
      <div className="absolute inset-0 mesh-gradient-hero" />
      <div className="absolute inset-0 dot-pattern opacity-40" />
      <motion.div
        className="absolute top-40 right-[10%] w-48 h-48 bg-lafoi-green/8 rounded-full blur-[80px]"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 left-[5%] w-32 h-32 bg-lafoi-green/5 rounded-full blur-[60px]"
        animate={{ scale: [1.1, 1, 1.1] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 w-full pt-32 pb-16">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lafoi-green/5 border border-lafoi-green/10 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-2 h-2 rounded-full bg-lafoi-green animate-pulse" />
            <span className="text-xs font-sora text-lafoi-green font-medium tracking-wider uppercase">Get in Touch</span>
          </motion.div>
          <h1 className="heading-xl text-4xl sm:text-5xl lg:text-6xl text-lafoi-dark mt-4 mb-6">
            Let's bring your<br /><span className="text-gradient">vision to life</span>
          </h1>
          <p className="body-text text-lg max-w-xl leading-relaxed">
            Ready to transform your space? Reach out for a free consultation and discover what's possible with stretch ceilings and custom lighting.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

function ContactContent() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', service: '', message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields')
      return
    }
    setSubmitted(true)
    toast.success('Message sent successfully!', { description: "We'll get back to you within 24 hours." })
  }

  const contactInfo = [
    { icon: MapPin, label: 'Visit Our Showroom', value: 'Suite 26, 6 Chelmsford Road, Belgravia, Harare, Zimbabwe' },
    { icon: Phone, label: 'Call Us', value: '+263 712 326 951 | +263 782 931 472' },
    { icon: Mail, label: 'Email Us', value: 'admin@lafoidesigns.co.zw' },
    { icon: Clock, label: 'Business Hours', value: 'Mon – Fri: 8:00 AM – 5:00 PM | Sat: 9:00 AM – 1:00 PM' },
  ]

  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Contact Info */}
          <AnimatedSection className="lg:col-span-2">
            <h2 className="font-sora text-2xl font-bold text-lafoi-dark mb-8">Get in touch</h2>
            <div className="space-y-6">
              {contactInfo.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-lafoi-green/10 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-lafoi-green" />
                  </div>
                  <div>
                    <p className="text-sm font-sora font-semibold text-lafoi-dark">{label}</p>
                    <p className="text-sm text-lafoi-gray font-general mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>

          {/* Form */}
          <AnimatedSection direction="right" className="lg:col-span-3">
            {submitted ? (
              <motion.div
                className="p-12 rounded-3xl bg-lafoi-green-soft border border-lafoi-green/10 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <CheckCircle2 size={48} className="text-lafoi-green mx-auto mb-4" />
                <h3 className="font-sora text-2xl font-bold text-lafoi-dark mb-3">Message Sent!</h3>
                <p className="text-lafoi-gray font-general mb-6">Thank you for reaching out. Our team will contact you within 24 hours.</p>
                <button
                  onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', phone: '', service: '', message: '' }) }}
                  className="text-sm font-sora font-semibold text-lafoi-green hover:text-lafoi-green-dark transition-colors"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <div className="p-8 lg:p-10 rounded-3xl bg-white border border-gray-100 shadow-lg shadow-black/[0.04]">
                <h3 className="font-sora text-xl font-bold text-lafoi-dark mb-2">Request a Free Consultation</h3>
                <p className="text-sm text-lafoi-gray font-general mb-6">Fill in the details below and we'll get back to you within 24 hours.</p>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-sora font-semibold text-lafoi-dark mb-2">Full Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-general outline-none focus:border-lafoi-green focus:ring-1 focus:ring-lafoi-green/20 transition-all"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-sora font-semibold text-lafoi-dark mb-2">Email Address *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-general outline-none focus:border-lafoi-green focus:ring-1 focus:ring-lafoi-green/20 transition-all"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-sora font-semibold text-lafoi-dark mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-general outline-none focus:border-lafoi-green focus:ring-1 focus:ring-lafoi-green/20 transition-all"
                        placeholder="+263..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-sora font-semibold text-lafoi-dark mb-2">Service Interested In</label>
                      <select
                        value={formData.service}
                        onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-general outline-none focus:border-lafoi-green focus:ring-1 focus:ring-lafoi-green/20 transition-all bg-white"
                      >
                        <option value="">Select a service</option>
                        <option value="stretch-ceilings">Stretch Ceilings</option>
                        <option value="custom-lighting">Custom Lighting</option>
                        <option value="printed-ceilings">Printed Ceilings</option>
                        <option value="3d-ceilings">3D Ceiling Forms</option>
                        <option value="acoustic">Acoustic Solutions</option>
                        <option value="consulting">Design Consulting</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-sora font-semibold text-lafoi-dark mb-2">Project Details *</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-general outline-none focus:border-lafoi-green focus:ring-1 focus:ring-lafoi-green/20 transition-all resize-none"
                      placeholder="Tell us about your project — space type, approximate size, desired look..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-lafoi-green text-white rounded-full font-sora text-sm font-semibold hover:bg-lafoi-green-light transition-colors shadow-lg shadow-lafoi-green/20 group"
                  >
                    <Send size={16} />
                    Send Message
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              </div>
            )}
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

function MapSection() {
  return (
    <section className="pb-24">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <AnimatedSection>
          <div className="rounded-3xl overflow-hidden h-80 bg-gray-200">
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
      </div>
    </section>
  )
}
