import React, { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash, CircleNotch, IdentificationBadge, Bank, Tray, ChartLineUp, User,
} from '@phosphor-icons/react'
import { useConfirm } from '../components/ConfirmDialog'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import DataTable, { fmtDate, fmtMoney, StatusBadge } from '../components/DataTable'
import Modal from '../components/Modal'
import Skeleton, { SkeletonStat, SkeletonPageHeader } from '../components/Skeleton'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton } from '../components/FormField'
import {
  useGetEmployeeQuery,
  useListSalaryHistoryQuery,
  useCreateSalaryHistoryMutation,
  useDeleteSalaryHistoryMutation,
  useListEmployeeLoansQuery,
  useListLeaveBalancesQuery,
  useListLeaveRequestsQuery,
  useEmployeeYtdQuery,
} from '../store/api'

const STATUS_PALETTE_EMP = {
  active: 'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/40',
  on_leave: 'bg-amber-50 text-amber-700 border-amber-200',
  terminated: 'bg-lafoi-gray-light text-lafoi-gray border-lafoi-dark/10',
}

const STATUS_PALETTE_LOAN = {
  active: 'bg-blue-50 text-blue-700 border-blue-200',
  settled: 'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/40',
  written_off: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-lafoi-gray-light text-lafoi-gray border-lafoi-dark/10',
}

const STATUS_PALETTE_LEAVE = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/40',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  consumed: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-lafoi-gray-light text-lafoi-gray border-lafoi-dark/10',
}

const TABS = [
  { key: 'profile', label: 'Profile', Icon: User },
  { key: 'salary', label: 'Salary history', Icon: ChartLineUp },
  { key: 'loans', label: 'Loans', Icon: Bank },
  { key: 'leave', label: 'Leave', Icon: Tray },
  { key: 'ytd', label: 'YTD', Icon: ChartLineUp },
]

export default function EmployeeDetail() {
  const confirm = useConfirm()
  const { id } = useParams()
  const [tab, setTab] = useState('profile')

  const { data: emp, isLoading } = useGetEmployeeQuery(id)

  if (isLoading || !emp) {
    return (
      <div>
        <Skeleton className="h-3 w-24 mb-4" />
        <SkeletonPageHeader />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
        </div>
      </div>
    )
  }

  const initials = `${emp.first_name?.[0] || ''}${emp.last_name?.[0] || ''}` || 'L'

  return (
    <div>
      <Link to="/dashboard/employees" className="inline-flex items-center gap-2 text-xs font-sora tracking-widest text-lafoi-gray-medium hover:text-lafoi-dark mb-4">
        <ArrowLeft size={12} /> All employees
      </Link>

      {/* Header card */}
      <div className="rounded-3xl border border-lafoi-dark/10 bg-white p-6 sm:p-7 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-lafoi-green/10 border border-lafoi-green/30 flex items-center justify-center font-display text-2xl sm:text-3xl text-lafoi-green-dark shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray-medium">{emp.employee_code}</p>
          <h2 className="font-display text-2xl sm:text-3xl tracking-tight truncate">{emp.full_name}</h2>
          <p className="text-sm text-lafoi-gray mt-0.5">{emp.job_title || 'Team member'}{emp.department ? ` · ${emp.department}` : ''}</p>
        </div>
        <StatusBadge status={emp.status} palette={STATUS_PALETTE_EMP} />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 mb-6 border-b border-lafoi-dark/10">
        {TABS.map((t) => {
          const active = tab === t.key
          const Icon = t.Icon
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm font-sora tracking-wider transition-colors ${
                active ? 'text-lafoi-dark' : 'text-lafoi-gray hover:text-lafoi-dark'
              }`}
            >
              <Icon size={14} weight={active ? 'bold' : 'regular'} />
              {t.label}
              {active && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-lafoi-green" />}
            </button>
          )
        })}
      </div>

      {tab === 'profile' && <ProfileTab emp={emp} />}
      {tab === 'salary' && <SalaryTab employeeId={emp.id} currency={emp.currency} />}
      {tab === 'loans' && <LoansTab employeeId={emp.id} />}
      {tab === 'leave' && <LeaveTab employeeId={emp.id} />}
      {tab === 'ytd' && <YtdTab employeeId={emp.id} />}
    </div>
  )
}

function ProfileTab({ emp }) {
  const fields = [
    ['Email', emp.email || '—'],
    ['Phone', emp.phone || '—'],
    ['National ID', emp.national_id || '—'],
    ['Tax / PAYE number', emp.tax_id || '—'],
    ['Hire date', fmtDate(emp.hire_date)],
    ['End date', emp.end_date ? fmtDate(emp.end_date) : '—'],
    ['Base salary', fmtMoney(emp.base_salary, emp.currency)],
    ['Transport allowance', fmtMoney(emp.transport_allowance, emp.currency)],
    ['Total (salary + transport)',
      fmtMoney(
        emp.total_remuneration ??
          (Number(emp.base_salary || 0) + Number(emp.transport_allowance || 0)),
        emp.currency,
      ),
    ],
    ['Pay frequency', emp.pay_frequency || 'monthly'],
    ['Bank name', emp.bank_name || '—'],
    ['Bank account', emp.bank_account || '—'],
  ]
  return (
    <div className="rounded-2xl border border-lafoi-dark/10 bg-white">
      <dl className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-lafoi-dark/[0.06]">
        {fields.map(([label, value], idx) => (
          <div key={label} className={`px-5 py-4 ${idx >= 2 ? 'sm:border-t sm:border-lafoi-dark/[0.06]' : ''}`}>
            <dt className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray-medium">{label}</dt>
            <dd className="mt-1 text-sm font-sora">{value}</dd>
          </div>
        ))}
      </dl>
      {emp.notes && (
        <div className="px-5 py-4 border-t border-lafoi-dark/[0.06]">
          <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray-medium">Notes</p>
          <p className="mt-1 text-sm text-lafoi-gray">{emp.notes}</p>
        </div>
      )}
      <div className="px-5 py-4 border-t border-lafoi-dark/[0.06] flex items-center justify-end">
        <Link to="/dashboard/employees" className="text-xs font-sora tracking-wider text-lafoi-gray hover:text-lafoi-green">
          Edit on the Employees page →
        </Link>
      </div>
    </div>
  )
}

function SalaryTab({ employeeId, currency }) {
  const { data, isLoading } = useListSalaryHistoryQuery({ employee: employeeId })
  const [createSH, createState] = useCreateSalaryHistoryMutation()
  const [deleteSH] = useDeleteSalaryHistoryMutation()
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  const items = data?.results || data || []
  const sorted = useMemo(() =>
    [...items].sort((a, b) => (b.effective_from || '').localeCompare(a.effective_from || '')),
    [items],
  )

  const newEntry = () => setEditing({
    employee: employeeId,
    base_salary: 0,
    currency: currency || 'USD',
    effective_from: new Date().toISOString().slice(0, 10),
    reason: '',
  })

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await createSH({
        employee: employeeId,
        base_salary: Number(editing.base_salary) || 0,
        currency: editing.currency,
        effective_from: editing.effective_from,
        reason: editing.reason || '',
      }).unwrap()
      toast.success('Salary change recorded')
      setEditing(null)
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Save failed.'
      setError(msg)
      toast.error('Could not save', { description: msg })
    }
  }

  const handleDelete = async (row) => {
    if (!(await confirm({ title: 'Delete salary entry?', message: 'The salary history record will be removed.', confirmLabel: 'Delete', danger: true }))) return
    try {
      await deleteSH(row.id).unwrap()
      toast.success('Entry removed')
    } catch (e) {
      toast.error('Could not delete', { description: e?.data?.detail || 'Delete failed.' })
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray">
          Compensation timeline
        </p>
        <PrimaryButton onClick={newEntry}>
          <Plus size={14} weight="bold" /> Add salary change
        </PrimaryButton>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="block" className="h-20" />
          ))}
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <div className="rounded-2xl border border-dashed border-lafoi-dark/15 bg-white px-6 py-12 text-center">
          <ChartLineUp size={24} className="mx-auto mb-2 text-lafoi-gray-medium" />
          <p className="text-sm text-lafoi-gray">No salary history yet.</p>
        </div>
      )}

      {!isLoading && sorted.length > 0 && (
        <ol className="relative border-l-2 border-lafoi-green/20 pl-6 space-y-5">
          {sorted.map((s) => (
            <li key={s.id} className="relative">
              <span className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-lafoi-green border-2 border-white shadow" />
              <div className="rounded-2xl border border-lafoi-dark/10 bg-white px-5 py-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-xl tabular-nums tracking-tight">
                    {fmtMoney(s.base_salary, s.currency)}
                  </p>
                  <p className="text-xs text-lafoi-gray-medium mt-0.5">
                    Effective {fmtDate(s.effective_from)}
                    {s.effective_to ? ` → ${fmtDate(s.effective_to)}` : ' → present'}
                  </p>
                  {s.reason && <p className="text-sm text-lafoi-gray mt-2">{s.reason}</p>}
                </div>
                <button
                  onClick={() => handleDelete(s)}
                  className="p-2 rounded-lg hover:bg-red-50 text-lafoi-gray hover:text-red-600 shrink-0"
                ><Trash size={14} /></button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Add salary change"
        size="sm"
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setEditing(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="sh-form" type="submit" disabled={createState.isLoading}>
              {createState.isLoading ? (<><CircleNotch size={14} className="animate-spin" /> Saving…</>) : 'Save'}
            </PrimaryButton>
          </>
        }
      >
        {editing && (
          <form id="sh-form" onSubmit={handleSave} className="space-y-4">
            {error && <div className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Base salary" required>
                <Input type="number" step="0.01" value={editing.base_salary}
                  onChange={(e) => setEditing({ ...editing, base_salary: e.target.value })} required />
              </Field>
              <Field label="Currency">
                <Select value={editing.currency} onChange={(e) => setEditing({ ...editing, currency: e.target.value })}>
                  <option value="USD">USD</option>
                  <option value="ZWG">ZWG</option>
                  <option value="ZWL">ZWL</option>
                  <option value="ZAR">ZAR</option>
                </Select>
              </Field>
            </div>
            <Field label="Effective from" required>
              <Input type="date" value={editing.effective_from}
                onChange={(e) => setEditing({ ...editing, effective_from: e.target.value })} required />
            </Field>
            <Field label="Reason">
              <Textarea value={editing.reason} onChange={(e) => setEditing({ ...editing, reason: e.target.value })} rows={2}
                placeholder="e.g. Promotion to senior designer" />
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}

function LoansTab({ employeeId }) {
  const { data, isLoading } = useListEmployeeLoansQuery({ employee: employeeId })
  const loans = data?.results || data || []

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} variant="block" className="h-24" />)}
      </div>
    )
  }

  if (loans.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-lafoi-dark/15 bg-white px-6 py-12 text-center">
        <Bank size={24} className="mx-auto mb-2 text-lafoi-gray-medium" />
        <p className="text-sm text-lafoi-gray">No loans or advances on file.</p>
        <Link to="/dashboard/loans" className="mt-2 inline-block text-xs font-sora tracking-wider text-lafoi-green hover:underline">
          Manage loans →
        </Link>
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {loans.map((l) => {
        const principal = Number(l.principal) || 0
        const repaid = Number(l.total_repaid) || 0
        const pct = principal > 0 ? Math.min(100, (repaid / principal) * 100) : 0
        return (
          <div key={l.id} className="rounded-2xl border border-lafoi-dark/10 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray-medium">{l.reference}</p>
                <p className="font-display text-xl tabular-nums mt-1">{fmtMoney(l.principal, l.currency)}</p>
                <p className="text-xs text-lafoi-gray-medium mt-0.5">
                  {fmtMoney(l.instalment, l.currency)} / period · issued {fmtDate(l.issued_on)}
                </p>
              </div>
              <StatusBadge status={l.status} palette={STATUS_PALETTE_LOAN} />
            </div>
            <div className="mt-4">
              <div className="h-1.5 rounded-full bg-lafoi-dark/10 overflow-hidden">
                <div className="h-full bg-lafoi-green-light rounded-full" style={{ width: `${Math.max(pct, 4)}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-lafoi-gray-medium tabular-nums">
                {fmtMoney(repaid, l.currency)} repaid · {fmtMoney(l.balance, l.currency)} remaining
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function LeaveTab({ employeeId }) {
  const { data: balData, isLoading: balLoading } = useListLeaveBalancesQuery({ employee: employeeId })
  const { data: reqData, isLoading: reqLoading } = useListLeaveRequestsQuery({ employee: employeeId })
  const balances = balData?.results || balData || []
  const requests = (reqData?.results || reqData || []).slice(0, 8)

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <div>
        <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray mb-3">Balances</p>
        {balLoading && <Skeleton variant="block" className="h-32" />}
        {!balLoading && balances.length === 0 && (
          <div className="rounded-2xl border border-dashed border-lafoi-dark/15 bg-white px-5 py-10 text-center text-sm text-lafoi-gray">
            No leave balances.
          </div>
        )}
        {!balLoading && balances.length > 0 && (
          <ul className="rounded-2xl border border-lafoi-dark/10 bg-white divide-y divide-lafoi-dark/[0.06]">
            {balances.map((b) => (
              <li key={b.id} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <p className="font-sora text-sm">{b.leave_type_label || b.leave_type_code}</p>
                  <p className="text-xs text-lafoi-gray-medium">
                    {b.last_accrued_on ? `Accrued ${fmtDate(b.last_accrued_on)}` : 'Not yet accrued'}
                  </p>
                </div>
                <p className="font-display text-2xl tabular-nums tracking-tight text-lafoi-green-dark">
                  {Number(b.balance).toFixed(0)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray mb-3">Recent requests</p>
        {reqLoading && <Skeleton variant="block" className="h-32" />}
        {!reqLoading && requests.length === 0 && (
          <div className="rounded-2xl border border-dashed border-lafoi-dark/15 bg-white px-5 py-10 text-center text-sm text-lafoi-gray">
            No requests on file.
          </div>
        )}
        {!reqLoading && requests.length > 0 && (
          <ul className="rounded-2xl border border-lafoi-dark/10 bg-white divide-y divide-lafoi-dark/[0.06]">
            {requests.map((r) => (
              <li key={r.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-sora text-sm truncate">{r.leave_type_label || r.leave_type_code}</p>
                  <p className="text-xs text-lafoi-gray-medium">
                    {fmtDate(r.start_date)} → {fmtDate(r.end_date)} · {r.days} days
                  </p>
                </div>
                <StatusBadge status={r.status} palette={STATUS_PALETTE_LEAVE} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function YtdTab({ employeeId }) {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const { data, isLoading } = useEmployeeYtdQuery({ id: employeeId, year })

  const yearOptions = useMemo(() => {
    const out = []
    for (let y = currentYear - 2; y <= currentYear; y++) out.push(y)
    return out
  }, [currentYear])

  const currency = data?.currency || 'USD'

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray">
          Year-to-date totals
        </p>
        <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-32">
          {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} accent={i === 3 ? 'green' : 'cream'} />)
        ) : (
          <>
            <YtdStat label="Gross" value={fmtMoney(data?.gross, currency)} />
            <YtdStat label="PAYE" value={fmtMoney(data?.paye, currency)} />
            <YtdStat label="NSSA" value={fmtMoney(data?.nssa, currency)} />
            <YtdStat label="Net" value={fmtMoney(data?.net, currency)} accent="green" />
          </>
        )}
      </div>
      {!isLoading && data?.periods && (
        <p className="mt-4 text-xs text-lafoi-gray-medium">
          Across {data.periods} period{data.periods === 1 ? '' : 's'} in {year}.
        </p>
      )}
    </div>
  )
}

function YtdStat({ label, value, accent }) {
  const ring = accent === 'green' ? 'border-lafoi-green/25 bg-lafoi-green/[0.04]' : 'border-lafoi-dark/10 bg-white'
  return (
    <div className={`p-5 rounded-2xl border ${ring}`}>
      <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">{label}</p>
      <p className="font-display text-2xl mt-2 tracking-tight tabular-nums">{value}</p>
    </div>
  )
}
