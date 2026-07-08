# store/api/

## Məqsəd

Bu qovluq bütün RTK Query API təbəqəsini saxlayır. `baseApi.js` yeganə `createApi` instansı yaradır: `fetchBaseQuery` ilə base URL, token-in `prepareHeaders`-də əlavə olunması və 401 zamanı refresh token ilə avtomatik reauth burada qurulur. Feature faylları (`authApi.js`, `postApi.js`) heç bir yeni api yaratmır — onlar `baseApi.injectEndpoints` vasitəsilə öz endpoint-lərini eyni instansa "inject" edir. `index.js` isə barrel-dir və hamısını bir yerdən ixrac edir.

## Adlandırma / yazılış konvensiyası

- Yeganə base instans `baseApi` adlanır və yalnız `baseApi.js`-də mövcuddur.
- Hər resurs üçün fayl `<entity>Api.js` (camelCase) adlanır və `baseApi.injectEndpoints({ endpoints: (builder) => ({ ... }) })` istifadə edir.
- Endpoint-lər `builder.query` / `builder.mutation` ilə təyin olunur; cache üçün `providesTags` / `invalidatesTags` (`tagTypes`: `User`, `Post`, `Auth`) istifadə edilir.
- Fayl sonunda avtomatik yaranan hook-lar (`use<Endpoint>Query` / `use<Endpoint>Mutation`) ixrac olunur.

## Nümunə

`postApi.js` faylından:

```js
import { baseApi } from './baseApi'

export const postApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: (params = {}) => ({ url: '/posts', params }),
      providesTags: [{ type: 'Post', id: 'LIST' }],
    }),
  }),
})

export const { useGetPostsQuery } = postApi
```

Komponentdə barrel və `@store` alias-ı ilə: `import { useGetPostsQuery } from '@store/api'`.

## Yeni fayl necə əlavə olunur

1. `postApi.js`-i şablon kimi kopyala, `<entity>Api.js` adlandır.
2. `import { baseApi } from './baseApi'` və `baseApi.injectEndpoints(...)` yaz.
3. Yeni tag lazımdırsa, `baseApi.js`-dəki `tagTypes` massivinə əlavə et.
4. Fayl sonunda hook-ları ixrac et.
5. `index.js` barrel-inə `export * from './<entity>Api'` sətrini əlavə et.
