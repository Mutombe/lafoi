import React, { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Package, Plus, ArrowUp, ArrowDown, ClipboardText, MapPin, CircleNotch,
  Warning, PencilSimple,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import DataTable, { fmtMoney } from '../components/DataTable'
import Modal from '../components/Modal'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton } from '../components/FormField'
import {
  useGetItemQuery,
  useListMovementsQuery,
  useCreateMovementMutation,
  useListStockLocationsQuery,
  useListPurchaseOrdersQuery,
} from '../store/api'

const REASONS = [
  { value: 'receive', label: 'Receive (in)', sign: 1 },
  { value: 'return', label: 'Return (in)', sign: 1 },
  { value: 'issue', label: 'Issue (out)', sign: -1 },
  { value: 'sale', label: 'Sale (out)', sign: -1 },
  { value: 'transfer', label: 'Transfer (out)', sign: -1 },
  { value: 'adjust', label: 'Adjust (signed)', sign: 0 },
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

export default function InventoryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: item, isLoading } = useGetItemQuery(id)
  const { data: movementsData } = useListMovementsQuery({ item: id, page: 1, page_size: 25 })
  const { data: locData } = useListStockLocationsQuery({ page: 1, page_size: 100 })
  const { data: poData } = useListPurchaseOrdersQuery({ page: 1, page_size: 100 })

  const [createMovement, createState] = useCreateMovementMutation()
  const [movementForm, setMovementForm] = useState(null)

  const locations = locData?.results || []
  const movements = movementsData?.results || []

  // Open POs that contain this item.
  const openPOs = useMemo(() => {
    const list = poData?.results || []
    return list.filter((po) =>
      ['draft', 'sent', 'partial'].includes(po.status)
      && (po.items || []).some((line) => String(line.item) === String(id))
    )
  }, [poData, id])

  if (isLoading || !item) {
    return (
      <div className="py-20 flex items-center justify-center text-lafoi-gray-medium">
        <CircleNotch size={20} className="animate-spin mr-2" /> Loading…
      </div>
    )
  }

  const openMovementModal = (preset) => {
    const defaultLoc = locations.find((l) => l.is_default) || locations[0]
    setMovementForm({
      reason: preset || 'receive',
      quantity: 0,
      location: defaultLoc?.id || '',
      reference: '',
      notes: '',
    })
  }

  const handleSubmitMovement = async (e) => {
    e.preventDefault()
    if (!movementForm) return
    const meta = REASONS.find((r) => r.value === movementForm.reason)
    let qty = Number(movementForm.quantity) || 0
    if (!qty) {
      toast.error('Quantity must be non-zero')
      return
    }
    // Apply the sign — the form takes a positive number then we apply the
    // direction implied by reason. `adjust` lets the user pick the sign.
    if (meta?.sign === 1) qty = Math.abs(qty)
    else if (meta?.sign === -1) qty = -Math.abs(qty)

    try {
      await createMovement({
        item: item.id,
        location: movementForm.location,
        quantity: qty,
        reason: movementForm.reason,
        reference: movementForm.reference || '',
        notes: movementForm.notes || '',
      }).unwrap()
      toast.success('Movement posted', { description: `${qty > 0 ? '+' : ''}${qty} ${item.unit}` })
      setMovementForm(null)
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Could not post movement.'
      toast.error('Post failed', { description: msg })
    }
  }

  const stockColumns = [
    { key: 'location_name', label: 'Location', render: (r) => r.location_name },
    {
      key: 'quantity', label: 'On hand',
      render: (r) => <span className="tabular-nums font-sora">{Number(r.quantity).toLocaleString()} <span className="text-[11px] text-lafoi-gray-medium">{item.unit}</span></span>,
    },
  ]

  const moveColumns = [
    { key: 'occurred_at', label: 'When', priority: 'high', render: (r) => fmtDateTime(r.occurred_at) },
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
    { key: 'location_name', label: 'Location', priority: 'low', render: (r) => r.location_name || '—' },
    { key: 'reference', label: 'Ref', priority: 'low', render: (r) => r.reference || '—' },
    { key: 'performed_by_name', label: 'By', priority: 'desktop', render: (r) => r.performed_by_name || '—' },
  ]

  return (
    <div>
      <button
        onClick={() => navigate('/dashboard/inventory')}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-sora tracking-[0.18em] uppercase text-lafoi-gray-medium hover:text-lafoi-green transition-colors"
      >
        <ArrowLeft size={12} weight="bold" /> Back to inventory
      </button>

      <PageHeader
        eyebrow={item.sku}
        title={item.name}
        description={item.description || (item.barcode ? `Barcode: ${item.barcode}` : 'Stock-keeping record.')}
        actions={
          <>
            <SecondaryButton onClick={() => openMovementModal('receive')}>
              <ArrowDown size={14} weight="bold" /> Add stock
            </SecondaryButton>
            <SecondaryButton onClick={() => openMovementModal('issue')}>
              <ArrowUp size={14} weight="bold" /> Issue
            </SecondaryButton>
            <PrimaryButton onClick={() => openMovementModal('adjust')}>
              <PencilSimple size={14} weight="bold" /> Adjust
            </PrimaryButton>
          </>
        }
      />

      {/* Header strip — image + price + stat strip */}
      <div className="grid lg:grid-cols-12 gap-6 mb-8">
        {/* Image card */}
        <div className="lg:col-span-3">
          <div className="aspect-square rounded-3xl border border-lafoi-dark/10 bg-white overflow-hidden flex items-center justify-center">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <Package size={64} className="text-lafoi-gray-medium/40" />
            )}
          </div>
        </div>
        {/* Stats */}
        <div className="lg:col-span-9 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="On hand" value={`${Number(item.on_hand || 0).toLocaleString()} ${item.unit}`} accent={item.is_low_stock ? 'amber' : 'green'} sub={item.is_low_stock ? 'Below reorder threshold' : 'Healthy'} />
          <Stat label="Cost price" value={fmtMoney(item.cost_price, item.currency)} />
          <Stat label="Sale price" value={fmtMoney(item.sale_price, item.currency)} />
          <Stat label="Reorder at" value={`${Number(item.reorder_threshold || 0).toLocaleString()} ${item.unit}`} sub={`Order ${Number(item.reorder_quantity || 0).toLocaleString()} ${item.unit}`} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Stock by location + Recent movements */}
        <div className="lg:col-span-2 space-y-6">
          <Section title="Stock by location" icon={<MapPin size={14} />}>
            <DataTable
              columns={stockColumns}
              rows={item.stocks || []}
              empty="No stock recorded yet at any location."
              keyField="id"
            />
          </Section>

          <Section title="Recent movements" icon={<ClipboardText size={14} />}>
            <DataTable
              columns={moveColumns}
              rows={movements}
              empty="No movements yet."
              keyField="id"
            />
          </Section>
        </div>

        {/* Open POs sidebar */}
        <div className="lg:col-span-1">
          <Section title="Open purchase orders" icon={<ClipboardText size={14} />}>
            {openPOs.length === 0 ? (
              <p className="text-sm text-lafoi-gray-medium font-body p-4">No open POs containing this item.</p>
            ) : (
              <ul className="divide-y divide-lafoi-dark/[0.06]">
                {openPOs.map((po) => {
                  const line = (po.items || []).find((l) => String(l.item) === String(id))
                  return (
                    <li key={po.id} className="px-4 py-3">
                      <Link to={`/dashboard/inventory/purchase-orders`} className="block">
                        <p className="font-sora text-sm font-medium">{po.reference}</p>
                        <p className="text-[11px] text-lafoi-gray-medium font-sora">{po.supplier_name} · {po.status}</p>
                        {line && (
                          <p className="text-xs text-lafoi-gray mt-1 tabular-nums">
                            {Number(line.received_quantity || 0)} / {Number(line.quantity)} received
                          </p>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </Section>
        </div>
      </div>

      {/* Movement modal */}
      <Modal
        open={!!movementForm}
        onClose={() => setMovementForm(null)}
        title="Post stock movement"
        size="md"
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setMovementForm(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="movement-form" type="submit" disabled={createState.isLoading}>
              {createState.isLoading ? (<><CircleNotch size={14} className="animate-spin" /> Posting…</>) : 'Post movement'}
            </PrimaryButton>
          </>
        }
      >
        {movementForm && (
          <form id="movement-form" onSubmit={handleSubmitMovement} className="grid sm:grid-cols-2 gap-4">
            <Field label="Reason" className="sm:col-span-2">
              <Select value={movementForm.reason} onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}>
                {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </Select>
            </Field>
            <Field label="Location" required>
              <Select value={movementForm.location} onChange={(e) => setMovementForm({ ...movementForm, location: e.target.value })} required>
                <option value="">Select…</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
            </Field>
            <Field label={movementForm.reason === 'adjust' ? 'Quantity (signed)' : 'Quantity'} required hint={movementForm.reason === 'adjust' ? 'Use a negative number to decrement.' : 'Enter as a positive number — direction is set by reason.'}>
              <Input type="number" step="0.01" value={movementForm.quantity}
                onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })} required />
            </Field>
            <Field label="Reference">
              <Input value={movementForm.reference} onChange={(e) => setMovementForm({ ...movementForm, reference: e.target.value })} placeholder="PO #, project name, free text" />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea value={movementForm.notes} onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })} rows={2} />
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}

function Stat({ label, value, sub, accent = 'dark' }) {
  const accentClass = accent === 'amber'
    ? 'border-l-4 border-amber-400'
    : accent === 'green'
      ? 'border-l-4 border-lafoi-green'
      : 'border-l-4 border-lafoi-dark/15'
  return (
    <div className={`rounded-2xl bg-white border border-lafoi-dark/8 ${accentClass} px-5 py-4`}>
      <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray-medium mb-1.5">{label}</p>
      <p className="font-display font-light text-2xl text-lafoi-dark tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-lafoi-gray-medium font-sora mt-1">{sub}</p>}
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div className="rounded-2xl border border-lafoi-dark/10 bg-white shadow-[0_1px_2px_rgba(17,17,17,0.04)] overflow-hidden">
      <div className="px-4 py-3 border-b border-lafoi-dark/[0.08] flex items-center gap-2">
        {icon && <span className="text-lafoi-green">{icon}</span>}
        <p className="font-sora text-[11px] tracking-[0.22em] uppercase text-lafoi-gray-medium">{title}</p>
      </div>
      {children}
    </div>
  )
}
