import React from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { SkeletonTableRow } from './Skeleton'

/**
 * Compact, restrained data table used across the dashboard.
 *   columns: [{ key, label, render?, className? }]
 *   rows: array of row objects
 *   keyField: row[keyField] becomes the row key
 *   onRowClick?: row => void
 *   isLoading?: boolean
 *   empty?: string
 *   pagination?: { count, page, pageSize, onPageChange }
 */
export default function DataTable({
  columns,
  rows = [],
  keyField = 'id',
  onRowClick,
  isLoading = false,
  empty = 'No records yet.',
  pagination = null,
}) {
  return (
    <div className="rounded-2xl border border-lafoi-dark/10 bg-white shadow-[0_1px_2px_rgba(17,17,17,0.04)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-lafoi-cream border-b border-lafoi-dark/10">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-4 py-3 text-left font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium font-semibold ${c.className || ''}`}
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
                  <td key={c.key} className={`px-4 py-3 align-middle ${c.cellClassName || ''}`}>
                    {c.render ? c.render(row) : row[c.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-lafoi-dark/[0.06] text-xs text-lafoi-gray font-sora">
          <span>
            {pagination.count} record{pagination.count === 1 ? '' : 's'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="p-1.5 rounded-lg border border-lafoi-dark/10 disabled:opacity-40 hover:bg-lafoi-cream"
            >
              <CaretLeft size={14} />
            </button>
            <span>
              Page {pagination.page} / {Math.max(1, Math.ceil(pagination.count / (pagination.pageSize || 25)))}
            </span>
            <button
              type="button"
              disabled={pagination.page >= Math.ceil(pagination.count / (pagination.pageSize || 25))}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="p-1.5 rounded-lg border border-lafoi-dark/10 disabled:opacity-40 hover:bg-lafoi-cream"
            >
              <CaretRight size={14} />
            </button>
          </div>
        </div>
      )}
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
