import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash, UploadSimple, FileText, Image as ImageIcon, Calendar, Plus as PlusIcon } from '@phosphor-icons/react'

import PageHeader from '../components/PageHeader'
import { fmtDate, fmtMoney, StatusBadge, STATUS_PALETTE_PROJECT } from '../components/DataTable'
import Modal from '../components/Modal'
import { Field, Input, Textarea, Select, PrimaryButton, SecondaryButton, DangerButton } from '../components/FormField'
import {
  useGetProjectQuery,
  useCreateProjectUpdateMutation,
  useUploadProjectFileMutation,
  useDeleteProjectFileMutation,
} from '../store/api'

export default function ProjectDetail() {
  const { id } = useParams()
  const { data: project, isLoading, refetch } = useGetProjectQuery(id)
  const [showUpdate, setShowUpdate] = useState(false)
  const [showFile, setShowFile] = useState(false)

  if (isLoading || !project) {
    return <div className="p-8 text-lafoi-gray-medium">Loading project…</div>
  }

  return (
    <div>
      <Link to="/dashboard/projects" className="inline-flex items-center gap-2 text-xs font-sora tracking-widest text-lafoi-gray-medium hover:text-lafoi-dark mb-4">
        <ArrowLeft size={12} /> All projects
      </Link>

      <PageHeader
        eyebrow={project.code}
        title={project.title}
        description={project.customer?.name || project.customer_name}
        actions={<StatusBadge status={project.status} palette={STATUS_PALETTE_PROJECT} />}
      />

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label="Progress" value={`${project.progress ?? 0}%`} bar={project.progress} />
        <Stat label="Category" value={project.category} />
        <Stat label="Budget" value={project.budget ? fmtMoney(project.budget) : '—'} />
        <Stat label="Area" value={project.area_sqm ? `${project.area_sqm} m²` : '—'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Description */}
        <section className="lg:col-span-2 rounded-2xl border border-lafoi-dark/10 bg-white p-6">
          <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium mb-3">Brief</p>
          <p className="font-body text-sm text-lafoi-gray whitespace-pre-line leading-relaxed">{project.description || '—'}</p>
          {project.site_address && (
            <>
              <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium mt-6 mb-2">Site address</p>
              <p className="font-body text-sm text-lafoi-gray whitespace-pre-line">{project.site_address}</p>
            </>
          )}
        </section>

        <aside className="rounded-2xl border border-lafoi-dark/10 bg-white p-6">
          <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium mb-3">Schedule</p>
          <ul className="space-y-2 text-sm">
            <li><span className="text-lafoi-gray-medium">Start:</span> {fmtDate(project.start_date)}</li>
            <li><span className="text-lafoi-gray-medium">Target end:</span> {fmtDate(project.target_end_date)}</li>
            <li><span className="text-lafoi-gray-medium">Actual end:</span> {fmtDate(project.actual_end_date)}</li>
            <li><span className="text-lafoi-gray-medium">Created:</span> {fmtDate(project.created_at)}</li>
          </ul>
        </aside>
      </div>

      {/* Updates timeline */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl">Progress timeline</h2>
          <PrimaryButton onClick={() => setShowUpdate(true)}><Plus size={14} weight="bold" /> Add update</PrimaryButton>
        </div>
        <ol className="relative border-l-2 border-lafoi-green/30 pl-6 space-y-5">
          {(project.updates || []).map((u) => (
            <li key={u.id} className="relative">
              <span className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-lafoi-green ring-4 ring-lafoi-green/15" />
              <div className="rounded-xl border border-lafoi-dark/10 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-sora text-sm font-medium">{u.title}</p>
                  <span className="text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium">{fmtDate(u.created_at)}</span>
                </div>
                {u.body && <p className="mt-2 text-sm text-lafoi-gray whitespace-pre-line">{u.body}</p>}
                {u.photo_url && (
                  <img src={u.photo_url} alt="" loading="lazy" className="mt-3 max-h-72 rounded-lg object-cover w-full" />
                )}
                <div className="mt-3 flex items-center gap-3 text-xs text-lafoi-gray-medium">
                  {u.progress_snapshot != null && <span>{u.progress_snapshot}%</span>}
                  {u.status_snapshot && <span className="capitalize">{u.status_snapshot.replace('_', ' ')}</span>}
                  {u.author?.display_name && <span>by {u.author.display_name}</span>}
                </div>
              </div>
            </li>
          ))}
          {(project.updates || []).length === 0 && (
            <li className="text-sm text-lafoi-gray-medium">No updates yet — log the first one.</li>
          )}
        </ol>
      </section>

      {/* Files */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl">Plans & files</h2>
          <PrimaryButton onClick={() => setShowFile(true)}><UploadSimple size={14} weight="bold" /> Upload file</PrimaryButton>
        </div>
        <FilesGrid files={project.files || []} onChange={refetch} />
      </section>

      <UpdateModal open={showUpdate} onClose={() => setShowUpdate(false)} project={project} onSaved={refetch} />
      <FileUploadModal open={showFile} onClose={() => setShowFile(false)} project={project} onSaved={refetch} />
    </div>
  )
}

function Stat({ label, value, bar }) {
  return (
    <div className="rounded-2xl border border-lafoi-dark/10 bg-white p-4">
      <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray-medium">{label}</p>
      <p className="font-display text-2xl mt-2 capitalize">{value || '—'}</p>
      {typeof bar === 'number' && (
        <div className="mt-2 h-1.5 rounded-full bg-lafoi-dark/8 overflow-hidden">
          <div className="h-full bg-lafoi-green transition-[width] duration-500" style={{ width: `${Math.min(100, Math.max(0, bar))}%` }} />
        </div>
      )}
    </div>
  )
}

function FilesGrid({ files, onChange }) {
  const [deleteFile] = useDeleteProjectFileMutation()
  const isImage = (f) => f.kind === 'photo' || /\.(png|jpe?g|webp|gif|avif)$/i.test(f.file_name || f.file)

  if (!files.length) {
    return <p className="text-sm text-lafoi-gray-medium">No files uploaded yet.</p>
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {files.map((f) => (
        <div key={f.id} className="group relative rounded-xl border border-lafoi-dark/10 bg-white overflow-hidden">
          <div className="aspect-[4/3] bg-lafoi-cream flex items-center justify-center overflow-hidden">
            {isImage(f) && f.file_url ? (
              <img src={f.file_url} alt={f.title || f.file_name} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <FileText size={36} className="text-lafoi-gray-medium" />
            )}
          </div>
          <div className="p-3">
            <p className="font-sora text-xs font-medium truncate">{f.title || f.file_name}</p>
            <p className="text-[10px] uppercase tracking-[0.22em] text-lafoi-gray-medium mt-0.5">{f.kind}</p>
          </div>
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {f.file_url && <a href={f.file_url} target="_blank" rel="noopener" className="p-1.5 rounded-lg bg-white/95 backdrop-blur text-lafoi-gray hover:text-lafoi-dark"><ImageIcon size={12} /></a>}
            <button
              onClick={async () => { if (window.confirm('Delete this file?')) { await deleteFile(f.id); onChange?.() } }}
              className="p-1.5 rounded-lg bg-white/95 backdrop-blur text-lafoi-gray hover:text-red-600"
            >
              <Trash size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function UpdateModal({ open, onClose, project, onSaved }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [progress, setProgress] = useState(project.progress ?? 0)
  const [status, setStatus] = useState(project.status)
  const [photo, setPhoto] = useState(null)
  const [createUpdate, { isLoading }] = useCreateProjectUpdateMutation()
  const [error, setError] = useState('')

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const fd = new FormData()
      fd.append('project', String(project.id))
      fd.append('title', title)
      fd.append('body', body)
      if (progress !== '') fd.append('progress_snapshot', String(progress))
      if (status) fd.append('status_snapshot', status)
      if (photo) fd.append('photo', photo)
      await createUpdate(fd).unwrap()
      onSaved?.()
      onClose()
      setTitle(''); setBody(''); setPhoto(null)
    } catch (e) {
      setError(e?.data ? Object.values(e.data).flat().join(' ') : 'Failed to save update.')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add progress update" footer={
      <>
        <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton form="update-form" type="submit" disabled={isLoading}>{isLoading ? 'Saving…' : 'Add update'}</PrimaryButton>
      </>
    }>
      <form id="update-form" onSubmit={handleSave} className="grid gap-4">
        {error && <div className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        <Field label="Title" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Membrane installation complete" />
        </Field>
        <Field label="Notes">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Progress %">
            <Input type="number" min="0" max="100" value={progress} onChange={(e) => setProgress(e.target.value)} />
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {['lead', 'quoted', 'approved', 'in_progress', 'on_hold', 'completed', 'cancelled'].map((s) =>
                <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Photo (optional)">
          <Input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
        </Field>
      </form>
    </Modal>
  )
}

function FileUploadModal({ open, onClose, project, onSaved }) {
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState('plan')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [uploadFile, { isLoading }] = useUploadProjectFileMutation()
  const [error, setError] = useState('')

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    if (!file) { setError('Pick a file to upload.'); return }
    try {
      const fd = new FormData()
      fd.append('project', String(project.id))
      fd.append('kind', kind)
      fd.append('title', title)
      fd.append('description', description)
      fd.append('file', file)
      await uploadFile(fd).unwrap()
      onSaved?.()
      onClose()
      setTitle(''); setDescription(''); setFile(null)
    } catch (e) {
      setError(e?.data ? Object.values(e.data).flat().join(' ') : 'Upload failed.')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Upload file" footer={
      <>
        <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton form="file-form" type="submit" disabled={isLoading}>{isLoading ? 'Uploading…' : 'Upload'}</PrimaryButton>
      </>
    }>
      <form id="file-form" onSubmit={handleSave} className="grid gap-4">
        {error && <div className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Floor plan rev 2" />
        </Field>
        <Field label="Kind">
          <Select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="plan">Plan / Drawing</option>
            <option value="photo">Photo</option>
            <option value="contract">Contract</option>
            <option value="document">Document</option>
            <option value="other">Other</option>
          </Select>
        </Field>
        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </Field>
        <Field label="File" required>
          <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
        </Field>
      </form>
    </Modal>
  )
}
