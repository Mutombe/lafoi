import React from 'react';
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Cookie, Shield, ScrollText } from 'lucide-react'
import { toast } from 'sonner'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout({ children }) {
  const [cookieVisible, setCookieVisible] = useState(false)
  const [policyOpen, setPolicyOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      const accepted = localStorage.getItem('lafoi-cookies')
      if (!accepted) setCookieVisible(true)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
      setScrollProgress(height > 0 ? (winScroll / height) * 100 : 0)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const acceptCookies = () => {
    localStorage.setItem('lafoi-cookies', 'accepted')
    setCookieVisible(false)
    toast.success('Preferences saved')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[110] h-[2px]">
        <motion.div
          className="h-full bg-gradient-to-r from-lafoi-green to-lafoi-green-light"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer onOpenPolicy={() => setPolicyOpen(true)} onOpenPrivacy={() => setPrivacyOpen(true)} />

      {/* Cookie Consent */}
      <AnimatePresence>
        {cookieVisible && (
          <motion.div
            className="fixed bottom-6 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-[150]"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="glass rounded-2xl p-5 shadow-2xl border border-white/40">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-lafoi-green/10 flex items-center justify-center shrink-0">
                  <Cookie size={18} className="text-lafoi-green" />
                </div>
                <div>
                  <h4 className="font-sora text-sm font-semibold text-lafoi-dark mb-1">We value your privacy</h4>
                  <p className="text-xs text-lafoi-gray leading-relaxed mb-4">
                    We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={acceptCookies}
                      className="px-4 py-2 bg-lafoi-dark text-white text-xs font-sora font-medium rounded-full hover:bg-lafoi-green transition-colors"
                    >
                      Accept All
                    </button>
                    <button
                      onClick={() => { setCookieVisible(false); localStorage.setItem('lafoi-cookies', 'essential') }}
                      className="px-4 py-2 bg-gray-100 text-lafoi-gray text-xs font-sora font-medium rounded-full hover:bg-gray-200 transition-colors"
                    >
                      Essential Only
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating WhatsApp Button */}
      <WhatsAppButton />

      {/* Policy Modal */}
      <PolicyModal open={policyOpen} onClose={() => setPolicyOpen(false)} type="terms" />
      <PolicyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} type="privacy" />
    </div>
  )
}

function PolicyModal({ open, onClose, type }) {
  const isTerms = type === 'terms'
  const title = isTerms ? 'Terms & Conditions' : 'Privacy Policy'
  const Icon = isTerms ? ScrollText : Shield

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-2xl max-h-[80vh] bg-white rounded-3xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-lafoi-green/10 flex items-center justify-center">
                  <Icon size={16} className="text-lafoi-green" />
                </div>
                <h3 className="font-sora text-lg font-semibold text-lafoi-dark">{title}</h3>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-64px)]">
              <div className="prose prose-sm prose-gray max-w-none font-general">
                {isTerms ? <TermsContent /> : <PrivacyContent />}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function WhatsAppButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          href="https://wa.me/263712326951"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-[140] flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 hover:shadow-xl hover:shadow-[#25D366]/40 transition-shadow duration-300 group"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Chat on WhatsApp"
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-7 h-7 group-hover:scale-105 transition-transform duration-200"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {/* Pulse ring animation */}
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20 pointer-events-none" />
        </motion.a>
      )}
    </AnimatePresence>
  )
}

function TermsContent() {
  return (
    <div className="space-y-4 text-sm text-lafoi-gray leading-relaxed">
      <p><strong className="text-lafoi-dark">Last Updated:</strong> January 2026</p>
      <p>Welcome to La Foi Designs. By accessing our website and services, you agree to the following terms and conditions.</p>
      <h4 className="font-sora font-semibold text-lafoi-dark text-base mt-6">1. Services</h4>
      <p>La Foi Designs provides stretch ceiling installation, custom lighting solutions, and related interior design services. All work is subject to site assessment and quotation approval.</p>
      <h4 className="font-sora font-semibold text-lafoi-dark text-base mt-6">2. Quotations & Pricing</h4>
      <p>Quotations are valid for 30 days from the date of issue. Prices may vary based on project complexity, materials, and installation requirements. A deposit of 50% is required to confirm a project booking.</p>
      <h4 className="font-sora font-semibold text-lafoi-dark text-base mt-6">3. Warranty</h4>
      <p>All stretch ceiling installations are covered by our comprehensive warranty backed by our German and Estonian manufacturing partners. Warranty terms vary by product and will be specified in your project agreement.</p>
      <h4 className="font-sora font-semibold text-lafoi-dark text-base mt-6">4. Limitation of Liability</h4>
      <p>La Foi Designs shall not be liable for any indirect, incidental, or consequential damages arising from the use of our website or services beyond the total amount paid for the specific project.</p>
      <h4 className="font-sora font-semibold text-lafoi-dark text-base mt-6">5. Intellectual Property</h4>
      <p>All designs, content, and materials on this website are the property of La Foi Designs and may not be reproduced without written consent.</p>
      <p className="mt-6 text-xs text-lafoi-gray-medium">For questions regarding these terms, contact us at admin@lafoidesigns.co.zw</p>
    </div>
  )
}

function PrivacyContent() {
  return (
    <div className="space-y-4 text-sm text-lafoi-gray leading-relaxed">
      <p><strong className="text-lafoi-dark">Last Updated:</strong> January 2026</p>
      <p>La Foi Designs respects your privacy. This policy outlines how we collect, use, and protect your personal information.</p>
      <h4 className="font-sora font-semibold text-lafoi-dark text-base mt-6">1. Information We Collect</h4>
      <p>We collect information you provide directly, such as your name, email address, phone number, and project details when you request a consultation or quote.</p>
      <h4 className="font-sora font-semibold text-lafoi-dark text-base mt-6">2. How We Use Your Information</h4>
      <p>Your information is used to respond to inquiries, provide quotations, deliver our services, and send occasional design inspiration newsletters (with your consent).</p>
      <h4 className="font-sora font-semibold text-lafoi-dark text-base mt-6">3. Data Protection</h4>
      <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, or destruction.</p>
      <h4 className="font-sora font-semibold text-lafoi-dark text-base mt-6">4. Cookies</h4>
      <p>We use essential cookies to ensure website functionality and optional analytics cookies to improve our services. You can manage your cookie preferences at any time.</p>
      <h4 className="font-sora font-semibold text-lafoi-dark text-base mt-6">5. Your Rights</h4>
      <p>You have the right to access, correct, or delete your personal data. Contact us at admin@lafoidesigns.co.zw to exercise these rights.</p>
      <p className="mt-6 text-xs text-lafoi-gray-medium">For privacy concerns, please contact our data protection team at admin@lafoidesigns.co.zw</p>
    </div>
  )
}
