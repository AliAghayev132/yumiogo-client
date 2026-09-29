import { baseApi } from './baseApi'

/**
 * Catalog + content endpoints — admin CRUD under /api/admin (taxonomies,
 * cities, FAQs, onboarding slides, legal pages) plus the public reads
 * (/api/catalog, /api/content/*) the landing page uses.
 *
 * Every catalog write also invalidates:
 *  - 'AdminMeta'  → the restaurant form's option lists (/admin/meta)
 *  - 'Catalog'    → the public /catalog snapshot
 * Taxonomy / city renames and deletes cascade into restaurants (and report
 * reasons), so those also refresh the restaurant and report lists.
 */

// Tags refreshed by any taxonomy / city write.
const CATALOG_WRITE_TAGS = [
  'AdminMeta',
  'Catalog',
  { type: 'AdminRestaurant', id: 'LIST' },
  { type: 'AdminReport', id: 'LIST' },
]

// Per-item tags plus a LIST tag for a list response.
const listTags = (type, list) =>
  list
    ? [...list.map((item) => ({ type, id: item._id })), { type, id: 'LIST' }]
    : [{ type, id: 'LIST' }]

/**
 * Optimistic reorder: rewrite `order` in every cached list of `endpointName`
 * whose args pass `matchArgs`, re-sort it, and roll back if the request fails.
 * Keeps the up/down buttons snappy instead of waiting for the refetch.
 */
const optimisticReorder = (endpointName, listKey, matchArgs = () => true) =>
  async function onQueryStarted({ ids }, { dispatch, getState, queryFulfilled }) {
    const position = new Map(ids.map((id, index) => [String(id), index]))
    const patches = catalogApi.util
      .selectCachedArgsForQuery(getState(), endpointName)
      .filter(matchArgs)
      .map((args) =>
        dispatch(
          catalogApi.util.updateQueryData(endpointName, args, (draft) => {
            const list = draft?.data?.[listKey]
            if (!Array.isArray(list)) return
            list.forEach((item) => {
              if (position.has(String(item._id))) item.order = position.get(String(item._id))
            })
            list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          })
        )
      )
    try {
      await queryFulfilled
    } catch {
      patches.forEach((patch) => patch.undo())
    }
  }

export const catalogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============ TAXONOMIES ============
    // type: cuisine | feature | tag | dietary | mood | reportReason
    // usageCount counts restaurants (reports for report reasons), so
    // restaurant and report writes refresh it too.
    getTaxonomies: builder.query({
      query: (params = {}) => ({ url: '/admin/taxonomies', params }),
      providesTags: (result) => [
        ...listTags('AdminTaxonomy', result?.data?.items),
        { type: 'AdminRestaurant', id: 'LIST' },
        { type: 'AdminReport', id: 'LIST' },
      ],
    }),
    createTaxonomy: builder.mutation({
      query: (body) => ({ url: '/admin/taxonomies', method: 'POST', body }),
      invalidatesTags: [{ type: 'AdminTaxonomy', id: 'LIST' }, 'AdminMeta', 'Catalog'],
    }),
    updateTaxonomy: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/taxonomies/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'AdminTaxonomy', id },
        { type: 'AdminTaxonomy', id: 'LIST' },
        ...CATALOG_WRITE_TAGS,
      ],
    }),
    deleteTaxonomy: builder.mutation({
      query: (id) => ({ url: `/admin/taxonomies/${id}`, method: 'DELETE' }),
      invalidatesTags: (result, error, id) => [
        { type: 'AdminTaxonomy', id },
        { type: 'AdminTaxonomy', id: 'LIST' },
        ...CATALOG_WRITE_TAGS,
      ],
    }),
    // body: { type, ids } — order = index within that type.
    reorderTaxonomies: builder.mutation({
      query: (body) => ({ url: '/admin/taxonomies/reorder', method: 'PATCH', body }),
      onQueryStarted: (arg, api) =>
        optimisticReorder('getTaxonomies', 'items', (args) => args?.type === arg.type)(arg, api),
      invalidatesTags: [{ type: 'AdminTaxonomy', id: 'LIST' }, 'AdminMeta', 'Catalog'],
    }),

    // ============ CITIES ============
    getAdminCities: builder.query({
      query: () => '/admin/cities',
      providesTags: (result) => [
        ...listTags('AdminCity', result?.data?.cities),
        { type: 'AdminRestaurant', id: 'LIST' },
      ],
    }),
    createCity: builder.mutation({
      query: (body) => ({ url: '/admin/cities', method: 'POST', body }),
      invalidatesTags: [{ type: 'AdminCity', id: 'LIST' }, 'AdminMeta', 'Catalog'],
    }),
    updateCity: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/cities/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'AdminCity', id },
        { type: 'AdminCity', id: 'LIST' },
        ...CATALOG_WRITE_TAGS,
      ],
    }),
    deleteCity: builder.mutation({
      query: (id) => ({ url: `/admin/cities/${id}`, method: 'DELETE' }),
      invalidatesTags: (result, error, id) => [
        { type: 'AdminCity', id },
        { type: 'AdminCity', id: 'LIST' },
        'AdminMeta',
        'Catalog',
      ],
    }),
    // body: { ids }
    reorderCities: builder.mutation({
      query: (body) => ({ url: '/admin/cities/reorder', method: 'PATCH', body }),
      onQueryStarted: optimisticReorder('getAdminCities', 'cities'),
      invalidatesTags: [{ type: 'AdminCity', id: 'LIST' }, 'AdminMeta', 'Catalog'],
    }),

    // ============ FAQS ============
    getAdminFaqs: builder.query({
      query: () => '/admin/faqs',
      providesTags: (result) => listTags('AdminFaq', result?.data?.faqs),
    }),
    createFaq: builder.mutation({
      query: (body) => ({ url: '/admin/faqs', method: 'POST', body }),
      invalidatesTags: [{ type: 'AdminFaq', id: 'LIST' }, 'PublicContent'],
    }),
    updateFaq: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/faqs/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'AdminFaq', id },
        { type: 'AdminFaq', id: 'LIST' },
        'PublicContent',
      ],
    }),
    deleteFaq: builder.mutation({
      query: (id) => ({ url: `/admin/faqs/${id}`, method: 'DELETE' }),
      invalidatesTags: (result, error, id) => [
        { type: 'AdminFaq', id },
        { type: 'AdminFaq', id: 'LIST' },
        'PublicContent',
      ],
    }),
    // body: { ids }
    reorderFaqs: builder.mutation({
      query: (body) => ({ url: '/admin/faqs/reorder', method: 'PATCH', body }),
      onQueryStarted: optimisticReorder('getAdminFaqs', 'faqs'),
      invalidatesTags: [{ type: 'AdminFaq', id: 'LIST' }, 'PublicContent'],
    }),

    // ============ ONBOARDING SLIDES ============
    getOnboardingSlides: builder.query({
      query: () => '/admin/onboarding',
      providesTags: (result) => listTags('AdminOnboarding', result?.data?.slides),
    }),
    createOnboardingSlide: builder.mutation({
      query: (body) => ({ url: '/admin/onboarding', method: 'POST', body }),
      invalidatesTags: [{ type: 'AdminOnboarding', id: 'LIST' }],
    }),
    updateOnboardingSlide: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/onboarding/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'AdminOnboarding', id },
        { type: 'AdminOnboarding', id: 'LIST' },
      ],
    }),
    deleteOnboardingSlide: builder.mutation({
      query: (id) => ({ url: `/admin/onboarding/${id}`, method: 'DELETE' }),
      invalidatesTags: (result, error, id) => [
        { type: 'AdminOnboarding', id },
        { type: 'AdminOnboarding', id: 'LIST' },
      ],
    }),
    // body: { ids }
    reorderOnboardingSlides: builder.mutation({
      query: (body) => ({ url: '/admin/onboarding/reorder', method: 'PATCH', body }),
      onQueryStarted: optimisticReorder('getOnboardingSlides', 'slides'),
      invalidatesTags: [{ type: 'AdminOnboarding', id: 'LIST' }],
    }),

    // ============ LEGAL / CONTENT PAGES ============
    // Pages are keyed by slug ("terms", "privacy", "cookies", ...).
    getContentPages: builder.query({
      query: () => '/admin/pages',
      providesTags: (result) =>
        result?.data?.pages
          ? [
              ...result.data.pages.map((page) => ({ type: 'AdminPage', id: page.slug })),
              { type: 'AdminPage', id: 'LIST' },
            ]
          : [{ type: 'AdminPage', id: 'LIST' }],
    }),
    getContentPage: builder.query({
      query: (slug) => `/admin/pages/${slug}`,
      providesTags: (result, error, slug) => [{ type: 'AdminPage', id: slug }],
    }),
    // Upsert: { slug, title, intro, sections: [{ heading, body, highlight }], isPublished }
    saveContentPage: builder.mutation({
      query: ({ slug, ...body }) => ({ url: `/admin/pages/${slug}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { slug }) => [
        { type: 'AdminPage', id: slug },
        { type: 'AdminPage', id: 'LIST' },
      ],
    }),
    deleteContentPage: builder.mutation({
      query: (slug) => ({ url: `/admin/pages/${slug}`, method: 'DELETE' }),
      invalidatesTags: (result, error, slug) => [
        { type: 'AdminPage', id: slug },
        { type: 'AdminPage', id: 'LIST' },
      ],
    }),

    // ============ PUBLIC (no auth) ============
    // Also tagged 'AdminSettings' so saving Settings refreshes the config block.
    getCatalog: builder.query({
      query: () => '/catalog',
      providesTags: ['Catalog', 'AdminSettings'],
    }),
    getPublicFaqs: builder.query({
      query: (audience = 'web') => ({ url: '/content/faqs', params: { audience } }),
      providesTags: ['PublicContent'],
    }),
    getPublicStats: builder.query({
      query: () => '/content/stats',
    }),
    // Top-rated live restaurants for the landing page's phone mock-up (public search).
    // → [{ _id, name, cuisines, avgPrice, rating, reviewCount, openNow, coverImages, … }]
    getShowcaseRestaurants: builder.query({
      query: (limit = 4) => ({ url: '/restaurants/search', params: { sort: 'rating', limit } }),
      transformResponse: (res) => res?.data?.restaurants ?? [],
    }),
    // Published legal pages (website footer, /legal/:slug). Admin page edits refresh them.
    // → data: { pages: [{ slug, title, updatedAt }] }
    getPublicPages: builder.query({
      query: () => '/content/pages',
      providesTags: ['PublicContent', { type: 'AdminPage', id: 'LIST' }],
    }),
    // → data: { page: { slug, title, intro, sections: [{ heading, body, highlight }], updatedAt } }; 404 unpublished
    getPublicPage: builder.query({
      query: (slug) => `/content/pages/${slug}`,
      providesTags: (result, error, slug) => ['PublicContent', { type: 'AdminPage', id: slug }],
    }),
  }),
})

export const {
  useGetTaxonomiesQuery,
  useCreateTaxonomyMutation,
  useUpdateTaxonomyMutation,
  useDeleteTaxonomyMutation,
  useReorderTaxonomiesMutation,
  useGetAdminCitiesQuery,
  useCreateCityMutation,
  useUpdateCityMutation,
  useDeleteCityMutation,
  useReorderCitiesMutation,
  useGetAdminFaqsQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
  useReorderFaqsMutation,
  useGetOnboardingSlidesQuery,
  useCreateOnboardingSlideMutation,
  useUpdateOnboardingSlideMutation,
  useDeleteOnboardingSlideMutation,
  useReorderOnboardingSlidesMutation,
  useGetContentPagesQuery,
  useGetContentPageQuery,
  useSaveContentPageMutation,
  useDeleteContentPageMutation,
  useGetCatalogQuery,
  useGetPublicFaqsQuery,
  useGetPublicStatsQuery,
  useGetShowcaseRestaurantsQuery,
  useGetPublicPagesQuery,
  useGetPublicPageQuery,
} = catalogApi
