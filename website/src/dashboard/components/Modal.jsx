import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@phosphor-icons/react'

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const widthClass = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  }[size]

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center p-4 sm:p-8 overflow-y-auto">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-3xl shadow-2xl w-full ${widthClass} max-h-[92vh] flex flex-col overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-lafoi-dark/8">
          <h3 className="font-display text-xl tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-1.5 -mr-1 rounded-lg text-lafoi-gray hover:bg-lafoi-cream">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-lafoi-dark/8 bg-lafoi-cream/60 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
