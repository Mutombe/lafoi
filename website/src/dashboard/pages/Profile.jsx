import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { CircleNotch, Key, UserCircle, ShieldCheck, IdentificationCard } from '@phosphor-icons/react'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import { Field, Input, PrimaryButton, SecondaryButton } from '../components/FormField'
import { fmtDate } from '../components/DataTable'
import {
  useMeQuery,
  useUpdateMeMutation,
  useChangePasswordMutation,
  api,
} from '../store/api'
import { setCredentials } from '../store/authSlice'

/**
 * Self-service profile page. Anyone signed in lands here from the user
 * card in the sidebar. Two cards:
 *
 *   1. Personal info — first/last name, email, phone, job title.
 *   2. Password — current + new + confirm; verified server-side.
 *
 * Role, module access and active status remain admin-only — those fields
 * are visible read-only in a small footer card so the user knows what
 * they have today without thinking they can self-grant.
 */
export default function Profile() {
  const dispatch = useDispatch()
  const { data: me, isLoading } = useMeQuery()
  const [updateMe] = useUpdateMeMutation()
  const [changePassword] = useChangePasswordMutation()

  // ----- Profile form -----
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', job_title: '',
  })
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    if (me) {
      setForm({
        first_name: me.first_name || '',
        last_name:  me.last_name  || '',
        email:      me.email      || '',
        phone:      me.phone      || '',
        job_title:  me.job_title  || '',
      })
    }
  }, [me])

  const dirty = me && (
    form.first_name !== (me.first_name || '') ||
    form.last_name  !== (me.last_name  || '') ||
    form.email      !== (me.email      || '') ||
    form.phone      !== (me.phone      || '') ||
    form.job_title  !== (me.job_title  || '')
  )

  const handleProfileSave = async (e) => {
    e.preventDefault()
    if (!dirty || savingProfile) return
    setSavingProfile(true)
    try {
      const updated = await updateMe(form).unwrap()
      // Keep the cached auth user in sync so the sidebar reflects the new name
      // immediately, and patch the me() query cache for any other consumer.
      dispatch(setCredentials({ user: updated }))
      dispatch(api.util.upsertQueryData('me', undefined, updated))
      toast.success('Profile updated')
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Save failed'
      toast.error('Could not update profile', { description: msg })
    } finally {
      setSavingProfile(false)
    }
  }

  // ----- Password form -----
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [savingPw, setSavingPw] = useState(false)

  const pwMismatch = pw.next && pw.confirm && pw.next !== pw.confirm
  const pwTooShort = pw.next && pw.next.length < 8

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    if (savingPw) return
    if (!pw.current || !pw.next) {
      toast.error('Fill in both current and new password')
      return
    }
    if (pw.next !== pw.confirm) {
      toast.error('New password and confirmation do not match')
      return
    }
    if (pw.next.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    setSavingPw(true)
    try {
      await changePassword({ current_password: pw.current, new_password: pw.next }).unwrap()
      setPw({ current: '', next: '', confirm: '' })
      toast.success('Password updated', { description: 'Use the new password on your next sign-in.' })
    } catch (err) {
      const msg = err?.data ? Object.values(err.data).flat().join(' ') : 'Password change failed'
      toast.error('Could not change password', { description: msg })
    } finally {
      setSavingPw(false)
    }
  }

  if (isLoading || !me) {
    return (
      <div className="flex items-center justify-center py-24 text-lafoi-gray-medium">
        <CircleNotch size={20} className="animate-spin" />
      </div>
    )
  }

  const moduleKeys = Object.entries(me.module_access || {})
    .filter(([, v]) => v)
    .map(([k]) => k)

  return (
    <div>
      <PageHeader
        eyebrow="Profile"
        title="Your account."
        description="Update how you appear in the studio and change your sign-in password."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Identity card */}
        <div className="lg:col-span-1 space-y-5">
          <div className="rounded-2xl border border-lafoi-dark/10 bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-lafoi-green/15 border border-lafoi-green/30 flex items-center justify-center font-display text-2xl text-lafoi-green-dark">
                {(me.first_name?.[0] || me.username?.[0] || 'L').toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-display text-lg text-lafoi-dark truncate">{me.display_name || me.username}</p>
                <p className="font-sora text-[10px] tracking-[0.24em] uppercase text-lafoi-gray-medium mt-0.5">
                  @{me.username}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-lafoi-dark/8 space-y-2.5">
              <Row icon={IdentificationCard} label="Role"          value={me.role} />
              <Row icon={ShieldCheck}         label="Account"       value={me.is_active ? 'Active' : 'Disabled'} />
              <Row icon={UserCircle}          label="Joined"        value={fmtDate(me.date_joined)} />
              <Row icon={Key}                 label="Last sign-in"  value={me.last_login ? fmtDate(me.last_login) : 'Never'} />
            </div>
          </div>

          {/* Module access — read-only summary */}
          <div className="rounded-2xl border border-lafoi-dark/10 bg-white p-6">
            <p className="font-sora text-[10px] tracking-[0.28em] uppercase text-lafoi-gray-medium mb-3">
              Module access
            </p>
            {me.role === 'admin' || me.is_superuser ? (
              <p className="font-sora text-sm text-lafoi-dark">
                Administrator — full access to every module.
              </p>
            ) : moduleKeys.length === 0 ? (
              <p className="font-sora text-sm text-lafoi-gray-medium">No modules enabled yet — ask an administrator.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {moduleKeys.map((k) => (
                  <span key={k} className="inline-flex items-center px-2 py-1 rounded-full bg-lafoi-green/10 text-lafoi-green-dark border border-lafoi-green/25 text-[10px] font-sora tracking-[0.18em] uppercase">
                    {k.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-4 text-[11px] font-sora text-lafoi-gray-medium">
              Module access is set by an administrator — contact them to request changes.
            </p>
          </div>
        </div>

        {/* Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal info */}
          <form onSubmit={handleProfileSave} className="rounded-2xl border border-lafoi-dark/10 bg-white p-6 sm:p-7">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-display text-xl text-lafoi-dark">Personal information</p>
                <p className="font-sora text-[11px] text-lafoi-gray-medium mt-1">
                  How your name and contact details appear across the studio.
                </p>
              </div>
              <UserCircle size={28} className="text-lafoi-green/40" weight="thin" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="First name" required>
                <Input
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  required
                />
              </Field>
              <Field label="Last name">
                <Input
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                />
              </Field>
              <Field label="Email" className="sm:col-span-2">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+263 …"
                />
              </Field>
              <Field label="Job title">
                <Input
                  value={form.job_title}
                  onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                  placeholder="e.g. Project Coordinator"
                />
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <SecondaryButton
                type="button"
                onClick={() => setForm({
                  first_name: me.first_name || '',
                  last_name:  me.last_name  || '',
                  email:      me.email      || '',
                  phone:      me.phone      || '',
                  job_title:  me.job_title  || '',
                })}
                disabled={!dirty || savingProfile}
              >
                Reset
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={!dirty || savingProfile}>
                {savingProfile ? <><CircleNotch size={14} className="animate-spin" /> Saving…</> : 'Save changes'}
              </PrimaryButton>
            </div>
          </form>

          {/* Password */}
          <form onSubmit={handlePasswordSave} className="rounded-2xl border border-lafoi-dark/10 bg-white p-6 sm:p-7">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-display text-xl text-lafoi-dark">Change password</p>
                <p className="font-sora text-[11px] text-lafoi-gray-medium mt-1">
                  Sets a new sign-in password. You'll keep the current session — just use the new password next time.
                </p>
              </div>
              <Key size={28} className="text-lafoi-green/40" weight="thin" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Current password" required className="sm:col-span-2">
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={pw.current}
                  onChange={(e) => setPw({ ...pw, current: e.target.value })}
                  required
                />
              </Field>
              <Field label="New password" required>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={pw.next}
                  onChange={(e) => setPw({ ...pw, next: e.target.value })}
                  required
                  minLength={8}
                />
                {pwTooShort && (
                  <p className="mt-1 text-[11px] text-amber-700 font-sora">Must be at least 8 characters.</p>
                )}
              </Field>
              <Field label="Confirm new password" required>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={pw.confirm}
                  onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                  required
                />
                {pwMismatch && (
                  <p className="mt-1 text-[11px] text-red-600 font-sora">Doesn't match the new password.</p>
                )}
              </Field>
            </div>

            <div className="mt-6 flex justify-end">
              <PrimaryButton
                type="submit"
                disabled={savingPw || !pw.current || !pw.next || pw.next !== pw.confirm || pw.next.length < 8}
              >
                {savingPw ? <><CircleNotch size={14} className="animate-spin" /> Updating…</> : 'Update password'}
              </PrimaryButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={14} className="text-lafoi-gray-medium shrink-0" />
      <span className="font-sora text-[10px] tracking-[0.22em] uppercase text-lafoi-gray-medium w-24 shrink-0">{label}</span>
      <span className="font-sora text-sm text-lafoi-dark capitalize truncate">{value || '—'}</span>
    </div>
  )
}
