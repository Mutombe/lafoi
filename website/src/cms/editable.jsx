import React, { useEffect } from 'react'
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
    const params = new URLSearchParams(window.location.search)
    return params.get('cms') === '1' && window.parent && window.parent !== window
  } catch {
    return false
  }
})()

const post = (msg) => {
  try {
    window.parent.postMessage({ source: 'lafoi-cms', ...msg }, '*')
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
 * Injects edit-mode styling + a handshake once, when the page is in the
 * editor. Mounted from Layout so it's always present in the iframe.
 */
export function CmsEditLayer() {
  useEffect(() => {
    if (!isCmsEdit) return
    const style = document.createElement('style')
    style.textContent = `
      [data-cms-field]{ outline:1px dashed rgba(26,138,46,0.0); outline-offset:3px; transition:outline-color .15s; border-radius:2px; cursor:text; }
      [data-cms-field]:hover{ outline-color:rgba(26,138,46,0.55); background:rgba(34,197,94,0.06); }
      [data-cms-field]:focus{ outline:2px solid #1A8A2E; background:rgba(34,197,94,0.08); }
      .cms-img-wrap{ position:relative; }
      .cms-img-wrap:hover .cms-img-btn{ opacity:1; }
      .cms-img-btn{ position:absolute; z-index:40; top:10px; left:10px; opacity:0; transition:opacity .15s;
        display:inline-flex; align-items:center; gap:6px; padding:7px 12px; border-radius:6px; cursor:pointer;
        background:#111; color:#fff; font:600 12px/1 ui-sans-serif,system-ui; border:1px solid rgba(255,255,255,0.2); }
      .cms-img-btn:hover{ background:#1A8A2E; }
    `
    document.head.appendChild(style)
    document.body.setAttribute('data-cms-editing', '1')
    post({ type: 'ready', page: document.body.getAttribute('data-cms-page') || '' })
    return () => { style.remove() }
  }, [])
  return null
}

/**
 * Editable inline text. Renders `c(field, children)` normally; in edit mode it
 * is contentEditable and posts an upsert on blur.
 *
 *   <EditableText page="about" field="hero.eyebrow" as="p">Who we are</EditableText>
 *
 * `render` (e.g. linkifyProse) styles the read-only output only.
 */
export function EditableText({ page, field, as: Tag = 'span', className = '', children, render, multiline = false }) {
  const { c } = useSiteContent(page)
  const def = typeof children === 'string' ? children : (children == null ? '' : String(children))
  const value = c(field, def)

  if (!isCmsEdit) {
    return <Tag className={className}>{render ? render(value) : value}</Tag>
  }

  const { section, key } = splitField(field)
  const onBlur = (e) => {
    const v = (multiline ? e.currentTarget.innerText : e.currentTarget.textContent).replace(/ /g, ' ').trim()
    if (v !== value) {
      post({ type: 'update', page, section, key, value: v, fieldType: multiline ? 'richtext' : 'text' })
    }
  }
  const onKeyDown = (e) => {
    if (!multiline && e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() }
    if (e.key === 'Escape') { e.currentTarget.blur() }
  }

  return (
    <Tag
      className={className}
      data-cms-field={field}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      title="Click to edit"
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    >
      {value}
    </Tag>
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
