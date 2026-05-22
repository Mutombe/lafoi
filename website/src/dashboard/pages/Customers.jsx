import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash, PencilSimple, MagnifyingGlass, CircleNotch, MapPinLine, X } from '@phosphor-icons/react'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import DataTable, { fmtDate, StatusBadge } from '../components/DataTable'
import Modal from '../components/Modal'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton, DangerButton } from '../components/FormField'
import useDebouncedValue from '../hooks/useDebouncedValue'
import useOptimisticRow from '../hooks/useOptimisticRow'
import {
  useListCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} from '../store/api'
import { useConfirm } from '../components/ConfirmDialog'

const empty = {
  name: '', customer_type: 'individual', contact_person: '', email: '', phone: '',
  alt_phone: '', address: '', city: 'Harare', country: 'Zimbabwe',
  vat_number: '', tin_number: '', notes: '',
  // Site visit defaults to "not required" — adding a customer never silently
  // raises a task.
  site_visit_status: 'not_required', site_visit_date: '', site_visit_notes: '',
}

const SITE_VISIT_OPTIONS = [
  ['not_required', 'Not required'],
  ['required', 'To be done'],
  ['done', 'Done'],
]

const SITE_VISIT_PALETTE = {
  'Not required': 'bg-lafoi-cream text-lafoi-gray border-lafoi-dark/10',
  'To be done':   'bg-amber-50 text-amber-700 border-amber-200',
  'Done':         'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/40',
}

export default function Customers() {
  const confirm = useConfirm()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [editing, setEditing] = useState(null) // null | {} (for new) | row
  const [error, setError] = useState('')

  // '' = all; otherwise filter to a site_visit_status.
  const [siteVisitFilter, setSiteVisitFilter] = useState('')

  // Reset to page 1 only when the debounced query actually changes.
  useEffect(() => { setPage(1) }, [debouncedSearch, siteVisitFilter])

  const queryArgs = {
    page, page_size: pageSize,
    search: debouncedSearch || undefined,
    site_visit_status: siteVisitFilter || undefined,
  }
  const { data, isLoading: isFirstLoad, isFetching } = useListCustomersQuery(queryArgs)

  // Standing count of customers awaiting a site visit — the in-app
  // "notification" for admins. Cheap: page_size 1, we only read .count.
  const { data: pendingVisits } = useListCustomersQuery({ site_visit_status: 'required', page_size: 1 })
  const pendingVisitCount = pendingVisits?.count || 0

  const { optimisticCreate, optimisticUpdate, optimisticDelete } = useOptimisticRow('listCustomers', queryArgs)

  const [createCustomer] = useCreateCustomerMutation()
  const [updateCustomer] = useUpdateCustomerMutation()
  const [deleteCustomer] = useDeleteCustomerMutation()

  const isNew = editing && !editing.id

  const handleSave = (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      name: editing.name?.trim(),
      customer_type: editing.customer_type,
      contact_person: editing.contact_person || '',
      email: editing.email || '',
      phone: editing.phone || '',
      alt_phone: editing.alt_phone || '',
      address: editing.address || '',
      city: editing.city || '',
      country: editing.country || '',
      vat_number: editing.vat_number || '',
      tin_number: editing.tin_number || '',
      site_visit_status: editing.site_visit_status || 'not_required',
      site_visit_date: editing.site_visit_date || null,
      site_visit_notes: editing.site_visit_notes || '',
      notes: editing.notes || '',
    }
    const wasNew = isNew
    const id = editing.id
    setEditing(null)
    if (wasNew) {
      optimisticCreate({
        tempRow: { ...payload, project_count: 0, created_at: new Date().toISOString() },
        run: () => createCustomer(payload).unwrap(),
        label: 'Adding…',
        successTitle: 'Customer added',
        errorTitle: 'Could not add customer',
        describe: (r) => r?.name || payload.name,
      }).catch(() => {})
    } else {
      optimisticUpdate({
        id,
        patch: payload,
        run: () => updateCustomer({ id, ...payload }).unwrap(),
        successTitle: 'Customer updated',
        errorTitle: 'Could not update customer',
        describe: (r) => r?.name || payload.name,
      }).catch(() => {})
    }
  }

  const handleDelete = async (row) => {
    if (!(await confirm({ title: 'Delete customer?', message: `“${row.name}” will be removed permanently. This cannot be undone.`, confirmLabel: 'Delete', danger: true }))) return
    optimisticDelete({
      id: row.id,
      run: () => deleteCustomer(row.id).unwrap(),
      successTitle: 'Customer removed',
      errorTitle: 'Could not delete customer',
      describe: (r) => r.name,
    }).catch(() => {})
  }

  const columns = [
    { key: 'name', label: 'Customer', priority: 'high', mobileLabel: 'Customer', render: (r) => (
      <div>
        <p className="font-sora text-sm font-medium">{r.name}</p>
        <p className="text-xs text-lafoi-gray-medium">{r.contact_person || r.email || r.phone || '—'}</p>
      </div>
    )},
    { key: 'customer_type', label: 'Type', priority: 'medium', render: (r) => <span className="capitalize text-xs font-sora">{r.customer_type}</span> },
    { key: 'city', label: 'City', priority: 'low' },
    { key: 'phone', label: 'Phone', priority: 'medium' },
    { key: 'project_count', label: 'Projects', priority: 'medium', mobileLabel: 'Projects', render: (r) => r.project_count ?? 0 },
    { key: 'site_visit', label: 'Site visit', priority: 'medium', mobileLabel: 'Site visit', render: (r) => {
      const status = r.site_visit_status || 'not_required'
      if (status === 'not_required') return <span className="text-xs text-lafoi-gray-medium">—</span>
      const label = r.site_visit_label || (SITE_VISIT_OPTIONS.find(([v]) => v === status) || [])[1] || status
      return (
        <div>
          <StatusBadge status={label} palette={SITE_VISIT_PALETTE} />
          {r.site_visit_date && (
            <p className="text-[10px] text-lafoi-gray-medium mt-1 tabular-nums">{fmtDate(r.site_visit_date)}</p>
          )}
        </div>
      )
    }},
    { key: 'created_at', label: 'Added', priority: 'low', render: (r) => fmtDate(r.created_at) },
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
        eyebrow="Customers"
        title="People we build for."
        description="Every individual, company and institution the studio works with."
        actions={
          <>
            <Select
              value={siteVisitFilter}
              onChange={(e) => setSiteVisitFilter(e.target.value)}
              className="w-44"
            >
              <option value="">All site visits</option>
              <option value="required">Site visit due</option>
              <option value="done">Site visit done</option>
              <option value="not_required">No visit needed</option>
            </Select>
            <div className="relative">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lafoi-gray-medium" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customers"
                className="pl-9 pr-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body w-56"
              />
            </div>
            <PrimaryButton onClick={() => setEditing({ ...empty })}><Plus size={14} weight="bold" /> New customer</PrimaryButton>
          </>
        }
      />

      {/* Site-visit notice — the in-app alert for admins. Click to filter
          the table down to the customers awaiting a visit. */}
      {pendingVisitCount > 0 && (
        <button
          type="button"
          onClick={() => setSiteVisitFilter(siteVisitFilter === 'required' ? '' : 'required')}
          className="mb-4 w-full flex items-center gap-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-left hover:bg-amber-100/60 transition-colors"
        >
          <span className="inline-flex w-9 h-9 rounded-xl bg-amber-100 text-amber-700 items-center justify-center shrink-0">
            <MapPinLine size={18} weight="bold" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-sora text-sm font-medium text-amber-900">
              {pendingVisitCount} customer{pendingVisitCount === 1 ? '' : 's'} awaiting a site visit
            </p>
            <p className="text-[11px] text-amber-700">
              {siteVisitFilter === 'required'
                ? 'Filtered to them now — click to clear'
                : 'Click to review them'}
            </p>
          </div>
          {siteVisitFilter === 'required' && <X size={14} className="text-amber-700 shrink-0" />}
        </button>
      )}

      <DataTable
        columns={columns}
        rows={data?.results || []}
        isLoading={isFirstLoad}
        empty="No customers yet — add your first."
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
        title={isNew ? 'New customer' : `Edit ${editing?.name || ''}`}
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setEditing(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="customer-form" type="submit">Save</PrimaryButton>
          </>
        }
      >
        {editing && (
          <form id="customer-form" onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
            {error && <div className="sm:col-span-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
            <Field label="Name" required className="sm:col-span-2">
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
            </Field>
            <Field label="Type">
              <Select value={editing.customer_type} onChange={(e) => setEditing({ ...editing, customer_type: e.target.value })}>
                <option value="individual">Individual</option>
                <option value="business">Business</option>
                <option value="institution">Institution</option>
              </Select>
            </Field>
            <Field label="Contact person">
              <Input value={editing.contact_person} onChange={(e) => setEditing({ ...editing, contact_person: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
            </Field>
            <Field label="Alt phone">
              <Input value={editing.alt_phone} onChange={(e) => setEditing({ ...editing, alt_phone: e.target.value })} />
            </Field>
            <Field label="City">
              <Input value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
            </Field>
            <Field label="Country">
              <Input value={editing.country} onChange={(e) => setEditing({ ...editing, country: e.target.value })} />
            </Field>
            <Field label="VAT number">
              <Input value={editing.vat_number} onChange={(e) => setEditing({ ...editing, vat_number: e.target.value })} placeholder="VAT registration no." />
            </Field>
            <Field label="TIN / BP number">
              <Input value={editing.tin_number} onChange={(e) => setEditing({ ...editing, tin_number: e.target.value })} placeholder="ZIMRA TIN / BP number" />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Textarea value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} rows={2} />
            </Field>

            {/* Site visit — 3-state, defaults to "Not required". */}
            <Field label="Site visit" className="sm:col-span-2">
              <div className="flex flex-wrap gap-2">
                {SITE_VISIT_OPTIONS.map(([val, lbl]) => {
                  const active = (editing.site_visit_status || 'not_required') === val
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setEditing({ ...editing, site_visit_status: val })}
                      className={`px-3.5 py-2 rounded-xl border text-sm font-sora transition-colors ${
                        active
                          ? 'bg-lafoi-dark text-white border-lafoi-dark'
                          : 'bg-white text-lafoi-gray border-lafoi-dark/12 hover:border-lafoi-green/40 hover:text-lafoi-dark'
                      }`}
                    >
                      {lbl}
                    </button>
                  )
                })}
              </div>
              <p className="text-[11px] text-lafoi-gray-medium mt-1.5">
                Set to <strong>To be done</strong> to flag this customer for an admin site visit —
                they'll show in the site-visit alert on this page. Default is <strong>Not required</strong>.
              </p>
            </Field>

            {editing.site_visit_status && editing.site_visit_status !== 'not_required' && (
              <>
                <Field label={editing.site_visit_status === 'done' ? 'Date visited' : 'Scheduled / target date'}>
                  <Input
                    type="date"
                    value={editing.site_visit_date || ''}
                    onChange={(e) => setEditing({ ...editing, site_visit_date: e.target.value })}
                  />
                </Field>
                <Field label="Site visit notes">
                  <Input
                    value={editing.site_visit_notes || ''}
                    onChange={(e) => setEditing({ ...editing, site_visit_notes: e.target.value })}
                    placeholder="Access, what to assess, who to meet…"
                  />
                </Field>
              </>
            )}

            <Field label="Notes" className="sm:col-span-2">
              <Textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={3} />
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}
