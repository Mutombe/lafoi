import React, { useEffect, useState } from 'react'
import { useStore } from 'react-redux'
import { Plus, Trash, PencilSimple, MagnifyingGlass, DownloadSimple, Receipt as ReceiptIcon, CircleNotch } from '@phosphor-icons/react'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import DataTable, { fmtDate, fmtMoney, StatusBadge, STATUS_PALETTE_DOC } from '../components/DataTable'
import Modal from '../components/Modal'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton } from '../components/FormField'
import LineItemEditor from '../components/LineItemEditor'
import RecipientPicker, { recipientPayload } from '../components/RecipientPicker'
import useDebouncedValue from '../hooks/useDebouncedValue'
import useOptimisticListUpdate from '../hooks/useOptimisticListUpdate'
import {
  useListInvoicesQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useListProjectsQuery,
  useListCustomersQuery,
  useCreateReceiptMutation,
  downloadPdf,
} from '../store/api'
import { useConfirm } from '../components/ConfirmDialog'

const empty = () => ({
  project: '', subject: '', issue_date: new Date().toISOString().slice(0, 10),
  due_date: '', status: 'draft', currency: 'USD',
  tax_rate: 0, discount_amount: 0, notes: '', terms: '',
  items: [{ description: '', a: '', b: '', qty: 1, quantity: 1, unit: 'm²', unit_price: 0 }],
  recipient_mode: 'project',
  customer: '',
  recipient_name: '',
  recipient_contact: '',
  recipient_email: '',
  recipient_phone: '',
  recipient_address: '',
})

export default function Invoices() {
  const confirm = useConfirm()
  const store = useStore()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [statusFilter, setStatusFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [paying, setPaying] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { setPage(1) }, [debouncedSearch])

  const queryArgs = {
    page,
    page_size: pageSize,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
  }
  const { data, isLoading: isFirstLoad, isFetching } = useListInvoicesQuery(queryArgs)
  const { data: projects } = useListProjectsQuery({ page_size: 200 })
  const { data: customers } = useListCustomersQuery({ page_size: 500 })

  const applyOptimistic = useOptimisticListUpdate('listInvoices', queryArgs)

  const [createI, createState] = useCreateInvoiceMutation()
  const [updateI, updateState] = useUpdateInvoiceMutation()
  const [deleteI] = useDeleteInvoiceMutation()
  const [createReceipt, receiptState] = useCreateReceiptMutation()

  const isNew = editing && !editing.id
  const saving = createState.isLoading || updateState.isLoading

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    let recipient
    try {
      recipient = recipientPayload(editing)
    } catch (msg) {
      setError(typeof msg === 'string' ? msg : 'Pick a recipient.')
      return
    }
    const payload = {
      ...recipient,
      subject: editing.subject || '',
      issue_date: editing.issue_date,
      due_date: editing.due_date || null,
      status: editing.status,
      currency: editing.currency || 'USD',
      tax_rate: Number(editing.tax_rate) || 0,
      discount_amount: Number(editing.discount_amount) || 0,
      notes: editing.notes || '',
      terms: editing.terms || '',
      items: (editing.items || []).map((it) => ({
        section: it.section || '',
        description: it.description, quantity: Number(it.quantity) || 0,
        unit: it.unit || 'unit', unit_price: Number(it.unit_price) || 0,
      })).filter((it) => it.description),
    }
    try {
      if (isNew) {
        const created = await createI(payload).unwrap()
        toast.success('Invoice created', { description: created?.number })
      } else {
        const updated = await updateI({ id: editing.id, ...payload }).unwrap()
        toast.success('Invoice updated', { description: updated?.number || editing.number })
      }
      setEditing(null)
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Save failed.'
      setError(msg)
      toast.error(isNew ? 'Could not create invoice' : 'Could not update invoice', { description: msg })
    }
  }

  const handleDelete = async (row) => {
    if (!(await confirm({ title: 'Delete invoice?', message: `Invoice ${row.number} will be removed permanently.`, confirmLabel: 'Delete', danger: true }))) return
    try {
      await applyOptimistic(
        (draft) => {
          if (!draft?.results) return
          draft.results = draft.results.filter((r) => r.id !== row.id)
          if (typeof draft.count === 'number') draft.count = Math.max(0, draft.count - 1)
        },
        () => deleteI(row.id).unwrap(),
      )
      toast.success('Invoice deleted', { description: row.number })
    } catch (e) {
      toast.error('Could not delete invoice', { description: e?.data?.detail || 'Delete failed.' })
    }
  }

  const handlePdf = async (row) => {
    try {
      await downloadPdf(`invoices/${row.id}/pdf/`, `${row.number}.pdf`, store.getState)
      toast.success('PDF downloaded', { description: `${row.number}.pdf` })
    }
    catch (e) { toast.error('PDF download failed', { description: e.message }) }
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    try {
      const receipt = await createReceipt({
        invoice: paying.invoice.id,
        amount: Number(paying.amount),
        method: paying.method,
        reference: paying.reference,
        received_at: paying.received_at,
        notes: paying.notes,
      }).unwrap()
      const formattedAmount = `${paying.invoice.currency || 'USD'} ${Number(paying.amount).toLocaleString()}`
      toast.success('Payment recorded', { description: `${receipt?.number || ''} — ${formattedAmount}`.trim() })
      setPaying(null)
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Receipt failed.'
      toast.error('Could not record payment', { description: msg })
    }
  }

  const columns = [
    { key: 'number', label: 'Number', priority: 'high', mobileLabel: 'Number', render: (r) => <span className="font-sora text-xs">{r.number}</span> },
    {
      key: 'recipient',
      label: 'Recipient',
      priority: 'high',
      mobileLabel: 'Recipient',
      render: (r) => {
        const primary = r.customer_name || r.recipient_name || '—'
        let kind = null
        if (r.project) {
          kind = r.project_code ? `Project · ${r.project_code}` : 'Project'
        } else if (r.customer) {
          kind = 'Customer'
        } else if (r.recipient_name) {
          kind = 'New recipient'
        }
        return (
          <div>
            <p className="font-sora text-sm font-medium">{primary}</p>
            {kind && (
              <p className="text-[10px] tracking-[0.16em] uppercase text-lafoi-gray-medium font-sora mt-0.5">
                {kind}{r.project_title ? ` · ${r.project_title}` : ''}
              </p>
            )}
          </div>
        )
      },
    },
    { key: 'issue_date', label: 'Issue', priority: 'desktop', render: (r) => fmtDate(r.issue_date) },
    { key: 'due_date', label: 'Due', priority: 'medium', render: (r) => fmtDate(r.due_date) },
    { key: 'total', label: 'Total', priority: 'medium', render: (r) => <span className="tabular-nums">{fmtMoney(r.total, r.currency)}</span> },
    { key: 'balance_due', label: 'Balance', priority: 'medium', mobileLabel: 'Balance', render: (r) => <span className="tabular-nums">{fmtMoney(r.balance_due, r.currency)}</span> },
    { key: 'status', label: 'Status', priority: 'high', render: (r) => <StatusBadge status={r.status} palette={STATUS_PALETTE_DOC} /> },
    { key: 'actions', label: '', priority: 'high', render: (r) => (
      <div className="flex justify-end gap-1">
        <button title="PDF" onClick={(e) => { e.stopPropagation(); handlePdf(r) }} className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><DownloadSimple size={14} /></button>
        <button title="Record payment" onClick={(e) => { e.stopPropagation(); setPaying({ invoice: r, amount: r.balance_due, method: 'bank_transfer', reference: '', received_at: new Date().toISOString().slice(0, 10), notes: '' }) }} className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-green min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><ReceiptIcon size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); setEditing(r) }} className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><PencilSimple size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(r) }} className="p-2 rounded-lg hover:bg-red-50 text-lafoi-gray hover:text-red-600 min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><Trash size={14} /></button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Invoices"
        title="What's owed, what's settled."
        description="Invoice line-by-line, record receipts, and download branded PDFs."
        actions={
          <>
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="w-40">
              <option value="">All statuses</option>
              {['draft', 'sent', 'partial', 'paid', 'overdue', 'void'].map((s) => <option key={s} value={s}>{s}</option>)}
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
            <PrimaryButton onClick={() => setEditing(empty())}><Plus size={14} weight="bold" /> New invoice</PrimaryButton>
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={data?.results || []}
        isLoading={isFirstLoad}
        empty="No invoices yet."
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
        title={isNew ? 'New invoice' : `Edit ${editing?.number}`}
        size="xl"
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setEditing(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="inv-form" type="submit" disabled={saving}>
              {saving ? (<><CircleNotch size={14} className="animate-spin" /> Saving…</>) : 'Save'}
            </PrimaryButton>
          </>
        }
      >
        {editing && (
          <form id="inv-form" onSubmit={handleSave} className="grid gap-4">
            {error && <div className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

            <RecipientPicker
              editing={editing}
              setEditing={setEditing}
              projects={projects?.results || []}
              customers={customers?.results || []}
              documentNoun="invoice"
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Subject" className="sm:col-span-2">
                <Input value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} />
              </Field>
              <Field label="Issue date" required>
                <Input type="date" value={editing.issue_date} onChange={(e) => setEditing({ ...editing, issue_date: e.target.value })} required />
              </Field>
              <Field label="Due date">
                <Input type="date" value={editing.due_date || ''} onChange={(e) => setEditing({ ...editing, due_date: e.target.value })} />
              </Field>
              <Field label="Status">
                <Select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  {['draft', 'sent', 'partial', 'paid', 'overdue', 'void'].map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
              <Field label="Currency">
                <Select value={editing.currency} onChange={(e) => setEditing({ ...editing, currency: e.target.value })}>
                  <option value="USD">USD</option>
                  <option value="ZWL">ZWL</option>
                  <option value="ZAR">ZAR</option>
                </Select>
              </Field>
              <Field label="Tax rate (%)">
                <Input type="number" step="0.01" value={editing.tax_rate} onChange={(e) => setEditing({ ...editing, tax_rate: e.target.value })} />
              </Field>
              <Field label="Discount amount">
                <Input type="number" step="0.01" value={editing.discount_amount} onChange={(e) => setEditing({ ...editing, discount_amount: e.target.value })} />
              </Field>
            </div>

            <div>
              <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray mb-2">Line items</p>
              <LineItemEditor
                items={editing.items}
                onChange={(items) => setEditing({ ...editing, items })}
                currency={editing.currency}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Notes (visible on PDF)">
                <Textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={3} />
              </Field>
              <Field label="Payment terms (visible on PDF)">
                <Textarea value={editing.terms} onChange={(e) => setEditing({ ...editing, terms: e.target.value })} rows={3} />
              </Field>
            </div>
          </form>
        )}
      </Modal>

      {/* Record payment modal */}
      <Modal
        open={!!paying}
        onClose={() => setPaying(null)}
        title={`Record payment — ${paying?.invoice?.number || ''}`}
        size="md"
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setPaying(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="rcp-form" type="submit" disabled={receiptState.isLoading}>
              {receiptState.isLoading ? (<><CircleNotch size={14} className="animate-spin" /> Recording…</>) : 'Record payment'}
            </PrimaryButton>
          </>
        }
      >
        {paying && (
          <form id="rcp-form" onSubmit={handleRecordPayment} className="grid gap-4">
            <div className="px-4 py-3 rounded-xl bg-lafoi-cream text-sm">
              <p className="text-lafoi-gray-medium text-xs uppercase tracking-[0.2em] mb-1">Outstanding</p>
              <p className="font-display text-2xl">{fmtMoney(paying.invoice.balance_due, paying.invoice.currency)}</p>
            </div>
            <Field label="Amount" required>
              <Input type="number" step="0.01" value={paying.amount} onChange={(e) => setPaying({ ...paying, amount: e.target.value })} required />
            </Field>
            <Field label="Method">
              <Select value={paying.method} onChange={(e) => setPaying({ ...paying, method: e.target.value })}>
                {['cash', 'bank_transfer', 'ecocash', 'cheque', 'card', 'other'].map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
              </Select>
            </Field>
            <Field label="Reference">
              <Input value={paying.reference} onChange={(e) => setPaying({ ...paying, reference: e.target.value })} placeholder="Bank ref, txn id, cheque #..." />
            </Field>
            <Field label="Date">
              <Input type="date" value={paying.received_at} onChange={(e) => setPaying({ ...paying, received_at: e.target.value })} />
            </Field>
            <Field label="Notes">
              <Textarea value={paying.notes} onChange={(e) => setPaying({ ...paying, notes: e.target.value })} rows={2} />
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}
