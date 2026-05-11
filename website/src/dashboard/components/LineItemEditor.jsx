import React from 'react'
import { Plus, Trash, X } from '@phosphor-icons/react'

import { Input, Select, SecondaryButton } from './FormField'

/**
 * Truly flexible line-item editor.
 *
 * Real La Foi quotes mix every pricing shape imaginable:
 *
 *   • 4.2 × 3.8 m² × 2 rooms × $45  (area, multiple rooms)
 *   • 6 strips × 2.5 m × $50         (linear with multiplier)
 *   • 20 L × $12                     (paint, epoxy resin)
 *   • 4 chandeliers × $480           (piece)
 *   • 80 m² × $32                    (single-room area)
 *
 * Rather than baking a "ceilings are area" assumption into the form,
 * each row has THREE generic numeric factors (Size A, Size B, Qty)
 * plus a unit and a unit price. Any subset of factors can be filled —
 * effective quantity is the product of whatever's non-empty:
 *
 *   effective = (A || 1) × (B || 1) × (Qty || 1)
 *   line_total = effective × unit_price
 *
 * Empty factors collapse to 1, so a row with just Qty acts like piece
 * pricing; a row with just Size A and Qty acts like linear × count;
 * a row with all three acts like area × count.
 *
 * The label under the inputs shows the live formula so installers can
 * audit at a glance: "= 4.2 × 3.8 × 2 = 31.92 m²".
 *
 * Backend storage is unchanged: we send `quantity = effective`
 * (rounded to 2dp), unit, unit_price. The A / B / Qty breakdown is
 * UI-only and is regenerated next time the line is edited.
 */

// Expanded unit dropdown — covers every measurement we've actually
// quoted across La Foi work. Keep the most common first.
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

const newRow = () => ({
  description: '',
  a: '',
  b: '',
  qty: 1,
  unit: 'm²',
  unit_price: 0,
  // Mirror of effective quantity. Sent to backend as `quantity`.
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
  // Empty fields are multiplicative identity. But at least one non-zero
  // factor must exist for the line to register a quantity.
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

export default function LineItemEditor({ items, onChange, currency = 'USD' }) {
  const set = (idx, key, value) => {
    const next = items.slice()
    next[idx] = { ...next[idx], [key]: value }
    if (key === 'a' || key === 'b' || key === 'qty' || key === 'unit') {
      next[idx].quantity = +computeEffective(next[idx]).toFixed(2)
    }
    onChange(next)
  }
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx))
  const add = () => onChange([...items, newRow()])

  const lineTotal = (it) => Number(it.quantity || 0) * Number(it.unit_price || 0)
  const subtotal = items.reduce((s, it) => s + lineTotal(it), 0)

  return (
    <div className="rounded-2xl border border-lafoi-dark/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-lafoi-cream border-b border-lafoi-dark/10">
            <th className="text-left px-3 py-2.5 font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium">Description</th>
            <th className="text-right px-3 py-2.5 font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium w-56">A &times; B &times; Qty</th>
            <th className="text-center px-3 py-2.5 font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium w-28">Unit</th>
            <th className="text-right px-3 py-2.5 font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium w-32">Unit price</th>
            <th className="text-right px-3 py-2.5 font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium w-32">Total</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx} className="border-b border-lafoi-dark/[0.06] last:border-b-0 align-top">
              <td className="px-2 py-1.5">
                <Input
                  value={it.description}
                  onChange={(e) => set(idx, 'description', e.target.value)}
                  placeholder="e.g. Matte stretch ceiling — Lounge"
                />
              </td>
              <td className="px-2 py-1.5">
                <div className="flex items-center gap-1 justify-end">
                  <Input
                    type="number" step="0.01" min="0"
                    value={it.a}
                    onChange={(e) => set(idx, 'a', e.target.value)}
                    placeholder="A"
                    className="text-right !px-2 !w-16"
                    aria-label="Size A (length, litres, weight, …)"
                  />
                  <X size={9} weight="bold" className="text-lafoi-gray-medium shrink-0" />
                  <Input
                    type="number" step="0.01" min="0"
                    value={it.b}
                    onChange={(e) => set(idx, 'b', e.target.value)}
                    placeholder="B"
                    className="text-right !px-2 !w-16"
                    aria-label="Size B (width, second factor)"
                  />
                  <X size={9} weight="bold" className="text-lafoi-gray-medium shrink-0" />
                  <Input
                    type="number" step="0.01" min="0"
                    value={it.qty}
                    onChange={(e) => set(idx, 'qty', e.target.value)}
                    placeholder="Qty"
                    className="text-right !px-2 !w-16"
                    aria-label="Quantity / count"
                  />
                </div>
                <p className="mt-1 text-[10px] font-sora text-lafoi-gray-medium text-right tabular-nums">
                  = {formulaLabel(it)} = {Number(it.quantity || 0).toFixed(2)} {it.unit}
                </p>
              </td>
              <td className="px-2 py-1.5">
                <Select value={it.unit} onChange={(e) => set(idx, 'unit', e.target.value)}>
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </Select>
              </td>
              <td className="px-2 py-1.5">
                <Input
                  type="number" step="0.01"
                  value={it.unit_price}
                  onChange={(e) => set(idx, 'unit_price', e.target.value)}
                  className="text-right"
                />
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums font-sora">
                {currency} {lineTotal(it).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="p-2 rounded-lg text-lafoi-gray hover:text-red-600 hover:bg-red-50"
                >
                  <Trash size={14} />
                </button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-lafoi-gray-medium">No line items yet.</td></tr>
          )}
        </tbody>
        <tfoot>
          <tr className="bg-lafoi-cream/60 border-t border-lafoi-dark/10">
            <td colSpan={4} className="px-3 py-2.5">
              <SecondaryButton type="button" onClick={add} className="!py-2 !px-3">
                <Plus size={13} weight="bold" /> Add line
              </SecondaryButton>
            </td>
            <td className="px-3 py-2.5 text-right font-sora font-semibold tabular-nums">
              {currency} {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
