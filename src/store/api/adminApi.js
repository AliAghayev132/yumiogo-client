import { baseApi } from './baseApi'

/**
 * Admin endpoints — mirror the server /api/admin routes (all admin-only).
 */
export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Dashboard + analytics
    getStats: builder.query({
      query: () => '/admin/stats',
      providesTags: ['AdminStats'],
    }),
    getAnalytics: builder.query({
      query: () => '/admin/analytics',
    }),

    // Users
    getUsers: builder.query({
      query: (params = {}) => ({ url: '/admin/users', params }),
      providesTags: [{ type: 'AdminUser', id: 'LIST' }],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/users/${id}`, method: 'PATCH', body }),
      invalidatesTags: [{ type: 'AdminUser', id: 'LIST' }, 'AdminStats'],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'AdminUser', id: 'LIST' }, 'AdminStats'],
    }),

    // Restaurants
    getAdminRestaurants: builder.query({
      query: (params = {}) => ({ url: '/admin/restaurants', params }),
      providesTags: [{ type: 'AdminRestaurant', id: 'LIST' }],
    }),
    createRestaurant: builder.mutation({
      query: (body) => ({ url: '/restaurants', method: 'POST', body }),
      invalidatesTags: [{ type: 'AdminRestaurant', id: 'LIST' }, 'AdminStats'],
    }),
    updateRestaurant: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/restaurants/${id}`, method: 'PUT', body }),
      invalidatesTags: [{ type: 'AdminRestaurant', id: 'LIST' }],
    }),
    deleteRestaurant: builder.mutation({
      query: (id) => ({ url: `/restaurants/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'AdminRestaurant', id: 'LIST' }, 'AdminStats'],
    }),

    // Reviews (moderation)
    getAdminReviews: builder.query({
      query: (params = {}) => ({ url: '/admin/reviews', params }),
      providesTags: [{ type: 'AdminReview', id: 'LIST' }],
    }),
    deleteReview: builder.mutation({
      query: (id) => ({ url: `/admin/reviews/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'AdminReview', id: 'LIST' }, 'AdminStats'],
    }),

    // Reports
    getReports: builder.query({
      query: (params = {}) => ({ url: '/admin/reports', params }),
      providesTags: [{ type: 'AdminReport', id: 'LIST' }],
    }),
    resolveReport: builder.mutation({
      query: ({ id, status }) => ({ url: `/admin/reports/${id}`, method: 'PATCH', body: { status } }),
      invalidatesTags: [{ type: 'AdminReport', id: 'LIST' }, 'AdminStats'],
    }),

    // Form metadata (enums) + settings
    getMeta: builder.query({
      query: () => '/admin/meta',
    }),
    getSettings: builder.query({
      query: () => '/admin/settings',
      providesTags: ['AdminSettings'],
    }),
    updateSettings: builder.mutation({
      query: (body) => ({ url: '/admin/settings', method: 'PUT', body }),
      invalidatesTags: ['AdminSettings'],
    }),

    // Demo data management (Seed / Clear buttons)
    seedDatabase: builder.mutation({
      query: () => ({ url: '/admin/seed', method: 'POST' }),
      invalidatesTags: [
        'AdminStats',
        { type: 'AdminUser', id: 'LIST' },
        { type: 'AdminRestaurant', id: 'LIST' },
        { type: 'AdminReview', id: 'LIST' },
        { type: 'AdminReport', id: 'LIST' },
      ],
    }),
    clearDatabase: builder.mutation({
      query: () => ({ url: '/admin/reset', method: 'POST' }),
      invalidatesTags: [
        'AdminStats',
        { type: 'AdminUser', id: 'LIST' },
        { type: 'AdminRestaurant', id: 'LIST' },
        { type: 'AdminReview', id: 'LIST' },
        { type: 'AdminReport', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetStatsQuery,
  useGetAnalyticsQuery,
  useGetUsersQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetAdminRestaurantsQuery,
  useCreateRestaurantMutation,
  useUpdateRestaurantMutation,
  useDeleteRestaurantMutation,
  useGetAdminReviewsQuery,
  useDeleteReviewMutation,
  useGetReportsQuery,
  useResolveReportMutation,
  useGetMetaQuery,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useSeedDatabaseMutation,
  useClearDatabaseMutation,
} = adminApi
