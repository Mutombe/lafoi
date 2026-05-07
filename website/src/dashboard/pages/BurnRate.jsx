import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChartBarHorizontal, ArrowUpRight, ArrowDownRight, Skull, CircleNotch, Package,
} from '@phosphor-icons/react'

import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import { useGetBurnRateQuery } from '../store/api'

const fmtDate = (s) => {
  if (!s) return '—'
  try {
    return new Date(s).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return s
  }
}

const WINDOWS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
]

export default function BurnRate() {
  const [days, setDays] = useState(30)
  const { data, isLoading } = useGetBurnRateQuery({ days, dead_days: 90, limit: 10 })

  const top = data?.top_movers || []
  const slow = data?.slowest || []
  const dead = data?.dead_stock || []
  const maxTop = top.reduce((m, r) => Math.max(m, Number(r.total_out) || 0), 0) || 1
  const maxSlow = slow.reduce((m, r) => Math.max(m, Number(r.total_out) || 0), 0) || 1

  const deadColumns = [
    {
      key: 'name', label: 'Item', priority: 'high',
      render: (r) => (
        <Link to={`/dashboard/inventory/${r.item}`} className="block hover:text-lafoi-green">
          <p className="font-sora text-sm font-medium">{r.name}</p>
          <p className="text-[11px] text-lafoi-gray-medium font-sora">{r.sku}</p>
        </Link>
      ),
    },
    {
      key: 'on_hand', label: 'On hand', priority: 'high',
      render: (r) => <span className="tabular-nums font-sora">{Number(r.on_hand || 0).toLocaleString()}</span>,
    },
    { key: 'last_movement_at', label: 'Last seen', priority: 'medium', render: (r) => r.last_movement_at ? fmtDate(r.last_movement_at) : 'Never' },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Burn rate"
        title="What's flying, what's parked."
        description="The pulse of the warehouse — top movers, slowest items, and stock that hasn't moved in months."
        actions={
          <div className="inline-flex rounded-full border border-lafoi-dark/12 bg-white p-0.5">
            {WINDOWS.map((w) => (
              <button
                key={w.value}
                onClick={() => setDays(w.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-sora tracking-[0.18em] uppercase transition-colors ${
                  days === w.value ? 'bg-lafoi-dark text-white' : 'text-lafoi-gray-medium hover:text-lafoi-dark'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        }
      />

      {isLoading && (
        <div className="py-20 flex items-center justify-center text-lafoi-gray-medium">
          <CircleNotch size={20} className="animate-spin mr-2" /> Loading burn rate…
        </div>
      )}

      {!isLoading && (
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <BarSection
            title={`Top movers (${days}d)`}
            icon={<ArrowUpRight size={14} weight="bold" className="text-lafoi-green" />}
            rows={top}
            max={maxTop}
            barClass="bg-lafoi-green"
            empty="No outgoing movements yet — post some issues / sales."
          />
          <BarSection
            title={`Slowest movers (${days}d)`}
            icon={<ArrowDownRight size={14} weight="bold" className="text-amber-500" />}
            rows={slow}
            max={maxSlow}
            barClass="bg-amber-300"
            empty="Not enough movement data."
          />
        </div>
      )}

      {!isLoading && (
        <div className="rounded-2xl border border-lafoi-dark/10 bg-white shadow-[0_1px_2px_rgba(17,17,17,0.04)] overflow-hidden">
          <div className="px-4 py-3 border-b border-lafoi-dark/[0.08] flex items-center gap-2">
            <Skull size={14} className="text-lafoi-gray" />
            <p className="font-sora text-[11px] tracking-[0.22em] uppercase text-lafoi-gray-medium">Dead stock (90d)</p>
            <span className="ml-auto text-[11px] text-lafoi-gray-medium font-sora">No movement in 90 days.</span>
          </div>
          <DataTable
            columns={deadColumns}
            rows={dead}
            keyField="item"
            empty="Everything's been on the move — no dead stock right now."
          />
        </div>
      )}
    </div>
  )
}

function BarSection({ title, icon, rows, max, barClass, empty }) {
  return (
    <div className="rounded-2xl border border-lafoi-dark/10 bg-white shadow-[0_1px_2px_rgba(17,17,17,0.04)] overflow-hidden">
      <div className="px-4 py-3 border-b border-lafoi-dark/[0.08] flex items-center gap-2">
        {icon}
        <p className="font-sora text-[11px] tracking-[0.22em] uppercase text-lafoi-gray-medium">{title}</p>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-lafoi-gray-medium font-body">{empty}</p>
      ) : (
        <ul className="divide-y divide-lafoi-dark/[0.04]">
          {rows.map((r) => {
            const value = Number(r.total_out) || 0
            const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0
            return (
              <li key={r.item} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <Link to={`/dashboard/inventory/${r.item}`} className="min-w-0 flex items-center gap-2 hover:text-lafoi-green">
                    <Package size={12} className="text-lafoi-gray-medium shrink-0" />
                    <span className="font-sora text-sm truncate">{r.name}</span>
                    <span className="text-[11px] text-lafoi-gray-medium font-sora shrink-0">{r.sku}</span>
                  </Link>
                  <span className="font-sora text-sm tabular-nums shrink-0">{value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="h-1.5 rounded-full bg-lafoi-cream overflow-hidden">
                  <div className={`h-full ${barClass} motion-safe:transition-[width] motion-safe:duration-700 ease-out`} style={{ width: `${pct}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
