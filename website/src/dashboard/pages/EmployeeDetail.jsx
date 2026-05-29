import React, { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash, CircleNotch, IdentificationBadge, Bank, Tray, ChartLineUp, User,
  PencilSimple, X as XIcon,
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
  useUpdateEmployeeMutation,
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
  const [mode, setMode] = useState('view')                  // 'view' | 'edit'
  const [form, setForm] = useState(null)
  const [updateEmployee, { isLoading: saving }] = useUpdateEmployeeMutation()

  // Open the edit form pre-populated from `emp`, detecting whether the
  // stored total differs from base+transport so the override flag is set
  // correctly (mirrors the same logic in the Employees-page modal).
  const startEdit = () => {
    const base = Number(emp.base_salary || 0)
    const transport = Number(emp.transport_allowance || 0)
    const total = Number(emp.total_remuneration || 0)
    setForm({
      ...emp,
      _total_overridden: total > 0 && +total.toFixed(2) !== +(base + transport).toFixed(2),
    })
    setMode('edit')
  }
  const cancel = () => { setMode('view'); setForm(null) }

  const save = async () => {
    const payload = {
      first_name: form.first_name?.trim(),
      last_name: form.last_name?.trim(),
      email: form.email || '',
      phone: form.phone || '',
      national_id: form.national_id || '',
      tax_id: form.tax_id || '',
      job_title: form.job_title || '',
      department: form.department || '',
      hire_date: form.hire_date || null,
      end_date: form.end_date || null,
      status: form.status,
      pay_frequency: form.pay_frequency || 'monthly',
      currency: form.currency || 'USD',
      base_salary: Number(form.base_salary) || 0,
      transport_allowance: Number(form.transport_allowance) || 0,
      total_remuneration: Number(form.total_remuneration) || 0,
      home_address: form.home_address || '',
      next_of_kin_name: form.next_of_kin_name || '',
      next_of_kin_relationship: form.next_of_kin_relationship || '',
      next_of_kin_phone: form.next_of_kin_phone || '',
      next_of_kin_email: form.next_of_kin_email || '',
      bank_name: form.bank_name || '',
      bank_account: form.bank_account || '',
      notes: form.notes || '',
    }
    try {
      await updateEmployee({ id: emp.id, ...payload }).unwrap()
      toast.success('Employee updated')
      setMode('view')
      setForm(null)
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Save failed.'
      toast.error('Could not save', { description: msg })
    }
  }

  const editing = mode === 'edit'
  const v = editing ? form : emp

  // Pay auto-sync — identical to the Employees-page modal so the same
  // override/auto-fill semantics hold here.
  const computedTotal = +(Number(v?.base_salary || 0) + Number(v?.transport_allowance || 0)).toFixed(2)
  const storedTotal = Number(v?.total_remuneration || 0)
  const totalOverridden = editing
    ? !!form._total_overridden
    : storedTotal > 0 && +storedTotal.toFixed(2) !== computedTotal

  const updatePay = (patch) => {
    const next = { ...form, ...patch }
    if (!form._total_overridden && (patch.base_salary !== undefined || patch.transport_allowance !== undefined)) {
      next.total_remuneration = +(Number(next.base_salary || 0) + Number(next.transport_allowance || 0)).toFixed(2)
    }
    setForm(next)
  }

  // Small renderer: read-only span in view, Input in edit.
  const Cell = ({ value, onChange, type = 'text', placeholder, render }) => {
    if (!editing) return render ? render(value) : <span className="text-sm font-sora text-lafoi-dark">{value || '—'}</span>
    if (type === 'textarea') return <Textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={2} placeholder={placeholder} />
    return <Input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  }
  const Pick = ({ value, onChange, options }) => {
    if (!editing) return <span className="text-sm font-sora text-lafoi-dark capitalize">{String(value || '—').replace('_', ' ')}</span>
    return (
      <Select value={value || ''} onChange={(e) => onChange(e.target.value)}>
        {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
      </Select>
    )
  }

  const sections = [
    {
      title: 'Identity',
      fields: [
        ...(editing ? [
          ['First name', <Cell value={v.first_name} onChange={(val) => setForm({ ...form, first_name: val })} />],
          ['Last name',  <Cell value={v.last_name}  onChange={(val) => setForm({ ...form, last_name:  val })} />],
        ] : []),
        ['Email',            <Cell value={v.email}       onChange={(val) => setForm({ ...form, email: val })} type="email" />],
        ['Phone',            <Cell value={v.phone}       onChange={(val) => setForm({ ...form, phone: val })} />],
        ['National ID',      <Cell value={v.national_id} onChange={(val) => setForm({ ...form, national_id: val })} />],
        ['Tax / PAYE number',<Cell value={v.tax_id}      onChange={(val) => setForm({ ...form, tax_id: val })} />],
      ],
    },
    {
      title: 'Employment',
      fields: [
        ['Job title',  <Cell value={v.job_title}  onChange={(val) => setForm({ ...form, job_title: val })} />],
        ['Department', <Cell value={v.department} onChange={(val) => setForm({ ...form, department: val })} />],
        ['Hire date',  editing
          ? <Cell type="date" value={v.hire_date || ''} onChange={(val) => setForm({ ...form, hire_date: val })} />
          : <span className="text-sm font-sora">{fmtDate(v.hire_date)}</span>],
        ['End date',   editing
          ? <Cell type="date" value={v.end_date || ''} onChange={(val) => setForm({ ...form, end_date: val })} />
          : <span className="text-sm font-sora">{v.end_date ? fmtDate(v.end_date) : '—'}</span>],
        ['Status',         <Pick value={v.status} onChange={(val) => setForm({ ...form, status: val })}
          options={[['active', 'Active'], ['on_leave', 'On leave'], ['terminated', 'Terminated']]} />],
        ['Pay frequency',  <Pick value={v.pay_frequency || 'monthly'} onChange={(val) => setForm({ ...form, pay_frequency: val })}
          options={[['monthly', 'Monthly'], ['biweekly', 'Biweekly'], ['weekly', 'Weekly']]} />],
      ],
    },
    {
      title: 'Home & emergency contact',
      fields: [
        ['Home address',
          editing
            ? <Textarea value={v.home_address || ''} onChange={(e) => setForm({ ...form, home_address: e.target.value })} rows={2} placeholder="Street, suburb, city" />
            : <span className="text-sm font-sora text-lafoi-dark whitespace-pre-line">{v.home_address || '—'}</span>,
        ],
        ['Next of kin',        <Cell value={v.next_of_kin_name}         onChange={(val) => setForm({ ...form, next_of_kin_name: val })}         placeholder="Full name" />],
        ['Relationship',       <Cell value={v.next_of_kin_relationship} onChange={(val) => setForm({ ...form, next_of_kin_relationship: val })} placeholder="e.g. Spouse" />],
        ['Next of kin phone',  <Cell value={v.next_of_kin_phone}        onChange={(val) => setForm({ ...form, next_of_kin_phone: val })}        placeholder="+263 …" />],
        ['Next of kin email',  <Cell value={v.next_of_kin_email}        onChange={(val) => setForm({ ...form, next_of_kin_email: val })}        type="email" />],
      ],
    },
    {
      title: 'Pay & banking',
      accent: 'green',
      fields: [
        ['Currency',           <Pick value={v.currency || 'USD'} onChange={(val) => setForm({ ...form, currency: val })}
          options={[['USD', 'USD'], ['ZWL', 'ZWL'], ['ZAR', 'ZAR']]} />],
        ['Base salary',
          editing
            ? <Input type="number" step="0.01" value={v.base_salary ?? 0} onChange={(e) => updatePay({ base_salary: e.target.value })} />
            : <span className="text-sm font-sora tabular-nums">{fmtMoney(v.base_salary, v.currency)}</span>,
        ],
        ['Transport allowance',
          editing
            ? <Input type="number" step="0.01" value={v.transport_allowance ?? 0} onChange={(e) => updatePay({ transport_allowance: e.target.value })} />
            : <span className="text-sm font-sora tabular-nums">{fmtMoney(v.transport_allowance, v.currency)}</span>,
        ],
        [
          totalOverridden ? 'Total (manual override)' : 'Total',
          editing
            ? (
              <div>
                <Input
                  type="number" step="0.01"
                  value={v.total_remuneration ?? 0}
                  onChange={(e) => setForm({ ...form, total_remuneration: e.target.value, _total_overridden: true })}
                  className="!font-medium"
                />
                <p className="mt-1 text-[10px] font-sora tracking-[0.18em] uppercase text-lafoi-gray-medium">
                  {form._total_overridden
                    ? <>Manually set · base + transport = {fmtMoney(computedTotal, v.currency)}</>
                    : <>Auto-fills from base + transport</>}
                </p>
                {form._total_overridden && Number(v.total_remuneration) !== computedTotal && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, total_remuneration: computedTotal, _total_overridden: false })}
                    className="mt-1 text-[11px] font-sora tracking-[0.16em] uppercase text-lafoi-green hover:text-lafoi-green-dark"
                  >
                    ↺ Auto-fill from base + transport
                  </button>
                )}
              </div>
            )
            : (
              <span className="inline-flex items-baseline gap-2">
                <span className="text-sm font-sora font-medium tabular-nums text-lafoi-dark">
                  {fmtMoney(storedTotal || computedTotal, v.currency)}
                </span>
                {totalOverridden && (
                  <span className="text-[10px] font-sora tracking-[0.18em] uppercase text-amber-700">
                    base + transport = {fmtMoney(computedTotal, v.currency)}
                  </span>
                )}
              </span>
            ),
        ],
        ['Bank name',    <Cell value={v.bank_name}    onChange={(val) => setForm({ ...form, bank_name: val })} />],
        ['Bank account', <Cell value={v.bank_account} onChange={(val) => setForm({ ...form, bank_account: val })} />],
      ],
    },
  ]

  return (
    <div className="space-y-5">
      {/* Edit / Save / Cancel toolbar */}
      <div className="flex items-center justify-between gap-2 -mt-2">
        <p className="text-xs font-sora tracking-[0.18em] uppercase text-lafoi-gray-medium">
          {editing ? 'Editing profile' : 'Profile details'}
        </p>
        <div className="flex items-center gap-2">
          {!editing ? (
            <PrimaryButton type="button" onClick={startEdit}>
              <PencilSimple size={13} weight="bold" /> Edit profile
            </PrimaryButton>
          ) : (
            <>
              <SecondaryButton type="button" onClick={cancel} disabled={saving}>
                <XIcon size={13} /> Cancel
              </SecondaryButton>
              <PrimaryButton type="button" onClick={save} disabled={saving}>
                {saving ? <><CircleNotch size={13} className="animate-spin" /> Saving…</> : 'Save changes'}
              </PrimaryButton>
            </>
          )}
        </div>
      </div>

      {sections.map((sec) => {
        const green = sec.accent === 'green'
        return (
          <div
            key={sec.title}
            className={`rounded-2xl border bg-white overflow-hidden ${green ? 'border-lafoi-green/30 shadow-[0_1px_2px_rgba(26,138,46,0.06)]' : 'border-lafoi-dark/10'}`}
          >
            <div className={`px-5 py-3 border-b ${green ? 'bg-lafoi-green/[0.06] border-lafoi-green/20' : 'bg-lafoi-cream/40 border-lafoi-dark/[0.06]'}`}>
              <p className={`font-sora text-[10px] tracking-[0.32em] uppercase ${green ? 'text-lafoi-green-dark' : 'text-lafoi-gray-medium'}`}>
                {sec.title}
              </p>
            </div>
            <dl className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-lafoi-dark/[0.06]">
              {sec.fields.map(([label, value], idx) => (
                <div key={label + idx} className={`px-5 py-4 ${idx >= 2 ? 'sm:border-t sm:border-lafoi-dark/[0.06]' : ''}`}>
                  <dt className="font-sora text-[10px] tracking-[0.24em] uppercase text-lafoi-gray-medium mb-1.5">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )
      })}

      {/* Notes — full width, editable */}
      <div className="rounded-2xl border border-lafoi-dark/10 bg-white p-5">
        <p className="font-sora text-[10px] tracking-[0.32em] uppercase text-lafoi-gray-medium mb-2">Notes</p>
        {editing ? (
          <Textarea
            value={form.notes || ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Anything HR should remember about this employee."
          />
        ) : (
          <p className="text-sm text-lafoi-gray whitespace-pre-line">{emp.notes || '—'}</p>
        )}
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
