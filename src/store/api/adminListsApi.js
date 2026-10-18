import { baseApi } from './baseApi'

/**
 * Favourite lists moderation — server /api/admin/lists (admin-only). Public and collaborative
 * lists show up in feeds and share links, so admins can find, inspect and remove them.
 * Removing also closes the list's open reports and notifies the owner.
 */
export const adminListsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // params: page, limit (≤100), search (list name / owner name or e-mail),
    // privacy (public|collaborative|private), owner (user id), deleted ('true' = removed lists)
    // → data: { lists: [{ _id, name, privacy, isDefault, shareSlug, owner, itemCount, saveCount,
    //   collaboratorCount, openReports, isDeleted, deletedAt, createdAt, updatedAt }],
    //   pagination, counts: { all, public, collaborative, private, deleted } } (counts follow owner / search)
    getAdminLists: builder.query({
      query: (params = {}) => ({ url: '/admin/lists', params }),
      providesTags: (result) => [
        ...(result?.data?.lists || []).map((l) => ({ type: 'AdminList', id: l._id })),
        { type: 'AdminList', id: 'LIST' },
      ],
    }),
    // → data: { list: { …list row, items: [{ restaurant, savedAt }], collaborators: [{ user, role }],
    //   savedBy: [{ _id, firstName, lastName, avatar, verified, status, isDeleted }] (latest 50) },
    //   reports: [{ _id, number, reason, description, status, reporter, createdAt }] }
    getAdminList: builder.query({
      query: (id) => `/admin/lists/${id}`,
      providesTags: (result, error, id) => [{ type: 'AdminList', id }],
    }),
    // { id, reason?, ownerId? (cache hint: the owner's user page lists it) }
    // → data: { list: { _id, name }, summary: { lists, reports } }; 409 when already removed
    removeAdminList: builder.mutation({
      query: ({ id, reason }) => ({ url: `/admin/lists/${id}`, method: 'DELETE', body: reason ? { reason } : {} }),
      invalidatesTags: (result, error, { id, ownerId }) => [
        { type: 'AdminList', id },
        { type: 'AdminList', id: 'LIST' },
        { type: 'AdminReport', id: 'LIST' },
        { type: 'AdminUser', id: 'LIST' },
        ...(ownerId ? [{ type: 'AdminUser', id: String(ownerId) }] : []),
        'AdminStats',
      ],
    }),
  }),
})

export const { useGetAdminListsQuery, useGetAdminListQuery, useRemoveAdminListMutation } = adminListsApi
