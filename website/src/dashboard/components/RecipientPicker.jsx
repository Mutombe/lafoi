import React from 'react'
import { Field, Input, Select } from './FormField'

/**
 * Three-mode recipient picker, shared by Quotation and Invoice modals.
 *
 *   project   — pick an existing project; bill-to pulls from project.customer
 *   customer  — pick a customer with no project linked yet
 *   freeform  — type a recipient inline (lead / one-off / referral)
 *
 * `editing` is the form-state object; this component reads from and writes to
 * its `recipient_mode`, `project`, `customer`, and `recipient_*` keys. The
 * parent's `handleSave` is responsible for sending only the relevant slice
 * of fields to the backend based on the chosen mode.
 *
 * Pass `helperText` to nuance the per-mode hints (defaults are written for
 * quotations).
 */
export default function RecipientPicker({
  editing,
  setEditing,
  projects = [],
  customers = [],
  documentNoun = 'quotation',
}) {
  const mode = editing.recipient_mode || 'project'
  const setMode = (m) => setEditing({ ...editing, recipient_mode: m })

  const tabs = [
    { key: 'project',  label: 'Project',       sub: 'Existing project' },
    { key: 'customer', label: 'Customer',      sub: 'No project yet' },
    { key: 'freeform', label: 'New recipient', sub: 'Free-form details' },
  ]

  return (
    <div className="rounded-2xl border border-lafoi-dark/10 bg-lafoi-cream/60 p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="block w-6 h-px bg-lafoi-green/60" />
        <p className="font-sora text-[10px] font-semibold tracking-[0.28em] uppercase text-lafoi-green-dark">
          {documentNoun.charAt(0).toUpperCase() + documentNoun.slice(1)} for
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((t) => {
          const active = mode === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setMode(t.key)}
              className={`flex flex-col items-start text-left px-4 py-2.5 rounded-2xl border transition-all duration-200 ${
                active
                  ? 'bg-lafoi-dark text-white border-lafoi-dark shadow-[0_6px_18px_-10px_rgba(17,17,17,0.4)]'
                  : 'bg-white text-lafoi-gray border-lafoi-dark/10 hover:border-lafoi-green/40 hover:text-lafoi-dark'
              }`}
            >
              <span className="font-sora text-[11px] tracking-wide font-medium">{t.label}</span>
              <span className={`text-[10px] mt-0.5 tracking-[0.16em] uppercase ${active ? 'text-white/70' : 'text-lafoi-gray-medium'}`}>
                {t.sub}
              </span>
            </button>
          )
        })}
      </div>

      {mode === 'project' && (
        <Field label="Project" required>
          <Select
            value={editing.project || ''}
            onChange={(e) => setEditing({ ...editing, project: e.target.value })}
            required
          >
            <option value="">— Select project —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.code} — {p.title}</option>
            ))}
          </Select>
          <p className="text-[11px] text-lafoi-gray-medium mt-1.5">
            The bill-to block on the PDF will use the project's customer record.
          </p>
        </Field>
      )}

      {mode === 'customer' && (
        <Field label="Customer" required>
          <Select
            value={editing.customer || ''}
            onChange={(e) => setEditing({ ...editing, customer: e.target.value })}
            required
          >
            <option value="">— Select customer —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.contact_person ? ` · ${c.contact_person}` : ''}
              </option>
            ))}
          </Select>
          <p className="text-[11px] text-lafoi-gray-medium mt-1.5">
            No project gets linked. You can wire this {documentNoun} to a project
            later when the work is scoped.
          </p>
        </Field>
      )}

      {mode === 'freeform' && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Recipient name" required className="sm:col-span-2">
            <Input
              value={editing.recipient_name || ''}
              onChange={(e) => setEditing({ ...editing, recipient_name: e.target.value })}
              placeholder="e.g. Tendai Moyo, Borrowdale Residence"
              required
            />
          </Field>
          <Field label="Contact person">
            <Input
              value={editing.recipient_contact || ''}
              onChange={(e) => setEditing({ ...editing, recipient_contact: e.target.value })}
              placeholder="e.g. Tendai (Owner)"
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={editing.recipient_email || ''}
              onChange={(e) => setEditing({ ...editing, recipient_email: e.target.value })}
              placeholder="name@example.com"
            />
          </Field>
          <Field label="Phone">
            <Input
              value={editing.recipient_phone || ''}
              onChange={(e) => setEditing({ ...editing, recipient_phone: e.target.value })}
              placeholder="+263 …"
            />
          </Field>
          <Field label="Address">
            <Input
              value={editing.recipient_address || ''}
              onChange={(e) => setEditing({ ...editing, recipient_address: e.target.value })}
              placeholder="Suite, street, suburb, city"
            />
          </Field>
          <p className="text-[11px] text-lafoi-gray-medium sm:col-span-2 -mt-1">
            Nothing here gets saved into your customer book. If this becomes a
            recurring client, add them under Customers afterwards.
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Build the recipient slice of the payload from form state.
 * Throws an error string when the active mode's required field is empty.
 * Use in handleSave to keep the inline error messages consistent.
 */
export function recipientPayload(editing) {
  const mode = editing.recipient_mode || 'project'
  if (mode === 'project') {
    if (!editing.project) throw 'Pick a project, or switch to the customer / new recipient mode.'
    return {
      project: Number(editing.project),
      customer: null,
      recipient_name: '', recipient_contact: '', recipient_email: '',
      recipient_phone: '', recipient_address: '',
    }
  }
  if (mode === 'customer') {
    if (!editing.customer) throw 'Pick a customer, or switch to a project / new recipient.'
    return {
      project: null,
      customer: Number(editing.customer),
      recipient_name: '', recipient_contact: '', recipient_email: '',
      recipient_phone: '', recipient_address: '',
    }
  }
  if (!(editing.recipient_name || '').trim()) {
    throw 'Type at least a recipient name, or switch modes.'
  }
  return {
    project: null,
    customer: null,
    recipient_name: editing.recipient_name.trim(),
    recipient_contact: editing.recipient_contact || '',
    recipient_email: editing.recipient_email || '',
    recipient_phone: editing.recipient_phone || '',
    recipient_address: editing.recipient_address || '',
  }
}

/**
 * Map a server-side document (Quotation/Invoice) back onto form state so
 * the picker opens in the right mode when editing existing records.
 */
export function recipientFormStateFromDoc(doc) {
  let mode = 'freeform'
  if (doc?.project) mode = 'project'
  else if (doc?.customer) mode = 'customer'
  return {
    recipient_mode: mode,
    project: doc?.project || '',
    customer: doc?.customer || '',
    recipient_name: doc?.recipient_name || '',
    recipient_contact: doc?.recipient_contact || '',
    recipient_email: doc?.recipient_email || '',
    recipient_phone: doc?.recipient_phone || '',
    recipient_address: doc?.recipient_address || '',
  }
}
