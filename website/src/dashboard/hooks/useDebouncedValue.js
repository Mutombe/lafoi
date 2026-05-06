import { useEffect, useState } from 'react'

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms of
 * stillness. Use to gate API calls behind a user typing in a search field.
 *
 *   const [search, setSearch] = useState('')
 *   const debounced = useDebouncedValue(search, 300)
 *   useListThingsQuery({ search: debounced || undefined })
 */
export default function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}
