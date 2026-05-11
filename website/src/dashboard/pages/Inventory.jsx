import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from 'react-redux'
import {
import { useConfirm } from '../components/ConfirmDialog'
  Plus, Trash, PencilSimple, MagnifyingGlass, CircleNotch,
  Package, Warning, QrCode, DownloadSimple, UploadSimple, X,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import DataTable, { fmtMoney } from '../components/DataTable'
import Modal from '../components/Modal'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton } from '../components/FormField'
import useDebouncedValue from '../hooks/useDebouncedValue'
import useOptimisticListUpdate from '../hooks/useOptimisticListUpdate'
import BarcodeScanner from '../components/BarcodeScanner'
import OfflineSyncBadge from '../components/OfflineSyncBadge'
import {
  useListItemsQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
  useListInventoryCategoriesQuery,
  useListSuppliersQuery,
  useImportItemsCsvMutation,
  useLazyLookupItemByBarcodeQuery,
  downloadFile,
} from '../store/api'

const UNITS = [
  { value: 'piece', label: 'Piece' },
  { value: 'm', label: 'Metre' },
  { value: 'm2', label: 'Square metre' },
  { value: 'm3', label: 'Cubic metre' },
  { value: 'kg', label: 'Kilogram' },
  { value: 'l', label: 'Litre' },
  { value: 'roll', label: 'Roll' },
  { value: 'box', label: 'Box' },
  { value: 'set', label: 'Set' },
]

const empty = () => ({
  name: '', barcode: '', category: '', supplier: '', unit: 'piece',
  cost_price: 0, sale_price: 0, currency: 'USD',
  reorder_threshold: 0, reorder_quantity: 0,
  description: '', image_url: '', is_active: true,
})

export default function Inventory() {
  const confirm = useConfirm()
  const navigate = useNavigate()
  const store = useStore()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [lowOnly, setLowOnly] = useState(false)

  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  const [scannerOpen, setScannerOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importResult, setImportResult] = useState(null)

  useEffect(() => { setPage(1) }, [debouncedSearch, categoryFilter, supplierFilter, lowOnly])

  const queryArgs = useMemo(() => {
    const args = { page, page_size: pageSize }
    if (debouncedSearch) args.search = debouncedSearch
    if (categoryFilter) args.category = categoryFilter
    if (supplierFilter) args.supplier = supplierFilter
    if (lowOnly) args.low_stock = 'true'
    return args
  }, [page, pageSize, debouncedSearch, categoryFilter, supplierFilter, lowOnly])

  const { data, isLoading: isFirstLoad } = useListItemsQuery(queryArgs)
  const { data: catData } = useListInventoryCategoriesQuery({ page: 1, page_size: 200 })
  const { data: supData } = useListSuppliersQuery({ page: 1, page_size: 200 })

  const applyOptimistic = useOptimisticListUpdate('listItems', queryArgs)

  const [createItem, createState] = useCreateItemMutation()
  const [updateItem, updateState] = useUpdateItemMutation()
  const [deleteItem] = useDeleteItemMutation()
  const [importCsv, importState] = useImportItemsCsvMutation()
  const [triggerLookup, lookupState] = useLazyLookupItemByBarcodeQuery()

  const isNew = editing && !editing.id
  const saving = createState.isLoading || updateState.isLoading

  const categories = catData?.results || []
  const suppliers = supData?.results || []
  const items = data?.results || []

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      name: editing.name?.trim(),
      barcode: editing.barcode?.trim() || '',
      category: editing.category || null,
      supplier: editing.supplier || null,
      unit: editing.unit || 'piece',
      cost_price: Number(editing.cost_price) || 0,
      sale_price: Number(editing.sale_price) || 0,
      currency: editing.currency || 'USD',
      reorder_threshold: Number(editing.reorder_threshold) || 0,
      reorder_quantity: Number(editing.reorder_quantity) || 0,
      description: editing.description || '',
      image_url: editing.image_url || '',
      is_active: editing.is_active !== false,
    }
    try {
      if (isNew) {
        const created = await createItem(payload).unwrap()
        toast.success('Item added', { description: `${created.sku} — ${created.name}` })
      } else {
        const updated = await updateItem({ id: editing.id, ...payload }).unwrap()
        toast.success('Item updated', { description: `${updated.sku} — ${updated.name}` })
      }
      setEditing(null)
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Save failed.'
      setError(msg)
      toast.error(isNew ? 'Could not add item' : 'Could not update item', { description: msg })
    }
  }

  const handleDelete = async (row) => {
    if (!(await confirm({ title: 'Delete inventory item?', message: `"${row.name}" will be removed permanently. Linked movements stay for audit.`, confirmLabel: 'Delete', danger: true }))) return
    try {
      await applyOptimistic(
        (draft) => {
          if (!draft?.results) return
          draft.results = draft.results.filter((r) => r.id !== row.id)
          if (typeof draft.count === 'number') draft.count = Math.max(0, draft.count - 1)
        },
        () => deleteItem(row.id).unwrap(),
      )
      toast.success('Item removed', { description: row.name })
    } catch (err) {
      const msg = err?.data?.detail || 'Delete failed.'
      toast.error('Could not delete item', { description: msg })
    }
  }

  const handleScannerHit = async (code) => {
    setScannerOpen(false)
    if (!code) return
    try {
      const match = await triggerLookup(code).unwrap()
      if (match?.id) {
        toast.success('Match found', { description: `${match.sku} — ${match.name}` })
        navigate(`/dashboard/inventory/${match.id}`)
      } else {
        toast.message('No item matches that code', { description: 'You can create one now.' })
        setEditing({ ...empty(), barcode: code })
      }
    } catch (err) {
      // 404 → start a new item draft pre-filled with the code
      if (err?.status === 404) {
        toast.message('No item matches that code', { description: 'Pre-filled a new item with that barcode.' })
        setEditing({ ...empty(), barcode: code })
      } else {
        toast.error('Lookup failed', { description: err?.data?.detail || String(err?.error || err) })
      }
    }
  }

  const handleExport = async () => {
    try {
      await downloadFile('items/export_csv/', 'inventory.csv', store.getState)
      toast.success('CSV downloaded')
    } catch (err) {
      toast.error('Export failed', { description: String(err) })
    }
  }

  const handleImport = async (e) => {
    e.preventDefault()
    if (!importFile) {
      toast.error('Pick a CSV first')
      return
    }
    const fd = new FormData()
    fd.append('file', importFile)
    try {
      const res = await importCsv(fd).unwrap()
      setImportResult(res)
      toast.success('Import complete', {
        description: `${res.created} created · ${res.updated} updated${res.errors?.length ? ` · ${res.errors.length} errors` : ''}`,
      })
    } catch (err) {
      const msg = err?.data?.file || err?.data?.detail || 'Import failed.'
      toast.error('Import failed', { description: typeof msg === 'string' ? msg : JSON.stringify(msg) })
    }
  }

  const columns = [
    {
      key: 'name', label: 'Item', priority: 'high',
      render: (r) => (
        <div className="flex items-center gap-3">
          {r.image_url ? (
            <img src={r.image_url} alt="" className="w-9 h-9 rounded-lg object-cover bg-lafoi-cream" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-lafoi-cream flex items-center justify-center text-lafoi-gray-medium">
              <Package size={16} />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-sora text-sm font-medium truncate">{r.name}</p>
            <p className="text-[11px] text-lafoi-gray-medium truncate font-sora">{r.sku}{r.barcode ? ` · ${r.barcode}` : ''}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category', label: 'Category', priority: 'medium',
      render: (r) => r.category_name || <span className="text-lafoi-gray-medium">—</span>,
    },
    {
      key: 'on_hand', label: 'On hand', priority: 'high',
      render: (r) => (
        <div className="flex items-center gap-2 tabular-nums">
          <span className="font-sora text-sm">{Number(r.on_hand || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
          <span className="text-[11px] text-lafoi-gray-medium">{r.unit}</span>
          {r.is_low_stock && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-sora tracking-[0.18em] uppercase">
              <Warning size={10} weight="bold" /> Low
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'reorder_threshold', label: 'Reorder at', priority: 'low',
      render: (r) => (
        <span className="text-xs font-sora tabular-nums text-lafoi-gray">
          {Number(r.reorder_threshold || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'cost_sale', label: 'Cost / Sale', priority: 'medium',
      render: (r) => (
        <div className="text-xs font-sora tabular-nums">
          <p>{fmtMoney(r.cost_price, r.currency)}</p>
          <p className="text-lafoi-gray-medium">{fmtMoney(r.sale_price, r.currency)}</p>
        </div>
      ),
    },
    {
      key: 'supplier_name', label: 'Supplier', priority: 'low',
      render: (r) => r.supplier_name || <span className="text-lafoi-gray-medium">—</span>,
    },
    {
      key: 'actions', label: '', priority: 'high',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(r) }}
            className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
            title="Edit"
          >
            <PencilSimple size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(r) }}
            className="p-2 rounded-lg hover:bg-red-50 text-lafoi-gray hover:text-red-600 min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
            title="Delete"
          >
            <Trash size={14} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Inventory"
        title="Materials & stock catalogue."
        description="Every SKU the studio holds — tracked across locations, surfaced when low, scannable from your phone."
        actions={
          <>
            <OfflineSyncBadge />
            <SecondaryButton type="button" onClick={handleExport} title="Download as CSV">
              <DownloadSimple size={14} weight="bold" /> Export
            </SecondaryButton>
            <SecondaryButton type="button" onClick={() => { setImportFile(null); setImportResult(null); setImportOpen(true) }}>
              <UploadSimple size={14} weight="bold" /> Import CSV
            </SecondaryButton>
            <SecondaryButton type="button" onClick={() => setScannerOpen(true)}>
              <QrCode size={14} weight="bold" /> Scan
            </SecondaryButton>
            <PrimaryButton type="button" onClick={() => setEditing({ ...empty() })}>
              <Plus size={14} weight="bold" /> New item
            </PrimaryButton>
          </>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-1.5">Search</p>
          <div className="relative">
            <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lafoi-gray-medium" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search SKU, name, barcode, description"
              className="w-full pl-9 pr-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body"
            />
          </div>
        </div>
        <div className="min-w-[180px]">
          <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-1.5">Category</p>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body"
          >
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="min-w-[180px]">
          <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-1.5">Supplier</p>
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body"
          >
            <option value="">All suppliers</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-lafoi-dark/12 bg-white cursor-pointer">
          <input
            type="checkbox"
            checked={lowOnly}
            onChange={(e) => setLowOnly(e.target.checked)}
            className="accent-lafoi-green"
          />
          <span className="text-xs font-sora tracking-[0.18em] uppercase text-lafoi-gray">Low stock only</span>
        </label>
        {(categoryFilter || supplierFilter || lowOnly || search) && (
          <button
            onClick={() => { setCategoryFilter(''); setSupplierFilter(''); setLowOnly(false); setSearch('') }}
            className="px-3 py-2 text-xs font-sora tracking-[0.16em] uppercase text-lafoi-gray-medium hover:text-lafoi-green transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        rows={items}
        isLoading={isFirstLoad}
        empty={lowOnly ? 'No items at or under their reorder threshold.' : 'No items yet — add your first.'}
        onRowClick={(r) => navigate(`/dashboard/inventory/${r.id}`)}
        pagination={data ? {
          count: data.count,
          page,
          pageSize,
          onPageChange: setPage,
          onPageSizeChange: (s) => { setPageSize(s); setPage(1) },
        } : null}
      />

      {/* Edit modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={isNew ? 'New item' : `Edit ${editing?.name || ''}`}
        size="lg"
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setEditing(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="item-form" type="submit" disabled={saving}>
              {saving ? (<><CircleNotch size={14} className="animate-spin" /> Saving…</>) : 'Save'}
            </PrimaryButton>
          </>
        }
      >
        {editing && (
          <form id="item-form" onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
            {error && <div className="sm:col-span-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
            <Field label="Name" required className="sm:col-span-2">
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
            </Field>
            <Field label="Barcode / QR">
              <Input value={editing.barcode} onChange={(e) => setEditing({ ...editing, barcode: e.target.value })} placeholder="Optional" />
            </Field>
            <Field label="Unit">
              <Select value={editing.unit} onChange={(e) => setEditing({ ...editing, unit: e.target.value })}>
                {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
              </Select>
            </Field>
            <Field label="Category">
              <Select value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                <option value="">— None —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Supplier">
              <Select value={editing.supplier || ''} onChange={(e) => setEditing({ ...editing, supplier: e.target.value })}>
                <option value="">— None —</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>
            <Field label="Cost price">
              <Input type="number" step="0.01" min="0" value={editing.cost_price}
                onChange={(e) => setEditing({ ...editing, cost_price: e.target.value })} />
            </Field>
            <Field label="Sale price">
              <Input type="number" step="0.01" min="0" value={editing.sale_price}
                onChange={(e) => setEditing({ ...editing, sale_price: e.target.value })} />
            </Field>
            <Field label="Currency">
              <Select value={editing.currency || 'USD'} onChange={(e) => setEditing({ ...editing, currency: e.target.value })}>
                <option value="USD">USD</option>
                <option value="ZWG">ZWG</option>
                <option value="ZAR">ZAR</option>
              </Select>
            </Field>
            <Field label="Reorder threshold" hint="Flag as low stock at or below this quantity.">
              <Input type="number" step="0.01" min="0" value={editing.reorder_threshold}
                onChange={(e) => setEditing({ ...editing, reorder_threshold: e.target.value })} />
            </Field>
            <Field label="Reorder quantity" hint="Default suggested order quantity when threshold is hit.">
              <Input type="number" step="0.01" min="0" value={editing.reorder_quantity}
                onChange={(e) => setEditing({ ...editing, reorder_quantity: e.target.value })} />
            </Field>
            <Field label="Image URL" className="sm:col-span-2">
              <Input value={editing.image_url} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} placeholder="https://…" />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} />
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

      {/* Import CSV modal */}
      <Modal
        open={importOpen}
        onClose={() => { setImportOpen(false); setImportResult(null); setImportFile(null) }}
        title="Import items from CSV"
        size="md"
        footer={
          <>
            <SecondaryButton type="button" onClick={() => { setImportOpen(false); setImportResult(null); setImportFile(null) }}>Close</SecondaryButton>
            <PrimaryButton form="import-form" type="submit" disabled={importState.isLoading || !importFile}>
              {importState.isLoading ? (<><CircleNotch size={14} className="animate-spin" /> Importing…</>) : 'Upload'}
            </PrimaryButton>
          </>
        }
      >
        <form id="import-form" onSubmit={handleImport} className="space-y-4">
          <p className="text-sm text-lafoi-gray-medium font-body">
            Upload a UTF-8 CSV. The first row must be a header. Recognised columns:
            <span className="block mt-2 font-sora text-[11px] tracking-[0.06em] text-lafoi-dark">
              sku, name, barcode, category, supplier, unit, cost_price, sale_price, currency, reorder_threshold, reorder_quantity, is_active
            </span>
          </p>
          <p className="text-xs text-lafoi-gray-medium font-body">Rows with an existing SKU update that item; rows without one create a new SKU automatically.</p>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            className="block w-full text-sm font-body file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-lafoi-cream file:text-lafoi-dark file:font-sora file:text-xs file:tracking-[0.16em] file:uppercase file:cursor-pointer"
          />
          {importResult && (
            <div className="rounded-xl border border-lafoi-dark/10 p-3 text-sm font-body bg-lafoi-cream/60">
              <p className="font-sora text-[11px] tracking-[0.18em] uppercase text-lafoi-gray-medium mb-1.5">Result</p>
              <p>{importResult.created} created · {importResult.updated} updated · {importResult.errors?.length || 0} errors</p>
              {importResult.errors?.length > 0 && (
                <ul className="mt-2 max-h-40 overflow-auto text-xs space-y-1">
                  {importResult.errors.slice(0, 50).map((e, i) => (
                    <li key={i} className="text-red-700">Row {e.row}: {e.error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </form>
      </Modal>

      {/* Barcode scanner */}
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetect={handleScannerHit}
      />
    </div>
  )
}
