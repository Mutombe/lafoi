import React, { useMemo } from 'react'
import { Plus, Trash, X } from '@phosphor-icons/react'

import { Input, Select, SecondaryButton } from './FormField'
import CatalogPicker from './CatalogPicker'

/**
 * Truly flexible line-item editor with section chapters.
 *
 * Each row carries A × B × Qty + unit + unit price; effective quantity is
 * the product of whatever's non-empty so the same row shape covers area,
 * linear, piece and litre pricing. Rows can be grouped under a named
 * SECTION (Lounge, Bathroom, Master Suite…) — sections render as
 * standalone heading cards above their items, not as fake rows inside the
 * grid. Each section has its own subtotal and add-line CTA.
 */

const UNIT_OPTIONS = [
  { value: 'm²',    label: 'm² (area)' },
  { value: 'm',     label: 'm (linear)' },
  { value: 'm³',    label: 'm³ (volume)' },
  { value: 'L',     label: 'L (litres)' },
  { value: 'kg',    label: 'kg' },
  { value: 'piece', label: 'piece' },
  { value: 'set',   label: 'set' },
  { value: 'pair',  label: 'pair' },
  { value: 'unit',  label: 'unit' },
  { value: 'roll',  label: 'roll' },
  { value: 'box',   label: 'box' },
  { value: 'lot',   label: 'lot' },
  { value: 'hours', label: 'hours' },
  { value: 'day',   label: 'day' },
]

const newRow = (section = '') => ({
  section,
  description: '',
  a: '',
  b: '',
  qty: 1,
  unit: 'm²',
  unit_price: 0,
  quantity: 1,
})

function asNum(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function computeEffective(it) {
  const a = asNum(it.a)
  const b = asNum(it.b)
  const q = asNum(it.qty)
  const factors = [a, b, q].filter((n) => n > 0)
  if (factors.length === 0) return 0
  return factors.reduce((acc, n) => acc * n, 1)
}

function formulaLabel(it) {
  const parts = []
  if (asNum(it.a) > 0) parts.push(asNum(it.a).toString())
  if (asNum(it.b) > 0) parts.push(asNum(it.b).toString())
  if (asNum(it.qty) > 0) parts.push(asNum(it.qty).toString())
  if (parts.length === 0) return '—'
  if (parts.length === 1) return parts[0]
  return parts.join(' × ')
}

function fmtCur(amount, currency) {
  return `${currency} ${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function LineItemEditor({ items, onChange, currency = 'USD' }) {
  const set = (idx, key, value) => {
    const next = items.slice()
    next[idx] = { ...next[idx], [key]: value }
    if (key === 'a' || key === 'b' || key === 'qty' || key === 'unit') {
      next[idx].quantity = +computeEffective(next[idx]).toFixed(2)
    }
    onChange(next)
  }

  // When the user invokes a catalog item, fill description / unit / unit price
  // on that row in one shot. Keep A/B/Qty untouched so the in-situ measurement
  // they've already entered (e.g. 4.2 × 3.8) isn't lost.
  const fillFromCatalog = (idx, item) => {
    const next = items.slice()
    const description = item.description?.trim()
      ? `${item.name} — ${item.description}`
      : item.name
    next[idx] = {
      ...next[idx],
      description,
      unit: item.default_unit || next[idx].unit || 'unit',
      unit_price: Number(item.default_unit_price) || 0,
      catalog_item: item.id,  // tracked so we can show "from catalog" on the row
    }
    next[idx].quantity = +computeEffective(next[idx]).toFixed(2)
    onChange(next)
  }

  const removeRow = (idx) => onChange(items.filter((_, i) => i !== idx))

  // Group items by section while preserving order. A new group starts every
  // time the section name changes from the previous row.
  const groups = useMemo(() => {
    const out = []
    items.forEach((it, idx) => {
      const sec = (it.section || '').trim()
      const last = out[out.length - 1]
      if (last && last.section === sec) {
        last.indices.push(idx)
      } else {
        out.push({ section: sec, indices: [idx] })
      }
    })
    return out
  }, [items])

  const hasNamedSection = groups.some((g) => g.section)
  const showSections = hasNamedSection || groups.length > 1

  const lineTotal = (it) => Number(it.quantity || 0) * Number(it.unit_price || 0)
  const grandTotal = items.reduce((s, it) => s + lineTotal(it), 0)

  // Rename a section: rewrites the section field on every row in that group.
  const renameSection = (groupIdx, name) => {
    const target = groups[groupIdx]
    if (!target) return
    const next = items.slice()
    target.indices.forEach((i) => {
      next[i] = { ...next[i], section: name }
    })
    onChange(next)
  }

  // Append a new line at the end of a group (inherits that group's section).
  const addLineToGroup = (groupIdx) => {
    const target = groups[groupIdx]
    const insertAt = target ? target.indices[target.indices.length - 1] + 1 : items.length
    const next = items.slice()
    next.splice(insertAt, 0, newRow(target?.section || ''))
    onChange(next)
  }

  const removeSection = (groupIdx) => {
    const target = groups[groupIdx]
    if (!target) return
    const drop = new Set(target.indices)
    onChange(items.filter((_, i) => !drop.has(i)))
  }

  // "Add section" — appends a fresh group with one blank line and a
  // sensible default name ("Section 2", "Section 3", …) so it forms its own
  // group regardless of what came before. The user types over the name in
  // the heading input; if they don't, it still reads sensibly in the PDF.
  const addNewSection = () => {
    const existing = new Set(groups.map((g) => g.section).filter(Boolean))
    let n = groups.length + 1
    let name = `Section ${n}`
    while (existing.has(name)) {
      n += 1
      name = `Section ${n}`
    }
    onChange([...items, newRow(name)])
  }

  const empty = items.length === 0

  return (
    <div className="space-y-3">
      {empty && (
        <div className="rounded-2xl border border-dashed border-lafoi-dark/15 px-6 py-10 text-center">
          <p className="text-sm text-lafoi-gray-medium font-sora">No line items yet.</p>
          <div className="mt-3 inline-flex gap-2">
            <SecondaryButton type="button" onClick={() => onChange([newRow('')])}>
              <Plus size={13} weight="bold" /> Add line
            </SecondaryButton>
            <SecondaryButton type="button" onClick={addNewSection}>
              <Plus size={13} weight="bold" /> Add section
            </SecondaryButton>
          </div>
        </div>
      )}

      {groups.map((group, gIdx) => {
        const groupItems = group.indices.map((i) => ({ ...items[i], _idx: i }))
        const groupTotal = groupItems.reduce((s, it) => s + lineTotal(it), 0)
        const named = !!group.section

        return (
          <div
            key={gIdx}
            className={`rounded-2xl border overflow-hidden bg-white ${named ? 'border-lafoi-green/30 shadow-[0_1px_2px_rgba(26,138,46,0.06)]' : 'border-lafoi-dark/10'}`}
          >
            {showSections && (
              <div className="relative">
                {/* Accent strip on the left, only on named sections — quietly
                    signals "this is a chapter". */}
                {named && <div className="absolute left-0 top-0 bottom-0 w-1 bg-lafoi-green" />}
                <div className={`flex items-center gap-3 px-5 py-3.5 ${named ? 'bg-lafoi-green/[0.06] pl-6' : 'bg-lafoi-cream'} border-b border-lafoi-dark/[0.08]`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-sora text-[9px] tracking-[0.32em] uppercase text-lafoi-green-dark mb-1">
                      Section
                    </p>
                    <input
                      value={group.section}
                      onChange={(e) => renameSection(gIdx, e.target.value)}
                      placeholder="Name this section — e.g. Lounge, Master Bathroom"
                      className="w-full bg-transparent border-0 border-b border-transparent hover:border-lafoi-dark/15 focus:border-lafoi-green focus:outline-none font-display text-xl text-lafoi-dark placeholder:text-lafoi-gray-medium/60 placeholder:font-display placeholder:text-lg pb-0.5"
                    />
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium">
                      {groupItems.length} line{groupItems.length === 1 ? '' : 's'}
                    </p>
                    <p className="font-sora text-sm text-lafoi-dark tabular-nums mt-0.5">
                      {fmtCur(groupTotal, currency)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSection(gIdx)}
                    className="shrink-0 p-2 rounded-lg text-lafoi-gray hover:text-red-600 hover:bg-red-50"
                    title="Remove section and its lines"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            )}

            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white border-b border-lafoi-dark/[0.06]">
                  <th className="text-left px-3 py-2 font-sora text-[9px] tracking-[0.22em] uppercase text-lafoi-gray-medium">Description</th>
                  <th className="text-right px-3 py-2 font-sora text-[9px] tracking-[0.22em] uppercase text-lafoi-gray-medium w-56">A × B × Qty</th>
                  <th className="text-center px-3 py-2 font-sora text-[9px] tracking-[0.22em] uppercase text-lafoi-gray-medium w-28">Unit</th>
                  <th className="text-right px-3 py-2 font-sora text-[9px] tracking-[0.22em] uppercase text-lafoi-gray-medium w-32">Unit price</th>
                  <th className="text-right px-3 py-2 font-sora text-[9px] tracking-[0.22em] uppercase text-lafoi-gray-medium w-32">Total</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {groupItems.map((it) => {
                  const idx = it._idx
                  return (
                    <tr key={idx} className="border-b border-lafoi-dark/[0.05] last:border-b-0 align-top">
                      <td className="px-2 py-2">
                        <CatalogPicker
                          value={it.description}
                          onChange={(s) => set(idx, 'description', s)}
                          onPick={(catalog) => fillFromCatalog(idx, catalog)}
                          currency={currency}
                          placeholder="Type or pick from catalog (e.g. Star Ceiling)"
                        />
                        {it.catalog_item && (
                          <p className="mt-1 text-[10px] font-sora tracking-[0.18em] uppercase text-lafoi-green-dark/70">
                            From catalog
                          </p>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1 justify-end">
                          <Input
                            type="number" step="0.01" min="0"
                            value={it.a}
                            onChange={(e) => set(idx, 'a', e.target.value)}
                            placeholder="A"
                            className="text-right !px-2 !w-16"
                            aria-label="Size A"
                          />
                          <X size={9} weight="bold" className="text-lafoi-gray-medium shrink-0" />
                          <Input
                            type="number" step="0.01" min="0"
                            value={it.b}
                            onChange={(e) => set(idx, 'b', e.target.value)}
                            placeholder="B"
                            className="text-right !px-2 !w-16"
                            aria-label="Size B"
                          />
                          <X size={9} weight="bold" className="text-lafoi-gray-medium shrink-0" />
                          <Input
                            type="number" step="0.01" min="0"
                            value={it.qty}
                            onChange={(e) => set(idx, 'qty', e.target.value)}
                            placeholder="Qty"
                            className="text-right !px-2 !w-16"
                            aria-label="Quantity"
                          />
                        </div>
                        <p className="mt-1 text-[10px] font-sora text-lafoi-gray-medium text-right tabular-nums">
                          = {formulaLabel(it)} = {Number(it.quantity || 0).toFixed(2)} {it.unit}
                        </p>
                      </td>
                      <td className="px-2 py-2">
                        <Select value={it.unit} onChange={(e) => set(idx, 'unit', e.target.value)}>
                          {UNIT_OPTIONS.map((u) => (
                            <option key={u.value} value={u.value}>{u.label}</option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          type="number" step="0.01"
                          value={it.unit_price}
                          onChange={(e) => set(idx, 'unit_price', e.target.value)}
                          className="text-right"
                        />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-sora">
                        {fmtCur(lineTotal(it), currency)}
                      </td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => removeRow(idx)}
                          className="p-2 rounded-lg text-lafoi-gray hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className="px-3 py-2 bg-lafoi-cream/40 border-t border-lafoi-dark/[0.06]">
              <SecondaryButton type="button" onClick={() => addLineToGroup(gIdx)} className="!py-1.5 !px-3 !text-xs">
                <Plus size={12} weight="bold" /> Add line{named ? ` to ${group.section}` : ''}
              </SecondaryButton>
            </div>
          </div>
        )
      })}

      {!empty && (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <SecondaryButton type="button" onClick={addNewSection} className="!py-2 !px-3">
            <Plus size={13} weight="bold" /> Add section
          </SecondaryButton>
          <p className="text-[11px] font-sora text-lafoi-gray-medium flex-1 min-w-[200px]">
            Group items by room or area (Bathroom, Lounge, …). Each section reads as its own chapter in the PDF, with its own subtotal.
          </p>
          <div className="text-right shrink-0">
            <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium">Grand total</p>
            <p className="font-display text-2xl text-lafoi-dark tabular-nums">
              {fmtCur(grandTotal, currency)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
