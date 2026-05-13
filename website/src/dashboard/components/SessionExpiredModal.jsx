import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, CircleNotch, SignOut } from '@phosphor-icons/react'
import { toast } from 'sonner'

import { Field, Input, PrimaryButton, SecondaryButton } from './FormField'
import {
  logout,
  selectCurrentUser,
  selectSessionExpired,
  setCredentials,
} from '../store/authSlice'
import { api, useLoginMutation } from '../store/api'

/**
 * Global re-login overlay. Appears whenever an auth refresh fails server-
 * side — the rest of the dashboard stays mounted underneath so any open
 * modals, form drafts and scrolled positions survive. Once the user signs
 * back in we refresh the RTK Query cache so previously-failed queries
 * automatically refetch.
 *
 * Mounted once at the layout root via `<SessionExpiredModal />`; selects
 * its own visibility from auth.sessionExpired.
 */
export default function SessionExpiredModal() {
  const open = useSelector(selectSessionExpired)
  const user = useSelector(selectCurrentUser)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [login, { isLoading }] = useLoginMutation()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  // Focus the password field whenever the modal opens — the username is
  // already known, so the user only needs to type their password.
  useEffect(() => {
    if (open) {
      setPassword('')
      setError('')
      // Give the modal a frame to mount before focusing.
      const t = setTimeout(() => inputRef.current?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const result = await login({ username: user?.username, password }).unwrap()
      dispatch(setCredentials({
        access: result.access,
        refresh: result.refresh,
        user: result.user,
      }))
      // Drop every cached query so subscribers refetch under the new token.
      // Components keep their local state; only the server-derived data
      // refreshes.
      dispatch(api.util.resetApiState())
      toast.success('Welcome back', { description: 'Pick up where you left off.' })
    } catch (err) {
      const msg = err?.data?.detail
        || (err?.data && Object.values(err.data).flat().join(' '))
        || 'Sign-in failed. Check your password and try again.'
      setError(msg)
    }
  }

  const handleSignOut = () => {
    dispatch(logout())
    dispatch(api.util.resetApiState())
    navigate('/dashboard/login', { replace: true })
  }

  if (typeof window === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="session-expired-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[300] bg-lafoi-dark/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-6"
        >
          <motion.div
            key="session-expired-panel"
            initial={{ y: 16, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md rounded-3xl bg-white shadow-[0_24px_60px_-20px_rgba(17,17,17,0.35)] border border-lafoi-dark/10 overflow-hidden"
          >
            <div className="px-6 sm:px-7 pt-7 pb-2 flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-lafoi-green/15 text-lafoi-green-dark flex items-center justify-center shrink-0">
                <Lock size={20} weight="bold" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-sora text-[10px] tracking-[0.32em] uppercase text-lafoi-gray-medium">
                  Session expired
                </p>
                <p className="mt-1 font-display text-2xl text-lafoi-dark">
                  Sign in again to continue
                </p>
                <p className="mt-1.5 text-sm text-lafoi-gray font-body">
                  Your work is safe — nothing was lost. Pop your password back in and you'll resume right where you left off.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-6 sm:px-7 pt-3 pb-6 grid gap-3">
              <Field label="Signed in as">
                <Input
                  value={user?.email || user?.username || ''}
                  readOnly
                  className="!bg-lafoi-cream/60 !text-lafoi-gray"
                />
              </Field>
              <Field label="Password" required>
                <Input
                  ref={inputRef}
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </Field>

              {error && (
                <div className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm font-body">
                  {error}
                </div>
              )}

              <div className="mt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-sora tracking-[0.16em] uppercase text-lafoi-gray-medium hover:text-red-600 transition-colors"
                >
                  <SignOut size={12} /> Sign out instead
                </button>
                <PrimaryButton type="submit" disabled={isLoading || !password}>
                  {isLoading
                    ? <><CircleNotch size={14} className="animate-spin" /> Signing in…</>
                    : 'Sign back in'}
                </PrimaryButton>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
