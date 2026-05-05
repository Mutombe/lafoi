import React from 'react'
import { Plus, Trash } from '@phosphor-icons/react'

import { Input, Select, SecondaryButton } from './FormField'

const newRow = () => ({ description: '', quantity: 1, unit: 'unit', unit_price: 0 })

export default function LineItemEditor({ items, onChange, currency = 'USD' }) {
  const set = (idx, key, value) => {
    const next = items.slice()
    next[idx] = { ...next[idx], [key]: value }
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
            <th className="text-right px-3 py-2.5 font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium w-24">Qty</th>
            <th className="text-center px-3 py-2.5 font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium w-24">Unit</th>
            <th className="text-right px-3 py-2.5 font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium w-32">Unit price</th>
            <th className="text-right px-3 py-2.5 font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium w-32">Total</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx} className="border-b border-lafoi-dark/[0.06] last:border-b-0">
              <td className="px-2 py-1.5">
                <Input value={it.description} onChange={(e) => set(idx, 'description', e.target.value)} placeholder="e.g. Matte stretch ceiling — Lounge" />
              </td>
              <td className="px-2 py-1.5">
                <Input type="number" step="0.01" value={it.quantity} onChange={(e) => set(idx, 'quantity', e.target.value)} className="text-right" />
              </td>
              <td className="px-2 py-1.5">
                <Select value={it.unit} onChange={(e) => set(idx, 'unit', e.target.value)}>
                  <option value="unit">unit</option>
                  <option value="m²">m²</option>
                  <option value="m">m</option>
                  <option value="hours">hours</option>
                  <option value="lot">lot</option>
                </Select>
              </td>
              <td className="px-2 py-1.5">
                <Input type="number" step="0.01" value={it.unit_price} onChange={(e) => set(idx, 'unit_price', e.target.value)} className="text-right" />
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums font-sora">
                {currency} {lineTotal(it).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="px-2 py-1.5">
                <button type="button" onClick={() => remove(idx)} className="p-2 rounded-lg text-lafoi-gray hover:text-red-600 hover:bg-red-50">
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
              <SecondaryButton type="button" onClick={add} className="!py-2 !px-3"><Plus size={13} weight="bold" /> Add line</SecondaryButton>
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
