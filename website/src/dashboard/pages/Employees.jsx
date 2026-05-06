import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Trash, PencilSimple, MagnifyingGlass, CircleNotch, Bank } from '@phosphor-icons/react'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import DataTable, { fmtDate, fmtMoney, StatusBadge } from '../components/DataTable'
import Modal from '../components/Modal'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton } from '../components/FormField'
import useDebouncedValue from '../hooks/useDebouncedValue'
import useOptimisticListUpdate from '../hooks/useOptimisticListUpdate'
import {
  useListEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useListEmployeeLoansQuery,
} from '../store/api'

const empty = () => ({
  first_name: '', last_name: '', email: '', phone: '',
  national_id: '', tax_id: '', job_title: '', department: '',
  hire_date: new Date().toISOString().slice(0, 10), end_date: '',
  status: 'active', base_salary: 0, pay_frequency: 'monthly', currency: 'USD',
  default_allowances: [], default_deductions: [],
  bank_name: '', bank_account: '', notes: '',
})

const STATUS_PALETTE_EMP = {
  active: 'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/40',
  on_leave: 'bg-amber-50 text-amber-700 border-amber-200',
  terminated: 'bg-lafoi-gray-light text-lafoi-gray border-lafoi-dark/10',
}

export default function Employees() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [statusFilter, setStatusFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { setPage(1) }, [debouncedSearch])

  const queryArgs = {
    page,
    page_size: pageSize,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
  }
  const { data, isLoading: isFirstLoad, isFetching } = useListEmployeesQuery(queryArgs)
  const applyOptimistic = useOptimisticListUpdate('listEmployees', queryArgs)
  // Pull active loans once and aggregate per-employee for the Loans column.
  const { data: loansData } = useListEmployeeLoansQuery({ status: 'active' })
  const loanByEmployee = useMemo(() => {
    const m = new Map()
    const rows = loansData?.results || loansData || []
    rows.forEach((l) => {
      const empId = l.employee
      const cur = m.get(empId) || { count: 0, balance: 0, currency: l.currency || 'USD' }
      cur.count += 1
      cur.balance += Number(l.balance) || 0
      m.set(empId, cur)
    })
    return m
  }, [loansData])

  const [createE, createState] = useCreateEmployeeMutation()
  const [updateE, updateState] = useUpdateEmployeeMutation()
  const [deleteE] = useDeleteEmployeeMutation()

  const isNew = editing && !editing.id
  const saving = createState.isLoading || updateState.isLoading

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      first_name: editing.first_name?.trim(),
      last_name: editing.last_name?.trim(),
      email: editing.email || '', phone: editing.phone || '',
      national_id: editing.national_id || '', tax_id: editing.tax_id || '',
      job_title: editing.job_title || '', department: editing.department || '',
      hire_date: editing.hire_date || null, end_date: editing.end_date || null,
      status: editing.status, currency: editing.currency || 'USD',
      base_salary: Number(editing.base_salary) || 0,
      pay_frequency: editing.pay_frequency || 'monthly',
      default_allowances: editing.default_allowances || [],
      default_deductions: editing.default_deductions || [],
      bank_name: editing.bank_name || '', bank_account: editing.bank_account || '',
      notes: editing.notes || '',
    }
    try {
      if (isNew) {
        const created = await createE(payload).unwrap()
        toast.success('Employee added', { description: created?.full_name || `${payload.first_name} ${payload.last_name}`.trim() })
      } else {
        const updated = await updateE({ id: editing.id, ...payload }).unwrap()
        toast.success('Employee updated', { description: updated?.full_name || `${payload.first_name} ${payload.last_name}`.trim() })
      }
      setEditing(null)
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Save failed.'
      setError(msg)
      toast.error(isNew ? 'Could not add employee' : 'Could not update employee', { description: msg })
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete employee ${row.full_name}? This cannot be undone.`)) return
    try {
      await applyOptimistic(
        (draft) => {
          if (!draft?.results) return
          draft.results = draft.results.filter((r) => r.id !== row.id)
          if (typeof draft.count === 'number') draft.count = Math.max(0, draft.count - 1)
        },
        () => deleteE(row.id).unwrap(),
      )
      toast.success('Employee removed', { description: row.full_name })
    } catch (e) {
      toast.error('Could not delete employee', { description: e?.data?.detail || 'Delete failed.' })
    }
  }

  const upsertItem = (key, idx, patch) => {
    const arr = (editing[key] || []).slice()
    arr[idx] = { ...arr[idx], ...patch }
    setEditing({ ...editing, [key]: arr })
  }
  const removeItem = (key, idx) => setEditing({ ...editing, [key]: (editing[key] || []).filter((_, i) => i !== idx) })
  const addItem = (key) => setEditing({ ...editing, [key]: [...(editing[key] || []), { name: '', amount: 0 }] })

  const columns = [
    { key: 'employee_code', label: 'Code', priority: 'medium', render: (r) => <span className="font-sora text-xs">{r.employee_code}</span> },
    { key: 'full_name', label: 'Name', priority: 'high', mobileLabel: 'Name', render: (r) => (
      <div>
        <Link to={`/dashboard/employees/${r.id}`} onClick={(e) => e.stopPropagation()} className="font-sora text-sm font-medium hover:text-lafoi-green">{r.full_name}</Link>
        <p className="text-xs text-lafoi-gray-medium">{r.job_title || '—'}</p>
      </div>
    )},
    { key: 'department', label: 'Department', priority: 'low' },
    { key: 'base_salary', label: 'Base salary', priority: 'medium', mobileLabel: 'Salary', render: (r) => <span className="tabular-nums">{fmtMoney(r.base_salary, r.currency)}</span> },
    { key: 'loans', label: 'Loans', priority: 'desktop', render: (r) => {
      const info = loanByEmployee.get(r.id)
      if (!info) return <span className="text-lafoi-gray-medium text-xs">—</span>
      return (
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs">
          <Bank size={11} className="text-blue-700" />
          <span className="font-sora text-blue-700">
            {info.count} active · {fmtMoney(info.balance, info.currency)}
          </span>
        </div>
      )
    }},
    { key: 'hire_date', label: 'Hired', priority: 'desktop', render: (r) => fmtDate(r.hire_date) },
    { key: 'status', label: 'Status', priority: 'high', render: (r) => <StatusBadge status={r.status} palette={STATUS_PALETTE_EMP} /> },
    { key: 'actions', label: '', priority: 'high', render: (r) => (
      <div className="flex justify-end gap-1">
        <button onClick={(e) => { e.stopPropagation(); setEditing(r) }} className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><PencilSimple size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(r) }} className="p-2 rounded-lg hover:bg-red-50 text-lafoi-gray hover:text-red-600 min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><Trash size={14} /></button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Employees"
        title="The team that builds."
        description="Personnel records, salary defaults, and bank details for payroll."
        actions={
          <>
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="w-40">
              <option value="">All statuses</option>
              {['active', 'on_leave', 'terminated'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </Select>
            <div className="relative">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lafoi-gray-medium" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="pl-9 pr-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body w-48"
              />
            </div>
            <PrimaryButton onClick={() => setEditing(empty())}><Plus size={14} weight="bold" /> New employee</PrimaryButton>
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={data?.results || []}
        isLoading={isFirstLoad}
        onRowClick={(r) => navigate(`/dashboard/employees/${r.id}`)}
        empty="No employees yet."
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
        title={isNew ? 'New employee' : `Edit ${editing?.employee_code}`}
        size="xl"
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setEditing(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="emp-form" type="submit" disabled={saving}>
              {saving ? (<><CircleNotch size={14} className="animate-spin" /> Saving…</>) : 'Save'}
            </PrimaryButton>
          </>
        }
      >
        {editing && (
          <form id="emp-form" onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
            {error && <div className="sm:col-span-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

            <Field label="First name" required>
              <Input value={editing.first_name} onChange={(e) => setEditing({ ...editing, first_name: e.target.value })} required />
            </Field>
            <Field label="Last name" required>
              <Input value={editing.last_name} onChange={(e) => setEditing({ ...editing, last_name: e.target.value })} required />
            </Field>
            <Field label="Email">
              <Input type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
            </Field>
            <Field label="Job title">
              <Input value={editing.job_title} onChange={(e) => setEditing({ ...editing, job_title: e.target.value })} />
            </Field>
            <Field label="Department">
              <Input value={editing.department} onChange={(e) => setEditing({ ...editing, department: e.target.value })} />
            </Field>
            <Field label="Hire date">
              <Input type="date" value={editing.hire_date || ''} onChange={(e) => setEditing({ ...editing, hire_date: e.target.value })} />
            </Field>
            <Field label="End date">
              <Input type="date" value={editing.end_date || ''} onChange={(e) => setEditing({ ...editing, end_date: e.target.value })} />
            </Field>
            <Field label="Status">
              <Select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="on_leave">On leave</option>
                <option value="terminated">Terminated</option>
              </Select>
            </Field>
            <Field label="Currency">
              <Select value={editing.currency} onChange={(e) => setEditing({ ...editing, currency: e.target.value })}>
                <option value="USD">USD</option>
                <option value="ZWL">ZWL</option>
                <option value="ZAR">ZAR</option>
              </Select>
            </Field>
            <Field label="Base salary">
              <Input type="number" step="0.01" value={editing.base_salary} onChange={(e) => setEditing({ ...editing, base_salary: e.target.value })} />
            </Field>
            <Field label="Pay frequency">
              <Select value={editing.pay_frequency} onChange={(e) => setEditing({ ...editing, pay_frequency: e.target.value })}>
                <option value="monthly">Monthly</option>
                <option value="biweekly">Biweekly</option>
                <option value="weekly">Weekly</option>
              </Select>
            </Field>
            <Field label="National ID">
              <Input value={editing.national_id} onChange={(e) => setEditing({ ...editing, national_id: e.target.value })} />
            </Field>
            <Field label="Tax / PAYE number">
              <Input value={editing.tax_id} onChange={(e) => setEditing({ ...editing, tax_id: e.target.value })} />
            </Field>
            <Field label="Bank name">
              <Input value={editing.bank_name} onChange={(e) => setEditing({ ...editing, bank_name: e.target.value })} />
            </Field>
            <Field label="Bank account">
              <Input value={editing.bank_account} onChange={(e) => setEditing({ ...editing, bank_account: e.target.value })} />
            </Field>

            {/* Allowances + Deductions templates */}
            <div className="sm:col-span-2">
              <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray mb-2">Default allowances (each pay period)</p>
              <div className="space-y-2">
                {(editing.default_allowances || []).map((a, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2">
                    <Input className="col-span-7" value={a.name || ''} onChange={(e) => upsertItem('default_allowances', idx, { name: e.target.value })} placeholder="Name (e.g. Transport)" />
                    <Input className="col-span-4 text-right" type="number" step="0.01" value={a.amount || 0} onChange={(e) => upsertItem('default_allowances', idx, { amount: e.target.value })} />
                    <button type="button" onClick={() => removeItem('default_allowances', idx)} className="col-span-1 text-lafoi-gray hover:text-red-600"><Trash size={14} /></button>
                  </div>
                ))}
                <SecondaryButton type="button" onClick={() => addItem('default_allowances')} className="!py-2 !px-3"><Plus size={13} weight="bold" /> Add allowance</SecondaryButton>
              </div>
            </div>
            <div className="sm:col-span-2">
              <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray mb-2">Default deductions</p>
              <div className="space-y-2">
                {(editing.default_deductions || []).map((d, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2">
                    <Input className="col-span-7" value={d.name || ''} onChange={(e) => upsertItem('default_deductions', idx, { name: e.target.value })} placeholder="Name (e.g. Pension)" />
                    <Input className="col-span-4 text-right" type="number" step="0.01" value={d.amount || 0} onChange={(e) => upsertItem('default_deductions', idx, { amount: e.target.value })} />
                    <button type="button" onClick={() => removeItem('default_deductions', idx)} className="col-span-1 text-lafoi-gray hover:text-red-600"><Trash size={14} /></button>
                  </div>
                ))}
                <SecondaryButton type="button" onClick={() => addItem('default_deductions')} className="!py-2 !px-3"><Plus size={13} weight="bold" /> Add deduction</SecondaryButton>
              </div>
            </div>

            <Field label="Notes" className="sm:col-span-2">
              <Textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={2} />
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}
