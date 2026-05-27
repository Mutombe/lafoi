import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadow from 'leaflet/dist/images/marker-shadow.png'
import { MagnifyingGlass, MapPin, ArrowRight, Compass, ArrowsOutSimple, ArrowsInSimple, X as XIcon } from '@phosphor-icons/react'

import PageHeader from '../components/PageHeader'
import { StatusBadge, STATUS_PALETTE_PROJECT } from '../components/DataTable'
import Skeleton from '../components/Skeleton'
import { useProjectsMapQuery } from '../store/api'

// Critical Vite fix for Leaflet's missing default marker icon paths
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl: iconRetina, iconUrl, shadowUrl: shadow })

const HARARE = [-17.8252, 31.0335]

// Maps project status → solid hex for the marker dot
const STATUS_HEX = {
  lead: '#9CA3AF',
  quoted: '#D97706',
  approved: '#2563EB',
  in_progress: '#1A8A2E',
  on_hold: '#9333EA',
  completed: '#15572E',
  cancelled: '#DC2626',
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'on_hold', label: 'On hold' },
]

/**
 * Custom div-icon: a status-coloured progress ring with the percentage
 * number rendered inside. The ring's filled arc and the text both share
 * the status colour so the marker reads at a glance.
 */
function buildMarkerIcon(status, progress = 0) {
  const color = STATUS_HEX[status] || '#1A8A2E'
  const safe = Math.max(0, Math.min(100, Math.round(Number(progress) || 0)))
  const size = 42
  const cx = size / 2
  const r = 16
  const c = 2 * Math.PI * r
  const offset = c - (safe / 100) * c
  // Slightly smaller text at 100% so "100%" doesn't overflow the ring.
  const fontSize = safe >= 100 ? 10 : 11
  const html = `
    <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.18));">
      <svg width="${size}" height="${size}" style="position:absolute;inset:0;transform:rotate(-90deg);">
        <circle cx="${cx}" cy="${cx}" r="${r}" fill="white" stroke="rgba(17,17,17,0.08)" stroke-width="3"/>
        <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${color}" stroke-width="3"
          stroke-linecap="round"
          stroke-dasharray="${c}" stroke-dashoffset="${offset}"/>
      </svg>
      <span style="position:relative;font-family:'Sora',system-ui,-apple-system,sans-serif;font-size:${fontSize}px;font-weight:600;color:${color};line-height:1;letter-spacing:-0.02em;">${safe}%</span>
    </div>
  `
  return L.divIcon({
    className: 'lafoi-map-marker',
    html,
    iconSize: [size, size],
    iconAnchor: [cx, cx],
    popupAnchor: [0, -(cx - 4)],
  })
}

/** Inner component – fly to selected project when it changes + resize on
 *  fullscreen toggle. */
function MapController({ selected, fullscreen }) {
  const map = useMap()
  useEffect(() => {
    if (selected?.latitude && selected?.longitude) {
      map.flyTo([Number(selected.latitude), Number(selected.longitude)], 14, { duration: 1.2 })
    }
  }, [selected, map])
  useEffect(() => {
    // Leaflet doesn't auto-recalc tile area when its container resizes; nudge it.
    const id = setTimeout(() => map.invalidateSize(), 220)
    return () => clearTimeout(id)
  }, [fullscreen, map])
  return null
}

export default function StudioMap() {
  const { data, isLoading } = useProjectsMapQuery()
  const projects = useMemo(() => data || [], [data])

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [fullscreen, setFullscreen] = useState(false)

  // ESC to exit fullscreen + lock body scroll while expanded
  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e) => { if (e.key === 'Escape') setFullscreen(false) }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [fullscreen])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return projects.filter((p) => {
      if (filter !== 'all' && p.status !== filter) return false
      if (q) {
        const hay = `${p.title || ''} ${p.code || ''} ${p.customer_name || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [projects, search, filter])

  return (
    <div>
      <PageHeader
        eyebrow="Studio map"
        title="Where we’re building, right now."
        description="Every project with a fixed pin is mapped here. Status colour signals stage — the ring shows live progress."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT — sidebar list */}
        <aside className="lg:col-span-4 xl:col-span-4 flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlass size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lafoi-gray-medium" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code, customer"
              className="w-full pl-10 pr-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-sora tracking-[0.18em] uppercase transition-colors border ${
                  filter === f.key
                    ? 'bg-lafoi-dark text-white border-lafoi-dark'
                    : 'bg-white text-lafoi-gray border-lafoi-dark/12 hover:border-lafoi-green hover:text-lafoi-green'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="rounded-2xl border border-lafoi-dark/10 bg-white overflow-hidden">
            {isLoading ? (
              <ul className="divide-y divide-lafoi-dark/[0.06]">
                {Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className="px-4 py-3 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-1.5 w-full" />
                  </li>
                ))}
              </ul>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <MapPin size={28} className="mx-auto text-lafoi-gray-medium" />
                <p className="mt-3 font-sora text-sm font-medium text-lafoi-dark">
                  {projects.length === 0 ? 'No projects pinned yet' : 'Nothing matches'}
                </p>
                <p className="mt-1 text-xs text-lafoi-gray-medium">
                  {projects.length === 0
                    ? 'Edit a project and add latitude/longitude to drop a pin here.'
                    : 'Try a different search term or status filter.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-lafoi-dark/[0.06] max-h-[640px] overflow-y-auto">
                {filtered.map((p) => {
                  const isSel = selected?.id === p.id
                  const dot = STATUS_HEX[p.status] || '#1A8A2E'
                  return (
                    <li
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className={`px-4 py-3 cursor-pointer transition-colors ${
                        isSel ? 'bg-lafoi-green/8' : 'hover:bg-lafoi-cream/60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: dot, boxShadow: `0 0 0 3px ${dot}1F` }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium">{p.code}</p>
                            <Link
                              to={`/dashboard/projects/${p.id}`}
                              className="text-[10px] tracking-[0.22em] uppercase text-lafoi-green hover:text-lafoi-green-dark inline-flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View <ArrowRight size={10} />
                            </Link>
                          </div>
                          <p className="mt-0.5 font-sora text-sm font-medium text-lafoi-dark truncate">{p.title}</p>
                          <p className="text-xs text-lafoi-gray-medium truncate">{p.customer_name || '—'}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-1 rounded-full bg-lafoi-dark/8 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.max(0, Math.min(100, p.progress || 0))}%`,
                                  background: dot,
                                }}
                              />
                            </div>
                            <span className="text-[10px] font-sora tabular-nums w-9 text-right text-lafoi-gray">
                              {p.progress ?? 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <p className="text-[10px] tracking-[0.22em] uppercase font-sora text-lafoi-gray-medium flex items-center gap-1.5">
            <Compass size={12} /> {filtered.length} of {projects.length} pinned
          </p>
        </aside>

        {/* RIGHT — map */}
        <section className={fullscreen ? 'lg:col-span-12' : 'lg:col-span-8 xl:col-span-8'}>
          <div
            className={
              fullscreen
                ? 'fixed inset-0 z-[1000] bg-white border-0 rounded-none shadow-2xl'
                : 'sticky top-20 rounded-2xl border border-lafoi-dark/10 bg-white overflow-hidden shadow-[0_2px_12px_rgba(17,17,17,0.04)]'
            }
            style={fullscreen ? { width: '100vw', height: '100vh' } : { height: 'calc(100vh - 8rem)', minHeight: 480 }}
          >
            {/* Floating fullscreen toggle — top-right of the map. Lives outside Leaflet's z-index stack via z-[1100]. */}
            <button
              type="button"
              onClick={() => setFullscreen((v) => !v)}
              className="absolute top-3 right-3 z-[1100] flex items-center gap-2 px-3 py-2 rounded-full bg-white/95 backdrop-blur-sm border border-lafoi-dark/15 text-lafoi-dark hover:border-lafoi-green hover:text-lafoi-green transition-colors text-xs font-sora shadow-md"
              title={fullscreen ? 'Exit fullscreen (Esc)' : 'Expand to fullscreen'}
            >
              {fullscreen ? <ArrowsInSimple size={14} weight="bold" /> : <ArrowsOutSimple size={14} weight="bold" />}
              <span className="hidden sm:inline">{fullscreen ? 'Exit fullscreen' : 'Fullscreen'}</span>
            </button>
            {fullscreen && (
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                className="absolute top-3 left-3 z-[1100] flex items-center gap-2 px-3 py-2 rounded-full bg-white/95 backdrop-blur-sm border border-lafoi-dark/15 text-lafoi-dark hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors text-xs font-sora shadow-md"
                aria-label="Close fullscreen"
              >
                <XIcon size={14} weight="bold" />
                <span className="hidden sm:inline">Close</span>
              </button>
            )}
            <MapContainer
              center={HARARE}
              zoom={11}
              scrollWheelZoom
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController selected={selected} fullscreen={fullscreen} />
              {filtered.map((p) => {
                if (p.latitude == null || p.longitude == null) return null
                return (
                  <Marker
                    key={p.id}
                    position={[Number(p.latitude), Number(p.longitude)]}
                    icon={buildMarkerIcon(p.status, p.progress)}
                    eventHandlers={{ click: () => setSelected(p) }}
                  >
                    <Popup>
                      <div className="font-body" style={{ minWidth: 200 }}>
                        <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium">{p.code}</p>
                        <p className="font-sora text-sm font-medium text-lafoi-dark mt-0.5">{p.title}</p>
                        <p className="text-xs text-lafoi-gray mt-0.5">{p.customer_name}</p>
                        <div className="mt-2"><StatusBadge status={p.status} palette={STATUS_PALETTE_PROJECT} /></div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[10px] tracking-[0.18em] uppercase font-sora text-lafoi-gray-medium mb-1">
                            <span>Progress</span><span>{p.progress ?? 0}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-lafoi-dark/8 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.max(0, Math.min(100, p.progress || 0))}%`,
                                background: STATUS_HEX[p.status] || '#1A8A2E',
                              }}
                            />
                          </div>
                        </div>
                        <Link
                          to={`/dashboard/projects/${p.id}`}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-sora tracking-[0.18em] uppercase text-lafoi-green hover:text-lafoi-green-dark"
                        >
                          Open project <ArrowRight size={11} />
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          </div>
        </section>
      </div>
    </div>
  )
}
