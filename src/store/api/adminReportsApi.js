import { baseApi } from './baseApi'
import { csvRequest, csvResponse } from './csvRequest'

/**
 * Reports queue — server /api/admin/reports (admin-only): one mixed table of
 * review / user / restaurant / list reports.
 *
 * Resolving with a review / list action hides or deletes that review or removes the list, so
 * report writes also refresh the review, restaurant and favourite-list tables and the dashboard
 * counters / bell ('AdminStats').
 */

const REPORT_WRITE_TAGS = [
  { type: 'AdminReport', id: 'LIST' },
  { type: 'AdminReview', id: 'LIST' },
  { type: 'AdminRestaurant', id: 'LIST' },
  { type: 'AdminList', id: 'LIST' },
  'AdminStats',
]

/**
 * Detail pages that show this report: the reported user / restaurant / list / review (and the
 * review's restaurant and author, whose numbers an enforcement changes) and the reporter's
 * "Reports filed" list. `report` is the admin report shape (response or the row the caller had).
 */
const reportDetailTags = (report) => {
  if (!report) return []
  const tags = []
  const add = (type, id) => id && tags.push({ type, id: String(id) })
  const t = report.target || {}
  if (report.targetType === 'user') add('AdminUser', report.targetId)
  if (report.targetType === 'restaurant') add('AdminRestaurant', report.targetId)
  if (report.targetType === 'list') {
    add('AdminList', report.targetId)
    add('AdminUser', t.owner?._id)
  }
  if (report.targetType === 'review') {
    add('AdminReview', report.targetId)
    add('AdminRestaurant', t.restaurant?._id)
    add('AdminUser', t.author?._id)
  }
  add('AdminUser', report.reporter?._id)
  const owner = report.targetOwner
  add('AdminUser', owner && typeof owner === 'object' ? owner._id : owner)
  return tags
}

export const adminReportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // params: page, limit (≤100), status (open|in_review|resolved|dismissed|active|all),
    // type (review|user|restaurant|list), reason, search ("#201", text, reporter name)
    // → data: { reports: [{ _id, number, targetType, targetId, targetLabel, target, reason,
    //   description, reporter (null = System), status, resolutionNote, action, resolvedBy,
    //   resolvedAt, createdAt, targetOwner? }], pagination, counts: { all, open, in_review, resolved, dismissed } }
    getModerationReports: builder.query({
      query: (params = {}) => ({ url: '/admin/reports', params }),
      providesTags: (result) => [
        ...(result?.data?.reports || []).map((r) => ({ type: 'AdminReport', id: r._id })),
        { type: 'AdminReport', id: 'LIST' },
      ],
    }),
    // → data: { report, related: [{ _id, number, reason, status, reporter, createdAt }] }
    getModerationReport: builder.query({
      query: (id) => `/admin/reports/${id}`,
      providesTags: (result, error, id) => [{ type: 'AdminReport', id }],
    }),
    // { id, status, resolutionNote?, action?: none|hide_review|delete_review|remove_list, notifyReporter? }
    // → data: { report }; message "Report #N resolved — reporter notified"
    updateModerationReport: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/reports/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'AdminReport', id },
        ...REPORT_WRITE_TAGS,
        ...reportDetailTags(result?.data?.report),
      ],
    }),
    // id, or { id, report } (the row, so the pages showing it refresh) → data: { report: { _id, number } }
    deleteModerationReport: builder.mutation({
      query: (arg) => ({ url: `/admin/reports/${typeof arg === 'object' ? arg.id : arg}`, method: 'DELETE' }),
      invalidatesTags: (result, error, arg) => [
        { type: 'AdminReport', id: typeof arg === 'object' ? arg.id : arg },
        { type: 'AdminReport', id: 'LIST' },
        'AdminStats',
        ...reportDetailTags(typeof arg === 'object' ? arg.report : null),
      ],
    }),
    // Same filters as the list → { csv, filename } (save with utils/saveTextFile).
    exportModerationReports: builder.mutation({
      query: (params = {}) => csvRequest('/admin/reports/export', params),
      transformResponse: csvResponse('reports'),
    }),
  }),
})

export const {
  useGetModerationReportsQuery,
  useGetModerationReportQuery,
  useUpdateModerationReportMutation,
  useDeleteModerationReportMutation,
  useExportModerationReportsMutation,
} = adminReportsApi
