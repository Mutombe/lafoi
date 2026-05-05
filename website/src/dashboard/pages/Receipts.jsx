import React, { useState } from 'react'
import { useStore } from 'react-redux'
import { Trash, MagnifyingGlass, DownloadSimple } from '@phosphor-icons/react'

import PageHeader from '../components/PageHeader'
import DataTable, { fmtDate, fmtMoney } from '../components/DataTable'
import { Select } from '../components/FormField'
import { useListReceiptsQuery, useDeleteReceiptMutation, downloadPdf } from '../store/api'

export default function Receipts() {
  const store = useStore()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('')

  const { data, isFetching } = useListReceiptsQuery({ page, search: search || undefined, method: methodFilter || undefined })
  const [deleteReceipt] = useDeleteReceiptMutation()

  const handlePdf = async (row) => {
    try { await downloadPdf(`receipts/${row.id}/pdf/`, `${row.number}.pdf`, store.getState) }
    catch (e) { window.alert('PDF download failed: ' + e.message) }
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete receipt ${row.number}? The invoice balance will be recalculated.`)) return
    try { await deleteReceipt(row.id).unwrap() } catch (e) { window.alert(e?.data?.detail || 'Delete failed.') }
  }

  const columns = [
    { key: 'number', label: 'Receipt', render: (r) => <span className="font-sora text-xs">{r.number}</span> },
    { key: 'invoice_number', label: 'Invoice' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'amount', label: 'Amount', render: (r) => <span className="tabular-nums font-sora">{fmtMoney(r.amount)}</span> },
    { key: 'method', label: 'Method', render: (r) => <span className="capitalize text-xs font-sora">{(r.method || '').replace('_', ' ')}</span> },
    { key: 'received_at', label: 'Received', render: (r) => fmtDate(r.received_at) },
    { key: 'actions', label: '', render: (r) => (
      <div className="flex justify-end gap-1">
        <button title="PDF" onClick={(e) => { e.stopPropagation(); handlePdf(r) }} className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark"><DownloadSimple size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(r) }} className="p-2 rounded-lg hover:bg-red-50 text-lafoi-gray hover:text-red-600"><Trash size={14} /></button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Receipts"
        title="Money received."
        description="Every payment recorded against an invoice. Branded PDF receipts available for download."
        actions={
          <>
            <Select value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value); setPage(1) }} className="w-44">
              <option value="">All methods</option>
              {['cash', 'bank_transfer', 'ecocash', 'cheque', 'card', 'other'].map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </Select>
            <div className="relative">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lafoi-gray-medium" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search"
                className="pl-9 pr-3 py-2.5 rounded-full bg-white border border-lafoi-dark/12 focus:border-lafoi-green focus:outline-none text-sm font-body w-48"
              />
            </div>
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={data?.results || []}
        isLoading={isFetching}
        empty="No receipts yet — record an invoice payment to start."
        pagination={data ? { count: data.count, page, pageSize: 25, onPageChange: setPage } : null}
      />
    </div>
  )
}
