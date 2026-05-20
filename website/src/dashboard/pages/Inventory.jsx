import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from 'react-redux'
import {
  Plus, Trash, PencilSimple, MagnifyingGlass, CircleNotch,
  Package, Warning, QrCode, DownloadSimple, UploadSimple, X,
  ArrowDown, ArrowUp,
} from '@phosphor-icons/react'
import { useConfirm } from '../components/ConfirmDialog'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import DataTable, { fmtMoney } from '../components/DataTable'
import Modal from '../components/Modal'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton } from '../components/FormField'
import useDebouncedValue from '../hooks/useDebouncedValue'
import useOptimisticRow from '../hooks/useOptimisticRow'
import BarcodeScanner from '../components/BarcodeScanner'
import OfflineSyncBadge from '../components/OfflineSyncBadge'
import {
  useListItemsQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
  useListInventoryCategoriesQuery,
  useListSuppliersQuery,
  useListStockLocationsQuery,
  useCreateMovementMutation,
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
  name: '', barcode: '', size_spec: '',
  category: '', supplier: '', unit: 'piece',
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

  const { optimisticCreate, optimisticUpdate, optimisticDelete } = useOptimisticRow('listItems', queryArgs)

  const [createItem] = useCreateItemMutation()
  const [updateItem] = useUpdateItemMutation()
  const [deleteItem] = useDeleteItemMutation()
  const [createMovement] = useCreateMovementMutation()
  const [importCsv, importState] = useImportItemsCsvMutation()
  const [triggerLookup, lookupState] = useLazyLookupItemByBarcodeQuery()

  const { data: locData } = useListStockLocationsQuery({ page: 1, page_size: 100 })
  const locations = locData?.results || []

  // Quick stock-movement dialog state. When set, opens a small modal that
  // posts a Movement against the selected item with the chosen direction.
  const [movement, setMovement] = useState(null)
  const openMovement = (item, direction) => {
    const defaultLoc = locations.find((l) => l.is_default) || locations[0]
    setMovement({
      item,
      direction,                          // 'in' | 'out'
      quantity: '',
      location: defaultLoc?.id || '',
      occurred_at: new Date().toISOString().slice(0, 10),
      reference: '',
    })
  }
  const handleMovementSave = async (e) => {
    e.preventDefault()
    if (!movement.location) { toast.error('Pick a location'); return }
    const qty = Number(movement.quantity)
    if (!qty || qty <= 0) { toast.error('Quantity must be a positive number'); return }
    const signed = movement.direction === 'in' ? qty : -qty
    const body = {
      item: movement.item.id,
      location: movement.location,
      quantity: String(signed),
      reason: movement.direction === 'in' ? 'receive' : 'issue',
      reference: movement.reference || '',
      occurred_at: `${movement.occurred_at}T12:00:00`,
    }
    const wasIn = movement.direction === 'in'
    setMovement(null)
    try {
      await createMovement(body).unwrap()
      toast.success(wasIn ? 'Stock in recorded' : 'Stock out recorded')
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Could not record movement.'
      toast.error('Movement failed', { description: msg })
    }
  }

  const isNew = editing && !editing.id

  const categories = catData?.results || []
  const suppliers = supData?.results || []
  const items = data?.results || []

  const handleSave = (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      name: editing.name?.trim(),
      barcode: editing.barcode?.trim() || '',
      size_spec: editing.size_spec?.trim() || '',
      category: editing.category || null,
      supplier: editing.supplier || null,
      unit: editing.unit || 'piece',
      reorder_threshold: Number(editing.reorder_threshold) || 0,
      reorder_quantity: Number(editing.reorder_quantity) || 0,
      description: editing.description || '',
      image_url: editing.image_url || '',
      is_active: editing.is_active !== false,
    }
    const wasNew = isNew
    const id = editing.id
    const matchedCategory = categories.find((c) => String(c.id) === String(payload.category))
    const matchedSupplier = suppliers.find((s) => String(s.id) === String(payload.supplier))
    setEditing(null)
    if (wasNew) {
      optimisticCreate({
        tempRow: {
          ...payload,
          sku: '…',
          on_hand: '0',
          balance: '0',
          total_in: '0',
          total_out: '0',
          last_in_date: null,
          last_out_date: null,
          is_low_stock: payload.reorder_threshold > 0,
          stock_level: 'low',
          category_name: matchedCategory?.name || '',
          supplier_name: matchedSupplier?.name || '',
        },
        run: () => createItem(payload).unwrap(),
        label: 'Adding…',
        successTitle: 'Item added',
        errorTitle: 'Could not add item',
        describe: (r) => `${r.sku} — ${r.name}`,
      }).catch(() => {})
    } else {
      optimisticUpdate({
        id,
        patch: {
          ...payload,
          category_name: matchedCategory?.name || '',
          supplier_name: matchedSupplier?.name || '',
        },
        run: () => updateItem({ id, ...payload }).unwrap(),
        successTitle: 'Item updated',
        errorTitle: 'Could not update item',
        describe: (r) => `${r.sku} — ${r.name}`,
      }).catch(() => {})
    }
  }

  const handleDelete = async (row) => {
    if (!(await confirm({ title: 'Delete inventory item?', message: `"${row.name}" will be removed permanently. Linked movements stay for audit.`, confirmLabel: 'Delete', danger: true }))) return
    optimisticDelete({
      id: row.id,
      run: () => deleteItem(row.id).unwrap(),
      successTitle: 'Item removed',
      errorTitle: 'Could not delete item',
      describe: (r) => r.name,
    }).catch(() => {})
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

  // Stock-level → ring colour. Three bands, centred on reorder_threshold.
  const stockTone = (lvl) => {
    if (lvl === 'high') return { dot: 'bg-lafoi-green', text: 'text-lafoi-green-dark', ring: 'bg-lafoi-green/15 border-lafoi-green/40' }
    if (lvl === 'medium') return { dot: 'bg-blue-500', text: 'text-blue-700', ring: 'bg-blue-50 border-blue-200' }
    return { dot: 'bg-red-500', text: 'text-red-700', ring: 'bg-red-50 border-red-200' }
  }
  const stockLabel = (lvl) => (lvl === 'high' ? 'Healthy' : lvl === 'medium' ? 'Caution' : 'Reorder')

  const fmtQty = (q, u) => `${Number(q || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}${u ? ` ${u}` : ''}`
  const fmtShortDate = (iso) => {
    if (!iso) return null
    try {
      return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
    } catch { return iso }
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
            <p className="text-[11px] text-lafoi-gray-medium truncate font-sora">
              {r.sku}
              {r.category_name ? ` · ${r.category_name}` : ''}
              {r.barcode ? ` · ${r.barcode}` : ''}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'size_spec', label: 'Size / Spec', priority: 'medium',
      render: (r) => r.size_spec
        ? <span className="text-xs font-sora text-lafoi-dark">{r.size_spec}</span>
        : <span className="text-xs text-lafoi-gray-medium">—</span>,
    },
    {
      key: 'balance', label: 'Balance', priority: 'high',
      render: (r) => {
        const tone = stockTone(r.stock_level || 'low')
        return (
          <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border ${tone.ring}`}>
            <span className={`w-2 h-2 rounded-full ${tone.dot}`} />
            <span className={`font-sora text-sm tabular-nums ${tone.text}`}>
              {fmtQty(r.balance ?? r.on_hand, r.unit)}
            </span>
          </div>
        )
      },
    },
    {
      key: 'in', label: 'In', priority: 'medium',
      render: (r) => (
        <div className="text-xs font-sora">
          <p className="tabular-nums text-lafoi-green-dark">
            {fmtQty(r.total_in, r.unit)}
          </p>
          <p className="text-[10px] text-lafoi-gray-medium mt-0.5">
            {r.last_in_date ? `last ${fmtShortDate(r.last_in_date)}` : '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'out', label: 'Out', priority: 'medium',
      render: (r) => (
        <div className="text-xs font-sora">
          <p className="tabular-nums text-red-700">
            {fmtQty(r.total_out, r.unit)}
          </p>
          <p className="text-[10px] text-lafoi-gray-medium mt-0.5">
            {r.last_out_date ? `last ${fmtShortDate(r.last_out_date)}` : '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'reorder_threshold', label: 'Reorder at', priority: 'low',
      render: (r) => (
        <span className="text-xs font-sora tabular-nums text-lafoi-gray">
          {fmtQty(r.reorder_threshold, r.unit)}
        </span>
      ),
    },
    {
      key: 'supplier_name', label: 'Supplier', priority: 'desktop',
      render: (r) => r.supplier_name || <span className="text-lafoi-gray-medium">—</span>,
    },
    {
      key: 'actions', label: '', priority: 'high',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openMovement(r, 'in') }}
            className="p-2 rounded-lg hover:bg-lafoi-green/10 text-lafoi-gray hover:text-lafoi-green-dark min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
            title="Stock in"
          >
            <ArrowDown size={14} weight="bold" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openMovement(r, 'out') }}
            className="p-2 rounded-lg hover:bg-red-50 text-lafoi-gray hover:text-red-600 min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
            title="Stock out"
          >
            <ArrowUp size={14} weight="bold" />
          </button>
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
            <PrimaryButton form="item-form" type="submit">Save</PrimaryButton>
          </>
        }
      >
        {editing && (
          <form id="item-form" onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
            {error && <div className="sm:col-span-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
            <Field label="Name" required className="sm:col-span-2">
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
            </Field>
            <Field label="Size / Spec" hint='Physical spec — e.g. "5m × 1.8m", "60W cool white".'>
              <Input value={editing.size_spec || ''} onChange={(e) => setEditing({ ...editing, size_spec: e.target.value })} placeholder="Optional" />
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

      {/* Quick stock-in / stock-out — records a Movement against the item.
          The aggregated In/Out columns refresh via the InventoryItem cache
          invalidation already baked into createMovement. */}
      <Modal
        open={!!movement}
        onClose={() => setMovement(null)}
        title={movement
          ? `${movement.direction === 'in' ? 'Stock in' : 'Stock out'} — ${movement.item.name}`
          : ''}
        size="md"
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setMovement(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="mov-form" type="submit">
              Record {movement?.direction === 'in' ? 'in' : 'out'}
            </PrimaryButton>
          </>
        }
      >
        {movement && (
          <form id="mov-form" onSubmit={handleMovementSave} className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 px-3 py-2.5 rounded-xl bg-lafoi-cream text-sm">
              <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-0.5">
                Current balance
              </p>
              <p className="font-display text-lg">
                {fmtQty(movement.item.balance ?? movement.item.on_hand, movement.item.unit)}
              </p>
            </div>
            <Field label={`Quantity ${movement.direction === 'in' ? 'received' : 'issued'}`} required>
              <Input
                type="number" step="0.01" min="0"
                value={movement.quantity}
                onChange={(e) => setMovement({ ...movement, quantity: e.target.value })}
                required
                autoFocus
              />
            </Field>
            <Field label="Date" required>
              <Input
                type="date"
                value={movement.occurred_at}
                onChange={(e) => setMovement({ ...movement, occurred_at: e.target.value })}
                required
              />
            </Field>
            <Field label="Location" required>
              <Select
                value={movement.location}
                onChange={(e) => setMovement({ ...movement, location: e.target.value })}
                required
              >
                <option value="">— Pick a location —</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
            </Field>
            <Field label="Reference">
              <Input
                value={movement.reference}
                onChange={(e) => setMovement({ ...movement, reference: e.target.value })}
                placeholder="PO ref, project code, supplier slip…"
              />
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}
