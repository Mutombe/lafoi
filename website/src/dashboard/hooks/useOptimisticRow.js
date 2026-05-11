import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'sonner'

import { api } from '../store/api'

let _tempCounter = 0
const tempId = () => `__tmp_${++_tempCounter}_${Date.now()}`

function parseErr(err) {
  if (!err) return 'Unknown error'
  if (err.data?.detail) return err.data.detail
  if (err.data && typeof err.data === 'object') {
    try {
      return Object.values(err.data).flat().join(' ')
    } catch {
      return 'Unknown error'
    }
  }
  return err.message || 'Unknown error'
}

/**
 * Optimistic create / update / delete for an RTK Query list endpoint.
 *
 * Each handler patches the cached list immediately (adding a temp row,
 * tagging an existing row with `_pending`, or marking a row as deleting)
 * and returns a Promise. DataTable picks up `_pending` and renders a
 * small badge in the actions cell.
 *
 * On rejection the patch is undone and a toast is fired with `errorTitle`.
 */
export default function useOptimisticRow(endpointName, args) {
  const dispatch = useDispatch()

  const patchList = useCallback(
    (recipe) => dispatch(api.util.updateQueryData(endpointName, args, recipe)),
    [dispatch, endpointName, args],
  )

  const optimisticCreate = useCallback(
    async ({
      tempRow,
      run,
      label = 'Creating…',
      successTitle = 'Saved',
      errorTitle = 'Save failed',
      describe,
    }) => {
      const tid = tempId()
      const seed = { ...tempRow, id: tid, _pending: { action: 'create', label } }
      const patch = patchList((draft) => {
        if (!draft) return
        if (Array.isArray(draft)) {
          draft.unshift(seed)
          return
        }
        if (draft.results) {
          draft.results = [seed, ...draft.results]
          if (typeof draft.count === 'number') draft.count += 1
        }
      })

      try {
        const created = await run()
        patchList((draft) => {
          if (!draft) return
          if (Array.isArray(draft)) {
            const idx = draft.findIndex((r) => r.id === tid)
            if (idx >= 0) draft[idx] = created
            return
          }
          if (draft.results) {
            const idx = draft.results.findIndex((r) => r.id === tid)
            if (idx >= 0) draft.results[idx] = created
          }
        })
        toast.success(successTitle, { description: describe?.(created) })
        return created
      } catch (err) {
        patch.undo()
        toast.error(errorTitle, { description: parseErr(err) })
        throw err
      }
    },
    [patchList],
  )

  const optimisticUpdate = useCallback(
    async ({
      id,
      patch: rowPatch,
      run,
      label = 'Saving…',
      successTitle = 'Saved',
      errorTitle = 'Save failed',
      describe,
    }) => {
      const undo = patchList((draft) => {
        if (!draft) return
        const list = Array.isArray(draft) ? draft : draft.results
        if (!list) return
        const idx = list.findIndex((r) => r.id === id)
        if (idx >= 0) {
          list[idx] = {
            ...list[idx],
            ...(rowPatch || {}),
            _pending: { action: 'update', label },
          }
        }
      })

      try {
        const updated = await run()
        patchList((draft) => {
          if (!draft) return
          const list = Array.isArray(draft) ? draft : draft.results
          if (!list) return
          const idx = list.findIndex((r) => r.id === id)
          if (idx >= 0) list[idx] = updated
        })
        toast.success(successTitle, { description: describe?.(updated) })
        return updated
      } catch (err) {
        undo.undo()
        toast.error(errorTitle, { description: parseErr(err) })
        throw err
      }
    },
    [patchList],
  )

  const optimisticDelete = useCallback(
    async ({
      id,
      run,
      label = 'Deleting…',
      successTitle = 'Removed',
      errorTitle = 'Delete failed',
      describe,
    }) => {
      let snapshot = null
      const undo = patchList((draft) => {
        if (!draft) return
        const list = Array.isArray(draft) ? draft : draft.results
        if (!list) return
        const idx = list.findIndex((r) => r.id === id)
        if (idx >= 0) {
          snapshot = list[idx]
          list[idx] = { ...snapshot, _pending: { action: 'delete', label } }
        }
      })

      try {
        await run()
        patchList((draft) => {
          if (!draft) return
          if (Array.isArray(draft)) {
            const idx = draft.findIndex((r) => r.id === id)
            if (idx >= 0) draft.splice(idx, 1)
            return
          }
          if (draft.results) {
            draft.results = draft.results.filter((r) => r.id !== id)
            if (typeof draft.count === 'number') draft.count = Math.max(0, draft.count - 1)
          }
        })
        toast.success(successTitle, { description: snapshot ? describe?.(snapshot) : undefined })
      } catch (err) {
        undo.undo()
        toast.error(errorTitle, { description: parseErr(err) })
        throw err
      }
    },
    [patchList],
  )

  /**
   * Custom action (status change, conversion, etc.) — pins a label to the
   * row while the mutation runs, then replaces with the server response.
   */
  const optimisticAction = useCallback(
    async ({
      id,
      run,
      label = 'Working…',
      successTitle = 'Done',
      errorTitle = 'Action failed',
      patch: rowPatch,
      describe,
    }) => {
      const undo = patchList((draft) => {
        if (!draft) return
        const list = Array.isArray(draft) ? draft : draft.results
        if (!list) return
        const idx = list.findIndex((r) => r.id === id)
        if (idx >= 0) {
          list[idx] = {
            ...list[idx],
            ...(rowPatch || {}),
            _pending: { action: 'action', label },
          }
        }
      })

      try {
        const result = await run()
        patchList((draft) => {
          if (!draft) return
          const list = Array.isArray(draft) ? draft : draft.results
          if (!list) return
          const idx = list.findIndex((r) => r.id === id)
          if (idx >= 0) {
            list[idx] = { ...list[idx], ...(result || {}), _pending: undefined }
          }
        })
        toast.success(successTitle, { description: describe?.(result) })
        return result
      } catch (err) {
        undo.undo()
        toast.error(errorTitle, { description: parseErr(err) })
        throw err
      }
    },
    [patchList],
  )

  return { optimisticCreate, optimisticUpdate, optimisticDelete, optimisticAction }
}
