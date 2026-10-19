import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, List, X, CaretDown, MagnifyingGlass,
  ShoppingBag, Star, UserCircle, MapPin, Phone, Envelope,
} from '@phosphor-icons/react'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated, selectCurrentUser } from '../../dashboard/store/authSlice'
import Logo from '../shared/Logo'
import { useCart } from '../../store/cart'
import { navGroups, searchableContent } from './navData'

/* ===========================================================================
   SiteNav — the one navigation for the whole public site.

   The editorial pill the team chose for the landing page, now used on every
   page: logo + a centered pill (Home + the Discover / Services / Connect
   dropdowns + Shop), plus search, cart, a Studio link and a quote button.
   Floats transparently over the cream homepage hero and drops in a cream-glass
   bar once scrolled; on every other page it shows that solid bar from the top
   so the dark logo stays legible over any hero. Links come from navData, so
   there is a single source of truth.
   =========================================================================== */

const EASE = [0.16, 1, 0.3, 1]

export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [openGroup, setOpenGroup] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const searchRef = useRef(null)

  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname
  const { count: cartCount, openCart } = useCart()
  const isAuthed = useSelector(selectIsAuthenticated)
  const currentUser = useSelector(selectCurrentUser)

  // The homepage (and its preview) float the nav over the cream hero; every
  // other page carries the solid cream-glass bar from the top.
  const floating = path === '/' || path === '/hero-preview'
  const homeActive = floating
  const shopActive = path === '/shop'
  const solidBar = !floating || scrolled

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close every transient panel on navigation.
  useEffect(() => {
    setMenuOpen(false); setOpenGroup(null); setSearchOpen(false); setSearchQuery('')
  }, [path])

  useEffect(() => { if (searchOpen && searchRef.current) searchRef.current.focus() }, [searchOpen])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const q = searchQuery.toLowerCase()
    setSearchResults(
      searchableContent.filter((it) =>
        it.title.toLowerCase().includes(q) ||
        it.keywords.toLowerCase().includes(q) ||
        it.section.toLowerCase().includes(q)
      )
    )
  }, [searchQuery])

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen((p) => !p) }
      if (e.key === 'Escape') { setSearchOpen(false); setMenuOpen(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const goSearch = (p) => { navigate(p); setSearchOpen(false); setSearchQuery('') }
  const studioPath = isAuthed ? '/dashboard' : '/dashboard/login'
  const iconBtn = 'w-11 h-11 rounded-full bg-white border border-lafoi-dark/5 shadow-[0_8px_30px_-16px_rgba(0,0,0,0.25)] flex items-center justify-center text-lafoi-dark hover:text-lafoi-green transition-colors'

  return (
    <>
      <header className={`fixed top-0 inset-x-0 z-[100] transition-all duration-300 ${
        solidBar ? 'bg-lafoi-cream/90 backdrop-blur-md border-b border-lafoi-dark/5 shadow-[0_8px_30px_-20px_rgba(0,0,0,0.35)]' : ''
      }`}>
        <div className="relative max-w-[1280px] w-full mx-auto px-5 sm:px-6 lg:px-10 py-3.5 sm:py-4 flex items-center justify-between gap-3">
          <Link to="/" className="group inline-flex items-center shrink-0" aria-label="La Foi Designs, home">
            <Logo tone="dark" variant="wordmark" imgClassName="h-8 sm:h-10 lg:h-11 w-auto group-hover:scale-105 transition-transform duration-300" />
          </Link>

          {/* Desktop pill nav */}
          <nav className="hidden lg:flex items-center gap-1 bg-white rounded-full px-1.5 py-1.5 shadow-[0_8px_30px_-16px_rgba(0,0,0,0.25)] border border-lafoi-dark/5">
            <Link to="/" className={`px-4 py-2 rounded-full text-sm font-sora transition-colors ${homeActive ? 'bg-lafoi-dark text-white' : 'text-lafoi-gray hover:text-lafoi-dark'}`}>Home</Link>
            {navGroups.map((group) => (
              <PillDropdown key={group.label} group={group}
                open={openGroup === group.label}
                onToggle={() => setOpenGroup((g) => (g === group.label ? null : group.label))}
                onClose={() => setOpenGroup(null)} pathname={path} />
            ))}
            <Link to="/shop" className={`px-4 py-2 rounded-full text-sm font-sora transition-colors ${shopActive ? 'bg-lafoi-dark text-white' : 'text-lafoi-gray hover:text-lafoi-dark'}`}>Shop</Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setSearchOpen(true)} aria-label="Search" className={iconBtn}>
              <MagnifyingGlass size={18} weight="regular" />
            </button>
            <button onClick={openCart} aria-label={`Open cart${cartCount > 0 ? `, ${cartCount} item${cartCount === 1 ? '' : 's'}` : ''}`} className={`relative ${iconBtn}`}>
              <ShoppingBag size={18} weight="regular" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span key={cartCount} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 400 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-lafoi-green text-white text-[10px] font-sora font-semibold flex items-center justify-center shadow-md shadow-lafoi-green/30 ring-2 ring-lafoi-cream">
                    {cartCount > 9 ? '9+' : cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Studio — staff entry to the dashboard */}
            <Link to={studioPath} title={isAuthed ? `Studio · ${currentUser?.display_name || currentUser?.username || 'admin'}` : 'Sign in to the studio dashboard'}
              className="hidden lg:inline-flex items-center gap-2 bg-white border border-lafoi-dark/10 text-lafoi-dark rounded-full px-4 py-2.5 text-sm font-sora font-medium hover:border-lafoi-dark/30 hover:text-lafoi-green transition-colors">
              {isAuthed ? (
                <span className="w-5 h-5 rounded-full bg-lafoi-green/15 text-lafoi-green-dark flex items-center justify-center text-[10px] font-bold">
                  {(currentUser?.first_name?.[0] || currentUser?.username?.[0] || 'L').toUpperCase()}
                </span>
              ) : (
                <UserCircle size={16} weight="regular" />
              )}
              Studio
            </Link>

            <Link to="/contact" className="hidden lg:inline-flex items-center gap-2 bg-lafoi-dark text-white rounded-full px-5 py-2.5 text-sm font-sora font-medium hover:bg-lafoi-green transition-colors">
              Get a quote <ArrowRight size={14} weight="bold" />
            </Link>

            <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className={`lg:hidden ${iconBtn}`}>
              <List size={20} weight="regular" />
            </button>
          </div>
        </div>
      </header>

      {/* Search modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
            <motion.div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
              initial={{ opacity: 0, y: -30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }} transition={{ duration: 0.3, ease: EASE }}>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <MagnifyingGlass size={20} weight="regular" className="text-lafoi-gray shrink-0" />
                <input ref={searchRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pages, services, projects..." className="flex-1 text-base font-general outline-none bg-transparent placeholder:text-gray-300" />
                <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs text-lafoi-gray bg-gray-100 rounded font-mono">ESC</kbd>
              </div>
              {searchResults.length > 0 && (
                <div className="max-h-80 overflow-y-auto py-2">
                  {searchResults.map((result, i) => (
                    <button key={i} onClick={() => goSearch(result.path)} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-lafoi-green/5 transition-colors text-left group">
                      <div className="w-8 h-8 rounded-full bg-lafoi-green/10 flex items-center justify-center shrink-0">
                        <Star size={14} weight="fill" className="text-lafoi-green" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-lafoi-dark group-hover:text-lafoi-green transition-colors">{result.title}</p>
                        <p className="text-xs text-lafoi-gray">{result.section}</p>
                      </div>
                      <ArrowRight size={14} weight="regular" className="ml-auto text-lafoi-gray opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}
              {searchQuery && searchResults.length === 0 && (
                <div className="px-5 py-8 text-center"><p className="text-sm text-lafoi-gray">No results found for "{searchQuery}"</p></div>
              )}
              {!searchQuery && (
                <div className="px-5 py-4">
                  <p className="text-xs text-lafoi-gray mb-2">Quick links</p>
                  <div className="flex flex-wrap gap-2">
                    {['Stretch Ceilings', 'Portfolio', 'Contact', 'Careers'].map((q) => (
                      <button key={q} onClick={() => setSearchQuery(q)} className="px-3 py-1.5 text-xs rounded-full bg-gray-100 text-lafoi-gray hover:bg-lafoi-green/10 hover:text-lafoi-green transition-colors">{q}</button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu — light editorial sheet with the full navigation */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] bg-lafoi-dark/30 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)} />
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3, ease: EASE }}
              className="fixed z-[160] top-3 inset-x-3 rounded-[24px] bg-lafoi-cream border border-lafoi-dark/5 shadow-2xl p-5 lg:hidden max-h-[94vh] flex flex-col">
              <div className="flex items-center justify-between shrink-0">
                <Logo tone="dark" variant="wordmark" imgClassName="h-8 w-auto" />
                <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="w-10 h-10 rounded-full bg-white border border-lafoi-dark/5 flex items-center justify-center text-lafoi-dark">
                  <X size={20} weight="regular" />
                </button>
              </div>

              <nav className="mt-3 flex flex-col overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <Link to="/" onClick={() => setMenuOpen(false)}
                  className={`py-2.5 font-display font-light tracking-[-0.02em] text-[1.7rem] leading-tight border-b border-lafoi-dark/5 transition-colors ${path === '/' ? 'text-lafoi-green' : 'text-lafoi-dark hover:text-lafoi-green'}`}>Home</Link>
                {navGroups.map((group) => (
                  <div key={group.label} className="py-3 border-b border-lafoi-dark/5">
                    <p className="font-sora text-[10px] tracking-[0.25em] uppercase text-lafoi-gray/60 mb-1.5">{group.label}</p>
                    <div className="flex flex-col">
                      {group.items.map((item) => {
                        const act = item.path !== '/' && path.startsWith(item.path)
                        return (
                          <Link key={item.name} to={item.path} onClick={() => setMenuOpen(false)}
                            className={`py-1.5 font-general text-[1.05rem] transition-colors ${act ? 'text-lafoi-green' : 'text-lafoi-dark hover:text-lafoi-green'}`}>{item.name}</Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <Link to="/shop" onClick={() => setMenuOpen(false)}
                  className={`py-2.5 font-display font-light tracking-[-0.02em] text-[1.7rem] leading-tight transition-colors ${shopActive ? 'text-lafoi-green' : 'text-lafoi-dark hover:text-lafoi-green'}`}>Shop</Link>
              </nav>

              <div className="mt-4 shrink-0 flex flex-col gap-2.5">
                <Link to="/contact" onClick={() => setMenuOpen(false)}
                  className="inline-flex w-full items-center justify-center gap-2 bg-lafoi-dark text-white rounded-full px-6 py-3.5 text-sm font-sora font-medium hover:bg-lafoi-green transition-colors">
                  Get a quote <ArrowRight size={15} weight="bold" />
                </Link>
                <Link to={studioPath} onClick={() => setMenuOpen(false)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-lafoi-dark/15 text-lafoi-dark px-6 py-3 text-sm font-sora font-medium hover:border-lafoi-dark/30 hover:text-lafoi-green transition-colors">
                  <UserCircle size={16} weight="regular" /> Studio
                </Link>
              </div>

              <div className="mt-5 shrink-0 pt-4 border-t border-lafoi-dark/5 space-y-2 text-lafoi-gray text-[13px] font-general">
                <div className="flex items-center gap-2.5"><MapPin size={14} className="text-lafoi-green shrink-0" /> Suite 26, 6 Chelmsford Rd, Belgravia, Harare</div>
                <div className="flex items-center gap-2.5"><Phone size={14} className="text-lafoi-green shrink-0" /> +263 782 931 472</div>
                <div className="flex items-center gap-2.5"><Envelope size={14} className="text-lafoi-green shrink-0" /> admin@lafoidesigns.co.zw</div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

/* Editorial-styled dropdown for the sticky pill nav. Click to open, click away
   (or follow a link) to close. */
function PillDropdown({ group, open, onToggle, onClose, pathname }) {
  const ref = useRef(null)
  const activeGroup = group.items.some((it) => it.path !== '/' && pathname.startsWith(it.path))

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, onClose])

  return (
    <div className="relative" ref={ref}>
      <button onClick={onToggle} aria-expanded={open}
        className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-sora transition-colors ${activeGroup || open ? 'bg-lafoi-dark text-white' : 'text-lafoi-gray hover:text-lafoi-dark'}`}>
        {group.label}
        <CaretDown size={13} weight="bold" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50">
            <div className="w-64 bg-white rounded-2xl shadow-xl shadow-black/[0.08] border border-lafoi-dark/5 p-2">
              {group.items.map((item) => (
                <Link key={item.name} to={item.path} onClick={onClose} className="flex items-start gap-3 p-3 rounded-xl hover:bg-lafoi-green/5 transition-colors group">
                  <div className="w-9 h-9 rounded-full bg-lafoi-green/10 flex items-center justify-center shrink-0 group-hover:bg-lafoi-green/20 transition-colors">
                    <item.icon size={16} className="text-lafoi-green" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-lafoi-dark group-hover:text-lafoi-green transition-colors">{item.name}</p>
                    <p className="text-xs text-lafoi-gray mt-0.5">{item.desc}</p>
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
