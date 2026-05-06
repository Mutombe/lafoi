import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  Plus, MagnifyingGlass, PencilSimple, Key, Power, Trash, ShieldCheck,
  CircleNotch, UsersFour,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import Skeleton from '../components/Skeleton'
import { Field, Input, Select, PrimaryButton, SecondaryButton, DangerButton } from '../components/FormField'
import useDebouncedValue from '../hooks/useDebouncedValue'
import useOptimisticListUpdate from '../hooks/useOptimisticListUpdate'
import { selectCurrentUser } from '../store/authSlice'
import {
  useListUsersQuery,
  useListModulesQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useResetUserPasswordMutation,
  useToggleUserActiveMutation,
  useSetUserModulesMutation,
} from '../store/api'

const ROLES = [
  { key: '', label: 'All' },
  { key: 'admin', label: 'Admin' },
  { key: 'manager', label: 'Manager' },
  { key: 'staff', label: 'Staff' },
]

const ROLE_PALETTE = {
  admin: 'bg-lafoi-green/15 text-lafoi-green-dark border-lafoi-green/30',
  manager: 'bg-blue-50 text-blue-700 border-blue-200',
  staff: 'bg-lafoi-gray-light text-lafoi-gray border-lafoi-dark/10',
}

const initials = (u) => {
  const f = (u.first_name || '').trim()[0]
  const l = (u.last_name || '').trim()[0]
  if (f || l) return `${f || ''}${l || ''}`.toUpperCase()
  return (u.username || '?').slice(0, 2).toUpperCase()
}

/* ============================================================================
   Module switch
   ========================================================================= */
function ModuleSwitch({ checked, label, onChange, disabled }) {
  return (
    <label className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg border transition-colors ${
      checked
        ? 'border-lafoi-green/30 bg-lafoi-green/[0.06]'
        : 'border-lafoi-dark/10 bg-white hover:border-lafoi-dark/20'
    } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-lafoi-green' : 'bg-lafoi-dark/15'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
            checked ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </button>
      <span className="flex-1 text-xs font-sora text-lafoi-dark truncate">{label}</span>
    </label>
  )
}

/* ============================================================================
   User card
   ========================================================================= */
function UserCard({ user, modules, onEdit, onResetPwd, onDelete, currentUser, applyOptimistic }) {
  const [setModules, setModulesState] = useSetUserModulesMutation()
  const [toggleActive, toggleActiveState] = useToggleUserActiveMutation()

  const isAdmin = user.role === 'admin' || user.is_superuser
  const isSelf = currentUser?.id === user.id

  const handleToggleModule = async (key, value) => {
    const next = { ...(user.module_access || {}) }
    if (value) next[key] = true
    else delete next[key]
    try {
      await applyOptimistic(
        (draft) => {
          if (!draft?.results) return
          const row = draft.results.find((r) => r.id === user.id)
          if (row) row.module_access = next
        },
        () => setModules({ id: user.id, module_access: next }).unwrap(),
      )
      toast.success('Modules updated', { description: `${user.display_name || user.username}` })
    } catch (err) {
      toast.error('Could not update modules', { description: err?.data?.detail || 'Please try again.' })
    }
  }

  const handleToggleActive = async () => {
    try {
      await applyOptimistic(
        (draft) => {
          if (!draft?.results) return
          const row = draft.results.find((r) => r.id === user.id)
          if (row) row.is_active = !row.is_active
        },
        () => toggleActive(user.id).unwrap(),
      )
      toast.success(user.is_active ? 'User deactivated' : 'User activated')
    } catch (err) {
      toast.error('Could not change status', { description: err?.data?.detail || 'Please try again.' })
    }
  }

  return (
    <article className="rounded-2xl border border-lafoi-dark/10 bg-white shadow-[0_1px_2px_rgba(17,17,17,0.04)] overflow-hidden flex flex-col">
      {/* Header */}
      <header className="px-5 pt-5 pb-4 flex items-start gap-3 border-b border-lafoi-dark/[0.06]">
        <div className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center font-display text-base text-white"
          style={{ background: 'linear-gradient(135deg, #1A8A2E 0%, #15572E 100%)' }}>
          {initials(user)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sora text-sm font-medium text-lafoi-dark truncate">
            {user.display_name || `${user.first_name} ${user.last_name}`.trim() || user.username}
          </p>
          <p className="text-xs text-lafoi-gray-medium truncate">@{user.username}</p>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-sora tracking-[0.18em] uppercase ${
              ROLE_PALETTE[user.role] || ROLE_PALETTE.staff
            }`}>
              {user.role}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sora tracking-[0.18em] uppercase ${
              user.is_active
                ? 'bg-lafoi-green/10 text-lafoi-green-dark'
                : 'bg-lafoi-gray-light text-lafoi-gray'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-lafoi-green' : 'bg-lafoi-gray-medium'}`} />
              {user.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </header>

      {/* Modules */}
      <div className="px-5 py-4 flex-1">
        <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray-medium mb-3">
          Access
        </p>
        {isAdmin ? (
          <div className="rounded-xl border border-lafoi-green/30 bg-lafoi-green/[0.06] px-4 py-3 flex items-center gap-3">
            <ShieldCheck size={18} className="text-lafoi-green" weight="fill" />
            <div>
              <p className="font-sora text-sm font-medium text-lafoi-dark">Full access</p>
              <p className="text-xs text-lafoi-gray-medium">Admins bypass module gating.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {modules.map((m) => (
              <ModuleSwitch
                key={m.key}
                label={m.label}
                checked={Boolean(user.module_access?.[m.key])}
                onChange={(v) => handleToggleModule(m.key, v)}
                disabled={setModulesState.isLoading}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="px-3 py-2 border-t border-lafoi-dark/[0.06] bg-lafoi-cream/40 flex items-center justify-end gap-1">
        <button
          onClick={() => onEdit(user)}
          title="Edit"
          className="p-2 rounded-lg text-lafoi-gray hover:bg-white hover:text-lafoi-dark transition-colors"
        >
          <PencilSimple size={14} />
        </button>
        <button
          onClick={() => onResetPwd(user)}
          title="Reset password"
          className="p-2 rounded-lg text-lafoi-gray hover:bg-white hover:text-lafoi-dark transition-colors"
        >
          <Key size={14} />
        </button>
        <button
          onClick={handleToggleActive}
          disabled={toggleActiveState.isLoading || isSelf}
          title={isSelf ? "Can't toggle yourself" : (user.is_active ? 'Deactivate' : 'Activate')}
          className="p-2 rounded-lg text-lafoi-gray hover:bg-white hover:text-lafoi-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Power size={14} />
        </button>
        <button
          onClick={() => onDelete(user)}
          disabled={isSelf}
          title={isSelf ? "Can't delete yourself" : 'Delete'}
          className="p-2 rounded-lg text-lafoi-gray hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Trash size={14} />
        </button>
      </footer>
    </article>
  )
}

/* ============================================================================
   Modals
   ========================================================================= */
const emptyUser = {
  username: '', email: '', first_name: '', last_name: '',
  phone: '', role: 'staff', job_title: '', password: '',
}

function UserFormModal({ open, onClose, editing, onSaved }) {
  const isNew = editing && !editing.id
  const [form, setForm] = useState(editing || emptyUser)
  const [error, setError] = useState('')
  const [createUser, createState] = useCreateUserMutation()
  const [updateUser, updateState] = useUpdateUserMutation()

  React.useEffect(() => {
    if (open) {
      setForm(editing || emptyUser)
      setError('')
    }
  }, [open, editing])

  if (!open) return null
  const saving = createState.isLoading || updateState.isLoading

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone,
      role: form.role,
      job_title: form.job_title,
    }
    if (isNew && form.password) payload.password = form.password
    try {
      if (isNew) {
        await createUser(payload).unwrap()
        toast.success('User created', { description: payload.username })
      } else {
        await updateUser({ id: editing.id, ...payload }).unwrap()
        toast.success('User updated', { description: payload.username })
      }
      onSaved?.()
      onClose()
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Save failed.'
      setError(msg)
      toast.error('Could not save user', { description: msg })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isNew ? 'New user' : `Edit ${editing.username}`}
      size="lg"
      footer={
        <>
          <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton form="user-form" type="submit" disabled={saving}>
            {saving ? (<><CircleNotch size={14} className="animate-spin" /> Saving…</>) : 'Save'}
          </PrimaryButton>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
        {error && <div className="sm:col-span-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        <Field label="Username" required>
          <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required disabled={!isNew} />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="First name">
          <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
        </Field>
        <Field label="Last name">
          <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="Role">
          <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </Select>
        </Field>
        <Field label="Job title" className="sm:col-span-2">
          <Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
        </Field>
        {isNew && (
          <Field label="Password" required className="sm:col-span-2" hint="At least 8 characters. The user can sign in immediately.">
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
          </Field>
        )}
      </form>
    </Modal>
  )
}

function ResetPasswordModal({ open, onClose, user }) {
  const [pwd, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [reset, { isLoading }] = useResetUserPasswordMutation()

  React.useEffect(() => {
    if (open) { setPwd(''); setConfirm(''); setError('') }
  }, [open])

  if (!open) return null

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    if (pwd !== confirm) { setError("Passwords don't match."); return }
    if (pwd.length < 8) { setError('Use at least 8 characters.'); return }
    try {
      await reset({ id: user.id, password: pwd }).unwrap()
      toast.success('Password reset', { description: user.username })
      onClose()
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Reset failed.'
      setError(msg)
      toast.error('Could not reset password', { description: msg })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Reset password — ${user.username}`}
      size="md"
      footer={
        <>
          <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton form="reset-form" type="submit" disabled={isLoading}>
            {isLoading ? (<><CircleNotch size={14} className="animate-spin" /> Updating…</>) : 'Reset password'}
          </PrimaryButton>
        </>
      }
    >
      <form id="reset-form" onSubmit={handleSave} className="grid gap-4">
        {error && <div className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        <Field label="New password" required>
          <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} minLength={8} required />
        </Field>
        <Field label="Confirm password" required>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} required />
        </Field>
      </form>
    </Modal>
  )
}

function DeleteUserModal({ open, onClose, user, onSaved }) {
  const [deleteUser, { isLoading }] = useDeleteUserMutation()
  if (!open) return null
  const handleDelete = async () => {
    try {
      await deleteUser(user.id).unwrap()
      toast.success('User deleted', { description: user.username })
      onSaved?.()
      onClose()
    } catch (err) {
      const msg = err?.data?.detail || (err?.data ? Object.values(err.data).flat().join(' ') : 'Delete failed.')
      toast.error('Could not delete user', { description: msg })
    }
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete user"
      size="sm"
      footer={
        <>
          <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
          <DangerButton type="button" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? (<><CircleNotch size={14} className="animate-spin" /> Deleting…</>) : 'Delete user'}
          </DangerButton>
        </>
      }
    >
      <p className="text-sm text-lafoi-gray">
        Permanently delete <span className="font-medium text-lafoi-dark">{user.display_name || user.username}</span>?
        This cannot be undone — they’ll lose access immediately.
      </p>
    </Modal>
  )
}

/* ============================================================================
   Page
   ========================================================================= */
export default function Users() {
  const currentUser = useSelector(selectCurrentUser)
  const queryArgs = {}
  const { data, isLoading } = useListUsersQuery(queryArgs)
  const { data: modules = [] } = useListModulesQuery()
  const applyOptimistic = useOptimisticListUpdate('listUsers', queryArgs)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [roleFilter, setRoleFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [resetting, setResetting] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const users = data?.results || []
  const filtered = useMemo(() => {
    const q = (debouncedSearch || '').trim().toLowerCase()
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false
      if (q) {
        const hay = `${u.username} ${u.first_name} ${u.last_name} ${u.email}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [users, debouncedSearch, roleFilter])

  return (
    <div>
      <PageHeader
        eyebrow="Users"
        title="Studio team & access."
        description="Add team-mates, set their role, and gate which dashboard modules they see."
        actions={
          <PrimaryButton onClick={() => setEditing({ ...emptyUser })}>
            <Plus size={14} weight="bold" /> New user
          </PrimaryButton>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="relative">
          <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lafoi-gray-medium" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, username, email"
            className="pl-9 pr-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body w-72"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {ROLES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRoleFilter(r.key)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-sora tracking-[0.18em] uppercase transition-colors border ${
                roleFilter === r.key
                  ? 'bg-lafoi-dark text-white border-lafoi-dark'
                  : 'bg-white text-lafoi-gray border-lafoi-dark/12 hover:border-lafoi-green hover:text-lafoi-green'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-lafoi-dark/10 bg-white p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton variant="circle" className="h-11 w-11" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-2.5 w-1/3" />
                </div>
              </div>
              <Skeleton variant="block" className="h-32 w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-lafoi-dark/10 bg-white py-16 text-center">
          <UsersFour size={32} className="mx-auto text-lafoi-gray-medium" />
          <p className="mt-3 font-sora text-sm font-medium text-lafoi-dark">No users match</p>
          <p className="mt-1 text-xs text-lafoi-gray-medium">Adjust your search or role filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((u) => (
            <UserCard
              key={u.id}
              user={u}
              modules={modules}
              currentUser={currentUser}
              onEdit={setEditing}
              onResetPwd={setResetting}
              onDelete={setDeleting}
              applyOptimistic={applyOptimistic}
            />
          ))}
        </div>
      )}

      <UserFormModal open={!!editing} onClose={() => setEditing(null)} editing={editing} onSaved={() => {}} />
      {resetting && (
        <ResetPasswordModal open={!!resetting} onClose={() => setResetting(null)} user={resetting} />
      )}
      {deleting && (
        <DeleteUserModal open={!!deleting} onClose={() => setDeleting(null)} user={deleting} onSaved={() => {}} />
      )}
    </div>
  )
}
