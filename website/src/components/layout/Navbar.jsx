import React from 'react';
import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MagnifyingGlass, X, List, CaretDown, ArrowRight,
  Sparkle, Buildings, Briefcase, Camera, Phone, MapPin, Envelope,
  Question, Newspaper, Users, Lightbulb, Palette,
  SquaresFour, Lightning, Star, Package, ShoppingBag,
  Storefront, SignIn, UserCircle,
  PaintBrush, Stack, GridFour, Drop, Cube,
} from '@phosphor-icons/react'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated, selectCurrentUser } from '../../dashboard/store/authSlice'
import Logo from '../shared/Logo'
import { useCart } from '../../store/cart'

const navGroups = [
  {
    label: 'Discover',
    items: [
      { name: 'Official Launch', path: '/launch', icon: Star, desc: 'Our company launch — 13 June 2026' },
      { name: 'Our Story', path: '/about', icon: Sparkle, desc: 'The journey behind La Foi' },
      { name: 'Portfolio', path: '/portfolio', icon: Camera, desc: 'Stunning transformations' },
      { name: 'Projects', path: '/projects', icon: Camera, desc: 'Case studies & transformations' },
      { name: 'Blog & Insights', path: '/blog', icon: Newspaper, desc: 'Design trends & tips' },
    ],
  },
  {
    label: 'Services',
    items: [
      { name: 'Stretch Ceilings',  path: '/services/stretch-ceiling-installation', icon: SquaresFour, desc: 'Premium membrane systems' },
      { name: 'Lighting Solutions', path: '/services/lighting-solutions',          icon: Lightbulb,   desc: 'Architectural illumination' },
      { name: 'Interior Design',    path: '/services/interior-design',             icon: PaintBrush,  desc: 'Concept to completion' },
      { name: 'Flooring',           path: '/services/flooring',                    icon: Stack,       desc: 'Hardwood, vinyl, parquet' },
      { name: 'Epoxy Flooring',     path: '/services/epoxy-flooring',              icon: Drop,        desc: 'Seamless resin systems' },
      { name: '3D Digital Twins',   path: '/services/3d-digital-twins',            icon: Cube,        desc: 'Matterport spatial capture' },
      { name: 'All Services',       path: '/services',                             icon: Palette,     desc: 'Full service catalog' },
      { name: 'Products',           path: '/products',                             icon: Package,     desc: 'Membranes, lighting & accessories' },
    ],
  },
  {
    label: 'Connect',
    items: [
      { name: 'Contact Us', path: '/contact', icon: Phone, desc: 'Start your project' },
      { name: 'Careers', path: '/careers', icon: Briefcase, desc: 'Join our team' },
      { name: 'FAQs', path: '/faq', icon: Question, desc: 'Common questions' },
    ],
  },
]

const searchableContent = [
  { title: 'Stretch Ceiling Installation', path: '/services/stretch-ceiling-installation', section: 'Services', keywords: 'stretch ceiling pvc fabric membrane install' },
  { title: 'Lighting Solutions', path: '/services/lighting-solutions', section: 'Services', keywords: 'led lighting custom lights backlit fibre optic' },
  { title: 'Interior Design', path: '/services/interior-design', section: 'Services', keywords: 'interior design space planning palette furniture mood board styling' },
  { title: 'Flooring', path: '/services/flooring', section: 'Services', keywords: 'flooring hardwood vinyl laminate parquet engineered floor' },
  { title: 'Epoxy Flooring', path: '/services/epoxy-flooring', section: 'Services', keywords: 'epoxy resin floor seamless metallic flake industrial garage showroom' },
  { title: 'Design Consultation & Customisation', path: '/services/design-consultation', section: 'Services', keywords: 'design consultation custom site visit sampling' },
  { title: 'Maintenance & Support', path: '/services/maintenance-support', section: 'Services', keywords: 'maintenance support warranty cleaning repair' },
  { title: '3D Digital Twins', path: '/services/3d-digital-twins', section: 'Services', keywords: 'matterport 3d mapping digital twin virtual tour walkthrough scan spatial capture dollhouse floor plan measurement' },
  { title: 'About La Foi Designs', path: '/about', section: 'Company', keywords: 'about company history story team' },
  { title: 'Our Portfolio', path: '/portfolio', section: 'Projects', keywords: 'portfolio gallery projects work showcase' },
  { title: 'Contact Us', path: '/contact', section: 'Connect', keywords: 'contact reach phone email address' },
  { title: 'Career Opportunities', path: '/careers', section: 'Connect', keywords: 'careers jobs hiring work opportunities' },
  { title: 'Frequently Asked Questions', path: '/faq', section: 'Support', keywords: 'faq questions help support answers' },
  { title: 'Blog & Design Insights', path: '/blog', section: 'Content', keywords: 'blog articles news design trends' },
  { title: 'Why La Foi Designs', path: '/about', section: 'Company', keywords: 'why pioneer first stretch ceiling zimbabwe' },
  { title: 'Stretch Ceiling Technical Guide', path: '/brand/docs/stretch-ceilings-guide.pdf', section: 'Resources', keywords: 'pdf technical guide pvc fabric membrane fire rating' },
  { title: 'Residential Projects', path: '/portfolio', section: 'Projects', keywords: 'residential home house living room bedroom' },
  { title: 'Commercial Installations', path: '/portfolio', section: 'Projects', keywords: 'commercial office hotel restaurant retail' },
  { title: 'Free Consultation', path: '/contact', section: 'Connect', keywords: 'consultation free quote estimate' },
  // Products
  { title: 'All Products & Materials', path: '/products', section: 'Products', keywords: 'products catalog catalogue range materials membrane' },
  { title: 'Matte Stretch Ceiling', path: '/products/matte-stretch-membrane', section: 'Products', keywords: 'matte ceiling membrane pvc' },
  { title: 'Glossy Stretch Ceiling', path: '/products/gloss-lacquer-membrane', section: 'Products', keywords: 'gloss lacquer mirror reflective ceiling' },
  { title: 'Translucent Ceiling', path: '/products/translucent-backlit-membrane', section: 'Products', keywords: 'translucent backlit luminous ceiling' },
  { title: 'Printed Ceiling', path: '/products/printed-photographic-membrane', section: 'Products', keywords: 'printed photographic custom artwork ceiling' },
  { title: 'Star Ceiling', path: '/products/star-ceiling-membrane', section: 'Products', keywords: 'star ceiling fibre optic starfield night sky bedroom cinema spa' },
  { title: 'Fibre-Optic Starfield Kit', path: '/products/fiber-optic-starfield', section: 'Products', keywords: 'fibre fiber optic star starry sky ceiling lighting' },
  { title: 'Linear Lights', path: '/products/linear-led-cove', section: 'Products', keywords: 'linear lights led cove perimeter strip continuous stretch ceiling' },
  { title: 'Magnetic Track Lights', path: '/products/magnetic-track-system', section: 'Products', keywords: 'magnetic track lights 48v rail spot pendant linear reconfigurable' },
  { title: 'Back-Lighting', path: '/products/back-lighting', section: 'Products', keywords: 'back lighting hidden led concealed mirror vanity headboard wall feature reveal' },
  { title: 'Shadow Edge Lighting', path: '/products/shadow-edge-lighting', section: 'Products', keywords: 'shadow edge cove perimeter reveal floating ceiling halo wash' },
  // Projects
  { title: 'Project Case Studies', path: '/projects', section: 'Projects', keywords: 'projects case studies transformations archive' },
  { title: 'Borrowdale Private Residence', path: '/projects/borrowdale-private-residence', section: 'Projects', keywords: 'borrowdale residence home residential case study' },
  { title: 'Hospitality Ballroom Refit', path: '/projects/hospitality-ballroom-refit', section: 'Projects', keywords: 'ballroom hospitality refit translucent case study' },
  { title: 'Belgravia Commercial Office', path: '/projects/belgravia-commercial-office', section: 'Projects', keywords: 'belgravia office commercial acoustic case study' },
  // Shop
  { title: 'Shop, Companion Pieces', path: '/shop', section: 'Shop', keywords: 'shop store buy purchase order lamp humidifier accessories cart whatsapp' },
  { title: 'Lamps, Pendants, Sconces, Floor Lamps', path: '/shop', section: 'Shop', keywords: 'lamps pendant sconce floor table ceiling brass onyx light' },
  { title: 'Humidifiers', path: '/shop', section: 'Shop', keywords: 'humidifier mist ceramic tower smart compact dry climate' },
  { title: 'Lighting Accessories', path: '/shop', section: 'Shop', keywords: 'dimmer led module magnetic track adapter accessory' },
  { title: 'Care Kits, Membrane & LED Polish', path: '/shop', section: 'Shop', keywords: 'care kit cleaning microfibre polish membrane stretch ceiling maintenance' },
]

// Pages with dark / image hero backgrounds where navbar text and logo must be white.
// Services and products catalogue + their detail pages run on bright photography
// (white kitchens, gloss ceilings, hardwood floors) so the logo + nav links stay
// in dark colour there.
const darkHeroPages = ['/', '/about', '/portfolio', '/careers', '/projects', '/services', '/contact', '/launch']
// Pages with sub-routes that also have dark image heroes (e.g. /products is a
// light cream hero, but /products/:slug and /services/:slug are dark).
const darkHeroPrefixes = ['/projects/', '/services/', '/products/']

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
  const { count: cartCount, openCart } = useCart()
  const isAuthed = useSelector(selectIsAuthenticated)
  const currentUser = useSelector(selectCurrentUser)

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

  // Lock body scroll while the full-screen mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

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
              <Logo
                tone={isLightText ? 'light' : 'dark'}
                variant="wordmark"
                imgClassName="h-9 sm:h-10 lg:h-11 w-auto group-hover:scale-105 transition-transform duration-300"
              />
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
              <NavLink to="/shop" label="Shop" active={location.pathname === '/shop'} lightText={isLightText} />
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className={`p-2.5 rounded-full transition-colors group ${isLightText ? 'hover:bg-white/10' : 'hover:bg-lafoi-green/5'}`}
                aria-label="Search"
              >
                <MagnifyingGlass size={18} weight="regular" className={`transition-colors ${isLightText ? 'text-white/80 group-hover:text-white' : 'text-lafoi-gray group-hover:text-lafoi-green'}`} />
              </button>

              <button
                onClick={openCart}
                className={`relative p-2.5 rounded-full transition-colors group ${isLightText ? 'hover:bg-white/10' : 'hover:bg-lafoi-green/5'}`}
                aria-label={`Open cart${cartCount > 0 ? `, ${cartCount} item${cartCount === 1 ? '' : 's'}` : ''}`}
              >
                <ShoppingBag size={18} weight="regular" className={`transition-colors ${isLightText ? 'text-white/80 group-hover:text-white' : 'text-lafoi-gray group-hover:text-lafoi-green'}`} />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', damping: 12, stiffness: 400 }}
                      className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-lafoi-green text-white text-[10px] font-sora font-semibold flex items-center justify-center shadow-md shadow-lafoi-green/30 ring-2 ring-white"
                    >
                      {cartCount > 9 ? '9+' : cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* Studio dashboard, direct entry for the team. Shows "Sign in" when
                  unauthenticated, becomes a "Studio" pill (with the user's initial)
                  once a JWT is in localStorage so a return visitor goes straight in. */}
              <Link
                to={isAuthed ? '/dashboard' : '/dashboard/login'}
                title={isAuthed ? `Studio · ${currentUser?.display_name || currentUser?.username || 'admin'}` : 'Sign in to the studio dashboard'}
                className={`hidden lg:inline-flex items-center gap-2 px-4 py-2.5 font-sora text-sm font-medium rounded-sm transition-all duration-300 group ${
                  isLightText
                    ? 'text-white/85 hover:text-white hover:bg-white/8 border border-white/15'
                    : 'text-lafoi-dark hover:text-lafoi-green hover:bg-lafoi-green/5 border border-lafoi-dark/15'
                }`}
              >
                {isAuthed ? (
                  <>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isLightText ? 'bg-lafoi-green-light/30 text-white' : 'bg-lafoi-green/15 text-lafoi-green-dark'
                    }`}>
                      {(currentUser?.first_name?.[0] || currentUser?.username?.[0] || 'L').toUpperCase()}
                    </span>
                    <span>Studio</span>
                  </>
                ) : (
                  <>
                    <SignIn size={13} weight="bold" />
                    <span>Sign in</span>
                  </>
                )}
              </Link>

              <Link
                to="/contact"
                className={`hidden lg:flex items-center gap-2 px-5 py-2.5 font-sora text-sm font-medium rounded-sm transition-all duration-300 group bg-lafoi-green text-white shadow-sm shadow-lafoi-green/25 hover:bg-lafoi-green-light ${
                  isLightText ? 'border border-lafoi-green-light/30' : ''
                }`}
              >
                <span>Get a Quote</span>
                <ArrowRight size={14} weight="bold" className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={`lg:hidden p-2.5 rounded-full transition-colors ${isLightText ? 'text-white hover:bg-white/10' : 'hover:bg-lafoi-green/5'}`}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={22} weight="regular" /> : <List size={22} weight="regular" />}
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
              className="relative w-full max-w-2xl mx-4 bg-white rounded-sm shadow-2xl overflow-hidden"
              initial={{ opacity: 0, y: -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <MagnifyingGlass size={20} weight="regular" className="text-lafoi-gray-medium shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pages, services, projects..."
                  className="flex-1 text-base font-general outline-none bg-transparent placeholder:text-gray-300"
                />
                <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs text-lafoi-gray-medium bg-gray-100 rounded-sm font-mono">
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
                      <div className="w-8 h-8 rounded-full bg-lafoi-green/10 flex items-center justify-center shrink-0">
                        <Star size={14} weight="fill" className="text-lafoi-green" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-lafoi-dark group-hover:text-lafoi-green transition-colors">{result.title}</p>
                        <p className="text-xs text-lafoi-gray-medium">{result.section}</p>
                      </div>
                      <ArrowRight size={14} weight="regular" className="ml-auto text-lafoi-gray-medium opacity-0 group-hover:opacity-100 transition-opacity" />
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
                        className="px-3 py-1.5 text-xs rounded-sm bg-gray-100 text-lafoi-gray hover:bg-lafoi-green/10 hover:text-lafoi-green transition-colors"
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

      {/* Mobile Menu — full-screen, editorial: big typographic links + contact footer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[150] lg:hidden bg-lafoi-dark text-white flex flex-col overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* soft green glow */}
            <div aria-hidden className="absolute inset-0 dot-pattern opacity-[0.05] pointer-events-none" />

            {/* top bar: logo + close */}
            <div className="relative flex items-center justify-between px-6 pt-6">
              <Link to="/" onClick={() => setMobileOpen(false)}>
                <Logo tone="light" variant="wordmark" imgClassName="h-9 w-auto" />
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="w-11 h-11 rounded-full flex items-center justify-center text-white/90 hover:bg-white/10 transition-colors"
              >
                <X size={24} weight="regular" />
              </button>
            </div>

            <div className="relative flex-1 overflow-y-auto px-7 pt-10 pb-8 flex flex-col">
              <nav className="flex flex-col">
                {[
                  { name: 'Home', to: '/' },
                  { name: 'Services', to: '/services' },
                  { name: 'Products', to: '/products' },
                  { name: 'Portfolio', to: '/portfolio' },
                  { name: 'About', to: '/about' },
                  { name: 'Shop', to: '/shop' },
                  { name: 'Contact', to: '/contact' },
                ].map((item, i) => {
                  const active = location.pathname === item.to
                  return (
                    <motion.div
                      key={item.to}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.06 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <Link
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={`block py-2 font-display font-light tracking-[-0.02em] leading-[1.15] text-[2.1rem] transition-colors ${
                          active ? 'text-lafoi-green-light' : 'text-white hover:text-lafoi-green-light'
                        }`}
                      >
                        {item.name}
                      </Link>
                    </motion.div>
                  )
                })}
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="mt-9 flex flex-col gap-3"
              >
                <Link
                  to="/contact"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-lafoi-green text-white rounded-sm font-sora text-sm font-medium hover:bg-lafoi-green-light transition-colors"
                >
                  Get a Free Quote
                  <ArrowRight size={16} weight="bold" />
                </Link>
                <Link
                  to={isAuthed ? '/dashboard' : '/dashboard/login'}
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-sm border border-white/20 text-white/85 hover:bg-white/10 transition-colors font-sora text-sm font-medium"
                >
                  {isAuthed ? <UserCircle size={16} weight="regular" /> : <SignIn size={14} weight="bold" />}
                  {isAuthed ? 'Studio dashboard' : 'Sign in to studio'}
                </Link>
              </motion.div>

              {/* contact footer */}
              <div className="mt-auto pt-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="block w-8 h-px bg-lafoi-green-light/60" />
                  <span className="font-sora text-[10px] tracking-[0.3em] uppercase text-white/45">Get in touch</span>
                </div>
                <div className="space-y-2.5 text-white/55 text-sm font-general">
                  <div className="flex items-center gap-2.5"><MapPin size={15} className="text-lafoi-green-light shrink-0" /> Suite 26, 6 Chelmsford Rd, Belgravia, Harare</div>
                  <div className="flex items-center gap-2.5"><Phone size={15} className="text-lafoi-green-light shrink-0" /> +263 782 931 472</div>
                  <div className="flex items-center gap-2.5"><Envelope size={15} className="text-lafoi-green-light shrink-0" /> admin@lafoidesigns.co.zw</div>
                </div>
              </div>
            </div>
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
        <CaretDown size={14} weight="regular" className={`transition-transform duration-200 ${active ? 'rotate-180' : ''}`} />
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
            <div className="w-64 bg-white rounded-sm shadow-xl shadow-black/[0.06] border border-gray-100 p-2 overflow-hidden">
              {group.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-start gap-3 p-3 rounded-sm hover:bg-lafoi-green/5 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-full bg-lafoi-green/10 flex items-center justify-center shrink-0 group-hover:bg-lafoi-green/20 transition-colors">
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
