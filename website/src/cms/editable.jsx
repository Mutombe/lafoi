import React, { useEffect, useRef } from 'react'
import OptimizedImage from '../components/ui/OptimizedImage'
import { useSiteContent } from '../hooks/useSiteContent'

// ---------------------------------------------------------------------------
// WYSIWYG edit mode. The public site renders normally everywhere EXCEPT when
// it's loaded inside the dashboard's "Website" tab as an iframe with ?cms=1.
// There, <EditableText> becomes click-to-type and <EditableImage> becomes
// click-to-replace, and every change is posted up to the dashboard, which
// saves it via the API.
// ---------------------------------------------------------------------------

export const isCmsEdit = (() => {
  try {
    return new URLSearchParams(window.location.search).get('cms') === '1'
  } catch {
    return false
  }
})()

const post = (msg) => {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ source: 'lafoi-cms', ...msg }, '*')
    }
  } catch {
    /* ignore */
  }
}

/** Split "section.key" → { section, key } (key may itself contain dots). */
function splitField(field) {
  const i = field.indexOf('.')
  if (i === -1) return { section: 'general', key: field }
  return { section: field.slice(0, i), key: field.slice(i + 1) }
}

/**
 * Injects edit-mode styling + a visible banner once, so it's obvious the page
 * is editable. Mounted from Layout so it's always present in the iframe.
 */
export function CmsEditLayer() {
  useEffect(() => {
    if (!isCmsEdit) return
    const style = document.createElement('style')
    style.textContent = `
      [data-cms-field]{ outline:1px dashed rgba(26,138,46,0.5); outline-offset:2px; border-radius:2px; cursor:text; transition:background .15s, outline-color .15s; }
      [data-cms-field]:hover{ outline:1px solid #1A8A2E; background:rgba(34,197,94,0.10); }
      [data-cms-field]:focus{ outline:2px solid #1A8A2E; background:rgba(34,197,94,0.14); }
      .cms-img-wrap{ position:relative; }
      .cms-img-wrap::after{ content:""; position:absolute; inset:0; outline:2px dashed rgba(26,138,46,0.55); outline-offset:-4px; pointer-events:none; border-radius:4px; }
      .cms-img-btn{ position:absolute; z-index:40; top:10px; left:10px;
        display:inline-flex; align-items:center; gap:6px; padding:8px 13px; border-radius:6px; cursor:pointer;
        background:#1A8A2E; color:#fff; font:600 12px/1 ui-sans-serif,system-ui; border:0; box-shadow:0 4px 14px rgba(0,0,0,.3); }
      .cms-img-btn:hover{ background:#111; }
      #cms-banner{ position:fixed; z-index:2147483000; left:50%; transform:translateX(-50%); bottom:16px;
        display:inline-flex; align-items:center; gap:8px; padding:9px 16px; border-radius:999px;
        background:#111; color:#fff; font:600 12px/1 ui-sans-serif,system-ui; box-shadow:0 8px 30px rgba(0,0,0,.35); }
      #cms-banner b{ color:#5AE27E; }
    `
    document.head.appendChild(style)
    document.body.setAttribute('data-cms-editing', '1')

    const banner = document.createElement('div')
    banner.id = 'cms-banner'
    banner.innerHTML = '<span>✏️ <b>Edit mode</b> — click any highlighted text to edit · hover an image to replace it</span>'
    document.body.appendChild(banner)

    post({ type: 'ready' })
    return () => { style.remove(); banner.remove() }
  }, [])
  return null
}

/**
 * The actual contentEditable node. Kept as an isolated, memoised component so
 * React never re-renders it (which would fight the browser's editing / reset
 * the caret). We set the text imperatively and only re-sync when the stored
 * value changes AND the field isn't focused.
 */
const InlineNode = React.memo(
  function InlineNode({ tag: Tag = 'span', className, field, initial, multiline, onCommit }) {
    const ref = useRef(null)
    const last = useRef(initial ?? '')
    const focused = useRef(false)

    useEffect(() => {
      if (ref.current) ref.current.textContent = initial ?? ''
      last.current = initial ?? ''
    }, []) // set once on mount

    useEffect(() => {
      // Re-sync if the saved value arrives/changes while the user isn't typing.
      if (ref.current && !focused.current && (initial ?? '') !== last.current) {
        ref.current.textContent = initial ?? ''
        last.current = initial ?? ''
      }
    }, [initial])

    return (
      <Tag
        ref={ref}
        className={className}
        data-cms-field={field}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        title="Click to edit"
        onFocus={() => { focused.current = true }}
        onBlur={(e) => {
          focused.current = false
          const text = (multiline ? e.currentTarget.innerText : e.currentTarget.textContent).replace(/ /g, ' ').replace(/\s+$/, '')
          if (text !== last.current) { last.current = text; onCommit(text) }
        }}
        onKeyDown={(e) => {
          if (!multiline && e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() }
          if (e.key === 'Escape') { e.currentTarget.blur() }
        }}
      />
    )
  },
  // Only re-render when the value/identity actually changes.
  (a, b) => a.initial === b.initial && a.field === b.field && a.className === b.className,
)

/**
 * Editable inline text. Renders `c(field, children)` normally; in edit mode it
 * is contentEditable and posts an upsert on blur.
 *
 *   <EditableText page="about" field="hero.eyebrow" as="p">Who we are</EditableText>
 */
export function EditableText({ page, field, as: Tag = 'span', className = '', children, render, multiline = false }) {
  const { c } = useSiteContent(page)
  const def = typeof children === 'string' ? children : (children == null ? '' : String(children))
  const value = c(field, def)

  if (!isCmsEdit) {
    return <Tag className={className}>{render ? render(value) : value}</Tag>
  }

  const { section, key } = splitField(field)
  return (
    <InlineNode
      tag={Tag}
      className={className}
      field={field}
      initial={value}
      multiline={multiline}
      onCommit={(text) => post({ type: 'update', page, section, key, value: text, fieldType: multiline ? 'richtext' : 'text' })}
    />
  )
}

/**
 * Editable image. Renders through OptimizedImage normally; in edit mode a
 * "Change image" button posts a pick request the dashboard answers with the
 * media library.
 */
export function EditableImage({ page, field, defaultSrc, alt = '', className = '', fill = false, vision = '', priority = false, wrapperClassName = '' }) {
  const { c } = useSiteContent(page)
  const src = c(field, defaultSrc)

  const img = (
    <OptimizedImage src={src} alt={alt} className={className} fill={fill} vision={vision} priority={priority} wrapperClassName={wrapperClassName} />
  )
  if (!isCmsEdit) return img

  const { section, key } = splitField(field)
  return (
    <span className="cms-img-wrap" style={{ display: 'block', width: '100%', height: '100%' }}>
      {img}
      <button
        type="button"
        className="cms-img-btn"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); post({ type: 'pick-image', page, section, key }) }}
      >
        Change image
      </button>
    </span>
  )
}

export default EditableText
