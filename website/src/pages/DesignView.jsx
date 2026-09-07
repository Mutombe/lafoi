import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

/**
 * Public, view-only design viewer. No auth. The server delivers every asset
 * re-encoded + watermarked with the client's name baked into the pixels, so
 * screenshots or screen-photos still carry the mark. This page adds a second,
 * live watermark overlay (client name + timestamp) and disables the obvious
 * save affordances (right-click, drag, Ctrl+S/P, image dragging). None of
 * this is DRM — the honest protection is the baked-in watermark + the fact
 * that the original file is never sent to the browser.
 */
export default function DesignView() {
  const { token } = useParams()
  const [meta, setMeta] = useState(null)
  const [status, setStatus] = useState('loading') // loading|active|locked|error
  const [errKind, setErrKind] = useState('')
  const [vt, setVt] = useState('')
  const [passcode, setPasscode] = useState('')
  const [unlocking, setUnlocking] = useState(false)
  const [unlockErr, setUnlockErr] = useState('')
  const [active, setActive] = useState(0) // active file index

  const loadMeta = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/share/${token}/meta/`)
      if (res.status === 404) { setStatus('error'); setErrKind('not_found'); return }
      const data = await res.json()
      if (data.status !== 'active') { setStatus('error'); setErrKind(data.status || 'unavailable'); return }
      setMeta(data)
      setStatus(data.require_passcode ? 'locked' : 'active')
    } catch {
      setStatus('error'); setErrKind('network')
    }
  }, [token])

  useEffect(() => { loadMeta() }, [loadMeta])

  const unlock = async (e) => {
    e.preventDefault()
    setUnlocking(true); setUnlockErr('')
    try {
      const res = await fetch(`${API_BASE}/share/${token}/verify/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      })
      const data = await res.json()
      if (data.ok) { setVt(data.vt); setStatus('active') }
      else setUnlockErr(data.detail || 'Incorrect passcode.')
    } catch {
      setUnlockErr('Could not verify. Try again.')
    } finally {
      setUnlocking(false)
    }
  }

  // ---- lockdown handlers ----
  useEffect(() => {
    const noContext = (e) => { e.preventDefault(); return false }
    const onKey = (e) => {
      const k = (e.key || '').toLowerCase()
      if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'u'].includes(k)) { e.preventDefault(); return false }
      // PrintScreen — can't truly block, but clear the clipboard as a nudge
      if (k === 'printscreen') { try { navigator.clipboard?.writeText(''); } catch {} }
    }
    document.addEventListener('contextmenu', noContext)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('contextmenu', noContext)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const assetUrl = (file, page) => {
    const q = new URLSearchParams()
    if (vt) q.set('vt', vt)
    if (page != null) q.set('page', String(page))
    const qs = q.toString()
    return `${API_BASE}/share/${token}/asset/${file.id}/${qs ? `?${qs}` : ''}`
  }

  const wmText = meta?.client_name ? `${meta.client_name} · La Foi Designs · CONFIDENTIAL` : 'La Foi Designs · CONFIDENTIAL'

  if (status === 'loading') return <Shell><div style={S.dim}>Loading preview…</div></Shell>

  if (status === 'error') {
    const msg = {
      not_found: 'This link is not valid.',
      revoked: 'This link has been revoked by La Foi Designs.',
      expired: 'This link has expired.',
      network: 'Could not reach the server. Check your connection and reload.',
    }[errKind] || 'This preview is unavailable.'
    return <Shell><div style={S.card}><div style={S.brand}>La Foi Designs</div><div style={S.msg}>{msg}</div></div></Shell>
  }

  if (status === 'locked') {
    return (
      <Shell>
        <form onSubmit={unlock} style={S.card}>
          <div style={S.brand}>La Foi Designs</div>
          <div style={{ ...S.msg, marginBottom: 18 }}>{meta?.title || 'Design preview'}</div>
          <label style={S.label}>Enter the passcode you were given</label>
          <input
            type="password" value={passcode} autoFocus
            onChange={(e) => setPasscode(e.target.value)}
            style={S.input} placeholder="Passcode"
          />
          {unlockErr && <div style={S.err}>{unlockErr}</div>}
          <button type="submit" disabled={unlocking || !passcode} style={S.btn}>
            {unlocking ? 'Checking…' : 'View design'}
          </button>
        </form>
      </Shell>
    )
  }

  // active
  const files = meta?.files || []
  const file = files[active]

  return (
    <Shell wm={wmText}>
      <div style={S.topbar}>
        <div style={S.brand}>La Foi Designs</div>
        <div style={S.title}>{meta?.title}{meta?.project_title ? ` — ${meta.project_title}` : ''}</div>
        <div style={S.viewonly}>VIEW ONLY</div>
      </div>

      {files.length > 1 && (
        <div style={S.tabs}>
          {files.map((f, i) => (
            <button key={f.id} onClick={() => setActive(i)}
              style={{ ...S.tab, ...(i === active ? S.tabActive : {}) }}>
              {f.title || `${f.kind} ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      <div style={S.stage}>
        {file && <AssetView file={file} assetUrl={assetUrl} wmText={wmText} />}
      </div>

      <div style={S.footer}>
        These designs are the confidential property of La Foi Designs and are licensed to {meta?.client_name || 'the named client'} for review only.
      </div>
    </Shell>
  )
}

function AssetView({ file, assetUrl, wmText }) {
  if (file.kind === 'image') {
    return <ProtectedImg src={assetUrl(file)} alt="" />
  }
  if (file.kind === 'pdf') {
    return <PdfPages file={file} assetUrl={assetUrl} />
  }
  if (file.kind === 'video') {
    return (
      <video
        src={assetUrl(file)} controls controlsList="nodownload noplaybackrate"
        disablePictureInPicture onContextMenu={(e) => e.preventDefault()}
        style={{ maxWidth: '100%', maxHeight: '78vh', borderRadius: 8 }}
      />
    )
  }
  return <div style={S.dim}>Unsupported item.</div>
}

function ProtectedImg({ src, alt }) {
  return (
    <img
      src={src} alt={alt} draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      style={{ maxWidth: '100%', maxHeight: '80vh', userSelect: 'none', WebkitUserDrag: 'none', borderRadius: 6, boxShadow: '0 24px 60px rgba(0,0,0,.5)' }}
    />
  )
}

function PdfPages({ file, assetUrl }) {
  const pages = file.pages || 1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', overflowY: 'auto', maxHeight: '82vh', width: '100%' }}>
      {Array.from({ length: pages }).map((_, i) => (
        <ProtectedImg key={i} src={assetUrl(file, i)} alt={`Page ${i + 1}`} />
      ))}
    </div>
  )
}

function Shell({ children, wm }) {
  const tiles = useMemo(() => (wm ? Array.from({ length: 60 }) : []), [wm])
  return (
    <div style={S.root}>
      {children}
      {wm && (
        <div style={S.wmLayer} aria-hidden>
          {tiles.map((_, i) => (
            <span key={i} style={S.wmText}>{wm}</span>
          ))}
        </div>
      )}
    </div>
  )
}

const S = {
  root: {
    position: 'fixed', inset: 0, background: '#0d0f0e', color: '#e8eae7',
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", display: 'flex',
    flexDirection: 'column', overflow: 'hidden',
  },
  topbar: { display: 'flex', alignItems: 'center', gap: 16, padding: '14px 22px', borderBottom: '1px solid rgba(255,255,255,.08)' },
  brand: { fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', fontSize: 13, color: '#c9a44c' },
  title: { flex: 1, fontSize: 14, color: '#e8eae7', opacity: .85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  viewonly: { fontSize: 11, fontWeight: 700, letterSpacing: '.18em', color: '#0d0f0e', background: '#c9a44c', padding: '4px 10px', borderRadius: 4 },
  tabs: { display: 'flex', gap: 8, padding: '10px 22px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,.05)' },
  tab: { background: 'transparent', color: '#9aa09a', border: '1px solid rgba(255,255,255,.14)', borderRadius: 20, padding: '5px 14px', fontSize: 12, cursor: 'pointer', textTransform: 'capitalize' },
  tabActive: { background: '#c9a44c', color: '#0d0f0e', borderColor: '#c9a44c', fontWeight: 600 },
  stage: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', zIndex: 1 },
  footer: { padding: '10px 22px', fontSize: 11, color: '#6f746e', borderTop: '1px solid rgba(255,255,255,.06)', textAlign: 'center' },
  wmLayer: {
    position: 'fixed', inset: 0, zIndex: 5, pointerEvents: 'none',
    display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', gap: '38px 26px',
    transform: 'rotate(-28deg) scale(1.5)', transformOrigin: 'center', opacity: .1, overflow: 'hidden',
  },
  wmText: { fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', letterSpacing: '.04em' },
  card: { margin: 'auto', maxWidth: 380, width: '90%', background: '#141715', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: 32, textAlign: 'center', zIndex: 10 },
  msg: { fontSize: 15, color: '#cfd2ce', marginTop: 10 },
  label: { display: 'block', fontSize: 12, color: '#9aa09a', textAlign: 'left', marginBottom: 6 },
  input: { width: '100%', boxSizing: 'border-box', background: '#0d0f0e', border: '1px solid rgba(255,255,255,.16)', borderRadius: 8, padding: '11px 13px', color: '#fff', fontSize: 14, marginBottom: 12 },
  err: { color: '#e77', fontSize: 12, marginBottom: 10, textAlign: 'left' },
  btn: { width: '100%', background: '#c9a44c', color: '#0d0f0e', fontWeight: 700, border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, cursor: 'pointer' },
  dim: { color: '#7a7f79', margin: 'auto', fontSize: 14 },
}
