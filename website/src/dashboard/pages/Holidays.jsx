import React, { useMemo, useState } from 'react'
import { Plus, Trash, CircleNotch, CalendarStar } from '@phosphor-icons/react'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import DataTable, { fmtDate, StatusBadge } from '../components/DataTable'
import Modal from '../components/Modal'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton } from '../components/FormField'
import useOptimisticListUpdate from '../hooks/useOptimisticListUpdate'
import {
  useListPublicHolidaysQuery,
  useCreatePublicHolidayMutation,
  useDeletePublicHolidayMutation,
} from '../store/api'

const PAID_PALETTE = {
  paid: 'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/40',
  unpaid: 'bg-lafoi-gray-light text-lafoi-gray border-lafoi-dark/10',
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function Holidays() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  const queryArgs = { year }
  const { data, isLoading } = useListPublicHolidaysQuery(queryArgs)
  const holidays = data?.results || data || []
  const applyOptimistic = useOptimisticListUpdate('listPublicHolidays', queryArgs)

  const [createH, createState] = useCreatePublicHolidayMutation()
  const [deleteH] = useDeletePublicHolidayMutation()
  const saving = createState.isLoading

  // Map "YYYY-MM-DD" → holiday object for fast lookups in the calendar.
  const holidayByDate = useMemo(() => {
    const m = new Map()
    holidays.forEach((h) => {
      if (h.date) m.set(h.date, h)
    })
    return m
  }, [holidays])

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      name: editing.name?.trim(),
      date: editing.date,
      is_paid: !!editing.is_paid,
      notes: editing.notes || '',
    }
    try {
      const created = await createH(payload).unwrap()
      toast.success('Holiday added', { description: created?.name || payload.name })
      setEditing(null)
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Save failed.'
      setError(msg)
      toast.error('Could not add holiday', { description: msg })
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete "${row.name}"?`)) return
    try {
      await applyOptimistic(
        (draft) => {
          if (!draft) return
          if (Array.isArray(draft)) {
            const idx = draft.findIndex((r) => r.id === row.id)
            if (idx >= 0) draft.splice(idx, 1)
            return
          }
          if (draft.results) {
            draft.results = draft.results.filter((r) => r.id !== row.id)
            if (typeof draft.count === 'number') draft.count = Math.max(0, draft.count - 1)
          }
        },
        () => deleteH(row.id).unwrap(),
      )
      toast.success('Holiday removed', { description: row.name })
    } catch (e) {
      toast.error('Could not delete', { description: e?.data?.detail || 'Delete failed.' })
    }
  }

  const newHoliday = () => setEditing({
    name: '',
    date: `${year}-01-01`,
    is_paid: true,
    notes: '',
  })

  const sortedHolidays = useMemo(() =>
    [...holidays].sort((a, b) => (a.date || '').localeCompare(b.date || '')),
    [holidays],
  )

  const yearOptions = useMemo(() => {
    const out = []
    for (let y = currentYear - 2; y <= currentYear + 3; y++) out.push(y)
    return out
  }, [currentYear])

  const columns = [
    { key: 'date', label: 'Date', priority: 'high', mobileLabel: 'Date', render: (r) => (
      <span className="font-sora text-sm tabular-nums">{fmtDate(r.date)}</span>
    )},
    { key: 'name', label: 'Name', priority: 'high', mobileLabel: 'Name', render: (r) => (
      <span className="font-sora text-sm font-medium">{r.name}</span>
    )},
    { key: 'is_paid', label: 'Paid', priority: 'medium', render: (r) => (
      <StatusBadge status={r.is_paid ? 'paid' : 'unpaid'} palette={PAID_PALETTE} />
    )},
    { key: 'notes', label: 'Notes', priority: 'desktop', render: (r) => (
      <p className="text-xs text-lafoi-gray-medium max-w-[260px] truncate" title={r.notes}>{r.notes || '—'}</p>
    )},
    { key: 'actions', label: '', priority: 'high', render: (r) => (
      <div className="flex justify-end gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(r) }}
          className="p-2 rounded-lg hover:bg-red-50 text-lafoi-gray hover:text-red-600 min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
        ><Trash size={14} /></button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Public holidays"
        title="The shape of the year."
        description="Public holidays drive payroll multipliers and leave calendar guards. Add them once, the rest follows."
        actions={
          <>
            <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-32">
              {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
            <PrimaryButton onClick={newHoliday}>
              <Plus size={14} weight="bold" /> Add holiday
            </PrimaryButton>
          </>
        }
      />

      {/* Calendar grid: 12 months */}
      <div className="rounded-3xl border border-lafoi-dark/10 bg-white p-5 sm:p-7 mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-7">
          {Array.from({ length: 12 }).map((_, monthIdx) => (
            <MonthBlock
              key={monthIdx}
              year={year}
              monthIdx={monthIdx}
              holidayByDate={holidayByDate}
            />
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={sortedHolidays}
        isLoading={isLoading}
        empty={`No public holidays recorded for ${year} yet.`}
      />

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Add public holiday"
        size="sm"
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setEditing(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="hol-form" type="submit" disabled={saving}>
              {saving ? (<><CircleNotch size={14} className="animate-spin" /> Saving…</>) : 'Save'}
            </PrimaryButton>
          </>
        }
      >
        {editing && (
          <form id="hol-form" onSubmit={handleSave} className="space-y-4">
            {error && <div className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
            <Field label="Name" required>
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="e.g. Independence Day" required />
            </Field>
            <Field label="Date" required>
              <Input type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} required />
            </Field>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!editing.is_paid}
                onChange={(e) => setEditing({ ...editing, is_paid: e.target.checked })}
                className="w-4 h-4 accent-lafoi-green"
              />
              <span className="font-sora text-sm">Paid holiday</span>
            </label>
            <Field label="Notes">
              <Textarea value={editing.notes || ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={2} />
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}

/**
 * Tiny month grid — 7 columns (Mon–Sun) by 6 rows. Days that match a public
 * holiday are filled with lafoi-green/15 and have the holiday name as a tooltip.
 */
function MonthBlock({ year, monthIdx, holidayByDate }) {
  const firstDay = new Date(year, monthIdx, 1)
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate()
  // JS getDay(): 0 = Sun. We want Mon-first, so shift.
  const startOffset = (firstDay.getDay() + 6) % 7

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const pad = (n) => String(n).padStart(2, '0')

  return (
    <div>
      <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray-medium mb-2">
        {MONTH_NAMES[monthIdx]}
      </p>
      <div className="grid grid-cols-7 gap-0.5 text-[10px] font-sora text-lafoi-gray-medium mb-1">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i} className="text-center">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (d === null) return <span key={i} className="aspect-square" />
          const dateStr = `${year}-${pad(monthIdx + 1)}-${pad(d)}`
          const h = holidayByDate.get(dateStr)
          const today = (() => {
            const t = new Date()
            return (
              t.getFullYear() === year &&
              t.getMonth() === monthIdx &&
              t.getDate() === d
            )
          })()
          return (
            <span
              key={i}
              title={h ? `${h.name}${h.is_paid ? ' (paid)' : ''}` : undefined}
              className={`aspect-square flex items-center justify-center rounded-md text-[10px] tabular-nums transition-colors ${
                h
                  ? 'bg-lafoi-green/15 text-lafoi-green-dark font-semibold cursor-help'
                  : today
                    ? 'ring-1 ring-lafoi-dark/30 text-lafoi-dark'
                    : 'text-lafoi-gray hover:bg-lafoi-cream'
              }`}
            >
              {d}
            </span>
          )
        })}
      </div>
    </div>
  )
}
