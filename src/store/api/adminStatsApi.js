import { baseApi } from './baseApi'

/**
 * Admin Dashboard + Analytics read models (server AdminStatsService).
 *
 *   GET /admin/stats?days=7|30|90
 *     → { stats: { totalUsers, totalRestaurants, totalReviews, openReports, pendingReports,
 *                  avgRating, usersChange, restaurantsChange, reviewsChange, reportsChange (new reports),
 *                  openReportsBefore, openReportsChange (open now vs at the period start),
 *                  newUsers, newRestaurants, newReviews, newReports, pendingRestaurants,
 *                  pendingUsers, pendingReviews, periodDays },
 *         badges: { reviews, reports, restaurants, users },
 *         activity: [{ id, type: user|review|report|restaurant|list, title, detail, at, link }] }
 *   GET /admin/analytics?range=7d|30d|90d|6m|12m
 *     → { range, summary: { newUsersThisMonth, reviewsThisMonth, avgRating, savesThisMonth }
 *           (each { value, previous, change }),
 *         series: [{ date, label, users, reviews, saves }],
 *         platformGrowth: [{ month, label, users, reviews }],
 *         topCuisines: [{ name, slug, color, count, percent }],
 *         sentiment: [{ key, label, emoji, color, count, percent }],
 *         ratingDistribution: [{ key, label, count, percent }], averageScore, totalReviews,
 *         topRestaurants: [{ _id, name, rating, reviewCount }] (top 5 live by reviews),
 *         statusBreakdown: [{ _id: status, count }] (non-deleted restaurants), … }
 *
 * The sidebar polls getStats() without arguments (7 days) — the Dashboard reuses that cache
 * entry for its default period.
 */
export const adminStatsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStats: builder.query({
      query: (params) => ({ url: '/admin/stats', params: params || undefined }),
      providesTags: ['AdminStats'],
    }),
    // Same tag as the stat cards: moderation / create / delete refresh the charts too.
    getAnalytics: builder.query({
      query: (params) => ({ url: '/admin/analytics', params: params || undefined }),
      providesTags: ['AdminStats'],
    }),
  }),
})

export const { useGetStatsQuery, useGetAnalyticsQuery } = adminStatsApi
