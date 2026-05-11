import React, { useEffect, useState } from 'react'
import { useDispatch, useStore } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
import { useConfirm } from '../components/ConfirmDialog'
  ArrowLeft, ArrowRight, Plus, Trash, PencilSimple, MagnifyingGlass, DownloadSimple, Download, Eye,
  ArrowsClockwise, Sparkle, CircleNotch, Check, Lock, ArrowCounterClockwise,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import DataTable, { fmtDate, fmtMoney, StatusBadge, STATUS_PALETTE_PAYROLL } from '../components/DataTable'
import Modal from '../components/Modal'
import Skeleton, { SkeletonStat, SkeletonPageHeader, SkeletonTableRow } from '../components/Skeleton'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton } from '../components/FormField'
import useDebouncedValue from '../hooks/useDebouncedValue'
import useOptimisticListUpdate from '../hooks/useOptimisticListUpdate'
import {
  api,
  useListPayrollPeriodsQuery,
  useGetPayrollPeriodQuery,
  useCreatePayrollPeriodMutation,
  useUpdatePayrollPeriodMutation,
  useDeletePayrollPeriodMutation,
  useGeneratePayrollEntriesMutation,
  useUpdatePayrollEntryMutation,
  useMarkPeriodReviewedMutation,
  useApprovePeriodMutation,
  useMarkPeriodPaidMutation,
  useClosePeriodMutation,
  useReopenPeriodMutation,
  downloadPdf,
} from '../store/api'

// Bank-file download — reuses the same blob helper as PDFs.
const downloadFile = downloadPdf

const WORKFLOW_STAGES = [
  { key: 'draft', label: 'Draft' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'approved', label: 'Approved' },
  { key: 'paid', label: 'Paid' },
  { key: 'closed', label: 'Closed' },
]

const STATUS_PALETTE_PAYROLL_FULL = {
  draft: 'bg-lafoi-gray-light text-lafoi-gray border-lafoi-dark/10',
  reviewed: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  paid: 'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/40',
  closed: 'bg-purple-50 text-purple-700 border-purple-200',
}

const empty = () => ({
  name: '', period_start: '', period_end: '', pay_date: '',
  status: 'draft', notes: '',
})

export function PayrollList() {
  const confirm = useConfirm()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { setPage(1) }, [debouncedSearch])

  const queryArgs = { page, page_size: pageSize, search: debouncedSearch || undefined }
  const { data, isLoading: isFirstLoad, isFetching } = useListPayrollPeriodsQuery(queryArgs)
  const applyOptimistic = useOptimisticListUpdate('listPayrollPeriods', queryArgs)
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
    if (!(await confirm({ title: 'Delete payroll period?', message: `"${row.name}" and every entry inside it will be removed.`, confirmLabel: 'Delete', danger: true }))) return
    try {
      await applyOptimistic(
        (draft) => {
          if (!draft?.results) return
          draft.results = draft.results.filter((r) => r.id !== row.id)
          if (typeof draft.count === 'number') draft.count = Math.max(0, draft.count - 1)
        },
        () => deleteP(row.id).unwrap(),
      )
      toast.success('Period deleted', { description: row.name })
    } catch (e) {
      toast.error('Could not delete period', { description: e?.data?.detail || 'Delete failed.' })
    }
  }

  const columns = [
    { key: 'name', label: 'Period', priority: 'high', mobileLabel: 'Period', render: (r) => (
      <div>
        <Link
          to={`/dashboard/payroll/${r.id}`}
          onClick={(e) => e.stopPropagation()}
          className="font-sora text-sm font-medium text-lafoi-dark hover:text-lafoi-green inline-flex items-center gap-1.5"
        >
          {r.name}
          <ArrowRight size={11} weight="bold" className="text-lafoi-green" />
        </Link>
        <p className="text-xs text-lafoi-gray-medium">{fmtDate(r.period_start)} → {fmtDate(r.period_end)}</p>
      </div>
    )},
    { key: 'pay_date', label: 'Pay date', priority: 'low', render: (r) => fmtDate(r.pay_date) },
    { key: 'employee_count', label: 'Employees', priority: 'medium', mobileLabel: 'Employees' },
    { key: 'total_gross', label: 'Gross', priority: 'desktop', render: (r) => <span className="tabular-nums">{fmtMoney(r.total_gross)}</span> },
    { key: 'total_net', label: 'Net', priority: 'medium', mobileLabel: 'Net', render: (r) => <span className="tabular-nums">{fmtMoney(r.total_net)}</span> },
    { key: 'status', label: 'Status', priority: 'high', render: (r) => <StatusBadge status={r.status} palette={STATUS_PALETTE_PAYROLL_FULL} /> },
    { key: 'actions', label: '', priority: 'high', render: (r) => (
      <div className="flex justify-end gap-1">
        <Link
          to={`/dashboard/payroll/${r.id}`}
          onClick={(e) => e.stopPropagation()}
          title="Open period · view & download payslips"
          className="px-3 py-2 rounded-lg bg-lafoi-green/10 text-lafoi-green-dark hover:bg-lafoi-green hover:text-white transition-colors min-h-[36px] inline-flex items-center justify-center gap-1.5 text-xs font-sora"
        >
          <Eye size={13} weight="bold" />
          <span className="hidden md:inline">Open</span>
        </Link>
        <button onClick={(e) => { e.stopPropagation(); setEditing(r) }} className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><PencilSimple size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(r) }} className="p-2 rounded-lg hover:bg-red-50 text-lafoi-gray hover:text-red-600 min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><Trash size={14} /></button>
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
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="pl-9 pr-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body w-48"
              />
            </div>
            <PrimaryButton onClick={() => setEditing(empty())}><Plus size={14} weight="bold" /> New period</PrimaryButton>
          </>
        }
      />

      {/* How-to-download hint — payslips live inside each period */}
      <div className="mb-5 px-4 py-3 rounded-2xl bg-lafoi-green/[0.04] border border-lafoi-green/20 flex items-start gap-3">
        <span className="mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full bg-lafoi-green text-white shrink-0">
          <DownloadSimple size={13} weight="bold" />
        </span>
        <div className="flex-1 text-sm text-lafoi-dark">
          <p className="font-sora font-medium">Where are the payslips?</p>
          <p className="text-xs text-lafoi-gray mt-0.5">
            Open any period below — each employee row has a download icon for their branded payslip PDF, plus a "Download bank file" button at the top to export the batch as CSV.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={data?.results || []}
        isLoading={isFirstLoad}
        empty="No payroll periods yet."
        onRowClick={(r) => navigate(`/dashboard/payroll/${r.id}`)}
        pagination={data ? {
          count: data.count,
          page,
          pageSize,
          onPageChange: setPage,
          onPageSizeChange: (s) => { setPageSize(s); setPage(1) },
        } : null}
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
                {['draft', 'reviewed', 'approved', 'paid', 'closed'].map((s) => <option key={s} value={s}>{s}</option>)}
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
  const confirm = useConfirm()
  const { id } = useParams()
  const store = useStore()
  const dispatch = useDispatch()
  const { data: period, isLoading, refetch } = useGetPayrollPeriodQuery(id)
  const [generate, genState] = useGeneratePayrollEntriesMutation()
  const [updateEntry, updateEntryState] = useUpdatePayrollEntryMutation()
  const [editingEntry, setEditingEntry] = useState(null)

  // Workflow mutations + transition modal state.
  const [markReviewed, markReviewedState] = useMarkPeriodReviewedMutation()
  const [approve, approveState] = useApprovePeriodMutation()
  const [markPaid, markPaidState] = useMarkPeriodPaidMutation()
  const [closePeriod, closeState] = useClosePeriodMutation()
  const [reopenPeriod, reopenState] = useReopenPeriodMutation()
  const [transition, setTransition] = useState(null) // { kind, requireReason }
  const [transitionNotes, setTransitionNotes] = useState('')

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
    if (!(await confirm({ title: 'Generate entries?', message: 'Draft payroll entries will be created for every active employee not already in this period.', confirmLabel: 'Generate' }))) return
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

  const handleBankFile = async () => {
    try {
      await downloadFile(
        `payroll-periods/${period.id}/bank-file/`,
        `bank-file-${period.name?.replace(/\s+/g, '-') || period.id}.csv`,
        store.getState,
      )
      toast.success('Bank file downloaded')
    } catch (e) {
      toast.error('Bank file download failed', { description: e.message })
    }
  }

  const TRANSITION_MAP = {
    reviewed: { fn: markReviewed, label: 'Mark as Reviewed', success: 'Marked reviewed', requireReason: false },
    approved: { fn: approve, label: 'Approve', success: 'Approved', requireReason: false },
    paid: { fn: markPaid, label: 'Mark as Paid', success: 'Marked paid', requireReason: false },
    closed: { fn: closePeriod, label: 'Close', success: 'Closed', requireReason: false },
    reopen: { fn: reopenPeriod, label: 'Reopen', success: 'Reopened', requireReason: true },
  }

  const handleTransition = async () => {
    if (!transition) return
    const cfg = TRANSITION_MAP[transition.kind]
    if (cfg.requireReason && !transitionNotes.trim()) {
      toast.error('Reason required', { description: 'Please provide a reason for reopening.' })
      return
    }
    // Optimistic: flip the period status immediately so the workflow strip
    // and badges update before the server round-trip completes. Reopen is
    // back to draft; the rest move to the kind keyword as their status.
    const optimisticStatus = transition.kind === 'reopen' ? 'draft' : transition.kind
    const patch = dispatch(api.util.updateQueryData('getPayrollPeriod', id, (draft) => {
      if (draft) {
        draft.status = optimisticStatus
        if (transition.kind === 'reopen') draft.is_locked = false
        if (transition.kind === 'closed') draft.is_locked = true
      }
    }))
    try {
      const body = transition.kind === 'reopen' ? { reason: transitionNotes } : { notes: transitionNotes || undefined }
      await cfg.fn({ id: period.id, ...body }).unwrap()
      toast.success(cfg.success, { description: period.name })
      setTransition(null)
      setTransitionNotes('')
      refetch()
    } catch (e) {
      patch.undo()
      toast.error('Could not update period', { description: e?.data?.detail || 'Action failed.' })
    }
  }

  const transitioning =
    markReviewedState.isLoading || approveState.isLoading ||
    markPaidState.isLoading || closeState.isLoading || reopenState.isLoading

  const nextStageFor = (status) => {
    switch (status) {
      case 'draft': return { kind: 'reviewed', label: 'Mark as Reviewed', icon: Check, requireReason: false }
      case 'reviewed': return { kind: 'approved', label: 'Approve', icon: Check, requireReason: false }
      case 'approved': return { kind: 'paid', label: 'Mark as Paid', icon: Check, requireReason: false }
      case 'paid': return { kind: 'closed', label: 'Close', icon: Lock, requireReason: false }
      case 'closed': return { kind: 'reopen', label: 'Reopen', icon: ArrowCounterClockwise, requireReason: true }
      default: return null
    }
  }
  const nextStage = nextStageFor(period.status)
  const isLocked = !!period.is_locked

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
            <SecondaryButton onClick={handleBankFile}>
              <Download size={14} weight="bold" /> Bank file
            </SecondaryButton>
            <SecondaryButton onClick={handleGenerate} disabled={genState.isLoading || isLocked} title={isLocked ? 'Period is locked' : undefined}>
              {genState.isLoading ? (<><CircleNotch size={14} className="animate-spin" /> Generating…</>) : (<><Sparkle size={14} weight="bold" /> Generate from active employees</>)}
            </SecondaryButton>
            <StatusBadge status={period.status} palette={STATUS_PALETTE_PAYROLL_FULL} />
          </>
        }
      />

      {/* Workflow strip */}
      <WorkflowStrip
        period={period}
        nextStage={nextStage}
        onTrigger={(stage) => { setTransition(stage); setTransitionNotes('') }}
        transitioning={transitioning}
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
              {['Code', 'Employee', 'Base', 'Allowances', 'Deductions', 'Gross', 'Net', 'Payslip'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(period.entries || []).map((en) => (
              <tr key={en.id} className="border-b border-lafoi-dark/[0.06] last:border-b-0">
                <td className="px-3 py-2 text-xs font-sora">{en.employee_code}</td>
                <td className="px-3 py-2 font-sora text-sm">
                  <div>
                    <p>{en.employee_name}</p>
                    {en.total_clock_hours > 0 && (
                      <p className="text-[10px] tracking-[0.18em] uppercase text-lafoi-gray-medium mt-0.5">
                        {Number(en.total_clock_hours).toFixed(1)}h logged
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 tabular-nums">{fmtMoney(en.base_salary, en.employee_currency)}</td>
                <td className="px-3 py-2 tabular-nums text-lafoi-green-dark">+ {fmtMoney(en.total_allowances, en.employee_currency)}</td>
                <td className="px-3 py-2 tabular-nums text-red-600">− {fmtMoney(en.total_deductions, en.employee_currency)}</td>
                <td className="px-3 py-2 tabular-nums">{fmtMoney(en.gross, en.employee_currency)}</td>
                <td className="px-3 py-2 tabular-nums font-semibold">{fmtMoney(en.net, en.employee_currency)}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => handlePayslip(en.id, en.employee_code, period.id)}
                      title="Download branded payslip PDF"
                      className="px-3 py-1.5 rounded-lg bg-lafoi-green/10 text-lafoi-green-dark hover:bg-lafoi-green hover:text-white transition-colors inline-flex items-center gap-1.5 text-xs font-sora min-h-[32px]"
                    >
                      <DownloadSimple size={13} weight="bold" />
                      <span>Payslip</span>
                    </button>
                    <button
                      onClick={() => !isLocked && setEditingEntry({ ...en })}
                      disabled={isLocked}
                      title={isLocked ? '🔒 Locked' : 'Edit'}
                      className={`p-2 rounded-lg ${
                        isLocked
                          ? 'text-lafoi-gray-medium/60 cursor-not-allowed'
                          : 'hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark'
                      }`}
                    >
                      {isLocked ? <Lock size={14} /> : <PencilSimple size={14} />}
                    </button>
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

      {/* Workflow transition modal */}
      <Modal
        open={!!transition}
        onClose={() => { setTransition(null); setTransitionNotes('') }}
        title={transition ? `${TRANSITION_MAP[transition.kind]?.label} — ${period.name}` : ''}
        size="sm"
        footer={
          <>
            <SecondaryButton type="button" onClick={() => { setTransition(null); setTransitionNotes('') }}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="button" onClick={handleTransition} disabled={transitioning}>
              {transitioning ? (<><CircleNotch size={14} className="animate-spin" /> Saving…</>) : 'Confirm'}
            </PrimaryButton>
          </>
        }
      >
        {transition && (
          <div className="space-y-4">
            <p className="text-sm text-lafoi-gray">
              {transition.kind === 'reopen'
                ? 'Reopening will unlock the period and restore editability. A reason is required for the audit log.'
                : transition.kind === 'closed'
                  ? 'Closing will lock all entries permanently. Subsequent edits require a reopen.'
                  : `Confirm transition to ${TRANSITION_MAP[transition.kind]?.label.toLowerCase()}.`}
            </p>
            <Field
              label={transition.kind === 'reopen' ? 'Reason' : 'Notes'}
              hint={transition.kind === 'reopen' ? 'Required.' : 'Optional.'}
              required={transition.kind === 'reopen'}
            >
              <Textarea value={transitionNotes} onChange={(e) => setTransitionNotes(e.target.value)} rows={3} />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  )
}

/**
 * Five-stage workflow strip — Draft → Reviewed → Approved → Paid → Closed.
 * Past stages are filled green w/ a check; current stage is solid green;
 * future stages are gray outlined. Each completed stage shows the actor.
 */
function WorkflowStrip({ period, nextStage, onTrigger, transitioning }) {
  const status = period.status
  const currentIdx = WORKFLOW_STAGES.findIndex((s) => s.key === status)

  // Build a per-stage actor lookup so we can attribute completed stages.
  const actor = (key) => {
    switch (key) {
      case 'reviewed':
        return period.reviewed_by_name && period.reviewed_at
          ? `by ${period.reviewed_by_name} · ${fmtDate(period.reviewed_at)}` : null
      case 'approved':
        return period.approved_by_name && period.approved_at
          ? `by ${period.approved_by_name} · ${fmtDate(period.approved_at)}` : null
      case 'paid':
        return period.paid_by_name && period.paid_at
          ? `by ${period.paid_by_name} · ${fmtDate(period.paid_at)}` : null
      case 'closed':
        return period.closed_by_name && period.closed_at
          ? `by ${period.closed_by_name} · ${fmtDate(period.closed_at)}` : null
      default:
        return null
    }
  }

  const NextIcon = nextStage?.icon

  return (
    <div className="rounded-3xl border border-lafoi-dark/10 bg-white px-5 sm:px-7 py-5 mb-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray-medium">Workflow</p>
          <p className="font-sora text-sm text-lafoi-dark mt-0.5">
            {period.is_locked ? (
              <span className="inline-flex items-center gap-1 text-purple-700">
                <Lock size={12} weight="bold" /> Period locked
              </span>
            ) : (
              <>Currently <span className="font-medium">{status}</span></>
            )}
            {period.reopened_count > 0 && (
              <span className="ml-2 text-xs text-lafoi-gray-medium">
                · reopened {period.reopened_count}×
              </span>
            )}
          </p>
        </div>
        {nextStage && (
          <PrimaryButton
            type="button"
            onClick={() => onTrigger(nextStage)}
            disabled={transitioning}
            className={nextStage.kind === 'reopen' ? '!bg-purple-700 hover:!bg-purple-800' : ''}
          >
            {transitioning ? <CircleNotch size={14} className="animate-spin" /> : (NextIcon && <NextIcon size={14} weight="bold" />)}
            {nextStage.label}
          </PrimaryButton>
        )}
      </div>

      <ol className="grid grid-cols-5 gap-2 sm:gap-3">
        {WORKFLOW_STAGES.map((stage, idx) => {
          const isPast = currentIdx > idx
          const isCurrent = currentIdx === idx
          const isFuture = currentIdx < idx
          return (
            <li key={stage.key} className="flex flex-col items-center text-center">
              <div className="relative w-full flex items-center">
                {/* Connector line (left side, hidden on first) */}
                {idx > 0 && (
                  <span
                    aria-hidden
                    className={`absolute right-1/2 left-0 -translate-x-1/2 h-px ${
                      isPast || isCurrent ? 'bg-lafoi-green' : 'bg-lafoi-dark/12'
                    }`}
                    style={{ top: '50%' }}
                  />
                )}
                {/* Pill */}
                <span
                  className={`relative z-[1] mx-auto inline-flex items-center justify-center h-8 px-3 rounded-full text-[10px] font-sora tracking-[0.18em] uppercase border whitespace-nowrap transition-colors ${
                    isPast
                      ? 'bg-lafoi-green text-white border-lafoi-green'
                      : isCurrent
                        ? 'bg-lafoi-green text-white border-lafoi-green shadow-[0_0_0_4px_rgba(26,138,46,0.12)]'
                        : 'bg-white text-lafoi-gray-medium border-lafoi-dark/15'
                  }`}
                >
                  {isPast && <Check size={11} weight="bold" className="mr-1" />}
                  {stage.label}
                </span>
              </div>
              <p className={`mt-2 text-[10px] font-sora ${isFuture ? 'text-lafoi-gray-medium/70' : 'text-lafoi-gray-medium'} min-h-[14px]`}>
                {actor(stage.key) || (isCurrent ? 'In progress' : isPast ? 'Done' : ' ')}
              </p>
            </li>
          )
        })}
      </ol>
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
