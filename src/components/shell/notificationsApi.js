import { baseApi } from '@store/api/baseApi'

/**
 * Header-bell endpoints (server: GET /api/admin/notifications, PATCH /api/admin/notifications/read).
 * Injected here so the shell owns them; reuse these hooks instead of adding duplicates.
 *
 * GET  /admin/notifications?limit=20 → data: {
 *   counts: { openReports, pendingRestaurants, pendingUsers, pendingReviews, total },
 *   items:  [{ id, type: report|restaurant|user|review, title, message, at, link }],   // work queue
 *   alerts: [{ _id, title, message, kind, link, read, createdAt }],                   // my alerts
 *   unread, hasUnread }
 * PATCH /admin/notifications/read { ids?: [id] } → marks my alerts read (all when ids omitted).
 * Tagged 'AdminStats' so moderation mutations that refresh the stats refresh the feed too.
 */
export const adminNotificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminNotificationFeed: builder.query({
      query: (params = { limit: 20 }) => ({ url: '/admin/notifications', params }),
      providesTags: ['AdminStats'],
    }),
    markAdminNotificationsRead: builder.mutation({
      query: (body = {}) => ({ url: '/admin/notifications/read', method: 'PATCH', body }),
      invalidatesTags: ['AdminStats'],
    }),
  }),
})

export const { useGetAdminNotificationFeedQuery, useMarkAdminNotificationsReadMutation } = adminNotificationsApi
