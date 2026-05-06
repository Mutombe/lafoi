import React, { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  House, UsersThree, Briefcase, Receipt as ReceiptIcon,
  FileText, CurrencyDollar, IdentificationBadge, ChartBarHorizontal,
  SignOut, List, X, Buildings, Gavel,
  Bank, Tray, CalendarStar, MapPin, UsersFour,
  CaretDown, Storefront, Coins, IdentificationCard, GearSix,
} from '@phosphor-icons/react'

import Logo from '../../components/shared/Logo'
import { logout, selectCurrentUser } from '../store/authSlice'
import { api } from '../store/api'

/**
 * Sidebar IA — categorised so users aren't faced with a flat 14-item list.
 *
 *   Overview              (always pinned at top, no group)
 *   ── Sales              Customers · Projects · Studio map
 *   ── Billing            Quotations · Invoices · Receipts
 *   ── Team               Employees · Payroll · Loans · Leave · Holidays
 *   ── Settings           Tax & Compliance · Users
 *
 * Each group can collapse. Active route auto-expands its group. Open/closed
 * state is persisted to localStorage so navigating around doesn't keep
 * collapsing things the user just opened.
 */

const PINNED = { to: '/dashboard', icon: House, label: 'Overview', end: true }

const GROUPS = [
  {
    key: 'sales',
    label: 'Sales',
    icon: Storefront,
    items: [
      { to: '/dashboard/customers', icon: UsersThree, label: 'Customers',  module: 'customers' },
      { to: '/dashboard/projects',  icon: Briefcase,  label: 'Projects',   module: 'projects' },
      { to: '/dashboard/map',       icon: MapPin,     label: 'Studio map', module: 'map' },
    ],
  },
  {
    key: 'billing',
    label: 'Billing',
    icon: Coins,
    items: [
      { to: '/dashboard/quotations', icon: FileText,        label: 'Quotations', module: 'quotations' },
      { to: '/dashboard/invoices',   icon: ReceiptIcon,     label: 'Invoices',   module: 'invoices' },
      { to: '/dashboard/receipts',   icon: CurrencyDollar,  label: 'Receipts',   module: 'receipts' },
    ],
  },
  {
    key: 'team',
    label: 'Team',
    icon: IdentificationCard,
    items: [
      { to: '/dashboard/employees', icon: IdentificationBadge,  label: 'Employees', module: 'employees' },
      { to: '/dashboard/payroll',   icon: ChartBarHorizontal,   label: 'Payroll',   module: 'payroll' },
      { to: '/dashboard/loans',     icon: Bank,                 label: 'Loans',     module: 'loans' },
      { to: '/dashboard/leave',     icon: Tray,                 label: 'Leave',     module: 'leave' },
      { to: '/dashboard/holidays',  icon: CalendarStar,         label: 'Holidays',  module: 'holidays' },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: GearSix,
    items: [
      { to: '/dashboard/settings/compliance', icon: Gavel,      label: 'Tax & Compliance', adminOnly: true },
      { to: '/dashboard/users',               icon: UsersFour,  label: 'Users',            adminOnly: true },
    ],
  },
]

const STORAGE_KEY = 'lafoi.dashboard.nav.v1'

function readPersistedOpen() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writePersistedOpen(state) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
}

export default function DashboardLayout() {
  const user = useSelector(selectCurrentUser)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Filter groups based on user permissions, dropping items the user can't see
  // and groups that have no remaining items.
  const visibleGroups = useMemo(() => {
    const isAdmin = user?.role === 'admin' || user?.is_superuser
    return GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((item) => {
        if (item.adminOnly) return isAdmin
        if (item.module && !isAdmin) return Boolean(user?.module_access?.[item.module])
        return true
      }),
    })).filter((g) => g.items.length > 0)
  }, [user])

  // Determine which group contains the active route — that one auto-expands.
  const activeGroupKey = useMemo(() => {
    for (const g of visibleGroups) {
      if (g.items.some((i) => location.pathname.startsWith(i.to))) return g.key
    }
    return null
  }, [visibleGroups, location.pathname])

  // Open/closed state per group key, persisted across reloads. Active group
  // is forced open (overrides whatever was in localStorage).
  const [openMap, setOpenMap] = useState(() => {
    const persisted = readPersistedOpen() || {}
    // Default: open all groups on first run for discoverability.
    return { sales: true, billing: true, team: true, settings: true, ...persisted }
  })
  useEffect(() => {
    if (activeGroupKey) {
      setOpenMap((m) => (m[activeGroupKey] ? m : { ...m, [activeGroupKey]: true }))
    }
  }, [activeGroupKey])
  useEffect(() => { writePersistedOpen(openMap) }, [openMap])

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  // Warm-prefetch every list endpoint as soon as the dashboard mounts.
  useEffect(() => {
    const prefetches = [
      ['listCustomers', { page: 1 }],
      ['listProjects', { page: 1 }],
      ['listQuotations', { page: 1 }],
      ['listInvoices', { page: 1 }],
      ['listReceipts', { page: 1 }],
      ['listEmployees', { page: 1 }],
      ['listPayrollPeriods', { page: 1 }],
    ]
    const promises = prefetches.map(([endpoint, args]) =>
      dispatch(api.util.prefetch(endpoint, args, { force: false })),
    )
    return () => {
      promises.forEach((p) => { try { p?.abort?.() } catch {} })
    }
  }, [dispatch])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/dashboard/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-lafoi-cream text-lafoi-dark flex font-body">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-50 w-72 bg-lafoi-dark text-white flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="px-6 pt-7 pb-6 border-b border-white/8">
          <Link to="/" className="flex items-center gap-3">
            <Logo tone="light" imgClassName="h-8 w-auto" />
          </Link>
          <p className="mt-3 font-sora text-[9px] tracking-[0.32em] uppercase text-white/40">
            Studio dashboard
          </p>
        </div>

        {/* User card */}
        <div className="px-6 py-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-lafoi-green/25 border border-lafoi-green/40 flex items-center justify-center font-display text-lg text-lafoi-green-light">
              {user?.first_name?.[0] || user?.username?.[0] || 'L'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sora text-sm font-medium text-white truncate">{user?.display_name || user?.username || '—'}</p>
              <p className="text-[10px] tracking-[0.22em] uppercase text-white/40 mt-0.5 truncate">{user?.role || 'staff'}</p>
            </div>
          </div>
        </div>

        {/* Nav — pinned Overview, then collapsible category groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {/* Pinned: Overview */}
          <NavLink
            to={PINNED.to}
            end={PINNED.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-sora ${
                isActive ? 'bg-lafoi-green/20 text-white' : 'text-white/65 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <PINNED.icon size={18} weight="regular" />
            <span>{PINNED.label}</span>
          </NavLink>

          {/* Categorised groups */}
          {visibleGroups.map((group) => {
            const isOpen = !!openMap[group.key]
            const Icon = group.icon
            return (
              <div key={group.key} className="pt-3">
                <button
                  type="button"
                  onClick={() => setOpenMap((m) => ({ ...m, [group.key]: !m[group.key] }))}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 group"
                  aria-expanded={isOpen}
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-md bg-white/5 text-white/55 group-hover:text-white/80">
                    <Icon size={12} weight="regular" />
                  </span>
                  <span className="flex-1 text-left font-sora text-[10px] tracking-[0.32em] uppercase text-white/45 group-hover:text-white/65 transition-colors">
                    {group.label}
                  </span>
                  <CaretDown
                    size={11}
                    weight="bold"
                    className={`text-white/40 group-hover:text-white/70 transition-transform duration-300 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="open"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1 pl-2 ml-2 border-l border-white/8 space-y-0.5">
                        {group.items.map(({ to, icon: ItemIcon, label }) => (
                          <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                              `flex items-center gap-3 pl-4 pr-3 py-2 rounded-lg transition-colors text-[13px] font-sora ${
                                isActive
                                  ? 'bg-lafoi-green/20 text-white'
                                  : 'text-white/60 hover:text-white hover:bg-white/5'
                              }`
                            }
                          >
                            <ItemIcon size={15} weight="regular" />
                            <span>{label}</span>
                          </NavLink>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/65 hover:text-white hover:bg-white/5 transition-colors text-sm font-sora"
          >
            <SignOut size={18} weight="regular" />
            <span>Sign out</span>
          </button>
          <Link
            to="/"
            className="mt-1 block px-3 py-2 text-[10px] tracking-[0.25em] uppercase text-white/35 hover:text-white/70 transition-colors"
          >
            ← Back to public site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-lafoi-cream/95 backdrop-blur border-b border-lafoi-dark/8">
          <div className="flex items-center gap-3 px-4 lg:px-8 h-16">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-lafoi-dark/5"
              aria-label="Open menu"
            >
              <List size={20} />
            </button>
            <div className="flex items-center gap-2 text-lafoi-gray-medium text-xs font-sora tracking-[0.2em] uppercase">
              <Buildings size={14} />
              <span className="hidden sm:inline">La Foi Designs · Studio dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </div>
            <div className="flex-1" />
            <Link
              to="/dashboard/projects?status=in_progress"
              className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-sora bg-lafoi-green-light/10 text-lafoi-green-dark border border-lafoi-green/20 hover:bg-lafoi-green-light/20 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-lafoi-green-light animate-pulse" />
              In progress projects
            </Link>
          </div>
        </header>

        {/* Page content */}
        <div className="px-4 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
