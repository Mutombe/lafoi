import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Cube, Wrench, MagnifyingGlass, Plus, CircleNotch } from '@phosphor-icons/react'

import { useListCatalogQuery, useCreateCatalogItemMutation, useBumpCatalogUsageMutation } from '../store/api'
import useDebouncedValue from '../hooks/useDebouncedValue'

/**
 * Combobox-style picker on the line-item description field.
 *
 * Type in the input → catalog matches drop down. Arrow keys + Enter to
 * select, mouse click also works. Selecting an item fires `onPick(item)`
 * with the catalog row so the parent can fill description / unit /
 * unit_price in one shot. If no item matches the typed text, a final
 * "Save as new catalog item" option appears at the bottom — selecting it
 * creates a CatalogItem from the typed text and then invokes `onPick`
 * with the newly-created row.
 *
 * Free-form is fully supported: the user can just type and never open
 * the dropdown — the parent receives onChange(text) as a normal input.
 *
 * Props:
 *   value         — current description string
 *   onChange(s)   — fires on every keystroke
 *   onPick(item)  — fires when the user selects a catalog item
 *   currency      — currency for the price hint in the dropdown
 *   placeholder   — input placeholder
 *   inputProps    — passthrough (className, aria-label, etc.)
 */
export default function CatalogPicker({
  value,
  onChange,
  onPick,
  currency = 'USD',
  placeholder = 'Description or pick from catalog',
  inputProps = {},
}) {
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(0)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Dropdown position — measured from the input's bounding rect so the
  // floating list (portalled to <body>) doesn't get clipped by any modal /
  // overflow ancestor. Uses fixed positioning, so the rect's viewport-
  // relative coordinates plug in directly.
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, openUp: false })

  const recomputePosition = () => {
    const el = inputRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const desiredHeight = 320
    const openUp = spaceBelow < 200 && rect.top > spaceBelow
    setPos({
      top: openUp ? Math.max(8, rect.top - 4) : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      openUp,
    })
  }

  useLayoutEffect(() => {
    if (!open) return
    recomputePosition()
  }, [open])

  // Track scroll + resize so the dropdown follows the input when the page or
  // any scrollable ancestor (modal body) moves.
  useEffect(() => {
    if (!open) return
    const handler = () => recomputePosition()
    window.addEventListener('resize', handler)
    window.addEventListener('scroll', handler, true)  // capture → catches nested scrolls too
    return () => {
      window.removeEventListener('resize', handler)
      window.removeEventListener('scroll', handler, true)
    }
  }, [open])

  const debounced = useDebouncedValue(value || '', 180)

  // Always fetch a small slice so we can show "popular items" when empty,
  // then narrow with search as the user types.
  const { data, isFetching } = useListCatalogQuery(
    {
      page_size: 10,
      is_active: true,
      ordering: '-times_used',
      ...(debounced ? { search: debounced } : {}),
    },
    { skip: !open },
  )
  const matches = (data?.results || [])

  const [createItem] = useCreateCatalogItemMutation()
  const [bumpUsage] = useBumpCatalogUsageMutation()
  const [creating, setCreating] = useState(false)

  // Close on outside click — the portalled dropdown lives outside wrapRef so
  // we check both the wrap (input) and the list (dropdown).
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      const insideInput = wrapRef.current?.contains(e.target)
      const insideList = listRef.current?.contains(e.target)
      if (!insideInput && !insideList) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Reset hover index when result set changes.
  useEffect(() => { setHover(0) }, [debounced, matches.length])

  const trimmed = (value || '').trim()
  const exactMatch = matches.find((m) => m.name.toLowerCase() === trimmed.toLowerCase())
  const canCreateInline = !!trimmed && !exactMatch && trimmed.length >= 2

  // hoverable rows = catalog matches + (optional) "create new" row
  const totalRows = matches.length + (canCreateInline ? 1 : 0)
  const createIdx = matches.length // index of the "create new" entry

  const pick = async (item) => {
    setOpen(false)
    onPick?.(item)
    // Fire-and-forget — non-critical analytics, don't block UI.
    bumpUsage(item.id).catch(() => {})
  }

  const createAndPick = async () => {
    if (!trimmed) return
    setCreating(true)
    try {
      const created = await createItem({
        kind: 'service',
        name: trimmed,
        default_unit: 'm²',
        default_unit_price: 0,
        currency,
        is_active: true,
        tags: [],
      }).unwrap()
      await pick(created)
    } catch {
      // swallow; user can still type free-form
    } finally {
      setCreating(false)
    }
  }

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || (e.key === 'Enter' && !e.shiftKey)) {
        // Don't intercept plain Enter inside a form — let parent submit.
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setOpen(true)
        }
      }
      return
    }
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHover((h) => Math.min(totalRows - 1, h + 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHover((h) => Math.max(0, h - 1))
      return
    }
    if (e.key === 'Enter') {
      if (totalRows === 0) return
      e.preventDefault()
      if (canCreateInline && hover === createIdx) {
        createAndPick()
      } else if (matches[hover]) {
        pick(matches[hover])
      }
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        {...inputProps}
        ref={inputRef}
        type="text"
        value={value || ''}
        onChange={(e) => { onChange?.(e.target.value); if (!open) setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-lg bg-white border border-lafoi-dark/12 text-sm focus:border-lafoi-green focus:outline-none ${inputProps.className || ''}`}
      />

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={listRef}
          style={{
            position: 'fixed',
            top: pos.openUp ? undefined : pos.top,
            bottom: pos.openUp ? (window.innerHeight - pos.top) : undefined,
            left: pos.left,
            width: pos.width,
            zIndex: 250,
            maxHeight: '320px',
          }}
          className="overflow-y-auto rounded-xl border border-lafoi-dark/12 bg-white shadow-[0_18px_42px_-12px_rgba(17,17,17,0.25)] py-1"
        >
          {/* Catalog matches */}
          {matches.length === 0 && !isFetching && !canCreateInline && (
            <div className="px-3 py-6 text-center text-xs text-lafoi-gray-medium font-sora">
              {trimmed
                ? <>No matches for <strong>"{trimmed}"</strong></>
                : 'Type to search the catalog'}
            </div>
          )}

          {matches.map((m, idx) => {
            const isActive = idx === hover
            const Icon = m.kind === 'product' ? Cube : Wrench
            return (
              <button
                key={m.id}
                type="button"
                onMouseEnter={() => setHover(idx)}
                onMouseDown={(e) => { e.preventDefault(); pick(m) }}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 transition-colors ${isActive ? 'bg-lafoi-cream' : 'bg-white hover:bg-lafoi-cream/60'}`}
              >
                <span className={`inline-flex w-7 h-7 rounded-lg shrink-0 items-center justify-center ${m.kind === 'product' ? 'bg-blue-50 text-blue-700' : 'bg-lafoi-green/10 text-lafoi-green-dark'}`}>
                  <Icon size={13} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-sora text-sm font-medium truncate">{m.name}</p>
                  {m.description && (
                    <p className="text-[11px] text-lafoi-gray-medium truncate">{m.description}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-sora text-xs tabular-nums text-lafoi-dark">
                    {currency} {Number(m.default_unit_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] font-sora text-lafoi-gray-medium">per {m.default_unit}</p>
                </div>
              </button>
            )
          })}

          {/* Inline create */}
          {canCreateInline && (
            <button
              type="button"
              onMouseEnter={() => setHover(createIdx)}
              onMouseDown={(e) => { e.preventDefault(); createAndPick() }}
              className={`w-full text-left flex items-center gap-3 px-3 py-2 border-t border-lafoi-dark/8 transition-colors ${hover === createIdx ? 'bg-lafoi-green/10' : 'hover:bg-lafoi-green/5'}`}
            >
              <span className="inline-flex w-7 h-7 rounded-lg bg-lafoi-green text-white shrink-0 items-center justify-center">
                {creating ? <CircleNotch size={13} className="animate-spin" /> : <Plus size={13} weight="bold" />}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-sora text-sm font-medium text-lafoi-green-dark">
                  Save "{trimmed}" to catalog
                </p>
                <p className="text-[11px] text-lafoi-gray-medium">
                  Adds it as a service so you can reuse it next time.
                </p>
              </div>
            </button>
          )}

          {isFetching && matches.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-lafoi-gray-medium font-sora inline-flex items-center justify-center gap-1.5 w-full">
              <CircleNotch size={12} className="animate-spin" /> Searching catalog…
            </div>
          )}

          {/* Footer hint */}
          <div className="px-3 py-1.5 border-t border-lafoi-dark/8 text-[10px] tracking-[0.18em] uppercase text-lafoi-gray-medium font-sora flex items-center gap-1.5">
            <MagnifyingGlass size={10} /> ↑↓ navigate · enter to pick · esc to close
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
