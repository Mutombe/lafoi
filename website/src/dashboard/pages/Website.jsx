import React, { useEffect, useMemo, useState } from 'react'
import {
  Plus, Trash, FloppyDisk, Image as ImageIcon, ArrowSquareOut,
  TextT, TextAlignLeft, LinkSimple, Hash, ToggleLeft, UploadSimple, X, CircleNotch,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton } from '../components/FormField'
import { useConfirm } from '../components/ConfirmDialog'
import useOptimisticRow from '../hooks/useOptimisticRow'
import {
  useListContentBlocksQuery,
  useCreateContentBlockMutation,
  useUpdateContentBlockMutation,
  useDeleteContentBlockMutation,
} from '../store/api'

// Stable reference so the optimistic-cache patch targets the same query key.
const QUERY_ARGS = {}

const TYPE_META = {
  text:     { label: 'Text',      icon: TextT },
  richtext: { label: 'Paragraph', icon: TextAlignLeft },
  image:    { label: 'Image',     icon: ImageIcon },
  url:      { label: 'Link',      icon: LinkSimple },
  number:   { label: 'Number',    icon: Hash },
  bool:     { label: 'Toggle',    icon: ToggleLeft },
}

// Pages we know how to open on the live site. Others still edit fine.
const PAGE_LIVE = { home: '/', about: '/about', services: '/services', portfolio: '/portfolio', products: '/products', contact: '/contact', blog: '/blog', careers: '/careers', faq: '/faq' }
const prettyPage = (p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : p)
const prettySection = (s) => (s || 'general').replace(/[-_]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())

const API_ORIGIN = (import.meta.env.VITE_API_BASE || 'http://localhost:8000/api').replace(/\/api\/?$/, '')
// Resolve a block's preview src — absolute URLs and site-relative /brand paths pass through.
const previewSrc = (b) => {
  const v = b.image_url || b.resolved || b.value || ''
  if (!v) return ''
  if (/^https?:\/\//.test(v) || v.startsWith('/')) return v
  return `${API_ORIGIN}/${v.replace(/^\/+/, '')}`
}

export default function Website() {
  const confirm = useConfirm()
  const { data, isLoading } = useListContentBlocksQuery(QUERY_ARGS)
  const blocks = data?.results || []

  const [createBlock] = useCreateContentBlockMutation()
  const [updateBlock] = useUpdateContentBlockMutation()
  const [deleteBlock] = useDeleteContentBlockMutation()
  const { optimisticCreate, optimisticUpdate, optimisticDelete } = useOptimisticRow('listContentBlocks', QUERY_ARGS)

  // Distinct pages, with the wired starters first.
  const pages = useMemo(() => {
    const order = ['home', 'about', 'services']
    const set = Array.from(new Set(blocks.map((b) => b.page)))
    return set.sort((a, b) => {
      const ia = order.indexOf(a); const ib = order.indexOf(b)
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
      return a.localeCompare(b)
    })
  }, [blocks])

  const [activePage, setActivePage] = useState('')
  useEffect(() => {
    if (!activePage && pages.length) setActivePage(pages[0])
  }, [pages, activePage])

  const pageBlocks = useMemo(
    () => blocks.filter((b) => b.page === activePage),
    [blocks, activePage],
  )
  const sections = useMemo(() => {
    const m = new Map()
    pageBlocks.forEach((b) => {
      if (!m.has(b.section)) m.set(b.section, [])
      m.get(b.section).push(b)
    })
    return Array.from(m.entries())
  }, [pageBlocks])

  // ---- Save one block (text/url/number/bool, or an image path/file) ----
  const saveBlock = async (block, { value, imageFile }) => {
    if (imageFile) {
      const fd = new FormData()
      fd.append('image', imageFile)
      const preview = URL.createObjectURL(imageFile)
      await optimisticUpdate({
        id: block.id,
        patch: { image_url: preview, resolved: preview },
        run: () => updateBlock({ id: block.id, body: fd }).unwrap(),
        successTitle: 'Image updated',
        errorTitle: 'Could not update image',
        describe: () => block.label || block.key,
      })
      return
    }
    await optimisticUpdate({
      id: block.id,
      patch: { value, resolved: value },
      run: () => updateBlock({ id: block.id, body: { value } }).unwrap(),
      successTitle: 'Saved',
      errorTitle: 'Could not save',
      describe: () => block.label || block.key,
    })
  }

  const handleDelete = async (block) => {
    const ok = await confirm({
      title: 'Delete this field?',
      message: `"${block.label || block.key}" will be removed from the ${prettyPage(block.page)} page. The site falls back to its built-in default.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    optimisticDelete({
      id: block.id,
      run: () => deleteBlock(block.id).unwrap(),
      successTitle: 'Field removed',
      errorTitle: 'Could not delete',
      describe: (b) => b.label || b.key,
    }).catch(() => {})
  }

  // ---- Add-field modal ----
  const [adding, setAdding] = useState(null)
  const openAdd = () => setAdding({ page: activePage || 'home', section: 'general', key: '', type: 'text', label: '', value: '' })
  const handleCreate = (e) => {
    e.preventDefault()
    if (!adding.key.trim()) { toast.error('Give the field a key'); return }
    const payload = {
      page: adding.page.trim().toLowerCase(),
      section: (adding.section || 'general').trim().toLowerCase(),
      key: adding.key.trim(),
      type: adding.type,
      label: adding.label.trim(),
      value: adding.value || '',
    }
    setAdding(null)
    optimisticCreate({
      tempRow: { ...payload, resolved: payload.value, image_url: null },
      run: () => createBlock(payload).unwrap(),
      successTitle: 'Field added',
      errorTitle: 'Could not add field',
      describe: (b) => `${prettyPage(b.page)} · ${b.label || b.key}`,
    }).then(() => setActivePage(payload.page)).catch(() => {})
  }

  const liveHref = PAGE_LIVE[activePage]

  return (
    <div>
      <PageHeader
        eyebrow="Website"
        title="Site content."
        description="Edit the words and pictures on the public site. Changes save straight to the live pages — the site keeps its built-in default for anything left blank."
        actions={
          <>
            {liveHref && (
              <a
                href={liveHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-lafoi-dark/12 bg-white text-sm font-sora text-lafoi-dark hover:border-lafoi-green/40 hover:text-lafoi-green transition-colors"
              >
                View live <ArrowSquareOut size={14} weight="bold" />
              </a>
            )}
            <PrimaryButton onClick={openAdd}>
              <Plus size={14} weight="bold" /> Add field
            </PrimaryButton>
          </>
        }
      />

      {/* Page tabs */}
      {pages.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => setActivePage(p)}
              className={`px-4 py-2 rounded-full text-sm font-sora tracking-wide transition-colors ${
                p === activePage
                  ? 'bg-lafoi-dark text-white'
                  : 'bg-white border border-lafoi-dark/12 text-lafoi-gray hover:text-lafoi-dark hover:border-lafoi-dark/25'
              }`}
            >
              {prettyPage(p)}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="py-24 flex items-center justify-center text-lafoi-gray-medium">
          <CircleNotch size={20} className="animate-spin" />
        </div>
      )}

      {!isLoading && pageBlocks.length === 0 && (
        <div className="py-20 text-center">
          <p className="font-display text-xl text-lafoi-dark mb-2">Nothing here yet</p>
          <p className="text-sm text-lafoi-gray-medium mb-6">Add a field to start managing this page's content.</p>
          <PrimaryButton onClick={openAdd}><Plus size={14} weight="bold" /> Add field</PrimaryButton>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-8">
        {sections.map(([section, items]) => (
          <section key={section}>
            <div className="flex items-center gap-3 mb-3">
              <span className="block w-8 h-px bg-lafoi-green/50" />
              <h2 className="font-sora text-[11px] font-semibold tracking-[0.28em] uppercase text-lafoi-gray-medium">
                {prettySection(section)}
              </h2>
            </div>
            <div className="grid gap-3">
              {items.map((b) => (
                <BlockEditor key={b.id} block={b} onSave={saveBlock} onDelete={handleDelete} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Add-field modal */}
      <Modal
        open={!!adding}
        onClose={() => setAdding(null)}
        title="Add a content field"
        footer={
          <>
            <SecondaryButton type="button" onClick={() => setAdding(null)}>Cancel</SecondaryButton>
            <PrimaryButton form="add-block-form" type="submit">Add field</PrimaryButton>
          </>
        }
      >
        {adding && (
          <form id="add-block-form" onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
            <Field label="Page" required>
              <Input value={adding.page} onChange={(e) => setAdding({ ...adding, page: e.target.value })} placeholder="home" required />
            </Field>
            <Field label="Section">
              <Input value={adding.section} onChange={(e) => setAdding({ ...adding, section: e.target.value })} placeholder="hero" />
            </Field>
            <Field label="Key" required>
              <Input value={adding.key} onChange={(e) => setAdding({ ...adding, key: e.target.value })} placeholder="heading" required />
            </Field>
            <Field label="Type" required>
              <Select value={adding.type} onChange={(e) => setAdding({ ...adding, type: e.target.value })}>
                {Object.entries(TYPE_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
              </Select>
            </Field>
            <Field label="Label (admin only)" className="sm:col-span-2">
              <Input value={adding.label} onChange={(e) => setAdding({ ...adding, label: e.target.value })} placeholder="What this field is, e.g. Hero heading" />
            </Field>
            <Field label={adding.type === 'image' ? 'Image path / URL' : 'Value'} className="sm:col-span-2">
              {adding.type === 'richtext'
                ? <Textarea value={adding.value} onChange={(e) => setAdding({ ...adding, value: e.target.value })} rows={3} />
                : <Input value={adding.value} onChange={(e) => setAdding({ ...adding, value: e.target.value })} placeholder={adding.type === 'image' ? '/brand/images/xx.png' : ''} />}
            </Field>
            <p className="sm:col-span-2 text-[11px] text-lafoi-gray-medium">
              To make it appear on the site, the page must read <code className="px-1 bg-lafoi-cream rounded">{`${adding.section || 'general'}.${adding.key || 'key'}`}</code> — the Home, About and Services starters are already wired.
            </p>
          </form>
        )}
      </Modal>
    </div>
  )
}

/* One editable field. Holds its own draft state and dirty tracking. */
function BlockEditor({ block, onSave, onDelete }) {
  const meta = TYPE_META[block.type] || TYPE_META.text
  const Icon = meta.icon
  const [value, setValue] = useState(block.value || '')
  const [imageFile, setImageFile] = useState(null)
  const [localPreview, setLocalPreview] = useState('')
  const [saving, setSaving] = useState(false)

  // Re-sync when the server value changes (e.g. after refetch) and we're clean.
  useEffect(() => {
    if (!imageFile) setValue(block.value || '')
  }, [block.value]) // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = imageFile ? true : (value !== (block.value || ''))
  const pending = !!block._pending

  const pickFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setImageFile(f)
    setLocalPreview(URL.createObjectURL(f))
  }

  const save = async () => {
    if (!dirty || saving) return
    setSaving(true)
    try {
      await onSave(block, { value, imageFile })
      setImageFile(null)
      setLocalPreview('')
    } catch { /* toast handled upstream */ }
    finally { setSaving(false) }
  }

  return (
    <div className={`rounded-xl border bg-white p-4 transition-colors ${dirty ? 'border-lafoi-green/40' : 'border-lafoi-dark/10'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-sora text-sm text-lafoi-dark truncate">{block.label || block.key}</p>
          <p className="text-[11px] text-lafoi-gray-medium mt-0.5 flex items-center gap-1.5">
            <Icon size={12} /> {meta.label}
            <span className="text-lafoi-dark/20">·</span>
            <code className="text-[10px]">{block.section}.{block.key}</code>
            {pending && <span className="ml-1 text-lafoi-green-dark">{block._pending.label}</span>}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {dirty && (
            <button
              onClick={save}
              disabled={saving}
              title="Save"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lafoi-green text-white text-xs font-sora font-medium hover:bg-lafoi-green-dark transition-colors disabled:opacity-60"
            >
              {saving ? <CircleNotch size={13} className="animate-spin" /> : <FloppyDisk size={13} weight="bold" />} Save
            </button>
          )}
          <button
            onClick={() => onDelete(block)}
            title="Delete field"
            className="p-2 rounded-lg text-lafoi-gray hover:text-red-600 hover:bg-red-50 min-w-[34px] min-h-[34px] inline-flex items-center justify-center"
          >
            <Trash size={14} />
          </button>
        </div>
      </div>

      {block.help_text && <p className="text-[11px] text-lafoi-gray-medium mb-2">{block.help_text}</p>}

      {/* Editor by type */}
      {block.type === 'image' ? (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-48 aspect-[4/3] rounded-lg overflow-hidden bg-lafoi-cream border border-lafoi-dark/10 shrink-0">
            {(localPreview || previewSrc(block)) ? (
              <img src={localPreview || previewSrc(block)} alt={block.label || block.key} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lafoi-gray-medium"><ImageIcon size={22} /></div>
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-lafoi-dark/15 text-sm font-sora text-lafoi-dark hover:border-lafoi-green/40 cursor-pointer transition-colors w-fit">
              <UploadSimple size={14} weight="bold" /> {imageFile ? 'Change file' : 'Upload image'}
              <input type="file" accept="image/*" onChange={pickFile} className="hidden" />
            </label>
            {imageFile && (
              <p className="text-[11px] text-lafoi-green-dark flex items-center gap-1.5">
                {imageFile.name}
                <button onClick={() => { setImageFile(null); setLocalPreview('') }} className="text-lafoi-gray hover:text-red-600"><X size={11} weight="bold" /></button>
              </p>
            )}
            <p className="text-[11px] text-lafoi-gray-medium">Or point at an existing asset path:</p>
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
        <Input
          type={block.type === 'number' ? 'number' : block.type === 'url' ? 'url' : 'text'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={block.type === 'url' ? 'https://…' : ''}
        />
      )}
    </div>
  )
}
