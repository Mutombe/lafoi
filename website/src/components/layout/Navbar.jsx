import React from 'react';
import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, X, Menu, ChevronDown, ArrowRight,
  Sparkles, Building2, Briefcase, Camera, Phone,
  HelpCircle, Newspaper, Users, Lightbulb, Palette,
  LayoutGrid, Zap, Star
} from 'lucide-react'

const navGroups = [
  {
    label: 'Discover',
    items: [
      { name: 'Our Story', path: '/about', icon: Sparkles, desc: 'The journey behind La Foi' },
      { name: 'Portfolio', path: '/portfolio', icon: Camera, desc: 'Stunning transformations' },
      { name: 'Blog & Insights', path: '/blog', icon: Newspaper, desc: 'Design trends & tips' },
    ],
  },
  {
    label: 'Solutions',
    items: [
      { name: 'Stretch Ceilings', path: '/services/stretch-ceilings', icon: LayoutGrid, desc: 'Premium ceiling systems' },
      { name: 'Custom Lighting', path: '/services/custom-lighting', icon: Lightbulb, desc: 'Architectural illumination' },
      { name: 'All Services', path: '/services', icon: Palette, desc: 'Full service catalog' },
    ],
  },
  {
    label: 'Connect',
    items: [
      { name: 'Contact Us', path: '/contact', icon: Phone, desc: 'Start your project' },
      { name: 'Careers', path: '/careers', icon: Briefcase, desc: 'Join our team' },
      { name: 'FAQs', path: '/faq', icon: HelpCircle, desc: 'Common questions' },
    ],
  },
]

const searchableContent = [
  { title: 'Stretch Ceilings', path: '/services/stretch-ceilings', section: 'Services', keywords: 'stretch ceiling pvc fabric membrane' },
  { title: 'Custom Lighting Solutions', path: '/services/custom-lighting', section: 'Services', keywords: 'led lighting custom lights backlit' },
  { title: 'Printed Ceilings', path: '/services/printed-ceilings', section: 'Services', keywords: 'printed ceiling design custom print' },
  { title: '3D Stretch Ceilings', path: '/services/3d-ceilings', section: 'Services', keywords: '3d ceiling three dimensional' },
  { title: 'Acoustic Solutions', path: '/services/acoustic', section: 'Services', keywords: 'acoustic sound noise reduction' },
  { title: 'About La Foi Designs', path: '/about', section: 'Company', keywords: 'about company history story team' },
  { title: 'Our Portfolio', path: '/portfolio', section: 'Projects', keywords: 'portfolio gallery projects work showcase' },
  { title: 'Contact Us', path: '/contact', section: 'Connect', keywords: 'contact reach phone email address' },
  { title: 'Career Opportunities', path: '/careers', section: 'Connect', keywords: 'careers jobs hiring work opportunities' },
  { title: 'Frequently Asked Questions', path: '/faq', section: 'Support', keywords: 'faq questions help support answers' },
  { title: 'Blog & Design Insights', path: '/blog', section: 'Content', keywords: 'blog articles news design trends' },
  { title: 'German Engineered Quality', path: '/about', section: 'Company', keywords: 'german quality engineering standards' },
  { title: 'Estonian Innovation', path: '/about', section: 'Company', keywords: 'estonian innovation partner supplier' },
  { title: 'Residential Projects', path: '/portfolio', section: 'Projects', keywords: 'residential home house living room bedroom' },
  { title: 'Commercial Installations', path: '/portfolio', section: 'Projects', keywords: 'commercial office hotel restaurant retail' },
  { title: 'Free Consultation', path: '/contact', section: 'Connect', keywords: 'consultation free quote estimate' },
]

// Pages with dark hero backgrounds where navbar text must be white
const darkHeroPages = ['/', '/portfolio', '/services', '/faq', '/careers']
// Pages with sub-routes that also have dark heroes
const darkHeroPrefixes = ['/services/']

function useHasDarkHero(pathname) {
  return darkHeroPages.includes(pathname) || darkHeroPrefixes.some(p => pathname.startsWith(p))
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const searchRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const hasDarkHero = useHasDarkHero(location.pathname)
  // When not scrolled on a dark hero page, text should be white
  const isLightText = hasDarkHero && !scrolled

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setActiveDropdown(null)
    setSearchOpen(false)
    setSearchQuery('')
  }, [location.pathname])

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus()
  }, [searchOpen])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const q = searchQuery.toLowerCase()
    const results = searchableContent.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q)
    )
    setSearchResults(results)
  }, [searchQuery])

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(prev => !prev)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setMobileOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleSearchNavigate = (path) => {
    navigate(path)
    setSearchOpen(false)
    setSearchQuery('')
  }

  return (
    <>
      {/* Main Navbar */}
      <motion.header
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
          scrolled
            ? 'glass shadow-lg shadow-black/[0.03]'
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center group relative z-10">
              <img src="/logo.png" alt="La Foi Designs" className="h-20 sm:h-24 lg:h-28 w-auto group-hover:scale-105 transition-transform duration-300" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              <NavLink to="/" label="Home" active={location.pathname === '/'} lightText={isLightText} />
              {navGroups.map((group) => (
                <DropdownMenu
                  key={group.label}
                  group={group}
                  active={activeDropdown === group.label}
                  onOpen={() => setActiveDropdown(group.label)}
                  onClose={() => setActiveDropdown(null)}
                  currentPath={location.pathname}
                  lightText={isLightText}
                />
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className={`p-2.5 rounded-xl transition-colors group ${isLightText ? 'hover:bg-white/10' : 'hover:bg-lafoi-green/5'}`}
                aria-label="Search"
              >
                <Search size={18} className={`transition-colors ${isLightText ? 'text-white/80 group-hover:text-white' : 'text-lafoi-gray group-hover:text-lafoi-green'}`} />
              </button>

              <Link
                to="/contact"
                className={`hidden lg:flex items-center gap-2 px-5 py-2.5 font-sora text-sm font-medium rounded-full transition-all duration-300 group ${
                  isLightText
                    ? 'bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-lafoi-green hover:border-lafoi-green'
                    : 'bg-lafoi-dark text-white hover:bg-lafoi-green'
                }`}
              >
                <span>Get a Quote</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={`lg:hidden p-2.5 rounded-xl transition-colors ${isLightText ? 'text-white hover:bg-white/10' : 'hover:bg-lafoi-green/5'}`}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
            <motion.div
              className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
              initial={{ opacity: 0, y: -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <Search size={20} className="text-lafoi-gray-medium shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pages, services, projects..."
                  className="flex-1 text-base font-general outline-none bg-transparent placeholder:text-gray-300"
                />
                <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs text-lafoi-gray-medium bg-gray-100 rounded-md font-mono">
                  ESC
                </kbd>
              </div>
              {searchResults.length > 0 && (
                <div className="max-h-80 overflow-y-auto py-2">
                  {searchResults.map((result, i) => (
                    <button
                      key={i}
                      onClick={() => handleSearchNavigate(result.path)}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-lafoi-green/5 transition-colors text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-lafoi-green/10 flex items-center justify-center shrink-0">
                        <Star size={14} className="text-lafoi-green" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-lafoi-dark group-hover:text-lafoi-green transition-colors">{result.title}</p>
                        <p className="text-xs text-lafoi-gray-medium">{result.section}</p>
                      </div>
                      <ArrowRight size={14} className="ml-auto text-lafoi-gray-medium opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}
              {searchQuery && searchResults.length === 0 && (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-lafoi-gray-medium">No results found for "{searchQuery}"</p>
                </div>
              )}
              {!searchQuery && (
                <div className="px-5 py-4">
                  <p className="text-xs text-lafoi-gray-medium mb-2">Quick links</p>
                  <div className="flex flex-wrap gap-2">
                    {['Stretch Ceilings', 'Portfolio', 'Contact', 'Careers'].map((q) => (
                      <button
                        key={q}
                        onClick={() => setSearchQuery(q)}
                        className="px-3 py-1.5 text-xs rounded-full bg-gray-100 text-lafoi-gray hover:bg-lafoi-green/10 hover:text-lafoi-green transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[99] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.div
              className="absolute top-0 right-0 w-[85%] max-w-sm h-full bg-white shadow-2xl overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="p-6 pt-20">
                <Link
                  to="/"
                  className="block py-3 text-lg font-sora font-semibold text-lafoi-dark hover:text-lafoi-green transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Home
                </Link>
                {navGroups.map((group) => (
                  <div key={group.label} className="py-4 border-t border-gray-100">
                    <p className="text-xs font-sora font-semibold text-lafoi-green uppercase tracking-widest mb-3">
                      {group.label}
                    </p>
                    {group.items.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="flex items-center gap-3 py-2.5 text-lafoi-gray hover:text-lafoi-green transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        <item.icon size={16} />
                        <span className="font-general text-sm">{item.name}</span>
                      </Link>
                    ))}
                  </div>
                ))}
                <Link
                  to="/contact"
                  className="flex items-center justify-center gap-2 w-full mt-6 px-6 py-3.5 bg-lafoi-dark text-white rounded-full font-sora text-sm font-medium hover:bg-lafoi-green transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Get a Free Quote
                  <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function NavLink({ to, label, active, lightText }) {
  return (
    <Link
      to={to}
      className={`relative px-4 py-2 font-general text-sm transition-colors ${
        active
          ? 'text-lafoi-green font-medium'
          : lightText
            ? 'text-white/90 hover:text-white font-medium'
            : 'text-lafoi-gray hover:text-lafoi-dark'
      }`}
    >
      {label}
      {active && (
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-lafoi-green"
          layoutId="nav-indicator"
        />
      )}
    </Link>
  )
}

function DropdownMenu({ group, active, onOpen, onClose, currentPath, lightText }) {
  const isActiveGroup = group.items.some(item => currentPath.startsWith(item.path))
  const timeoutRef = useRef(null)

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current)
    onOpen()
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(onClose, 150)
  }

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        className={`flex items-center gap-1.5 px-4 py-2 font-general text-sm transition-colors ${
          isActiveGroup
            ? 'text-lafoi-green font-medium'
            : lightText
              ? 'text-white/90 hover:text-white font-medium'
              : 'text-lafoi-gray hover:text-lafoi-dark'
        }`}
      >
        {group.label}
        <ChevronDown size={14} className={`transition-transform duration-200 ${active ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {active && (
          <motion.div
            className="absolute top-full left-1/2 -translate-x-1/2 pt-2"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-64 bg-white rounded-2xl shadow-xl shadow-black/[0.06] border border-gray-100 p-2 overflow-hidden">
              {group.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-lafoi-green/5 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-lafoi-green/10 flex items-center justify-center shrink-0 group-hover:bg-lafoi-green/20 transition-colors">
                    <item.icon size={16} className="text-lafoi-green" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-lafoi-dark group-hover:text-lafoi-green transition-colors">{item.name}</p>
                    <p className="text-xs text-lafoi-gray-medium mt-0.5">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
