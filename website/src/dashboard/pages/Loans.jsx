import React, { useEffect, useMemo, useState } from 'react'
import {
  Plus, Trash, PencilSimple, MagnifyingGlass, CircleNotch, Eye, Bank,
} from '@phosphor-icons/react'
import { useConfirm } from '../components/ConfirmDialog'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import DataTable, { fmtDate, fmtMoney, StatusBadge } from '../components/DataTable'
import Modal from '../components/Modal'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton, DangerButton } from '../components/FormField'
import useDebouncedValue from '../hooks/useDebouncedValue'
import useOptimisticRow from '../hooks/useOptimisticRow'
import {
  useListEmployeeLoansQuery,
  useGetEmployeeLoanQuery,
  useCreateEmployeeLoanMutation,
  useUpdateEmployeeLoanMutation,
  useDeleteEmployeeLoanMutation,
  useListEmployeesQuery,
} from '../store/api'

const STATUS_PALETTE_LOAN = {
  active: 'bg-blue-50 text-blue-700 border-blue-200',
  settled: 'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/40',
  written_off: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-lafoi-gray-light text-lafoi-gray border-lafoi-dark/10',
}

const KIND_PALETTE = {
  loan: 'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/40',
  advance: 'bg-amber-50 text-amber-700 border-amber-200',
}

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'settled', label: 'Settled' },
  { key: 'written_off', label: 'Written off' },
  { key: 'cancelled', label: 'Cancelled' },
]

const empty = () => ({
  employee: '',
  kind: 'loan',
  principal: 0,
  instalment: 0,
  currency: 'USD',
  interest_rate: 0,
  issued_on: new Date().toISOString().slice(0, 10),
  first_repayment_period: '',
  notes: '',
  status: 'active',
})

export default function Loans() {
  const confirm = useConfirm()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [editing, setEditing] = useState(null)
  const [viewingRepayments, setViewingRepayments] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { setPage(1) }, [debouncedSearch, statusFilter])

  const queryArgs = {
    page,
    page_size: pageSize,
    status: statusFilter || undefined,
    search: debouncedSearch || undefined,
  }
  const { data, isLoading: isFirstLoad } = useListEmployeeLoansQuery(queryArgs)
  const { data: employeesData } = useListEmployeesQuery({ page: 1, page_size: 200 })

  const { optimisticCreate, optimisticUpdate, optimisticDelete } = useOptimisticRow('listEmployeeLoans', queryArgs)
  const employees = employeesData?.results || []

  const [createL] = useCreateEmployeeLoanMutation()
  const [updateL] = useUpdateEmployeeLoanMutation()
  const [deleteL] = useDeleteEmployeeLoanMutation()

  const isNew = editing && !editing.id

  const handleSave = (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      employee: editing.employee,
      kind: editing.kind,
      principal: Number(editing.principal) || 0,
      instalment: Number(editing.instalment) || 0,
      currency: editing.currency || 'USD',
      interest_rate: Number(editing.interest_rate) || 0,
      issued_on: editing.issued_on || null,
      first_repayment_period: editing.first_repayment_period || null,
      notes: editing.notes || '',
      status: editing.status || 'active',
    }
    const wasNew = isNew
    const id = editing.id
    const empMatch = employees.find((e) => String(e.id) === String(payload.employee))
    setEditing(null)
    const tempRow = {
      ...payload,
      reference: wasNew ? '…' : editing.reference,
      employee_name: empMatch?.full_name || '—',
      employee_code: empMatch?.employee_code || '',
      balance: payload.principal,
      total_repaid: 0,
    }
    if (wasNew) {
      optimisticCreate({
        tempRow,
        run: () => createL(payload).unwrap(),
        label: 'Recording…',
        successTitle: 'Loan recorded',
        errorTitle: 'Could not record loan',
        describe: (r) => r?.reference,
      }).catch(() => {})
    } else {
      optimisticUpdate({
        id,
        patch: tempRow,
        run: () => updateL({ id, ...payload }).unwrap(),
        successTitle: 'Loan updated',
        errorTitle: 'Could not update loan',
        describe: (r) => r?.reference,
      }).catch(() => {})
    }
  }

  const handleDelete = async (row) => {
    if (!(await confirm({ title: 'Delete loan?', message: `${row.reference} will be removed permanently.`, confirmLabel: 'Delete', danger: true }))) return
    optimisticDelete({
      id: row.id,
      run: () => deleteL(row.id).unwrap(),
      successTitle: 'Loan removed',
      errorTitle: 'Could not delete loan',
      describe: (r) => r.reference,
    }).catch(() => {})
  }

  const columns = useMemo(() => [
    {
      key: 'reference', label: 'Reference', priority: 'medium', render: (r) => (
        <span className="font-sora text-xs tracking-wider text-lafoi-dark">{r.reference}</span>
      ),
    },
    {
      key: 'employee_name', label: 'Employee', priority: 'high', mobileLabel: 'Employee', render: (r) => (
        <div>
          <p className="font-sora text-sm font-medium">{r.employee_name || '—'}</p>
          <p className="text-xs text-lafoi-gray-medium">{r.employee_code || ''}</p>
        </div>
      ),
    },
    {
      key: 'kind', label: 'Kind', priority: 'medium', render: (r) => <StatusBadge status={r.kind} palette={KIND_PALETTE} />,
    },
    {
      key: 'principal', label: 'Principal · Instalment', priority: 'medium', mobileLabel: 'Principal', render: (r) => (
        <div className="tabular-nums">
          <p className="text-sm">{fmtMoney(r.principal, r.currency)}</p>
          <p className="text-xs text-lafoi-gray-medium">{fmtMoney(r.instalment, r.currency)} / period</p>
        </div>
      ),
    },
    {
      key: 'progress', label: 'Repaid / Balance', priority: 'desktop', render: (r) => {
        const principal = Number(r.principal) || 0
        const repaid = Number(r.total_repaid) || 0
        const pct = principal > 0 ? Math.min(100, (repaid / principal) * 100) : 0
        const settled = pct >= 100 || Number(r.balance) === 0
        return (
          <div className="min-w-[160px] max-w-[220px]">
            <div className="h-1.5 rounded-full bg-lafoi-dark/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${settled ? 'bg-lafoi-green' : 'bg-lafoi-green-light'}`}
                style={{ width: `${Math.max(pct, 4)}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-lafoi-gray-medium tabular-nums">
              {fmtMoney(repaid, r.currency)} / {fmtMoney(principal, r.currency)}
            </p>
          </div>
        )
      },
    },
    {
      key: 'status', label: 'Status', priority: 'high', render: (r) => <StatusBadge status={r.status} palette={STATUS_PALETTE_LOAN} />,
    },
    {
      key: 'actions', label: '', priority: 'high', render: (r) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setViewingRepayments(r) }}
            className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
            title="View repayments"
          ><Eye size={14} /></button>
          <button
            onClick={(e) => { e.stopPropagation(); setEditing({ ...r }) }}
            className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
            title="Edit"
          ><PencilSimple size={14} /></button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(r) }}
            className="p-2 rounded-lg hover:bg-red-50 text-lafoi-gray hover:text-red-600 min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
            title="Delete"
          ><Trash size={14} /></button>
        </div>
      ),
    },
  ], [])

  return (
    <div>
      <PageHeader
        eyebrow="Loans & advances"
        title="Money owed, money out."
        description="Track salary advances and longer-term loans. Repayments deduct automatically each pay period."
        actions={
          <>
            <div className="relative">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lafoi-gray-medium" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reference / employee"
                className="pl-9 pr-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body w-56"
              />
            </div>
            <PrimaryButton onClick={() => setEditing(empty())}>
              <Plus size={14} weight="bold" /> New loan
            </PrimaryButton>
          </>
        }
      />

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {FILTERS.map((f) => {
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
            >
              {f.label}
            </button>
          )
        })}
      </div>

      <DataTable
        columns={columns}
        rows={data?.results || data || []}
        isLoading={isFirstLoad}
        empty="No loans yet — create one to start tracking repayments."
        pagination={data && typeof data.count === 'number' ? {
          count: data.count,
          page,
          pageSize,
          onPageChange: setPage,
          onPageSizeChange: (s) => { setPageSize(s); setPage(1) },
        } : null}
      />

      {/* Edit / Create modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={isNew ? 'New loan or advance' : `Edit ${editing?.reference}`}
        size="md"
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setEditing(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="loan-form" type="submit">Save</PrimaryButton>
          </>
        }
      >
        {editing && (
          <form id="loan-form" onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
            {error && <div className="sm:col-span-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
            <Field label="Employee" required className="sm:col-span-2">
              <Select
                value={editing.employee || ''}
                onChange={(e) => setEditing({ ...editing, employee: e.target.value })}
                required
              >
                <option value="">Select an employee</option>
                {(employeesData?.results || []).map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.employee_code})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Kind" required>
              <Select value={editing.kind} onChange={(e) => setEditing({ ...editing, kind: e.target.value })}>
                <option value="loan">Loan</option>
                <option value="advance">Advance</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="settled">Settled</option>
                <option value="written_off">Written off</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </Field>
            <Field label="Principal" required>
              <Input type="number" step="0.01" value={editing.principal}
                onChange={(e) => setEditing({ ...editing, principal: e.target.value })} required />
            </Field>
            <Field label="Instalment / period" required>
              <Input type="number" step="0.01" value={editing.instalment}
                onChange={(e) => setEditing({ ...editing, instalment: e.target.value })} required />
            </Field>
            <Field label="Currency">
              <Select value={editing.currency} onChange={(e) => setEditing({ ...editing, currency: e.target.value })}>
                <option value="USD">USD</option>
                <option value="ZWG">ZWG</option>
                <option value="ZWL">ZWL</option>
                <option value="ZAR">ZAR</option>
              </Select>
            </Field>
            <Field label="Interest rate %">
              <Input type="number" step="0.01" value={editing.interest_rate}
                onChange={(e) => setEditing({ ...editing, interest_rate: e.target.value })} />
            </Field>
            <Field label="Issued on" required>
              <Input type="date" value={editing.issued_on || ''}
                onChange={(e) => setEditing({ ...editing, issued_on: e.target.value })} required />
            </Field>
            <Field label="First repayment period" hint="Optional — defaults to next period.">
              <Input type="date" value={editing.first_repayment_period || ''}
                onChange={(e) => setEditing({ ...editing, first_repayment_period: e.target.value })} />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea value={editing.notes || ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={2} />
            </Field>
          </form>
        )}
      </Modal>

      {/* Repayments side modal */}
      <RepaymentsModal loan={viewingRepayments} onClose={() => setViewingRepayments(null)} />
    </div>
  )
}

function RepaymentsModal({ loan, onClose }) {
  const skip = !loan?.id
  const { data: full, isLoading } = useGetEmployeeLoanQuery(loan?.id, { skip })
  const repayments = full?.repayments || loan?.repayments || []

  return (
    <Modal
      open={!!loan}
      onClose={onClose}
      title={loan ? `${loan.reference} — Repayment schedule` : ''}
      size="md"
    >
      {loan && (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <Mini label="Principal" value={fmtMoney(loan.principal, loan.currency)} />
            <Mini label="Repaid" value={fmtMoney(loan.total_repaid, loan.currency)} />
            <Mini label="Balance" value={fmtMoney(loan.balance, loan.currency)} accent="green" />
          </div>
          {isLoading && <p className="text-sm text-lafoi-gray-medium">Loading repayments…</p>}
          {!isLoading && repayments.length === 0 && (
            <div className="rounded-2xl border border-dashed border-lafoi-dark/10 px-4 py-10 text-center text-sm text-lafoi-gray-medium">
              <Bank size={20} className="mx-auto mb-2 text-lafoi-gray-medium" />
              No repayments recorded yet. They will appear here automatically as periods are processed.
            </div>
          )}
          {!isLoading && repayments.length > 0 && (
            <ul className="divide-y divide-lafoi-dark/[0.06] rounded-2xl border border-lafoi-dark/10 bg-white">
              {repayments.map((rp) => (
                <li key={rp.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-sora text-sm">{rp.period_name || fmtDate(rp.period_date)}</p>
                    <p className="text-xs text-lafoi-gray-medium">{fmtDate(rp.recorded_at || rp.period_date)}</p>
                  </div>
                  <p className="font-sora text-sm tabular-nums text-lafoi-green-dark">
                    − {fmtMoney(rp.amount, loan.currency)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Modal>
  )
}

function Mini({ label, value, accent }) {
  const ring = accent === 'green'
    ? 'border-lafoi-green/25 bg-lafoi-green/[0.05]'
    : 'border-lafoi-dark/10 bg-white'
  return (
    <div className={`rounded-2xl border ${ring} px-4 py-3`}>
      <p className="font-sora text-[9px] tracking-[0.28em] uppercase text-lafoi-gray-medium">{label}</p>
      <p className="mt-1 font-display text-lg tabular-nums tracking-tight">{value}</p>
    </div>
  )
}
