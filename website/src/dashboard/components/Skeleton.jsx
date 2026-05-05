import React from 'react'

/**
 * Skeleton — restrained, brand-aligned shimmer placeholder.
 *
 * Uses the existing `.img-placeholder` shimmer from index.css so the animation
 * cadence is consistent with the rest of the site. Wrap-and-go primitive:
 *
 *   <Skeleton className="h-4 w-32" />
 *   <Skeleton variant="circle" className="h-10 w-10" />
 *   <Skeleton variant="block" className="h-32" />
 *
 * Variants:
 *   - "line" (default): rounded-full, ideal for text rows
 *   - "block": rounded-xl, ideal for cards / tiles
 *   - "circle": rounded-full square, ideal for avatars
 */
export default function Skeleton({ variant = 'line', className = '', style }) {
  const radius = variant === 'block' ? 'rounded-xl' : variant === 'circle' ? 'rounded-full' : 'rounded-full'
  return (
    <span
      aria-hidden
      className={`block img-placeholder ${radius} ${className}`}
      style={style}
    />
  )
}

/** A whole table row of skeleton cells, sized to the columns. */
export function SkeletonTableRow({ columns = 6 }) {
  return (
    <tr className="border-b border-lafoi-dark/[0.06] last:border-b-0">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-4 align-middle">
          <Skeleton className="h-3 w-3/4 max-w-[180px]" />
        </td>
      ))}
    </tr>
  )
}

/** Stat card skeleton — matches the Overview/Payroll Stat shape. */
export function SkeletonStat({ accent = 'cream' }) {
  const ring = accent === 'green' ? 'border-lafoi-green/25 bg-lafoi-green/[0.04]' : 'border-lafoi-dark/10 bg-white'
  return (
    <div className={`relative p-5 rounded-2xl border ${ring}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-2.5 w-20 mb-3" />
          <Skeleton variant="block" className="h-8 w-24" />
        </div>
        <Skeleton variant="circle" className="h-10 w-10 shrink-0" />
      </div>
    </div>
  )
}

/** A row of three skeleton list items — used in the Overview side panels. */
export function SkeletonListItems({ count = 4 }) {
  return (
    <ul className="divide-y divide-lafoi-dark/[0.06]">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="px-5 py-3.5 flex items-center gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
          <Skeleton variant="block" className="h-5 w-16" />
        </li>
      ))}
    </ul>
  )
}

/** Detail-page header skeleton — eyebrow + headline + description. */
export function SkeletonPageHeader() {
  return (
    <div className="mb-8">
      <Skeleton className="h-2.5 w-24 mb-3" />
      <Skeleton variant="block" className="h-9 w-1/2 max-w-md mb-2" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  )
}
