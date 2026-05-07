/**
 * Offline sync queue — Movement creates only.
 *
 * The pattern:
 *   1. While offline (or whenever network is flaky), `enqueueMovement(payload)`
 *      appends the row to a Dexie-backed IndexedDB store with a client-side
 *      uuid as primary key.
 *   2. On `online` events (or when the user clicks "Sync now"), `flushQueue()`
 *      reads pending rows and POSTs each to /api/movements/. The backend
 *      treats matching `client_uuid` as idempotent — so a flaky network that
 *      re-sends the same payload won't double-post.
 *   3. On 2xx, the row is removed from the queue. On 4xx (validation failure),
 *      the row is marked `failed: true` with a reason so the dashboard can
 *      surface it instead of retrying forever.
 *
 * NOTE: install Dexie before using:  npm install dexie --save
 */
import Dexie from 'dexie'
import { useEffect, useState } from 'react'

const DB_NAME = 'lafoi.offline.v1'
const STORE = 'pending_movements'

const db = new Dexie(DB_NAME)
db.version(1).stores({
  // Primary key is `client_uuid` — that's the idempotency key the backend
  // dedupes on. Indexed columns let us filter by status / item if we ever
  // want to surface them in a UI.
  [STORE]: 'client_uuid, item, location, created_at, failed',
})

// Lightweight uuid v4 polyfill — avoids pulling in a uuid lib for one line.
function uuidv4() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // RFC4122 v4 fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

function readAuthToken() {
  // Mirrors the persistence layout used by `dashboard/store/authSlice.js`.
  // We don't import it directly to avoid an offline page loading the whole
  // RTK Query bundle just to read a string.
  try {
    const raw = window.localStorage.getItem('lafoi.auth.v1')
    if (!raw) return ''
    const parsed = JSON.parse(raw)
    return parsed?.access || ''
  } catch {
    return ''
  }
}

/**
 * Append a movement to the IndexedDB queue.
 *
 * payload: { item, location, quantity, reason, reference?, notes?, occurred_at? }
 * Returns the assigned client_uuid so the caller can render an optimistic row.
 */
export async function enqueueMovement(payload) {
  const client_uuid = uuidv4()
  const row = {
    client_uuid,
    item: payload.item,
    location: payload.location,
    quantity: payload.quantity,
    reason: payload.reason,
    reference: payload.reference || '',
    notes: payload.notes || '',
    occurred_at: payload.occurred_at || new Date().toISOString(),
    created_at: new Date().toISOString(),
    failed: 0,           // 0/1 — Dexie can't index booleans cross-browser reliably
    error: '',
  }
  await db.table(STORE).put(row)
  return client_uuid
}

/**
 * Drain the queue. POSTs each pending row to /api/movements/ and removes it
 * on success. 4xx errors flip the row to `failed=1` with a reason. Network
 * errors leave the row pending so the next online event retries.
 *
 * Returns: { sent, failed, remaining }
 */
export async function flushQueue() {
  const token = readAuthToken()
  // Snapshot the queue — we don't want concurrent enqueues to confuse iteration.
  const rows = await db.table(STORE).where('failed').equals(0).toArray()
  let sent = 0
  let failed = 0
  for (const row of rows) {
    const body = {
      item: row.item,
      location: row.location,
      quantity: row.quantity,
      reason: row.reason,
      reference: row.reference,
      notes: row.notes,
      occurred_at: row.occurred_at,
      client_uuid: row.client_uuid,
    }
    try {
      const resp = await fetch(`${API_BASE}/movements/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      })
      if (resp.ok) {
        await db.table(STORE).delete(row.client_uuid)
        sent += 1
      } else if (resp.status >= 400 && resp.status < 500) {
        // Validation failure — don't keep retrying forever. Mark and move on.
        let detail = `HTTP ${resp.status}`
        try {
          const data = await resp.json()
          detail = JSON.stringify(data)
        } catch { /* swallow */ }
        await db.table(STORE).update(row.client_uuid, { failed: 1, error: detail })
        failed += 1
      } else {
        // 5xx / network blip — leave it for the next flush.
      }
    } catch (err) {
      // Connectivity glitched mid-flush — bail out, we'll try again on the
      // next `online` event. Don't mark the row failed.
      break
    }
  }
  const remaining = await db.table(STORE).count()
  // Notify other tabs / components.
  try {
    const ch = new BroadcastChannel('lafoi.offline.sync')
    ch.postMessage({ type: 'flush_complete', sent, failed, remaining })
    ch.close()
  } catch { /* unsupported in older browsers */ }
  return { sent, failed, remaining }
}

/**
 * Force-clear failed rows (used by the "Discard" UI).
 */
export async function clearFailed() {
  return db.table(STORE).where('failed').equals(1).delete()
}

/**
 * React hook — subscribes to the pending row count so the header badge
 * updates automatically as items flow in/out of the queue.
 *
 * We poll lightly (every 1.5s) AND listen to BroadcastChannel + storage events
 * for an instant refresh in the typical case. Polling is the safety net when
 * neither channel fires (e.g. older Safari).
 */
export function usePendingCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let cancelled = false
    const recompute = async () => {
      try {
        const c = await db.table(STORE).count()
        if (!cancelled) setCount(c)
      } catch {
        if (!cancelled) setCount(0)
      }
    }
    recompute()
    const interval = setInterval(recompute, 1500)
    let bc
    try {
      bc = new BroadcastChannel('lafoi.offline.sync')
      bc.onmessage = recompute
    } catch { /* swallow — older browsers */ }
    const onOnline = () => recompute()
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOnline)
    return () => {
      cancelled = true
      clearInterval(interval)
      try { bc?.close?.() } catch { /* swallow */ }
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOnline)
    }
  }, [])
  return count
}

// ---------------------------------------------------------------------------
// Auto-flush on reconnect
// ---------------------------------------------------------------------------
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushQueue().catch(() => { /* logged inside */ })
  })
}

/**
 * Wrapper used by movement modals: while online, fire the RTK Query mutation
 * and bubble the result. While offline (or if the network flubs), enqueue
 * the payload locally.
 *
 * The caller passes a function that performs the live mutation so this
 * module doesn't have to import the RTK Query store.
 *
 *   const result = await recordMovement(payload, (body) =>
 *     createMovement(body).unwrap()
 *   )
 */
export async function recordMovement(payload, liveCall) {
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const result = await liveCall(payload)
      return { online: true, result }
    } catch (err) {
      // Network blip — fall through to enqueue. We can't tell server-side
      // failures (e.g. validation) apart from network failures perfectly,
      // but RTK Query's "FETCH_ERROR" is the best signal we have here.
      const isNetwork = !err?.status || err?.status === 'FETCH_ERROR' || err?.status === 'TIMEOUT_ERROR'
      if (!isNetwork) {
        throw err
      }
    }
  }
  const uuid = await enqueueMovement(payload)
  return { online: false, queued: true, client_uuid: uuid }
}

export default db
