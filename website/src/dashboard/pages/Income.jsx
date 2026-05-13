import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Trash, PencilSimple, MagnifyingGlass,
  ArrowDown, Receipt as ReceiptIcon, Briefcase, X,
} from '@phosphor-icons/react'
import { useConfirm } from '../components/ConfirmDialog'

import PageHeader from '../components/PageHeader'
import DataTable, { fmtDate, fmtMoney, StatusBadge } from '../components/DataTable'
import Modal from '../components/Modal'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton } from '../components/FormField'
import useDebouncedValue from '../hooks/useDebouncedValue'
import useOptimisticRow from '../hooks/useOptimisticRow'
import {
  useListIncomeQuery,
  useCreateIncomeMutation,
  useUpdateIncomeMutation,
  useDeleteIncomeMutation,
  useListProjectsQuery,
} from '../store/api'

const SOURCES = [
  ['cash_sale',       'Cash sale'],
  ['loan_received',   'Loan received'],
  ['owner_capital',   'Owner capital injection'],
  ['refund',          'Refund / rebate'],
  ['interest',        'Interest earned'],
  ['rental',          'Rental / sublease'],
  ['other',           'Other'],
  // invoice_receipt is creator-locked (mirror) — not in the create dropdown
]

const SOURCE_PALETTE = {
  invoice_receipt: 'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/40',
  cash_sale:       'bg-blue-50 text-blue-700 border-blue-200',
  loan_received:   'bg-purple-50 text-purple-700 border-purple-200',
  owner_capital:   'bg-amber-50 text-amber-700 border-amber-200',
  refund:          'bg-teal-50 text-teal-700 border-teal-200',
  interest:        'bg-indigo-50 text-indigo-700 border-indigo-200',
  rental:          'bg-pink-50 text-pink-700 border-pink-200',
  other:           'bg-lafoi-gray-light text-lafoi-gray border-lafoi-dark/10',
}

const METHODS = [
  ['cash',          'Cash'],
  ['bank_transfer', 'Bank transfer'],
  ['mobile_money',  'Mobile money'],
  ['cheque',        'Cheque'],
  ['card',          'Card'],
  ['other',         'Other'],
]

const CURRENCIES = ['USD', 'ZWG', 'ZAR', 'GBP', 'EUR']

const todayISO = () => new Date().toISOString().slice(0, 10)

const empty = () => ({
  source: 'cash_sale',
  description: '',
  amount: '',
  currency: 'USD',
  received_on: todayISO(),
  method: 'bank_transfer',
  payer: '',
  reference: '',
  receipt_url: '',
  project: '',
  notes: '',
})

export default function Income() {
  const confirm = useConfirm()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [sourceFilter, setSourceFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { setPage(1) }, [debouncedSearch, sourceFilter, projectFilter, dateFrom, dateTo])

  const queryArgs = useMemo(() => {
    const args = { page, page_size: pageSize, ordering: '-received_on' }
    if (debouncedSearch) args.search = debouncedSearch
    if (sourceFilter) args.source = sourceFilter
    if (projectFilter === '__none__') args.project__isnull = true
    else if (projectFilter) args.project = projectFilter
    if (dateFrom) args.received_on__gte = dateFrom
    if (dateTo) args.received_on__lte = dateTo
    return args
  }, [page, pageSize, debouncedSearch, sourceFilter, projectFilter, dateFrom, dateTo])

  const { data, isLoading: isFirstLoad } = useListIncomeQuery(queryArgs)
  const { data: projData } = useListProjectsQuery({ page: 1, page_size: 500 })
  const projects = projData?.results || []
  const rows = data?.results || []

  const { optimisticCreate, optimisticUpdate, optimisticDelete } = useOptimisticRow('listIncome', queryArgs)
  const [createIncome] = useCreateIncomeMutation()
  const [updateIncome] = useUpdateIncomeMutation()
  const [deleteIncome] = useDeleteIncomeMutation()

  const isNew = editing && !editing.id
  // Mirror rows (source=invoice_receipt) shouldn't be edited here — they
  // belong to a Receipt. Block the modal from opening on them.
  const isMirror = editing?.source === 'invoice_receipt'

  const pageTotal = useMemo(
    () => rows.reduce((s, r) => s + Number(r.amount || 0), 0),
    [rows],
  )

  const handleSave = (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      source: editing.source,
      description: editing.description?.trim() || '',
      amount: Number(editing.amount) || 0,
      currency: editing.currency,
      received_on: editing.received_on,
      method: editing.method || '',
      payer: editing.payer || '',
      reference: editing.reference || '',
      receipt_url: editing.receipt_url || '',
      project: editing.project || null,
      notes: editing.notes || '',
    }
    const wasNew = isNew
    const id = editing.id
    const projectMatch = projects.find((p) => String(p.id) === String(payload.project))
    setEditing(null)
    const tempRow = {
      ...payload,
      source_label: (SOURCES.find(([k]) => k === payload.source) || [])[1] || payload.source,
      method_label: (METHODS.find(([k]) => k === payload.method) || [])[1] || payload.method,
      project_code: projectMatch?.code || null,
    }
    if (wasNew) {
      optimisticCreate({
        tempRow,
        run: () => createIncome(payload).unwrap(),
        label: 'Recording…',
        successTitle: 'Income recorded',
        errorTitle: 'Could not record income',
        describe: () => `${payload.payer || tempRow.source_label} · ${fmtMoney(payload.amount, payload.currency)}`,
      }).catch(() => {})
    } else {
      optimisticUpdate({
        id,
        patch: tempRow,
        run: () => updateIncome({ id, ...payload }).unwrap(),
        successTitle: 'Income updated',
        errorTitle: 'Could not update income',
        describe: () => payload.payer || tempRow.source_label,
      }).catch(() => {})
    }
  }

  const handleDelete = async (row) => {
    if (row.source === 'invoice_receipt') {
      // Soft-block — these are owned by the underlying Receipt.
      await confirm({
        title: 'Mirrored from a receipt',
        message: `This income row mirrors receipt ${row.receipt_number || ''} on invoice ${row.invoice_number || ''}. To remove it, void or delete the receipt instead.`,
        confirmLabel: 'OK',
      })
      return
    }
    if (!(await confirm({
      title: 'Delete income entry?',
      message: `"${row.description || row.source_label}" — ${fmtMoney(row.amount, row.currency)} will be removed permanently.`,
      confirmLabel: 'Delete', danger: true,
    }))) return
    optimisticDelete({
      id: row.id,
      run: () => deleteIncome(row.id).unwrap(),
      successTitle: 'Income removed',
      errorTitle: 'Could not delete income',
      describe: (r) => r.description || r.source_label,
    }).catch(() => {})
  }

  const columns = [
    {
      key: 'description', label: 'Entry', priority: 'high',
      render: (r) => (
        <div className="flex items-start gap-2.5">
          <span className="mt-1 inline-flex w-7 h-7 rounded-lg bg-lafoi-green/10 text-lafoi-green-dark items-center justify-center shrink-0">
            <ArrowDown size={13} weight="bold" />
          </span>
          <div className="min-w-0">
            <p className="font-sora text-sm font-medium truncate">{r.description || r.source_label}</p>
            <p className="text-[11px] text-lafoi-gray-medium mt-0.5 flex flex-wrap items-center gap-x-2">
              {r.payer && <span className="truncate">{r.payer}</span>}
              {r.reference && <span className="text-lafoi-gray-medium/70">· {r.reference}</span>}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'source', label: 'Source', priority: 'high',
      render: (r) => (
        <StatusBadge status={r.source_label || r.source} palette={SOURCE_PALETTE} />
      ),
    },
    {
      key: 'project', label: 'Project', priority: 'medium',
      render: (r) => r.project_code ? (
        <Link to={`/dashboard/projects/${r.project}`} className="inline-flex items-center gap-1 text-xs font-sora text-lafoi-dark hover:text-lafoi-green">
          <Briefcase size={11} /> {r.project_code}
        </Link>
      ) : r.invoice_number ? (
        <Link to={`/dashboard/invoices`} className="inline-flex items-center gap-1 text-xs font-sora text-lafoi-dark hover:text-lafoi-green">
          <ReceiptIcon size={11} /> {r.invoice_number}
        </Link>
      ) : (
        <span className="text-xs text-lafoi-gray-medium">Studio</span>
      ),
    },
    {
      key: 'amount', label: 'Amount', priority: 'high',
      render: (r) => (
        <span className="tabular-nums font-sora font-medium text-lafoi-green-dark">
          {fmtMoney(r.amount, r.currency)}
        </span>
      ),
    },
    {
      key: 'received_on', label: 'Received', priority: 'medium',
      render: (r) => fmtDate(r.received_on),
    },
    {
      key: 'method', label: 'Method', priority: 'low',
      render: (r) => <span className="text-xs capitalize">{(r.method_label || r.method || '—').toLowerCase()}</span>,
    },
    {
      key: 'actions', label: '', priority: 'high',
      render: (r) => (
        <div className="flex justify-end gap-1">
          {r.source !== 'invoice_receipt' && (
            <button onClick={(e) => { e.stopPropagation(); setEditing({ ...r }) }}
              className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><PencilSimple size={14} /></button>
          )}
          <button onClick={(e) => { e.stopPropagation(); handleDelete(r) }}
            className="p-2 rounded-lg hover:bg-red-50 text-lafoi-gray hover:text-red-600 min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><Trash size={14} /></button>
        </div>
      ),
    },
  ]

  const clearAll = () => {
    setSearch(''); setSourceFilter(''); setProjectFilter(''); setDateFrom(''); setDateTo('')
  }
  const filtersActive = !!(search || sourceFilter || projectFilter || dateFrom || dateTo)

  return (
    <div>
      <PageHeader
        eyebrow="Income"
        title="Every shilling that comes in."
        description="Invoice receipts mirror in automatically. Add cash sales, loans, owner capital and anything else you receive."
        actions={
          <PrimaryButton onClick={() => setEditing({ ...empty() })}>
            <Plus size={14} weight="bold" /> New income
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
              placeholder="Description, payer, reference"
              className="w-full pl-9 pr-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body"
            />
          </div>
        </div>
        <div className="min-w-[180px]">
          <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-1.5">Source</p>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="w-full px-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body">
            <option value="">All sources</option>
            <option value="invoice_receipt">Invoice receipt</option>
            {SOURCES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div className="min-w-[200px]">
          <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-1.5">Project</p>
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="w-full px-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body">
            <option value="">All (project + studio)</option>
            <option value="__none__">Studio only (no project)</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.title}</option>)}
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

      {data && (
        <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lafoi-green/8 border border-lafoi-green/25">
          <span className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-green-dark">
            {data.count} entr{data.count === 1 ? 'y' : 'ies'} match
          </span>
          <span className="font-sora text-xs text-lafoi-dark tabular-nums">
            · Page total {fmtMoney(pageTotal, rows[0]?.currency || 'USD')}
          </span>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={isFirstLoad}
        empty="No income yet — invoice receipts will appear here automatically."
        pagination={data ? {
          count: data.count,
          page, pageSize,
          onPageChange: setPage,
          onPageSizeChange: (s) => { setPageSize(s); setPage(1) },
        } : null}
      />

      <Modal
        open={!!editing && !isMirror}
        onClose={() => setEditing(null)}
        title={isNew ? 'New income entry' : 'Edit income'}
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setEditing(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="income-form" type="submit">Save</PrimaryButton>
          </>
        }
      >
        {editing && !isMirror && (
          <form id="income-form" onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
            {error && <div className="sm:col-span-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

            <Field label="Source" required>
              <Select value={editing.source} onChange={(e) => setEditing({ ...editing, source: e.target.value })}>
                {SOURCES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </Select>
            </Field>
            <Field label="Method">
              <Select value={editing.method || ''} onChange={(e) => setEditing({ ...editing, method: e.target.value })}>
                {METHODS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </Select>
            </Field>

            <Field label="Description" className="sm:col-span-2">
              <Input
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="e.g. Cash sale — walk-in client, framed panel"
              />
            </Field>

            <Field label="Amount" required>
              <Input type="number" step="0.01" min="0" value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: e.target.value })} required />
            </Field>
            <Field label="Currency">
              <Select value={editing.currency} onChange={(e) => setEditing({ ...editing, currency: e.target.value })}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>

            <Field label="Received on" required>
              <Input type="date" value={editing.received_on} onChange={(e) => setEditing({ ...editing, received_on: e.target.value })} required />
            </Field>
            <Field label="Project (optional)">
              <Select value={editing.project || ''} onChange={(e) => setEditing({ ...editing, project: e.target.value })}>
                <option value="">— None (studio income)</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.title}</option>)}
              </Select>
            </Field>

            <Field label="Payer">
              <Input value={editing.payer} onChange={(e) => setEditing({ ...editing, payer: e.target.value })} placeholder="Who paid — name or 'Walk-in client'" />
            </Field>
            <Field label="Reference">
              <Input value={editing.reference} onChange={(e) => setEditing({ ...editing, reference: e.target.value })} placeholder="Bank ref, deposit slip, EcoCash txn" />
            </Field>

            <Field label="Receipt / proof URL" className="sm:col-span-2">
              <Input type="url" value={editing.receipt_url} onChange={(e) => setEditing({ ...editing, receipt_url: e.target.value })} placeholder="https://…" />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={3} />
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}
