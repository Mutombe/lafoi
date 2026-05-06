import { useDispatch } from 'react-redux'

import { api } from '../store/api'

/**
 * Returns a function that you can call inside a mutation's `onQueryStarted`
 * callback to optimistically update an RTK Query list endpoint's cached
 * results.
 *
 * Usage:
 *
 *   const apply = useOptimisticListUpdate('listProjects', { page: 1 })
 *
 *   await apply(
 *     (draft) => { draft.results.push(newProject) },
 *     async () => createProject(payload).unwrap(),
 *   )
 *
 * If the mutation rejects, the optimistic patch is undone automatically.
 */
export default function useOptimisticListUpdate(endpointName, args = undefined) {
  const dispatch = useDispatch()

  return async function applyOptimistic(recipe, run) {
    const patch = dispatch(api.util.updateQueryData(endpointName, args, recipe))
    try {
      const result = await run()
      return result
    } catch (err) {
      patch.undo()
      throw err
    }
  }
}
