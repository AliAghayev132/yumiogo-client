import { baseApi } from './baseApi'

// Post endpoints — the example CRUD vertical slice against `/api/posts`.
// This file is the copy-paste reference for any new resource.
export const postApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // List posts (supports pagination + filter query params).
    // providesTags emits a per-item tag plus a LIST tag so mutations can
    // invalidate the whole list precisely.
    getPosts: builder.query({
      query: (params = {}) => ({
        url: '/posts',
        params,
      }),
      providesTags: (result) =>
        result?.data?.posts
          ? [
              ...result.data.posts.map((post) => ({ type: 'Post', id: post._id })),
              { type: 'Post', id: 'LIST' },
            ]
          : [{ type: 'Post', id: 'LIST' }],
    }),

    // Single post (server increments views).
    getPost: builder.query({
      query: (id) => `/posts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Post', id }],
    }),

    // Create -> invalidate the list.
    createPost: builder.mutation({
      query: (data) => ({
        url: '/posts',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),

    // Update -> invalidate the item and the list.
    updatePost: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/posts/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Post', id },
        { type: 'Post', id: 'LIST' },
      ],
    }),

    // Delete (soft delete server-side) -> invalidate the item and the list.
    deletePost: builder.mutation({
      query: (id) => ({
        url: `/posts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Post', id },
        { type: 'Post', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetPostsQuery,
  useGetPostQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
} = postApi
