import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

import { logout } from '../store/authSlice'
import SystemSuspended from '../pages/SystemSuspended'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

/**
 * Wraps the whole dashboard (login + authed routes). On mount, and every 30s,
 * it asks the backend whether the platform is suspended. If it is, it clears
 * any stored session (logged-in users are dropped) and renders the suspension
 * screen in place of everything else.
 *
 * The backend env var SYSTEM_SUSPENDED is the single source of truth — this
 * gate only reflects it, so flipping that var off restores the app with no
 * frontend redeploy. A failed status check is treated as "not suspended" so a
 * transient network blip never locks anyone out.
 */
export default function SuspensionGate({ children }) {
  const dispatch = useDispatch()
  const [state, setState] = useState('checking') // 'checking' | 'ok' | 'suspended'

  useEffect(() => {
    let alive = true
    const check = () => {
      fetch(`${API_BASE}/system/status`, { headers: { Accept: 'application/json' } })
        .then((r) => (r.ok ? r.json() : { suspended: false }))
        .then((d) => { if (alive) setState(d?.suspended ? 'suspended' : 'ok') })
        .catch(() => { if (alive) setState('ok') })
    }
    check()
    const id = setInterval(check, 30000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  useEffect(() => {
    if (state === 'suspended') dispatch(logout())
  }, [state, dispatch])

  if (state === 'checking') return null
  if (state === 'suspended') return <SystemSuspended />
  return children
}
