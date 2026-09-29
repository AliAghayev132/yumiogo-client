import { baseApi } from './baseApi'

// The menu is cached per restaurant under the AdminRestaurant tag type (id "menu-<id>");
// item changes also refresh the restaurant itself (menuItemCount, popularDishes).
const menuTag = (restaurantId) => ({ type: 'AdminRestaurant', id: `menu-${restaurantId}` })
const touched = (restaurantId) => [menuTag(restaurantId), { type: 'AdminRestaurant', id: restaurantId }]

/**
 * Admin menu editor (server adminMenuController, /api/admin, admin only).
 *
 *   GET    /admin/restaurants/:id/menu → { restaurant, categories: [{ _id|null, name, description, order,
 *          isActive, itemCount, items: [{ _id, category, name, description, price, image, dietary,
 *          isPopular, isAvailable, order }] }], itemCount, menuPhotos }
 *   POST   /admin/restaurants/:id/menu/categories { name, description?, isActive?, order? }
 *   PATCH  /admin/restaurants/:id/menu/categories/reorder { ids }
 *   PUT    /admin/menu/categories/:categoryId  ·  DELETE /admin/menu/categories/:categoryId?deleteItems=true
 *   POST   /admin/restaurants/:id/menu/items { name, price, category?, description?, image?, dietary?,
 *          isPopular?, isAvailable? }
 *   PUT    /admin/menu/items/:itemId  ·  DELETE /admin/menu/items/:itemId
 *   PATCH  /admin/restaurants/:id/menu/items/reorder { ids, category? }
 *   PUT    /admin/restaurants/:id/menu-photos { photos }   (ordered replace)
 *   POST   /admin/restaurants/:id/menu-photos (multipart "files") → { urls, photos }
 *   POST   /admin/menu/uploads (multipart "files") → { urls }   (dish images)
 * Mutations on a category / item take `restaurantId` too (cache invalidation only).
 */
export const adminMenuApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminMenu: builder.query({
      query: (restaurantId) => `/admin/restaurants/${restaurantId}/menu`,
      providesTags: (result, error, restaurantId) => [menuTag(restaurantId)],
    }),
    createMenuCategory: builder.mutation({
      query: ({ restaurantId, ...body }) => ({
        url: `/admin/restaurants/${restaurantId}/menu/categories`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { restaurantId }) => touched(restaurantId),
    }),
    updateMenuCategory: builder.mutation({
      query: (args) => {
        const { id, restaurantId: _restaurantId, ...body } = args
        return { url: `/admin/menu/categories/${id}`, method: 'PUT', body }
      },
      invalidatesTags: (result, error, { restaurantId }) => touched(restaurantId),
    }),
    deleteMenuCategory: builder.mutation({
      query: ({ id, deleteItems = false }) => ({
        url: `/admin/menu/categories/${id}`,
        method: 'DELETE',
        params: deleteItems ? { deleteItems: true } : undefined,
      }),
      invalidatesTags: (result, error, { restaurantId }) => touched(restaurantId),
    }),
    reorderMenuCategories: builder.mutation({
      query: ({ restaurantId, ids }) => ({
        url: `/admin/restaurants/${restaurantId}/menu/categories/reorder`,
        method: 'PATCH',
        body: { ids },
      }),
      invalidatesTags: (result, error, { restaurantId }) => touched(restaurantId),
    }),
    createMenuItem: builder.mutation({
      query: ({ restaurantId, ...body }) => ({
        url: `/admin/restaurants/${restaurantId}/menu/items`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { restaurantId }) => touched(restaurantId),
    }),
    updateMenuItem: builder.mutation({
      query: (args) => {
        const { id, restaurantId: _restaurantId, ...body } = args
        return { url: `/admin/menu/items/${id}`, method: 'PUT', body }
      },
      invalidatesTags: (result, error, { restaurantId }) => touched(restaurantId),
    }),
    deleteMenuItem: builder.mutation({
      query: ({ id }) => ({ url: `/admin/menu/items/${id}`, method: 'DELETE' }),
      invalidatesTags: (result, error, { restaurantId }) => touched(restaurantId),
    }),
    // ids in the new order; `category` (id | null) also moves them into that category.
    reorderMenuItems: builder.mutation({
      query: ({ restaurantId, ids, category }) => ({
        url: `/admin/restaurants/${restaurantId}/menu/items/reorder`,
        method: 'PATCH',
        body: category === undefined ? { ids } : { ids, category },
      }),
      invalidatesTags: (result, error, { restaurantId }) => touched(restaurantId),
    }),
    setMenuPhotos: builder.mutation({
      query: ({ restaurantId, photos }) => ({
        url: `/admin/restaurants/${restaurantId}/menu-photos`,
        method: 'PUT',
        body: { photos },
      }),
      invalidatesTags: (result, error, { restaurantId }) => touched(restaurantId),
    }),
    uploadMenuPhotos: builder.mutation({
      query: ({ restaurantId, formData }) => ({
        url: `/admin/restaurants/${restaurantId}/menu-photos`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (result, error, { restaurantId }) => touched(restaurantId),
    }),
    uploadMenuImages: builder.mutation({
      query: (formData) => ({ url: '/admin/menu/uploads', method: 'POST', body: formData }),
    }),
  }),
})

export const {
  useGetAdminMenuQuery,
  useCreateMenuCategoryMutation,
  useUpdateMenuCategoryMutation,
  useDeleteMenuCategoryMutation,
  useReorderMenuCategoriesMutation,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  useReorderMenuItemsMutation,
  useSetMenuPhotosMutation,
  useUploadMenuPhotosMutation,
  useUploadMenuImagesMutation,
} = adminMenuApi
