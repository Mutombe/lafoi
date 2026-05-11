import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Warning, X } from '@phosphor-icons/react'

/**
 * Promise-based confirmation modal — the dashboard's replacement for
 * window.confirm().
 *
 * Usage:
 *
 *   import { useConfirm } from '../components/ConfirmDialog'
 *
 *   const confirm = useConfirm()
 *   const ok = await confirm({
 *     title: 'Delete customer?',
 *     message: `"${name}" will be removed permanently. This cannot be undone.`,
 *     confirmLabel: 'Delete',
 *     danger: true,
 *   })
 *   if (!ok) return
 *
 * Wrap the dashboard's root in <ConfirmProvider> once; the hook reads from
 * the surrounding context, opens a portaled modal, and resolves with
 * `true` / `false` when the user clicks confirm or cancel / Escape / the
 * backdrop. Stack-safe: multiple confirmations can sit on top of each
 * other and each resolves its own promise.
 *
 * Keyboard:
 *   Enter   — confirm (only when no other element is focused)
 *   Escape  — cancel
 *
 * Visual style matches the rest of the dashboard: rounded corners,
 * lafoi-green accents, hairline borders, restrained motion.
 */

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  // A stack of open requests so nested confirmations behave sanely.
  const [stack, setStack] = useState([])
  const idRef = useRef(0)

  const open = useCallback((opts) => {
    return new Promise((resolve) => {
      idRef.current += 1
      const id = idRef.current
      const entry = {
        id,
        title: opts?.title ?? 'Are you sure?',
        message: opts?.message ?? '',
        confirmLabel: opts?.confirmLabel ?? 'Confirm',
        cancelLabel: opts?.cancelLabel ?? 'Cancel',
        danger: !!opts?.danger,
        icon: opts?.icon ?? null,
        resolve,
      }
      setStack((s) => [...s, entry])
    })
  }, [])

  const close = useCallback((id, value) => {
    setStack((s) => {
      const entry = s.find((e) => e.id === id)
      if (entry) entry.resolve(value)
      return s.filter((e) => e.id !== id)
    })
  }, [])

  return (
    <ConfirmContext.Provider value={open}>
      {children}
      {/* Portaled stack of dialogs */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {stack.map((entry) => (
            <ConfirmModal
              key={entry.id}
              entry={entry}
              onClose={(value) => close(entry.id, value)}
            />
          ))}
        </AnimatePresence>,
        document.body,
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    // Fallback to window.confirm so call sites still work in tests / pages
    // that haven't been wrapped in ConfirmProvider yet.
    return async (opts) => {
      const text = [opts?.title, opts?.message].filter(Boolean).join('\n\n')
      // eslint-disable-next-line no-alert
      return window.confirm(text || 'Are you sure?')
    }
  }
  return ctx
}

function ConfirmModal({ entry, onClose }) {
  const { title, message, confirmLabel, cancelLabel, danger } = entry
  const confirmBtnRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose(false)
      } else if (e.key === 'Enter') {
        // Only auto-confirm when focus isn't inside a typing field
        const t = document.activeElement
        const tag = t?.tagName
        if (tag === 'TEXTAREA' || (tag === 'INPUT' && t.type !== 'button')) return
        e.preventDefault()
        onClose(true)
      }
    }
    window.addEventListener('keydown', onKey, true)
    // Lock body scroll
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Focus the primary action so Enter / Space land naturally
    queueMicrotask(() => confirmBtnRef.current?.focus())
    return () => {
      window.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={() => onClose(false)}
        aria-hidden
      />

      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`confirm-${entry.id}-title`}
        aria-describedby={`confirm-${entry.id}-message`}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-[0_24px_60px_-20px_rgba(17,17,17,0.4)] overflow-hidden"
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Hairline accent — green by default, red when dangerous */}
        <div className={`h-1 w-full ${danger ? 'bg-red-500' : 'bg-lafoi-green'}`} aria-hidden />

        <div className="px-6 pt-5 pb-2 flex items-start gap-3">
          <div className={`mt-0.5 w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
            danger ? 'bg-red-50 text-red-600' : 'bg-lafoi-green/10 text-lafoi-green-dark'
          }`}>
            <Warning size={18} weight="fill" />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              id={`confirm-${entry.id}-title`}
              className="font-display text-lg sm:text-xl text-lafoi-dark leading-tight"
            >
              {title}
            </h2>
            {message && (
              <p
                id={`confirm-${entry.id}-message`}
                className="mt-2 text-sm text-lafoi-gray font-body leading-relaxed"
              >
                {message}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onClose(false)}
            className="p-1.5 -mr-1 -mt-1 rounded-lg text-lafoi-gray-medium hover:text-lafoi-dark hover:bg-lafoi-cream transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pt-4 pb-5 flex items-center justify-end gap-2 border-t border-lafoi-dark/[0.06] bg-lafoi-cream/40">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="px-4 py-2 rounded-full text-sm font-sora text-lafoi-gray hover:text-lafoi-dark hover:bg-white border border-lafoi-dark/15 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={() => onClose(true)}
            className={`px-5 py-2 rounded-full text-sm font-sora font-medium text-white transition-colors ${
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-lafoi-dark hover:bg-lafoi-green'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
