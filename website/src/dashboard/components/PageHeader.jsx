import React from 'react'

/**
 * Consistent header for every dashboard page.
 *   <PageHeader eyebrow="Customers" title="People we build for" actions={<button.../>} />
 */
export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <span aria-hidden className="block w-8 h-px bg-lafoi-green/60" />
          <p className="font-sora text-[10px] font-semibold tracking-[0.3em] uppercase text-lafoi-green">
            {eyebrow}
          </p>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.6rem] leading-[1.05] tracking-[-0.02em]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-lafoi-gray font-light">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
