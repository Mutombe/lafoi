import React, { useEffect, useState } from 'react'
import { useStore } from 'react-redux'
import { Plus, Trash, PencilSimple, MagnifyingGlass, DownloadSimple, ArrowsClockwise, CircleNotch } from '@phosphor-icons/react'
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
import { useConfirm } from '../components/ConfirmDialog'
  useListQuotationsQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useDeleteQuotationMutation,
  useConvertQuotationToInvoiceMutation,
  useListProjectsQuery,
  useListCustomersQuery,
  downloadPdf,
} from '../store/api'

// Default terms block that ships with every new quotation. Editable in the
// modal so the team can adjust per-quote when needed; mirrors the standard
// terms baked into the PDF generator.
const DEFAULT_QUOTATION_TERMS = `Warranty:
• Stretch ceiling PVC: 10 years.
• Delayed or incomplete payments will pause work and void the warranty.
• Water and electricity must be available on site.

Payment Terms:
• 90% advance / 10% on completion.
• All payments made are non-refundable once work has commenced or after completion.
• Delayed or incomplete payments will pause work and void the warranty.
• Water and electricity must be available on site.

Lead Time / Waiting Period:
• The estimated lead time for project commencement is subject to size, design and scope.
• Small projects under 100 m² typically require 3 to 4 weeks from deposit confirmation to installation start date.
• Large projects exceeding 100 m² typically require 1 to 2 months.
• All ceilings are custom-made per client specifications, therefore lead time may differ based on design complexity, material selection and product requirements.

Work Execution:
• Completion within 10 working days after order, payment and design approval.
• Delays caused by other contractors or client work are not our responsibility.
• Scaffolding and site protection to be provided by client (extra if required).

General Terms:
• Extra work or materials needed on site will be charged separately.
• Openings for lights, grilles or other fixtures are not included unless quoted.
• Work based on regular hours (Sunday to Friday); night/weekend cost extra.
• Variations must be approved before execution.
• No 'pay-when-paid', bond or security cheques accepted.

Not Included:
• Spotlights, chandeliers, grilles, gypsum/MDF/aluminium boxes and image designs (unless quoted).
• Authority fees, approvals or access equipment above 3 m (unless stated).`

const DEFAULT_QUOTATION_NOTES = `Quoted in m². Quantity per line is entered as length × width on site.
We appreciate your consideration and look forward to delivering a high-quality, lasting ceiling solution.`

const empty = () => ({
  project: '', subject: '', issue_date: new Date().toISOString().slice(0, 10),
  expiry_date: '', status: 'draft', currency: 'USD',
  tax_rate: 0, discount_amount: 0,
  notes: DEFAULT_QUOTATION_NOTES,
  terms: DEFAULT_QUOTATION_TERMS,
  items: [{ description: '', a: '', b: '', qty: 1, quantity: 1, unit: 'm²', unit_price: 0 }],
  // Recipient mode + free-form fields. mode is one of 'project', 'customer',
  // 'freeform'. The corresponding payload field is set on save; the other two
  // are cleared so we don't leak old data.
  recipient_mode: 'project',
  customer: '',
  recipient_name: '',
  recipient_contact: '',
  recipient_email: '',
  recipient_phone: '',
  recipient_address: '',
})

export default function Quotations() {
  const confirm = useConfirm()
  const store = useStore()
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
  const { data, isLoading: isFirstLoad, isFetching } = useListQuotationsQuery(queryArgs)
  const { data: projects } = useListProjectsQuery({ page_size: 200 })
  const { data: customers } = useListCustomersQuery({ page_size: 500 })

  const applyOptimistic = useOptimisticListUpdate('listQuotations', queryArgs)

  const [createQ, createState] = useCreateQuotationMutation()
  const [updateQ, updateState] = useUpdateQuotationMutation()
  const [deleteQ] = useDeleteQuotationMutation()
  const [convert, convertState] = useConvertQuotationToInvoiceMutation()

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
      expiry_date: editing.expiry_date || null,
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
        const created = await createQ(payload).unwrap()
        toast.success('Quotation drafted', { description: created?.number })
      } else {
        const updated = await updateQ({ id: editing.id, ...payload }).unwrap()
        toast.success('Quotation saved', { description: updated?.number || editing.number })
      }
      setEditing(null)
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Save failed.'
      setError(msg)
      toast.error(isNew ? 'Could not draft quotation' : 'Could not save quotation', { description: msg })
    }
  }

  const handleDelete = async (row) => {
    if (!(await confirm({ title: 'Delete quotation?', message: `${row.number} will be removed permanently.`, confirmLabel: 'Delete', danger: true }))) return
    try {
      await applyOptimistic(
        (draft) => {
          if (!draft?.results) return
          draft.results = draft.results.filter((r) => r.id !== row.id)
          if (typeof draft.count === 'number') draft.count = Math.max(0, draft.count - 1)
        },
        () => deleteQ(row.id).unwrap(),
      )
      toast.success('Quotation deleted', { description: row.number })
    } catch (e) {
      toast.error('Could not delete quotation', { description: e?.data?.detail || 'Delete failed.' })
    }
  }

  const handlePdf = async (row) => {
    try {
      await downloadPdf(`quotations/${row.id}/pdf/`, `${row.number}.pdf`, store.getState)
      toast.success('PDF downloaded', { description: `${row.number}.pdf` })
    }
    catch (e) { toast.error('PDF download failed', { description: e.message }) }
  }

  const handleConvert = async (row) => {
    if (!(await confirm({ title: 'Convert to invoice?', message: `${row.number} will be marked converted, and a draft invoice created from its line items.`, confirmLabel: 'Convert' }))) return
    try {
      const invoice = await convert(row.id).unwrap()
      toast.success('Converted to invoice', { description: invoice?.number })
    } catch (e) {
      toast.error('Conversion failed', { description: e?.data?.detail || 'Conversion failed.' })
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
        // Three shapes: project-backed, customer-backed, free-form. Show the
        // primary "who's it for" line and a short secondary kind tag so the
        // user sees at a glance which mode the quotation was raised in.
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
    { key: 'issue_date', label: 'Issue', priority: 'low', render: (r) => fmtDate(r.issue_date) },
    { key: 'total', label: 'Total', priority: 'medium', render: (r) => <span className="tabular-nums">{fmtMoney(r.total, r.currency)}</span> },
    { key: 'status', label: 'Status', priority: 'high', render: (r) => <StatusBadge status={r.status} palette={STATUS_PALETTE_DOC} /> },
    { key: 'actions', label: '', priority: 'high', render: (r) => (
      <div className="flex justify-end gap-1">
        <button title="PDF" onClick={(e) => { e.stopPropagation(); handlePdf(r) }} className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><DownloadSimple size={14} /></button>
        <button title="Convert to invoice" onClick={(e) => { e.stopPropagation(); handleConvert(r) }} className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-green min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><ArrowsClockwise size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); setEditing(r) }} className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><PencilSimple size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(r) }} className="p-2 rounded-lg hover:bg-red-50 text-lafoi-gray hover:text-red-600 min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><Trash size={14} /></button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Quotations"
        title="Quote, then build."
        description="Build a line-item quote for any project. Convert to an invoice in one click."
        actions={
          <>
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="w-40">
              <option value="">All statuses</option>
              {['draft', 'sent', 'accepted', 'declined', 'expired', 'converted'].map((s) => <option key={s} value={s}>{s}</option>)}
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
            <PrimaryButton onClick={() => setEditing(empty())}><Plus size={14} weight="bold" /> New quotation</PrimaryButton>
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={data?.results || []}
        isLoading={isFirstLoad}
        empty="No quotations yet."
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
        title={isNew ? 'New quotation' : `Edit ${editing?.number}`}
        size="xl"
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setEditing(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="qt-form" type="submit" disabled={saving}>
              {saving ? (<><CircleNotch size={14} className="animate-spin" /> Saving…</>) : 'Save'}
            </PrimaryButton>
          </>
        }
      >
        {editing && (
          <form id="qt-form" onSubmit={handleSave} className="grid gap-4">
            {error && <div className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

            {/* Recipient picker — three modes */}
            <RecipientPicker
              editing={editing}
              setEditing={setEditing}
              projects={projects?.results || []}
              customers={customers?.results || []}
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Subject" className="sm:col-span-2">
                <Input value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} placeholder="e.g. Stretch ceiling — Lounge & Master Suite" />
              </Field>
              <Field label="Issue date" required>
                <Input type="date" value={editing.issue_date} onChange={(e) => setEditing({ ...editing, issue_date: e.target.value })} required />
              </Field>
              <Field label="Valid until">
                <Input type="date" value={editing.expiry_date || ''} onChange={(e) => setEditing({ ...editing, expiry_date: e.target.value })} />
              </Field>
              <Field label="Status">
                <Select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  {['draft', 'sent', 'accepted', 'declined', 'expired'].map((s) => <option key={s} value={s}>{s}</option>)}
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
              <Field label="Terms (visible on PDF)">
                <Textarea value={editing.terms} onChange={(e) => setEditing({ ...editing, terms: e.target.value })} rows={3} />
              </Field>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}


