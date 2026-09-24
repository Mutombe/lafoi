import React, { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
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

/** Post an inline text update for a "section.key" field (used by AnimatedHeading). */
export function postFieldUpdate(page, field, value, fieldType = 'text') {
  const { section, key } = splitField(field)
  post({ type: 'update', page, section, key, value, fieldType })
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

    // In the editor, links must not navigate away — clicking them should just
    // let you edit their text (or do nothing). The dashboard changes pages.
    const clickGuard = (e) => {
      const a = e.target.closest && e.target.closest('a[href]')
      if (a) { e.preventDefault() }
    }
    document.addEventListener('click', clickGuard, true)

    post({ type: 'ready' })
    return () => { style.remove(); banner.remove(); document.removeEventListener('click', clickGuard, true) }
  }, [])
  return null
}

/* ===========================================================================
   AUTO EDITOR — makes EVERY text element on a page editable without wrapping.
   In edit mode it tags each leaf text node under <main> as editable; on the
   live site it applies whatever has been saved for those nodes. Nodes are keyed
   by their position in the DOM (stable as long as the layout doesn't change).
   =========================================================================== */

const AUTO_SEL = 'h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption,dt,dd,button,span,a,strong,em,small,label'
const norm = (s) => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim()

function pageSlugFromPath(pathname) {
  const p = (pathname || '/').replace(/^\/+|\/+$/g, '')
  return p === '' ? 'home' : p.replace(/\//g, '_')
}

function hashStr(s) {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return h.toString(36)
}

// Position-based key: sequence of tag+index from <main> down to the element.
function autoKeyFor(el, root) {
  const parts = []
  let node = el
  while (node && node !== root && node.parentElement) {
    const parent = node.parentElement
    const tag = node.tagName
    let idx = 0
    for (const child of parent.children) { if (child === node) break; if (child.tagName === tag) idx++ }
    parts.unshift(tag.toLowerCase() + idx)
    node = parent
  }
  return 'a' + hashStr(parts.join('/'))
}

// A "leaf text" element holds text directly with no child elements to split it.
function isLeafText(el) {
  for (const child of el.childNodes) if (child.nodeType === 1) return false
  const t = norm(el.textContent)
  return t.length >= 1 && /[A-Za-z0-9]/.test(t)
}

export function CmsAutoLayer() {
  const location = useLocation()
  const page = pageSlugFromPath(location.pathname)
  const { c, ready, data } = useSiteContent(page)
  const editedRef = useRef(new Set())

  useEffect(() => {
    const editing = isCmsEdit
    // On the live site, only do the (observer-backed) apply work when this page
    // actually has saved auto-content — otherwise there's nothing to maintain.
    if (!editing) {
      const hasAuto = data && Object.keys(data).some((k) => k.startsWith('auto.'))
      if (!hasAuto) return undefined
    }
    let raf
    const run = () => {
      const root = document.querySelector('main')
      if (!root) return
      root.querySelectorAll(AUTO_SEL).forEach((el) => {
        let key
        const existing = el.getAttribute('data-cms-field')
        const isAuto = el.getAttribute('data-cms-auto') === '1'
        if (isAuto) {
          key = existing.slice(existing.indexOf('.') + 1)
        } else if (!existing && !el.closest('[data-cms-field]') && !el.closest('#cms-banner') && isLeafText(el)) {
          key = autoKeyFor(el, root)
          if (editing) {
            el.setAttribute('data-cms-field', 'auto.' + key)
            el.setAttribute('data-cms-auto', '1')
            el.setAttribute('contenteditable', 'true')
            el.setAttribute('spellcheck', 'false')
          }
        } else {
          return
        }
        // Apply the saved value, but never fight the field the user is editing.
        if (el === document.activeElement) return
        if (editedRef.current.has(key)) return
        const v = c('auto.' + key, null)
        if (v != null && v !== '' && norm(el.textContent) !== norm(String(v))) {
          el.textContent = v
        }
      })
    }
    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(run) }
    schedule()
    // In edit mode we ignore characterData mutations so typing isn't disturbed.
    const obs = new MutationObserver(schedule)
    obs.observe(document.body, { childList: true, subtree: true, characterData: !editing })

    let onBlur
    if (editing) {
      onBlur = (e) => {
        const el = e.target
        if (!el || !el.getAttribute || el.getAttribute('data-cms-auto') !== '1') return
        const field = el.getAttribute('data-cms-field') || ''
        const key = field.slice(field.indexOf('.') + 1)
        const value = norm(el.innerText)
        editedRef.current.add(key)
        post({ type: 'update', page, section: 'auto', key, value, fieldType: 'richtext' })
      }
      document.addEventListener('focusout', onBlur, true)
    }
    return () => {
      cancelAnimationFrame(raf)
      obs.disconnect()
      if (onBlur) document.removeEventListener('focusout', onBlur, true)
    }
  }, [page, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

/**
 * The actual contentEditable node. Kept as an isolated, memoised component so
 * React never re-renders it (which would fight the browser's editing / reset
 * the caret). We set the text imperatively and only re-sync when the stored
 * value changes AND the field isn't focused.
 */
export const InlineNode = React.memo(
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
    return <Tag className={className} data-cms-field={field}>{render ? render(value) : value}</Tag>
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
