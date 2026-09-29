import { baseApi } from './baseApi'
import { csvRequest, csvResponse } from './csvRequest'

const LIST = { type: 'AdminRestaurant', id: 'LIST' }
// Status / content changes affect the row, the list counts, the detail page, the dashboard
// numbers and the public catalog (cuisine counts, home rails).
const touched = (id) => [{ type: 'AdminRestaurant', id }, LIST, 'AdminStats', 'Catalog']
// A purged listing no longer exists: refresh the lists (not its own, now 404, detail).
const PURGED = [LIST, 'AdminStats', 'Catalog', { type: 'AdminReview', id: 'LIST' }, { type: 'AdminReport', id: 'LIST' }]

/**
 * Admin Restaurants.
 *
 *   GET  /admin/restaurants?page&limit&search&status&cuisine&city&sort&deleted=true
 *        → { restaurants, pagination, counts: { all, active, pending, suspended, rejected, closed, deleted } }
 *   GET  /admin/restaurants/export?…same filters → CSV
 *   GET  /admin/restaurants/:id → { restaurant, stats: { reviews, sentiment, pendingReviews, openReports,
 *        lists, saves, views, menuItems }, recentReviews, reports }   (any status, also deleted)
 *   POST /admin/restaurants/:id/approve · /reject { reason } · /suspend { reason? } · /restore
 *   PATCH /admin/restaurants/:id/status { status, reason? }
 *   DELETE /admin/restaurants/:id → permanent delete, Trash only (409 otherwise) →
 *        { restaurant: { _id, name }, summary: { reviews, lists, menuItems, menuCategories, reports, files } }
 *   Create / edit / soft-delete stay on the public resource (admin only):
 *   POST /restaurants · PUT /restaurants/:id · DELETE /restaurants/:id  (→ detail-shaped restaurant)
 */
export const adminRestaurantsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminRestaurants: builder.query({
      query: (params = {}) => ({ url: '/admin/restaurants', params }),
      providesTags: (result) => [
        LIST,
        ...(result?.data?.restaurants || []).map((r) => ({ type: 'AdminRestaurant', id: r._id })),
      ],
    }),
    getAdminRestaurant: builder.query({
      query: (id) => `/admin/restaurants/${id}`,
      providesTags: (result, error, id) => [{ type: 'AdminRestaurant', id }],
    }),
    createRestaurant: builder.mutation({
      query: (body) => ({ url: '/restaurants', method: 'POST', body }),
      invalidatesTags: [LIST, 'AdminStats', 'Catalog'],
    }),
    updateRestaurant: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/restaurants/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => touched(id),
    }),
    deleteRestaurant: builder.mutation({
      query: (id) => ({ url: `/restaurants/${id}`, method: 'DELETE' }),
      invalidatesTags: (result, error, id) => touched(id),
    }),
    approveRestaurant: builder.mutation({
      query: (id) => ({ url: `/admin/restaurants/${id}/approve`, method: 'POST' }),
      invalidatesTags: (result, error, id) => touched(id),
    }),
    rejectRestaurant: builder.mutation({
      query: ({ id, reason }) => ({ url: `/admin/restaurants/${id}/reject`, method: 'POST', body: { reason } }),
      invalidatesTags: (result, error, { id }) => touched(id),
    }),
    suspendRestaurant: builder.mutation({
      query: ({ id, reason }) => ({ url: `/admin/restaurants/${id}/suspend`, method: 'POST', body: { reason } }),
      invalidatesTags: (result, error, { id }) => touched(id),
    }),
    restoreRestaurant: builder.mutation({
      query: (id) => ({ url: `/admin/restaurants/${id}/restore`, method: 'POST' }),
      invalidatesTags: (result, error, id) => touched(id),
    }),
    purgeRestaurant: builder.mutation({
      query: (id) => ({ url: `/admin/restaurants/${id}`, method: 'DELETE' }),
      invalidatesTags: PURGED,
    }),
    setRestaurantStatus: builder.mutation({
      query: ({ id, status, reason }) => ({
        url: `/admin/restaurants/${id}/status`,
        method: 'PATCH',
        body: { status, reason },
      }),
      invalidatesTags: (result, error, { id }) => touched(id),
    }),
    // Address → coordinates for the editor ("Find on map"): admin cities + OpenStreetMap.
    // GET /places/suggest?q&limit → { places: [{ id, type, name, subtitle, label, city, latitude, longitude, source }] }
    getPlaceSuggestions: builder.query({
      query: ({ q, limit = 5 }) => ({ url: '/places/suggest', params: { q, limit } }),
      keepUnusedDataFor: 300,
    }),
    // CSV of the filtered list → { csv, filename } (save with utils/saveTextFile).
    exportRestaurants: builder.mutation({
      query: (params = {}) => csvRequest('/admin/restaurants/export', params),
      transformResponse: csvResponse('yumio-restaurants'),
    }),
  }),
})

export const {
  useGetAdminRestaurantsQuery,
  useGetAdminRestaurantQuery,
  useCreateRestaurantMutation,
  useUpdateRestaurantMutation,
  useDeleteRestaurantMutation,
  useApproveRestaurantMutation,
  useRejectRestaurantMutation,
  useSuspendRestaurantMutation,
  useRestoreRestaurantMutation,
  usePurgeRestaurantMutation,
  useSetRestaurantStatusMutation,
  useLazyGetPlaceSuggestionsQuery,
  useExportRestaurantsMutation,
} = adminRestaurantsApi
