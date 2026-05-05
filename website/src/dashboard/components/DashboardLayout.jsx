import React, { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  House, UsersThree, Briefcase, Receipt as ReceiptIcon,
  FileText, CurrencyDollar, IdentificationBadge, ChartBarHorizontal,
  SignOut, List, X, MagnifyingGlass, Buildings,
} from '@phosphor-icons/react'

import Logo from '../../components/shared/Logo'
import { logout, selectCurrentUser } from '../store/authSlice'

const NAV = [
  { to: '/dashboard', icon: House, label: 'Overview', end: true },
  { to: '/dashboard/customers', icon: UsersThree, label: 'Customers' },
  { to: '/dashboard/projects', icon: Briefcase, label: 'Projects' },
  { to: '/dashboard/quotations', icon: FileText, label: 'Quotations' },
  { to: '/dashboard/invoices', icon: ReceiptIcon, label: 'Invoices' },
  { to: '/dashboard/receipts', icon: CurrencyDollar, label: 'Receipts' },
  { to: '/dashboard/employees', icon: IdentificationBadge, label: 'Employees' },
  { to: '/dashboard/payroll', icon: ChartBarHorizontal, label: 'Payroll' },
]

export default function DashboardLayout() {
  const user = useSelector(selectCurrentUser)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

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

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-sora ${
                  isActive
                    ? 'bg-lafoi-green/20 text-white'
                    : 'text-white/65 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={18} weight="regular" />
              <span>{label}</span>
            </NavLink>
          ))}
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
