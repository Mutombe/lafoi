import React from 'react'
import { Plus, Trash, X } from '@phosphor-icons/react'

import { Input, Select, SecondaryButton } from './FormField'

/**
 * Flexible line-item editor.
 *
 * Real La Foi quotes mix three pricing shapes:
 *   - Area (m²):        L × W × Qty × unit_price            (ceiling panels)
 *   - Linear (m):       L × Qty × unit_price                (LED strips, profiles)
 *   - Piece / lot etc:  Qty × unit_price                    (chandeliers, fixtures)
 *
 * The row carries `length`, `width`, `qty` as UI-only fields. The unit
 * dropdown decides which of those are shown and how `effectiveQty` is
 * computed. We send `quantity = effectiveQty` to the backend so the PDF
 * + totals see the right number, but the L / W / Qty breakdown stays
 * editable in the dashboard for future edits via the same modal.
 *
 * For lines loaded from the backend that only carry a quantity, we fall
 * back to a plain Qty-only input (length / width default empty).
 */

const newRow = () => ({
  description: '',
  qty: 1,
  unit: 'm²',
  unit_price: 0,
  length: '',
  width: '',
  // Mirror of effectiveQty kept in sync so saving sends `quantity` cleanly.
  quantity: 0,
})

// Show length input?     m² and m
// Show width input?      m² only
// Always show qty input.
const LAYOUT = {
  'm²':    { length: true, width: true,  multiplier: (L, W, Q) => L * W * Q, suffix: 'm²' },
  'm':     { length: true, width: false, multiplier: (L, _W, Q) => L * Q,    suffix: 'm'  },
  'piece': { length: false, width: false, multiplier: (_L, _W, Q) => Q,      suffix: 'pcs' },
  'unit':  { length: false, width: false, multiplier: (_L, _W, Q) => Q,      suffix: 'units' },
  'hours': { length: false, width: false, multiplier: (_L, _W, Q) => Q,      suffix: 'hrs' },
  'lot':   { length: false, width: false, multiplier: (_L, _W, Q) => Q,      suffix: 'lot' },
}

const layoutFor = (unit) => LAYOUT[unit] || LAYOUT.unit

function computeEffective(it) {
  const L = Number(it.length || 0)
  const W = Number(it.width || 0)
  const Q = Number(it.qty || 0) || (it.qty === 0 ? 0 : 1)
  const { multiplier, length: needL, width: needW } = layoutFor(it.unit)
  // If a required dimension is missing, fall back to the row's stored
  // quantity (covers existing rows + Qty-only entry).
  if (needL && !L) return Q
  if (needW && !W) return needL ? L * Q : Q
  return multiplier(L, W, Q)
}

export default function LineItemEditor({ items, onChange, currency = 'USD' }) {
  const set = (idx, key, value) => {
    const next = items.slice()
    next[idx] = { ...next[idx], [key]: value }
    // Recompute effective quantity after any size / qty / unit change.
    if (key === 'length' || key === 'width' || key === 'qty' || key === 'unit') {
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
            <th className="text-right px-3 py-2.5 font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium w-44">Size / Qty</th>
            <th className="text-center px-3 py-2.5 font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium w-24">Unit</th>
            <th className="text-right px-3 py-2.5 font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium w-32">Unit price</th>
            <th className="text-right px-3 py-2.5 font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium w-32">Total</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => {
            const lay = layoutFor(it.unit)
            return (
              <tr key={idx} className="border-b border-lafoi-dark/[0.06] last:border-b-0 align-top">
                <td className="px-2 py-1.5">
                  <Input
                    value={it.description}
                    onChange={(e) => set(idx, 'description', e.target.value)}
                    placeholder="e.g. Matte stretch ceiling — Lounge"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {lay.length && (
                      <Input
                        type="number" step="0.01" min="0"
                        value={it.length}
                        onChange={(e) => set(idx, 'length', e.target.value)}
                        placeholder="L"
                        className="text-right !px-2 !w-16"
                        aria-label="Length in metres"
                      />
                    )}
                    {lay.width && (
                      <>
                        <X size={10} weight="bold" className="text-lafoi-gray-medium shrink-0" />
                        <Input
                          type="number" step="0.01" min="0"
                          value={it.width}
                          onChange={(e) => set(idx, 'width', e.target.value)}
                          placeholder="W"
                          className="text-right !px-2 !w-16"
                          aria-label="Width in metres"
                        />
                      </>
                    )}
                    {(lay.length || lay.width) && (
                      <X size={10} weight="bold" className="text-lafoi-gray-medium shrink-0" />
                    )}
                    <Input
                      type="number" step="1" min="0"
                      value={it.qty ?? 1}
                      onChange={(e) => set(idx, 'qty', e.target.value)}
                      placeholder="Qty"
                      className="text-right !px-2 !w-14"
                      aria-label="Quantity / count"
                    />
                  </div>
                  <p className="mt-1 text-[10px] font-sora text-lafoi-gray-medium text-right tabular-nums">
                    = {Number(it.quantity || 0).toFixed(2)} {lay.suffix}
                  </p>
                </td>
                <td className="px-2 py-1.5">
                  <Select value={it.unit} onChange={(e) => set(idx, 'unit', e.target.value)}>
                    <option value="m²">m² (area)</option>
                    <option value="m">m (linear)</option>
                    <option value="piece">piece</option>
                    <option value="unit">unit</option>
                    <option value="hours">hours</option>
                    <option value="lot">lot</option>
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
            )
          })}
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
