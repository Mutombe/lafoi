import React from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, UsersThree, Receipt as ReceiptIcon, FileText, IdentificationBadge, ArrowUpRight } from '@phosphor-icons/react'

import PageHeader from '../components/PageHeader'
import { fmtMoney, fmtDate, StatusBadge, STATUS_PALETTE_PROJECT, STATUS_PALETTE_DOC } from '../components/DataTable'
import {
  useListCustomersQuery,
  useListProjectsQuery,
  useListInvoicesQuery,
  useListEmployeesQuery,
  useListQuotationsQuery,
} from '../store/api'

const Stat = ({ label, value, icon: Icon, accent = 'green' }) => {
  const ring = accent === 'green' ? 'border-lafoi-green/25 bg-lafoi-green/[0.04]' : 'border-lafoi-dark/10 bg-lafoi-cream'
  const iconBg = accent === 'green' ? 'bg-lafoi-green/15 text-lafoi-green-dark' : 'bg-lafoi-dark/8 text-lafoi-dark'
  return (
    <div className={`relative p-5 rounded-2xl border ${ring}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-sora text-[10px] tracking-[0.3em] uppercase text-lafoi-gray-medium">{label}</p>
          <p className="font-display text-3xl mt-2 tracking-tight">{value}</p>
        </div>
        <span className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
          <Icon size={18} />
        </span>
      </div>
    </div>
  )
}

export default function Overview() {
  const { data: customers } = useListCustomersQuery({ page_size: 1 })
  const { data: projects } = useListProjectsQuery({ page_size: 5 })
  const { data: quotations } = useListQuotationsQuery({ page_size: 5 })
  const { data: invoices } = useListInvoicesQuery({ page_size: 5 })
  const { data: employees } = useListEmployeesQuery({ page_size: 1 })

  const outstanding = (invoices?.results || []).reduce((s, i) => s + Number(i.balance_due || 0), 0)

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Studio at a glance."
        description="Where projects stand today, what's been quoted, and what's still owed."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Stat label="Customers" value={customers?.count ?? 0} icon={UsersThree} />
        <Stat label="Projects" value={projects?.count ?? 0} icon={Briefcase} accent="dark" />
        <Stat label="Outstanding" value={fmtMoney(outstanding)} icon={ReceiptIcon} />
        <Stat label="Employees" value={employees?.count ?? 0} icon={IdentificationBadge} accent="dark" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent projects */}
        <div className="rounded-2xl border border-lafoi-dark/10 bg-white">
          <div className="flex items-center justify-between px-5 py-4 border-b border-lafoi-dark/8">
            <p className="font-sora text-xs tracking-[0.22em] uppercase text-lafoi-gray-medium">Recent projects</p>
            <Link to="/dashboard/projects" className="text-xs font-sora text-lafoi-green hover:text-lafoi-green-dark inline-flex items-center gap-1">
              All <ArrowUpRight size={11} weight="bold" />
            </Link>
          </div>
          <ul className="divide-y divide-lafoi-dark/[0.06]">
            {(projects?.results || []).map((p) => (
              <li key={p.id} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-sora text-sm font-medium truncate">{p.title}</p>
                  <p className="text-xs text-lafoi-gray-medium truncate">{p.code} · {p.customer_name || '—'}</p>
                </div>
                <StatusBadge status={p.status} palette={STATUS_PALETTE_PROJECT} />
              </li>
            ))}
            {(!projects?.results || projects.results.length === 0) && (
              <li className="px-5 py-8 text-center text-sm text-lafoi-gray-medium">No projects yet.</li>
            )}
          </ul>
        </div>

        {/* Recent invoices */}
        <div className="rounded-2xl border border-lafoi-dark/10 bg-white">
          <div className="flex items-center justify-between px-5 py-4 border-b border-lafoi-dark/8">
            <p className="font-sora text-xs tracking-[0.22em] uppercase text-lafoi-gray-medium">Recent invoices</p>
            <Link to="/dashboard/invoices" className="text-xs font-sora text-lafoi-green hover:text-lafoi-green-dark inline-flex items-center gap-1">
              All <ArrowUpRight size={11} weight="bold" />
            </Link>
          </div>
          <ul className="divide-y divide-lafoi-dark/[0.06]">
            {(invoices?.results || []).map((i) => (
              <li key={i.id} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-sora text-sm font-medium truncate">{i.number}</p>
                  <p className="text-xs text-lafoi-gray-medium truncate">{i.customer_name || '—'} · {fmtDate(i.issue_date)}</p>
                </div>
                <span className="font-display text-sm">{fmtMoney(i.total, i.currency)}</span>
                <StatusBadge status={i.status} palette={STATUS_PALETTE_DOC} />
              </li>
            ))}
            {(!invoices?.results || invoices.results.length === 0) && (
              <li className="px-5 py-8 text-center text-sm text-lafoi-gray-medium">No invoices yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
