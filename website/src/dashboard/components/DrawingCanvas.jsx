import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import {
  PencilSimple, LineSegment, Square, Circle as CircleIcon, ArrowRight,
  TextT, ArrowCounterClockwise, ArrowClockwise, Trash, FloppyDisk,
  CircleNotch, ArrowsOutCardinal, Eraser, Hand, Image as ImageIcon,
  CornersOut, CornersIn, MagnifyingGlassPlus, MagnifyingGlassMinus,
  X as XIcon,
} from '@phosphor-icons/react'
import { useConfirm } from './ConfirmDialog'
import { toast } from 'sonner'

import { PrimaryButton, SecondaryButton } from './FormField'
import { useUploadProjectFileMutation } from '../store/api'

/**
 * Advanced in-app drawing tool.
 *
 * Vector-based: every stroke is a Shape kept in a serialised stack so the
 * scene can be re-rendered cleanly after any edit (move, resize, delete,
 * zoom, pan). Save flattens to PNG via canvas.toBlob and uploads as a
 * ProjectFile (kind='plan').
 *
 * Tools
 *   select  — click to pick a shape, drag body to move, drag handles to resize
 *   pen     — freehand stroke
 *   line / rect / circle / arrow — primitives drawn click-and-drag
 *   text    — type text at click point
 *   eraser  — click to delete the topmost shape under the pointer
 *   pan     — drag the view (also when holding space + dragging)
 *
 * View
 *   - Wheel scrolls zoom around the pointer (ctrl+wheel on macs)
 *   - Pinch (two finger) on touch devices zooms + pans
 *   - Fullscreen toggle (mobile + desktop) — the whole tool becomes a
 *     fixed-position viewport so you can sketch with the whole screen.
 *   - Image insert: pick a PNG/JPG, lands as a movable + resizable shape.
 *
 * Coordinate system
 *   Shapes are stored in WORLD space (no pan/zoom baked in). The canvas
 *   transform applies viewOffset + viewScale at render time, and the
 *   pointer-handling helpers map client coords → canvas → world.
 */

const SWATCHES = [
  '#111111', '#1A8A2E', '#22C55E', '#DC2626',
  '#2563EB', '#D97706', '#9333EA', '#FFFFFF',
]

const TOOLS = [
  { key: 'select', label: 'Select / Move',   icon: ArrowsOutCardinal },
  { key: 'pen',    label: 'Pen',             icon: PencilSimple },
  { key: 'line',   label: 'Line',            icon: LineSegment },
  { key: 'rect',   label: 'Rectangle',       icon: Square },
  { key: 'circle', label: 'Circle',          icon: CircleIcon },
  { key: 'arrow',  label: 'Arrow',           icon: ArrowRight },
  { key: 'text',   label: 'Text',            icon: TextT },
  { key: 'eraser', label: 'Eraser',          icon: Eraser },
  { key: 'pan',    label: 'Pan',             icon: Hand },
]

const CANVAS_W = 1600
const CANVAS_H = 1000
const HANDLE_PX = 8

let _shapeId = 0
const nextId = () => ++_shapeId

// ----- Shape geometry helpers ------------------------------------------------

function getBounds(shape) {
  if (shape.type === 'pen') {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const p of shape.points) {
      if (p.x < minX) minX = p.x
      if (p.y < minY) minY = p.y
      if (p.x > maxX) maxX = p.x
      if (p.y > maxY) maxY = p.y
    }
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
  }
  if (shape.type === 'text') {
    // Approximate text bounding box from font size + glyph count.
    const size = Math.max(14, shape.width * 4)
    const w = (shape.text?.length || 1) * size * 0.55
    const h = size * 1.1
    return { x: shape.x1, y: shape.y1, w, h }
  }
  if (shape.type === 'image') {
    return { x: shape.x1, y: shape.y1, w: shape.x2 - shape.x1, h: shape.y2 - shape.y1 }
  }
  // line / rect / circle / arrow
  const x = Math.min(shape.x1, shape.x2)
  const y = Math.min(shape.y1, shape.y2)
  const w = Math.abs(shape.x2 - shape.x1)
  const h = Math.abs(shape.y2 - shape.y1)
  return { x, y, w, h }
}

function pointInBounds(b, x, y, padding = 0) {
  return x >= b.x - padding && x <= b.x + b.w + padding && y >= b.y - padding && y <= b.y + b.h + padding
}

function distancePointToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(px - x1, py - y1)
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

function hitTestShape(shape, x, y, tol = 6) {
  if (shape.type === 'pen') {
    const pts = shape.points
    for (let i = 1; i < pts.length; i++) {
      if (distancePointToSegment(x, y, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y) <= tol + shape.width / 2) return true
    }
    return false
  }
  if (shape.type === 'line' || shape.type === 'arrow') {
    return distancePointToSegment(x, y, shape.x1, shape.y1, shape.x2, shape.y2) <= tol + shape.width / 2
  }
  if (shape.type === 'rect') {
    const b = getBounds(shape)
    return pointInBounds(b, x, y)
  }
  if (shape.type === 'circle') {
    const cx = (shape.x1 + shape.x2) / 2
    const cy = (shape.y1 + shape.y2) / 2
    const rx = Math.abs(shape.x2 - shape.x1) / 2
    const ry = Math.abs(shape.y2 - shape.y1) / 2
    if (rx === 0 || ry === 0) return false
    const dx = (x - cx) / rx, dy = (y - cy) / ry
    return dx * dx + dy * dy <= 1.1
  }
  if (shape.type === 'text' || shape.type === 'image') {
    return pointInBounds(getBounds(shape), x, y)
  }
  return false
}

function moveShape(shape, dx, dy) {
  if (shape.type === 'pen') {
    return { ...shape, points: shape.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) }
  }
  return { ...shape, x1: shape.x1 + dx, y1: shape.y1 + dy, x2: (shape.x2 ?? shape.x1) + dx, y2: (shape.y2 ?? shape.y1) + dy }
}

// Resize handles map: tl, tr, bl, br (corners only — pen/text resize from BR
// only since their geometry isn't aspect-locked the same way).
const HANDLE_KEYS = ['tl', 'tr', 'bl', 'br']
function handleAt(b, key) {
  switch (key) {
    case 'tl': return { x: b.x,       y: b.y }
    case 'tr': return { x: b.x + b.w, y: b.y }
    case 'bl': return { x: b.x,       y: b.y + b.h }
    case 'br': return { x: b.x + b.w, y: b.y + b.h }
    default:   return { x: b.x, y: b.y }
  }
}

function resizeShapeViaHandle(shape, handle, x, y) {
  const b = getBounds(shape)
  let newX = b.x, newY = b.y, newW = b.w, newH = b.h
  if (handle === 'tl') { newX = x; newY = y; newW = b.x + b.w - x; newH = b.y + b.h - y }
  if (handle === 'tr') { newY = y; newW = x - b.x; newH = b.y + b.h - y }
  if (handle === 'bl') { newX = x; newW = b.x + b.w - x; newH = y - b.y }
  if (handle === 'br') { newW = x - b.x; newH = y - b.y }
  if (newW <= 0 || newH <= 0) return shape

  if (shape.type === 'pen') {
    const oldB = b
    // Scale all points proportionally to the new bounds.
    return {
      ...shape,
      points: shape.points.map((p) => ({
        x: newX + ((p.x - oldB.x) / oldB.w) * newW,
        y: newY + ((p.y - oldB.y) / oldB.h) * newH,
      })),
    }
  }
  if (shape.type === 'text' || shape.type === 'image') {
    return { ...shape, x1: newX, y1: newY, x2: newX + newW, y2: newY + newH }
  }
  // line / arrow / rect / circle — recompute x1,y1,x2,y2 from new bounds.
  return { ...shape, x1: newX, y1: newY, x2: newX + newW, y2: newY + newH }
}

// ----- Rendering -------------------------------------------------------------

function drawShape(ctx, shape) {
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = shape.color
  ctx.fillStyle = shape.color
  ctx.lineWidth = shape.width

  if (shape.type === 'pen') {
    const pts = shape.points
    if (pts.length < 2) { ctx.restore(); return }
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
    const b = getBounds(shape)
    ctx.strokeRect(b.x, b.y, b.w, b.h)
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
  } else if (shape.type === 'image' && shape.img) {
    const b = getBounds(shape)
    ctx.drawImage(shape.img, b.x, b.y, b.w, b.h)
  }
  ctx.restore()
}

function drawSelectionFrame(ctx, shape, scale) {
  if (!shape) return
  const b = getBounds(shape)
  ctx.save()
  ctx.strokeStyle = '#1A8A2E'
  ctx.lineWidth = 1.5 / scale
  ctx.setLineDash([6 / scale, 4 / scale])
  ctx.strokeRect(b.x - 2 / scale, b.y - 2 / scale, b.w + 4 / scale, b.h + 4 / scale)
  ctx.setLineDash([])
  // handles
  ctx.fillStyle = '#FFFFFF'
  ctx.strokeStyle = '#1A8A2E'
  ctx.lineWidth = 1.5 / scale
  const s = HANDLE_PX / scale
  for (const key of HANDLE_KEYS) {
    const h = handleAt(b, key)
    ctx.fillRect(h.x - s / 2, h.y - s / 2, s, s)
    ctx.strokeRect(h.x - s / 2, h.y - s / 2, s, s)
  }
  ctx.restore()
}

// ----- Component -------------------------------------------------------------

export default function DrawingCanvas({ projectId, onSaved, onClose, backgroundUrl = null }) {
  const confirm = useConfirm()
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const rootRef = useRef(null)
  const fileInputRef = useRef(null)
  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState('#111111')
  const [width, setWidth] = useState(3)
  const [shapes, setShapes] = useState([])  // committed
  const [redoStack, setRedoStack] = useState([])
  const [drawing, setDrawing] = useState(null)  // in-progress shape (drawing mode)
  const [selectedId, setSelectedId] = useState(null)
  const [bgImage, setBgImage] = useState(null)
  const [uploadFile, { isLoading: saving }] = useUploadProjectFileMutation()

  // View transform
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 })
  const [viewScale, setViewScale] = useState(1)

  // Drag state for select tool
  const dragRef = useRef(null)  // { mode, startWorld, originalShape, handle }

  // Fullscreen
  const [fullscreen, setFullscreen] = useState(false)

  // Load optional background plan as image
  useEffect(() => {
    if (!backgroundUrl) { setBgImage(null); return }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setBgImage(img)
    img.onerror = () => setBgImage(null)
    img.src = backgroundUrl
  }, [backgroundUrl])

  const selectedShape = useMemo(
    () => shapes.find((s) => s.id === selectedId) || null,
    [shapes, selectedId],
  )

  // Render — runs whenever shapes / drawing / view / selection / bg change
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // cream background
    ctx.fillStyle = '#FAFAF8'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Apply view transform — shapes are stored in world space.
    ctx.translate(viewOffset.x, viewOffset.y)
    ctx.scale(viewScale, viewScale)

    // optional bg image, fitted to canvas dimensions in world space
    if (bgImage) {
      const r = Math.min(canvas.width / bgImage.width, canvas.height / bgImage.height)
      const w = bgImage.width * r
      const h = bgImage.height * r
      ctx.drawImage(bgImage, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h)
    }

    for (const s of shapes) drawShape(ctx, s)
    if (drawing) drawShape(ctx, drawing)

    // Selection overlay last
    if (selectedShape) drawSelectionFrame(ctx, selectedShape, viewScale)
  }, [shapes, drawing, bgImage, viewOffset, viewScale, selectedShape])

  useEffect(() => { render() }, [render])

  // Pointer → world coordinates (accounts for canvas CSS scaling + view).
  const getWorldPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const point = e.touches?.[0] || e
    const canvasX = (point.clientX - rect.left) * scaleX
    const canvasY = (point.clientY - rect.top) * scaleY
    return {
      x: (canvasX - viewOffset.x) / viewScale,
      y: (canvasY - viewOffset.y) / viewScale,
    }
  }

  const findShapeAt = (wx, wy) => {
    // Topmost first
    const handleTol = HANDLE_PX / viewScale
    if (selectedShape) {
      const b = getBounds(selectedShape)
      for (const key of HANDLE_KEYS) {
        const h = handleAt(b, key)
        if (Math.abs(h.x - wx) <= handleTol && Math.abs(h.y - wy) <= handleTol) {
          return { shape: selectedShape, handle: key }
        }
      }
    }
    for (let i = shapes.length - 1; i >= 0; i--) {
      if (hitTestShape(shapes[i], wx, wy, 6 / viewScale)) return { shape: shapes[i], handle: null }
    }
    return null
  }

  const handleStart = (e) => {
    if (e.type === 'touchstart' && e.touches?.length === 2) {
      // Start pinch — capture the two touches and stop here.
      e.preventDefault()
      const t1 = e.touches[0], t2 = e.touches[1]
      pinchRef.current = {
        startDist: Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY),
        startScale: viewScale,
        startOffset: viewOffset,
        center: { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 },
      }
      return
    }
    e.preventDefault()
    const w = getWorldPos(e)

    if (tool === 'pan') {
      dragRef.current = { mode: 'pan', startClient: { x: e.touches?.[0]?.clientX ?? e.clientX, y: e.touches?.[0]?.clientY ?? e.clientY }, startOffset: { ...viewOffset } }
      return
    }
    if (tool === 'select') {
      const hit = findShapeAt(w.x, w.y)
      if (hit) {
        setSelectedId(hit.shape.id)
        if (hit.handle) {
          dragRef.current = { mode: 'resize', handle: hit.handle, original: hit.shape }
        } else {
          dragRef.current = { mode: 'move', startWorld: w, original: hit.shape }
        }
      } else {
        setSelectedId(null)
      }
      return
    }
    if (tool === 'eraser') {
      const hit = findShapeAt(w.x, w.y)
      if (hit) {
        setShapes((s) => s.filter((x) => x.id !== hit.shape.id))
        setSelectedId(null)
        setRedoStack([])
      }
      return
    }
    if (tool === 'text') {
      const text = window.prompt('Text:')
      if (!text) return
      setShapes((s) => [...s, { id: nextId(), type: 'text', x1: w.x, y1: w.y, text, color, width }])
      setRedoStack([])
      return
    }
    const base = { id: nextId(), type: tool, color, width }
    if (tool === 'pen') setDrawing({ ...base, points: [{ x: w.x, y: w.y }] })
    else setDrawing({ ...base, x1: w.x, y1: w.y, x2: w.x, y2: w.y })
  }

  const pinchRef = useRef(null)

  const handleMove = (e) => {
    if (e.type === 'touchmove' && e.touches?.length === 2 && pinchRef.current) {
      e.preventDefault()
      const t1 = e.touches[0], t2 = e.touches[1]
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
      const ratio = dist / pinchRef.current.startDist
      const newScale = Math.max(0.25, Math.min(4, pinchRef.current.startScale * ratio))
      // pan to keep the pinch centre stable
      const rect = canvasRef.current.getBoundingClientRect()
      const canvasScaleX = canvasRef.current.width / rect.width
      const canvasScaleY = canvasRef.current.height / rect.height
      const cx = (pinchRef.current.center.x - rect.left) * canvasScaleX
      const cy = (pinchRef.current.center.y - rect.top) * canvasScaleY
      const worldX = (cx - pinchRef.current.startOffset.x) / pinchRef.current.startScale
      const worldY = (cy - pinchRef.current.startOffset.y) / pinchRef.current.startScale
      setViewScale(newScale)
      setViewOffset({ x: cx - worldX * newScale, y: cy - worldY * newScale })
      return
    }

    if (dragRef.current?.mode === 'pan') {
      e.preventDefault()
      const point = e.touches?.[0] || e
      const dx = point.clientX - dragRef.current.startClient.x
      const dy = point.clientY - dragRef.current.startClient.y
      setViewOffset({ x: dragRef.current.startOffset.x + dx, y: dragRef.current.startOffset.y + dy })
      return
    }
    if (dragRef.current?.mode === 'move') {
      e.preventDefault()
      const w = getWorldPos(e)
      const dx = w.x - dragRef.current.startWorld.x
      const dy = w.y - dragRef.current.startWorld.y
      const original = dragRef.current.original
      setShapes((s) => s.map((shape) => shape.id === original.id ? moveShape(original, dx, dy) : shape))
      return
    }
    if (dragRef.current?.mode === 'resize') {
      e.preventDefault()
      const w = getWorldPos(e)
      const original = dragRef.current.original
      setShapes((s) => s.map((shape) => shape.id === original.id ? resizeShapeViaHandle(original, dragRef.current.handle, w.x, w.y) : shape))
      return
    }

    if (!drawing) return
    e.preventDefault()
    const w = getWorldPos(e)
    if (drawing.type === 'pen') {
      setDrawing((d) => ({ ...d, points: [...d.points, { x: w.x, y: w.y }] }))
    } else {
      setDrawing((d) => ({ ...d, x2: w.x, y2: w.y }))
    }
  }

  const handleEnd = () => {
    pinchRef.current = null
    if (dragRef.current) {
      dragRef.current = null
      setRedoStack([])
      return
    }
    if (!drawing) return
    setShapes((s) => [...s, drawing])
    setRedoStack([])
    setDrawing(null)
  }

  // Wheel zoom (desktop)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onWheel = (e) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const sx = canvas.width / rect.width
      const sy = canvas.height / rect.height
      const cx = (e.clientX - rect.left) * sx
      const cy = (e.clientY - rect.top) * sy
      const worldX = (cx - viewOffset.x) / viewScale
      const worldY = (cy - viewOffset.y) / viewScale
      const factor = Math.exp(-e.deltaY * 0.0015)
      const newScale = Math.max(0.25, Math.min(4, viewScale * factor))
      setViewScale(newScale)
      setViewOffset({ x: cx - worldX * newScale, y: cy - worldY * newScale })
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [viewOffset, viewScale])

  // Keyboard: Delete, Esc, Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z, Space-for-pan, F for
  // fullscreen.
  useEffect(() => {
    const onKey = (e) => {
      // Don't hijack typing in inputs / form fields.
      if (e.target.matches?.('input, textarea, select')) return
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault()
        setShapes((s) => s.filter((x) => x.id !== selectedId))
        setSelectedId(null)
        setRedoStack([])
      } else if (e.key === 'Escape') {
        setSelectedId(null)
        if (fullscreen) setFullscreen(false)
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          // redo
          if (redoStack.length === 0) return
          const [first, ...rest] = redoStack
          setShapes((s) => [...s, first])
          setRedoStack(rest)
        } else {
          // undo
          if (shapes.length === 0) return
          const next = shapes.slice(0, -1)
          setRedoStack((r) => [shapes[shapes.length - 1], ...r])
          setShapes(next)
        }
      } else if (e.key === 'f' || e.key === 'F') {
        setFullscreen((f) => !f)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, shapes, redoStack, fullscreen])

  const undo = () => {
    if (shapes.length === 0) return
    setRedoStack((r) => [shapes[shapes.length - 1], ...r])
    setShapes(shapes.slice(0, -1))
    setSelectedId(null)
  }
  const redo = () => {
    if (redoStack.length === 0) return
    const [first, ...rest] = redoStack
    setShapes((s) => [...s, first])
    setRedoStack(rest)
  }
  const clearAll = async () => {
    if (shapes.length === 0) return
    if (!(await confirm({ title: 'Clear the canvas?', message: 'Everything you\'ve drawn will be erased.', confirmLabel: 'Clear', danger: true }))) return
    setShapes([])
    setRedoStack([])
    setSelectedId(null)
  }

  const resetView = () => {
    setViewOffset({ x: 0, y: 0 })
    setViewScale(1)
  }

  const handleImageInsert = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        // Place at the centre of the visible viewport at native size (scaled
        // down if huge).
        const maxDim = 600
        const ratio = Math.min(1, maxDim / Math.max(img.width, img.height))
        const w = img.width * ratio
        const h = img.height * ratio
        const cx = (-viewOffset.x + (canvasRef.current?.width || CANVAS_W) / 2) / viewScale
        const cy = (-viewOffset.y + (canvasRef.current?.height || CANVAS_H) / 2) / viewScale
        const shape = {
          id: nextId(),
          type: 'image',
          x1: cx - w / 2, y1: cy - h / 2,
          x2: cx + w / 2, y2: cy + h / 2,
          color: '#000', width: 1,
          img,
        }
        setShapes((s) => [...s, shape])
        setSelectedId(shape.id)
        setTool('select')
        setRedoStack([])
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSave = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Re-render with the view reset so the output isn't cropped/zoomed.
    const off = document.createElement('canvas')
    off.width = CANVAS_W
    off.height = CANVAS_H
    const octx = off.getContext('2d')
    octx.fillStyle = '#FAFAF8'
    octx.fillRect(0, 0, off.width, off.height)
    if (bgImage) {
      const r = Math.min(off.width / bgImage.width, off.height / bgImage.height)
      const w = bgImage.width * r
      const h = bgImage.height * r
      octx.drawImage(bgImage, (off.width - w) / 2, (off.height - h) / 2, w, h)
    }
    for (const s of shapes) drawShape(octx, s)

    off.toBlob(async (blob) => {
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

  // ----- Render ---------------------------------------------------------------

  const rootClass = fullscreen
    ? 'fixed inset-0 z-[200] bg-lafoi-cream/95 backdrop-blur-sm flex flex-col p-3 sm:p-5'
    : 'grid gap-4'

  const canvasWrapStyle = fullscreen
    ? { flex: 1, minHeight: 0 }
    : { aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }

  return (
    <div ref={rootRef} className={rootClass}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-3 sm:px-4 py-2.5 rounded-2xl border border-lafoi-dark/10 bg-white">
        {/* Tools */}
        <div className="flex flex-wrap items-center gap-1">
          {TOOLS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTool(key)}
              title={label}
              aria-label={label}
              className={`w-10 h-10 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-colors ${
                tool === key
                  ? 'bg-lafoi-dark text-white'
                  : 'bg-lafoi-cream/50 text-lafoi-gray hover:bg-lafoi-cream hover:text-lafoi-dark'
              }`}
            >
              <Icon size={17} weight={tool === key ? 'fill' : 'regular'} />
            </button>
          ))}
        </div>

        <span aria-hidden className="hidden sm:inline-block h-6 w-px bg-lafoi-dark/10" />

        {/* Colours — wrap nicely on mobile */}
        <div className="flex flex-wrap items-center gap-1.5">
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

        <span aria-hidden className="hidden sm:inline-block h-6 w-px bg-lafoi-dark/10" />

        {/* Width */}
        <label className="flex items-center gap-2 text-[10px] tracking-[0.22em] uppercase font-sora text-lafoi-gray-medium">
          <span className="hidden sm:inline">Width</span>
          <input
            type="range"
            min="1"
            max="24"
            step="1"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="w-20 sm:w-24 accent-lafoi-green"
          />
          <span className="w-5 text-right tabular-nums text-lafoi-dark">{width}</span>
        </label>

        <div className="flex-1" />

        {/* Insert / view actions */}
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageInsert}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Insert image"
            className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center bg-lafoi-cream/50 text-lafoi-gray hover:bg-lafoi-cream hover:text-lafoi-dark"
          >
            <ImageIcon size={17} />
          </button>
          <button
            type="button"
            onClick={() => setViewScale((s) => Math.min(4, s * 1.25))}
            title="Zoom in"
            className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center bg-lafoi-cream/50 text-lafoi-gray hover:bg-lafoi-cream hover:text-lafoi-dark"
          >
            <MagnifyingGlassPlus size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewScale((s) => Math.max(0.25, s / 1.25))}
            title="Zoom out"
            className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center bg-lafoi-cream/50 text-lafoi-gray hover:bg-lafoi-cream hover:text-lafoi-dark"
          >
            <MagnifyingGlassMinus size={16} />
          </button>
          <button
            type="button"
            onClick={resetView}
            title="Reset view (zoom + pan)"
            className="hidden sm:inline-flex w-9 h-9 rounded-lg items-center justify-center bg-lafoi-cream/50 text-lafoi-gray hover:bg-lafoi-cream hover:text-lafoi-dark font-sora text-[10px] tracking-[0.18em]"
          >
            1:1
          </button>
        </div>

        <span aria-hidden className="hidden sm:inline-block h-6 w-px bg-lafoi-dark/10" />

        {/* History */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={undo}
            disabled={shapes.length === 0}
            title="Undo (⌘Z)"
            className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center bg-lafoi-cream/50 text-lafoi-gray hover:bg-lafoi-cream hover:text-lafoi-dark disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowCounterClockwise size={17} />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={redoStack.length === 0}
            title="Redo (⇧⌘Z)"
            className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center bg-lafoi-cream/50 text-lafoi-gray hover:bg-lafoi-cream hover:text-lafoi-dark disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowClockwise size={17} />
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={shapes.length === 0}
            title="Clear all"
            className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center bg-lafoi-cream/50 text-lafoi-gray hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash size={17} />
          </button>
        </div>

        {/* Fullscreen */}
        <button
          type="button"
          onClick={() => setFullscreen((f) => !f)}
          title={fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen (F)'}
          className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center bg-lafoi-dark text-white hover:brightness-110"
        >
          {fullscreen ? <CornersIn size={16} weight="bold" /> : <CornersOut size={16} weight="bold" />}
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={wrapRef}
        className="rounded-2xl border border-lafoi-dark/10 bg-lafoi-cream overflow-hidden relative"
        style={canvasWrapStyle}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className={`block w-full h-full touch-none ${
            tool === 'pan' ? 'cursor-grab' :
            tool === 'select' ? 'cursor-default' :
            tool === 'eraser' ? 'cursor-pointer' :
            'cursor-crosshair'
          }`}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
        {/* Zoom badge */}
        <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-white/85 backdrop-blur text-[10px] font-sora tracking-[0.16em] uppercase text-lafoi-gray pointer-events-none">
          {Math.round(viewScale * 100)}%
        </div>
        {/* Selection hint */}
        {selectedShape && (
          <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-white/90 backdrop-blur text-[10px] font-sora tracking-[0.18em] uppercase text-lafoi-green-dark border border-lafoi-green/30 pointer-events-none flex items-center gap-1">
            {selectedShape.type} selected · delete key removes
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-lafoi-gray-medium">
          {shapes.length === 0
            ? 'Choose a tool and start sketching. Wheel = zoom, F = fullscreen, Delete = remove selection.'
            : `${shapes.length} shape${shapes.length === 1 ? '' : 's'} · ${selectedShape ? '1 selected' : 'nothing selected'}`}
        </p>
        <div className="flex items-center gap-2">
          {fullscreen && (
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-sora text-lafoi-gray hover:bg-lafoi-cream"
            >
              <XIcon size={13} /> Exit fullscreen
            </button>
          )}
          <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton type="button" onClick={handleSave} disabled={saving || shapes.length === 0}>
            {saving ? (<><CircleNotch size={14} className="animate-spin" /> Saving…</>) : (<><FloppyDisk size={14} weight="bold" /> Save sketch</>)}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
