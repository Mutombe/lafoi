import React, { useEffect, useMemo, useState } from 'react'
import {
  Plus, Trash, PencilSimple, CircleNotch, BellRinging,
  PaperPlaneTilt, EnvelopeSimple, WhatsappLogo, Bell,
  Warning,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import DataTable, { StatusBadge } from '../components/DataTable'
import Modal from '../components/Modal'
import { Field, Input, Select, PrimaryButton, SecondaryButton } from '../components/FormField'
import {
  useListNotificationRulesQuery,
  useCreateNotificationRuleMutation,
  useUpdateNotificationRuleMutation,
  useDeleteNotificationRuleMutation,
  useTestNotificationRuleMutation,
  useListNotificationsQuery,
  useListItemsQuery,
} from '../store/api'

const EVENTS = [
  { value: 'low_stock', label: 'Low stock' },
  { value: 'po_received', label: 'PO received' },
  { value: 'po_overdue', label: 'PO overdue' },
]

const CHANNELS = [
  { value: 'email', label: 'Email', icon: EnvelopeSimple },
  { value: 'whatsapp', label: 'WhatsApp', icon: WhatsappLogo },
  { value: 'inapp', label: 'In-app', icon: Bell },
]

const STATUS_PALETTE_NOTIF = {
  pending: 'bg-lafoi-gray-light text-lafoi-gray border-lafoi-dark/10',
  sent: 'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/40',
  failed: 'bg-red-50 text-red-700 border-red-200',
  skipped: 'bg-amber-50 text-amber-700 border-amber-200',
}

const emptyRule = () => ({
  name: '',
  event: 'low_stock',
  channel: 'email',
  recipient_email: '',
  recipient_phone: '',
  is_active: true,
  notes: '',
})

const fmtDateTime = (iso) => {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  } catch { return iso }
}

export default function InventoryNotifications() {
  // ----- Rules -----
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  const { data: rulesData, isLoading: rulesLoading } = useListNotificationRulesQuery({ page: 1, page_size: 100 })
  const [createRule, createState] = useCreateNotificationRuleMutation()
  const [updateRule, updateState] = useUpdateNotificationRuleMutation()
  const [deleteRule] = useDeleteNotificationRuleMutation()
  const [testRule, testState] = useTestNotificationRuleMutation()

  const rules = rulesData?.results || []
  const isNew = editing && !editing.id
  const saving = createState.isLoading || updateState.isLoading

  // ----- History -----
  const [eventFilter, setEventFilter] = useState('')
  const [channelFilter, setChannelFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [itemFilter, setItemFilter] = useState('')
  const [historyPage, setHistoryPage] = useState(1)
  const historyArgs = useMemo(() => {
    const args = { page: historyPage, page_size: 100 }
    if (eventFilter) args.event = eventFilter
    if (channelFilter) args.channel = channelFilter
    if (statusFilter) args.status = statusFilter
    if (itemFilter) args.item = itemFilter
    return args
  }, [historyPage, eventFilter, channelFilter, statusFilter, itemFilter])
  useEffect(() => { setHistoryPage(1) }, [eventFilter, channelFilter, statusFilter, itemFilter])

  const { data: historyData, isLoading: historyLoading } = useListNotificationsQuery(historyArgs)
  const { data: itemsData } = useListItemsQuery({ page: 1, page_size: 250 })

  const history = historyData?.results || []
  const items = itemsData?.results || []

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    if (!editing.name?.trim()) {
      setError('Name is required')
      return
    }
    if (editing.channel === 'email' && !editing.recipient_email) {
      setError('Email channel needs a recipient email')
      return
    }
    if (editing.channel === 'whatsapp' && !editing.recipient_phone) {
      setError('WhatsApp channel needs a recipient phone (E.164: +263…)')
      return
    }
    const payload = {
      name: editing.name.trim(),
      event: editing.event,
      channel: editing.channel,
      recipient_email: editing.recipient_email || '',
      recipient_phone: editing.recipient_phone || '',
      is_active: editing.is_active !== false,
      notes: editing.notes || '',
    }
    try {
      if (isNew) {
        await createRule(payload).unwrap()
        toast.success('Rule added')
      } else {
        await updateRule({ id: editing.id, ...payload }).unwrap()
        toast.success('Rule updated')
      }
      setEditing(null)
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Save failed'
      setError(msg)
      toast.error('Save failed', { description: msg })
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete rule "${row.name}"? Past notifications will keep their record.`)) return
    try {
      await deleteRule(row.id).unwrap()
      toast.success('Rule removed')
    } catch (err) {
      toast.error('Delete failed', { description: err?.data?.detail || String(err) })
    }
  }

  const handleTest = async (row) => {
    try {
      const notif = await testRule(row.id).unwrap()
      if (notif.status === 'sent') {
        toast.success('Test sent', { description: `${row.channel} → ${notif.recipient}` })
      } else if (notif.status === 'failed') {
        toast.error('Test failed', { description: notif.error || 'Channel not configured' })
      } else {
        toast.message('Test recorded', { description: `Status: ${notif.status}` })
      }
    } catch (err) {
      toast.error('Test failed', { description: err?.data?.detail || String(err) })
    }
  }

  const ruleColumns = [
    {
      key: 'name', label: 'Name', priority: 'high',
      render: (r) => (
        <div>
          <p className="font-sora text-sm font-medium">{r.name}</p>
          {r.notes && <p className="text-[11px] text-lafoi-gray-medium">{r.notes}</p>}
        </div>
      ),
    },
    {
      key: 'event', label: 'Event', priority: 'high',
      render: (r) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-lafoi-cream border border-lafoi-dark/10 text-[10px] font-sora tracking-[0.18em] uppercase">
          {r.event_label || r.event}
        </span>
      ),
    },
    {
      key: 'channel', label: 'Channel', priority: 'medium',
      render: (r) => {
        const ch = CHANNELS.find((c) => c.value === r.channel)
        const Icon = ch?.icon || Bell
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-sora">
            <Icon size={14} weight="regular" className="text-lafoi-green" />
            {r.channel_label || r.channel}
          </span>
        )
      },
    },
    {
      key: 'recipient', label: 'Recipient', priority: 'medium',
      render: (r) => <span className="font-sora text-xs">{r.recipient || <span className="text-lafoi-gray-medium">—</span>}</span>,
    },
    {
      key: 'is_active', label: 'Active', priority: 'low',
      render: (r) => (
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${r.is_active ? 'bg-lafoi-green' : 'bg-lafoi-gray-medium/40'}`} />
      ),
    },
    {
      key: 'actions', label: '', priority: 'high',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleTest(r) }}
            disabled={testState.isLoading}
            className="p-2 rounded-lg hover:bg-lafoi-green/10 text-lafoi-green min-w-[36px] min-h-[36px] inline-flex items-center justify-center disabled:opacity-50"
            title="Send test"
          >
            <PaperPlaneTilt size={14} />
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

  const historyColumns = [
    { key: 'created_at', label: 'When', priority: 'high', render: (r) => fmtDateTime(r.created_at) },
    {
      key: 'event', label: 'Event', priority: 'high',
      render: (r) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-lafoi-cream border border-lafoi-dark/10 text-[10px] font-sora tracking-[0.18em] uppercase">
          {r.event}
        </span>
      ),
    },
    {
      key: 'channel', label: 'Channel', priority: 'medium',
      render: (r) => {
        const ch = CHANNELS.find((c) => c.value === r.channel)
        const Icon = ch?.icon || Bell
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-sora">
            <Icon size={13} weight="regular" className="text-lafoi-green" />
            {r.channel}
          </span>
        )
      },
    },
    { key: 'recipient', label: 'Recipient', priority: 'medium', render: (r) => r.recipient || '—' },
    {
      key: 'item', label: 'Item', priority: 'low',
      render: (r) => r.item_sku ? <span className="text-xs font-sora">{r.item_sku} · {r.item_name}</span> : <span className="text-lafoi-gray-medium">—</span>,
    },
    {
      key: 'status', label: 'Status', priority: 'high',
      render: (r) => <StatusBadge status={r.status} palette={STATUS_PALETTE_NOTIF} />,
    },
    {
      key: 'error', label: 'Error', priority: 'desktop',
      render: (r) => r.error ? <span className="text-[11px] text-red-700 font-sora">{r.error}</span> : <span className="text-lafoi-gray-medium">—</span>,
    },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Notifications"
        title="Who hears about what."
        description="Distribution rules for inventory events, plus a complete audit trail of every send attempt."
        actions={
          <PrimaryButton onClick={() => setEditing({ ...emptyRule() })}>
            <Plus size={14} weight="bold" /> New rule
          </PrimaryButton>
        }
      />

      {/* Distribution rules */}
      <Section title="Distribution rules" icon={<BellRinging size={14} />}>
        <DataTable
          columns={ruleColumns}
          rows={rules}
          isLoading={rulesLoading}
          empty="No rules yet — add one to start receiving low-stock alerts."
          keyField="id"
        />
      </Section>

      <div className="h-8" />

      {/* Alert history */}
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <div className="min-w-[140px]">
          <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-1.5">Event</p>
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body"
          >
            <option value="">All events</option>
            {EVENTS.map((ev) => <option key={ev.value} value={ev.value}>{ev.label}</option>)}
            <option value="test">Test</option>
          </select>
        </div>
        <div className="min-w-[140px]">
          <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-1.5">Channel</p>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body"
          >
            <option value="">All</option>
            {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="min-w-[140px]">
          <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-1.5">Status</p>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>
        <div className="min-w-[200px] flex-1 max-w-xs">
          <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-1.5">Item</p>
          <select
            value={itemFilter}
            onChange={(e) => setItemFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body"
          >
            <option value="">All items</option>
            {items.map((it) => <option key={it.id} value={it.id}>{it.sku} · {it.name}</option>)}
          </select>
        </div>
        {(eventFilter || channelFilter || statusFilter || itemFilter) && (
          <button
            onClick={() => { setEventFilter(''); setChannelFilter(''); setStatusFilter(''); setItemFilter('') }}
            className="px-3 py-2 text-xs font-sora tracking-[0.16em] uppercase text-lafoi-gray-medium hover:text-lafoi-green transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <Section title="Alert history" icon={<Warning size={14} />}>
        <DataTable
          columns={historyColumns}
          rows={history}
          isLoading={historyLoading}
          empty="No alerts have been dispatched yet."
          keyField="id"
          pagination={historyData ? {
            count: historyData.count,
            page: historyPage,
            pageSize: 100,
            onPageChange: setHistoryPage,
          } : null}
        />
      </Section>

      {/* Edit / new rule modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={isNew ? 'New notification rule' : `Edit ${editing?.name || ''}`}
        size="md"
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setEditing(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="notif-form" type="submit" disabled={saving}>
              {saving ? (<><CircleNotch size={14} className="animate-spin" /> Saving…</>) : 'Save'}
            </PrimaryButton>
          </>
        }
      >
        {editing && (
          <form id="notif-form" onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
            {error && <div className="sm:col-span-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
            <Field label="Name" required className="sm:col-span-2">
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required placeholder="e.g. Ops mailbox" />
            </Field>
            <Field label="Event">
              <Select value={editing.event} onChange={(e) => setEditing({ ...editing, event: e.target.value })}>
                {EVENTS.map((ev) => <option key={ev.value} value={ev.value}>{ev.label}</option>)}
              </Select>
            </Field>
            <Field label="Channel">
              <Select value={editing.channel} onChange={(e) => setEditing({ ...editing, channel: e.target.value })}>
                {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </Field>
            {editing.channel === 'email' && (
              <Field label="Recipient email" required className="sm:col-span-2">
                <Input type="email" value={editing.recipient_email}
                  onChange={(e) => setEditing({ ...editing, recipient_email: e.target.value })}
                  placeholder="ops@example.com" required />
              </Field>
            )}
            {editing.channel === 'whatsapp' && (
              <Field label="Recipient phone (E.164)" required hint="e.g. +263772123456" className="sm:col-span-2">
                <Input value={editing.recipient_phone}
                  onChange={(e) => setEditing({ ...editing, recipient_phone: e.target.value })}
                  placeholder="+263…" required />
              </Field>
            )}
            <Field label="Notes" className="sm:col-span-2">
              <Input value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} placeholder="Optional internal note" />
            </Field>
            <Field label="Status">
              <Select value={editing.is_active ? 'true' : 'false'}
                onChange={(e) => setEditing({ ...editing, is_active: e.target.value === 'true' })}>
                <option value="true">Active</option>
                <option value="false">Paused</option>
              </Select>
            </Field>
          </form>
        )}
      </Modal>
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
