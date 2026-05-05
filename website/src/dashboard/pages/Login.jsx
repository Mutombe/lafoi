import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeSlash, LockKey, User as UserIcon } from '@phosphor-icons/react'

import Logo from '../../components/shared/Logo'
import { useLoginMutation } from '../store/api'
import { selectIsAuthenticated, setCredentials } from '../store/authSlice'

export default function Login() {
  const isAuth = useSelector(selectIsAuthenticated)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')

  const [login, { isLoading }] = useLoginMutation()

  if (isAuth) return <Navigate to={from} replace />

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const data = await login({ username, password }).unwrap()
      dispatch(setCredentials({ access: data.access, refresh: data.refresh, user: data.user }))
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err?.data?.detail || err?.error || 'Sign-in failed. Check your credentials.'
      setError(msg)
    }
  }

  return (
    <div className="min-h-screen bg-lafoi-dark text-white grid lg:grid-cols-2">
      {/* Left — branded panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 mesh-gradient-hero pointer-events-none opacity-60" />
        <div className="absolute inset-0 dot-pattern opacity-20 pointer-events-none" />

        <div className="relative z-10">
          <Logo tone="light" imgClassName="h-10 w-auto" />
          <p className="mt-3 font-sora text-[10px] tracking-[0.32em] uppercase text-white/45">
            Studio dashboard · Belgravia, Harare
          </p>
        </div>

        <div className="relative z-10 max-w-md">
          <p className="font-sora text-[10px] tracking-[0.32em] uppercase text-lafoi-green-light mb-5">
            Tools for the studio
          </p>
          <h1 className="font-display text-5xl xl:text-6xl leading-[1.05] tracking-[-0.02em]">
            Customers, projects,
            <br />
            <span className="font-light italic text-lafoi-green-light">quotes &amp; payroll.</span>
          </h1>
          <p className="mt-5 text-white/60 font-light leading-relaxed">
            Sign in to manage every La&nbsp;Foi project from concept to invoice — and keep the studio paid.
          </p>
        </div>

        <div className="relative z-10 text-[11px] font-sora tracking-[0.22em] uppercase text-white/30">
          © {new Date().getFullYear()} La Foi Designs · admin@lafoidesigns.co.zw
        </div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-lafoi-cream text-lafoi-dark">
        <form onSubmit={onSubmit} className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo tone="dark" imgClassName="h-8 w-auto" />
          </div>

          <div className="flex items-center gap-3 mb-3">
            <span className="block w-10 h-px bg-lafoi-green/60" />
            <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
              Sign in
            </p>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl tracking-tight mb-6">
            Welcome back to <span className="italic text-lafoi-green">the studio</span>.
          </h2>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <label className="block mb-4">
            <span className="block font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray mb-2">Username</span>
            <span className="relative block">
              <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lafoi-gray-medium" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none focus:ring-2 focus:ring-lafoi-green/15 font-body text-sm transition"
                placeholder="admin"
              />
            </span>
          </label>

          <label className="block mb-6">
            <span className="block font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray mb-2">Password</span>
            <span className="relative block">
              <LockKey size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lafoi-gray-medium" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none focus:ring-2 focus:ring-lafoi-green/15 font-body text-sm transition"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                aria-label="Toggle password visibility"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-lafoi-gray-medium hover:text-lafoi-dark"
              >
                {showPwd ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-full bg-lafoi-dark text-white hover:bg-lafoi-green transition-colors font-sora text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
            <ArrowRight size={15} weight="bold" className="group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="mt-6 text-center text-xs text-lafoi-gray-medium">
            Trouble signing in? <a href="mailto:admin@lafoidesigns.co.zw" className="prose-link">admin@lafoidesigns.co.zw</a>
          </p>
          <div className="mt-3 text-center">
            <Link to="/" className="text-xs text-lafoi-gray-medium hover:text-lafoi-dark">← Back to public site</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
