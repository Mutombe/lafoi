import React, { useState } from 'react'
import { CloudArrowUp, CircleNotch, WifiSlash } from '@phosphor-icons/react'
import { toast } from 'sonner'

import { usePendingCount, flushQueue } from '../offline/syncQueue'

/**
 * Compact pill that surfaces the pending offline-queue count and exposes a
 * "Sync now" button. Hidden when no rows are queued.
 */
export default function OfflineSyncBadge() {
  const pending = usePendingCount()
  const [syncing, setSyncing] = useState(false)
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine

  if (!pending && !isOffline) return null

  const handleSync = async () => {
    if (isOffline) {
      toast.error('Still offline', { description: 'Reconnect to flush the queue.' })
      return
    }
    setSyncing(true)
    try {
      const result = await flushQueue()
      if (result.sent > 0) {
        toast.success('Synced', {
          description: `${result.sent} movement${result.sent === 1 ? '' : 's'} flushed${result.failed ? `, ${result.failed} failed` : ''}.`,
        })
      } else if (result.remaining > 0) {
        toast.message('No progress', { description: 'Server unreachable — try again shortly.' })
      } else {
        toast.message('Already up to date')
      }
    } catch (err) {
      toast.error('Sync failed', { description: String(err) })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={syncing || (isOffline && !pending)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sora bg-lafoi-green-light/15 text-lafoi-green-dark border border-lafoi-green/30 hover:bg-lafoi-green-light/25 transition-colors disabled:opacity-60"
      title={isOffline ? 'Offline — queued movements will sync when reconnected' : 'Sync queued movements now'}
    >
      {syncing ? (
        <CircleNotch size={12} className="animate-spin" />
      ) : isOffline ? (
        <WifiSlash size={12} weight="bold" />
      ) : (
        <CloudArrowUp size={12} weight="bold" />
      )}
      {pending > 0 ? (
        <span className="tabular-nums">{pending} pending sync</span>
      ) : (
        <span>Offline</span>
      )}
      {!syncing && pending > 0 && !isOffline && <span className="opacity-70">· Sync now</span>}
    </button>
  )
}
