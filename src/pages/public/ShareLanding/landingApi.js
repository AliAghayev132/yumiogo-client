import { baseApi } from '@store/api'
import { webSessionId } from './landingUtils'

/**
 * Public reads behind the shared-link landing pages. All of them work for guests.
 * (Reviews need a signed-in account to be read, so /review/:id calls nothing.)
 */
export const landingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // /list/:slug → data: { list: ListDetail, canEdit, isOwner, role, canJoin }
    // 404 LIST_NOT_FOUND for private and deleted lists.
    getLandingList: builder.query({
      query: (slug) => `/favorites/share/${encodeURIComponent(slug)}`,
    }),

    // /restaurant/:idOrSlug → data: { restaurant } (id or slug; 404 when missing / not active).
    // The server counts one view per viewer per day; the per-browser X-Session-Id keeps a
    // guest's reloads and repeat visits to a single view (admins are never counted).
    getLandingRestaurant: builder.query({
      query: (idOrSlug) => ({
        url: `/restaurants/${encodeURIComponent(idOrSlug)}`,
        headers: { 'X-Session-Id': webSessionId() },
      }),
    }),

    // /invite/:code → data: { code, inviter: { _id, firstName, lastName, avatar, verified, … } }
    // 404 INVITE_NOT_FOUND.
    getLandingInvite: builder.query({
      query: (code) => `/users/invites/${encodeURIComponent(code)}`,
    }),
  }),
})

export const { useGetLandingListQuery, useGetLandingRestaurantQuery, useGetLandingInviteQuery } = landingApi
