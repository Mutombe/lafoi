import React, { useState } from 'react'
import { useStore } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash, PencilSimple, MagnifyingGlass, DownloadSimple, ArrowsClockwise, Sparkle, CircleNotch } from '@phosphor-icons/react'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import DataTable, { fmtDate, fmtMoney, StatusBadge, STATUS_PALETTE_PAYROLL } from '../components/DataTable'
import Modal from '../components/Modal'
import Skeleton, { SkeletonStat, SkeletonPageHeader, SkeletonTableRow } from '../components/Skeleton'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton } from '../components/FormField'
import {
  useListPayrollPeriodsQuery,
  useGetPayrollPeriodQuery,
  useCreatePayrollPeriodMutation,
  useUpdatePayrollPeriodMutation,
  useDeletePayrollPeriodMutation,
  useGeneratePayrollEntriesMutation,
  useUpdatePayrollEntryMutation,
  downloadPdf,
} from '../store/api'

const empty = () => ({
  name: '', period_start: '', period_end: '', pay_date: '',
  status: 'draft', notes: '',
})

export function PayrollList() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  const { data, isLoading: isFirstLoad, isFetching } = useListPayrollPeriodsQuery({ page, search: search || undefined })
  const [createP, createState] = useCreatePayrollPeriodMutation()
  const [updateP, updateState] = useUpdatePayrollPeriodMutation()
  const [deleteP] = useDeletePayrollPeriodMutation()

  const isNew = editing && !editing.id
  const saving = createState.isLoading || updateState.isLoading

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      name: editing.name,
      period_start: editing.period_start,
      period_end: editing.period_end,
      pay_date: editing.pay_date || null,
      status: editing.status,
      notes: editing.notes || '',
    }
    try {
      if (isNew) {
        const created = await createP(payload).unwrap()
        toast.success('Period created', { description: created?.name || payload.name })
      } else {
        const updated = await updateP({ id: editing.id, ...payload }).unwrap()
        toast.success('Period updated', { description: updated?.name || payload.name })
      }
      setEditing(null)
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Save failed.'
      setError(msg)
      toast.error(isNew ? 'Could not create period' : 'Could not update period', { description: msg })
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete payroll period "${row.name}"? Entries will be removed too.`)) return
    try {
      await deleteP(row.id).unwrap()
      toast.success('Period deleted', { description: row.name })
    } catch (e) {
      toast.error('Could not delete period', { description: e?.data?.detail || 'Delete failed.' })
    }
  }

  const columns = [
    { key: 'name', label: 'Period', render: (r) => (
      <div>
        <Link to={`/dashboard/payroll/${r.id}`} className="font-sora text-sm font-medium hover:text-lafoi-green">{r.name}</Link>
        <p className="text-xs text-lafoi-gray-medium">{fmtDate(r.period_start)} → {fmtDate(r.period_end)}</p>
      </div>
    )},
    { key: 'pay_date', label: 'Pay date', render: (r) => fmtDate(r.pay_date) },
    { key: 'employee_count', label: 'Employees' },
    { key: 'total_gross', label: 'Gross', render: (r) => <span className="tabular-nums">{fmtMoney(r.total_gross)}</span> },
    { key: 'total_net', label: 'Net', render: (r) => <span className="tabular-nums">{fmtMoney(r.total_net)}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} palette={STATUS_PALETTE_PAYROLL} /> },
    { key: 'actions', label: '', render: (r) => (
      <div className="flex justify-end gap-1">
        <button onClick={(e) => { e.stopPropagation(); setEditing(r) }} className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark"><PencilSimple size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(r) }} className="p-2 rounded-lg hover:bg-red-50 text-lafoi-gray hover:text-red-600"><Trash size={14} /></button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Payroll"
        title="Pay periods at a glance."
        description="Create a period, generate entries from active employees, edit per-person line items, then export payslips."
        actions={
          <>
            <div className="relative">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lafoi-gray-medium" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search"
                className="pl-9 pr-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body w-48"
              />
            </div>
            <PrimaryButton onClick={() => setEditing(empty())}><Plus size={14} weight="bold" /> New period</PrimaryButton>
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={data?.results || []}
        isLoading={isFirstLoad}
        empty="No payroll periods yet."
        pagination={data ? { count: data.count, page, pageSize: 25, onPageChange: setPage } : null}
      />

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={isNew ? 'New payroll period' : `Edit ${editing?.name}`}
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setEditing(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="period-form" type="submit" disabled={saving}>
              {saving ? (<><CircleNotch size={14} className="animate-spin" /> Saving…</>) : 'Save'}
            </PrimaryButton>
          </>
        }
      >
        {editing && (
          <form id="period-form" onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
            {error && <div className="sm:col-span-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
            <Field label="Name" required className="sm:col-span-2">
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. May 2026" required />
            </Field>
            <Field label="Period start" required>
              <Input type="date" value={editing.period_start} onChange={(e) => setEditing({ ...editing, period_start: e.target.value })} required />
            </Field>
            <Field label="Period end" required>
              <Input type="date" value={editing.period_end} onChange={(e) => setEditing({ ...editing, period_end: e.target.value })} required />
            </Field>
            <Field label="Pay date">
              <Input type="date" value={editing.pay_date || ''} onChange={(e) => setEditing({ ...editing, pay_date: e.target.value })} />
            </Field>
            <Field label="Status">
              <Select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                {['draft', 'approved', 'paid', 'closed'].map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={2} />
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}

export function PayrollDetail() {
  const { id } = useParams()
  const store = useStore()
  const { data: period, isLoading, refetch } = useGetPayrollPeriodQuery(id)
  const [generate, genState] = useGeneratePayrollEntriesMutation()
  const [updateEntry, updateEntryState] = useUpdatePayrollEntryMutation()
  const [editingEntry, setEditingEntry] = useState(null)

  if (isLoading || !period) {
    return (
      <div>
        <Skeleton className="h-3 w-24 mb-4" />
        <SkeletonPageHeader />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat accent="green" />
        </div>
        <div className="rounded-2xl border border-lafoi-dark/10 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-lafoi-cream border-b border-lafoi-dark/10">
                {['Code', 'Employee', 'Base', 'Allowances', 'Deductions', 'Gross', 'Net', ''].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonTableRow key={i} columns={8} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const handleGenerate = async () => {
    if (!window.confirm(`Generate draft entries for every active employee not already in this period?`)) return
    try {
      const response = await generate(period.id).unwrap()
      const created = response?.created ?? response?.count ?? 0
      toast.success('Entries generated', { description: `${created} new draft entries` })
      refetch()
    } catch (e) {
      toast.error('Generation failed', { description: e?.data?.detail || 'Generation failed.' })
    }
  }

  const handleSaveEntry = async (e) => {
    e.preventDefault()
    try {
      await updateEntry({
        id: editingEntry.id,
        base_salary: Number(editingEntry.base_salary) || 0,
        overtime_hours: Number(editingEntry.overtime_hours) || 0,
        overtime_rate: Number(editingEntry.overtime_rate) || 0,
        allowances: editingEntry.allowances || [],
        deductions: editingEntry.deductions || [],
        notes: editingEntry.notes || '',
        paid_on: editingEntry.paid_on || null,
      }).unwrap()
      toast.success('Payslip saved', { description: editingEntry.employee_name })
      refetch()
      setEditingEntry(null)
    } catch (e) {
      toast.error('Could not save payslip', { description: e?.data?.detail || 'Save failed.' })
    }
  }

  const handlePayslip = async (entryId, code, periodId) => {
    try {
      await downloadPdf(`payroll-entries/${entryId}/payslip/`, `payslip-${code}-${periodId}.pdf`, store.getState)
      toast.success('Payslip downloaded', { description: `payslip-${code}-${periodId}.pdf` })
    }
    catch (e) { toast.error('Payslip download failed', { description: e.message }) }
  }

  const upsertItem = (key, idx, patch) => {
    const arr = (editingEntry[key] || []).slice()
    arr[idx] = { ...arr[idx], ...patch }
    setEditingEntry({ ...editingEntry, [key]: arr })
  }
  const removeItem = (key, idx) => setEditingEntry({ ...editingEntry, [key]: (editingEntry[key] || []).filter((_, i) => i !== idx) })
  const addItem = (key) => setEditingEntry({ ...editingEntry, [key]: [...(editingEntry[key] || []), { name: '', amount: 0 }] })

  return (
    <div>
      <Link to="/dashboard/payroll" className="inline-flex items-center gap-2 text-xs font-sora tracking-widest text-lafoi-gray-medium hover:text-lafoi-dark mb-4">
        <ArrowLeft size={12} /> All periods
      </Link>

      <PageHeader
        eyebrow="Payroll period"
        title={period.name}
        description={`${fmtDate(period.period_start)} → ${fmtDate(period.period_end)}`}
        actions={
          <>
            <SecondaryButton onClick={handleGenerate} disabled={genState.isLoading}>
              {genState.isLoading ? (<><CircleNotch size={14} className="animate-spin" /> Generating…</>) : (<><Sparkle size={14} weight="bold" /> Generate from active employees</>)}
            </SecondaryButton>
            <StatusBadge status={period.status} palette={STATUS_PALETTE_PAYROLL} />
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label="Employees" value={period.employee_count} />
        <Stat label="Gross" value={fmtMoney(period.total_gross)} />
        <Stat label="Deductions" value={fmtMoney(period.total_deductions)} />
        <Stat label="Net" value={fmtMoney(period.total_net)} accent="green" />
      </div>

      <div className="rounded-2xl border border-lafoi-dark/10 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-lafoi-cream border-b border-lafoi-dark/10">
              {['Code', 'Employee', 'Base', 'Allowances', 'Deductions', 'Gross', 'Net', ''].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(period.entries || []).map((en) => (
              <tr key={en.id} className="border-b border-lafoi-dark/[0.06] last:border-b-0">
                <td className="px-3 py-2 text-xs font-sora">{en.employee_code}</td>
                <td className="px-3 py-2 font-sora text-sm">{en.employee_name}</td>
                <td className="px-3 py-2 tabular-nums">{fmtMoney(en.base_salary, en.employee_currency)}</td>
                <td className="px-3 py-2 tabular-nums text-lafoi-green-dark">+ {fmtMoney(en.total_allowances, en.employee_currency)}</td>
                <td className="px-3 py-2 tabular-nums text-red-600">− {fmtMoney(en.total_deductions, en.employee_currency)}</td>
                <td className="px-3 py-2 tabular-nums">{fmtMoney(en.gross, en.employee_currency)}</td>
                <td className="px-3 py-2 tabular-nums font-semibold">{fmtMoney(en.net, en.employee_currency)}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => handlePayslip(en.id, en.employee_code, period.id)} className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark"><DownloadSimple size={14} /></button>
                    <button onClick={() => setEditingEntry({ ...en })} className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark"><PencilSimple size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {(period.entries || []).length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-lafoi-gray-medium">
                No entries — click "Generate from active employees" to start.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!editingEntry}
        onClose={() => setEditingEntry(null)}
        title={editingEntry ? `Edit payslip — ${editingEntry.employee_name}` : ''}
        size="lg"
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setEditingEntry(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="entry-form" type="submit" disabled={updateEntryState.isLoading}>
              {updateEntryState.isLoading ? (<><CircleNotch size={14} className="animate-spin" /> Saving…</>) : 'Save'}
            </PrimaryButton>
          </>
        }
      >
        {editingEntry && (
          <form id="entry-form" onSubmit={handleSaveEntry} className="grid sm:grid-cols-2 gap-4">
            <Field label="Base salary">
              <Input type="number" step="0.01" value={editingEntry.base_salary} onChange={(e) => setEditingEntry({ ...editingEntry, base_salary: e.target.value })} />
            </Field>
            <Field label="Paid on">
              <Input type="date" value={editingEntry.paid_on || ''} onChange={(e) => setEditingEntry({ ...editingEntry, paid_on: e.target.value })} />
            </Field>
            <Field label="Overtime hours">
              <Input type="number" step="0.01" value={editingEntry.overtime_hours} onChange={(e) => setEditingEntry({ ...editingEntry, overtime_hours: e.target.value })} />
            </Field>
            <Field label="Overtime hourly rate">
              <Input type="number" step="0.01" value={editingEntry.overtime_rate} onChange={(e) => setEditingEntry({ ...editingEntry, overtime_rate: e.target.value })} />
            </Field>

            <div className="sm:col-span-2">
              <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray mb-2">Allowances</p>
              <div className="space-y-2">
                {(editingEntry.allowances || []).map((a, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2">
                    <Input className="col-span-7" value={a.name || ''} onChange={(e) => upsertItem('allowances', idx, { name: e.target.value })} placeholder="Name" />
                    <Input className="col-span-4 text-right" type="number" step="0.01" value={a.amount || 0} onChange={(e) => upsertItem('allowances', idx, { amount: e.target.value })} />
                    <button type="button" onClick={() => removeItem('allowances', idx)} className="col-span-1 text-lafoi-gray hover:text-red-600"><Trash size={14} /></button>
                  </div>
                ))}
                <SecondaryButton type="button" onClick={() => addItem('allowances')} className="!py-2 !px-3"><Plus size={13} weight="bold" /> Add allowance</SecondaryButton>
              </div>
            </div>
            <div className="sm:col-span-2">
              <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray mb-2">Deductions</p>
              <div className="space-y-2">
                {(editingEntry.deductions || []).map((d, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2">
                    <Input className="col-span-7" value={d.name || ''} onChange={(e) => upsertItem('deductions', idx, { name: e.target.value })} placeholder="Name" />
                    <Input className="col-span-4 text-right" type="number" step="0.01" value={d.amount || 0} onChange={(e) => upsertItem('deductions', idx, { amount: e.target.value })} />
                    <button type="button" onClick={() => removeItem('deductions', idx)} className="col-span-1 text-lafoi-gray hover:text-red-600"><Trash size={14} /></button>
                  </div>
                ))}
                <SecondaryButton type="button" onClick={() => addItem('deductions')} className="!py-2 !px-3"><Plus size={13} weight="bold" /> Add deduction</SecondaryButton>
              </div>
            </div>

            <Field label="Notes" className="sm:col-span-2">
              <Textarea value={editingEntry.notes || ''} onChange={(e) => setEditingEntry({ ...editingEntry, notes: e.target.value })} rows={2} />
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}

function Stat({ label, value, accent }) {
  const ring = accent === 'green' ? 'border-lafoi-green/25 bg-lafoi-green/[0.04]' : 'border-lafoi-dark/10 bg-white'
  return (
    <div className={`p-5 rounded-2xl border ${ring}`}>
      <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">{label}</p>
      <p className="font-display text-2xl mt-2 tracking-tight">{value}</p>
    </div>
  )
}
