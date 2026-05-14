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

      {mode === 'customer' && (() => {
        const picked = customers.find((c) => String(c.id) === String(editing.customer))
        return (
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
            {picked && (picked.vat_number || picked.tin_number) && (
              <p className="text-[11px] text-lafoi-gray-medium mt-1.5 flex flex-wrap gap-x-3">
                {picked.vat_number && <span>VAT: <strong className="text-lafoi-dark">{picked.vat_number}</strong></span>}
                {picked.tin_number && <span>TIN: <strong className="text-lafoi-dark">{picked.tin_number}</strong></span>}
              </p>
            )}
            <p className="text-[11px] text-lafoi-gray-medium mt-1.5">
              No project gets linked. You can wire this {documentNoun} to a project
              later when the work is scoped.
            </p>
          </Field>
        )
      })()}

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
          <Field label="VAT number">
            <Input
              value={editing.recipient_vat || ''}
              onChange={(e) => setEditing({ ...editing, recipient_vat: e.target.value })}
              placeholder="VAT registration no."
            />
          </Field>
          <Field label="TIN / BP number">
            <Input
              value={editing.recipient_tin || ''}
              onChange={(e) => setEditing({ ...editing, recipient_tin: e.target.value })}
              placeholder="ZIMRA TIN / BP number"
            />
          </Field>

          {/* Promote this free-form recipient into the customer book on save. */}
          <label className="sm:col-span-2 mt-0.5 flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-white border border-lafoi-dark/10 cursor-pointer hover:border-lafoi-green/40 transition-colors">
            <input
              type="checkbox"
              checked={!!editing.save_as_customer}
              onChange={(e) => setEditing({ ...editing, save_as_customer: e.target.checked })}
              className="w-4 h-4 mt-0.5 accent-lafoi-green shrink-0"
            />
            <span>
              <span className="font-sora text-[13px] font-medium text-lafoi-dark">
                Also add to Customers
              </span>
              <span className="block text-[11px] text-lafoi-gray-medium mt-0.5">
                Saves this recipient into your customer book and links the {documentNoun} to
                that new customer record — so next time you can just pick them.
              </span>
            </span>
          </label>

          {!editing.save_as_customer && (
            <p className="text-[11px] text-lafoi-gray-medium sm:col-span-2 -mt-1">
              Left unticked, these details live only on this {documentNoun} and aren't
              saved to your customer book.
            </p>
          )}
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
const BLANK_RECIPIENT = {
  recipient_name: '', recipient_contact: '', recipient_email: '',
  recipient_phone: '', recipient_address: '', recipient_vat: '', recipient_tin: '',
}

export function recipientPayload(editing) {
  const mode = editing.recipient_mode || 'project'
  if (mode === 'project') {
    if (!editing.project) throw 'Pick a project, or switch to the customer / new recipient mode.'
    return { project: Number(editing.project), customer: null, ...BLANK_RECIPIENT }
  }
  if (mode === 'customer') {
    if (!editing.customer) throw 'Pick a customer, or switch to a project / new recipient.'
    return { project: null, customer: Number(editing.customer), ...BLANK_RECIPIENT }
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
    recipient_vat: editing.recipient_vat || '',
    recipient_tin: editing.recipient_tin || '',
  }
}

/**
 * When a free-form recipient is being promoted to a customer, build the
 * Customer create payload. Returns null when not applicable (wrong mode or
 * checkbox unticked).
 */
export function customerFromRecipient(editing) {
  if ((editing.recipient_mode || 'project') !== 'freeform') return null
  if (!editing.save_as_customer) return null
  const name = (editing.recipient_name || '').trim()
  if (!name) return null
  return {
    name,
    customer_type: 'individual',
    contact_person: editing.recipient_contact || '',
    email: editing.recipient_email || '',
    phone: editing.recipient_phone || '',
    address: editing.recipient_address || '',
    vat_number: editing.recipient_vat || '',
    tin_number: editing.recipient_tin || '',
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
    recipient_vat: doc?.recipient_vat || '',
    recipient_tin: doc?.recipient_tin || '',
    save_as_customer: false,
  }
}
