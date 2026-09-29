import { baseApi } from './baseApi'
import { csvRequest, csvResponse } from './csvRequest'

/**
 * Review moderation — server /api/admin/reviews, /api/admin/review-labels and
 * the admin side of /api/comments (all admin-only).
 *
 * Moderation writes refresh the review list, the dashboard counters/bell
 * ('AdminStats'), the reports queue (hiding / deleting a review settles its
 * open reports) and the restaurant list (ratings are recomputed).
 */

const REVIEW_WRITE_TAGS = [
  { type: 'AdminReview', id: 'LIST' },
  { type: 'AdminReport', id: 'LIST' },
  { type: 'AdminRestaurant', id: 'LIST' },
  'AdminStats',
]

// Review labels are the catalog type "reviewLabel": writes refresh the
// taxonomy lists, the public catalog snapshot and the label-request queue.
const LABEL_TAGS = [{ type: 'AdminTaxonomy', id: 'LIST' }, { type: 'AdminTaxonomy', id: 'REVIEW_LABELS' }, 'Catalog']

export const adminReviewsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============ REVIEWS ============
    // params: page, limit (≤100), status (pending|approved|flagged|rejected|all), sentiment,
    // restaurant, user, search ("#123", text, author / restaurant name), from, to,
    // sort (newest|oldest|rating_high|rating_low|popular)
    // → data: { reviews, pagination, counts: { all, pending, approved, flagged, rejected } }
    getModerationReviews: builder.query({
      query: (params = {}) => ({ url: '/admin/reviews', params }),
      providesTags: (result) => [
        ...(result?.data?.reviews || []).map((r) => ({ type: 'AdminReview', id: r._id })),
        { type: 'AdminReview', id: 'LIST' },
      ],
    }),
    // → data: { review, reports: [{ _id, number, reason, description, status, reporter, createdAt }] }
    getModerationReview: builder.query({
      query: (id) => `/admin/reviews/${id}`,
      providesTags: (result, error, id) => [{ type: 'AdminReview', id }],
    }),
    // → data: { comments: [{ _id, parent, user, text, isDeleted, likeCount, replyCount, createdAt }], pagination, live }
    getModerationReviewComments: builder.query({
      query: ({ id, ...params }) => ({ url: `/admin/reviews/${id}/comments`, params }),
      providesTags: (result, error, { id }) => [{ type: 'AdminReview', id: `COMMENTS-${id}` }],
    }),
    // { id, status: pending|approved|flagged|rejected, reason? } → data: { review }
    // message: "Review #N approved — user notified"
    setReviewStatus: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/reviews/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => [{ type: 'AdminReview', id }, ...REVIEW_WRITE_TAGS],
    }),
    // { id, reason? } → data: { review: { _id, number } }; message "Review #N deleted — user notified"
    deleteModerationReview: builder.mutation({
      query: ({ id, reason }) => ({ url: `/admin/reviews/${id}`, method: 'DELETE', body: { reason } }),
      invalidatesTags: (result, error, { id }) => [{ type: 'AdminReview', id }, ...REVIEW_WRITE_TAGS],
    }),
    // { restaurant? } → data: { restaurants, updated } | { restaurant, summary }
    recomputeRatings: builder.mutation({
      query: (body = {}) => ({ url: '/admin/reviews/recompute', method: 'POST', body }),
      invalidatesTags: [{ type: 'AdminRestaurant', id: 'LIST' }, 'AdminStats'],
    }),
    // Same filters as the list → { csv, filename } (save with utils/saveTextFile).
    exportModerationReviews: builder.mutation({
      query: (params = {}) => csvRequest('/admin/reviews/export', params),
      transformResponse: csvResponse('reviews'),
    }),

    // Comment moderation (comment author, review author or admin may delete).
    // → data: { comment: { _id }, commentCount }
    deleteReviewComment: builder.mutation({
      query: ({ commentId }) => ({ url: `/comments/${commentId}`, method: 'DELETE' }),
      invalidatesTags: (result, error, { reviewId }) => [
        { type: 'AdminReview', id: `COMMENTS-${reviewId}` },
        { type: 'AdminReview', id: reviewId },
        { type: 'AdminReview', id: 'LIST' },
      ],
    }),

    // Restaurant picker for the review filter (name search, small pages).
    // → data: { restaurants, pagination }
    searchReviewRestaurants: builder.query({
      query: ({ search = '', limit = 20 } = {}) => ({
        url: '/admin/restaurants',
        params: { search: search || undefined, limit, sort: 'name' },
      }),
      providesTags: [{ type: 'AdminRestaurant', id: 'LIST' }],
    }),

    // ============ REVIEW LABELS ============
    // params: search, group → data: { items: [item + group, isActive, usageCount], groups }
    getReviewLabels: builder.query({
      query: (params = {}) => ({ url: '/admin/review-labels', params }),
      providesTags: [{ type: 'AdminTaxonomy', id: 'REVIEW_LABELS' }, { type: 'AdminReview', id: 'LIST' }],
    }),
    // { name, group?, emoji?, icon?, color?, description?, order?, isActive? } → 201 data: { item }
    createReviewLabel: builder.mutation({
      query: (body) => ({ url: '/admin/review-labels', method: 'POST', body }),
      invalidatesTags: LABEL_TAGS,
    }),
    // { id, ...fields } → data: { item, cascaded }
    updateReviewLabel: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/review-labels/${id}`, method: 'PUT', body }),
      invalidatesTags: [...LABEL_TAGS, { type: 'AdminReview', id: 'LIST' }],
    }),
    // id → data: { removedFrom }
    deleteReviewLabel: builder.mutation({
      query: (id) => ({ url: `/admin/review-labels/${id}`, method: 'DELETE' }),
      invalidatesTags: [...LABEL_TAGS, { type: 'AdminReview', id: 'LIST' }],
    }),

    // ============ LABEL REQUESTS ("Request a label" from the app) ============
    // params: status (pending|approved|rejected|all), search, page, limit
    // → data: { requests, pagination, counts: { all, pending, approved, rejected } }
    getLabelRequests: builder.query({
      query: (params = {}) => ({ url: '/admin/review-labels/requests', params }),
      providesTags: [{ type: 'AdminTaxonomy', id: 'LABEL_REQUESTS' }],
    }),
    // { id, status: approved|rejected, name?, group?, note? } → data: { request, item? }
    reviewLabelRequest: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/review-labels/requests/${id}`, method: 'PATCH', body }),
      invalidatesTags: [...LABEL_TAGS, { type: 'AdminTaxonomy', id: 'LABEL_REQUESTS' }, 'AdminStats'],
    }),
  }),
})

export const {
  useGetModerationReviewsQuery,
  useGetModerationReviewQuery,
  useGetModerationReviewCommentsQuery,
  useSetReviewStatusMutation,
  useDeleteModerationReviewMutation,
  useRecomputeRatingsMutation,
  useExportModerationReviewsMutation,
  useDeleteReviewCommentMutation,
  useSearchReviewRestaurantsQuery,
  useGetReviewLabelsQuery,
  useCreateReviewLabelMutation,
  useUpdateReviewLabelMutation,
  useDeleteReviewLabelMutation,
  useGetLabelRequestsQuery,
  useReviewLabelRequestMutation,
} = adminReviewsApi
