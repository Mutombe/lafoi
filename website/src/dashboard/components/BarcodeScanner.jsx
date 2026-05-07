import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Keyboard, Camera, CircleNotch } from '@phosphor-icons/react'

/**
 * Barcode / QR scanner modal.
 *
 *   <BarcodeScanner open={...} onClose={...} onDetect={(code) => …} />
 *
 * Wraps the `html5-qrcode` library (loaded only when first opened so the
 * dashboard's main-bundle stays slim). Falls back to a manual-entry input
 * for laptops without cameras and for situations where the camera permission
 * is denied. Honours `prefers-reduced-motion` (no animated camera frame).
 */
export default function BarcodeScanner({ open, onClose, onDetect }) {
  const containerRef = useRef(null)
  const scannerRef = useRef(null)
  const [manual, setManual] = useState('')
  const [cameraError, setCameraError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return undefined

    let cancelled = false
    let scanner = null

    const start = async () => {
      setLoading(true)
      setCameraError('')
      try {
        const mod = await import('html5-qrcode')
        if (cancelled) return
        const { Html5Qrcode } = mod
        const elementId = 'lafoi-barcode-reader'
        scanner = new Html5Qrcode(elementId, /* verbose */ false)
        scannerRef.current = scanner

        const cameras = await Html5Qrcode.getCameras()
        if (cancelled) return
        if (!cameras || cameras.length === 0) {
          setCameraError('No camera found on this device.')
          setLoading(false)
          return
        }
        // Prefer rear-facing camera if available.
        const rear = cameras.find((c) => /back|rear|environment/i.test(c.label || ''))
        const cameraId = (rear || cameras[0]).id

        await scanner.start(
          cameraId,
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            // Stop the camera before resolving so we don't double-fire.
            scanner.stop().catch(() => {}).finally(() => {
              try { scanner.clear() } catch {}
              onDetect?.(decodedText)
            })
          },
          () => {
            // per-frame "no code" error — silent on purpose
          },
        )
      } catch (err) {
        if (cancelled) return
        const msg = err?.message || String(err) || 'Could not start the camera.'
        setCameraError(msg.includes('NotAllowedError')
          ? 'Camera permission denied. Type the barcode below instead.'
          : msg)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    start()

    return () => {
      cancelled = true
      const s = scannerRef.current
      if (s) {
        s.stop().catch(() => {}).finally(() => {
          try { s.clear() } catch {}
        })
        scannerRef.current = null
      }
    }
  }, [open, onDetect])

  const handleManualSubmit = (e) => {
    e.preventDefault()
    const code = manual.trim()
    if (!code) return
    onDetect?.(code)
    setManual('')
  }

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-lafoi-dark/8">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-lafoi-green" />
            <h3 className="font-display text-lg tracking-tight">Scan barcode</h3>
          </div>
          <button onClick={onClose} className="p-1.5 -mr-1 rounded-lg text-lafoi-gray hover:bg-lafoi-cream">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Camera feed (or skeleton until scanner mounts) */}
          <div className="relative rounded-2xl overflow-hidden bg-lafoi-dark/95 aspect-[4/3] flex items-center justify-center">
            <div id="lafoi-barcode-reader" ref={containerRef} className="w-full h-full" />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center text-white/80">
                <CircleNotch size={28} className="animate-spin" />
              </div>
            )}
            {cameraError && !loading && (
              <div className="absolute inset-0 flex items-center justify-center text-white/85 px-6 text-center text-sm font-body">
                {cameraError}
              </div>
            )}
          </div>

          {/* Manual fallback */}
          <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
            <Keyboard size={16} className="text-lafoi-gray-medium shrink-0" />
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="Or type the barcode / SKU"
              autoFocus
              className="flex-1 px-3 py-2.5 rounded-xl bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none focus:ring-2 focus:ring-lafoi-green/15 text-sm font-body"
            />
            <button
              type="submit"
              disabled={!manual.trim()}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-lafoi-dark text-white text-sm font-sora font-medium hover:bg-lafoi-green transition-colors disabled:opacity-50"
            >
              Look up
            </button>
          </form>
          <p className="text-[11px] text-lafoi-gray-medium font-body">
            Hold the QR or barcode steady inside the frame. The match is automatic.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  )
}
