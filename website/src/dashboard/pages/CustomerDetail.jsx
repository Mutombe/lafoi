import React, { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash, UploadSimple, FileText, Image as ImageIcon,
  CircleNotch, MapPinLine, Briefcase, DownloadSimple, X,
} from '@phosphor-icons/react'
import { useConfirm } from '../components/ConfirmDialog'
import { toast } from 'sonner'

import DataTable, { fmtDate, fmtMoney, StatusBadge, STATUS_PALETTE_PROJECT } from '../components/DataTable'
import Modal from '../components/Modal'
import Skeleton, { SkeletonPageHeader } from '../components/Skeleton'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton } from '../components/FormField'
import {
  useGetCustomerQuery,
  useListProjectsQuery,
  useUploadCustomerFileMutation,
  useDeleteCustomerFileMutation,
} from '../store/api'

const isImageFile = (f) =>
  f.kind === 'photo' || /\.(png|jpe?g|webp|gif|avif)$/i.test(f.file_name || f.file || '')

const SITE_VISIT_PALETTE = {
  'Not required': 'bg-lafoi-cream text-lafoi-gray border-lafoi-dark/10',
  'To be done':   'bg-amber-50 text-amber-700 border-amber-200',
  'Done':         'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/40',
}

export default function CustomerDetail() {
  const { id } = useParams()
  const { data: cust, isLoading } = useGetCustomerQuery(id)
  const { data: projData } = useListProjectsQuery({ customer: id, page_size: 100 })
  const [uploadOpen, setUploadOpen] = useState(false)

  if (isLoading || !cust) {
    return (
      <div>
        <Skeleton className="h-3 w-24 mb-4" />
        <SkeletonPageHeader />
      </div>
    )
  }

  const files = cust.files || []
  const photos = files.filter(isImageFile)
  const docs = files.filter((f) => !isImageFile(f))
  const projects = projData?.results || []
  const initials = (cust.name?.trim()?.[0] || 'C').toUpperCase()
  const siteVisit = cust.site_visit_status && cust.site_visit_status !== 'not_required'

  return (
    <div>
      <Link to="/dashboard/customers" className="inline-flex items-center gap-2 text-xs font-sora tracking-widest text-lafoi-gray-medium hover:text-lafoi-dark mb-4">
        <ArrowLeft size={12} /> All customers
      </Link>

      {/* Header card */}
      <div className="rounded-3xl border border-lafoi-dark/10 bg-white p-6 sm:p-7 mb-6 flex items-start gap-5">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-lafoi-green/10 border border-lafoi-green/30 flex items-center justify-center font-display text-2xl sm:text-3xl text-lafoi-green-dark shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray-medium capitalize">{cust.customer_type}</p>
          <h2 className="font-display text-2xl sm:text-3xl tracking-tight truncate">{cust.name}</h2>
          <p className="text-sm text-lafoi-gray mt-0.5">
            {cust.contact_person || '—'}{cust.phone ? ` · ${cust.phone}` : ''}{cust.email ? ` · ${cust.email}` : ''}
          </p>
          {siteVisit && (
            <div className="mt-2 inline-flex items-center gap-1.5">
              <MapPinLine size={13} className="text-amber-700" />
              <StatusBadge status={cust.site_visit_label} palette={SITE_VISIT_PALETTE} />
              {cust.site_visit_date && <span className="text-[11px] text-lafoi-gray-medium tabular-nums">{fmtDate(cust.site_visit_date)}</span>}
            </div>
          )}
        </div>
        <Link to="/dashboard/customers" className="hidden sm:inline-flex text-xs font-sora tracking-wider text-lafoi-gray hover:text-lafoi-green shrink-0">
          Edit details →
        </Link>
      </div>

      {/* Quick facts */}
      <div className="rounded-2xl border border-lafoi-dark/10 bg-white mb-6">
        <dl className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-lafoi-dark/[0.06]">
          {[
            ['City', cust.city || '—'],
            ['Country', cust.country || '—'],
            ['Projects', String(projects.length)],
            ['VAT number', cust.vat_number || '—'],
            ['TIN / BP', cust.tin_number || '—'],
            ['Address', cust.address || '—'],
          ].map(([label, value], idx) => (
            <div key={label} className={`px-5 py-4 ${idx >= 3 ? 'sm:border-t sm:border-lafoi-dark/[0.06]' : ''}`}>
              <dt className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray-medium">{label}</dt>
              <dd className="mt-1 text-sm font-sora text-lafoi-dark">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Files & drawings */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="font-display text-xl text-lafoi-dark">Drawings &amp; files</h3>
        <PrimaryButton onClick={() => setUploadOpen(true)}>
          <UploadSimple size={14} weight="bold" /> Upload
        </PrimaryButton>
      </div>

      {files.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-lafoi-dark/15 px-6 py-12 text-center mb-8">
          <ImageIcon size={28} className="mx-auto text-lafoi-gray-medium" />
          <p className="mt-3 font-sora text-sm font-medium text-lafoi-dark">No files yet</p>
          <p className="mt-1 text-xs text-lafoi-gray-medium">Upload drawings, site photos, or documents for this customer.</p>
        </div>
      ) : (
        <div className="space-y-6 mb-8">
          {photos.length > 0 && <PhotoGrid files={photos} />}
          {docs.length > 0 && <DocList files={docs} />}
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <>
          <h3 className="font-display text-xl text-lafoi-dark mb-3">Projects</h3>
          <DataTable
            columns={[
              { key: 'code', label: 'Code', priority: 'medium', render: (r) => <span className="font-sora text-xs">{r.code}</span> },
              { key: 'title', label: 'Project', priority: 'high', render: (r) => (
                <Link to={`/dashboard/projects/${r.id}`} className="font-sora text-sm font-medium hover:text-lafoi-green">{r.title}</Link>
              )},
              { key: 'status', label: 'Status', priority: 'high', render: (r) => <StatusBadge status={r.status} palette={STATUS_PALETTE_PROJECT} /> },
              { key: 'budget', label: 'Budget', priority: 'medium', render: (r) => r.budget ? fmtMoney(r.budget) : '—' },
            ]}
            rows={projects}
            isLoading={false}
            empty="No projects."
          />
        </>
      )}

      <FileUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} customerId={cust.id} />
    </div>
  )
}

/* ---- Photo grid ---- */
function PhotoGrid({ files }) {
  const confirm = useConfirm()
  const [deleteFile] = useDeleteCustomerFileMutation()
  const [lightbox, setLightbox] = useState(null)

  const remove = async (f) => {
    if (!(await confirm({ title: 'Delete photo?', message: `"${f.title || f.file_name}" will be removed.`, confirmLabel: 'Delete', danger: true }))) return
    try { await deleteFile(f.id).unwrap(); toast.success('Photo removed') }
    catch { toast.error('Could not delete') }
  }

  return (
    <div>
      <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray-medium mb-2">Photos &amp; drawings</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {files.map((f) => (
          <div key={f.id} className="group relative rounded-xl overflow-hidden border border-lafoi-dark/10 bg-lafoi-cream aspect-[4/3]">
            <img
              src={f.file_url}
              alt={f.title || ''}
              className="w-full h-full object-cover cursor-zoom-in"
              onClick={() => setLightbox(f)}
            />
            <div className="absolute inset-x-0 bottom-0 px-2 py-1.5 bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-[11px] text-white font-sora truncate">{f.title || f.file_name}</p>
            </div>
            <button
              onClick={() => remove(f)}
              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 text-lafoi-gray hover:text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete"
            >
              <Trash size={13} />
            </button>
          </div>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25" onClick={() => setLightbox(null)}>
            <X size={18} weight="bold" />
          </button>
          <img src={lightbox.file_url} alt={lightbox.title || ''} className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}

/* ---- Document list ---- */
function DocList({ files }) {
  const confirm = useConfirm()
  const [deleteFile] = useDeleteCustomerFileMutation()

  const remove = async (f) => {
    if (!(await confirm({ title: 'Delete file?', message: `"${f.title || f.file_name}" will be removed.`, confirmLabel: 'Delete', danger: true }))) return
    try { await deleteFile(f.id).unwrap(); toast.success('File removed') }
    catch { toast.error('Could not delete') }
  }

  return (
    <div>
      <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray-medium mb-2">Documents</p>
      <ul className="rounded-2xl border border-lafoi-dark/10 bg-white divide-y divide-lafoi-dark/[0.06]">
        {files.map((f) => (
          <li key={f.id} className="flex items-center gap-3 px-4 py-3">
            <span className="inline-flex w-9 h-9 rounded-lg bg-lafoi-cream text-lafoi-gray items-center justify-center shrink-0">
              <FileText size={16} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-sora text-sm text-lafoi-dark truncate">{f.title || f.file_name}</p>
              <p className="text-[11px] text-lafoi-gray-medium capitalize">{(f.kind || '').replace('_', ' ')} · {fmtDate(f.uploaded_at)}</p>
            </div>
            <a href={f.file_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark" title="Open / download">
              <DownloadSimple size={15} />
            </a>
            <button onClick={() => remove(f)} className="p-2 rounded-lg hover:bg-red-50 text-lafoi-gray hover:text-red-600" title="Delete">
              <Trash size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---- Upload modal ---- */
function FileUploadModal({ open, onClose, customerId }) {
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState('drawing')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [uploadFile, { isLoading }] = useUploadCustomerFileMutation()
  const [error, setError] = useState('')

  const reset = () => { setTitle(''); setKind('drawing'); setDescription(''); setFile(null); setError('') }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    if (!file) { setError('Pick a file to upload.'); return }
    try {
      const fd = new FormData()
      fd.append('customer', String(customerId))
      fd.append('kind', kind)
      fd.append('title', title || file.name)
      fd.append('description', description)
      fd.append('file', file)
      await uploadFile(fd).unwrap()
      toast.success('File uploaded', { description: title || file.name })
      reset()
      onClose()
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Upload failed.'
      setError(msg)
      toast.error('Upload failed', { description: msg })
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose() }}
      title="Upload drawing or file"
      footer={
        <>
          <SecondaryButton type="button" onClick={() => { reset(); onClose() }}>Cancel</SecondaryButton>
          <PrimaryButton form="cust-file-form" type="submit" disabled={isLoading}>
            {isLoading ? (<><CircleNotch size={14} className="animate-spin" /> Uploading…</>) : 'Upload'}
          </PrimaryButton>
        </>
      }
    >
      <form id="cust-file-form" onSubmit={handleSave} className="grid gap-4">
        {error && <div className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        <Field label="File" required>
          <Input type="file" accept="image/*,application/pdf,.dwg,.doc,.docx,.xls,.xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Kind">
            <Select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="drawing">Drawing / Plan</option>
              <option value="photo">Photo</option>
              <option value="document">Document</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Defaults to the file name" />
          </Field>
        </div>
        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </Field>
      </form>
    </Modal>
  )
}
