import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash, PencilSimple, MagnifyingGlass, CircleNotch } from '@phosphor-icons/react'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import DataTable, { fmtDate } from '../components/DataTable'
import Modal from '../components/Modal'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton, DangerButton } from '../components/FormField'
import {
  useListCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} from '../store/api'

const empty = {
  name: '', customer_type: 'individual', contact_person: '', email: '', phone: '',
  alt_phone: '', address: '', city: 'Harare', country: 'Zimbabwe', notes: '',
}

export default function Customers() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null) // null | {} (for new) | row
  const [error, setError] = useState('')

  const { data, isLoading: isFirstLoad, isFetching } = useListCustomersQuery({ page, search: search || undefined })

  const [createCustomer, createState] = useCreateCustomerMutation()
  const [updateCustomer, updateState] = useUpdateCustomerMutation()
  const [deleteCustomer] = useDeleteCustomerMutation()

  const isNew = editing && !editing.id
  const saving = createState.isLoading || updateState.isLoading

  const handleSave = async (e) => {
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
      notes: editing.notes || '',
    }
    try {
      if (isNew) {
        const created = await createCustomer(payload).unwrap()
        toast.success('Customer added', { description: created?.name || payload.name })
      } else {
        const updated = await updateCustomer({ id: editing.id, ...payload }).unwrap()
        toast.success('Customer updated', { description: updated?.name || payload.name })
      }
      setEditing(null)
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Save failed.'
      setError(msg)
      toast.error(isNew ? 'Could not add customer' : 'Could not update customer', { description: msg })
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete customer “${row.name}”? This cannot be undone.`)) return
    try {
      await deleteCustomer(row.id).unwrap()
      toast.success('Customer removed', { description: row.name })
    } catch (e) {
      const msg = e?.data?.detail || 'Delete failed.'
      toast.error('Could not delete customer', { description: msg })
    }
  }

  const columns = [
    { key: 'name', label: 'Customer', render: (r) => (
      <div>
        <p className="font-sora text-sm font-medium">{r.name}</p>
        <p className="text-xs text-lafoi-gray-medium">{r.contact_person || r.email || r.phone || '—'}</p>
      </div>
    )},
    { key: 'customer_type', label: 'Type', render: (r) => <span className="capitalize text-xs font-sora">{r.customer_type}</span> },
    { key: 'city', label: 'City' },
    { key: 'phone', label: 'Phone' },
    { key: 'project_count', label: 'Projects', render: (r) => r.project_count ?? 0 },
    { key: 'created_at', label: 'Added', render: (r) => fmtDate(r.created_at) },
    { key: 'actions', label: '', render: (r) => (
      <div className="flex justify-end gap-1">
        <button onClick={(e) => { e.stopPropagation(); setEditing(r) }} className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark"><PencilSimple size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(r) }} className="p-2 rounded-lg hover:bg-red-50 text-lafoi-gray hover:text-red-600"><Trash size={14} /></button>
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
            <div className="relative">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lafoi-gray-medium" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search customers"
                className="pl-9 pr-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body w-56"
              />
            </div>
            <PrimaryButton onClick={() => setEditing({ ...empty })}><Plus size={14} weight="bold" /> New customer</PrimaryButton>
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={data?.results || []}
        isLoading={isFirstLoad}
        empty="No customers yet — add your first."
        pagination={data ? { count: data.count, page, pageSize: 25, onPageChange: setPage } : null}
      />

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={isNew ? 'New customer' : `Edit ${editing?.name || ''}`}
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setEditing(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="customer-form" type="submit" disabled={saving}>
              {saving ? (<><CircleNotch size={14} className="animate-spin" /> Saving…</>) : 'Save'}
            </PrimaryButton>
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
            <Field label="Address" className="sm:col-span-2">
              <Textarea value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} rows={2} />
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
