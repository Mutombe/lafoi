import React, { useEffect, useMemo, useState } from 'react'
import {
  Plus, Trash, PencilSimple, MagnifyingGlass, CircleNotch,
  X, ArrowDown, FilePdf,
} from '@phosphor-icons/react'
import { useConfirm } from '../components/ConfirmDialog'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import DataTable, { fmtDate, fmtMoney, StatusBadge } from '../components/DataTable'
import Modal from '../components/Modal'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton } from '../components/FormField'
import useDebouncedValue from '../hooks/useDebouncedValue'
import useOptimisticListUpdate from '../hooks/useOptimisticListUpdate'
import {
  useListPurchaseOrdersQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
  useReceivePurchaseOrderMutation,
  useListSuppliersQuery,
  useListItemsQuery,
  useListStockLocationsQuery,
} from '../store/api'

const STATUS_PALETTE_PO = {
  draft: 'bg-lafoi-gray-light text-lafoi-gray border-lafoi-dark/10',
  sent: 'bg-blue-50 text-blue-700 border-blue-200',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  received: 'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/40',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

const STATUS_FILTERS = [
  { key: '', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'partial', label: 'Partial' },
  { key: 'received', label: 'Received' },
  { key: 'cancelled', label: 'Cancelled' },
]

const emptyHeader = () => ({
  supplier: '', status: 'draft', expected_date: '', notes: '',
  currency: 'USD',
})

const emptyLine = (itemId = '', unitCost = 0) => ({
  item: itemId, quantity: 1, unit_cost: unitCost, notes: '',
})

export default function PurchaseOrders() {
  const confirm = useConfirm()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [statusFilter, setStatusFilter] = useState('')

  const [editing, setEditing] = useState(null)        // {header, lines}
  const [error, setError] = useState('')
  const [receiving, setReceiving] = useState(null)    // {po, location, lines}

  useEffect(() => { setPage(1) }, [debouncedSearch, statusFilter])

  const queryArgs = useMemo(() => {
    const args = { page, page_size: pageSize }
    if (debouncedSearch) args.search = debouncedSearch
    if (statusFilter) args.status = statusFilter
    return args
  }, [page, pageSize, debouncedSearch, statusFilter])

  const { data, isLoading: isFirstLoad } = useListPurchaseOrdersQuery(queryArgs)
  const { data: supData } = useListSuppliersQuery({ page: 1, page_size: 200 })
  const { data: itemData } = useListItemsQuery({ page: 1, page_size: 250 })
  const { data: locData } = useListStockLocationsQuery({ page: 1, page_size: 100 })

  const applyOptimistic = useOptimisticListUpdate('listPurchaseOrders', queryArgs)

  const [createPO, createState] = useCreatePurchaseOrderMutation()
  const [updatePO, updateState] = useUpdatePurchaseOrderMutation()
  const [deletePO] = useDeletePurchaseOrderMutation()
  const [receivePO, receiveState] = useReceivePurchaseOrderMutation()

  const isNew = editing && !editing.id
  const saving = createState.isLoading || updateState.isLoading

  const suppliers = supData?.results || []
  const items = itemData?.results || []
  const locations = locData?.results || []
  const rows = data?.results || []

  // ----- Save header + lines together -----
  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    if (!editing.supplier) {
      setError('Pick a supplier.')
      return
    }
    if (!(editing.lines || []).length) {
      setError('Add at least one line item.')
      return
    }
    const payload = {
      supplier: editing.supplier,
      status: editing.status || 'draft',
      expected_date: editing.expected_date || null,
      notes: editing.notes || '',
      currency: editing.currency || 'USD',
      items: (editing.lines || []).map((l) => ({
        item: l.item,
        quantity: Number(l.quantity) || 0,
        unit_cost: Number(l.unit_cost) || 0,
        notes: l.notes || '',
        received_quantity: Number(l.received_quantity) || 0,
      })),
    }
    try {
      if (isNew) {
        const created = await createPO(payload).unwrap()
        toast.success('PO created', { description: created.reference })
      } else {
        const updated = await updatePO({ id: editing.id, ...payload }).unwrap()
        toast.success('PO updated', { description: updated.reference })
      }
      setEditing(null)
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Save failed.'
      setError(msg)
      toast.error('Save failed', { description: msg })
    }
  }

  const handleDelete = async (row) => {
    if (!(await confirm({ title: 'Delete purchase order?', message: `PO ${row.reference} will be removed.`, confirmLabel: 'Delete', danger: true }))) return
    try {
      await applyOptimistic(
        (draft) => {
          if (!draft?.results) return
          draft.results = draft.results.filter((r) => r.id !== row.id)
          if (typeof draft.count === 'number') draft.count = Math.max(0, draft.count - 1)
        },
        () => deletePO(row.id).unwrap(),
      )
      toast.success('PO removed', { description: row.reference })
    } catch (err) {
      const msg = err?.data?.detail || 'Delete failed.'
      toast.error('Could not delete PO', { description: msg })
    }
  }

  const startReceive = (po) => {
    const defaultLoc = locations.find((l) => l.is_default) || locations[0]
    setReceiving({
      po,
      location: defaultLoc?.id || '',
      // Pre-seed each line with the outstanding quantity (qty − already received).
      lines: (po.items || []).map((line) => ({
        po_item_id: line.id,
        item_name: line.item_name,
        item_sku: line.item_sku,
        ordered: Number(line.quantity || 0),
        already_received: Number(line.received_quantity || 0),
        receive_now: Math.max(0, Number(line.quantity || 0) - Number(line.received_quantity || 0)),
      })),
    })
  }

  const submitReceive = async (e) => {
    e.preventDefault()
    if (!receiving?.location) {
      toast.error('Pick a receiving location')
      return
    }
    const payload = {
      location: receiving.location,
      items: receiving.lines
        .filter((l) => Number(l.receive_now) > 0)
        .map((l) => ({ po_item_id: l.po_item_id, received_quantity: Number(l.receive_now) })),
    }
    if (!payload.items.length) {
      toast.error('Enter a quantity to receive on at least one line')
      return
    }
    try {
      await receivePO({ id: receiving.po.id, ...payload }).unwrap()
      toast.success('Stock received')
      setReceiving(null)
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Receive failed.'
      toast.error('Receive failed', { description: msg })
    }
  }

  // ----- Open the edit/create modal pre-populated -----
  const startEdit = (row) => {
    setEditing({
      ...row,
      supplier: row.supplier || '',
      lines: (row.items || []).map((l) => ({ ...l })),
    })
  }
  const startNew = () => {
    setEditing({ ...emptyHeader(), lines: [] })
  }

  const addLine = () => {
    setEditing((prev) => ({
      ...prev,
      lines: [...(prev.lines || []), emptyLine()],
    }))
  }
  const updateLine = (i, patch) => {
    setEditing((prev) => {
      const lines = [...(prev.lines || [])]
      lines[i] = { ...lines[i], ...patch }
      return { ...prev, lines }
    })
  }
  const removeLine = (i) => {
    setEditing((prev) => {
      const lines = [...(prev.lines || [])]
      lines.splice(i, 1)
      return { ...prev, lines }
    })
  }

  const lineTotal = (l) => (Number(l.quantity) || 0) * (Number(l.unit_cost) || 0)
  const editingTotal = useMemo(
    () => (editing?.lines || []).reduce((sum, l) => sum + lineTotal(l), 0),
    [editing?.lines],
  )

  const columns = [
    {
      key: 'reference', label: 'PO', priority: 'high',
      render: (r) => (
        <div>
          <p className="font-sora text-sm font-medium">{r.reference}</p>
          <p className="text-[11px] text-lafoi-gray-medium font-sora">{fmtDate(r.created_at)}</p>
        </div>
      ),
    },
    { key: 'supplier_name', label: 'Supplier', priority: 'high', render: (r) => r.supplier_name || '—' },
    {
      key: 'status', label: 'Status', priority: 'high',
      render: (r) => <StatusBadge status={r.status} palette={STATUS_PALETTE_PO} />,
    },
    { key: 'expected_date', label: 'Expected', priority: 'medium', render: (r) => fmtDate(r.expected_date) },
    {
      key: 'total', label: 'Total', priority: 'medium',
      render: (r) => <span className="tabular-nums font-sora">{fmtMoney(r.total, r.currency)}</span>,
    },
    {
      key: 'lines', label: 'Lines', priority: 'low',
      render: (r) => <span className="tabular-nums font-sora text-xs">{(r.items || []).length}</span>,
    },
    {
      key: 'actions', label: '', priority: 'high',
      render: (r) => (
        <div className="flex justify-end gap-1">
          {r.pdf_url && (
            <a
              href={r.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-green min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
              title="Download PDF"
            >
              <FilePdf size={14} />
            </a>
          )}
          {['sent', 'partial', 'draft'].includes(r.status) && (
            <button onClick={(e) => { e.stopPropagation(); startReceive(r) }}
              className="p-2 rounded-lg hover:bg-lafoi-green/10 text-lafoi-green min-w-[36px] min-h-[36px] inline-flex items-center justify-center" title="Receive stock">
              <ArrowDown size={14} weight="bold" />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); startEdit(r) }}
            className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark min-w-[36px] min-h-[36px] inline-flex items-center justify-center" title="Edit">
            <PencilSimple size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(r) }}
            className="p-2 rounded-lg hover:bg-red-50 text-lafoi-gray hover:text-red-600 min-w-[36px] min-h-[36px] inline-flex items-center justify-center" title="Delete">
            <Trash size={14} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Purchase Orders"
        title="What's on order from whom."
        description="Outgoing PO commitments — track them through draft, sent, partial, received."
        actions={
          <>
            <div className="relative">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lafoi-gray-medium" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search PO ref, supplier"
                className="pl-9 pr-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body w-56"
              />
            </div>
            <PrimaryButton onClick={startNew}><Plus size={14} weight="bold" /> New PO</PrimaryButton>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key || 'all'}
            onClick={() => setStatusFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-sora tracking-[0.18em] uppercase transition-colors border ${
              statusFilter === f.key
                ? 'bg-lafoi-dark text-white border-lafoi-dark'
                : 'bg-white border-lafoi-dark/10 text-lafoi-gray-medium hover:text-lafoi-dark'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={isFirstLoad}
        empty="No purchase orders yet — raise one to start."
        pagination={data ? {
          count: data.count, page, pageSize,
          onPageChange: setPage,
          onPageSizeChange: (s) => { setPageSize(s); setPage(1) },
        } : null}
      />

      {/* Edit modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={isNew ? 'New purchase order' : `Edit ${editing?.reference || ''}`}
        size="xl"
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setEditing(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="po-form" type="submit" disabled={saving}>
              {saving ? (<><CircleNotch size={14} className="animate-spin" /> Saving…</>) : 'Save'}
            </PrimaryButton>
          </>
        }
      >
        {editing && (
          <form id="po-form" onSubmit={handleSave} className="space-y-5">
            {error && <div className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Supplier" required className="lg:col-span-2">
                <Select value={editing.supplier || ''} onChange={(e) => setEditing({ ...editing, supplier: e.target.value })} required>
                  <option value="">Select supplier…</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </Field>
              <Field label="Status">
                <Select value={editing.status || 'draft'} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="partial">Partially received</option>
                  <option value="received">Received</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </Field>
              <Field label="Expected">
                <Input type="date" value={editing.expected_date || ''} onChange={(e) => setEditing({ ...editing, expected_date: e.target.value })} />
              </Field>
              <Field label="Currency">
                <Select value={editing.currency || 'USD'} onChange={(e) => setEditing({ ...editing, currency: e.target.value })}>
                  <option value="USD">USD</option>
                  <option value="ZWG">ZWG</option>
                  <option value="ZAR">ZAR</option>
                </Select>
              </Field>
              <Field label="Notes" className="lg:col-span-3">
                <Textarea rows={2} value={editing.notes || ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
              </Field>
            </div>

            {/* Line items */}
            <div className="rounded-2xl border border-lafoi-dark/10 overflow-hidden">
              <div className="px-4 py-3 border-b border-lafoi-dark/[0.08] flex items-center justify-between">
                <p className="font-sora text-[11px] tracking-[0.22em] uppercase text-lafoi-gray-medium">Line items</p>
                <button type="button" onClick={addLine}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-lafoi-cream text-lafoi-dark text-xs font-sora tracking-[0.16em] uppercase hover:bg-lafoi-green/15">
                  <Plus size={12} weight="bold" /> Add line
                </button>
              </div>
              <div className="divide-y divide-lafoi-dark/[0.06]">
                {(editing.lines || []).length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-lafoi-gray-medium font-body">No lines yet — add one.</p>
                ) : (
                  (editing.lines || []).map((l, i) => (
                    <div key={i} className="grid grid-cols-12 gap-3 px-4 py-3 items-start">
                      <div className="col-span-12 sm:col-span-5">
                        <select
                          value={l.item || ''}
                          onChange={(e) => {
                            const it = items.find((x) => String(x.id) === String(e.target.value))
                            updateLine(i, { item: e.target.value, unit_cost: it ? Number(it.cost_price || 0) : l.unit_cost })
                          }}
                          required
                          className="w-full px-3 py-2 rounded-xl bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body"
                        >
                          <option value="">Select item…</option>
                          {items.map((it) => <option key={it.id} value={it.id}>{it.sku} · {it.name}</option>)}
                        </select>
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <input type="number" step="0.01" min="0" value={l.quantity}
                          onChange={(e) => updateLine(i, { quantity: e.target.value })}
                          placeholder="Qty"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body tabular-nums" />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <input type="number" step="0.01" min="0" value={l.unit_cost}
                          onChange={(e) => updateLine(i, { unit_cost: e.target.value })}
                          placeholder="Unit cost"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body tabular-nums" />
                      </div>
                      <div className="col-span-3 sm:col-span-2 self-center text-sm font-sora tabular-nums">
                        {fmtMoney(lineTotal(l), editing.currency || 'USD')}
                      </div>
                      <button type="button" onClick={() => removeLine(i)}
                        className="col-span-1 self-center p-2 rounded-lg hover:bg-red-50 text-lafoi-gray hover:text-red-600 inline-flex items-center justify-center"
                        title="Remove line">
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-3 border-t border-lafoi-dark/[0.08] flex items-center justify-between bg-lafoi-cream/50">
                <p className="font-sora text-[11px] tracking-[0.22em] uppercase text-lafoi-gray-medium">Total</p>
                <p className="font-sora text-sm tabular-nums font-medium">{fmtMoney(editingTotal, editing.currency || 'USD')}</p>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Receive modal */}
      <Modal
        open={!!receiving}
        onClose={() => setReceiving(null)}
        title={receiving ? `Receive against ${receiving.po.reference}` : ''}
        size="lg"
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setReceiving(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="receive-form" type="submit" disabled={receiveState.isLoading}>
              {receiveState.isLoading ? (<><CircleNotch size={14} className="animate-spin" /> Receiving…</>) : 'Receive stock'}
            </PrimaryButton>
          </>
        }
      >
        {receiving && (
          <form id="receive-form" onSubmit={submitReceive} className="space-y-5">
            <Field label="Receiving location" required>
              <Select value={receiving.location} onChange={(e) => setReceiving({ ...receiving, location: e.target.value })} required>
                <option value="">Select…</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
            </Field>

            <div className="rounded-2xl border border-lafoi-dark/10 overflow-hidden">
              <div className="px-4 py-3 border-b border-lafoi-dark/[0.08]">
                <p className="font-sora text-[11px] tracking-[0.22em] uppercase text-lafoi-gray-medium">Lines</p>
              </div>
              <ul className="divide-y divide-lafoi-dark/[0.06]">
                {receiving.lines.map((l, i) => {
                  const outstanding = Math.max(0, l.ordered - l.already_received)
                  return (
                    <li key={l.po_item_id} className="px-4 py-3 grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-7">
                        <p className="font-sora text-sm">{l.item_name}</p>
                        <p className="text-[11px] text-lafoi-gray-medium font-sora tabular-nums">
                          {l.item_sku} · ordered {l.ordered} · received {l.already_received} · outstanding {outstanding}
                        </p>
                      </div>
                      <div className="col-span-5">
                        <input
                          type="number" step="0.01" min="0" max={outstanding}
                          value={l.receive_now}
                          onChange={(e) => {
                            const lines = [...receiving.lines]
                            lines[i] = { ...l, receive_now: e.target.value }
                            setReceiving({ ...receiving, lines })
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body tabular-nums"
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
