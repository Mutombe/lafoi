import React, { useMemo, useState } from 'react'
import { MagnifyingGlass, Stack, CircleNotch, Check } from '@phosphor-icons/react'

import { SecondaryButton, PrimaryButton } from './FormField'
import { fmtMoney } from './DataTable'
import useDebouncedValue from '../hooks/useDebouncedValue'
import { useListQuotationsQuery } from '../store/api'

/**
 * Convert API line items (quantity / unit / unit_price / section) into the
 * shape LineItemEditor works in (A × B × Qty + is_lump_sum flags). We drop the
 * measured breakdown into a single Qty so the line total is preserved exactly,
 * and keep lump-sum rows (unit "lot") as lump-sum so they still read right.
 */
export function apiItemsToEditorRows(items) {
  return (items || []).map((it) => {
    const lump = (it.unit || '') === 'lot'
    const quantity = Number(it.quantity) || 0
    return {
      section: it.section || '',
      description: it.description || '',
      a: '',
      b: '',
      qty: lump ? 1 : quantity || 1,
      quantity: lump ? 1 : quantity,
      unit: it.unit || 'unit',
      unit_price: Number(it.unit_price) || 0,
      is_lump_sum: lump,
      pricing_mode: 'flat',
      percent: 0,
    }
  })
}

/**
 * Inline panel that lets the admin pull line items from one or more existing
 * quotations into the quote they're currently building — a lightweight "merge
 * quotations" flow. Selected quotes' items are appended; the admin then trims
 * or re-measures as needed.
 */
export default function MergeQuotationsPanel({ onAdd, excludeId }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [picked, setPicked] = useState({}) // id -> true
  const debounced = useDebouncedValue(search, 300)

  const { data, isFetching } = useListQuotationsQuery(
    { page_size: 100, search: debounced || undefined },
    { skip: !open },
  )

  const rows = useMemo(
    () => (data?.results || []).filter((q) => String(q.id) !== String(excludeId)),
    [data, excludeId],
  )

  const pickedIds = Object.keys(picked).filter((id) => picked[id])
  const pickedCount = pickedIds.length
  const pickedLineCount = useMemo(
    () =>
      rows
        .filter((q) => picked[q.id])
        .reduce((s, q) => s + (q.items?.length || 0), 0),
    [rows, picked],
  )

  const toggle = (id) => setPicked((p) => ({ ...p, [id]: !p[id] }))

  const handleAdd = () => {
    const merged = rows
      .filter((q) => picked[q.id])
      .flatMap((q) => apiItemsToEditorRows(q.items))
    if (merged.length) onAdd(merged)
    setPicked({})
    setOpen(false)
    setSearch('')
  }

  if (!open) {
    return (
      <SecondaryButton type="button" onClick={() => setOpen(true)} className="!py-1.5 !px-3 !text-xs">
        <Stack size={13} weight="bold" /> Pull from other quotations
      </SecondaryButton>
    )
  }

  return (
    <div className="rounded-2xl border border-lafoi-green/30 bg-lafoi-green/[0.04] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-lafoi-dark/[0.08]">
        <div className="flex-1">
          <p className="font-sora text-[10px] tracking-[0.24em] uppercase text-lafoi-green-dark">Merge quotations</p>
          <p className="text-[11px] font-sora text-lafoi-gray-medium mt-0.5">
            Tick any quotations below to copy their line items into this one.
          </p>
        </div>
        <div className="relative">
          <MagnifyingGlass size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-lafoi-gray-medium" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search number, recipient…"
            className="pl-8 pr-3 py-2 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-xs font-body w-52"
          />
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto divide-y divide-lafoi-dark/[0.06]">
        {isFetching && !rows.length && (
          <div className="flex items-center justify-center gap-2 py-8 text-lafoi-gray-medium text-sm">
            <CircleNotch size={16} className="animate-spin" /> Loading…
          </div>
        )}
        {!isFetching && !rows.length && (
          <p className="py-8 text-center text-sm text-lafoi-gray-medium font-sora">No quotations found.</p>
        )}
        {rows.map((q) => {
          const on = !!picked[q.id]
          const lineCount = q.items?.length || 0
          return (
            <button
              type="button"
              key={q.id}
              onClick={() => toggle(q.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${on ? 'bg-lafoi-green/[0.08]' : 'hover:bg-white'}`}
            >
              <span
                className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center ${on ? 'bg-lafoi-green border-lafoi-green text-white' : 'border-lafoi-dark/25 bg-white'}`}
              >
                {on && <Check size={11} weight="bold" />}
              </span>
              <span className="font-sora text-xs text-lafoi-dark w-28 shrink-0">{q.number}</span>
              <span className="flex-1 min-w-0 truncate text-sm font-sora text-lafoi-dark">
                {q.customer_name || q.recipient_name || q.subject || '—'}
              </span>
              <span className="text-[11px] font-sora text-lafoi-gray-medium shrink-0">
                {lineCount} line{lineCount === 1 ? '' : 's'}
              </span>
              <span className="text-xs font-sora text-lafoi-dark tabular-nums w-24 text-right shrink-0">
                {fmtMoney(q.total, q.currency)}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border-t border-lafoi-dark/[0.08]">
        <p className="text-[11px] font-sora text-lafoi-gray-medium">
          {pickedCount ? `${pickedCount} quotation${pickedCount === 1 ? '' : 's'} · ${pickedLineCount} line${pickedLineCount === 1 ? '' : 's'}` : 'Nothing selected'}
        </p>
        <div className="flex gap-2">
          <SecondaryButton type="button" onClick={() => { setOpen(false); setPicked({}); setSearch('') }} className="!py-1.5 !px-3 !text-xs">
            Cancel
          </SecondaryButton>
          <PrimaryButton type="button" onClick={handleAdd} disabled={!pickedCount} className="!py-1.5 !px-3 !text-xs">
            Add {pickedLineCount || ''} line{pickedLineCount === 1 ? '' : 's'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
