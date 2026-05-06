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
  // Aggressive caching — keep results in memory for 10 minutes after last subscriber
  // unsubscribes. Re-visiting any list returns cached data instantly while a silent
  // refetch happens in the background.
  keepUnusedDataFor: 600,
  // Don't refetch on focus / reconnect during the demo — keeps the perceived UX instant.
  refetchOnFocus: false,
  refetchOnReconnect: false,
  refetchOnMountOrArgChange: false,
  tagTypes: [
    'Auth', 'User',
    'Customer', 'Project', 'ProjectFile', 'ProjectUpdate', 'ProjectCost',
    'Quotation', 'Invoice', 'Receipt',
    'Employee', 'PayrollPeriod', 'PayrollEntry',
    'TaxBracketSet', 'StatutoryRate', 'ExchangeRate', 'AuditLog',
    'SalaryHistory', 'EmployeeLoan', 'LoanRepayment',
    'LeaveType', 'LeaveBalance', 'LeaveRequest', 'PublicHoliday',
    'ProjectMap', 'ModuleRegistry',
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

    // ---------- Compliance — Tax Bracket Sets ----------
    listTaxBracketSets: b.query({
      query: (params = {}) => ({ url: 'tax-bracket-sets/', params }),
      providesTags: ['TaxBracketSet'],
    }),
    getTaxBracketSet: b.query({
      query: (id) => `tax-bracket-sets/${id}/`,
      providesTags: (r, e, id) => [{ type: 'TaxBracketSet', id }],
    }),
    createTaxBracketSet: b.mutation({
      query: (body) => ({ url: 'tax-bracket-sets/', method: 'POST', body }),
      invalidatesTags: ['TaxBracketSet'],
    }),
    updateTaxBracketSet: b.mutation({
      query: ({ id, ...body }) => ({ url: `tax-bracket-sets/${id}/`, method: 'PATCH', body }),
      invalidatesTags: (r, e, { id }) => ['TaxBracketSet', { type: 'TaxBracketSet', id }],
    }),
    deleteTaxBracketSet: b.mutation({
      query: (id) => ({ url: `tax-bracket-sets/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['TaxBracketSet'],
    }),
    previewPaye: b.mutation({
      query: (body) => ({ url: 'tax-bracket-sets/preview/', method: 'POST', body }),
    }),

    // ---------- Compliance — Statutory Rates ----------
    listStatutoryRates: b.query({
      query: (params = {}) => ({ url: 'statutory-rates/', params }),
      providesTags: ['StatutoryRate'],
    }),
    createStatutoryRate: b.mutation({
      query: (body) => ({ url: 'statutory-rates/', method: 'POST', body }),
      invalidatesTags: ['StatutoryRate'],
    }),
    updateStatutoryRate: b.mutation({
      query: ({ id, ...body }) => ({ url: `statutory-rates/${id}/`, method: 'PATCH', body }),
      invalidatesTags: ['StatutoryRate'],
    }),
    deleteStatutoryRate: b.mutation({
      query: (id) => ({ url: `statutory-rates/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['StatutoryRate'],
    }),

    // ---------- Compliance — Exchange Rates ----------
    listExchangeRates: b.query({
      query: (params = {}) => ({ url: 'exchange-rates/', params }),
      providesTags: ['ExchangeRate'],
    }),
    createExchangeRate: b.mutation({
      query: (body) => ({ url: 'exchange-rates/', method: 'POST', body }),
      invalidatesTags: ['ExchangeRate'],
    }),
    deleteExchangeRate: b.mutation({
      query: (id) => ({ url: `exchange-rates/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['ExchangeRate'],
    }),

    // ---------- Compliance — Audit Log ----------
    listAuditLogs: b.query({
      query: (params = {}) => ({ url: 'audit-logs/', params }),
      providesTags: ['AuditLog'],
    }),

    // ---------- Tier 2 — Salary history ----------
    listSalaryHistory: b.query({
      query: (params = {}) => ({ url: 'salary-history/', params }),
      providesTags: ['SalaryHistory'],
    }),
    createSalaryHistory: b.mutation({
      query: (body) => ({ url: 'salary-history/', method: 'POST', body }),
      invalidatesTags: ['SalaryHistory', 'Employee'],
    }),
    deleteSalaryHistory: b.mutation({
      query: (id) => ({ url: `salary-history/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['SalaryHistory'],
    }),

    // ---------- Tier 2 — Loans ----------
    listEmployeeLoans: b.query({
      query: (params = {}) => ({ url: 'employee-loans/', params }),
      providesTags: ['EmployeeLoan'],
    }),
    getEmployeeLoan: b.query({
      query: (id) => `employee-loans/${id}/`,
      providesTags: (r, e, id) => [{ type: 'EmployeeLoan', id }],
    }),
    createEmployeeLoan: b.mutation({
      query: (body) => ({ url: 'employee-loans/', method: 'POST', body }),
      invalidatesTags: ['EmployeeLoan'],
    }),
    updateEmployeeLoan: b.mutation({
      query: ({ id, ...body }) => ({ url: `employee-loans/${id}/`, method: 'PATCH', body }),
      invalidatesTags: (r, e, { id }) => ['EmployeeLoan', { type: 'EmployeeLoan', id }],
    }),
    deleteEmployeeLoan: b.mutation({
      query: (id) => ({ url: `employee-loans/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['EmployeeLoan'],
    }),

    // ---------- Tier 2 — Leave ----------
    listLeaveTypes: b.query({
      query: (params = {}) => ({ url: 'leave-types/', params }),
      providesTags: ['LeaveType'],
    }),
    listLeaveBalances: b.query({
      query: (params = {}) => ({ url: 'leave-balances/', params }),
      providesTags: ['LeaveBalance'],
    }),
    listLeaveRequests: b.query({
      query: (params = {}) => ({ url: 'leave-requests/', params }),
      providesTags: ['LeaveRequest'],
    }),
    createLeaveRequest: b.mutation({
      query: (body) => ({ url: 'leave-requests/', method: 'POST', body }),
      invalidatesTags: ['LeaveRequest', 'LeaveBalance'],
    }),
    approveLeaveRequest: b.mutation({
      query: ({ id, ...body }) => ({ url: `leave-requests/${id}/approve/`, method: 'POST', body }),
      invalidatesTags: ['LeaveRequest', 'LeaveBalance'],
    }),
    rejectLeaveRequest: b.mutation({
      query: ({ id, ...body }) => ({ url: `leave-requests/${id}/reject/`, method: 'POST', body }),
      invalidatesTags: ['LeaveRequest'],
    }),

    // ---------- Tier 2 — Public holidays ----------
    listPublicHolidays: b.query({
      query: (params = {}) => ({ url: 'public-holidays/', params }),
      providesTags: ['PublicHoliday'],
    }),
    createPublicHoliday: b.mutation({
      query: (body) => ({ url: 'public-holidays/', method: 'POST', body }),
      invalidatesTags: ['PublicHoliday'],
    }),
    deletePublicHoliday: b.mutation({
      query: (id) => ({ url: `public-holidays/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['PublicHoliday'],
    }),

    // ---------- Tier 2 — Approval workflow + bank file + YTD ----------
    markPeriodReviewed: b.mutation({
      query: ({ id, ...body }) => ({ url: `payroll-periods/${id}/mark-reviewed/`, method: 'POST', body }),
      invalidatesTags: (r, e, { id }) => ['PayrollPeriod', { type: 'PayrollPeriod', id }],
    }),
    approvePeriod: b.mutation({
      query: ({ id, ...body }) => ({ url: `payroll-periods/${id}/approve/`, method: 'POST', body }),
      invalidatesTags: (r, e, { id }) => ['PayrollPeriod', { type: 'PayrollPeriod', id }],
    }),
    markPeriodPaid: b.mutation({
      query: ({ id, ...body }) => ({ url: `payroll-periods/${id}/mark-paid/`, method: 'POST', body }),
      invalidatesTags: (r, e, { id }) => ['PayrollPeriod', { type: 'PayrollPeriod', id }],
    }),
    closePeriod: b.mutation({
      query: ({ id, ...body }) => ({ url: `payroll-periods/${id}/close/`, method: 'POST', body }),
      invalidatesTags: (r, e, { id }) => ['PayrollPeriod', { type: 'PayrollPeriod', id }],
    }),
    reopenPeriod: b.mutation({
      query: ({ id, ...body }) => ({ url: `payroll-periods/${id}/reopen/`, method: 'POST', body }),
      invalidatesTags: (r, e, { id }) => ['PayrollPeriod', { type: 'PayrollPeriod', id }],
    }),
    employeeYtd: b.query({
      query: ({ id, year }) => ({ url: `employees/${id}/ytd/`, params: year ? { year } : {} }),
    }),

    // ---------- Project costs ----------
    listProjectCosts: b.query({
      query: (params = {}) => ({ url: 'project-costs/', params }),
      providesTags: ['ProjectCost'],
    }),
    createProjectCost: b.mutation({
      query: (body) => ({ url: 'project-costs/', method: 'POST', body }),
      invalidatesTags: ['ProjectCost', 'Project'],
    }),
    updateProjectCost: b.mutation({
      query: ({ id, ...body }) => ({ url: `project-costs/${id}/`, method: 'PATCH', body }),
      invalidatesTags: ['ProjectCost', 'Project'],
    }),
    deleteProjectCost: b.mutation({
      query: (id) => ({ url: `project-costs/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['ProjectCost', 'Project'],
    }),

    // ---------- Project map ----------
    projectsMap: b.query({
      query: () => 'projects/map/',
      providesTags: ['ProjectMap'],
    }),

    // ---------- Users + modules registry ----------
    listModules: b.query({
      query: () => 'auth/users/modules/',
      providesTags: ['ModuleRegistry'],
    }),
    setUserModules: b.mutation({
      query: ({ id, module_access }) => ({ url: `auth/users/${id}/set-modules/`, method: 'POST', body: { module_access } }),
      invalidatesTags: ['User', 'Auth'],
    }),
    resetUserPassword: b.mutation({
      query: ({ id, password }) => ({ url: `auth/users/${id}/reset-password/`, method: 'POST', body: { password } }),
    }),
    toggleUserActive: b.mutation({
      query: (id) => ({ url: `auth/users/${id}/toggle-active/`, method: 'POST' }),
      invalidatesTags: ['User'],
    }),
    createUser: b.mutation({
      query: (body) => ({ url: 'auth/users/', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
    deleteUser: b.mutation({
      query: (id) => ({ url: `auth/users/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['User'],
    }),
    updateUser: b.mutation({
      query: ({ id, ...body }) => ({ url: `auth/users/${id}/`, method: 'PATCH', body }),
      invalidatesTags: ['User'],
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
  useListTaxBracketSetsQuery, useGetTaxBracketSetQuery, useCreateTaxBracketSetMutation, useUpdateTaxBracketSetMutation, useDeleteTaxBracketSetMutation, usePreviewPayeMutation,
  useListStatutoryRatesQuery, useCreateStatutoryRateMutation, useUpdateStatutoryRateMutation, useDeleteStatutoryRateMutation,
  useListExchangeRatesQuery, useCreateExchangeRateMutation, useDeleteExchangeRateMutation,
  useListAuditLogsQuery,
  useListSalaryHistoryQuery, useCreateSalaryHistoryMutation, useDeleteSalaryHistoryMutation,
  useListEmployeeLoansQuery, useGetEmployeeLoanQuery, useCreateEmployeeLoanMutation, useUpdateEmployeeLoanMutation, useDeleteEmployeeLoanMutation,
  useListLeaveTypesQuery, useListLeaveBalancesQuery, useListLeaveRequestsQuery,
  useCreateLeaveRequestMutation, useApproveLeaveRequestMutation, useRejectLeaveRequestMutation,
  useListPublicHolidaysQuery, useCreatePublicHolidayMutation, useDeletePublicHolidayMutation,
  useMarkPeriodReviewedMutation, useApprovePeriodMutation, useMarkPeriodPaidMutation, useClosePeriodMutation, useReopenPeriodMutation,
  useEmployeeYtdQuery,
  useListProjectCostsQuery, useCreateProjectCostMutation, useUpdateProjectCostMutation, useDeleteProjectCostMutation,
  useProjectsMapQuery,
  useListModulesQuery, useSetUserModulesMutation, useResetUserPasswordMutation, useToggleUserActiveMutation,
  useCreateUserMutation, useDeleteUserMutation, useUpdateUserMutation,
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
