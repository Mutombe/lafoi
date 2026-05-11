import React, { useState, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash, UploadSimple, FileText, Image as ImageIcon,
  Calendar, Plus as PlusIcon, CircleNotch, CheckCircle, Circle,
  Clock, MapPin, CurrencyDollar, Ruler, PencilSimple, PaintBrush,
} from '@phosphor-icons/react'
import { useConfirm } from '../components/ConfirmDialog'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import DataTable, { fmtDate, fmtMoney, StatusBadge, STATUS_PALETTE_PROJECT } from '../components/DataTable'
import Modal from '../components/Modal'
import Skeleton, { SkeletonStat, SkeletonPageHeader } from '../components/Skeleton'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton, DangerButton } from '../components/FormField'
import DrawingCanvas from '../components/DrawingCanvas'
import {
  useGetProjectQuery,
  useCreateProjectUpdateMutation,
  useUploadProjectFileMutation,
  useDeleteProjectFileMutation,
} from '../store/api'

/* ============================================================================
   Helpers
   ========================================================================= */

const STATUS_PIPELINE = ['lead', 'quoted', 'approved', 'in_progress', 'on_hold', 'completed', 'cancelled']
const STATUS_LABEL = {
  lead: 'Lead', quoted: 'Quoted', approved: 'Approved', in_progress: 'In progress',
  on_hold: 'On hold', completed: 'Completed', cancelled: 'Cancelled',
}

// dot colours that pair with the existing STATUS_PALETTE_PROJECT pill colours.
const STATUS_DOT = {
  lead: '#9CA3AF',
  quoted: '#D97706',
  approved: '#2563EB',
  in_progress: '#1A8A2E',
  on_hold: '#9333EA',
  completed: '#15572E',
  cancelled: '#DC2626',
}

const isImageFile = (f) =>
  f.kind === 'photo' || /\.(png|jpe?g|webp|gif|avif)$/i.test(f.file_name || f.file || '')

const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000)

// Cost-category palette: aligns with brief
const COST_CATEGORY_PALETTE = {
  materials: { pill: 'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/30', hex: '#1A8A2E' },
  labour: { pill: 'bg-blue-50 text-blue-700 border-blue-200', hex: '#2563EB' },
  transport: { pill: 'bg-amber-50 text-amber-700 border-amber-200', hex: '#D97706' },
  permits: { pill: 'bg-purple-50 text-purple-700 border-purple-200', hex: '#9333EA' },
  equipment: { pill: 'bg-teal-50 text-teal-700 border-teal-200', hex: '#0D9488' },
  subcontract: { pill: 'bg-indigo-50 text-indigo-700 border-indigo-200', hex: '#4F46E5' },
  overhead: { pill: 'bg-lafoi-gray-light text-lafoi-gray border-lafoi-dark/10', hex: '#6B7280' },
  other: { pill: 'bg-lafoi-gray-light text-lafoi-gray border-lafoi-dark/10', hex: '#9CA3AF' },
}

const COST_CATEGORIES = ['materials', 'labour', 'transport', 'permits', 'equipment', 'subcontract', 'overhead', 'other']

/* ============================================================================
   ProgressRing — animated SVG donut with hairline ticks at 25/50/75%
   ========================================================================= */

function ProgressRing({ percent = 0, size = 160, stroke = 16 }) {
  const safe = Math.max(0, Math.min(100, percent))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (safe / 100) * c
  const cx = size / 2
  const cy = size / 2

  // hairline tick marks at 25%, 50%, 75% positions (top is 0%)
  const ticks = [25, 50, 75].map((p) => {
    const angle = (p / 100) * Math.PI * 2 - Math.PI / 2
    const tickInner = r - stroke / 2 - 4
    const tickOuter = r - stroke / 2 - 1
    return {
      x1: cx + Math.cos(angle) * tickInner,
      y1: cy + Math.sin(angle) * tickInner,
      x2: cx + Math.cos(angle) * tickOuter,
      y2: cy + Math.sin(angle) * tickOuter,
    }
  })

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="rgba(17,17,17,0.08)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Animated arc */}
        <motion.circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="var(--color-lafoi-green-light)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      {/* Tick marks (rendered upright) */}
      <svg width={size} height={size} className="absolute inset-0 pointer-events-none">
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke="rgba(17,17,17,0.25)" strokeWidth="1"
          />
        ))}
      </svg>
      {/* Inner label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-display text-3xl text-lafoi-dark leading-none"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {Math.round(safe)}%
        </motion.span>
        <span className="mt-1 font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">
          complete
        </span>
      </div>
    </div>
  )
}

/* ============================================================================
   ScheduleGauge — horizontal lifespan bar with current-day marker
   ========================================================================= */

function ScheduleGauge({ start, target, today = new Date() }) {
  if (!start || !target) {
    return (
      <div className="h-full flex flex-col items-start justify-center">
        <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">Schedule</p>
        <p className="mt-2 font-display text-xl text-lafoi-dark">Schedule pending</p>
        <p className="mt-1 text-xs text-lafoi-gray-medium">Set start &amp; target dates to enable the gauge.</p>
      </div>
    )
  }

  const startD = new Date(start)
  const targetD = new Date(target)
  const total = Math.max(1, daysBetween(startD, targetD))
  const elapsed = daysBetween(startD, today)
  const remaining = total - elapsed
  const overdue = remaining < 0
  const pct = Math.max(0, Math.min(100, (elapsed / total) * 100))

  return (
    <div className="h-full flex flex-col">
      <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">Schedule</p>
      <p className="mt-2 font-display text-xl text-lafoi-dark">
        Day {Math.max(0, Math.min(total, elapsed))} <span className="text-lafoi-gray-medium">/ {total}</span>
      </p>

      <div className="relative mt-6 h-2 rounded-full bg-lafoi-dark/8 overflow-visible">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-lafoi-green-light"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
        {/* Current day marker */}
        <motion.div
          className="absolute -top-1.5 w-5 h-5 rounded-full bg-lafoi-green border-[3px] border-white shadow-[0_0_0_2px_rgba(26,138,46,0.25)]"
          initial={{ left: 0, opacity: 0 }}
          animate={{ left: `calc(${pct}% - 10px)`, opacity: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] tracking-[0.2em] uppercase font-sora text-lafoi-gray-medium">
        <span>{fmtDate(start)}</span>
        <span>{fmtDate(target)}</span>
      </div>

      <p className={`mt-3 text-xs font-medium ${overdue ? 'text-red-600' : 'text-lafoi-gray'}`}>
        {overdue
          ? `${Math.abs(remaining)} days overdue`
          : `${remaining} days remaining`}
      </p>
    </div>
  )
}

/* ============================================================================
   FinancialSummary — vertical stacked bar + footer numbers
   ========================================================================= */

function FinancialSummary({ budget, spent }) {
  if (!budget || Number(budget) <= 0) {
    return (
      <div className="h-full flex flex-col items-start justify-center">
        <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">Budget</p>
        <p className="mt-2 font-display text-xl text-lafoi-dark">Budget not set</p>
        <p className="mt-1 text-xs text-lafoi-gray-medium">Add a budget to track spend visually.</p>
      </div>
    )
  }

  const b = Number(budget)
  const s = Math.max(0, Number(spent || 0))
  const pct = Math.min(100, (s / b) * 100)
  const remaining = Math.max(0, b - s)
  const showSpent = s > 0

  return (
    <div className="h-full flex gap-5">
      {/* Vertical stacked bar */}
      <div className="flex flex-col items-center">
        <div className="relative w-12 h-32 rounded-lg bg-lafoi-dark/8 overflow-hidden">
          <motion.div
            className="absolute inset-x-0 bottom-0 bg-lafoi-green-light"
            initial={{ height: 0 }}
            animate={{ height: `${pct}%` }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <span className="mt-2 font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium">
          {Math.round(pct)}%
        </span>
      </div>

      {/* Numbers */}
      <div className="flex-1 flex flex-col justify-center gap-2">
        <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">Budget</p>
        <p className="font-display text-xl text-lafoi-dark leading-tight">{fmtMoney(b)}</p>
        {showSpent && (
          <p className="text-xs text-lafoi-gray">
            <span className="text-lafoi-gray-medium">Spent</span> {fmtMoney(s)}
          </p>
        )}
        <p className="text-xs text-lafoi-gray">
          <span className="text-lafoi-gray-medium">Remaining</span> {fmtMoney(remaining)}
        </p>
      </div>
    </div>
  )
}

/* ============================================================================
   StatusPipeline — horizontal lifecycle strip with hairline connectors
   ========================================================================= */

function StatusPipeline({ current }) {
  const idx = STATUS_PIPELINE.indexOf(current)
  return (
    <div className="rounded-2xl border border-lafoi-dark/10 bg-white px-5 py-5 overflow-x-auto">
      <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium mb-4">Lifecycle</p>
      <ol className="flex items-center gap-0 min-w-max">
        {STATUS_PIPELINE.map((s, i) => {
          const isCurrent = i === idx
          const isPast = idx >= 0 && i < idx && s !== 'on_hold' && s !== 'cancelled'
          const isFuture = !isCurrent && !isPast
          return (
            <li key={s} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-full border transition-colors ${
                    isCurrent
                      ? 'bg-lafoi-green border-lafoi-green text-white'
                      : isPast
                      ? 'bg-lafoi-green/15 border-lafoi-green/30 text-lafoi-green-dark'
                      : 'bg-white border-lafoi-dark/15 text-lafoi-gray-medium'
                  }`}
                >
                  {isPast ? (
                    <CheckCircle size={14} weight="fill" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-white" />
                  ) : (
                    <Circle size={10} />
                  )}
                </div>
                <span
                  className={`font-sora text-[10px] tracking-[0.18em] uppercase whitespace-nowrap ${
                    isCurrent ? 'text-lafoi-dark font-medium' : isFuture ? 'text-lafoi-gray-medium' : 'text-lafoi-gray'
                  }`}
                >
                  {STATUS_LABEL[s]}
                </span>
              </div>
              {i < STATUS_PIPELINE.length - 1 && (
                <div
                  className={`mx-3 h-px w-12 sm:w-16 ${
                    isPast ? 'bg-lafoi-green/40' : 'bg-lafoi-dark/10'
                  }`}
                  style={{ transform: 'translateY(-12px)' }}
                />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/* ============================================================================
   Sparkline — compact bar chart of weekly counts
   ========================================================================= */

function Sparkline({ data = [], height = 56 }) {
  const max = Math.max(1, ...data)
  const cols = data.length || 1
  return (
    <svg viewBox={`0 0 ${cols * 12} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      {data.map((v, i) => {
        const h = Math.max(2, (v / max) * (height - 4))
        return (
          <motion.rect
            key={i}
            x={i * 12 + 2}
            width={8}
            rx={2}
            y={height - h}
            fill="var(--color-lafoi-green-light)"
            initial={{ height: 0, y: height }}
            animate={{ height: h, y: height - h }}
            transition={{ duration: 0.6, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
          />
        )
      })}
    </svg>
  )
}

// Compute per-week update counts for the last 8 weeks (oldest → newest).
function buildWeeklyUpdates(updates) {
  const buckets = Array(8).fill(0)
  if (!updates || updates.length === 0) return buckets
  const now = Date.now()
  for (const u of updates) {
    const t = new Date(u.created_at).getTime()
    if (Number.isNaN(t)) continue
    const weeksAgo = Math.floor((now - t) / (7 * 86400000))
    if (weeksAgo >= 0 && weeksAgo < 8) {
      buckets[7 - weeksAgo] += 1
    }
  }
  return buckets
}

/* ============================================================================
   CoverHero — editorial cover with photo OR ghost-numeral fallback
   ========================================================================= */

function CoverHero({ project }) {
  const photos = (project.files || []).filter(isImageFile)
  // most recent photo
  const cover = photos
    .slice()
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0]

  // extract numeric portion of project code (e.g. "LAF-0001" → "0001")
  const ghost = (project.code || '').match(/\d+/)?.[0] || ''
  const customer = project.customer?.name || project.customer_name

  return (
    <div className="relative w-full mb-8 overflow-hidden rounded-2xl bg-lafoi-dark" style={{ aspectRatio: '16 / 6' }}>
      {cover && cover.file_url ? (
        <img
          src={cover.file_url}
          alt={cover.title || project.title}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
      ) : (
        <>
          <div className="absolute inset-0 mesh-gradient-1" />
          <div className="absolute inset-0 pattern-blueprint-light opacity-60" />
          {ghost && (
            <span
              className="absolute -right-4 -bottom-8 font-display leading-none select-none"
              style={{
                fontSize: 'clamp(8rem, 14vw, 14rem)',
                color: 'rgba(255,255,255,0.04)',
                letterSpacing: '-0.04em',
              }}
            >
              {ghost}
            </span>
          )}
        </>
      )}

      {/* Bottom-up dark gradient for legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(17,17,17,0.85) 0%, rgba(17,17,17,0.55) 35%, rgba(17,17,17,0.10) 70%, rgba(17,17,17,0) 100%)',
        }}
      />

      {/* Bottom-left overlay */}
      <div className="absolute left-0 right-0 bottom-0 p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            {project.code && (
              <p className="font-sora text-[10px] sm:text-xs tracking-[0.3em] uppercase text-white/70 mb-2">
                {project.code}
              </p>
            )}
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-white leading-[1.05] tracking-tight">
              {project.title}
            </h1>
            {customer && (
              <p className="mt-2 text-sm sm:text-base text-white/80 font-body">
                {customer}
              </p>
            )}
          </div>
          <div className="shrink-0">
            <StatusBadge status={project.status} palette={STATUS_PALETTE_PROJECT} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================================
   Page
   ========================================================================= */

export default function ProjectDetail() {
  const confirm = useConfirm()
  const { id } = useParams()
  const { data: project, isLoading, refetch } = useGetProjectQuery(id)
  const [showUpdate, setShowUpdate] = useState(false)
  const [showFile, setShowFile] = useState(false)
  const [showSketch, setShowSketch] = useState(false)

  if (isLoading || !project) {
    return (
      <div>
        <Skeleton className="h-3 w-24 mb-4" />
        <Skeleton variant="block" className="w-full mb-8" style={{ aspectRatio: '16 / 6' }} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>
        <Skeleton variant="block" className="h-24 w-full mb-8" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-lafoi-dark/10 bg-white p-6 space-y-3">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-11/12" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <div className="rounded-2xl border border-lafoi-dark/10 bg-white p-6 space-y-3">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </div>
    )
  }

  const updates = project.updates || []
  const files = project.files || []
  const photos = files.filter(isImageFile)
  const docs = files.filter((f) => !isImageFile(f))
  const weekly = buildWeeklyUpdates(updates)

  // Spent: sum invoice totals if present on payload (backend may expose `invoices`).
  const spent = Array.isArray(project.invoices)
    ? project.invoices.reduce((sum, inv) => sum + Number(inv.total_amount || inv.amount || 0), 0)
    : 0

  return (
    <div>
      <Link
        to="/dashboard/projects"
        className="inline-flex items-center gap-2 text-xs font-sora tracking-widest text-lafoi-gray-medium hover:text-lafoi-dark mb-4"
      >
        <ArrowLeft size={12} /> All projects
      </Link>

      {/* 1. Hero cover band */}
      <CoverHero project={project} />

      {/* 2. Three-up visual progress band */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Card A — circular progress ring */}
        <div className="rounded-2xl border border-lafoi-dark/10 bg-white p-6 flex items-center gap-6">
          <ProgressRing percent={project.progress ?? 0} />
          <div className="flex-1 min-w-0">
            <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">Progress</p>
            <p className="mt-2 font-display text-xl text-lafoi-dark capitalize">
              {STATUS_LABEL[project.status] || project.status}
            </p>
            <p className="mt-1 text-xs text-lafoi-gray-medium">
              {project.category || 'General build'}
              {project.area_sqm ? ` · ${project.area_sqm} m²` : ''}
            </p>
          </div>
        </div>

        {/* Card B — schedule gauge */}
        <div className="rounded-2xl border border-lafoi-dark/10 bg-white p-6">
          <ScheduleGauge start={project.start_date} target={project.target_end_date} />
        </div>

        {/* Card C — financial summary */}
        <div className="rounded-2xl border border-lafoi-dark/10 bg-white p-6">
          <FinancialSummary budget={project.budget} spent={spent} />
        </div>
      </div>

      {/* 3. Status pipeline */}
      <div className="mb-8">
        <StatusPipeline current={project.status} />
      </div>

      {/* 4. Brief + activity sparkline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 cols — brief + site address */}
        <section className="lg:col-span-8 rounded-2xl border border-lafoi-dark/10 bg-white p-6">
          <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium mb-3">Brief</p>
          <p className="font-body text-sm text-lafoi-gray whitespace-pre-line leading-relaxed">
            {project.description || '—'}
          </p>
          {project.site_address && (
            <>
              <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium mt-6 mb-2 flex items-center gap-2">
                <MapPin size={12} /> Site address
              </p>
              <p className="font-body text-sm text-lafoi-gray whitespace-pre-line">{project.site_address}</p>
            </>
          )}
        </section>

        {/* Right 4 cols — sparkline + quick stats */}
        <aside className="lg:col-span-4 rounded-2xl border border-lafoi-dark/10 bg-white p-6 flex flex-col">
          <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium mb-3">
            Activity · 8 weeks
          </p>
          <div className="mt-1">
            <Sparkline data={weekly} />
          </div>
          <ul className="mt-5 space-y-1.5 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-lafoi-gray-medium">Updates</span>
              <span className="font-sora font-medium text-lafoi-dark">{updates.length}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-lafoi-gray-medium">Files</span>
              <span className="font-sora font-medium text-lafoi-dark">{files.length}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-lafoi-gray-medium">Area</span>
              <span className="font-sora font-medium text-lafoi-dark">
                {project.area_sqm ? `${project.area_sqm} m²` : '—'}
              </span>
            </li>
          </ul>
        </aside>
      </div>

      {/* 5. Updates timeline */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl">Progress timeline</h2>
          <PrimaryButton onClick={() => setShowUpdate(true)}>
            <Plus size={14} weight="bold" /> Add update
          </PrimaryButton>
        </div>
        <ol className="relative border-l-2 border-lafoi-green/30 pl-6 space-y-5">
          {updates.map((u) => {
            const dot = STATUS_DOT[u.status_snapshot] || '#1A8A2E'
            return (
              <li key={u.id} className="relative">
                <span
                  className="absolute -left-[31px] top-1 w-3 h-3 rounded-full"
                  style={{
                    background: dot,
                    boxShadow: `0 0 0 4px ${dot}26`,
                  }}
                />
                <div className="rounded-xl border border-lafoi-dark/10 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-sora text-sm font-medium">{u.title}</p>
                    <span className="text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium">
                      {fmtDate(u.created_at)}
                    </span>
                  </div>
                  {u.body && (
                    <p className="mt-2 text-sm text-lafoi-gray whitespace-pre-line">{u.body}</p>
                  )}
                  {u.photo_url && (
                    <img
                      src={u.photo_url}
                      alt=""
                      loading="lazy"
                      className="mt-3 max-h-72 rounded-lg object-cover w-full"
                    />
                  )}
                  {u.progress_snapshot != null && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] tracking-[0.2em] uppercase font-sora text-lafoi-gray-medium mb-1">
                        <span>Progress at update</span>
                        <span>{u.progress_snapshot}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-lafoi-dark/8 overflow-hidden">
                        <div
                          className="h-full bg-lafoi-green-light"
                          style={{ width: `${Math.max(0, Math.min(100, u.progress_snapshot))}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-xs text-lafoi-gray-medium">
                    {u.status_snapshot && (
                      <span className="capitalize">{u.status_snapshot.replace('_', ' ')}</span>
                    )}
                    {u.author?.display_name && <span>by {u.author.display_name}</span>}
                  </div>
                </div>
              </li>
            )
          })}
          {updates.length === 0 && (
            <li className="text-sm text-lafoi-gray-medium">No updates yet — log the first one.</li>
          )}
        </ol>
      </section>

      {/* 6. Files — split into Photos + Documents */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl">Plans &amp; files</h2>
          <div className="flex items-center gap-2">
            <SecondaryButton onClick={() => setShowSketch(true)}>
              <PaintBrush size={14} weight="bold" /> Sketch
            </SecondaryButton>
            <PrimaryButton onClick={() => setShowFile(true)}>
              <UploadSimple size={14} weight="bold" /> Upload file
            </PrimaryButton>
          </div>
        </div>

        {files.length === 0 && (
          <p className="text-sm text-lafoi-gray-medium">No files uploaded yet.</p>
        )}

        {photos.length > 0 && (
          <div className="mb-6">
            <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium mb-3">
              Photos · {photos.length}
            </p>
            <PhotosGrid files={photos} onChange={refetch} />
          </div>
        )}

        {docs.length > 0 && (
          <div>
            <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium mb-3">
              Documents · {docs.length}
            </p>
            <DocumentsGrid files={docs} onChange={refetch} />
          </div>
        )}
      </section>

      {/* 7. Linked expenses — read-only summary + variance card. Adding,
          editing or removing expenses happens in the Expenses tab now;
          this section just surfaces what's already linked to this project
          so the variance card stays useful in context. */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-display text-2xl">Linked expenses &amp; budget</h2>
          <Link
            to={`/dashboard/expenses?project=${project.id}`}
            className="inline-flex items-center gap-2 text-sm font-sora text-lafoi-dark hover:text-lafoi-green transition-colors"
          >
            Manage in Expenses
            <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <CostsTable costs={project.costs || []} readonly />
          </div>
          <div className="lg:col-span-5">
            <BudgetVarianceCard
              budget={project.budget}
              costs={project.costs || []}
              costsTotal={project.costs_total}
            />
          </div>
        </div>
      </section>

      <UpdateModal open={showUpdate} onClose={() => setShowUpdate(false)} project={project} onSaved={refetch} />
      <FileUploadModal open={showFile} onClose={() => setShowFile(false)} project={project} onSaved={refetch} />
      <Modal open={showSketch} onClose={() => setShowSketch(false)} title="Sketch a plan" size="lg">
        {showSketch && (
          <DrawingCanvas
            projectId={project.id}
            onSaved={refetch}
            onClose={() => setShowSketch(false)}
          />
        )}
      </Modal>
    </div>
  )
}

/* ============================================================================
   Costs table — READ-ONLY summary on the project page. Add/edit/delete
   happens in the new Expenses tab now.
   ========================================================================= */
function CostsTable({ costs, readonly = false }) {
  const columns = [
    { key: 'incurred_on', label: 'Date', render: (r) => <span className="text-xs text-lafoi-gray font-sora tabular-nums">{fmtDate(r.incurred_on)}</span> },
    {
      key: 'description',
      label: 'Description',
      render: (r) => (
        <div className="min-w-0">
          <p className="font-sora text-sm font-medium text-lafoi-dark truncate">{r.description}</p>
          {r.supplier && <p className="text-[11px] text-lafoi-gray-medium truncate">{r.supplier}</p>}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (r) => {
        const cls = (COST_CATEGORY_PALETTE[r.category] || COST_CATEGORY_PALETTE.other).pill
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-sora tracking-[0.18em] uppercase ${cls}`}>
            {r.category_label || r.category}
          </span>
        )
      },
    },
    {
      key: 'amount',
      label: 'Amount',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (r) => <span className="font-sora text-sm tabular-nums text-lafoi-dark">{fmtMoney(r.amount, r.currency || 'USD')}</span>,
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={costs}
      empty={readonly
        ? "No expenses linked to this project yet — record one in the Expenses tab and pick this project."
        : "No costs logged yet."}
    />
  )
}

/* ============================================================================
   Budget vs actual card — stacked bar + donut by category
   ========================================================================= */
function BudgetVarianceCard({ budget, costs, costsTotal }) {
  const b = Number(budget || 0)
  const total = costsTotal != null
    ? Number(costsTotal)
    : costs.reduce((s, c) => s + Number(c.amount || 0), 0)

  if (!b || b <= 0) {
    return (
      <div className="rounded-2xl border border-lafoi-dark/10 bg-white p-6 h-full flex flex-col">
        <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">Budget vs actual</p>
        <p className="mt-3 font-display text-xl text-lafoi-dark">No budget set</p>
        <p className="mt-2 text-xs text-lafoi-gray-medium leading-relaxed">
          Set a budget on the project to enable variance tracking. The card will
          show a stacked bar and category donut once you do.
        </p>
        {total > 0 && (
          <div className="mt-4 px-3 py-2 rounded-lg bg-lafoi-cream/60 text-xs text-lafoi-gray">
            Logged so far: <span className="font-sora font-medium text-lafoi-dark">{fmtMoney(total)}</span>
          </div>
        )}
      </div>
    )
  }

  const overBudget = total > b
  const remaining = b - total
  const pct = Math.max(0, Math.min(100, (total / b) * 100))
  const overflowPct = overBudget ? Math.min(100, ((total - b) / b) * 100) : 0
  const barColor = overBudget ? '#DC2626' : '#1A8A2E'

  // Category breakdown for donut
  const byCat = costs.reduce((acc, c) => {
    const k = c.category || 'other'
    acc[k] = (acc[k] || 0) + Number(c.amount || 0)
    return acc
  }, {})
  const catTotal = Object.values(byCat).reduce((s, v) => s + v, 0) || 1
  const segs = Object.entries(byCat).map(([k, v]) => ({
    key: k,
    value: v,
    pct: (v / catTotal) * 100,
    color: (COST_CATEGORY_PALETTE[k] || COST_CATEGORY_PALETTE.other).hex,
    label: k.charAt(0).toUpperCase() + k.slice(1),
  })).sort((a, b) => b.value - a.value)

  return (
    <div className="rounded-2xl border border-lafoi-dark/10 bg-white p-6 h-full flex flex-col">
      <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">Budget vs actual</p>

      {/* Big numbers */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] tracking-[0.22em] uppercase font-sora text-lafoi-gray-medium">Budget</p>
          <p className="mt-1 font-display text-xl text-lafoi-dark tabular-nums leading-tight">{fmtMoney(b)}</p>
        </div>
        <div>
          <p className="text-[10px] tracking-[0.22em] uppercase font-sora text-lafoi-gray-medium">Spent</p>
          <p className={`mt-1 font-display text-xl tabular-nums leading-tight ${overBudget ? 'text-red-600' : 'text-lafoi-dark'}`}>
            {fmtMoney(total)}
          </p>
        </div>
        <div>
          <p className="text-[10px] tracking-[0.22em] uppercase font-sora text-lafoi-gray-medium">
            {overBudget ? 'Over budget' : 'Remaining'}
          </p>
          <p className={`mt-1 font-display text-xl tabular-nums leading-tight ${overBudget ? 'text-red-600' : 'text-lafoi-green-dark'}`}>
            {fmtMoney(Math.abs(remaining))}
          </p>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-[10px] tracking-[0.2em] uppercase font-sora text-lafoi-gray-medium mb-1.5">
          <span>{Math.round(pct)}% of budget</span>
          {overBudget && <span className="text-red-600">+{Math.round(overflowPct)}% over</span>}
        </div>
        <div className="relative h-3 rounded-full bg-lafoi-dark/8 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0"
            style={{ background: barColor }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        {overBudget && (
          <div className="relative mt-1.5 h-1 rounded-full bg-red-100 overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-red-500"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, overflowPct)}%` }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            />
          </div>
        )}
      </div>

      {/* Donut by category */}
      {segs.length > 0 && (
        <div className="mt-5">
          <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium mb-3">
            Spend by category
          </p>
          <div className="flex items-center gap-5">
            <CategoryDonut segments={segs} total={catTotal} />
            <ul className="flex-1 grid grid-cols-1 gap-1.5 text-xs">
              {segs.map((s) => (
                <li key={s.key} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="capitalize text-lafoi-dark truncate">{s.label}</span>
                  </span>
                  <span className="font-sora tabular-nums text-lafoi-gray">{fmtMoney(s.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

function CategoryDonut({ segments, total, size = 120 }) {
  const stroke = 18
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(17,17,17,0.06)" strokeWidth={stroke} />
      {segments.map((s) => {
        const len = (s.value / total) * c
        const dasharray = `${len} ${c - len}`
        const dashoffset = -offset
        offset += len
        return (
          <motion.circle
            key={s.key}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={dasharray}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: dashoffset }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
        )
      })}
    </svg>
  )
}

/* ============================================================================
   Cost modal — REMOVED. Cost entry now lives in the Expenses tab.
   Kept the surrounding code structure but no longer rendered.
   ========================================================================= */
function _RemovedCostModal({ open, onClose, project, editing, onSaved }) {
  const isNew = editing && !editing.id
  const [form, setForm] = useState({
    description: '', category: 'materials', amount: '', currency: 'USD',
    incurred_on: new Date().toISOString().slice(0, 10), supplier: '',
    receipt_reference: '', notes: '',
  })
  const [error, setError] = useState('')
  const [createCost, createState] = useCreateProjectCostMutation()
  const [updateCost, updateState] = useUpdateProjectCostMutation()

  React.useEffect(() => {
    if (!open || !editing) return
    if (editing.id) {
      setForm({
        description: editing.description || '',
        category: editing.category || 'materials',
        amount: editing.amount || '',
        currency: editing.currency || 'USD',
        incurred_on: editing.incurred_on || new Date().toISOString().slice(0, 10),
        supplier: editing.supplier || '',
        receipt_reference: editing.receipt_reference || '',
        notes: editing.notes || '',
      })
    } else {
      setForm({
        description: '', category: 'materials', amount: '', currency: 'USD',
        incurred_on: new Date().toISOString().slice(0, 10), supplier: '',
        receipt_reference: '', notes: '',
      })
    }
    setError('')
  }, [open, editing])

  if (!open) return null
  const saving = createState.isLoading || updateState.isLoading

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      project: project.id,
      description: form.description.trim(),
      category: form.category,
      amount: form.amount,
      currency: form.currency,
      incurred_on: form.incurred_on,
      supplier: form.supplier,
      receipt_reference: form.receipt_reference,
      notes: form.notes,
    }
    try {
      if (isNew) {
        await createCost(payload).unwrap()
        toast.success('Cost logged', { description: payload.description })
      } else {
        await updateCost({ id: editing.id, ...payload }).unwrap()
        toast.success('Cost updated', { description: payload.description })
      }
      onSaved?.()
      onClose()
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Save failed.'
      setError(msg)
      toast.error('Could not save cost', { description: msg })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isNew ? 'Log a cost' : 'Edit cost'}
      size="md"
      footer={
        <>
          <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton form="cost-form" type="submit" disabled={saving}>
            {saving ? (<><CircleNotch size={14} className="animate-spin" /> Saving…</>) : 'Save cost'}
          </PrimaryButton>
        </>
      }
    >
      <form id="cost-form" onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
        {error && <div className="sm:col-span-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        <Field label="Description" required className="sm:col-span-2">
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder="e.g. 50 sheets of drywall" />
        </Field>
        <Field label="Category">
          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {COST_CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </Select>
        </Field>
        <Field label="Incurred on" required>
          <Input type="date" value={form.incurred_on} onChange={(e) => setForm({ ...form, incurred_on: e.target.value })} required />
        </Field>
        <Field label="Amount" required>
          <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        </Field>
        <Field label="Currency">
          <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
            <option value="USD">USD</option>
            <option value="ZWL">ZWL</option>
            <option value="ZAR">ZAR</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </Select>
        </Field>
        <Field label="Supplier">
          <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
        </Field>
        <Field label="Receipt reference">
          <Input value={form.receipt_reference} onChange={(e) => setForm({ ...form, receipt_reference: e.target.value })} />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
        </Field>
      </form>
    </Modal>
  )
}

/* ============================================================================
   Photos / Documents grids
   ========================================================================= */

function PhotosGrid({ files, onChange }) {
  const confirm = useConfirm()
  const [deleteFile] = useDeleteProjectFileMutation()
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {files.map((f) => (
        <div
          key={f.id}
          className="group relative rounded-xl border border-lafoi-dark/10 bg-white overflow-hidden"
        >
          <div className="aspect-[4/3] bg-lafoi-cream overflow-hidden">
            {f.file_url ? (
              <img
                src={f.file_url}
                alt={f.title || f.file_name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon size={36} className="text-lafoi-gray-medium" />
              </div>
            )}
          </div>
          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent text-white">
            <p className="font-sora text-xs font-medium truncate">{f.title || f.file_name}</p>
          </div>
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {f.file_url && (
              <a
                href={f.file_url}
                target="_blank"
                rel="noopener"
                className="p-1.5 rounded-lg bg-white/95 backdrop-blur text-lafoi-gray hover:text-lafoi-dark"
              >
                <ImageIcon size={12} />
              </a>
            )}
            <button
              onClick={async () => {
                if (!(await confirm({ title: 'Delete photo?', message: 'The photo will be removed from this project.', confirmLabel: 'Delete', danger: true }))) return
                try {
                  await deleteFile(f.id).unwrap()
                  toast.success('Photo removed', { description: f.title || f.file_name })
                  onChange?.()
                } catch (err) {
                  toast.error('Could not delete photo', { description: err?.data?.detail || 'Delete failed.' })
                }
              }}
              className="p-1.5 rounded-lg bg-white/95 backdrop-blur text-lafoi-gray hover:text-red-600"
            >
              <Trash size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function DocumentsGrid({ files, onChange }) {
  const confirm = useConfirm()
  const [deleteFile] = useDeleteProjectFileMutation()
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {files.map((f) => (
        <div
          key={f.id}
          className="group relative rounded-xl border border-lafoi-dark/10 bg-white overflow-hidden"
        >
          <div className="aspect-[4/3] bg-lafoi-cream flex items-center justify-center">
            <FileText size={36} className="text-lafoi-gray-medium" />
          </div>
          <div className="p-3">
            <p className="font-sora text-xs font-medium truncate">{f.title || f.file_name}</p>
            <p className="text-[10px] uppercase tracking-[0.22em] text-lafoi-gray-medium mt-0.5">{f.kind}</p>
          </div>
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {f.file_url && (
              <a
                href={f.file_url}
                target="_blank"
                rel="noopener"
                className="p-1.5 rounded-lg bg-white/95 backdrop-blur text-lafoi-gray hover:text-lafoi-dark"
              >
                <ImageIcon size={12} />
              </a>
            )}
            <button
              onClick={async () => {
                if (!(await confirm({ title: 'Delete file?', message: 'The file will be removed from this project.', confirmLabel: 'Delete', danger: true }))) return
                try {
                  await deleteFile(f.id).unwrap()
                  toast.success('File removed', { description: f.title || f.file_name })
                  onChange?.()
                } catch (err) {
                  toast.error('Could not delete file', { description: err?.data?.detail || 'Delete failed.' })
                }
              }}
              className="p-1.5 rounded-lg bg-white/95 backdrop-blur text-lafoi-gray hover:text-red-600"
            >
              <Trash size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ============================================================================
   Modals (unchanged from original)
   ========================================================================= */

function UpdateModal({ open, onClose, project, onSaved }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [progress, setProgress] = useState(project.progress ?? 0)
  const [status, setStatus] = useState(project.status)
  const [photo, setPhoto] = useState(null)
  const [createUpdate, { isLoading }] = useCreateProjectUpdateMutation()
  const [error, setError] = useState('')

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const fd = new FormData()
      fd.append('project', String(project.id))
      fd.append('title', title)
      fd.append('body', body)
      if (progress !== '') fd.append('progress_snapshot', String(progress))
      if (status) fd.append('status_snapshot', status)
      if (photo) fd.append('photo', photo)
      await createUpdate(fd).unwrap()
      toast.success('Update logged', { description: title })
      onSaved?.()
      onClose()
      setTitle(''); setBody(''); setPhoto(null)
    } catch (e) {
      const msg = e?.data ? Object.values(e.data).flat().join(' ') : 'Failed to save update.'
      setError(msg)
      toast.error('Could not log update', { description: msg })
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add progress update" footer={
      <>
        <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton form="update-form" type="submit" disabled={isLoading}>
          {isLoading ? (<><CircleNotch size={14} className="animate-spin" /> Saving…</>) : 'Add update'}
        </PrimaryButton>
      </>
    }>
      <form id="update-form" onSubmit={handleSave} className="grid gap-4">
        {error && <div className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        <Field label="Title" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Membrane installation complete" />
        </Field>
        <Field label="Notes">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Progress %">
            <Input type="number" min="0" max="100" value={progress} onChange={(e) => setProgress(e.target.value)} />
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_PIPELINE.map((s) =>
                <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Photo (optional)">
          <Input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
        </Field>
      </form>
    </Modal>
  )
}

function FileUploadModal({ open, onClose, project, onSaved }) {
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState('plan')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [uploadFile, { isLoading }] = useUploadProjectFileMutation()
  const [error, setError] = useState('')

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    if (!file) { setError('Pick a file to upload.'); return }
    try {
      const fd = new FormData()
      fd.append('project', String(project.id))
      fd.append('kind', kind)
      fd.append('title', title)
      fd.append('description', description)
      fd.append('file', file)
      await uploadFile(fd).unwrap()
      toast.success('File uploaded', { description: title || file.name })
      onSaved?.()
      onClose()
      setTitle(''); setDescription(''); setFile(null)
    } catch (e) {
      const msg = e?.data ? Object.values(e.data).flat().join(' ') : 'Upload failed.'
      setError(msg)
      toast.error('Could not upload file', { description: msg })
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Upload file" footer={
      <>
        <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton form="file-form" type="submit" disabled={isLoading}>
          {isLoading ? (<><CircleNotch size={14} className="animate-spin" /> Uploading…</>) : 'Upload'}
        </PrimaryButton>
      </>
    }>
      <form id="file-form" onSubmit={handleSave} className="grid gap-4">
        {error && <div className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Floor plan rev 2" />
        </Field>
        <Field label="Kind">
          <Select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="plan">Plan / Drawing</option>
            <option value="photo">Photo</option>
            <option value="contract">Contract</option>
            <option value="document">Document</option>
            <option value="other">Other</option>
          </Select>
        </Field>
        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </Field>
        <Field label="File" required>
          <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
        </Field>
      </form>
    </Modal>
  )
}
