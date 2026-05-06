import React, { useMemo, useState } from 'react'
import { CaretDown, CaretRight, MagnifyingGlass } from '@phosphor-icons/react'

import DataTable from '../DataTable'
import Skeleton from '../Skeleton'
import { Select } from '../FormField'
import { useListAuditLogsQuery } from '../../store/api'

const ACTION_DOTS = {
  create: 'bg-lafoi-green',
  created: 'bg-lafoi-green',
  update: 'bg-blue-500',
  updated: 'bg-blue-500',
  delete: 'bg-red-500',
  deleted: 'bg-red-500',
  approve: 'bg-purple-500',
  approved: 'bg-purple-500',
}
const ACTION_PILLS = {
  create: 'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/30',
  created: 'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/30',
  update: 'bg-blue-50 text-blue-700 border-blue-200',
  updated: 'bg-blue-50 text-blue-700 border-blue-200',
  delete: 'bg-red-50 text-red-700 border-red-200',
  deleted: 'bg-red-50 text-red-700 border-red-200',
  approve: 'bg-purple-50 text-purple-700 border-purple-200',
  approved: 'bg-purple-50 text-purple-700 border-purple-200',
}

const FILTER_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'create', label: 'Created' },
  { key: 'update', label: 'Updated' },
  { key: 'delete', label: 'Deleted' },
]

const fmtRelative = (iso) => {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  if (isNaN(diff)) return ''
  const sec = Math.round(diff / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day < 30) return `${day}d ago`
  const mo = Math.round(day / 30)
  if (mo < 12) return `${mo}mo ago`
  return `${Math.round(mo / 12)}y ago`
}

const fmtAbsolute = (iso) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

export default function AuditLogFeed() {
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('all')
  const [modelFilter, setModelFilter] = useState('')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)

  const queryArgs = useMemo(() => {
    const a = { page }
    if (actionFilter !== 'all') a.action = actionFilter
    if (modelFilter) a.model_label = modelFilter
    if (search) a.search = search
    return a
  }, [page, actionFilter, modelFilter, search])

  const { data, isLoading } = useListAuditLogsQuery(queryArgs)

  const rows = data?.results || []

  // Build the model filter options dynamically from the rows we have.
  const modelOptions = useMemo(() => {
    const seen = new Set()
    rows.forEach((r) => r.model_label && seen.add(r.model_label))
    return Array.from(seen).sort()
  }, [rows])

  const total = data?.count ?? 0

  return (
    <div>
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-2">
          {FILTER_CHIPS.map((c) => {
            const active = actionFilter === c.key
            return (
              <button
                key={c.key}
                onClick={() => { setActionFilter(c.key); setPage(1) }}
                className={`px-3 py-1.5 rounded-full font-sora text-[11px] tracking-[0.18em] uppercase border transition-colors ${
                  active
                    ? 'bg-lafoi-dark text-white border-lafoi-dark'
                    : 'bg-white text-lafoi-gray border-lafoi-dark/12 hover:border-lafoi-dark hover:text-lafoi-dark'
                }`}
              >
                {c.label}
              </button>
            )
          })}
          <div className="hidden sm:block w-px h-6 bg-lafoi-dark/10 mx-1" />
          <div className="min-w-[180px]">
            <Select
              value={modelFilter}
              onChange={(e) => { setModelFilter(e.target.value); setPage(1) }}
              className="!py-2 !text-xs"
            >
              <option value="">All models</option>
              {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lafoi-gray-medium" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by record or actor"
              className="w-full pl-9 pr-3 py-2 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-lafoi-dark/10 bg-white shadow-[0_1px_2px_rgba(17,17,17,0.04)] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton variant="circle" className="h-3 w-3 mt-2 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-2.5 w-1/3" />
                </div>
                <Skeleton variant="block" className="h-5 w-16 shrink-0" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-16 text-center text-lafoi-gray-medium">
            <p className="font-sora text-[10px] tracking-[0.3em] uppercase mb-2">Audit log</p>
            <p className="font-light">No activity yet.</p>
          </div>
        ) : (
          <ul>
            {rows.map((entry, idx) => {
              const isOpen = expanded === entry.id
              const action = String(entry.action || '').toLowerCase()
              const dotClass = ACTION_DOTS[action] || 'bg-lafoi-gray'
              const pillClass = ACTION_PILLS[action] || 'bg-lafoi-cream text-lafoi-gray border-lafoi-dark/10'
              const isLast = idx === rows.length - 1
              return (
                <li key={entry.id} className="relative">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : entry.id)}
                    className="w-full px-5 py-4 flex items-start gap-4 text-left hover:bg-lafoi-cream/50 transition-colors"
                  >
                    <div className="relative shrink-0 pt-1">
                      <span className={`block w-2.5 h-2.5 rounded-full ring-4 ring-white ${dotClass}`} />
                      {!isLast && (
                        <span className="absolute left-1/2 -translate-x-1/2 top-5 w-px h-[calc(100%+1.25rem)] bg-lafoi-dark/8" aria-hidden />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sora text-sm">
                        <span className="font-medium text-lafoi-dark">{entry.model_label || 'Record'}</span>
                        <span className="text-lafoi-gray"> · </span>
                        <span className="text-lafoi-gray-medium">{entry.object_repr || `#${entry.object_id}`}</span>
                      </p>
                      <p className="text-xs text-lafoi-gray-medium mt-0.5">
                        by <span className="text-lafoi-dark">{entry.actor_display || entry.actor_username || 'system'}</span>
                        <span className="mx-1.5">·</span>
                        <span title={fmtAbsolute(entry.created_at)}>{fmtRelative(entry.created_at)}</span>
                        {entry.summary && (
                          <>
                            <span className="mx-1.5">·</span>
                            <span className="italic">{entry.summary}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-sora tracking-[0.18em] uppercase ${pillClass}`}>
                        {entry.action_label || entry.action}
                      </span>
                      {isOpen ? <CaretDown size={12} className="text-lafoi-gray-medium" /> : <CaretRight size={12} className="text-lafoi-gray-medium" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pl-[3.25rem]">
                      <DiffView before={entry.before} after={entry.after} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {data && total > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-lafoi-dark/[0.06] text-xs font-sora text-lafoi-gray">
            <span>{total} event{total === 1 ? '' : 's'}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 px-3 rounded-lg border border-lafoi-dark/10 disabled:opacity-40 hover:bg-lafoi-cream"
              >Prev</button>
              <span>Page {page} / {Math.max(1, Math.ceil(total / 25))}</span>
              <button
                type="button"
                disabled={page >= Math.ceil(total / 25)}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 px-3 rounded-lg border border-lafoi-dark/10 disabled:opacity-40 hover:bg-lafoi-cream"
              >Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Side-by-side JSON diff. Computes the changed-key set on the client from the
 * union of `before` and `after` keys. A key is "changed" iff it is missing on
 * one side or the JSON-stringified values differ.
 */
function DiffView({ before, after }) {
  const { keys, changedKeys } = useMemo(() => {
    const b = before || {}
    const a = after || {}
    const all = new Set([...Object.keys(b), ...Object.keys(a)])
    const changed = new Set()
    for (const k of all) {
      const bv = JSON.stringify(b[k])
      const av = JSON.stringify(a[k])
      if (bv !== av) changed.add(k)
    }
    return { keys: Array.from(all).sort(), changedKeys: changed }
  }, [before, after])

  if (keys.length === 0) {
    return (
      <div className="rounded-xl bg-lafoi-cream/60 border border-lafoi-dark/8 px-4 py-3 text-xs text-lafoi-gray-medium">
        No payload recorded for this event.
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <DiffPane title="Before" data={before || {}} keys={keys} changedKeys={changedKeys} side="before" />
      <DiffPane title="After" data={after || {}} keys={keys} changedKeys={changedKeys} side="after" />
    </div>
  )
}

function DiffPane({ title, data, keys, changedKeys, side }) {
  const accent = side === 'before' ? 'border-red-200 bg-red-50/40' : 'border-lafoi-green/25 bg-lafoi-green/[0.04]'
  const labelTone = side === 'before' ? 'text-red-700' : 'text-lafoi-green-dark'
  return (
    <div className={`rounded-xl border ${accent} overflow-hidden`}>
      <p className={`px-3 py-2 font-sora text-[10px] tracking-[0.28em] uppercase ${labelTone} border-b ${side === 'before' ? 'border-red-200' : 'border-lafoi-green/25'}`}>
        {title}
      </p>
      <div className="font-mono text-[11px] leading-relaxed max-h-72 overflow-auto px-3 py-2">
        {keys.map((k) => {
          const isChanged = changedKeys.has(k)
          const val = data[k]
          const display = val === undefined ? '—' : JSON.stringify(val)
          return (
            <div
              key={k}
              className={`py-0.5 px-1 -mx-1 rounded ${isChanged ? (side === 'before' ? 'bg-red-100/70' : 'bg-lafoi-green/15') : ''}`}
            >
              <span className={`${isChanged ? 'font-semibold' : ''} text-lafoi-dark/70`}>{k}</span>
              <span className="text-lafoi-gray-medium">: </span>
              <span className="text-lafoi-dark break-all">{display}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
