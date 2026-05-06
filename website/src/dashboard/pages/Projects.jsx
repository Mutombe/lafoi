import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash, PencilSimple, MagnifyingGlass, Eye, CircleNotch, MapPin } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadow from 'leaflet/dist/images/marker-shadow.png'

import PageHeader from '../components/PageHeader'
import DataTable, { fmtDate, fmtMoney, StatusBadge, STATUS_PALETTE_PROJECT } from '../components/DataTable'
import Modal from '../components/Modal'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton } from '../components/FormField'
import useDebouncedValue from '../hooks/useDebouncedValue'
import useOptimisticListUpdate from '../hooks/useOptimisticListUpdate'
import {
  useListProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useListCustomersQuery,
} from '../store/api'

// Vite fix for Leaflet's missing default marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl: iconRetina, iconUrl, shadowUrl: shadow })

const HARARE = [-17.8252, 31.0335]

/**
 * Mini-map embed for the project edit form. Shows a draggable pin if lat/lng
 * are filled; otherwise the user can click anywhere on the map to drop a pin.
 */
function MiniMap({ lat, lng, onChange }) {
  const hasPin = lat !== '' && lat != null && lng !== '' && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng))
  const center = hasPin ? [Number(lat), Number(lng)] : HARARE

  function ClickToSet() {
    useMapEvents({
      click(e) {
        onChange(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6))
      },
    })
    return null
  }

  function FlyToPin() {
    const map = useMap()
    useEffect(() => {
      if (hasPin) map.flyTo([Number(lat), Number(lng)], Math.max(map.getZoom(), 13), { duration: 0.6 })
    }, [lat, lng, map])
    return null
  }

  return (
    <div className="relative">
      <div className="rounded-xl overflow-hidden border border-lafoi-dark/12" style={{ height: 250 }}>
        <MapContainer
          center={center}
          zoom={hasPin ? 13 : 11}
          scrollWheelZoom
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToSet />
          <FlyToPin />
          {hasPin && (
            <Marker
              position={[Number(lat), Number(lng)]}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const m = e.target.getLatLng()
                  onChange(m.lat.toFixed(6), m.lng.toFixed(6))
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      {!hasPin && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="px-3 py-1.5 rounded-full bg-white/95 border border-lafoi-dark/12 text-xs font-sora flex items-center gap-1.5 shadow-sm">
            <MapPin size={12} weight="fill" className="text-lafoi-green" />
            Click on the map to set the pin
          </div>
        </div>
      )}
    </div>
  )
}

const empty = {
  title: '', customer: '', category: 'residential', status: 'lead',
  description: '', site_address: '', area_sqm: '', budget: '',
  start_date: '', target_end_date: '', progress: 0,
  latitude: '', longitude: '',
}

export default function Projects() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [statusFilter, setStatusFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { setPage(1) }, [debouncedSearch])

  const queryArgs = {
    page,
    page_size: pageSize,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
  }
  const { data, isLoading: isFirstLoad, isFetching } = useListProjectsQuery(queryArgs)
  const { data: customers } = useListCustomersQuery({ page_size: 200 })

  const applyOptimistic = useOptimisticListUpdate('listProjects', queryArgs)

  const [createProject, createState] = useCreateProjectMutation()
  const [updateProject, updateState] = useUpdateProjectMutation()
  const [deleteProject] = useDeleteProjectMutation()

  const isNew = editing && !editing.id
  const saving = createState.isLoading || updateState.isLoading

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      title: editing.title?.trim(),
      customer: editing.customer ? Number(editing.customer) : null,
      category: editing.category,
      status: editing.status,
      description: editing.description || '',
      site_address: editing.site_address || '',
      area_sqm: editing.area_sqm || null,
      budget: editing.budget || null,
      start_date: editing.start_date || null,
      target_end_date: editing.target_end_date || null,
      progress: Number(editing.progress) || 0,
      latitude: editing.latitude === '' || editing.latitude == null ? null : Number(editing.latitude),
      longitude: editing.longitude === '' || editing.longitude == null ? null : Number(editing.longitude),
    }
    try {
      if (isNew) {
        const created = await createProject(payload).unwrap()
        toast.success('Project created', { description: `${created?.code || ''} — ${created?.title || payload.title}`.trim() })
      } else {
        const updated = await updateProject({ id: editing.id, ...payload }).unwrap()
        toast.success('Project updated', { description: `${updated?.code || ''} — ${updated?.title || payload.title}`.trim() })
      }
      setEditing(null)
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Save failed.'
      setError(msg)
      toast.error(isNew ? 'Could not create project' : 'Could not update project', { description: msg })
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete project ${row.code}? This cannot be undone.`)) return
    try {
      await applyOptimistic(
        (draft) => {
          if (!draft?.results) return
          draft.results = draft.results.filter((r) => r.id !== row.id)
          if (typeof draft.count === 'number') draft.count = Math.max(0, draft.count - 1)
        },
        () => deleteProject(row.id).unwrap(),
      )
      toast.success('Project deleted', { description: row.code })
    } catch (e) {
      const msg = e?.data?.detail || 'Delete failed.'
      toast.error('Could not delete project', { description: msg })
    }
  }

  const columns = [
    { key: 'code', label: 'Code', priority: 'medium', render: (r) => <span className="font-sora text-xs">{r.code}</span> },
    { key: 'title', label: 'Project', priority: 'high', mobileLabel: 'Project', render: (r) => (
      <div>
        <p className="font-sora text-sm font-medium">{r.title}</p>
        <p className="text-xs text-lafoi-gray-medium">{r.customer_name || '—'}</p>
      </div>
    )},
    { key: 'category', label: 'Category', priority: 'low', render: (r) => <span className="capitalize text-xs font-sora">{r.category}</span> },
    { key: 'progress', label: 'Progress', priority: 'medium', render: (r) => (
      <div className="flex items-center gap-2 min-w-[120px]">
        <div className="flex-1 h-1.5 rounded-full bg-lafoi-dark/8 overflow-hidden">
          <div className="h-full bg-lafoi-green" style={{ width: `${Math.min(100, Math.max(0, r.progress || 0))}%` }} />
        </div>
        <span className="text-xs font-sora w-9 text-right">{r.progress ?? 0}%</span>
      </div>
    )},
    { key: 'status', label: 'Status', priority: 'high', render: (r) => <StatusBadge status={r.status} palette={STATUS_PALETTE_PROJECT} /> },
    { key: 'budget', label: 'Budget', priority: 'medium', render: (r) => r.budget ? fmtMoney(r.budget) : '—' },
    { key: 'created_at', label: 'Created', priority: 'desktop', render: (r) => fmtDate(r.created_at) },
    { key: 'actions', label: '', priority: 'high', render: (r) => (
      <div className="flex justify-end gap-1">
        <Link to={`/dashboard/projects/${r.id}`} onClick={(e) => e.stopPropagation()} className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><Eye size={14} /></Link>
        <button onClick={(e) => { e.stopPropagation(); setEditing(r) }} className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><PencilSimple size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(r) }} className="p-2 rounded-lg hover:bg-red-50 text-lafoi-gray hover:text-red-600 min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><Trash size={14} /></button>
      </div>
    )},
  ]

  const STATUSES = ['lead', 'quoted', 'approved', 'in_progress', 'on_hold', 'completed', 'cancelled']

  return (
    <div>
      <PageHeader
        eyebrow="Projects"
        title="Every commission, tracked."
        description="From first lead to final reveal — manage progress, plans, and updates per project."
        actions={
          <>
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="w-44">
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </Select>
            <div className="relative">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lafoi-gray-medium" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects"
                className="pl-9 pr-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body w-56"
              />
            </div>
            <PrimaryButton onClick={() => setEditing({ ...empty })}><Plus size={14} weight="bold" /> New project</PrimaryButton>
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={data?.results || []}
        isLoading={isFirstLoad}
        empty="No projects yet — start your first."
        pagination={data ? {
          count: data.count,
          page,
          pageSize,
          onPageChange: setPage,
          onPageSizeChange: (s) => { setPageSize(s); setPage(1) },
        } : null}
      />

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={isNew ? 'New project' : `Edit ${editing?.code || ''}`}
        size="lg"
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setEditing(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="project-form" type="submit" disabled={saving}>
              {saving ? (<><CircleNotch size={14} className="animate-spin" /> Saving…</>) : 'Save'}
            </PrimaryButton>
          </>
        }
      >
        {editing && (
          <form id="project-form" onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
            {error && <div className="sm:col-span-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
            <Field label="Title" required className="sm:col-span-2">
              <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} required />
            </Field>
            <Field label="Customer" required>
              <Select value={editing.customer || ''} onChange={(e) => setEditing({ ...editing, customer: e.target.value })} required>
                <option value="">— Select customer —</option>
                {(customers?.results || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Category">
              <Select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="hospitality">Hospitality</option>
                <option value="retail">Retail</option>
                <option value="institutional">Institutional</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </Select>
            </Field>
            <Field label="Progress %">
              <Input type="number" min="0" max="100" value={editing.progress ?? 0} onChange={(e) => setEditing({ ...editing, progress: e.target.value })} />
            </Field>
            <Field label="Area (m²)">
              <Input type="number" step="0.01" value={editing.area_sqm || ''} onChange={(e) => setEditing({ ...editing, area_sqm: e.target.value })} />
            </Field>
            <Field label="Budget (USD)">
              <Input type="number" step="0.01" value={editing.budget || ''} onChange={(e) => setEditing({ ...editing, budget: e.target.value })} />
            </Field>
            <Field label="Start date">
              <Input type="date" value={editing.start_date || ''} onChange={(e) => setEditing({ ...editing, start_date: e.target.value })} />
            </Field>
            <Field label="Target end">
              <Input type="date" value={editing.target_end_date || ''} onChange={(e) => setEditing({ ...editing, target_end_date: e.target.value })} />
            </Field>
            <Field label="Site address" className="sm:col-span-2">
              <Textarea value={editing.site_address || ''} onChange={(e) => setEditing({ ...editing, site_address: e.target.value })} rows={2} />
            </Field>
            <Field label="Latitude">
              <Input type="number" step="any" value={editing.latitude ?? ''} onChange={(e) => setEditing({ ...editing, latitude: e.target.value })} placeholder="-17.8252" />
            </Field>
            <Field label="Longitude">
              <Input type="number" step="any" value={editing.longitude ?? ''} onChange={(e) => setEditing({ ...editing, longitude: e.target.value })} placeholder="31.0335" />
            </Field>
            <div className="sm:col-span-2">
              <span className="block font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray mb-1.5">
                Site pin
              </span>
              <MiniMap
                lat={editing.latitude ?? ''}
                lng={editing.longitude ?? ''}
                onChange={(la, ln) => setEditing({ ...editing, latitude: la, longitude: ln })}
              />
              <p className="mt-1.5 text-[11px] text-lafoi-gray-medium">
                Drag the pin or click the map to update — the lat/lng inputs update automatically.
              </p>
            </div>
            <Field label="Description / scope" className="sm:col-span-2">
              <Textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={4} />
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}
