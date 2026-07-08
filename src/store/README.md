# store/

## Məqsəd

Bu qovluq Redux Toolkit store-unun konfiqurasiya edildiyi mərkəzi nöqtədir. `index.js` faylı bütün reducer-ləri (RTK Query cache reducer-i və feature slice-larını) bir yerə yığır, middleware zəncirini qurur və `store` obyektini ixrac edir. Alt qovluqlar — `api/` (RTK Query endpoint-ləri), `slices/` (createSlice state-ləri), `context/` (React Context), `hooks/` (custom hook-lar) — məhz bu store-a qoşulur. Tətbiqin kökündə `<Provider store={store}>` bu faylı istifadə edir.

## Adlandırma / yazılış konvensiyası

Qovluğun kök faylı həmişə `index.js` adlanır və yalnız bir dəfə `configureStore` çağırır. Hər yeni feature üçün ayrıca fayl yaradılmır — mövcud `reducer` obyektinə əlavə edilir. RTK Query reducer-i `[baseApi.reducerPath]: baseApi.reducer` dinamik açarı ilə, adi slice-lar isə sabit açarla (məs. `auth`) qeydə alınır. Middleware `getDefaultMiddleware().concat(baseApi.middleware)` şəklində genişləndirilir.

## Nümunə

`index.js` faylından:

```js
import { configureStore } from '@reduxjs/toolkit'
import { baseApi } from './api/baseApi'
import authReducer from './slices/authSlice'

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
})
```

`store` `@store` alias-ı vasitəsilə `import { store } from '@store'` kimi çağırılır.

## Yeni fayl necə əlavə olunur

1. Yeni slice-ı `slices/` içində yarat (məs. `postSlice.js`) və default reducer-ini ixrac et.
2. `index.js`-ə reducer-i import et: `import postReducer from './slices/postSlice'`.
3. `reducer` obyektinə sabit açar əlavə et: `post: postReducer`.
4. Əgər yeni RTK Query api-dirsə, baseApi artıq reducer və middleware kimi qoşulub — sadəcə `injectEndpoints` istifadə et, burada dəyişiklik lazım deyil.
