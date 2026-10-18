import { baseApi } from './baseApi'

/**
 * Platform settings, demo data / data reset and broadcast notifications — server
 * /api/admin/settings, /api/admin/seed|reset, /api/admin/data/wipe, /api/admin/notifications/broadcast.
 *
 * Settings are also read by the public catalog (/api/catalog config) and the
 * restaurant form metadata (price levels), so saving refreshes those too.
 */

// Loading / deleting demo data and "Delete all data" can change anything the admin has cached:
// bare tag types invalidate every cached list and detail (menus, label requests, the bell, ...).
const DATA_TAGS = [
  'AdminStats',
  'AdminSettings',
  'AdminUser',
  'AdminRestaurant',
  'AdminReview',
  'AdminReport',
  'AdminList',
  'AdminTaxonomy',
  'AdminCity',
  'AdminFaq',
  'AdminOnboarding',
  'AdminPage',
  'AdminMeta',
  'Catalog',
  'PublicContent',
]

export const adminSettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // → data: { settings, languages: [{ code, label }],
    //   demoData: { enabled, wipe, confirmations: { seed, reset, wipe },
    //     counts: { users, restaurants, menuItems, reviews, comments, lists, notifications, reports,
    //       labelRequests, restaurantFollows, views, searches } | null } }
    getAdminSettings: builder.query({
      query: () => '/admin/settings',
      providesTags: ['AdminSettings'],
    }),
    // Any subset of the settings → data: { settings }; message "Settings saved successfully" |
    // "Maintenance mode enabled" | "Maintenance mode disabled"
    updateAdminSettings: builder.mutation({
      query: (body) => ({ url: '/admin/settings', method: 'PUT', body }),
      // Write the saved document into the cache right away, so switches do not flick back
      // while the invalidated query refetches.
      async onQueryStarted(body, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          const saved = data?.data?.settings
          if (!saved) return
          dispatch(
            adminSettingsApi.util.updateQueryData('getAdminSettings', undefined, (draft) => {
              if (draft?.data) draft.data.settings = saved
            })
          )
        } catch {
          // The caller shows the error.
        }
      },
      invalidatesTags: ['AdminSettings', 'AdminMeta', 'Catalog'],
    }),

    // Demo data (development tool): { confirm: "SEED DEMO DATA" } / { confirm: "DELETE DEMO DATA" }
    // → data: { counts } (seed: restaurants, menuItems, users, reviews, comments, lists, notifications,
    //   reports, views, … created; reset: the same keys removed)
    seedDemoData: builder.mutation({
      query: (body) => ({ url: '/admin/seed', method: 'POST', body }),
      invalidatesTags: DATA_TAGS,
    }),
    clearDemoData: builder.mutation({
      query: (body) => ({ url: '/admin/reset', method: 'POST', body }),
      invalidatesTags: DATA_TAGS,
    }),
    // Delete ALL app data: { confirm: "DELETE ALL DATA", includeCatalog?: boolean }
    // → data: { counts: { users, restaurants, reviews, lists, notifications, files, …, catalog? }, includeCatalog }
    wipeAllData: builder.mutation({
      query: (body) => ({ url: '/admin/data/wipe', method: 'POST', body }),
      invalidatesTags: DATA_TAGS,
    }),

    // How many accounts a broadcast would reach (the sending admin counts when in the audience).
    // { segment, city?, userIds? } → data: { recipients, includesYou }
    getBroadcastAudience: builder.query({
      query: ({ segment, city, userIds } = {}) => ({
        url: '/admin/notifications/audience',
        params: { segment, ...(city ? { city } : {}), ...(userIds?.length ? { userIds: userIds.join(',') } : {}) },
      }),
      keepUnusedDataFor: 30,
    }),

    // { message (≤500), title? (≤120), link? (http/https), segment?: all|users|admins|verified|new|city,
    //   city?, userIds? } → 201 data: { recipients, delivered, includesYou } |
    //   202 data: { recipients, queued: true, includesYou }; 400 "No active <audience> to send to"
    broadcastNotification: builder.mutation({
      query: (body) => ({ url: '/admin/notifications/broadcast', method: 'POST', body }),
      invalidatesTags: ['AdminStats'],
    }),
  }),
})

export const {
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
  useSeedDemoDataMutation,
  useClearDemoDataMutation,
  useWipeAllDataMutation,
  useGetBroadcastAudienceQuery,
  useBroadcastNotificationMutation,
} = adminSettingsApi
