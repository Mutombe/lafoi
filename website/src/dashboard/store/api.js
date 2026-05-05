import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { logout, setCredentials } from './authSlice'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
  prepareHeaders: (headers, { getState }) => {
    const access = getState().auth?.access
    if (access) headers.set('Authorization', `Bearer ${access}`)
    return headers
  },
})

/**
 * Wraps baseQuery so a 401 triggers a single refresh attempt; on failure
 * we log the user out so they're booted to /dashboard/login.
 */
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)
  if (result.error && result.error.status === 401) {
    const refresh = api.getState().auth?.refresh
    if (refresh) {
      const refreshResult = await baseQuery(
        { url: 'auth/refresh/', method: 'POST', body: { refresh } },
        api,
        extraOptions,
      )
      if (refreshResult.data?.access) {
        api.dispatch(setCredentials({ access: refreshResult.data.access, refresh: refreshResult.data.refresh ?? refresh }))
        result = await baseQuery(args, api, extraOptions)
      } else {
        api.dispatch(logout())
      }
    } else {
      api.dispatch(logout())
    }
  }
  return result
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Auth', 'User',
    'Customer', 'Project', 'ProjectFile', 'ProjectUpdate',
    'Quotation', 'Invoice', 'Receipt',
    'Employee', 'PayrollPeriod', 'PayrollEntry',
  ],
  endpoints: (b) => ({
    // ---------- Auth ----------
    login: b.mutation({
      query: (body) => ({ url: 'auth/login/', method: 'POST', body }),
    }),
    me: b.query({
      query: () => 'auth/users/me/',
      providesTags: ['Auth'],
    }),
    listUsers: b.query({
      query: (params = {}) => ({ url: 'auth/users/', params }),
      providesTags: ['User'],
    }),

    // ---------- Customers ----------
    listCustomers: b.query({
      query: (params = {}) => ({ url: 'customers/', params }),
      providesTags: ['Customer'],
    }),
    getCustomer: b.query({
      query: (id) => `customers/${id}/`,
      providesTags: (r, e, id) => [{ type: 'Customer', id }],
    }),
    createCustomer: b.mutation({
      query: (body) => ({ url: 'customers/', method: 'POST', body }),
      invalidatesTags: ['Customer'],
    }),
    updateCustomer: b.mutation({
      query: ({ id, ...body }) => ({ url: `customers/${id}/`, method: 'PATCH', body }),
      invalidatesTags: (r, e, { id }) => ['Customer', { type: 'Customer', id }],
    }),
    deleteCustomer: b.mutation({
      query: (id) => ({ url: `customers/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['Customer'],
    }),

    // ---------- Projects ----------
    listProjects: b.query({
      query: (params = {}) => ({ url: 'projects/', params }),
      providesTags: ['Project'],
    }),
    getProject: b.query({
      query: (id) => `projects/${id}/`,
      providesTags: (r, e, id) => [{ type: 'Project', id }],
    }),
    createProject: b.mutation({
      query: (body) => ({ url: 'projects/', method: 'POST', body }),
      invalidatesTags: ['Project'],
    }),
    updateProject: b.mutation({
      query: ({ id, ...body }) => ({ url: `projects/${id}/`, method: 'PATCH', body }),
      invalidatesTags: (r, e, { id }) => ['Project', { type: 'Project', id }],
    }),
    deleteProject: b.mutation({
      query: (id) => ({ url: `projects/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['Project'],
    }),

    // ---------- Project Updates ----------
    listProjectUpdates: b.query({
      query: (params = {}) => ({ url: 'project-updates/', params }),
      providesTags: ['ProjectUpdate'],
    }),
    createProjectUpdate: b.mutation({
      query: (body) => {
        // FormData if a photo is attached
        if (body instanceof FormData) {
          return { url: 'project-updates/', method: 'POST', body }
        }
        return { url: 'project-updates/', method: 'POST', body }
      },
      invalidatesTags: ['ProjectUpdate', 'Project'],
    }),

    // ---------- Project Files ----------
    listProjectFiles: b.query({
      query: (params = {}) => ({ url: 'project-files/', params }),
      providesTags: ['ProjectFile'],
    }),
    uploadProjectFile: b.mutation({
      query: (formData) => ({ url: 'project-files/', method: 'POST', body: formData }),
      invalidatesTags: ['ProjectFile', 'Project'],
    }),
    deleteProjectFile: b.mutation({
      query: (id) => ({ url: `project-files/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['ProjectFile', 'Project'],
    }),

    // ---------- Quotations ----------
    listQuotations: b.query({
      query: (params = {}) => ({ url: 'quotations/', params }),
      providesTags: ['Quotation'],
    }),
    getQuotation: b.query({
      query: (id) => `quotations/${id}/`,
      providesTags: (r, e, id) => [{ type: 'Quotation', id }],
    }),
    createQuotation: b.mutation({
      query: (body) => ({ url: 'quotations/', method: 'POST', body }),
      invalidatesTags: ['Quotation'],
    }),
    updateQuotation: b.mutation({
      query: ({ id, ...body }) => ({ url: `quotations/${id}/`, method: 'PATCH', body }),
      invalidatesTags: (r, e, { id }) => ['Quotation', { type: 'Quotation', id }],
    }),
    deleteQuotation: b.mutation({
      query: (id) => ({ url: `quotations/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['Quotation'],
    }),
    convertQuotationToInvoice: b.mutation({
      query: (id) => ({ url: `quotations/${id}/convert-to-invoice/`, method: 'POST' }),
      invalidatesTags: ['Quotation', 'Invoice'],
    }),

    // ---------- Invoices ----------
    listInvoices: b.query({
      query: (params = {}) => ({ url: 'invoices/', params }),
      providesTags: ['Invoice'],
    }),
    getInvoice: b.query({
      query: (id) => `invoices/${id}/`,
      providesTags: (r, e, id) => [{ type: 'Invoice', id }],
    }),
    createInvoice: b.mutation({
      query: (body) => ({ url: 'invoices/', method: 'POST', body }),
      invalidatesTags: ['Invoice'],
    }),
    updateInvoice: b.mutation({
      query: ({ id, ...body }) => ({ url: `invoices/${id}/`, method: 'PATCH', body }),
      invalidatesTags: (r, e, { id }) => ['Invoice', { type: 'Invoice', id }],
    }),
    deleteInvoice: b.mutation({
      query: (id) => ({ url: `invoices/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['Invoice'],
    }),

    // ---------- Receipts ----------
    listReceipts: b.query({
      query: (params = {}) => ({ url: 'receipts/', params }),
      providesTags: ['Receipt'],
    }),
    createReceipt: b.mutation({
      query: (body) => ({ url: 'receipts/', method: 'POST', body }),
      invalidatesTags: ['Receipt', 'Invoice'],
    }),
    deleteReceipt: b.mutation({
      query: (id) => ({ url: `receipts/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['Receipt', 'Invoice'],
    }),

    // ---------- Employees ----------
    listEmployees: b.query({
      query: (params = {}) => ({ url: 'employees/', params }),
      providesTags: ['Employee'],
    }),
    getEmployee: b.query({
      query: (id) => `employees/${id}/`,
      providesTags: (r, e, id) => [{ type: 'Employee', id }],
    }),
    createEmployee: b.mutation({
      query: (body) => ({ url: 'employees/', method: 'POST', body }),
      invalidatesTags: ['Employee'],
    }),
    updateEmployee: b.mutation({
      query: ({ id, ...body }) => ({ url: `employees/${id}/`, method: 'PATCH', body }),
      invalidatesTags: (r, e, { id }) => ['Employee', { type: 'Employee', id }],
    }),
    deleteEmployee: b.mutation({
      query: (id) => ({ url: `employees/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['Employee'],
    }),

    // ---------- Payroll Periods ----------
    listPayrollPeriods: b.query({
      query: (params = {}) => ({ url: 'payroll-periods/', params }),
      providesTags: ['PayrollPeriod'],
    }),
    getPayrollPeriod: b.query({
      query: (id) => `payroll-periods/${id}/`,
      providesTags: (r, e, id) => [{ type: 'PayrollPeriod', id }],
    }),
    createPayrollPeriod: b.mutation({
      query: (body) => ({ url: 'payroll-periods/', method: 'POST', body }),
      invalidatesTags: ['PayrollPeriod'],
    }),
    updatePayrollPeriod: b.mutation({
      query: ({ id, ...body }) => ({ url: `payroll-periods/${id}/`, method: 'PATCH', body }),
      invalidatesTags: (r, e, { id }) => ['PayrollPeriod', { type: 'PayrollPeriod', id }],
    }),
    deletePayrollPeriod: b.mutation({
      query: (id) => ({ url: `payroll-periods/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['PayrollPeriod'],
    }),
    generatePayrollEntries: b.mutation({
      query: (id) => ({ url: `payroll-periods/${id}/generate-entries/`, method: 'POST' }),
      invalidatesTags: (r, e, id) => ['PayrollPeriod', { type: 'PayrollPeriod', id }, 'PayrollEntry'],
    }),

    // ---------- Payroll Entries ----------
    listPayrollEntries: b.query({
      query: (params = {}) => ({ url: 'payroll-entries/', params }),
      providesTags: ['PayrollEntry'],
    }),
    updatePayrollEntry: b.mutation({
      query: ({ id, ...body }) => ({ url: `payroll-entries/${id}/`, method: 'PATCH', body }),
      invalidatesTags: ['PayrollEntry', 'PayrollPeriod'],
    }),
  }),
})

export const {
  useLoginMutation, useMeQuery, useListUsersQuery,
  useListCustomersQuery, useGetCustomerQuery, useCreateCustomerMutation, useUpdateCustomerMutation, useDeleteCustomerMutation,
  useListProjectsQuery, useGetProjectQuery, useCreateProjectMutation, useUpdateProjectMutation, useDeleteProjectMutation,
  useListProjectUpdatesQuery, useCreateProjectUpdateMutation,
  useListProjectFilesQuery, useUploadProjectFileMutation, useDeleteProjectFileMutation,
  useListQuotationsQuery, useGetQuotationQuery, useCreateQuotationMutation, useUpdateQuotationMutation, useDeleteQuotationMutation, useConvertQuotationToInvoiceMutation,
  useListInvoicesQuery, useGetInvoiceQuery, useCreateInvoiceMutation, useUpdateInvoiceMutation, useDeleteInvoiceMutation,
  useListReceiptsQuery, useCreateReceiptMutation, useDeleteReceiptMutation,
  useListEmployeesQuery, useGetEmployeeQuery, useCreateEmployeeMutation, useUpdateEmployeeMutation, useDeleteEmployeeMutation,
  useListPayrollPeriodsQuery, useGetPayrollPeriodQuery, useCreatePayrollPeriodMutation, useUpdatePayrollPeriodMutation, useDeletePayrollPeriodMutation, useGeneratePayrollEntriesMutation,
  useListPayrollEntriesQuery, useUpdatePayrollEntryMutation,
} = api

// Convenience: download a PDF endpoint with the bearer token attached.
export const downloadPdf = async (path, filename, getState) => {
  const access = getState().auth?.access
  const url = `${API_BASE}/${path}`
  const res = await fetch(url, { headers: access ? { Authorization: `Bearer ${access}` } : {} })
  if (!res.ok) throw new Error(`PDF fetch failed: ${res.status}`)
  const blob = await res.blob()
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(blobUrl)
}
