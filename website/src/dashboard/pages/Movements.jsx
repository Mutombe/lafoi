import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, MagnifyingGlass, ArrowsLeftRight, CircleNotch, Package,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton } from '../components/FormField'
import useDebouncedValue from '../hooks/useDebouncedValue'
import {
  useListMovementsQuery,
  useCreateMovementMutation,
  useListItemsQuery,
  useListStockLocationsQuery,
} from '../store/api'

const REASONS = [
  { value: '', label: 'All' },
  { value: 'receive', label: 'Receive' },
  { value: 'issue', label: 'Issue' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'adjust', label: 'Adjust' },
  { value: 'sale', label: 'Sale' },
  { value: 'return', label: 'Return' },
]

const REASON_BADGE = {
  receive: 'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/40',
  return: 'bg-blue-50 text-blue-700 border-blue-200',
  issue: 'bg-amber-50 text-amber-700 border-amber-200',
  sale: 'bg-purple-50 text-purple-700 border-purple-200',
  transfer: 'bg-lafoi-gray-light text-lafoi-gray border-lafoi-dark/10',
  adjust: 'bg-red-50 text-red-700 border-red-200',
}

const fmtDateTime = (iso) => {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  } catch {
    return iso
  }
}

const empty = () => ({
  item: '', location: '', quantity: 0, reason: 'receive',
  reference: '', notes: '',
})

export default function Movements() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [itemFilter, setItemFilter] = useState('')
  const [locFilter, setLocFilter] = useState('')
  const [reasonFilter, setReasonFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [creating, setCreating] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { setPage(1) }, [debouncedSearch, itemFilter, locFilter, reasonFilter, dateFrom, dateTo])

  const queryArgs = useMemo(() => {
    const args = { page, page_size: pageSize }
    if (debouncedSearch) args.search = debouncedSearch
    if (itemFilter) args.item = itemFilter
    if (locFilter) args.location = locFilter
    if (reasonFilter) args.reason = reasonFilter
    if (dateFrom) args.occurred_at__gte = `${dateFrom}T00:00:00`
    if (dateTo) args.occurred_at__lte = `${dateTo}T23:59:59`
    return args
  }, [page, pageSize, debouncedSearch, itemFilter, locFilter, reasonFilter, dateFrom, dateTo])

  const { data, isLoading: isFirstLoad } = useListMovementsQuery(queryArgs)
  const { data: itemData } = useListItemsQuery({ page: 1, page_size: 250 })
  const { data: locData } = useListStockLocationsQuery({ page: 1, page_size: 100 })

  const [createMovement, createState] = useCreateMovementMutation()

  const items = itemData?.results || []
  const locations = locData?.results || []
  const rows = data?.results || []

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    if (!creating?.item) {
      toast.error('Pick an item')
      return
    }
    try {
      await createMovement({
        item: creating.item,
        location: creating.location,
        quantity: Number(creating.quantity) || 0,
        reason: creating.reason,
        reference: creating.reference || '',
        notes: creating.notes || '',
      }).unwrap()
      toast.success('Movement posted')
      setCreating(null)
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Could not post movement.'
      setError(msg)
      toast.error('Post failed', { description: msg })
    }
  }

  const columns = [
    { key: 'occurred_at', label: 'When', priority: 'high', render: (r) => fmtDateTime(r.occurred_at) },
    {
      key: 'item', label: 'Item', priority: 'high',
      render: (r) => (
        <Link to={`/dashboard/inventory/${r.item}`} className="block hover:text-lafoi-green">
          <p className="font-sora text-sm font-medium">{r.item_name}</p>
          <p className="text-[11px] text-lafoi-gray-medium font-sora">{r.item_sku}</p>
        </Link>
      ),
    },
    {
      key: 'reason', label: 'Reason', priority: 'medium',
      render: (r) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-sora tracking-[0.18em] uppercase ${REASON_BADGE[r.reason] || ''}`}>
          {r.reason}
        </span>
      ),
    },
    {
      key: 'quantity', label: 'Qty', priority: 'high',
      render: (r) => {
        const q = Number(r.quantity)
        return (
          <span className={`font-sora tabular-nums ${q < 0 ? 'text-amber-700' : 'text-lafoi-green-dark'}`}>
            {q > 0 ? '+' : ''}{q}
          </span>
        )
      },
    },
    { key: 'location_name', label: 'Location', priority: 'medium', render: (r) => r.location_name || '—' },
    { key: 'reference', label: 'Reference', priority: 'low', render: (r) => r.reference || '—' },
    { key: 'performed_by_name', label: 'By', priority: 'desktop', render: (r) => r.performed_by_name || '—' },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Movements"
        title="Every grain of stock that moves."
        description="Receive, issue, transfer, adjust — the audit trail behind every on-hand number on the catalogue."
        actions={
          <PrimaryButton onClick={() => setCreating({ ...empty(), location: locations.find((l) => l.is_default)?.id || '' })}>
            <Plus size={14} weight="bold" /> Post movement
          </PrimaryButton>
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
              placeholder="Search SKU, name, ref, notes"
              className="w-full pl-9 pr-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body"
            />
          </div>
        </div>
        <div className="min-w-[180px]">
          <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-1.5">Item</p>
          <select value={itemFilter} onChange={(e) => setItemFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body">
            <option value="">All items</option>
            {items.map((i) => <option key={i.id} value={i.id}>{i.sku} · {i.name}</option>)}
          </select>
        </div>
        <div className="min-w-[150px]">
          <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-1.5">Location</p>
          <select value={locFilter} onChange={(e) => setLocFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body">
            <option value="">All</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div className="min-w-[120px]">
          <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-1.5">Reason</p>
          <select value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body">
            {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-1.5">From</p>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body" />
        </div>
        <div>
          <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-1.5">To</p>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body" />
        </div>
        {(itemFilter || locFilter || reasonFilter || dateFrom || dateTo || search) && (
          <button
            onClick={() => { setItemFilter(''); setLocFilter(''); setReasonFilter(''); setDateFrom(''); setDateTo(''); setSearch('') }}
            className="px-3 py-2 text-xs font-sora tracking-[0.16em] uppercase text-lafoi-gray-medium hover:text-lafoi-green transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={isFirstLoad}
        empty="No movements yet — post one to seed the trail."
        pagination={data ? {
          count: data.count, page, pageSize,
          onPageChange: setPage,
          onPageSizeChange: (s) => { setPageSize(s); setPage(1) },
        } : null}
      />

      <Modal
        open={!!creating}
        onClose={() => setCreating(null)}
        title="Post stock movement"
        size="md"
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setCreating(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="m-form" type="submit" disabled={createState.isLoading}>
              {createState.isLoading ? (<><CircleNotch size={14} className="animate-spin" /> Posting…</>) : 'Post'}
            </PrimaryButton>
          </>
        }
      >
        {creating && (
          <form id="m-form" onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
            {error && <div className="sm:col-span-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
            <Field label="Item" required className="sm:col-span-2">
              <Select value={creating.item} onChange={(e) => setCreating({ ...creating, item: e.target.value })} required>
                <option value="">Select an item…</option>
                {items.map((i) => <option key={i.id} value={i.id}>{i.sku} · {i.name}</option>)}
              </Select>
            </Field>
            <Field label="Reason" required>
              <Select value={creating.reason} onChange={(e) => setCreating({ ...creating, reason: e.target.value })} required>
                {REASONS.filter((r) => r.value).map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </Select>
            </Field>
            <Field label="Location" required>
              <Select value={creating.location} onChange={(e) => setCreating({ ...creating, location: e.target.value })} required>
                <option value="">Select…</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
            </Field>
            <Field label="Quantity (signed)" required hint="Positive = stock in. Negative = stock out.">
              <Input type="number" step="0.01" value={creating.quantity}
                onChange={(e) => setCreating({ ...creating, quantity: e.target.value })} required />
            </Field>
            <Field label="Reference">
              <Input value={creating.reference} onChange={(e) => setCreating({ ...creating, reference: e.target.value })} />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea value={creating.notes} onChange={(e) => setCreating({ ...creating, notes: e.target.value })} rows={2} />
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}
