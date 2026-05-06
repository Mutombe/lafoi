import React, { useState } from 'react'
import { CaretLeft, CaretRight, CaretDoubleLeft, CaretDoubleRight } from '@phosphor-icons/react'
import { SkeletonTableRow } from './Skeleton'

/**
 * Compact, scalable, mobile-aware data table.
 *
 *   columns: [{
 *     key,
 *     label,
 *     render?(row),
 *     className?,
 *     cellClassName?,
 *     priority?: 'high' | 'medium' | 'low' | 'desktop',  // hides at narrower breakpoints
 *     mobileLabel?: string,                              // alt label on mobile cards
 *   }]
 *
 *   rows: array of row objects
 *   keyField: row[keyField] becomes the row key
 *   onRowClick?: row => void
 *   isLoading?: boolean — shows skeletons on first load
 *   empty?: string
 *   pagination?: {
 *     count, page, pageSize,
 *     onPageChange(p),
 *     onPageSizeChange?(size)   // omit to hide the size picker
 *   }
 *   stickyHeader?: boolean (default true)
 *   mobileCard?: boolean (default true)
 *
 * Column priorities map to Tailwind responsive show/hide:
 *   - high     : always visible
 *   - medium   : hidden < sm (≤ 640)
 *   - low      : hidden < md (≤ 768)
 *   - desktop  : hidden < lg (≤ 1024)
 */
const PRIORITY_CLASS = {
  high: '',
  medium: 'hidden sm:table-cell',
  low: 'hidden md:table-cell',
  desktop: 'hidden lg:table-cell',
}

const PAGE_SIZES = [25, 50, 100, 250]

export default function DataTable({
  columns,
  rows = [],
  keyField = 'id',
  onRowClick,
  isLoading = false,
  empty = 'No records yet.',
  pagination = null,
  stickyHeader = true,
  mobileCard = true,
}) {
  return (
    <div className="rounded-2xl border border-lafoi-dark/10 bg-white shadow-[0_1px_2px_rgba(17,17,17,0.04)] overflow-hidden">
      {/* Mobile card fallback (≤ sm) — every row becomes a card. */}
      {mobileCard && (
        <div className="sm:hidden">
          {isLoading && (
            <div className="divide-y divide-lafoi-dark/[0.06]">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-4 py-4 space-y-2">
                  <div className="img-placeholder h-3 w-2/3 rounded-full" />
                  <div className="img-placeholder h-2.5 w-1/2 rounded-full" />
                </div>
              ))}
            </div>
          )}
          {!isLoading && rows.length === 0 && (
            <div className="px-4 py-12 text-center text-lafoi-gray-medium font-light text-sm">
              {empty}
            </div>
          )}
          {!isLoading && rows.length > 0 && (
            <ul className="divide-y divide-lafoi-dark/[0.06]">
              {rows.map((row) => (
                <li
                  key={row[keyField]}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`px-4 py-3.5 ${onRowClick ? 'cursor-pointer active:bg-lafoi-cream/80' : ''}`}
                >
                  {columns.map((c) => {
                    const value = c.render ? c.render(row) : row[c.key]
                    if (value === null || value === undefined || value === '') return null
                    if (c.priority === 'desktop' || c.priority === 'low') return null
                    if (c.key === 'actions') {
                      return (
                        <div key={c.key} className="mt-2 flex justify-start gap-1" onClick={(e) => e.stopPropagation()}>
                          {value}
                        </div>
                      )
                    }
                    return (
                      <div key={c.key} className="flex items-baseline justify-between gap-3 first:pt-0 pt-1">
                        <span className="text-[10px] font-sora tracking-[0.18em] uppercase text-lafoi-gray-medium shrink-0">
                          {c.mobileLabel || c.label}
                        </span>
                        <span className="text-right text-sm">{value}</span>
                      </div>
                    )
                  })}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Desktop table (≥ sm) */}
      <div className={`${mobileCard ? 'hidden sm:block' : ''} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
            <tr className="bg-lafoi-cream border-b border-lafoi-dark/10">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-4 py-3 text-left font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium font-semibold ${PRIORITY_CLASS[c.priority || 'high']} ${c.className || ''}`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonTableRow key={`sk-${i}`} columns={columns.length} />
                ))}
              </>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-lafoi-gray-medium font-light">
                  {empty}
                </td>
              </tr>
            )}
            {!isLoading && rows.map((row) => (
              <tr
                key={row[keyField]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-lafoi-dark/[0.06] last:border-b-0 ${onRowClick ? 'cursor-pointer hover:bg-lafoi-cream/60' : ''} transition-colors`}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-4 py-3 align-middle ${PRIORITY_CLASS[c.priority || 'high']} ${c.cellClassName || ''}`}
                  >
                    {c.render ? c.render(row) : row[c.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && <Pagination {...pagination} isLoading={isLoading} />}
    </div>
  )
}

function Pagination({ count, page, pageSize, onPageChange, onPageSizeChange, isLoading }) {
  const totalPages = Math.max(1, Math.ceil((count || 0) / (pageSize || 25)))
  const [jumpInput, setJumpInput] = useState('')

  const handleJump = (e) => {
    e?.preventDefault?.()
    const next = Number(jumpInput)
    if (Number.isFinite(next) && next >= 1 && next <= totalPages) {
      onPageChange(next)
      setJumpInput('')
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-lafoi-dark/[0.06] text-xs text-lafoi-gray font-sora">
      {/* Left: count + page-size selector */}
      <div className="flex items-center gap-3">
        <span className="tabular-nums">
          {isLoading ? '—' : `${(count || 0).toLocaleString()} record${count === 1 ? '' : 's'}`}
        </span>
        {onPageSizeChange && (
          <label className="hidden sm:inline-flex items-center gap-1.5 text-lafoi-gray-medium">
            <span>Rows</span>
            <select
              value={pageSize || 25}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-md border border-lafoi-dark/10 bg-white px-1.5 py-0.5 text-xs font-sora focus:outline-none focus:border-lafoi-green"
            >
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        )}
      </div>

      {/* Right: pager + jump-to-page */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          className="p-1.5 rounded-lg border border-lafoi-dark/10 disabled:opacity-40 hover:bg-lafoi-cream"
          aria-label="First page"
        >
          <CaretDoubleLeft size={12} />
        </button>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="p-1.5 rounded-lg border border-lafoi-dark/10 disabled:opacity-40 hover:bg-lafoi-cream"
          aria-label="Previous"
        >
          <CaretLeft size={14} />
        </button>

        <span className="tabular-nums">
          Page <strong>{page}</strong> / {totalPages.toLocaleString()}
        </span>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="p-1.5 rounded-lg border border-lafoi-dark/10 disabled:opacity-40 hover:bg-lafoi-cream"
          aria-label="Next"
        >
          <CaretRight size={14} />
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className="p-1.5 rounded-lg border border-lafoi-dark/10 disabled:opacity-40 hover:bg-lafoi-cream"
          aria-label="Last page"
        >
          <CaretDoubleRight size={12} />
        </button>

        {/* Jump-to-page (large datasets) */}
        {totalPages > 5 && (
          <form onSubmit={handleJump} className="hidden md:inline-flex items-center gap-1 ml-2 pl-3 border-l border-lafoi-dark/10">
            <span className="text-lafoi-gray-medium">Go to</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              placeholder={String(page)}
              className="w-14 rounded-md border border-lafoi-dark/10 bg-white px-1.5 py-0.5 text-xs font-sora text-center tabular-nums focus:outline-none focus:border-lafoi-green"
            />
          </form>
        )}
      </div>
    </div>
  )
}

export const StatusBadge = ({ status, palette = {} }) => {
  const fallback = 'bg-lafoi-cream text-lafoi-gray border-lafoi-dark/10'
  const cls = palette[status] || fallback
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-sora tracking-[0.18em] uppercase ${cls}`}>
      {String(status || '').replace(/_/g, ' ')}
    </span>
  )
}

export const STATUS_PALETTE_PROJECT = {
  lead: 'bg-lafoi-gray-light text-lafoi-gray border-lafoi-dark/10',
  quoted: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-lafoi-green/10 text-lafoi-green-dark border-lafoi-green/30',
  on_hold: 'bg-purple-50 text-purple-700 border-purple-200',
  completed: 'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/40',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

export const STATUS_PALETTE_DOC = {
  draft: 'bg-lafoi-gray-light text-lafoi-gray border-lafoi-dark/10',
  sent: 'bg-blue-50 text-blue-700 border-blue-200',
  accepted: 'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/40',
  declined: 'bg-red-50 text-red-700 border-red-200',
  expired: 'bg-amber-50 text-amber-700 border-amber-200',
  converted: 'bg-purple-50 text-purple-700 border-purple-200',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/40',
  overdue: 'bg-red-50 text-red-700 border-red-200',
  void: 'bg-lafoi-gray-light text-lafoi-gray border-lafoi-dark/10',
}

export const STATUS_PALETTE_PAYROLL = {
  draft: 'bg-lafoi-gray-light text-lafoi-gray border-lafoi-dark/10',
  reviewed: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  paid: 'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/40',
  closed: 'bg-purple-50 text-purple-700 border-purple-200',
}

export const fmtMoney = (amount, currency = 'USD') => {
  const n = Number(amount || 0)
  return `${currency} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const fmtDate = (s) => {
  if (!s) return '—'
  try {
    return new Date(s).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return s
  }
}
