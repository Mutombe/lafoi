import React, { useEffect, useMemo, useState } from 'react'
import {
  ClockClockwise, Plus, Trash, PencilSimple, MagnifyingGlass,
  CircleNotch, CheckCircle, SignIn, SignOut, MapPin,
} from '@phosphor-icons/react'
import { useConfirm } from '../components/ConfirmDialog'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import DataTable, { fmtDate } from '../components/DataTable'
import Modal from '../components/Modal'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton } from '../components/FormField'
import EmployeePicker from '../components/EmployeePicker'
import useDebouncedValue from '../hooks/useDebouncedValue'
import useOptimisticListUpdate from '../hooks/useOptimisticListUpdate'
import CountUp from '../../components/ui/CountUp'
import {
  useListEmployeesQuery,
  useGetClockEntriesQuery,
  useClockInMutation,
  useClockOutMutation,
  useUpdateClockEntryMutation,
  useDeleteClockEntryMutation,
} from '../store/api'

/* ============================================================================
   Time Clock — record when employees start and end their shifts.
   ----------------------------------------------------------------------------
   Layout (vertical):
     1. Quick-action card  — open-shift banner OR clock-in form.
     2. Today's roster     — count clocked-in / total hours today / avg shift.
     3. Entries table      — filter by employee + date-range + search; edit/delete.
   The payroll engine doesn't auto-deduct from clock entries — they're
   informational only. PayrollEntry.total_clock_hours rolls them up for the
   period view in the Payroll dashboard.
   ============================================================================ */

const todayISO = () => new Date().toISOString().slice(0, 10)

const fmtTime = (iso) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

const fmtDateTime = (iso) => {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  } catch {
    return iso
  }
}

const liveHours = (clockIn) => {
  if (!clockIn) return 0
  const ms = Date.now() - new Date(clockIn).getTime()
  return Math.max(0, ms / 3600000)
}

export default function TimeClock() {
  const confirm = useConfirm()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  // Quick clock-in form local state (collapses to inline once a shift is open)
  const [pickEmployee, setPickEmployee] = useState('')
  const [pickLocation, setPickLocation] = useState('')
  const [pickNotes, setPickNotes] = useState('')

  // Tick clock-state every minute so the live "open shift" duration ticks.
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [debouncedSearch, employeeFilter, dateFrom, dateTo])

  // ---- Data --------------------------------------------------------------
  const queryArgs = useMemo(() => {
    const args = { page, page_size: pageSize }
    if (debouncedSearch) args.search = debouncedSearch
    if (employeeFilter) args.employee = employeeFilter
    if (dateFrom) args.clock_in__gte = `${dateFrom}T00:00:00`
    if (dateTo) args.clock_in__lte = `${dateTo}T23:59:59`
    return args
  }, [page, pageSize, debouncedSearch, employeeFilter, dateFrom, dateTo])

  const { data: empData } = useListEmployeesQuery({ page: 1, page_size: 250 })
  const { data, isLoading: isFirstLoad } = useGetClockEntriesQuery(queryArgs)

  // Today's strip pulls a focused query so it doesn't depend on the user's
  // current filter selection.
  const todayArgs = useMemo(() => ({
    page: 1,
    page_size: 250,
    clock_in__gte: `${todayISO()}T00:00:00`,
    clock_in__lte: `${todayISO()}T23:59:59`,
  }), [])
  const { data: todayData } = useGetClockEntriesQuery(todayArgs)

  const employees = empData?.results || []
  const rows = data?.results || []
  const todayRows = todayData?.results || []

  // Open shifts (no clock_out) — used for the banner + roster count
  const openShifts = useMemo(
    () => todayRows.filter((r) => !r.clock_out),
    [todayRows],
  )
  const closedTodayCount = todayRows.length - openShifts.length
  const totalHoursToday = useMemo(() => {
    const closed = todayRows
      .filter((r) => r.clock_out)
      .reduce((sum, r) => sum + (Number(r.hours_worked) || 0), 0)
    const live = openShifts.reduce((sum, r) => sum + liveHours(r.clock_in), 0)
    return closed + live
  }, [todayRows, openShifts])
  const avgShift = useMemo(() => {
    if (closedTodayCount === 0) return 0
    const total = todayRows
      .filter((r) => r.clock_out)
      .reduce((sum, r) => sum + (Number(r.hours_worked) || 0), 0)
    return total / closedTodayCount
  }, [todayRows, closedTodayCount])

  const applyOptimistic = useOptimisticListUpdate('getClockEntries', queryArgs)

  // ---- Mutations ---------------------------------------------------------
  const [clockIn, clockInState] = useClockInMutation()
  const [clockOut, clockOutState] = useClockOutMutation()
  const [updateEntry, updateState] = useUpdateClockEntryMutation()
  const [deleteEntry] = useDeleteClockEntryMutation()

  const handleClockIn = async (e) => {
    e.preventDefault()
    if (!pickEmployee) {
      toast.error('Pick an employee first')
      return
    }
    try {
      const created = await clockIn({
        employee: pickEmployee,
        location: pickLocation || '',
        notes: pickNotes || '',
      }).unwrap()
      const name = employees.find((emp) => String(emp.id) === String(pickEmployee))?.full_name || ''
      toast.success(`Clocked in${name ? ` — ${name}` : ''}`, { description: pickLocation || undefined })
      setPickEmployee('')
      setPickLocation('')
      setPickNotes('')
    } catch (err) {
      const msg = err?.data?.detail || err?.data?.employee || 'Could not clock in.'
      toast.error('Clock-in failed', { description: typeof msg === 'string' ? msg : JSON.stringify(msg) })
    }
  }

  const handleClockOut = async (entry) => {
    try {
      await clockOut({ id: entry.id }).unwrap()
      toast.success(`Clocked out — ${entry.employee_name || 'employee'}`)
    } catch (err) {
      const msg = err?.data?.detail || 'Could not clock out.'
      toast.error('Clock-out failed', { description: msg })
    }
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        clock_in: editing.clock_in,
        clock_out: editing.clock_out || null,
        notes: editing.notes || '',
        location: editing.location || '',
      }
      await updateEntry({ id: editing.id, ...payload }).unwrap()
      toast.success('Entry updated')
      setEditing(null)
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Save failed.'
      setError(msg)
      toast.error('Could not update entry', { description: msg })
    }
  }

  const handleDelete = async (row) => {
    if (!(await confirm({ title: 'Delete clock entry?', message: `The clock entry for ${row.employee_name} will be removed permanently.`, confirmLabel: 'Delete', danger: true }))) return
    try {
      await applyOptimistic(
        (draft) => {
          if (!draft?.results) return
          draft.results = draft.results.filter((r) => r.id !== row.id)
          if (typeof draft.count === 'number') draft.count = Math.max(0, draft.count - 1)
        },
        () => deleteEntry(row.id).unwrap(),
      )
      toast.success('Entry removed')
    } catch (err) {
      const msg = err?.data?.detail || 'Delete failed.'
      toast.error('Could not delete entry', { description: msg })
    }
  }

  // ---- Columns -----------------------------------------------------------
  const columns = [
    {
      key: 'employee', label: 'Employee', priority: 'high',
      render: (r) => (
        <div>
          <p className="font-sora text-sm font-medium">{r.employee_name || '—'}</p>
          <p className="text-xs text-lafoi-gray-medium">{r.employee_code || ''}</p>
        </div>
      ),
    },
    {
      key: 'clock_in', label: 'Clocked in', priority: 'high',
      render: (r) => fmtDateTime(r.clock_in),
    },
    {
      key: 'clock_out', label: 'Clocked out', priority: 'medium',
      render: (r) => r.clock_out ? fmtDateTime(r.clock_out) : (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-lafoi-green/10 text-lafoi-green-dark text-[11px] font-sora font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-lafoi-green animate-pulse" />
          On shift
        </span>
      ),
    },
    {
      key: 'hours_worked', label: 'Hours', priority: 'medium',
      render: (r) => {
        if (r.hours_worked != null) return <span className="tabular-nums">{Number(r.hours_worked).toFixed(2)}</span>
        return <span className="tabular-nums text-lafoi-gray-medium">{liveHours(r.clock_in).toFixed(2)}</span>
      },
    },
    {
      key: 'location', label: 'Location', priority: 'low',
      render: (r) => r.location ? (
        <span className="inline-flex items-center gap-1 text-xs text-lafoi-gray">
          <MapPin size={12} weight="regular" /> {r.location}
        </span>
      ) : <span className="text-lafoi-gray-medium">—</span>,
    },
    {
      key: 'actions', label: '', priority: 'high',
      render: (r) => (
        <div className="flex justify-end gap-1">
          {!r.clock_out && (
            <button
              onClick={(e) => { e.stopPropagation(); handleClockOut(r) }}
              title="Clock out now"
              className="p-2 rounded-lg hover:bg-lafoi-green/10 text-lafoi-green min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
            >
              <SignOut size={14} weight="bold" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setEditing({ ...r }) }}
            className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
          >
            <PencilSimple size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(r) }}
            className="p-2 rounded-lg hover:bg-red-50 text-lafoi-gray hover:text-red-600 min-w-[36px] min-h-[36px] inline-flex items-center justify-center"
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
        eyebrow="Time Clock"
        title="Shifts in and out."
        description="Record when employees start and end their shifts. Hours roll up to the payroll period summary — but never auto-deduct."
      />

      {/* ---------- Quick action card --------------------------------------- */}
      <div className="mb-6 rounded-3xl border border-lafoi-dark/10 bg-white shadow-[0_2px_8px_-4px_rgba(17,17,17,0.04)] overflow-hidden">
        <div className="border-l-4 border-lafoi-green px-5 sm:px-6 py-5 sm:py-6">
          {/* Open shift banner */}
          {openShifts.length > 0 && (
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-lafoi-green/[0.06] px-4 py-3.5 border border-lafoi-green/15">
              <div className="flex items-start gap-3">
                <span className="mt-1 inline-flex w-2 h-2 rounded-full bg-lafoi-green animate-pulse" />
                <div>
                  <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-green-dark mb-0.5">
                    {openShifts.length} on shift now
                  </p>
                  <p className="text-sm font-body text-lafoi-dark">
                    {openShifts.slice(0, 3).map((s) => s.employee_name).join(', ')}
                    {openShifts.length > 3 ? ` and ${openShifts.length - 3} more` : ''}
                  </p>
                </div>
              </div>
              {openShifts.length === 1 && (
                <button
                  onClick={() => handleClockOut(openShifts[0])}
                  disabled={clockOutState.isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lafoi-dark text-white font-sora text-sm font-medium hover:bg-lafoi-green transition-colors disabled:opacity-60"
                >
                  {clockOutState.isLoading ? <CircleNotch size={14} className="animate-spin" /> : <SignOut size={14} weight="bold" />}
                  Clock out
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <ClockClockwise size={18} className="text-lafoi-green" />
            <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray-medium">
              Clock someone in
            </p>
          </div>
          <form onSubmit={handleClockIn} className="grid sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
            <Field label="Employee" className="lg:col-span-4">
              <EmployeePicker
                employees={employees}
                value={pickEmployee}
                onChange={setPickEmployee}
                placeholder="Type a name or code…"
                required
              />
            </Field>
            <Field label="Location (optional)" className="lg:col-span-3">
              <Input
                value={pickLocation}
                onChange={(e) => setPickLocation(e.target.value)}
                placeholder="Site / address"
              />
            </Field>
            <Field label="Notes (optional)" className="lg:col-span-3">
              <Input
                value={pickNotes}
                onChange={(e) => setPickNotes(e.target.value)}
                placeholder="Optional"
              />
            </Field>
            <div className="lg:col-span-2">
              <button
                type="submit"
                disabled={clockInState.isLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-lafoi-green text-white font-sora text-sm font-medium hover:bg-lafoi-green-dark transition-colors disabled:opacity-60"
              >
                {clockInState.isLoading ? <CircleNotch size={14} className="animate-spin" /> : <SignIn size={14} weight="bold" />}
                Clock in
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ---------- Today's roster strip ----------------------------------- */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="On shift now" value={openShifts.length} suffix="" decimals={0} accent="green" />
        <StatCard label="Hours logged today" value={totalHoursToday} suffix="h" decimals={1} accent="dark" />
        <StatCard label="Avg shift today" value={avgShift} suffix="h" decimals={1} accent="dark" />
      </div>

      {/* ---------- Filters ------------------------------------------------- */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-1.5">Search</p>
          <div className="relative">
            <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lafoi-gray-medium" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, notes, location"
              className="w-full pl-9 pr-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body"
            />
          </div>
        </div>
        <div className="min-w-[220px]">
          <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-1.5">Employee</p>
          <EmployeePicker
            employees={employees}
            value={employeeFilter}
            onChange={setEmployeeFilter}
            placeholder="All employees"
          />
        </div>
        <div>
          <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-1.5">From</p>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body"
          />
        </div>
        <div>
          <p className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium mb-1.5">To</p>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body"
          />
        </div>
        {(employeeFilter || dateFrom || dateTo || search) && (
          <button
            onClick={() => { setEmployeeFilter(''); setDateFrom(''); setDateTo(''); setSearch('') }}
            className="px-3 py-2 text-xs font-sora tracking-[0.16em] uppercase text-lafoi-gray-medium hover:text-lafoi-green transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* ---------- Entries table ------------------------------------------ */}
      <DataTable
        columns={columns}
        rows={rows}
        isLoading={isFirstLoad}
        empty="No clock entries yet — clock someone in to get started."
        pagination={data ? {
          count: data.count,
          page,
          pageSize,
          onPageChange: setPage,
          onPageSizeChange: (s) => { setPageSize(s); setPage(1) },
        } : null}
      />

      {/* ---------- Edit modal --------------------------------------------- */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.employee_name || 'entry'}` : ''}
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setEditing(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="clock-edit-form" type="submit" disabled={updateState.isLoading}>
              {updateState.isLoading ? (<><CircleNotch size={14} className="animate-spin" /> Saving…</>) : 'Save'}
            </PrimaryButton>
          </>
        }
      >
        {editing && (
          <form id="clock-edit-form" onSubmit={handleSaveEdit} className="grid sm:grid-cols-2 gap-4">
            {error && <div className="sm:col-span-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
            <Field label="Clocked in">
              <Input
                type="datetime-local"
                value={toLocalInput(editing.clock_in)}
                onChange={(e) => setEditing({ ...editing, clock_in: fromLocalInput(e.target.value) })}
                required
              />
            </Field>
            <Field label="Clocked out">
              <Input
                type="datetime-local"
                value={toLocalInput(editing.clock_out)}
                onChange={(e) => setEditing({ ...editing, clock_out: fromLocalInput(e.target.value) })}
              />
              {!editing.clock_out && (
                <p className="text-xs text-lafoi-gray-medium mt-1">Leave blank to keep the shift open.</p>
              )}
            </Field>
            <Field label="Location" className="sm:col-span-2">
              <Input
                value={editing.location || ''}
                onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                placeholder="Site / address"
              />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea
                value={editing.notes || ''}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                rows={3}
              />
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}

/* ============================================================================
   Helpers
   ============================================================================ */

function StatCard({ label, value, suffix = '', decimals = 0, accent = 'dark' }) {
  const accentClass = accent === 'green'
    ? 'border-l-4 border-lafoi-green'
    : 'border-l-4 border-lafoi-dark/15'
  return (
    <div className={`rounded-2xl bg-white border border-lafoi-dark/8 ${accentClass} px-5 py-4`}>
      <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray-medium mb-1.5">{label}</p>
      <p className="font-display font-light text-3xl text-lafoi-dark tabular-nums">
        <CountUp end={Number(value) || 0} duration={1.4} decimals={decimals} suffix={suffix} />
      </p>
    </div>
  )
}

// Convert ISO → value compatible with <input type="datetime-local"> (no TZ offset).
function toLocalInput(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}

// Convert datetime-local string → ISO with current local TZ.
function fromLocalInput(s) {
  if (!s) return null
  try {
    return new Date(s).toISOString()
  } catch {
    return s
  }
}
