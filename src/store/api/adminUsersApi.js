import { baseApi } from './baseApi'
import { csvRequest, csvResponse } from './csvRequest'

const LIST = { type: 'AdminUser', id: 'LIST' }
// A moderation action changes the row, the list (status counts), the user detail and the
// dashboard / sidebar numbers.
const touched = (id) => [{ type: 'AdminUser', id }, LIST, 'AdminStats']
// Deleting an account hides its reviews (ratings recomputed), deletes its lists and keeps its
// reports: every moderation table can change.
const DELETED = [
  LIST,
  'AdminStats',
  { type: 'AdminReview', id: 'LIST' },
  { type: 'AdminRestaurant', id: 'LIST' },
  { type: 'AdminReport', id: 'LIST' },
  { type: 'AdminList', id: 'LIST' },
]
// The detail's side lists (filed reports, comments, sessions, followers) share the user's tag,
// so anything that refreshes the detail refreshes them too.
const userTag = (id) => [{ type: 'AdminUser', id }]

/**
 * Admin Users (server adminController, /api/admin/users*).
 *
 *   GET    /admin/users?page&limit&search&status(all|active|pending|suspended|banned)&role&verified&sort
 *          → { users: [user + reviewCount, warningCount, lastWarningAt], pagination,
 *              counts: { all, active, pending, suspended, banned, admins, verified } }
 *   GET    /admin/users/export?…same filters → CSV
 *   GET    /admin/users/:id → { user (+ invitedBy), stats: { reviews, lists, followers, following, warnings,
 *          reportsAgainst, reportsFiled, comments, restaurantsFollowed, invited }, recentReviews, lists, reports }
 *   GET    /admin/users/:id/reports?page&limit → { reports (filed by the user), pagination }
 *   GET    /admin/users/:id/comments?page&limit → { comments: [{ …, review: { _id, number, restaurant } }], pagination }
 *   GET    /admin/users/:id/sessions → { pushDevices, activeSessions, lastLogin,
 *          sessions: [{ active, rememberMe, lastRefreshAt, expiresAt }] }
 *   GET    /users/:id/followers|following?page&limit&q → { users, hidden, pagination }  (admins see all)
 *   POST   /admin/users { firstName, lastName, email, role?, password?, verified? } → 201 { user, invitationSent }
 *   PATCH  /admin/users/:id { status?, reason?, until?, days?, role?, verified? }
 *   POST   /admin/users/:id/warn { reason }  ·  DELETE /admin/users/:id/warnings/:warningId
 *   POST   /admin/users/:id/ban { reason? }  ·  /suspend { reason?, days? | until? }
 *   POST   /admin/users/:id/restore  ·  /approve  ·  /verify { verified }
 *   DELETE /admin/users/:id → { summary }
 * Server guards (self / last active admin) come back as 400 with a message.
 */
export const adminUsersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: (params = {}) => ({ url: '/admin/users', params }),
      providesTags: (result) => [
        LIST,
        ...(result?.data?.users || []).map((u) => ({ type: 'AdminUser', id: u._id })),
      ],
    }),
    getAdminUser: builder.query({
      query: (id) => `/admin/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'AdminUser', id }],
    }),
    getAdminUserReports: builder.query({
      query: ({ id, ...params }) => ({ url: `/admin/users/${id}/reports`, params }),
      providesTags: (result, error, { id }) => userTag(id),
    }),
    getAdminUserComments: builder.query({
      query: ({ id, ...params }) => ({ url: `/admin/users/${id}/comments`, params }),
      providesTags: (result, error, { id }) => userTag(id),
    }),
    getAdminUserSessions: builder.query({
      query: (id) => `/admin/users/${id}/sessions`,
      providesTags: (result, error, id) => userTag(id),
    }),
    // kind: 'followers' | 'following' (public user routes; admins pass the visibility checks).
    getUserConnections: builder.query({
      query: ({ id, kind, ...params }) => ({ url: `/users/${id}/${kind === 'following' ? 'following' : 'followers'}`, params }),
      providesTags: (result, error, { id }) => userTag(id),
    }),
    createUser: builder.mutation({
      query: (body) => ({ url: '/admin/users', method: 'POST', body }),
      invalidatesTags: [LIST, 'AdminStats'],
    }),
    // Legacy combined update (status / role / verified) — kept for older callers.
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/users/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => touched(id),
    }),
    setUserRole: builder.mutation({
      query: ({ id, role }) => ({ url: `/admin/users/${id}`, method: 'PATCH', body: { role } }),
      invalidatesTags: (result, error, { id }) => touched(id),
    }),
    warnUser: builder.mutation({
      query: ({ id, reason }) => ({ url: `/admin/users/${id}/warn`, method: 'POST', body: { reason } }),
      invalidatesTags: (result, error, { id }) => touched(id),
    }),
    removeUserWarning: builder.mutation({
      query: ({ id, warningId }) => ({ url: `/admin/users/${id}/warnings/${warningId}`, method: 'DELETE' }),
      invalidatesTags: (result, error, { id }) => touched(id),
    }),
    banUser: builder.mutation({
      query: ({ id, reason }) => ({ url: `/admin/users/${id}/ban`, method: 'POST', body: { reason } }),
      invalidatesTags: (result, error, { id }) => touched(id),
    }),
    suspendUser: builder.mutation({
      query: ({ id, reason, days, until }) => ({
        url: `/admin/users/${id}/suspend`,
        method: 'POST',
        body: { reason, ...(days ? { days } : {}), ...(until ? { until } : {}) },
      }),
      invalidatesTags: (result, error, { id }) => touched(id),
    }),
    restoreUser: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}/restore`, method: 'POST' }),
      invalidatesTags: (result, error, id) => touched(id),
    }),
    approveUser: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}/approve`, method: 'POST' }),
      invalidatesTags: (result, error, id) => touched(id),
    }),
    verifyUser: builder.mutation({
      query: ({ id, verified }) => ({ url: `/admin/users/${id}/verify`, method: 'POST', body: { verified } }),
      invalidatesTags: (result, error, { id }) => touched(id),
    }),
    deleteUser: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}`, method: 'DELETE' }),
      invalidatesTags: (result, error, id) => [{ type: 'AdminUser', id }, ...DELETED],
    }),
    // CSV of the filtered list → { csv, filename } (save with utils/saveTextFile).
    exportUsers: builder.mutation({
      query: (params = {}) => csvRequest('/admin/users/export', params),
      transformResponse: csvResponse('yumio-users'),
    }),
  }),
})

export const {
  useGetUsersQuery,
  useGetAdminUserQuery,
  useGetAdminUserReportsQuery,
  useGetAdminUserCommentsQuery,
  useGetAdminUserSessionsQuery,
  useGetUserConnectionsQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useSetUserRoleMutation,
  useWarnUserMutation,
  useRemoveUserWarningMutation,
  useBanUserMutation,
  useSuspendUserMutation,
  useRestoreUserMutation,
  useApproveUserMutation,
  useVerifyUserMutation,
  useDeleteUserMutation,
  useExportUsersMutation,
} = adminUsersApi
