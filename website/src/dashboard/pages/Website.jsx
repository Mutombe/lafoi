import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Plus, Trash, FloppyDisk, Image as ImageIcon, ArrowSquareOut,
  TextT, TextAlignLeft, LinkSimple, Hash, ToggleLeft, UploadSimple, X, CircleNotch,
  ArrowClockwise, CursorClick, Rows, MagnifyingGlass, Check,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton } from '../components/FormField'
import { useConfirm } from '../components/ConfirmDialog'
import useOptimisticRow from '../hooks/useOptimisticRow'
import { brandImages } from '../../data/brandImages'
import {
  useListContentBlocksQuery,
  useCreateContentBlockMutation,
  useUpdateContentBlockMutation,
  useDeleteContentBlockMutation,
  useUpsertContentBlockMutation,
  useListMediaAssetsQuery,
  useCreateMediaAssetMutation,
  useDeleteMediaAssetMutation,
} from '../store/api'

const QUERY_ARGS = {}
const SITE_ORIGIN = typeof window !== 'undefined' ? window.location.origin : ''

// Pages the visual editor can open. Add a row and it appears as a tab.
const EDITABLE_PAGES = [
  { slug: 'home', label: 'Home', path: '/' },
  { slug: 'about', label: 'About', path: '/about' },
  { slug: 'services', label: 'Services', path: '/services' },
]
const PAGE_PATH = Object.fromEntries(EDITABLE_PAGES.map((p) => [p.slug, p.path]))

const TYPE_META = {
  text:     { label: 'Text',      icon: TextT },
  richtext: { label: 'Paragraph', icon: TextAlignLeft },
  image:    { label: 'Image',     icon: ImageIcon },
  url:      { label: 'Link',      icon: LinkSimple },
  number:   { label: 'Number',    icon: Hash },
  bool:     { label: 'Toggle',    icon: ToggleLeft },
}
const prettyPage = (p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : p)
const prettySection = (s) => (s || 'general').replace(/[-_]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())

const API_ORIGIN = (import.meta.env.VITE_API_BASE || 'http://localhost:8000/api').replace(/\/api\/?$/, '')
const previewSrc = (v) => {
  if (!v) return ''
  if (/^https?:\/\//.test(v) || v.startsWith('/')) return v
  return `${API_ORIGIN}/${v.replace(/^\/+/, '')}`
}

export default function Website() {
  const [mode, setMode] = useState('visual') // 'visual' | 'fields'
  const [activePage, setActivePage] = useState('home')

  return (
    <div>
      <PageHeader
        eyebrow="Website"
        title="Site content."
        description="Edit the live site directly — click any text to type, click any image to swap it. Everything saves to the page you see."
        actions={
          <div className="inline-flex rounded-full bg-lafoi-cream border border-lafoi-dark/10 p-0.5">
            <button
              onClick={() => setMode('visual')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-sora font-medium transition-colors ${mode === 'visual' ? 'bg-lafoi-dark text-white' : 'text-lafoi-gray hover:text-lafoi-dark'}`}
            >
              <CursorClick size={13} weight="bold" /> Visual
            </button>
            <button
              onClick={() => setMode('fields')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-sora font-medium transition-colors ${mode === 'fields' ? 'bg-lafoi-dark text-white' : 'text-lafoi-gray hover:text-lafoi-dark'}`}
            >
              <Rows size={13} weight="bold" /> All fields
            </button>
          </div>
        }
      />

      {mode === 'visual'
        ? <VisualEditor activePage={activePage} setActivePage={setActivePage} />
        : <FieldsEditor activePage={activePage} setActivePage={setActivePage} />}
    </div>
  )
}

/* ========================================================================== */
/*  VISUAL (WYSIWYG) EDITOR                                                    */
/* ========================================================================== */
function VisualEditor({ activePage, setActivePage }) {
  const iframeRef = useRef(null)
  const [iframeKey, setIframeKey] = useState(0)
  const [savingCount, setSavingCount] = useState(0)
  const [pendingImage, setPendingImage] = useState(null) // { page, section, key }
  const [mediaOpen, setMediaOpen] = useState(false)

  const [upsert] = useUpsertContentBlockMutation()

  // Listen for edits coming from the live page inside the iframe.
  useEffect(() => {
    const onMsg = async (e) => {
      if (e.origin !== SITE_ORIGIN) return
      const d = e.data
      if (!d || d.source !== 'lafoi-cms') return

      if (d.type === 'update') {
        setSavingCount((c) => c + 1)
        try {
          await upsert({ page: d.page, section: d.section, key: d.key, value: d.value, type: d.fieldType || 'text' }).unwrap()
          toast.success('Saved', { description: `${prettyPage(d.page)} · ${d.section}.${d.key}` })
        } catch {
          toast.error('Could not save that edit')
        } finally {
          setSavingCount((c) => Math.max(0, c - 1))
        }
      } else if (d.type === 'pick-image') {
        setPendingImage({ page: d.page, section: d.section, key: d.key })
        setMediaOpen(true)
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [upsert])

  const chooseImage = async (url) => {
    if (!pendingImage) return
    const { page, section, key } = pendingImage
    setMediaOpen(false)
    setSavingCount((c) => c + 1)
    try {
      await upsert({ page, section, key, value: url, type: 'image' }).unwrap()
      toast.success('Image updated', { description: `${prettyPage(page)} · ${section}.${key}` })
      setIframeKey((k) => k + 1) // reload so the new image shows
    } catch {
      toast.error('Could not update image')
    } finally {
      setSavingCount((c) => Math.max(0, c - 1))
      setPendingImage(null)
    }
  }

  const src = `${SITE_ORIGIN}${PAGE_PATH[activePage] || '/'}?cms=1`

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {EDITABLE_PAGES.map((p) => (
            <button
              key={p.slug}
              onClick={() => setActivePage(p.slug)}
              className={`px-4 py-2 rounded-full text-sm font-sora tracking-wide transition-colors ${
                p.slug === activePage ? 'bg-lafoi-dark text-white' : 'bg-white border border-lafoi-dark/12 text-lafoi-gray hover:text-lafoi-dark hover:border-lafoi-dark/25'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {savingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-sora text-lafoi-green-dark">
              <CircleNotch size={13} className="animate-spin" /> Saving…
            </span>
          )}
          <button
            onClick={() => setMediaOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-lafoi-dark/12 bg-white text-sm font-sora text-lafoi-dark hover:border-lafoi-green/40 hover:text-lafoi-green transition-colors"
          >
            <ImageIcon size={14} weight="bold" /> Media library
          </button>
          <button
            onClick={() => setIframeKey((k) => k + 1)}
            title="Reload preview"
            className="p-2 rounded-full border border-lafoi-dark/12 bg-white text-lafoi-gray hover:text-lafoi-dark transition-colors"
          >
            <ArrowClockwise size={15} />
          </button>
          <a
            href={`${SITE_ORIGIN}${PAGE_PATH[activePage] || '/'}`}
            target="_blank"
            rel="noreferrer"
            title="Open the live page"
            className="p-2 rounded-full border border-lafoi-dark/12 bg-white text-lafoi-gray hover:text-lafoi-dark transition-colors"
          >
            <ArrowSquareOut size={15} />
          </a>
        </div>
      </div>

      {/* Hint */}
      <div className="mb-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lafoi-green/[0.08] border border-lafoi-green/20">
        <CursorClick size={13} weight="bold" className="text-lafoi-green-dark" />
        <span className="text-[11px] font-sora text-lafoi-green-dark tracking-wide">
          Click text to edit · hover an image and hit “Change image” · changes save automatically
        </span>
      </div>

      {/* Live preview */}
      <div className="rounded-xl overflow-hidden border border-lafoi-dark/12 bg-white shadow-[0_18px_50px_-30px_rgba(17,17,17,0.35)]">
        <iframe
          key={iframeKey}
          ref={iframeRef}
          title="Live site preview"
          src={src}
          className="w-full block"
          style={{ height: 'calc(100vh - 240px)', minHeight: 560 }}
        />
      </div>

      <MediaPicker
        open={mediaOpen}
        onClose={() => { setMediaOpen(false); setPendingImage(null) }}
        onSelect={pendingImage ? chooseImage : null}
      />
    </div>
  )
}

/* ========================================================================== */
/*  MEDIA LIBRARY / PICKER                                                     */
/* ========================================================================== */
function MediaPicker({ open, onClose, onSelect }) {
  const confirm = useConfirm()
  const [tab, setTab] = useState('brand') // brand | uploads | upload
  const [q, setQ] = useState('')
  const { data: uploadsData, isLoading } = useListMediaAssetsQuery(QUERY_ARGS, { skip: !open })
  const uploads = uploadsData?.results || []
  const [createAsset, { isLoading: uploading }] = useCreateMediaAssetMutation()
  const [deleteAsset] = useDeleteMediaAssetMutation()

  const filteredBrand = useMemo(
    () => (q ? brandImages.filter((s) => s.toLowerCase().includes(q.toLowerCase())) : brandImages),
    [q],
  )

  const doUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    for (const f of files) {
      const fd = new FormData()
      fd.append('file', f)
      fd.append('title', f.name.replace(/\.[^.]+$/, ''))
      fd.append('source', 'upload')
      try {
        const created = await createAsset(fd).unwrap()
        toast.success('Uploaded', { description: created.title })
      } catch {
        toast.error(`Could not upload ${f.name}`)
      }
    }
    setTab('uploads')
    e.target.value = ''
  }

  const removeAsset = async (a) => {
    if (!(await confirm({ title: 'Delete image?', message: `"${a.title || 'this image'}" will be removed from the library.`, confirmLabel: 'Delete', danger: true }))) return
    try { await deleteAsset(a.id).unwrap(); toast.success('Removed') }
    catch { toast.error('Could not delete') }
  }

  const pick = (url) => { if (onSelect) onSelect(url) }

  return (
    <Modal open={open} onClose={onClose} title={onSelect ? 'Choose an image' : 'Media library'} size="lg"
      footer={<SecondaryButton type="button" onClick={onClose}>Close</SecondaryButton>}>
      <div>
        {/* Tabs + search */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {[['brand', `Brand library (${brandImages.length})`], ['uploads', `Uploads (${uploads.length})`], ['upload', 'Upload new']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-sora font-medium transition-colors ${tab === k ? 'bg-lafoi-dark text-white' : 'bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark'}`}>
              {l}
            </button>
          ))}
          {(tab === 'brand' || tab === 'uploads') && (
            <div className="relative ml-auto">
              <MagnifyingGlass size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-lafoi-gray-medium" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search"
                className="pl-8 pr-3 py-1.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-xs font-body w-44" />
            </div>
          )}
        </div>

        {tab === 'upload' && (
          <label className="flex flex-col items-center justify-center gap-3 py-14 rounded-xl border-2 border-dashed border-lafoi-dark/15 hover:border-lafoi-green/40 cursor-pointer transition-colors text-center">
            {uploading ? <CircleNotch size={26} className="animate-spin text-lafoi-green" /> : <UploadSimple size={26} className="text-lafoi-gray-medium" />}
            <span className="font-sora text-sm text-lafoi-dark">{uploading ? 'Uploading…' : 'Click to upload images'}</span>
            <span className="text-[11px] text-lafoi-gray-medium">PNG or JPG · you can select several at once</span>
            <input type="file" accept="image/*" multiple onChange={doUpload} className="hidden" />
          </label>
        )}

        {tab !== 'upload' && (
          <div className="max-h-[52vh] overflow-y-auto -mx-1 px-1">
            {tab === 'uploads' && isLoading && (
              <div className="py-16 flex justify-center text-lafoi-gray-medium"><CircleNotch size={20} className="animate-spin" /></div>
            )}
            {tab === 'uploads' && !isLoading && uploads.length === 0 && (
              <p className="py-16 text-center text-sm text-lafoi-gray-medium">No uploads yet — add some under “Upload new”.</p>
            )}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {(tab === 'brand' ? filteredBrand.map((s) => ({ url: s, title: s.split('/').pop() })) : uploads.filter((a) => !q || (a.title || '').toLowerCase().includes(q.toLowerCase()))).map((item) => (
                <div key={item.id ?? item.url} className="group relative aspect-square rounded-lg overflow-hidden bg-lafoi-cream border border-lafoi-dark/10">
                  <img src={previewSrc(item.url)} alt={item.title || ''} loading="lazy" className="w-full h-full object-cover" />
                  {onSelect && (
                    <button onClick={() => pick(item.url)}
                      className="absolute inset-0 flex items-center justify-center bg-lafoi-dark/0 group-hover:bg-lafoi-dark/45 transition-colors">
                      <span className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white text-lafoi-dark text-[11px] font-sora font-semibold transition-opacity">
                        <Check size={12} weight="bold" /> Use
                      </span>
                    </button>
                  )}
                  {tab === 'uploads' && item.id != null && (
                    <button onClick={() => removeAsset(item)} title="Delete"
                      className="absolute top-1 right-1 p-1 rounded-md bg-white/85 text-lafoi-gray hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

/* ========================================================================== */
/*  ALL-FIELDS EDITOR (granular list)                                         */
/* ========================================================================== */
function FieldsEditor({ activePage, setActivePage }) {
  const confirm = useConfirm()
  const { data, isLoading } = useListContentBlocksQuery(QUERY_ARGS)
  const blocks = data?.results || []

  const [createBlock] = useCreateContentBlockMutation()
  const [updateBlock] = useUpdateContentBlockMutation()
  const [deleteBlock] = useDeleteContentBlockMutation()
  const { optimisticCreate, optimisticUpdate, optimisticDelete } = useOptimisticRow('listContentBlocks', QUERY_ARGS)

  const pages = useMemo(() => {
    const order = ['home', 'about', 'services']
    const set = Array.from(new Set(blocks.map((b) => b.page)))
    return set.sort((a, b) => (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b)) || a.localeCompare(b))
  }, [blocks])

  useEffect(() => { if (pages.length && !pages.includes(activePage)) setActivePage(pages[0]) }, [pages]) // eslint-disable-line

  const pageBlocks = useMemo(() => blocks.filter((b) => b.page === activePage), [blocks, activePage])
  const sections = useMemo(() => {
    const m = new Map()
    pageBlocks.forEach((b) => { if (!m.has(b.section)) m.set(b.section, []); m.get(b.section).push(b) })
    return Array.from(m.entries())
  }, [pageBlocks])

  const [mediaFor, setMediaFor] = useState(null) // block to receive a picked image

  const saveBlock = async (block, { value, imageFile }) => {
    if (imageFile) {
      const fd = new FormData(); fd.append('image', imageFile)
      const preview = URL.createObjectURL(imageFile)
      await optimisticUpdate({ id: block.id, patch: { image_url: preview, resolved: preview }, run: () => updateBlock({ id: block.id, body: fd }).unwrap(), successTitle: 'Image updated', errorTitle: 'Could not update image', describe: () => block.label || block.key })
      return
    }
    await optimisticUpdate({ id: block.id, patch: { value, resolved: value }, run: () => updateBlock({ id: block.id, body: { value } }).unwrap(), successTitle: 'Saved', errorTitle: 'Could not save', describe: () => block.label || block.key })
  }

  const pickForBlock = async (url) => {
    if (!mediaFor) return
    const block = mediaFor; setMediaFor(null)
    await optimisticUpdate({ id: block.id, patch: { value: url, resolved: url, image_url: url }, run: () => updateBlock({ id: block.id, body: { value: url, image: null } }).unwrap(), successTitle: 'Image set', errorTitle: 'Could not set image', describe: () => block.label || block.key }).catch(() => {})
  }

  const handleDelete = async (block) => {
    if (!(await confirm({ title: 'Delete this field?', message: `"${block.label || block.key}" will be removed. The site falls back to its built-in default.`, confirmLabel: 'Delete', danger: true }))) return
    optimisticDelete({ id: block.id, run: () => deleteBlock(block.id).unwrap(), successTitle: 'Field removed', errorTitle: 'Could not delete', describe: (b) => b.label || b.key }).catch(() => {})
  }

  const [adding, setAdding] = useState(null)
  const openAdd = () => setAdding({ page: activePage || 'home', section: 'general', key: '', type: 'text', label: '', value: '' })
  const handleCreate = (e) => {
    e.preventDefault()
    if (!adding.key.trim()) { toast.error('Give the field a key'); return }
    const payload = { page: adding.page.trim().toLowerCase(), section: (adding.section || 'general').trim().toLowerCase(), key: adding.key.trim(), type: adding.type, label: adding.label.trim(), value: adding.value || '' }
    setAdding(null)
    optimisticCreate({ tempRow: { ...payload, resolved: payload.value, image_url: null }, run: () => createBlock(payload).unwrap(), successTitle: 'Field added', errorTitle: 'Could not add field', describe: (b) => `${prettyPage(b.page)} · ${b.label || b.key}` }).then(() => setActivePage(payload.page)).catch(() => {})
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {pages.map((p) => (
          <button key={p} onClick={() => setActivePage(p)}
            className={`px-4 py-2 rounded-full text-sm font-sora tracking-wide transition-colors ${p === activePage ? 'bg-lafoi-dark text-white' : 'bg-white border border-lafoi-dark/12 text-lafoi-gray hover:text-lafoi-dark hover:border-lafoi-dark/25'}`}>
            {prettyPage(p)}
          </button>
        ))}
        <PrimaryButton onClick={openAdd} className="ml-auto"><Plus size={14} weight="bold" /> Add field</PrimaryButton>
      </div>

      {isLoading && <div className="py-24 flex justify-center text-lafoi-gray-medium"><CircleNotch size={20} className="animate-spin" /></div>}
      {!isLoading && pageBlocks.length === 0 && <p className="py-16 text-center text-sm text-lafoi-gray-medium">No fields yet for this page.</p>}

      <div className="space-y-8">
        {sections.map(([section, items]) => (
          <section key={section}>
            <div className="flex items-center gap-3 mb-3">
              <span className="block w-8 h-px bg-lafoi-green/50" />
              <h2 className="font-sora text-[11px] font-semibold tracking-[0.28em] uppercase text-lafoi-gray-medium">{prettySection(section)}</h2>
            </div>
            <div className="grid gap-3">
              {items.map((b) => (
                <BlockEditor key={b.id} block={b} onSave={saveBlock} onDelete={handleDelete} onPickImage={() => setMediaFor(b)} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <MediaPicker open={!!mediaFor} onClose={() => setMediaFor(null)} onSelect={mediaFor ? pickForBlock : null} />

      <Modal open={!!adding} onClose={() => setAdding(null)} title="Add a content field"
        footer={<><SecondaryButton type="button" onClick={() => setAdding(null)}>Cancel</SecondaryButton><PrimaryButton form="add-block-form" type="submit">Add field</PrimaryButton></>}>
        {adding && (
          <form id="add-block-form" onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
            <Field label="Page" required><Input value={adding.page} onChange={(e) => setAdding({ ...adding, page: e.target.value })} required /></Field>
            <Field label="Section"><Input value={adding.section} onChange={(e) => setAdding({ ...adding, section: e.target.value })} placeholder="hero" /></Field>
            <Field label="Key" required><Input value={adding.key} onChange={(e) => setAdding({ ...adding, key: e.target.value })} placeholder="heading" required /></Field>
            <Field label="Type" required>
              <Select value={adding.type} onChange={(e) => setAdding({ ...adding, type: e.target.value })}>
                {Object.entries(TYPE_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
              </Select>
            </Field>
            <Field label="Label (admin only)" className="sm:col-span-2"><Input value={adding.label} onChange={(e) => setAdding({ ...adding, label: e.target.value })} placeholder="What this field is" /></Field>
            <Field label={adding.type === 'image' ? 'Image path / URL' : 'Value'} className="sm:col-span-2">
              {adding.type === 'richtext'
                ? <Textarea value={adding.value} onChange={(e) => setAdding({ ...adding, value: e.target.value })} rows={3} />
                : <Input value={adding.value} onChange={(e) => setAdding({ ...adding, value: e.target.value })} placeholder={adding.type === 'image' ? '/brand/images/xx.png' : ''} />}
            </Field>
          </form>
        )}
      </Modal>
    </div>
  )
}

function BlockEditor({ block, onSave, onDelete, onPickImage }) {
  const meta = TYPE_META[block.type] || TYPE_META.text
  const Icon = meta.icon
  const [value, setValue] = useState(block.value || '')
  const [imageFile, setImageFile] = useState(null)
  const [localPreview, setLocalPreview] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (!imageFile) setValue(block.value || '') }, [block.value]) // eslint-disable-line

  const dirty = imageFile ? true : value !== (block.value || '')
  const pending = !!block._pending

  const pickFile = (e) => { const f = e.target.files?.[0]; if (!f) return; setImageFile(f); setLocalPreview(URL.createObjectURL(f)) }
  const save = async () => {
    if (!dirty || saving) return
    setSaving(true)
    try { await onSave(block, { value, imageFile }); setImageFile(null); setLocalPreview('') } catch { /* upstream */ } finally { setSaving(false) }
  }

  return (
    <div className={`rounded-xl border bg-white p-4 transition-colors ${dirty ? 'border-lafoi-green/40' : 'border-lafoi-dark/10'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-sora text-sm text-lafoi-dark truncate">{block.label || block.key}</p>
          <p className="text-[11px] text-lafoi-gray-medium mt-0.5 flex items-center gap-1.5">
            <Icon size={12} /> {meta.label} <span className="text-lafoi-dark/20">·</span>
            <code className="text-[10px]">{block.section}.{block.key}</code>
            {pending && <span className="ml-1 text-lafoi-green-dark">{block._pending.label}</span>}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {dirty && (
            <button onClick={save} disabled={saving} title="Save"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lafoi-green text-white text-xs font-sora font-medium hover:bg-lafoi-green-dark transition-colors disabled:opacity-60">
              {saving ? <CircleNotch size={13} className="animate-spin" /> : <FloppyDisk size={13} weight="bold" />} Save
            </button>
          )}
          <button onClick={() => onDelete(block)} title="Delete field"
            className="p-2 rounded-lg text-lafoi-gray hover:text-red-600 hover:bg-red-50 min-w-[34px] min-h-[34px] inline-flex items-center justify-center"><Trash size={14} /></button>
        </div>
      </div>

      {block.type === 'image' ? (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-48 aspect-[4/3] rounded-lg overflow-hidden bg-lafoi-cream border border-lafoi-dark/10 shrink-0">
            {(localPreview || previewSrc(block.image_url || block.resolved || block.value))
              ? <img src={localPreview || previewSrc(block.image_url || block.resolved || block.value)} alt={block.label || block.key} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-lafoi-gray-medium"><ImageIcon size={22} /></div>}
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onPickImage}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-lafoi-dark/15 text-sm font-sora text-lafoi-dark hover:border-lafoi-green/40 cursor-pointer transition-colors">
                <ImageIcon size={14} weight="bold" /> Choose from library
              </button>
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-lafoi-dark/15 text-sm font-sora text-lafoi-dark hover:border-lafoi-green/40 cursor-pointer transition-colors">
                <UploadSimple size={14} weight="bold" /> {imageFile ? 'Change file' : 'Upload'}
                <input type="file" accept="image/*" onChange={pickFile} className="hidden" />
              </label>
            </div>
            {imageFile && <p className="text-[11px] text-lafoi-green-dark flex items-center gap-1.5">{imageFile.name}<button onClick={() => { setImageFile(null); setLocalPreview('') }} className="text-lafoi-gray hover:text-red-600"><X size={11} weight="bold" /></button></p>}
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="/brand/images/30.png" />
          </div>
        </div>
      ) : block.type === 'richtext' ? (
        <Textarea value={value} onChange={(e) => setValue(e.target.value)} rows={3} />
      ) : block.type === 'bool' ? (
        <label className="inline-flex items-center gap-2 text-sm text-lafoi-gray cursor-pointer">
          <input type="checkbox" checked={value === 'true'} onChange={(e) => setValue(e.target.checked ? 'true' : 'false')} className="w-4 h-4 accent-lafoi-green" />
          {value === 'true' ? 'On' : 'Off'}
        </label>
      ) : (
        <Input type={block.type === 'number' ? 'number' : block.type === 'url' ? 'url' : 'text'} value={value} onChange={(e) => setValue(e.target.value)} placeholder={block.type === 'url' ? 'https://…' : ''} />
      )}
    </div>
  )
}
