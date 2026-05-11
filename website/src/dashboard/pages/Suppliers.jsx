import React, { useEffect, useState } from 'react'
import { Plus, Trash, PencilSimple, MagnifyingGlass, CircleNotch, Truck } from '@phosphor-icons/react'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton } from '../components/FormField'
import useDebouncedValue from '../hooks/useDebouncedValue'
import useOptimisticListUpdate from '../hooks/useOptimisticListUpdate'
import {
import { useConfirm } from '../components/ConfirmDialog'
  useListSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} from '../store/api'

const empty = () => ({
  name: '', contact_person: '', email: '', phone: '',
  address: '', lead_time_days: 7, payment_terms: '',
  notes: '', is_active: true,
})

export default function Suppliers() {
  const confirm = useConfirm()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { setPage(1) }, [debouncedSearch])

  const queryArgs = { page, page_size: pageSize, search: debouncedSearch || undefined }
  const { data, isLoading: isFirstLoad } = useListSuppliersQuery(queryArgs)

  const applyOptimistic = useOptimisticListUpdate('listSuppliers', queryArgs)

  const [createSupplier, createState] = useCreateSupplierMutation()
  const [updateSupplier, updateState] = useUpdateSupplierMutation()
  const [deleteSupplier] = useDeleteSupplierMutation()

  const isNew = editing && !editing.id
  const saving = createState.isLoading || updateState.isLoading

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      name: editing.name?.trim(),
      contact_person: editing.contact_person || '',
      email: editing.email || '',
      phone: editing.phone || '',
      address: editing.address || '',
      lead_time_days: Number(editing.lead_time_days) || 0,
      payment_terms: editing.payment_terms || '',
      notes: editing.notes || '',
      is_active: editing.is_active !== false,
    }
    try {
      if (isNew) {
        const created = await createSupplier(payload).unwrap()
        toast.success('Supplier added', { description: created?.name || payload.name })
      } else {
        await updateSupplier({ id: editing.id, ...payload }).unwrap()
        toast.success('Supplier updated', { description: payload.name })
      }
      setEditing(null)
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Save failed.'
      setError(msg)
      toast.error(isNew ? 'Could not add supplier' : 'Could not update supplier', { description: msg })
    }
  }

  const handleDelete = async (row) => {
    if (!(await confirm({ title: 'Delete supplier?', message: `"${row.name}" will be removed. Items linked to it will be unlinked.`, confirmLabel: 'Delete', danger: true }))) return
    try {
      await applyOptimistic(
        (draft) => {
          if (!draft?.results) return
          draft.results = draft.results.filter((r) => r.id !== row.id)
          if (typeof draft.count === 'number') draft.count = Math.max(0, draft.count - 1)
        },
        () => deleteSupplier(row.id).unwrap(),
      )
      toast.success('Supplier removed', { description: row.name })
    } catch (err) {
      const msg = err?.data?.detail || 'Delete failed.'
      toast.error('Could not delete supplier', { description: msg })
    }
  }

  const columns = [
    {
      key: 'name', label: 'Supplier', priority: 'high',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-lafoi-cream flex items-center justify-center text-lafoi-gray-medium">
            <Truck size={16} />
          </div>
          <div className="min-w-0">
            <p className="font-sora text-sm font-medium truncate">{r.name}</p>
            <p className="text-[11px] text-lafoi-gray-medium truncate">{r.contact_person || r.email || r.phone || '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', label: 'Email', priority: 'medium', render: (r) => r.email || <span className="text-lafoi-gray-medium">—</span> },
    { key: 'phone', label: 'Phone', priority: 'low', render: (r) => r.phone || '—' },
    { key: 'lead_time_days', label: 'Lead time', priority: 'medium', render: (r) => `${r.lead_time_days}d` },
    { key: 'payment_terms', label: 'Terms', priority: 'desktop', render: (r) => r.payment_terms || '—' },
    {
      key: 'item_count', label: 'Items', priority: 'medium',
      render: (r) => <span className="tabular-nums font-sora">{r.item_count || 0}</span>,
    },
    {
      key: 'open_po_count', label: 'Open POs', priority: 'low',
      render: (r) => <span className="tabular-nums font-sora">{r.open_po_count || 0}</span>,
    },
    {
      key: 'actions', label: '', priority: 'high',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <button onClick={(e) => { e.stopPropagation(); setEditing(r) }}
            className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><PencilSimple size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(r) }}
            className="p-2 rounded-lg hover:bg-red-50 text-lafoi-gray hover:text-red-600 min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><Trash size={14} /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Suppliers"
        title="The makers we buy from."
        description="Vendors, lead times, and terms — backing every PO and material movement."
        actions={
          <>
            <div className="relative">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lafoi-gray-medium" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search suppliers"
                className="pl-9 pr-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body w-56"
              />
            </div>
            <PrimaryButton onClick={() => setEditing({ ...empty() })}><Plus size={14} weight="bold" /> New supplier</PrimaryButton>
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={data?.results || []}
        isLoading={isFirstLoad}
        empty="No suppliers yet — add your first."
        pagination={data ? {
          count: data.count, page, pageSize,
          onPageChange: setPage,
          onPageSizeChange: (s) => { setPageSize(s); setPage(1) },
        } : null}
      />

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={isNew ? 'New supplier' : `Edit ${editing?.name || ''}`}
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setEditing(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="supplier-form" type="submit" disabled={saving}>
              {saving ? (<><CircleNotch size={14} className="animate-spin" /> Saving…</>) : 'Save'}
            </PrimaryButton>
          </>
        }
      >
        {editing && (
          <form id="supplier-form" onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
            {error && <div className="sm:col-span-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
            <Field label="Name" required className="sm:col-span-2">
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
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
            <Field label="Lead time (days)">
              <Input type="number" min="0" value={editing.lead_time_days}
                onChange={(e) => setEditing({ ...editing, lead_time_days: e.target.value })} />
            </Field>
            <Field label="Payment terms" className="sm:col-span-2">
              <Input value={editing.payment_terms} onChange={(e) => setEditing({ ...editing, payment_terms: e.target.value })} placeholder="e.g. Net 30, 50% deposit" />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Textarea value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} rows={2} />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={3} />
            </Field>
            <Field label="Status">
              <Select value={editing.is_active ? 'true' : 'false'}
                onChange={(e) => setEditing({ ...editing, is_active: e.target.value === 'true' })}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}
