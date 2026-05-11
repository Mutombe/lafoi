import React, { useEffect, useState } from 'react'
import { useStore } from 'react-redux'
import { Trash, MagnifyingGlass, DownloadSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'

import PageHeader from '../components/PageHeader'
import DataTable, { fmtDate, fmtMoney } from '../components/DataTable'
import { Select } from '../components/FormField'
import useDebouncedValue from '../hooks/useDebouncedValue'
import useOptimisticListUpdate from '../hooks/useOptimisticListUpdate'
import { useListReceiptsQuery, useDeleteReceiptMutation, downloadPdf } from '../store/api'
import { useConfirm } from '../components/ConfirmDialog'

export default function Receipts() {
  const confirm = useConfirm()
  const store = useStore()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [methodFilter, setMethodFilter] = useState('')

  useEffect(() => { setPage(1) }, [debouncedSearch])

  const queryArgs = {
    page,
    page_size: pageSize,
    search: debouncedSearch || undefined,
    method: methodFilter || undefined,
  }
  const { data, isLoading: isFirstLoad, isFetching } = useListReceiptsQuery(queryArgs)
  const applyOptimistic = useOptimisticListUpdate('listReceipts', queryArgs)
  const [deleteReceipt] = useDeleteReceiptMutation()

  const handlePdf = async (row) => {
    try {
      await downloadPdf(`receipts/${row.id}/pdf/`, `${row.number}.pdf`, store.getState)
      toast.success('PDF downloaded', { description: `${row.number}.pdf` })
    }
    catch (e) { toast.error('PDF download failed', { description: e.message }) }
  }

  const handleDelete = async (row) => {
    if (!(await confirm({ title: 'Delete receipt?', message: `Receipt ${row.number} will be removed. The invoice balance will be recalculated.`, confirmLabel: 'Delete', danger: true }))) return
    try {
      await applyOptimistic(
        (draft) => {
          if (!draft?.results) return
          draft.results = draft.results.filter((r) => r.id !== row.id)
          if (typeof draft.count === 'number') draft.count = Math.max(0, draft.count - 1)
        },
        () => deleteReceipt(row.id).unwrap(),
      )
      toast.success('Receipt removed', { description: row.number })
    } catch (e) {
      toast.error('Could not delete receipt', { description: e?.data?.detail || 'Delete failed.' })
    }
  }

  const columns = [
    { key: 'number', label: 'Receipt', priority: 'high', mobileLabel: 'Receipt', render: (r) => <span className="font-sora text-xs">{r.number}</span> },
    { key: 'invoice_number', label: 'Invoice', priority: 'medium' },
    { key: 'customer_name', label: 'Customer', priority: 'high' },
    { key: 'amount', label: 'Amount', priority: 'high', mobileLabel: 'Amount', render: (r) => <span className="tabular-nums font-sora">{fmtMoney(r.amount)}</span> },
    { key: 'method', label: 'Method', priority: 'medium', render: (r) => <span className="capitalize text-xs font-sora">{(r.method || '').replace('_', ' ')}</span> },
    { key: 'received_at', label: 'Received', priority: 'low', render: (r) => fmtDate(r.received_at) },
    { key: 'actions', label: '', priority: 'high', render: (r) => (
      <div className="flex justify-end gap-1">
        <button title="PDF" onClick={(e) => { e.stopPropagation(); handlePdf(r) }} className="p-2 rounded-lg hover:bg-lafoi-cream text-lafoi-gray hover:text-lafoi-dark min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><DownloadSimple size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(r) }} className="p-2 rounded-lg hover:bg-red-50 text-lafoi-gray hover:text-red-600 min-w-[36px] min-h-[36px] inline-flex items-center justify-center"><Trash size={14} /></button>
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
                onChange={(e) => setSearch(e.target.value)}
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
        isLoading={isFirstLoad}
        empty="No receipts yet — record an invoice payment to start."
        pagination={data ? {
          count: data.count,
          page,
          pageSize,
          onPageChange: setPage,
          onPageSizeChange: (s) => { setPageSize(s); setPage(1) },
        } : null}
      />
    </div>
  )
}
