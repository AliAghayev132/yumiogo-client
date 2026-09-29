import { baseApi } from './baseApi'

/**
 * Shared admin endpoints — image uploads and the restaurant-form metadata.
 * Everything else lives in its domain file (same hook names, all exported from
 * store/api/index.js): adminStatsApi, adminUsersApi, adminRestaurantsApi, adminMenuApi,
 * adminReviewsApi, adminReportsApi and adminSettingsApi (settings, demo data, broadcast).
 */
export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Image uploads (multipart) — fetchBaseQuery handles FormData automatically
    uploadImages: builder.mutation({
      query: ({ kind, formData }) => ({ url: `/uploads/${kind}`, method: 'POST', body: formData }),
    }),

    // Form metadata (catalog option lists). Catalog writes invalidate 'AdminMeta';
    // priceLevels come from Settings, so saving Settings ('AdminSettings') refreshes it too.
    getMeta: builder.query({
      query: () => '/admin/meta',
      providesTags: ['AdminMeta', 'AdminSettings'],
    }),
  }),
})

export const { useUploadImagesMutation, useGetMetaQuery } = adminApi
