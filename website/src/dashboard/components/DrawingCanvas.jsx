import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  PencilSimple, LineSegment, Square, Circle as CircleIcon, ArrowRight,
  TextT, ArrowCounterClockwise, ArrowClockwise, Trash, FloppyDisk,
  CircleNotch,
} from '@phosphor-icons/react'
import { useConfirm } from './ConfirmDialog'
import { toast } from 'sonner'

import { PrimaryButton, SecondaryButton } from './FormField'
import { useUploadProjectFileMutation } from '../store/api'

/**
 * In-app drawing tool — vector-shape based with full undo/redo.
 *
 * Tools: pen (freehand), line, rectangle, circle, arrow, text.
 * Shapes are kept as a serialised stack so undo/redo is non-destructive.
 * Save renders the current state to a PNG via canvas.toBlob and uploads it
 * as a ProjectFile (kind='plan').
 */

const SWATCHES = [
  '#111111', // lafoi-dark
  '#1A8A2E', // lafoi-green
  '#22C55E', // lafoi-green-light
  '#DC2626', // red
  '#2563EB', // blue
  '#D97706', // amber
  '#9333EA', // purple
  '#FFFFFF', // white
]

const TOOLS = [
  { key: 'pen', label: 'Pen', icon: PencilSimple },
  { key: 'line', label: 'Line', icon: LineSegment },
  { key: 'rect', label: 'Rectangle', icon: Square },
  { key: 'circle', label: 'Circle', icon: CircleIcon },
  { key: 'arrow', label: 'Arrow', icon: ArrowRight },
  { key: 'text', label: 'Text', icon: TextT },
]

const CANVAS_W = 960
const CANVAS_H = 600

function drawShape(ctx, shape) {
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = shape.color
  ctx.fillStyle = shape.color
  ctx.lineWidth = shape.width

  if (shape.type === 'pen') {
    const pts = shape.points
    if (pts.length < 2) return
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
    ctx.stroke()
  } else if (shape.type === 'line') {
    ctx.beginPath()
    ctx.moveTo(shape.x1, shape.y1)
    ctx.lineTo(shape.x2, shape.y2)
    ctx.stroke()
  } else if (shape.type === 'rect') {
    const x = Math.min(shape.x1, shape.x2)
    const y = Math.min(shape.y1, shape.y2)
    const w = Math.abs(shape.x2 - shape.x1)
    const h = Math.abs(shape.y2 - shape.y1)
    ctx.strokeRect(x, y, w, h)
  } else if (shape.type === 'circle') {
    const cx = (shape.x1 + shape.x2) / 2
    const cy = (shape.y1 + shape.y2) / 2
    const rx = Math.abs(shape.x2 - shape.x1) / 2
    const ry = Math.abs(shape.y2 - shape.y1) / 2
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    ctx.stroke()
  } else if (shape.type === 'arrow') {
    const { x1, y1, x2, y2 } = shape
    const angle = Math.atan2(y2 - y1, x2 - x1)
    const head = Math.max(10, shape.width * 3)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6))
    ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6))
    ctx.closePath()
    ctx.fill()
  } else if (shape.type === 'text') {
    ctx.font = `${Math.max(14, shape.width * 4)}px 'DM Sans', sans-serif`
    ctx.textBaseline = 'top'
    ctx.fillText(shape.text, shape.x1, shape.y1)
  }
  ctx.restore()
}

export default function DrawingCanvas({ projectId, onSaved, onClose, backgroundUrl = null }) {
  const confirm = useConfirm()
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState('#111111')
  const [width, setWidth] = useState(3)
  const [shapes, setShapes] = useState([]) // committed
  const [redoStack, setRedoStack] = useState([])
  const [drawing, setDrawing] = useState(null) // active in-progress shape
  const [bgImage, setBgImage] = useState(null)
  const [uploadFile, { isLoading: saving }] = useUploadProjectFileMutation()

  // Load optional background plan as image
  useEffect(() => {
    if (!backgroundUrl) { setBgImage(null); return }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setBgImage(img)
    img.onerror = () => setBgImage(null)
    img.src = backgroundUrl
  }, [backgroundUrl])

  // Render — runs whenever shapes / drawing change
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // cream background
    ctx.fillStyle = '#FAFAF8'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    // optional bg image, fitted
    if (bgImage) {
      const r = Math.min(canvas.width / bgImage.width, canvas.height / bgImage.height)
      const w = bgImage.width * r
      const h = bgImage.height * r
      ctx.drawImage(bgImage, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h)
    }
    for (const s of shapes) drawShape(ctx, s)
    if (drawing) drawShape(ctx, drawing)
  }, [shapes, drawing, bgImage])

  useEffect(() => { render() }, [render])

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const point = e.touches?.[0] || e
    return {
      x: (point.clientX - rect.left) * scaleX,
      y: (point.clientY - rect.top) * scaleY,
    }
  }

  const handleStart = (e) => {
    e.preventDefault()
    const { x, y } = getPos(e)
    if (tool === 'text') {
      const text = window.prompt('Text:')
      if (!text) return
      setShapes((s) => [...s, { type: 'text', x1: x, y1: y, text, color, width }])
      setRedoStack([])
      return
    }
    const base = { type: tool, color, width }
    if (tool === 'pen') setDrawing({ ...base, points: [{ x, y }] })
    else setDrawing({ ...base, x1: x, y1: y, x2: x, y2: y })
  }

  const handleMove = (e) => {
    if (!drawing) return
    e.preventDefault()
    const { x, y } = getPos(e)
    if (drawing.type === 'pen') {
      setDrawing((d) => ({ ...d, points: [...d.points, { x, y }] }))
    } else {
      setDrawing((d) => ({ ...d, x2: x, y2: y }))
    }
  }

  const handleEnd = () => {
    if (!drawing) return
    setShapes((s) => [...s, drawing])
    setRedoStack([])
    setDrawing(null)
  }

  const undo = () => {
    if (shapes.length === 0) return
    const next = shapes.slice(0, -1)
    setRedoStack((r) => [shapes[shapes.length - 1], ...r])
    setShapes(next)
  }
  const redo = () => {
    if (redoStack.length === 0) return
    const [first, ...rest] = redoStack
    setShapes((s) => [...s, first])
    setRedoStack(rest)
  }
  const clear = async () => {
    if (shapes.length === 0) return
    if (!(await confirm({ title: 'Clear the canvas?', message: 'Anything you\'ve drawn will be erased.', confirmLabel: 'Clear', danger: true }))) return
    setShapes([])
    setRedoStack([])
  }

  const handleSave = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(async (blob) => {
      if (!blob) {
        toast.error('Could not export drawing')
        return
      }
      const fd = new FormData()
      fd.append('project', String(projectId))
      fd.append('kind', 'plan')
      const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)
      const filename = `sketch-${stamp}.png`
      fd.append('title', `Sketch · ${new Date().toLocaleDateString()}`)
      fd.append('description', 'Created with the in-app drawing tool')
      fd.append('file', new File([blob], filename, { type: 'image/png' }))
      try {
        await uploadFile(fd).unwrap()
        toast.success('Drawing saved', { description: filename })
        onSaved?.()
        onClose?.()
      } catch (err) {
        const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Could not save drawing.'
        toast.error('Save failed', { description: msg })
      }
    }, 'image/png')
  }

  return (
    <div className="grid gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl border border-lafoi-dark/10 bg-white">
        {/* Tools */}
        <div className="flex items-center gap-1">
          {TOOLS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTool(key)}
              title={label}
              aria-label={label}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                tool === key
                  ? 'bg-lafoi-dark text-white'
                  : 'bg-lafoi-cream/50 text-lafoi-gray hover:bg-lafoi-cream hover:text-lafoi-dark'
              }`}
            >
              <Icon size={16} weight={tool === key ? 'fill' : 'regular'} />
            </button>
          ))}
        </div>

        <span aria-hidden className="h-6 w-px bg-lafoi-dark/10" />

        {/* Colours */}
        <div className="flex items-center gap-1.5">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              title={c}
              aria-label={`Colour ${c}`}
              className={`w-6 h-6 rounded-full border transition-transform ${
                color === c ? 'scale-110 border-lafoi-dark ring-2 ring-lafoi-green/30' : 'border-lafoi-dark/15'
              }`}
              style={{ background: c }}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-7 h-7 rounded-full border border-lafoi-dark/15 bg-transparent cursor-pointer"
            title="Custom colour"
          />
        </div>

        <span aria-hidden className="h-6 w-px bg-lafoi-dark/10" />

        {/* Width */}
        <label className="flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase font-sora text-lafoi-gray-medium">
          <span>Width</span>
          <input
            type="range"
            min="1"
            max="12"
            step="1"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="w-24 accent-lafoi-green"
          />
          <span className="w-5 text-right tabular-nums text-lafoi-dark">{width}</span>
        </label>

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={undo}
            disabled={shapes.length === 0}
            title="Undo"
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-lafoi-cream/50 text-lafoi-gray hover:bg-lafoi-cream hover:text-lafoi-dark disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowCounterClockwise size={16} />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={redoStack.length === 0}
            title="Redo"
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-lafoi-cream/50 text-lafoi-gray hover:bg-lafoi-cream hover:text-lafoi-dark disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowClockwise size={16} />
          </button>
          <button
            type="button"
            onClick={clear}
            disabled={shapes.length === 0}
            title="Clear"
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-lafoi-cream/50 text-lafoi-gray hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash size={16} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={wrapRef}
        className="rounded-2xl border border-lafoi-dark/10 bg-lafoi-cream overflow-hidden"
        style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="block w-full h-full cursor-crosshair touch-none"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-lafoi-gray-medium">
          {shapes.length === 0 ? 'Choose a tool and start sketching.' : `${shapes.length} shape${shapes.length === 1 ? '' : 's'} on canvas`}
        </p>
        <div className="flex items-center gap-2">
          <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton type="button" onClick={handleSave} disabled={saving || shapes.length === 0}>
            {saving ? (<><CircleNotch size={14} className="animate-spin" /> Saving…</>) : (<><FloppyDisk size={14} weight="bold" /> Save sketch</>)}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
