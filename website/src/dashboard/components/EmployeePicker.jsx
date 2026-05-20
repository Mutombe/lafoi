import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MagnifyingGlass, User, X as XIcon, CircleNotch } from '@phosphor-icons/react'

import useDebouncedValue from '../hooks/useDebouncedValue'

/**
 * Searchable employee picker. Reads from an in-memory employee list (the
 * caller fetches once with useListEmployeesQuery and shares the same list
 * everywhere on the page) and offers a typeahead-style combobox:
 *
 *   - Type to filter by name / code
 *   - ↑↓ + Enter to select
 *   - Click to select
 *   - X to clear
 *
 * The dropdown is portalled to document.body so modal overflow doesn't
 * clip it, mirroring CatalogPicker.
 *
 * Props
 *   employees   — array of {id, full_name, first_name, last_name, employee_code, …}
 *   value       — currently selected employee id (string or number)
 *   onChange(id)— fires when the user picks (or clears with id='')
 *   placeholder — text shown when nothing is selected
 *   required    — adds a hidden required input so <form> validation works
 *   id          — optional element id, useful when paired with a <label>
 */
export default function EmployeePicker({
  employees = [],
  value,
  onChange,
  placeholder = 'Type a name…',
  required = false,
  id,
}) {
  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [hover, setHover] = useState(0)
  const debouncedQuery = useDebouncedValue(query, 80)

  // Look up the currently selected employee so we can render the chosen
  // label when the picker is closed.
  const selected = useMemo(
    () => employees.find((e) => String(e.id) === String(value)) || null,
    [employees, value],
  )

  const matches = useMemo(() => {
    const q = (debouncedQuery || '').trim().toLowerCase()
    if (!q) return employees.slice(0, 50)
    return employees.filter((e) => {
      const full = (e.full_name || `${e.first_name || ''} ${e.last_name || ''}`).toLowerCase()
      const code = (e.employee_code || '').toLowerCase()
      const dept = (e.department || '').toLowerCase()
      const title = (e.job_title || '').toLowerCase()
      return full.includes(q) || code.includes(q) || dept.includes(q) || title.includes(q)
    }).slice(0, 50)
  }, [employees, debouncedQuery])

  // Dropdown positioning. Uses fixed positioning + the input's bounding rect
  // so the list escapes any modal / overflow ancestor.
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, openUp: false })
  const recompute = () => {
    const el = inputRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < 240 && rect.top > spaceBelow
    setPos({
      top: openUp ? Math.max(8, rect.top - 4) : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      openUp,
    })
  }
  useLayoutEffect(() => { if (open) recompute() }, [open])
  useEffect(() => {
    if (!open) return
    const handler = () => recompute()
    window.addEventListener('resize', handler)
    window.addEventListener('scroll', handler, true)
    return () => {
      window.removeEventListener('resize', handler)
      window.removeEventListener('scroll', handler, true)
    }
  }, [open])

  // Outside click — close. Both the input wrap AND the portalled list count
  // as inside.
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

  useEffect(() => { setHover(0) }, [debouncedQuery])

  const focusInput = () => {
    setOpen(true)
    // Pre-fill the search field with the selected name so the user can
    // immediately type to change it.
    if (selected) {
      setQuery(selected.full_name || `${selected.first_name || ''} ${selected.last_name || ''}`)
    }
    // Defer focus to after state flush so the input is mounted.
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const pick = (emp) => {
    onChange?.(String(emp.id))
    setOpen(false)
    setQuery('')
  }

  const clear = () => {
    onChange?.('')
    setQuery('')
    setOpen(false)
  }

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHover((h) => Math.min(matches.length - 1, h + 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHover((h) => Math.max(0, h - 1))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const target = matches[hover]
      if (target) pick(target)
    }
  }

  const displayLabel = selected
    ? (selected.full_name || `${selected.first_name || ''} ${selected.last_name || ''}`)
    : ''

  return (
    <div ref={wrapRef} className="relative">
      {/* Hidden required input keeps native form validation honest while
          the visible control is custom. */}
      {required && (
        <input type="text" tabIndex={-1} required value={value || ''} onChange={() => {}}
          className="absolute opacity-0 pointer-events-none w-0 h-0" aria-hidden />
      )}

      {open ? (
        <div className="relative">
          <MagnifyingGlass
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-lafoi-gray-medium pointer-events-none"
          />
          <input
            ref={inputRef}
            id={id}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-lafoi-green/50 text-sm focus:border-lafoi-green focus:outline-none ring-2 ring-lafoi-green/15"
          />
        </div>
      ) : (
        <button
          type="button"
          id={id}
          onClick={focusInput}
          onKeyDown={handleKeyDown}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-lafoi-dark/12 text-sm text-left hover:border-lafoi-green/40 focus:border-lafoi-green focus:outline-none transition-colors`}
        >
          <User size={14} className="text-lafoi-gray-medium shrink-0" weight="regular" />
          {selected ? (
            <span className="flex-1 min-w-0 flex items-center gap-2">
              <span className="font-sora text-sm font-medium text-lafoi-dark truncate">{displayLabel}</span>
              {selected.employee_code && (
                <span className="text-[10px] font-sora tracking-[0.18em] uppercase text-lafoi-gray-medium">
                  {selected.employee_code}
                </span>
              )}
            </span>
          ) : (
            <span className="flex-1 text-lafoi-gray-medium">{placeholder}</span>
          )}
          {selected && (
            <span
              onClick={(e) => { e.stopPropagation(); clear() }}
              className="shrink-0 inline-flex w-6 h-6 rounded-full hover:bg-lafoi-cream items-center justify-center"
              title="Clear"
            >
              <XIcon size={11} className="text-lafoi-gray-medium" />
            </span>
          )}
        </button>
      )}

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
          {matches.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-lafoi-gray-medium font-sora">
              {query.trim()
                ? <>No employee matches <strong>"{query}"</strong></>
                : 'No employees on file'}
            </div>
          ) : (
            matches.map((emp, idx) => {
              const isActive = idx === hover
              const name = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`
              return (
                <button
                  key={emp.id}
                  type="button"
                  onMouseEnter={() => setHover(idx)}
                  onMouseDown={(e) => { e.preventDefault(); pick(emp) }}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 transition-colors ${
                    isActive ? 'bg-lafoi-cream' : 'bg-white hover:bg-lafoi-cream/60'
                  }`}
                >
                  <span className="inline-flex w-8 h-8 rounded-lg bg-lafoi-green/10 text-lafoi-green-dark items-center justify-center shrink-0 font-display text-sm">
                    {(name.trim()[0] || '?').toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-sora text-sm font-medium truncate">{name.trim() || '—'}</p>
                    <p className="text-[11px] text-lafoi-gray-medium truncate">
                      {emp.employee_code}
                      {emp.job_title ? ` · ${emp.job_title}` : ''}
                      {emp.department ? ` · ${emp.department}` : ''}
                    </p>
                  </div>
                </button>
              )
            })
          )}

          {/* Footer hint */}
          <div className="px-3 py-1.5 border-t border-lafoi-dark/8 text-[10px] tracking-[0.18em] uppercase text-lafoi-gray-medium font-sora flex items-center gap-1.5">
            <MagnifyingGlass size={10} /> Type to filter · ↑↓ navigate · enter to pick · esc to close
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
