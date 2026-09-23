import { useEffect, useState } from 'react'

// Public marketing site → CMS bridge. Fetches the editable content blocks for a
// page once (module-level cache dedupes across sections), and hands back a
// `c(key, fallback)` reader. Any missing/blank key falls back to the value
// hard-coded in the JSX, so the site renders correctly even if the API is down
// or a block was never created.

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

// page -> { data?: {}, promise?: Promise }
const cache = new Map()

async function fetchPage(page) {
  const res = await fetch(`${API_BASE}/public/site-content/?page=${encodeURIComponent(page)}`)
  if (!res.ok) throw new Error(`site-content ${res.status}`)
  return res.json()
}

export function useSiteContent(page) {
  const [data, setData] = useState(() => cache.get(page)?.data || null)

  useEffect(() => {
    let alive = true
    const entry = cache.get(page)
    if (entry?.data) {
      setData(entry.data)
      return () => { alive = false }
    }
    const promise = entry?.promise || fetchPage(page)
      .then((d) => { cache.set(page, { data: d }); return d })
      .catch(() => { cache.set(page, { data: {} }); return {} })
    if (!entry?.promise) cache.set(page, { promise })
    promise.then((d) => { if (alive) setData(d) })
    return () => { alive = false }
  }, [page])

  // Returns the CMS value for "section.key" when present and non-empty,
  // otherwise the supplied fallback (the original hard-coded copy/asset).
  const c = (key, fallback = '') => {
    const v = data?.[key]
    return v === undefined || v === null || v === '' ? fallback : v
  }

  return { c, ready: !!data }
}

export default useSiteContent
