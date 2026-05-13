import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Trash, PencilSimple, MagnifyingGlass, Cube, Wrench, Image as ImageIcon, X } from '@phosphor-icons/react'
import { useConfirm } from '../components/ConfirmDialog'

import PageHeader from '../components/PageHeader'
import DataTable, { fmtMoney, StatusBadge } from '../components/DataTable'
import Modal from '../components/Modal'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton } from '../components/FormField'
import useDebouncedValue from '../hooks/useDebouncedValue'
import useOptimisticRow from '../hooks/useOptimisticRow'
import {
  useListCatalogQuery,
  useCreateCatalogItemMutation,
  useUpdateCatalogItemMutation,
  useDeleteCatalogItemMutation,
} from '../store/api'

const KIND_PALETTE = {
  product: 'bg-blue-50 text-blue-700 border-blue-200',
  service: 'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/40',
}

const UNITS = ['m²', 'm', 'm³', 'L', 'kg', 'piece', 'set', 'pair', 'unit', 'roll', 'box', 'lot', 'hours', 'day']
const CURRENCIES = ['USD', 'ZWG', 'ZAR', 'GBP', 'EUR']

const empty = () => ({
  kind: 'service',
  name: '',
  short_code: '',
  description: '',
  default_unit: 'm²',
  default_unit_price: 0,
  currency: 'USD',
  tags: [],
  is_active: true,
  sort_order: 0,
  notes: '',
})

export default function Catalog() {
  const confirm = useConfirm()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [kindFilter, setKindFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('') // '', 'true', 'false'
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { setPage(1) }, [debouncedSearch, kindFilter, activeFilter])

  const queryArgs = useMemo(() => {
    const args = { page, page_size: pageSize }
    if (debouncedSearch) args.search = debouncedSearch
    if (kindFilter) args.kind = kindFilter
    if (activeFilter) args.is_active = activeFilter
    return args
  }, [page, pageSize, debouncedSearch, kindFilter, activeFilter])

  const { data, isLoading: isFirstLoad } = useListCatalogQuery(queryArgs)
  const rows = data?.results || []

  const { optimisticCreate, optimisticUpdate, optimisticDelete } = useOptimisticRow('listCatalog', queryArgs)
  const [createItem] = useCreateCatalogItemMutation()
  const [updateItem] = useUpdateCatalogItemMutation()
  const [deleteItem] = useDeleteCatalogItemMutation()

  const isNew = editing && !editing.id

  const handleSave = (e) => {
    e.preventDefault()
    setError('')
    const tags = (editing.tags || []).map((t) => String(t).trim()).filter(Boolean)
    const payload = {
      kind: editing.kind,
      name: editing.name?.trim(),
      short_code: editing.short_code?.trim() || '',
      description: editing.description || '',
      default_unit: editing.default_unit || 'unit',
      default_unit_price: Number(editing.default_unit_price) || 0,
      currency: editing.currency,
      tags,
      is_active: editing.is_active !== false,
      sort_order: Number(editing.sort_order) || 0,
      notes: editing.notes || '',
    }
    const wasNew = isNew
    const id = editing.id
    setEditing(null)
    const tempRow = {
      ...payload,
      kind_label: payload.kind === 'product' ? 'Product' : 'Service',
      times_used: editing.times_used || 0,
    }
    if (wasNew) {
      optimisticCreate({
        tempRow,
        run: () => createItem(payload).unwrap(),
        label: 'Adding…',
        successTitle: 'Catalog item added',
        errorTitle: 'Could not add item',
        describe: (r) => r?.name || payload.name,
      }).catch(() => {})
    } else {
      optimisticUpdate({
        id,
        patch: tempRow,
        run: () => updateItem({ id, ...payload }).unwrap(),
        successTitle: 'Catalog item updated',
        errorTitle: 'Could not update item',
        describe: (r) => r?.name || payload.name,
      }).catch(() => {})
    }
  }

  const handleDelete = async (row) => {
    if (!(await confirm({
      title: 'Delete catalog item?',
      message: `"${row.name}" will be removed. Existing quotations are unaffected.`,
      confirmLabel: 'Delete', danger: true,
    }))) return
    optimisticDelete({
      id: row.id,
      run: () => deleteItem(row.id).unwrap(),
      successTitle: 'Item removed',
      errorTitle: 'Could not delete item',
      describe: (r) => r.name,
    }).catch(() => {})
  }

  const columns = [
    {
      key: 'name', label: 'Item', priority: 'high',
      render: (r) => (
        <div className="flex items-start gap-3">
          <span className={`mt-1 inline-flex w-8 h-8 rounded-lg items-center justify-center shrink-0 ${r.kind === 'product' ? 'bg-blue-50 text-blue-700' : 'bg-lafoi-green/10 text-lafoi-green-dark'}`}>
            {r.kind === 'product' ? <Cube size={14} weight="regular" /> : <Wrench size={14} weight="regular" />}
          </span>
          <div className="min-w-0">
            <p className="font-sora text-sm font-medium truncate">{r.name}</p>
            <p className="text-[11px] text-lafoi-gray-medium mt-0.5">
              {r.short_code && <span className="font-sora">{r.short_code}</span>}
              {r.short_code && r.description && <span> · </span>}
              {r.description && <span className="truncate">{r.description.slice(0, 70)}{r.description.length > 70 ? '…' : ''}</span>}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'kind', label: 'Kind', priority: 'medium',
      render: (r) => <StatusBadge status={r.kind_label || r.kind} palette={KIND_PALETTE} />,
    },
    {
      key: 'default_unit', label: 'Unit', priority: 'low',
      render: (r) => <span className="text-xs font-sora">{r.default_unit}</span>,
    },
    {
      key: 'default_unit_price', label: 'Default price', priority: 'high',
      render: (r) => <span className="tabular-nums font-sora">{fmtMoney(r.default_unit_price, r.currency)}</span>,
    },
    {
      key: 'times_used', label: 'Used', priority: 'low',
      render: (r) => <span className="text-xs font-sora tabular-nums text-lafoi-gray">{r.times_used || 0}×</span>,
    },
    {
      key: 'is_active', label: 'Status', priority: 'medium',
      render: (r) => r.is_active
        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-lafoi-green/10 text-lafoi-green-dark border border-lafoi-green/25 text-[10px] font-sora tracking-[0.18em] uppercase">Active</span>
        : <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-lafoi-gray-light text-lafoi-gray border border-lafoi-dark/10 text-[10px] font-sora tracking-[0.18em] uppercase">Inactive</span>,
    },
    {
      key: 'actions', label: '', priority: 'high',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <button onClick={(e) => { e.stopPropagation(); setEditing({ ...r }) }}
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
        eyebrow="Catalog"
        title="Products & services library."
        description="The reusable inventory of things we quote and bill — pulled into line items in one keystroke."
        actions={
          <>
            <Select value={kindFilter} onChange={(e) => setKindFilter(e.target.value)} className="w-32">
              <option value="">All kinds</option>
              <option value="product">Products</option>
              <option value="service">Services</option>
            </Select>
            <Select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} className="w-32">
              <option value="">Any status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
            <div className="relative">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lafoi-gray-medium" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search catalog"
                className="pl-9 pr-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body w-56"
              />
            </div>
            <PrimaryButton onClick={() => setEditing({ ...empty() })}>
              <Plus size={14} weight="bold" /> New item
            </PrimaryButton>
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={isFirstLoad}
        empty="Catalog is empty — add your first product or service."
        pagination={data ? {
          count: data.count,
          page, pageSize,
          onPageChange: setPage,
          onPageSizeChange: (s) => { setPageSize(s); setPage(1) },
        } : null}
      />

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={isNew ? 'New catalog item' : `Edit ${editing?.name || ''}`}
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setEditing(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="catalog-form" type="submit">Save</PrimaryButton>
          </>
        }
      >
        {editing && (
          <form id="catalog-form" onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
            {error && <div className="sm:col-span-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

            <Field label="Kind" required>
              <Select value={editing.kind} onChange={(e) => setEditing({ ...editing, kind: e.target.value })}>
                <option value="service">Service</option>
                <option value="product">Product</option>
              </Select>
            </Field>
            <Field label="Short code">
              <Input value={editing.short_code} onChange={(e) => setEditing({ ...editing, short_code: e.target.value })} placeholder="STAR-CL · BATH-STR · etc." />
            </Field>

            <Field label="Name" required className="sm:col-span-2">
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Star Ceiling — fibre optic" required />
            </Field>

            <Field label="Description" className="sm:col-span-2">
              <Textarea
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                rows={3}
                placeholder="Shows verbatim on the line item — be specific about finish, colour, mounting, etc."
              />
            </Field>

            <Field label="Default unit" required>
              <Select value={editing.default_unit} onChange={(e) => setEditing({ ...editing, default_unit: e.target.value })}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </Select>
            </Field>
            <Field label="Default unit price" required>
              <Input type="number" step="0.01" min="0" value={editing.default_unit_price} onChange={(e) => setEditing({ ...editing, default_unit_price: e.target.value })} required />
            </Field>

            <Field label="Currency">
              <Select value={editing.currency} onChange={(e) => setEditing({ ...editing, currency: e.target.value })}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Sort order">
              <Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })} />
            </Field>

            <Field label="Tags (comma-separated)" className="sm:col-span-2">
              <Input
                value={(editing.tags || []).join(', ')}
                onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                placeholder="ceiling, lounge, premium"
              />
            </Field>

            <Field label="Notes (internal, not shown on PDFs)" className="sm:col-span-2">
              <Textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={2} />
            </Field>

            <Field label=" " className="sm:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm text-lafoi-gray cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.is_active !== false}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  className="w-4 h-4 accent-lafoi-green"
                />
                Active (available in the line-item picker)
              </label>
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}
