import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Trash, PencilSimple, MagnifyingGlass, CircleNotch,
  Receipt, Storefront, Calendar, Briefcase, X,
} from '@phosphor-icons/react'
import { useConfirm } from '../components/ConfirmDialog'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import DataTable, { fmtDate, fmtMoney, StatusBadge } from '../components/DataTable'
import Modal from '../components/Modal'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton } from '../components/FormField'
import useDebouncedValue from '../hooks/useDebouncedValue'
import useOptimisticRow from '../hooks/useOptimisticRow'
import {
  useListExpensesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useListProjectsQuery,
  useListIncomeQuery,
  useCreateExpensePaymentMutation,
  useDeleteExpensePaymentMutation,
} from '../store/api'
import { ArrowDown, ArrowUp, Scales, Wallet, Coins as CoinsIcon } from '@phosphor-icons/react'

const PAY_STATUS_PALETTE = {
  paid:    'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/40',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  unpaid:  'bg-red-50 text-red-700 border-red-200',
}
const PAY_STATUS_LABEL = { paid: 'Paid', partial: 'Part-paid', unpaid: 'Unpaid' }

const CATEGORIES = [
  ['materials', 'Materials'],
  ['labour', 'Labour'],
  ['transport', 'Transport'],
  ['permits', 'Permits & fees'],
  ['equipment', 'Equipment hire'],
  ['subcontract', 'Subcontract'],
  ['overhead', 'Overhead'],
  ['office', 'Office'],
  ['marketing', 'Marketing'],
  ['fuel', 'Fuel & vehicle'],
  ['utilities', 'Utilities'],
  ['software', 'Software & subscriptions'],
  ['entertainment', 'Client entertainment'],
  ['other', 'Other'],
]

const PAYMENT_METHODS = [
  ['cash', 'Cash'],
  ['bank_transfer', 'Bank transfer'],
  ['mobile_money', 'Mobile money'],
  ['card', 'Card'],
  ['cheque', 'Cheque'],
  ['other', 'Other'],
]

const CURRENCIES = ['USD', 'ZWG', 'ZAR', 'GBP', 'EUR']

const todayISO = () => new Date().toISOString().slice(0, 10)

const empty = () => ({
  project: '',
  description: '',
  category: 'materials',
  amount: '',
  tax_amount: '',
  currency: 'USD',
  incurred_on: todayISO(),
  paid_on: '',
  payment_method: 'bank_transfer',
  supplier: '',
  receipt_reference: '',
  receipt_url: '',
  is_billable: false,
  notes: '',
})

export default function Expenses() {
  const confirm = useConfirm()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  const [categoryFilter, setCategoryFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('') // '' all, '__none__' global, otherwise project id
  const [paymentFilter, setPaymentFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, categoryFilter, projectFilter, paymentFilter, dateFrom, dateTo])

  const queryArgs = useMemo(() => {
    const args = { page, page_size: pageSize, ordering: '-incurred_on' }
    if (debouncedSearch) args.search = debouncedSearch
    if (categoryFilter) args.category = categoryFilter
    if (paymentFilter) args.payment_method = paymentFilter
    if (projectFilter === '__none__') args.project__isnull = true
    else if (projectFilter) args.project = projectFilter
    if (dateFrom) args.incurred_on__gte = dateFrom
    if (dateTo) args.incurred_on__lte = dateTo
    return args
  }, [page, pageSize, debouncedSearch, categoryFilter, projectFilter, paymentFilter, dateFrom, dateTo])

  const { data, isLoading: isFirstLoad } = useListExpensesQuery(queryArgs)
  const { data: projData } = useListProjectsQuery({ page: 1, page_size: 500 })
  const projects = projData?.results || []
  const rows = data?.results || []
  const { optimisticCreate, optimisticUpdate, optimisticDelete } = useOptimisticRow('listExpenses', queryArgs)

  const pageTotal = useMemo(
    () => rows.reduce((s, r) => s + Number(r.amount || 0), 0),
    [rows],
  )

  // Cashflow summary: pulls income + expenses for the current date range so
  // the strip at the top of the page tells the user where they stand.
  // Both queries respect the same project filter so the projected scope
  // matches the filter strip.
  const cashflowArgs = useMemo(() => {
    const args = { page: 1, page_size: 500 }
    if (projectFilter === '__none__') args.project__isnull = true
    else if (projectFilter) args.project = projectFilter
    if (dateFrom) args.incurred_on__gte = dateFrom
    if (dateTo) args.incurred_on__lte = dateTo
    return args
  }, [projectFilter, dateFrom, dateTo])

  const incomeArgs = useMemo(() => {
    const args = { page: 1, page_size: 500 }
    if (projectFilter === '__none__') args.project__isnull = true
    else if (projectFilter) args.project = projectFilter
    if (dateFrom) args.received_on__gte = dateFrom
    if (dateTo) args.received_on__lte = dateTo
    return args
  }, [projectFilter, dateFrom, dateTo])

  const { data: cashflowExpensesData } = useListExpensesQuery(cashflowArgs)
  const { data: incomeData } = useListIncomeQuery(incomeArgs)

  const expensesByCurrency = useMemo(() => {
    const m = {}
    ;(cashflowExpensesData?.results || []).forEach((r) => {
      const c = r.currency || 'USD'
      m[c] = (m[c] || 0) + Number(r.amount || 0)
    })
    return m
  }, [cashflowExpensesData])

  const incomeByCurrency = useMemo(() => {
    const m = {}
    ;(incomeData?.results || []).forEach((r) => {
      const c = r.currency || 'USD'
      m[c] = (m[c] || 0) + Number(r.amount || 0)
    })
    return m
  }, [incomeData])

  const currencies = useMemo(() => {
    const s = new Set([...Object.keys(incomeByCurrency), ...Object.keys(expensesByCurrency)])
    if (s.size === 0) s.add('USD')
    return Array.from(s).sort()
  }, [incomeByCurrency, expensesByCurrency])

  const [createExpense] = useCreateExpenseMutation()
  const [updateExpense] = useUpdateExpenseMutation()
  const [deleteExpense] = useDeleteExpenseMutation()
  const [createPayment, paymentState] = useCreateExpensePaymentMutation()
  const [deletePayment] = useDeleteExpensePaymentMutation()

  // Record-payment dialog. `paying` stores the expense id + form fields; the
  // live expense (with its current payments) is looked up from `rows` so the
  // modal stays fresh after a payment is added or removed.
  const [paying, setPaying] = useState(null)
  const payingExpense = useMemo(
    () => (paying ? rows.find((r) => r.id === paying.expenseId) : null),
    [paying, rows],
  )
  const openPayment = (expense) => {
    const balance = Number(expense.balance_due ?? expense.amount ?? 0)
    setPaying({
      expenseId: expense.id,
      currency: expense.currency,
      amount: balance > 0 ? String(balance) : '',
      paid_on: todayISO(),
      method: 'bank_transfer',
      reference: '',
      note: '',
    })
  }
  const handlePaymentSave = async (e) => {
    e.preventDefault()
    const amt = Number(paying.amount)
    if (!amt || amt <= 0) { toast.error('Enter a payment amount'); return }
    try {
      await createPayment({
        expense: paying.expenseId,
        amount: amt,
        paid_on: paying.paid_on,
        method: paying.method || '',
        reference: paying.reference || '',
        note: paying.note || '',
      }).unwrap()
      toast.success('Payment recorded', { description: fmtMoney(amt, paying.currency) })
      // Reset the amount + reference for a possible next part-payment; keep
      // the dialog open so the user sees the updated balance.
      setPaying((cur) => cur ? { ...cur, amount: '', reference: '', note: '' } : cur)
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Could not record payment.'
      toast.error('Payment failed', { description: msg })
    }
  }
  const handleDeletePayment = async (p) => {
    if (!(await confirm({ title: 'Remove this payment?', message: `${fmtMoney(p.amount, paying?.currency)} on ${fmtDate(p.paid_on)} will be removed.`, confirmLabel: 'Remove', danger: true }))) return
    try { await deletePayment(p.id).unwrap(); toast.success('Payment removed') }
    catch { toast.error('Could not remove payment') }
  }

  const isNew = editing && !editing.id

  const handleSave = (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      project: editing.project || null,
      description: editing.description?.trim(),
      category: editing.category,
      amount: Number(editing.amount) || 0,
      tax_amount: Number(editing.tax_amount) || 0,
      currency: editing.currency,
      incurred_on: editing.incurred_on,
      paid_on: editing.paid_on || null,
      payment_method: editing.payment_method || '',
      supplier: editing.supplier || '',
      receipt_reference: editing.receipt_reference || '',
      receipt_url: editing.receipt_url || '',
      is_billable: !!editing.is_billable,
      notes: editing.notes || '',
    }
    const wasNew = isNew
    const id = editing.id
    const projectMatch = projects.find((p) => String(p.id) === String(payload.project))
    setEditing(null)
    const tempRow = {
      ...payload,
      category_label: (CATEGORIES.find(([k]) => k === payload.category) || [])[1] || payload.category,
      payment_method_label: (PAYMENT_METHODS.find(([k]) => k === payload.payment_method) || [])[1] || payload.payment_method,
      project_code: projectMatch?.code || null,
    }
    if (wasNew) {
      optimisticCreate({
        tempRow,
        run: () => createExpense(payload).unwrap(),
        label: 'Recording…',
        successTitle: 'Expense recorded',
        errorTitle: 'Could not record expense',
        describe: () => `${payload.description} · ${fmtMoney(payload.amount, payload.currency)}`,
      }).catch(() => {})
    } else {
      optimisticUpdate({
        id,
        patch: tempRow,
        run: () => updateExpense({ id, ...payload }).unwrap(),
        successTitle: 'Expense updated',
        errorTitle: 'Could not update expense',
        describe: () => payload.description,
      }).catch(() => {})
    }
  }

  const handleDelete = async (row) => {
    if (!(await confirm({ title: 'Delete expense?', message: `"${row.description}" will be removed permanently.`, confirmLabel: 'Delete', danger: true }))) return
    optimisticDelete({
      id: row.id,
      run: () => deleteExpense(row.id).unwrap(),
      successTitle: 'Expense removed',
      errorTitle: 'Could not delete expense',
      describe: (r) => r.description,
    }).catch(() => {})
  }

  const columns = [
    {
      key: 'description', label: 'Description', priority: 'high',
      render: (r) => (
        <div>
          <p className="font-sora text-sm">{r.description}</p>
          <p className="text-[11px] text-lafoi-gray-medium mt-0.5 flex flex-wrap items-center gap-x-1.5">
            <span className="capitalize">{r.category_label || r.category}</span>
            {r.supplier && (<>· <Storefront size={11} weight="regular" /> {r.supplier}</>)}
            {r.is_billable && (<span className="ml-1 px-1.5 py-0.5 rounded-full bg-lafoi-green/10 text-lafoi-green-dark text-[9px] font-sora font-medium tracking-wide uppercase">Billable</span>)}
          </p>
        </div>
      ),
    },
    {
      key: 'project', label: 'Project', priority: 'medium',
      render: (r) => r.project_code ? (
        <Link to={`/dashboard/projects/${r.project}`} className="text-xs font-sora text-lafoi-dark hover:text-lafoi-green">
          {r.project_code}
        </Link>
      ) : <span className="text-xs text-lafoi-gray-medium">Overhead</span>,
    },
    {
      key: 'amount', label: 'Amount', priority: 'high',
      render: (r) => (
        <span className="tabular-nums font-sora font-medium">{fmtMoney(r.amount, r.currency)}</span>
      ),
    },
    {
      key: 'payment', label: 'Payment', priority: 'high',
      render: (r) => {
        const status = r.payment_status || 'unpaid'
        const balance = Number(r.balance_due ?? r.amount ?? 0)
        return (
          <div>
            <StatusBadge status={PAY_STATUS_LABEL[status] || status} palette={PAY_STATUS_PALETTE} />
            {status === 'partial' && (
              <p className="text-[10px] text-amber-700 mt-1 tabular-nums">
                {fmtMoney(r.amount_paid, r.currency)} paid · {fmtMoney(balance, r.currency)} due
              </p>
            )}
          </div>
        )
      },
    },
    {
      key: 'incurred_on', label: 'Incurred', priority: 'medium',
      render: (r) => fmtDate(r.incurred_on),
    },
    {
      key: 'actions', label: '', priority: 'high',
      render: (r) => (
        <div className="flex justify-end gap-1">
          {(r.payment_status || 'unpaid') !== 'paid' && (
            <button
              onClick={(e) => { e.stopPropagation(); openPayment(r) }}
              title="Record a payment"
              className="p-2 rounded-lg hover:bg-lafoi-green/10 text-lafoi-gray hover:text-lafoi-green-dark min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
            >
              <Wallet size={14} weight="bold" />
            </button>
          )}
          {(r.payment_status || 'unpaid') === 'paid' && (
            <button
              onClick={(e) => { e.stopPropagation(); openPayment(r) }}
              title="Payment history"
              className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
            >
              <Wallet size={14} />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); setEditing({ ...r }) }} className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><PencilSimple size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(r) }} className="p-2 rounded-lg hover:bg-red-50 text-lafoi-gray hover:text-red-600 min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><Trash size={14} /></button>
        </div>
      ),
    },
  ]

  const clearAll = () => {
    setSearch('')
    setCategoryFilter('')
    setProjectFilter('')
    setPaymentFilter('')
    setDateFrom('')
    setDateTo('')
  }
  const filtersActive = !!(search || categoryFilter || projectFilter || paymentFilter || dateFrom || dateTo)

  return (
    <div>
      <PageHeader
        eyebrow="Expenses"
        title="Every cost, in one ledger."
        description="Studio overhead, project costs, supplier invoices, fuel, software. Link to a project when relevant, leave it blank for global expenses."
        actions={
          <PrimaryButton onClick={() => setEditing({ ...empty() })}>
            <Plus size={14} weight="bold" /> New expense
          </PrimaryButton>
        }
      />

      {/* Filter strip */}
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-1.5">Search</p>
          <div className="relative">
            <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lafoi-gray-medium" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Description, supplier, reference, notes"
              className="w-full pl-9 pr-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body"
            />
          </div>
        </div>
        <div className="min-w-[180px]">
          <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-1.5">Category</p>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full px-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body">
            <option value="">All categories</option>
            {CATEGORIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div className="min-w-[200px]">
          <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-1.5">Project</p>
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="w-full px-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body">
            <option value="">All (project + overhead)</option>
            <option value="__none__">Overhead only (no project)</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.title}</option>)}
          </select>
        </div>
        <div className="min-w-[160px]">
          <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-1.5">Payment</p>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="w-full px-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body">
            <option value="">Any method</option>
            {PAYMENT_METHODS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div>
          <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-1.5">From</p>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body" />
        </div>
        <div>
          <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-1.5">To</p>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body" />
        </div>
        {filtersActive && (
          <button onClick={clearAll} className="px-3 py-2 text-xs font-sora tracking-[0.16em] uppercase text-lafoi-gray-medium hover:text-lafoi-green transition-colors inline-flex items-center gap-1">
            <X size={11} weight="bold" /> Clear
          </button>
        )}
      </div>

      {/* Cashflow summary — Income vs Expenses vs Net, per currency, for the
          current filter range. Same project filter applies to both queries so
          the comparison is apples-to-apples. */}
      <div className="mb-6 grid sm:grid-cols-3 gap-3">
        {currencies.map((cur) => {
          const inc = incomeByCurrency[cur] || 0
          const exp = expensesByCurrency[cur] || 0
          const net = inc - exp
          const positive = net >= 0
          return (
            <React.Fragment key={cur}>
              <Card
                tone="green"
                eyebrow={`Income · ${cur}`}
                value={fmtMoney(inc, cur)}
                icon={ArrowDown}
                href="/dashboard/income"
                hint={`${(incomeData?.results || []).filter((r) => (r.currency || 'USD') === cur).length} entries`}
              />
              <Card
                tone="red"
                eyebrow={`Expenses · ${cur}`}
                value={fmtMoney(exp, cur)}
                icon={ArrowUp}
                hint={`${(cashflowExpensesData?.results || []).filter((r) => (r.currency || 'USD') === cur).length} entries`}
              />
              <Card
                tone={positive ? 'green' : 'red'}
                eyebrow={`Net · ${cur}`}
                value={(positive ? '+' : '−') + fmtMoney(Math.abs(net), cur).replace(/^\S+\s/, cur + ' ')}
                icon={Scales}
                emphasised
                hint={positive ? 'Cash positive' : 'Spending exceeds income'}
              />
            </React.Fragment>
          )
        })}
      </div>

      {data && (
        <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lafoi-cream border border-lafoi-dark/10">
          <span className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium">
            {data.count} expense{data.count === 1 ? '' : 's'} match
          </span>
          <span className="font-sora text-xs text-lafoi-dark tabular-nums">
            · Page total {fmtMoney(pageTotal, rows[0]?.currency || 'USD')}
          </span>
        </div>
      )}

      <DataTable
        columns={columns}
        onRowClick={(row) => setEditing(row)}
        rows={rows}
        isLoading={isFirstLoad}
        empty="No expenses logged yet — start with a recent supplier invoice."
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
        title={isNew ? 'New expense' : `Edit expense`}
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setEditing(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="expense-form" type="submit">Save expense</PrimaryButton>
          </>
        }
      >
        {editing && (
          <form id="expense-form" onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
            {error && <div className="sm:col-span-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

            <Field label="Description" required className="sm:col-span-2">
              <Input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="e.g. 50L epoxy resin from Resin Co" required />
            </Field>

            <Field label="Category" required>
              <Select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                {CATEGORIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </Select>
            </Field>

            <Field label="Project (optional)">
              <Select value={editing.project || ''} onChange={(e) => setEditing({ ...editing, project: e.target.value })}>
                <option value="">— No project (overhead / global)</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.title}</option>)}
              </Select>
            </Field>

            <Field label="Amount" required>
              <Input type="number" step="0.01" min="0" value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: e.target.value })} required />
            </Field>

            <Field label="Tax / VAT portion">
              <Input type="number" step="0.01" min="0" value={editing.tax_amount} onChange={(e) => setEditing({ ...editing, tax_amount: e.target.value })} placeholder="0.00" />
            </Field>

            <Field label="Currency">
              <Select value={editing.currency} onChange={(e) => setEditing({ ...editing, currency: e.target.value })}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>

            <Field label="Payment method">
              <Select value={editing.payment_method || ''} onChange={(e) => setEditing({ ...editing, payment_method: e.target.value })}>
                {PAYMENT_METHODS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </Select>
            </Field>

            <Field label="Incurred on" required>
              <Input type="date" value={editing.incurred_on} onChange={(e) => setEditing({ ...editing, incurred_on: e.target.value })} required />
            </Field>

            <Field label="Paid on">
              <Input type="date" value={editing.paid_on || ''} onChange={(e) => setEditing({ ...editing, paid_on: e.target.value })} />
            </Field>

            <Field label="Supplier / vendor">
              <Input value={editing.supplier} onChange={(e) => setEditing({ ...editing, supplier: e.target.value })} placeholder="e.g. Resin Co (Pvt) Ltd" />
            </Field>

            <Field label="Receipt / invoice ref">
              <Input value={editing.receipt_reference} onChange={(e) => setEditing({ ...editing, receipt_reference: e.target.value })} placeholder="e.g. INV-4527" />
            </Field>

            <Field label="Receipt URL (scan / DO Spaces)" className="sm:col-span-2">
              <Input type="url" value={editing.receipt_url} onChange={(e) => setEditing({ ...editing, receipt_url: e.target.value })} placeholder="https://…" />
            </Field>

            <Field label=" " className="sm:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm text-lafoi-gray cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!editing.is_billable}
                  onChange={(e) => setEditing({ ...editing, is_billable: e.target.checked })}
                  className="w-4 h-4 accent-lafoi-green"
                />
                Billable to client (only relevant when a project is set)
              </label>
            </Field>

            <Field label="Notes" className="sm:col-span-2">
              <Textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={3} />
            </Field>
          </form>
        )}
      </Modal>

      {/* Record-payment / part-payment modal */}
      <Modal
        open={!!paying}
        onClose={() => setPaying(null)}
        title={payingExpense ? `Payments — ${payingExpense.description}` : 'Record payment'}
        size="md"
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setPaying(null)}>Done</SecondaryButton>
            <PrimaryButton form="pay-form" type="submit" disabled={paymentState.isLoading}>
              {paymentState.isLoading ? <><CircleNotch size={14} className="animate-spin" /> Saving…</> : 'Record payment'}
            </PrimaryButton>
          </>
        }
      >
        {paying && payingExpense && (() => {
          const total = Number(payingExpense.amount || 0)
          const paid = Number(payingExpense.amount_paid || 0)
          const balance = Number(payingExpense.balance_due ?? (total - paid))
          const cur = payingExpense.currency
          const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0
          const payments = payingExpense.payments || []
          return (
            <div className="grid gap-4">
              {/* Balance summary */}
              <div className="rounded-xl bg-lafoi-cream px-4 py-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium">Total agreed</p>
                    <p className="font-display text-xl">{fmtMoney(total, cur)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium">Balance due</p>
                    <p className={`font-display text-xl ${balance <= 0 ? 'text-lafoi-green-dark' : 'text-amber-700'}`}>{fmtMoney(balance, cur)}</p>
                  </div>
                </div>
                <div className="mt-2.5 h-1.5 rounded-full bg-lafoi-dark/8 overflow-hidden">
                  <div className="h-full rounded-full bg-lafoi-green" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-[11px] font-sora text-lafoi-gray-medium tabular-nums">{fmtMoney(paid, cur)} paid · {pct}%</p>
              </div>

              {/* Existing payments */}
              {payments.length > 0 && (
                <div>
                  <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray-medium mb-2">Payments so far</p>
                  <ul className="rounded-xl border border-lafoi-dark/10 divide-y divide-lafoi-dark/[0.06]">
                    {payments.map((p) => (
                      <li key={p.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                        <CoinsIcon size={14} className="text-lafoi-green-dark shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-sora tabular-nums">{fmtMoney(p.amount, cur)}</p>
                          <p className="text-[11px] text-lafoi-gray-medium">
                            {fmtDate(p.paid_on)}{p.note ? ` · ${p.note}` : ''}{p.method_label ? ` · ${p.method_label}` : ''}
                          </p>
                        </div>
                        <button type="button" onClick={() => handleDeletePayment(p)} className="p-1.5 rounded-lg text-lafoi-gray hover:text-red-600 hover:bg-red-50" title="Remove">
                          <Trash size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* New payment form */}
              <form id="pay-form" onSubmit={handlePaymentSave} className="grid sm:grid-cols-2 gap-4 pt-1 border-t border-lafoi-dark/8">
                <Field label="Amount" required className="sm:col-span-2">
                  <Input type="number" step="0.01" min="0" value={paying.amount} onChange={(e) => setPaying({ ...paying, amount: e.target.value })} required autoFocus
                    placeholder={balance > 0 ? `Balance is ${fmtMoney(balance, cur)}` : ''} />
                </Field>
                <Field label="Date" required>
                  <Input type="date" value={paying.paid_on} onChange={(e) => setPaying({ ...paying, paid_on: e.target.value })} required />
                </Field>
                <Field label="Method">
                  <Select value={paying.method} onChange={(e) => setPaying({ ...paying, method: e.target.value })}>
                    {PAYMENT_METHODS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </Select>
                </Field>
                <Field label="Note">
                  <Input value={paying.note} onChange={(e) => setPaying({ ...paying, note: e.target.value })} placeholder="e.g. Deposit, Final on completion" />
                </Field>
                <Field label="Reference">
                  <Input value={paying.reference} onChange={(e) => setPaying({ ...paying, reference: e.target.value })} placeholder="Bank ref, cheque #…" />
                </Field>
              </form>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}

function Card({ tone = 'green', eyebrow, value, icon: Icon, href, hint, emphasised = false }) {
  const toneCls = tone === 'green'
    ? 'bg-lafoi-green/[0.06] border-lafoi-green/25 text-lafoi-green-dark'
    : 'bg-red-50 border-red-200 text-red-700'
  const Wrap = href ? Link : 'div'
  const wrapProps = href ? { to: href } : {}
  return (
    <Wrap
      {...wrapProps}
      className={`block rounded-2xl border p-4 transition-colors ${toneCls} ${href ? 'hover:brightness-95' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-sora text-[9px] tracking-[0.28em] uppercase opacity-70">{eyebrow}</p>
        {Icon && <Icon size={14} weight="bold" className="opacity-70" />}
      </div>
      <p className={`mt-2 tabular-nums ${emphasised ? 'font-display text-2xl' : 'font-display text-xl'}`}>{value}</p>
      {hint && (
        <p className="mt-1 text-[10px] font-sora tracking-[0.18em] uppercase opacity-60">{hint}</p>
      )}
    </Wrap>
  )
}
