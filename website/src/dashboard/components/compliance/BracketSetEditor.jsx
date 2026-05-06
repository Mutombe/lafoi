import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Trash, ArrowUp, ArrowDown, CircleNotch, Infinity as InfinityIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'

import Modal from '../Modal'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton } from '../FormField'
import {
  useCreateTaxBracketSetMutation,
  useUpdateTaxBracketSetMutation,
} from '../../store/api'

const CURRENCIES = ['USD', 'ZWG', 'ZWL', 'ZAR']

const blankBracket = (sort_order = 0) => ({
  sort_order,
  lower: 0,
  upper: null,
  rate: 0,
  fixed_deduction: 0,
})

const blankSet = () => ({
  name: '',
  currency: 'USD',
  effective_from: new Date().toISOString().slice(0, 10),
  effective_to: '',
  aids_levy_rate: 3,
  notes: '',
  is_active: true,
  brackets: [blankBracket(0)],
})

/**
 * Modal-based bracket-set editor. Reused for both create (no `set` passed)
 * and edit (existing `set` passed in). Closes via `onClose` after a save.
 */
export default function BracketSetEditor({ open, onClose, set }) {
  const [draft, setDraft] = useState(blankSet())
  const [error, setError] = useState('')
  const [createSet, createState] = useCreateTaxBracketSetMutation()
  const [updateSet, updateState] = useUpdateTaxBracketSetMutation()
  const isNew = !draft?.id
  const saving = createState.isLoading || updateState.isLoading

  // Reset draft whenever the modal is (re)opened with a different target.
  useEffect(() => {
    if (!open) return
    if (set && set.id) {
      setDraft({
        ...set,
        effective_from: set.effective_from || '',
        effective_to: set.effective_to || '',
        notes: set.notes || '',
        brackets: (set.brackets || [])
          .slice()
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((b) => ({
            sort_order: b.sort_order ?? 0,
            lower: b.lower,
            upper: b.upper,
            rate: b.rate,
            fixed_deduction: b.fixed_deduction,
          })),
      })
    } else {
      setDraft(blankSet())
    }
    setError('')
  }, [open, set])

  const setField = (key, value) => setDraft((d) => ({ ...d, [key]: value }))

  const setBracket = (idx, patch) => {
    setDraft((d) => {
      const next = d.brackets.slice()
      next[idx] = { ...next[idx], ...patch }
      return { ...d, brackets: next }
    })
  }
  const removeBracket = (idx) =>
    setDraft((d) => ({
      ...d,
      brackets: d.brackets
        .filter((_, i) => i !== idx)
        .map((b, i) => ({ ...b, sort_order: i })),
    }))
  const addBracket = () =>
    setDraft((d) => {
      const last = d.brackets[d.brackets.length - 1]
      const nextLower = last ? Number(last.upper ?? last.lower ?? 0) : 0
      return {
        ...d,
        brackets: [
          ...d.brackets,
          { ...blankBracket(d.brackets.length), lower: nextLower },
        ],
      }
    })
  const move = (idx, dir) =>
    setDraft((d) => {
      const next = d.brackets.slice()
      const target = idx + dir
      if (target < 0 || target >= next.length) return d
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return { ...d, brackets: next.map((b, i) => ({ ...b, sort_order: i })) }
    })

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      name: draft.name?.trim(),
      currency: draft.currency,
      effective_from: draft.effective_from,
      effective_to: draft.effective_to || null,
      aids_levy_rate: Number(draft.aids_levy_rate) || 0,
      notes: draft.notes || '',
      is_active: !!draft.is_active,
      brackets: draft.brackets.map((b, i) => ({
        sort_order: i,
        lower: Number(b.lower) || 0,
        upper: b.upper === '' || b.upper === null || b.upper === undefined ? null : Number(b.upper),
        rate: Number(b.rate) || 0,
        fixed_deduction: Number(b.fixed_deduction) || 0,
      })),
    }
    try {
      if (isNew) {
        const created = await createSet(payload).unwrap()
        toast.success('Bracket set created', { description: created?.name })
      } else {
        const updated = await updateSet({ id: draft.id, ...payload }).unwrap()
        toast.success('Bracket set saved', { description: updated?.name })
      }
      onClose?.()
    } catch (err) {
      const msg = err?.data
        ? (typeof err.data === 'string' ? err.data : Object.values(err.data).flat().join(' '))
        : 'Save failed.'
      setError(msg)
      toast.error(isNew ? 'Could not create bracket set' : 'Could not save bracket set', { description: msg })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isNew ? 'New ZIMRA bracket set' : `Edit ${set?.name || 'bracket set'}`}
      size="xl"
      footer={
        <>
          <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton form="bracket-set-form" type="submit" disabled={saving}>
            {saving ? (<><CircleNotch size={14} className="animate-spin" /> Saving…</>) : 'Save bracket set'}
          </PrimaryButton>
        </>
      }
    >
      <form id="bracket-set-form" onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Name" required className="sm:col-span-2">
            <Input
              value={draft.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="e.g. ZIMRA USD 2026"
              required
            />
          </Field>
          <Field label="Currency" required>
            <Select value={draft.currency} onChange={(e) => setField('currency', e.target.value)}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="AIDS Levy %">
            <Input
              type="number"
              step="0.01"
              value={draft.aids_levy_rate}
              onChange={(e) => setField('aids_levy_rate', e.target.value)}
            />
          </Field>
          <Field label="Effective from" required>
            <Input
              type="date"
              value={draft.effective_from || ''}
              onChange={(e) => setField('effective_from', e.target.value)}
              required
            />
          </Field>
          <Field label="Effective to" hint="Leave blank for ongoing">
            <Input
              type="date"
              value={draft.effective_to || ''}
              onChange={(e) => setField('effective_to', e.target.value)}
            />
          </Field>
          <label className="flex items-end gap-2 pb-2 lg:col-span-2 select-none">
            <input
              type="checkbox"
              checked={!!draft.is_active}
              onChange={(e) => setField('is_active', e.target.checked)}
              className="h-4 w-4 rounded border-lafoi-dark/20 text-lafoi-green focus:ring-lafoi-green"
            />
            <span className="font-sora text-[11px] tracking-[0.2em] uppercase text-lafoi-gray-medium">
              Active — used by payroll & previews
            </span>
          </label>
          <Field label="Notes" className="sm:col-span-2 lg:col-span-4">
            <Textarea
              rows={2}
              value={draft.notes || ''}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder="Internal note — e.g. 'Per ZIMRA SI 144 of 2025'"
            />
          </Field>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">Brackets</p>
              <p className="font-display text-lg tracking-tight mt-0.5">Marginal table</p>
            </div>
            <SecondaryButton type="button" onClick={addBracket} className="!py-2 !px-3">
              <Plus size={13} weight="bold" /> Add bracket
            </SecondaryButton>
          </div>

          <BracketTable
            brackets={draft.brackets}
            currency={draft.currency}
            onPatch={setBracket}
            onMove={move}
            onRemove={removeBracket}
          />
          <p className="mt-2 text-[11px] text-lafoi-gray-medium">
            ZIMRA-style lookup: <span className="font-mono">tax = gross × rate% − fixed_deduction</span>.
            Top bracket should leave its upper bound empty (∞).
          </p>
        </div>
      </form>
    </Modal>
  )
}

function BracketTable({ brackets, currency, onPatch, onMove, onRemove }) {
  return (
    <div className="rounded-2xl border border-lafoi-dark/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-lafoi-cream border-b border-lafoi-dark/10">
            <th className="text-left px-3 py-2.5 font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium w-12">#</th>
            <th className="text-right px-3 py-2.5 font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium">Lower</th>
            <th className="text-right px-3 py-2.5 font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium">Upper</th>
            <th className="text-right px-3 py-2.5 font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium w-28">Rate %</th>
            <th className="text-right px-3 py-2.5 font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium w-36">Fixed deduction</th>
            <th className="text-left px-3 py-2.5 font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium">Preview</th>
            <th className="w-24" />
          </tr>
        </thead>
        <tbody>
          {brackets.map((b, idx) => {
            const isTop = b.upper === null || b.upper === '' || b.upper === undefined
            const sample = isTop
              ? Number(b.lower || 0) + 1000
              : (Number(b.lower || 0) + Number(b.upper || 0)) / 2
            const tax = (sample * (Number(b.rate) || 0)) / 100 - (Number(b.fixed_deduction) || 0)
            return (
              <tr key={idx} className="border-b border-lafoi-dark/[0.06] last:border-b-0">
                <td className="px-3 py-1.5 font-sora text-xs text-lafoi-gray-medium tabular-nums">{idx + 1}</td>
                <td className="px-2 py-1.5">
                  <Input
                    type="number"
                    step="0.01"
                    value={b.lower ?? 0}
                    onChange={(e) => onPatch(idx, { lower: e.target.value })}
                    className="text-right"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      step="0.01"
                      value={isTop ? '' : b.upper ?? ''}
                      onChange={(e) => onPatch(idx, { upper: e.target.value === '' ? null : e.target.value })}
                      className="text-right"
                      placeholder={isTop ? '∞' : ''}
                      disabled={isTop}
                    />
                    <button
                      type="button"
                      onClick={() => onPatch(idx, { upper: isTop ? Number(b.lower || 0) + 1000 : null })}
                      title={isTop ? 'Set finite upper bound' : 'Set as top bracket (∞)'}
                      className={`p-1.5 rounded-lg border text-xs ${
                        isTop
                          ? 'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/30'
                          : 'bg-white text-lafoi-gray border-lafoi-dark/12 hover:border-lafoi-green hover:text-lafoi-green'
                      }`}
                    >
                      <InfinityIcon size={14} weight="bold" />
                    </button>
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    type="number"
                    step="0.01"
                    value={b.rate ?? 0}
                    onChange={(e) => onPatch(idx, { rate: e.target.value })}
                    className="text-right"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    type="number"
                    step="0.01"
                    value={b.fixed_deduction ?? 0}
                    onChange={(e) => onPatch(idx, { fixed_deduction: e.target.value })}
                    className="text-right"
                  />
                </td>
                <td className="px-3 py-1.5 text-[11px] text-lafoi-gray-medium font-sora">
                  At <span className="tabular-nums text-lafoi-dark">{currency} {sample.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span> →
                  <span className="tabular-nums text-lafoi-green-dark ml-1">{currency} {Math.max(0, tax).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex justify-end gap-0.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => onMove(idx, -1)}
                      className="p-1.5 rounded-lg text-lafoi-gray hover:bg-lafoi-cream hover:text-lafoi-dark disabled:opacity-30 disabled:cursor-not-allowed"
                    ><ArrowUp size={13} /></button>
                    <button
                      type="button"
                      disabled={idx === brackets.length - 1}
                      onClick={() => onMove(idx, 1)}
                      className="p-1.5 rounded-lg text-lafoi-gray hover:bg-lafoi-cream hover:text-lafoi-dark disabled:opacity-30 disabled:cursor-not-allowed"
                    ><ArrowDown size={13} /></button>
                    <button
                      type="button"
                      onClick={() => onRemove(idx)}
                      className="p-1.5 rounded-lg text-lafoi-gray hover:bg-red-50 hover:text-red-600"
                    ><Trash size={13} /></button>
                  </div>
                </td>
              </tr>
            )
          })}
          {brackets.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-sm text-lafoi-gray-medium">
                No brackets — click "Add bracket" to start.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
