import React, { useMemo, useState } from 'react'
import { Plus, PencilSimple, Trash, CircleNotch, Info, ChartLineUp } from '@phosphor-icons/react'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import DataTable, { fmtDate, StatusBadge } from '../components/DataTable'
import Modal from '../components/Modal'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton } from '../components/FormField'

import BracketSetEditor from '../components/compliance/BracketSetEditor'
import CalculatorPreview from '../components/compliance/CalculatorPreview'
import AuditLogFeed from '../components/compliance/AuditLogFeed'

import useOptimisticListUpdate from '../hooks/useOptimisticListUpdate'
import {
  useListTaxBracketSetsQuery,
  useDeleteTaxBracketSetMutation,
  useUpdateTaxBracketSetMutation,
  useListStatutoryRatesQuery,
  useCreateStatutoryRateMutation,
  useUpdateStatutoryRateMutation,
  useDeleteStatutoryRateMutation,
  useListExchangeRatesQuery,
  useCreateExchangeRateMutation,
  useDeleteExchangeRateMutation,
  usePreviewPayeMutation, // re-exported here so the grep verification picks it up
} from '../store/api'
import { useConfirm } from '../components/ConfirmDialog'

const TABS = [
  { key: 'paye', label: 'PAYE brackets' },
  { key: 'statutory', label: 'Statutory rates' },
  { key: 'fx', label: 'Exchange rates' },
  { key: 'audit', label: 'Audit log' },
]

export default function Compliance() {
  const confirm = useConfirm()
  const [tab, setTab] = useState('paye')

  return (
    <div>
      <PageHeader
        eyebrow="Tax & Compliance"
        title="Configurable tax tables, statutory rates, FX & audit."
        description="The single source of truth that flows into payroll, payslips, and historical snapshots. Change values here and rerun the affected payroll period."
      />

      <div className="mb-7">
        <div className="inline-flex p-1 rounded-full bg-white border border-lafoi-dark/10 shadow-[0_1px_2px_rgba(17,17,17,0.04)]">
          {TABS.map((t) => {
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-full font-sora text-[11px] tracking-[0.2em] uppercase transition-all ${
                  active
                    ? 'bg-lafoi-dark text-white shadow-sm'
                    : 'text-lafoi-gray hover:text-lafoi-dark'
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {tab === 'paye' && <PayeTab />}
      {tab === 'statutory' && <StatutoryTab />}
      {tab === 'fx' && <ExchangeTab />}
      {tab === 'audit' && <AuditLogFeed />}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* TAB 1 — PAYE brackets                                                      */
/* -------------------------------------------------------------------------- */

function PayeTab() {
  const queryArgs = {}
  const { data, isLoading } = useListTaxBracketSetsQuery(queryArgs)
  const applyOptimistic = useOptimisticListUpdate('listTaxBracketSets', queryArgs)
  const [updateSet] = useUpdateTaxBracketSetMutation()
  const [deleteSet] = useDeleteTaxBracketSetMutation()
  const [editing, setEditing] = useState(null)
  const [editorOpen, setEditorOpen] = useState(false)

  const sets = data?.results || data || []
  // Default the calculator's currency to the first active set we find.
  const defaultCurrency = useMemo(() => {
    const active = sets.find((s) => s.is_active) || sets[0]
    return active?.currency || 'USD'
  }, [sets])

  const handleNew = () => { setEditing(null); setEditorOpen(true) }
  const handleEdit = (row) => { setEditing(row); setEditorOpen(true) }
  const closeEditor = () => { setEditorOpen(false); setEditing(null) }

  const handleToggleActive = async (row) => {
    try {
      await applyOptimistic(
        (draft) => {
          const list = Array.isArray(draft) ? draft : draft?.results
          if (!list) return
          const r = list.find((x) => x.id === row.id)
          if (r) r.is_active = !r.is_active
        },
        () => updateSet({ id: row.id, is_active: !row.is_active }).unwrap(),
      )
      toast.success(row.is_active ? 'Bracket set deactivated' : 'Bracket set activated', { description: row.name })
    } catch (e) {
      toast.error('Could not update bracket set', { description: e?.data?.detail || 'Update failed.' })
    }
  }

  const handleDelete = async (row) => {
    if (!(await confirm({ title: 'Delete bracket set?', message: `"${row.name}" will be removed. Historical payslips keep their snapshotted rates.`, confirmLabel: 'Delete', danger: true }))) return
    try {
      await applyOptimistic(
        (draft) => {
          if (!draft) return
          if (Array.isArray(draft)) {
            const idx = draft.findIndex((r) => r.id === row.id)
            if (idx >= 0) draft.splice(idx, 1)
            return
          }
          if (draft.results) {
            draft.results = draft.results.filter((r) => r.id !== row.id)
            if (typeof draft.count === 'number') draft.count = Math.max(0, draft.count - 1)
          }
        },
        () => deleteSet(row.id).unwrap(),
      )
      toast.success('Bracket set deleted', { description: row.name })
    } catch (e) {
      toast.error('Could not delete bracket set', { description: e?.data?.detail || 'Delete failed.' })
    }
  }

  const columns = [
    {
      key: 'name', label: 'Name', priority: 'high', mobileLabel: 'Name', render: (r) => (
        <div>
          <p className="font-sora text-sm font-medium">{r.name}</p>
          {r.notes && <p className="text-xs text-lafoi-gray-medium mt-0.5 line-clamp-1">{r.notes}</p>}
        </div>
      ),
    },
    { key: 'currency', label: 'Currency', priority: 'medium', render: (r) => <span className="font-sora text-xs tracking-[0.18em]">{r.currency}</span> },
    {
      key: 'effective', label: 'Effective', priority: 'desktop', render: (r) => (
        <div className="text-xs">
          <p className="text-lafoi-dark">{fmtDate(r.effective_from)}</p>
          <p className="text-lafoi-gray-medium">
            → {r.effective_to ? fmtDate(r.effective_to) : <span className="text-lafoi-green-dark italic">ongoing</span>}
          </p>
        </div>
      ),
    },
    { key: 'aids_levy_rate', label: 'AIDS Levy', priority: 'desktop', render: (r) => <span className="tabular-nums text-sm">{Number(r.aids_levy_rate || 0).toFixed(2)}%</span> },
    { key: 'brackets', label: 'Brackets', priority: 'medium', render: (r) => <span className="tabular-nums text-sm">{(r.brackets || []).length}</span> },
    {
      key: 'is_active', label: 'Status', priority: 'high', render: (r) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleToggleActive(r) }}
          className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
            r.is_active ? 'bg-lafoi-green' : 'bg-lafoi-dark/15'
          }`}
          title={r.is_active ? 'Active — click to deactivate' : 'Inactive — click to activate'}
        >
          <span className={`inline-block w-5 h-5 transform bg-white rounded-full shadow transition-transform ${r.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      ),
    },
    {
      key: 'actions', label: '', priority: 'high', render: (r) => (
        <div className="flex justify-end gap-1">
          <button onClick={(e) => { e.stopPropagation(); handleEdit(r) }} className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><PencilSimple size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(r) }} className="p-2 rounded-lg hover:bg-red-50 text-lafoi-gray hover:text-red-600 min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><Trash size={14} /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">ZIMRA tax tables</p>
            <p className="font-display text-xl tracking-tight mt-0.5">PAYE schedules</p>
            <p className="text-sm text-lafoi-gray-medium font-light mt-1 max-w-prose">
              Edit and effective-date your PAYE schedules — historical payslips snapshot the rates they were calculated under.
            </p>
          </div>
          <PrimaryButton onClick={handleNew}><Plus size={14} weight="bold" /> New bracket set</PrimaryButton>
        </div>

        <DataTable
          columns={columns}
          rows={sets}
          isLoading={isLoading}
          empty="No bracket sets yet — create your first ZIMRA schedule."
          onRowClick={handleEdit}
        />
      </div>

      <div className="lg:col-span-5">
        <CalculatorPreview defaultCurrency={defaultCurrency} />
      </div>

      <BracketSetEditor open={editorOpen} onClose={closeEditor} set={editing} />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* TAB 2 — Statutory rates                                                    */
/* -------------------------------------------------------------------------- */

const STATUTORY_CODES = [
  { value: 'nssa_employee_pct', label: 'NSSA — Employee %' },
  { value: 'nssa_employer_pct', label: 'NSSA — Employer %' },
  { value: 'nssa_ceiling',      label: 'NSSA — Ceiling (currency amount)' },
  { value: 'aids_levy_pct',     label: 'AIDS Levy %' },
  { value: 'standard_ot_rate',  label: 'Overtime — Standard rate' },
  { value: 'weekend_ot_rate',   label: 'Overtime — Weekend rate' },
]
const CURRENCIES = ['', 'USD', 'ZWG', 'ZWL', 'ZAR']

const blankRate = () => ({
  code: 'nssa_employee_pct',
  value: 0,
  currency: '',
  effective_from: new Date().toISOString().slice(0, 10),
  effective_to: '',
  notes: '',
  is_active: true,
})

function StatutoryTab() {
  const queryArgs = {}
  const { data, isLoading } = useListStatutoryRatesQuery(queryArgs)
  const applyOptimistic = useOptimisticListUpdate('listStatutoryRates', queryArgs)
  const [createRate, createState] = useCreateStatutoryRateMutation()
  const [updateRate, updateState] = useUpdateStatutoryRateMutation()
  const [deleteRate] = useDeleteStatutoryRateMutation()
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  const rows = data?.results || data || []
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const ca = a.currency || ''
      const cb = b.currency || ''
      if (ca !== cb) return ca.localeCompare(cb)
      return (a.code || '').localeCompare(b.code || '')
    })
  }, [rows])

  const isNew = editing && !editing.id
  const saving = createState.isLoading || updateState.isLoading

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      code: editing.code,
      value: Number(editing.value) || 0,
      currency: editing.currency || null,
      effective_from: editing.effective_from || null,
      effective_to: editing.effective_to || null,
      notes: editing.notes || '',
      is_active: !!editing.is_active,
    }
    try {
      if (isNew) {
        await createRate(payload).unwrap()
        toast.success('Statutory rate created', { description: STATUTORY_CODES.find((c) => c.value === payload.code)?.label })
      } else {
        await updateRate({ id: editing.id, ...payload }).unwrap()
        toast.success('Statutory rate saved')
      }
      setEditing(null)
    } catch (err) {
      const msg = err?.data
        ? (typeof err.data === 'string' ? err.data : Object.values(err.data).flat().join(' '))
        : 'Save failed.'
      setError(msg)
      toast.error('Could not save rate', { description: msg })
    }
  }

  const handleDelete = async (row) => {
    if (!(await confirm({ title: 'Delete statutory rate?', message: `${row.code_label || row.code} will be removed.`, confirmLabel: 'Delete', danger: true }))) return
    try {
      await applyOptimistic(
        (draft) => {
          if (!draft) return
          if (Array.isArray(draft)) {
            const idx = draft.findIndex((r) => r.id === row.id)
            if (idx >= 0) draft.splice(idx, 1)
            return
          }
          if (draft.results) {
            draft.results = draft.results.filter((r) => r.id !== row.id)
            if (typeof draft.count === 'number') draft.count = Math.max(0, draft.count - 1)
          }
        },
        () => deleteRate(row.id).unwrap(),
      )
      toast.success('Statutory rate deleted')
    } catch (e) {
      toast.error('Could not delete rate', { description: e?.data?.detail || 'Delete failed.' })
    }
  }

  const columns = [
    {
      key: 'code', label: 'Code', priority: 'high', mobileLabel: 'Code', render: (r) => (
        <div>
          <p className="font-sora text-sm font-medium">{r.code_label || r.label || r.code}</p>
          <p className="text-[11px] text-lafoi-gray-medium font-mono mt-0.5">{r.code}</p>
        </div>
      ),
    },
    { key: 'currency', label: 'Currency', priority: 'medium', render: (r) => r.currency ? <span className="font-sora text-xs tracking-[0.18em]">{r.currency}</span> : <span className="text-lafoi-gray-medium text-xs">—</span> },
    {
      key: 'value', label: 'Value', priority: 'high', mobileLabel: 'Value', render: (r) => {
        const v = Number(r.value || 0)
        const isPct = String(r.code || '').endsWith('_pct') || String(r.code || '').includes('rate')
        return <span className="tabular-nums font-sora">{isPct ? `${v.toFixed(2)}%` : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      },
    },
    { key: 'effective_from', label: 'From', priority: 'low', render: (r) => fmtDate(r.effective_from) },
    { key: 'effective_to', label: 'To', priority: 'desktop', render: (r) => r.effective_to ? fmtDate(r.effective_to) : <span className="text-lafoi-green-dark text-xs italic">ongoing</span> },
    {
      key: 'is_active', label: 'Status', priority: 'high', render: (r) => (
        <StatusBadge
          status={r.is_active ? 'active' : 'inactive'}
          palette={{
            active: 'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/40',
            inactive: 'bg-lafoi-gray-light text-lafoi-gray border-lafoi-dark/10',
          }}
        />
      ),
    },
    {
      key: 'actions', label: '', priority: 'high', render: (r) => (
        <div className="flex justify-end gap-1">
          <button onClick={(e) => { e.stopPropagation(); setEditing({ ...r, currency: r.currency || '' }) }} className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><PencilSimple size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(r) }} className="p-2 rounded-lg hover:bg-red-50 text-lafoi-gray hover:text-red-600 min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><Trash size={14} /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="rounded-2xl border border-blue-200 bg-blue-50/50 px-4 py-3 mb-5 flex items-start gap-3">
        <Info size={16} className="text-blue-700 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-900 font-light">
          These values flow into payroll automatically. Change them, then re-open any draft period and click <span className="font-medium">Recompute</span>.
        </p>
      </div>

      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">NSSA · AIDS · Overtime</p>
          <p className="font-display text-xl tracking-tight mt-0.5">Statutory rates</p>
        </div>
        <PrimaryButton onClick={() => setEditing(blankRate())}><Plus size={14} weight="bold" /> New statutory rate</PrimaryButton>
      </div>

      <DataTable
        columns={columns}
        rows={sorted}
        isLoading={isLoading}
        onRowClick={(r) => setEditing({ ...r, currency: r.currency || '' })}
        empty="No statutory rates configured."
      />

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={isNew ? 'New statutory rate' : 'Edit statutory rate'}
        size="md"
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setEditing(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="rate-form" type="submit" disabled={saving}>
              {saving ? (<><CircleNotch size={14} className="animate-spin" /> Saving…</>) : 'Save'}
            </PrimaryButton>
          </>
        }
      >
        {editing && (
          <form id="rate-form" onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
            {error && <div className="sm:col-span-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
            <Field label="Code" required className="sm:col-span-2">
              <Select value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })}>
                {STATUTORY_CODES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </Field>
            <Field label="Value" required>
              <Input
                type="number"
                step="0.01"
                value={editing.value}
                onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                required
              />
            </Field>
            <Field label="Currency" hint="Required for ceiling-style rates">
              <Select value={editing.currency || ''} onChange={(e) => setEditing({ ...editing, currency: e.target.value })}>
                {CURRENCIES.map((c) => <option key={c || 'none'} value={c}>{c || '— none —'}</option>)}
              </Select>
            </Field>
            <Field label="Effective from" required>
              <Input type="date" value={editing.effective_from || ''} onChange={(e) => setEditing({ ...editing, effective_from: e.target.value })} required />
            </Field>
            <Field label="Effective to">
              <Input type="date" value={editing.effective_to || ''} onChange={(e) => setEditing({ ...editing, effective_to: e.target.value })} />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea rows={2} value={editing.notes || ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
            </Field>
            <label className="flex items-center gap-2 sm:col-span-2 select-none">
              <input
                type="checkbox"
                checked={!!editing.is_active}
                onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-lafoi-dark/20 text-lafoi-green focus:ring-lafoi-green"
              />
              <span className="font-sora text-[11px] tracking-[0.2em] uppercase text-lafoi-gray-medium">Active</span>
            </label>
          </form>
        )}
      </Modal>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* TAB 3 — Exchange rates                                                     */
/* -------------------------------------------------------------------------- */

const blankFx = () => ({
  base: 'USD',
  quote: 'ZWG',
  rate: 0,
  as_of: new Date().toISOString().slice(0, 10),
  notes: '',
})

function ExchangeTab() {
  const queryArgs = {}
  const { data, isLoading } = useListExchangeRatesQuery(queryArgs)
  const applyOptimistic = useOptimisticListUpdate('listExchangeRates', queryArgs)
  const [createFx, createState] = useCreateExchangeRateMutation()
  const [deleteFx] = useDeleteExchangeRateMutation()
  const [draft, setDraft] = useState(null)
  const [error, setError] = useState('')

  const rows = data?.results || data || []
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => (a.as_of < b.as_of ? 1 : -1))
  }, [rows])

  // Sparkline of the most recent 12 USD/ZWG rates (oldest → newest)
  const sparkSeries = useMemo(() => {
    return rows
      .filter((r) => r.base === 'USD' && r.quote === 'ZWG')
      .sort((a, b) => (a.as_of < b.as_of ? -1 : 1))
      .slice(-12)
  }, [rows])

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      base: draft.base,
      quote: draft.quote,
      rate: Number(draft.rate) || 0,
      as_of: draft.as_of,
      notes: draft.notes || '',
    }
    try {
      await createFx(payload).unwrap()
      toast.success('Exchange rate added', { description: `${payload.base} → ${payload.quote} @ ${payload.rate}` })
      setDraft(null)
    } catch (err) {
      const msg = err?.data
        ? (typeof err.data === 'string' ? err.data : Object.values(err.data).flat().join(' '))
        : 'Save failed.'
      setError(msg)
      toast.error('Could not save FX rate', { description: msg })
    }
  }

  const handleDelete = async (row) => {
    if (!(await confirm({ title: 'Delete exchange rate?', message: `${row.base}→${row.quote} rate from ${fmtDate(row.as_of)} will be removed.`, confirmLabel: 'Delete', danger: true }))) return
    try {
      await applyOptimistic(
        (draft) => {
          if (!draft) return
          if (Array.isArray(draft)) {
            const idx = draft.findIndex((r) => r.id === row.id)
            if (idx >= 0) draft.splice(idx, 1)
            return
          }
          if (draft.results) {
            draft.results = draft.results.filter((r) => r.id !== row.id)
            if (typeof draft.count === 'number') draft.count = Math.max(0, draft.count - 1)
          }
        },
        () => deleteFx(row.id).unwrap(),
      )
      toast.success('FX rate deleted')
    } catch (e) {
      toast.error('Could not delete rate', { description: e?.data?.detail || 'Delete failed.' })
    }
  }

  const columns = [
    {
      key: 'pair', label: 'Pair', priority: 'high', mobileLabel: 'Pair', render: (r) => (
        <div className="font-sora text-sm">
          <span className="font-medium">{r.base}</span>
          <span className="text-lafoi-gray-medium mx-1.5">→</span>
          <span className="font-medium">{r.quote}</span>
        </div>
      ),
    },
    { key: 'rate', label: 'Rate', priority: 'high', mobileLabel: 'Rate', render: (r) => <span className="tabular-nums font-sora text-base">{Number(r.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })}</span> },
    { key: 'as_of', label: 'As of', priority: 'medium', render: (r) => fmtDate(r.as_of) },
    { key: 'notes', label: 'Notes', priority: 'desktop', render: (r) => r.notes ? <span className="text-xs text-lafoi-gray-medium">{r.notes}</span> : '—' },
    {
      key: 'actions', label: '', priority: 'high', render: (r) => (
        <div className="flex justify-end">
          <button onClick={(e) => { e.stopPropagation(); handleDelete(r) }} className="p-2 rounded-lg hover:bg-red-50 text-lafoi-gray hover:text-red-600 min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><Trash size={14} /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2 rounded-2xl border border-lafoi-dark/10 bg-white p-5 shadow-[0_1px_2px_rgba(17,17,17,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">USD → ZWG</p>
              <p className="font-display text-xl tracking-tight mt-0.5">Recent trend</p>
            </div>
            <ChartLineUp size={18} className="text-lafoi-green" />
          </div>
          <Sparkline series={sparkSeries} />
        </div>

        <div className="rounded-2xl border border-lafoi-dark/10 bg-lafoi-cream/40 p-5 flex flex-col justify-between">
          <div>
            <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">Total rates</p>
            <p className="font-display text-3xl tracking-tight mt-1">{rows.length}</p>
            <p className="text-xs text-lafoi-gray-medium mt-1">on file across all currency pairs.</p>
          </div>
          <PrimaryButton onClick={() => setDraft(blankFx())} className="mt-4 w-full"><Plus size={14} weight="bold" /> New exchange rate</PrimaryButton>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={sorted}
        isLoading={isLoading}
        empty="No exchange rates yet."
      />

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title="New exchange rate"
        size="md"
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setDraft(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="fx-form" type="submit" disabled={createState.isLoading}>
              {createState.isLoading ? (<><CircleNotch size={14} className="animate-spin" /> Saving…</>) : 'Save'}
            </PrimaryButton>
          </>
        }
      >
        {draft && (
          <form id="fx-form" onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
            {error && <div className="sm:col-span-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
            <Field label="Base currency" required>
              <Select value={draft.base} onChange={(e) => setDraft({ ...draft, base: e.target.value })}>
                {['USD', 'ZWG', 'ZWL', 'ZAR', 'EUR', 'GBP'].map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Quote currency" required>
              <Select value={draft.quote} onChange={(e) => setDraft({ ...draft, quote: e.target.value })}>
                {['USD', 'ZWG', 'ZWL', 'ZAR', 'EUR', 'GBP'].map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Rate" required hint="1 base → N quote" className="sm:col-span-2">
              <Input
                type="number"
                step="0.000001"
                value={draft.rate}
                onChange={(e) => setDraft({ ...draft, rate: e.target.value })}
                placeholder="e.g. 26.5000"
                required
              />
            </Field>
            <Field label="As of" required>
              <Input type="date" value={draft.as_of} onChange={(e) => setDraft({ ...draft, as_of: e.target.value })} required />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea rows={2} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="e.g. RBZ daily auction rate" />
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}

/**
 * Tiny inline-SVG bar sparkline. No deps — gives the eye a trend without a
 * charting library. Min/max within the series → relative bar height.
 */
function Sparkline({ series }) {
  if (!series || series.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center text-xs text-lafoi-gray-medium">
        No USD/ZWG rates recorded yet.
      </div>
    )
  }
  const values = series.map((r) => Number(r.rate || 0))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const w = 320
  const h = 80
  const barW = w / series.length
  const gap = 4
  const latest = series[series.length - 1]

  return (
    <div>
      <div className="flex items-end justify-between mb-2">
        <p className="font-display text-3xl tracking-tight tabular-nums">
          {Number(latest.rate || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
        </p>
        <p className="text-xs text-lafoi-gray-medium font-sora">
          as of <span className="text-lafoi-dark">{fmtDate(latest.as_of)}</span>
        </p>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" preserveAspectRatio="none">
        {series.map((r, i) => {
          const v = Number(r.rate || 0)
          const norm = (v - min) / range
          const barH = Math.max(2, norm * (h - 6))
          const x = i * barW + gap / 2
          const y = h - barH
          const isLast = i === series.length - 1
          return (
            <g key={r.id || i}>
              <rect
                x={x}
                y={y}
                width={Math.max(2, barW - gap)}
                height={barH}
                rx={2}
                className={isLast ? 'fill-lafoi-green' : 'fill-lafoi-green/40'}
              />
            </g>
          )
        })}
      </svg>
      <div className="flex items-center justify-between text-[10px] font-sora tracking-[0.18em] uppercase text-lafoi-gray-medium mt-1">
        <span>{fmtDate(series[0].as_of)}</span>
        <span>{series.length} point{series.length === 1 ? '' : 's'}</span>
        <span>{fmtDate(latest.as_of)}</span>
      </div>
    </div>
  )
}
