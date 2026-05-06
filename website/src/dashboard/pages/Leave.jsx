import React, { useMemo, useState } from 'react'
import { Plus, Check, X as XIcon, CircleNotch, Tray } from '@phosphor-icons/react'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import DataTable, { fmtDate, StatusBadge } from '../components/DataTable'
import Modal from '../components/Modal'
import Skeleton from '../components/Skeleton'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton } from '../components/FormField'
import useOptimisticListUpdate from '../hooks/useOptimisticListUpdate'
import {
  useListLeaveTypesQuery,
  useListLeaveBalancesQuery,
  useListLeaveRequestsQuery,
  useCreateLeaveRequestMutation,
  useApproveLeaveRequestMutation,
  useRejectLeaveRequestMutation,
  useListEmployeesQuery,
} from '../store/api'

const LEAVE_TYPE_PALETTE = {
  annual: 'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/40',
  sick: 'bg-blue-50 text-blue-700 border-blue-200',
  maternity: 'bg-purple-50 text-purple-700 border-purple-200',
  paternity: 'bg-purple-50 text-purple-700 border-purple-200',
  compassionate: 'bg-amber-50 text-amber-700 border-amber-200',
  unpaid: 'bg-lafoi-gray-light text-lafoi-gray border-lafoi-dark/10',
}

const STATUS_PALETTE_LEAVE = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/40',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  consumed: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-lafoi-gray-light text-lafoi-gray border-lafoi-dark/10',
}

const REQUEST_FILTERS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'consumed', label: 'Consumed' },
]

// Count weekdays (Mon–Fri) inclusive between two dates.
function weekdayCount(start, end) {
  if (!start || !end) return 0
  const a = new Date(start)
  const b = new Date(end)
  if (a > b) return 0
  let count = 0
  const cursor = new Date(a)
  while (cursor <= b) {
    const day = cursor.getDay()
    if (day !== 0 && day !== 6) count++
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}

export default function Leave() {
  const [tab, setTab] = useState('requests')

  return (
    <div>
      <PageHeader
        eyebrow="Leave"
        title="Time away, accounted for."
        description="Approve requests, watch balances, keep the studio rhythm honest."
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-lafoi-dark/10">
        {[
          { key: 'requests', label: 'Requests' },
          { key: 'balances', label: 'Balances' },
        ].map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative px-4 py-3 text-sm font-sora tracking-wider transition-colors ${
                active ? 'text-lafoi-dark' : 'text-lafoi-gray hover:text-lafoi-dark'
              }`}
            >
              {t.label}
              {active && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-lafoi-green" />}
            </button>
          )
        })}
      </div>

      {tab === 'requests' && <RequestsTab />}
      {tab === 'balances' && <BalancesTab />}
    </div>
  )
}

function RequestsTab() {
  const [statusFilter, setStatusFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [decision, setDecision] = useState(null) // { kind, request }
  const [decisionNotes, setDecisionNotes] = useState('')
  const [error, setError] = useState('')

  const queryArgs = { status: statusFilter || undefined }
  const { data, isLoading } = useListLeaveRequestsQuery(queryArgs)
  const { data: typesData } = useListLeaveTypesQuery({})
  const { data: empData } = useListEmployeesQuery({ page: 1, page_size: 200 })

  const applyOptimistic = useOptimisticListUpdate('listLeaveRequests', queryArgs)

  const [createReq, createState] = useCreateLeaveRequestMutation()
  const [approveReq, approveState] = useApproveLeaveRequestMutation()
  const [rejectReq, rejectState] = useRejectLeaveRequestMutation()

  const isNew = editing && !editing.id
  const saving = createState.isLoading
  const deciding = approveState.isLoading || rejectState.isLoading

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      employee: editing.employee,
      leave_type: editing.leave_type,
      start_date: editing.start_date,
      end_date: editing.end_date,
      days: Number(editing.days) || 0,
      reason: editing.reason || '',
    }
    try {
      const created = await createReq(payload).unwrap()
      toast.success('Request submitted', { description: created?.employee_name })
      setEditing(null)
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Save failed.'
      setError(msg)
      toast.error('Could not submit request', { description: msg })
    }
  }

  const handleDecision = async () => {
    if (!decision) return
    const fn = decision.kind === 'approve' ? approveReq : rejectReq
    const nextStatus = decision.kind === 'approve' ? 'approved' : 'rejected'
    const requestId = decision.request.id
    try {
      await applyOptimistic(
        (draft) => {
          if (!draft) return
          const list = Array.isArray(draft) ? draft : draft.results
          if (!list) return
          const row = list.find((r) => r.id === requestId)
          if (row) row.status = nextStatus
        },
        () => fn({ id: requestId, notes: decisionNotes || undefined }).unwrap(),
      )
      toast.success(decision.kind === 'approve' ? 'Request approved' : 'Request rejected', {
        description: decision.request.employee_name,
      })
      setDecision(null)
      setDecisionNotes('')
    } catch (e) {
      toast.error('Could not update request', { description: e?.data?.detail || 'Action failed.' })
    }
  }

  const newRequest = () => setEditing({
    employee: '',
    leave_type: '',
    start_date: '',
    end_date: '',
    days: 0,
    reason: '',
  })

  const setRange = (patch) => {
    const next = { ...editing, ...patch }
    if (next.start_date && next.end_date) {
      next.days = weekdayCount(next.start_date, next.end_date)
    }
    setEditing(next)
  }

  const columns = useMemo(() => [
    {
      key: 'employee_name', label: 'Employee', priority: 'high', mobileLabel: 'Employee', render: (r) => (
        <div>
          <p className="font-sora text-sm font-medium">{r.employee_name}</p>
        </div>
      ),
    },
    {
      key: 'leave_type', label: 'Type', priority: 'medium', render: (r) => (
        <StatusBadge status={r.leave_type_label || r.leave_type_code} palette={{
          [r.leave_type_label || '']: LEAVE_TYPE_PALETTE[r.leave_type_code] || LEAVE_TYPE_PALETTE.unpaid,
          [r.leave_type_code || '']: LEAVE_TYPE_PALETTE[r.leave_type_code] || LEAVE_TYPE_PALETTE.unpaid,
        }} />
      ),
    },
    {
      key: 'period', label: 'Period', priority: 'medium', mobileLabel: 'Period', render: (r) => (
        <div>
          <p className="text-sm">{fmtDate(r.start_date)} → {fmtDate(r.end_date)}</p>
        </div>
      ),
    },
    {
      key: 'days', label: 'Days', priority: 'medium', render: (r) => <span className="tabular-nums font-sora text-sm">{r.days}</span>,
    },
    {
      key: 'reason', label: 'Reason', priority: 'desktop', render: (r) => (
        <p className="text-xs text-lafoi-gray-medium max-w-[220px] truncate" title={r.reason}>{r.reason || '—'}</p>
      ),
    },
    {
      key: 'status', label: 'Status', priority: 'high', render: (r) => (
        <div>
          <StatusBadge status={r.status} palette={STATUS_PALETTE_LEAVE} />
          {r.decision_by_name && (
            <p className="mt-1 text-[10px] text-lafoi-gray-medium">by {r.decision_by_name}</p>
          )}
        </div>
      ),
    },
    {
      key: 'actions', label: '', priority: 'high', render: (r) => (
        r.status === 'pending' ? (
          <div className="flex justify-end gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setDecision({ kind: 'approve', request: r }); setDecisionNotes('') }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-lafoi-green/10 text-lafoi-green-dark border border-lafoi-green/30 hover:bg-lafoi-green/20 text-xs font-sora min-h-[36px]"
            ><Check size={12} weight="bold" /> Approve</button>
            <button
              onClick={(e) => { e.stopPropagation(); setDecision({ kind: 'reject', request: r }); setDecisionNotes('') }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-xs font-sora min-h-[36px]"
            ><XIcon size={12} weight="bold" /> Reject</button>
          </div>
        ) : null
      ),
    },
  ], [])

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-2">
          {REQUEST_FILTERS.map((f) => {
            const active = statusFilter === f.key
            return (
              <button
                key={f.key || 'all'}
                onClick={() => setStatusFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-sora tracking-wider uppercase border transition-colors ${
                  active
                    ? 'bg-lafoi-dark text-white border-lafoi-dark'
                    : 'bg-white text-lafoi-gray border-lafoi-dark/12 hover:border-lafoi-green hover:text-lafoi-green'
                }`}
              >{f.label}</button>
            )
          })}
        </div>
        <PrimaryButton onClick={newRequest}>
          <Plus size={14} weight="bold" /> New request
        </PrimaryButton>
      </div>

      <DataTable
        columns={columns}
        rows={data?.results || data || []}
        isLoading={isLoading}
        empty="No leave requests yet."
      />

      {/* Create modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="New leave request"
        size="md"
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setEditing(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="leave-form" type="submit" disabled={saving}>
              {saving ? (<><CircleNotch size={14} className="animate-spin" /> Submitting…</>) : 'Submit'}
            </PrimaryButton>
          </>
        }
      >
        {editing && (
          <form id="leave-form" onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
            {error && <div className="sm:col-span-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
            <Field label="Employee" required className="sm:col-span-2">
              <Select
                value={editing.employee || ''}
                onChange={(e) => setEditing({ ...editing, employee: e.target.value })}
                required
              >
                <option value="">Select an employee</option>
                {(empData?.results || []).map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_code})</option>
                ))}
              </Select>
            </Field>
            <Field label="Leave type" required>
              <Select
                value={editing.leave_type || ''}
                onChange={(e) => setEditing({ ...editing, leave_type: e.target.value })}
                required
              >
                <option value="">Select type</option>
                {(typesData?.results || typesData || []).map((t) => (
                  <option key={t.id} value={t.id}>{t.label || t.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Days (working)" required hint="Auto-counted Mon–Fri; editable.">
              <Input type="number" step="0.5" value={editing.days}
                onChange={(e) => setEditing({ ...editing, days: e.target.value })} required />
            </Field>
            <Field label="Start" required>
              <Input type="date" value={editing.start_date || ''}
                onChange={(e) => setRange({ start_date: e.target.value })} required />
            </Field>
            <Field label="End" required>
              <Input type="date" value={editing.end_date || ''}
                onChange={(e) => setRange({ end_date: e.target.value })} required />
            </Field>
            <Field label="Reason" className="sm:col-span-2">
              <Textarea value={editing.reason || ''} onChange={(e) => setEditing({ ...editing, reason: e.target.value })} rows={3} />
            </Field>
          </form>
        )}
      </Modal>

      {/* Approve / Reject confirmation modal */}
      <Modal
        open={!!decision}
        onClose={() => { setDecision(null); setDecisionNotes('') }}
        title={decision ? (decision.kind === 'approve' ? 'Approve request' : 'Reject request') : ''}
        size="sm"
        footer={
          <>
            <SecondaryButton type="button" onClick={() => { setDecision(null); setDecisionNotes('') }}>
              Cancel
            </SecondaryButton>
            <PrimaryButton
              type="button"
              onClick={handleDecision}
              disabled={deciding}
              className={decision?.kind === 'reject' ? '!bg-red-600 hover:!bg-red-700' : ''}
            >
              {deciding ? (<><CircleNotch size={14} className="animate-spin" /> Saving…</>) : (decision?.kind === 'approve' ? 'Approve' : 'Reject')}
            </PrimaryButton>
          </>
        }
      >
        {decision && (
          <div className="space-y-4">
            <p className="text-sm text-lafoi-gray">
              {decision.kind === 'approve' ? 'Approve' : 'Reject'} <span className="font-medium text-lafoi-dark">{decision.request.employee_name}</span>'s
              {' '}{decision.request.leave_type_label || decision.request.leave_type_code} request
              {' '}({fmtDate(decision.request.start_date)} → {fmtDate(decision.request.end_date)}, {decision.request.days} days)?
            </p>
            <Field label="Notes" hint="Optional.">
              <Textarea value={decisionNotes} onChange={(e) => setDecisionNotes(e.target.value)} rows={3} />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  )
}

function BalancesTab() {
  const { data, isLoading } = useListLeaveBalancesQuery({})
  const balances = data?.results || data || []
  const [editing, setEditing] = useState(null)
  // Note: there is no list-level balance update endpoint on the API at this
  // point; the modal collects the new value but does not POST. UI primitive
  // is in place for when the endpoint lands.

  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-lafoi-dark/10 bg-white p-5">
            <Skeleton className="h-2.5 w-20 mb-3" />
            <Skeleton variant="block" className="h-10 w-24 mb-3" />
            <Skeleton className="h-2.5 w-32" />
          </div>
        ))}
      </div>
    )
  }

  if (balances.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-lafoi-dark/15 bg-white px-6 py-16 text-center">
        <Tray size={28} className="mx-auto mb-3 text-lafoi-gray-medium" />
        <p className="font-display text-lg">No leave balances yet.</p>
        <p className="mt-1 text-sm text-lafoi-gray-medium">Create employees and leave types to see them appear here.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {balances.map((b) => {
          const palette = LEAVE_TYPE_PALETTE[b.leave_type_code] || LEAVE_TYPE_PALETTE.unpaid
          return (
            <button
              key={b.id}
              onClick={() => setEditing({ ...b })}
              className="text-left rounded-2xl border border-lafoi-dark/10 bg-white hover:border-lafoi-green/40 hover:shadow-[0_4px_16px_rgba(17,17,17,0.04)] transition-all p-5 group"
            >
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-sora tracking-[0.22em] uppercase ${palette}`}>
                {b.leave_type_label || b.leave_type_code}
              </span>
              <div className="mt-3 flex items-baseline gap-1.5">
                <p className="font-display text-5xl tracking-tight tabular-nums">{Number(b.balance).toFixed(0)}</p>
                <p className="font-sora text-xs tracking-[0.22em] uppercase text-lafoi-gray-medium">days</p>
              </div>
              <p className="mt-3 font-sora text-sm text-lafoi-dark">{b.employee_name}</p>
              <p className="text-xs text-lafoi-gray-medium">
                {b.last_accrued_on ? `Accrued ${fmtDate(b.last_accrued_on)}` : 'Not yet accrued'}
              </p>
            </button>
          )
        })}
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `${editing.employee_name} — ${editing.leave_type_label || editing.leave_type_code}` : ''}
        size="sm"
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setEditing(null)}>Close</SecondaryButton>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <Field label="Days available">
              <Input type="number" step="0.5" value={editing.balance}
                onChange={(e) => setEditing({ ...editing, balance: e.target.value })} disabled />
            </Field>
            <p className="text-xs text-lafoi-gray-medium">
              Balances accrue automatically each pay period. To adjust manually, contact your admin or edit the leave type accrual rules.
            </p>
          </div>
        )}
      </Modal>
    </>
  )
}
