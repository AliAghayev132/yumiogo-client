# store/slices/

## Məqsəd

Bu qovluq server keşi ilə əlaqəli olmayan, tətbiq daxili (client-side) Redux state-lərini saxlayır. RTK Query `api/` qovluğunda serverdən gələn məlumatı idarə edir; buradakı slice-lar isə lokal / UI / sessiya state-i üçündür. Hazırda burada `authSlice.js` var — o, istifadəçi məlumatını və token-ləri saxlayır, hər dəyişiklikdə `localStorage`-a mirror edir ki, səhifə yenilənəndə sessiya qalsın.

## Adlandırma / yazılış konvensiyası

- Hər slice `<entity>Slice.js` (camelCase) adlanır və `createSlice({ name, initialState, reducers })` istifadə edir.
- `name` sahəsi store-dakı açarla uyğun olur (məs. `auth`).
- Fayl sonunda action-lar named export, reducer isə default export edilir: `export default authSlice.reducer`.
- Bu qovluqda barrel `index.js` YOXDUR — slice-lar birbaşa öz fayl yolu ilə import olunur (məs. `./slices/authSlice`).

## Nümunə

`authSlice.js` faylından:

```js
import { createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, tokens } = action.payload
      state.user = user
      state.accessToken = tokens.accessToken
      persist(state)
    },
    logout: (state) => { /* state-i sıfırla + localStorage.removeItem */ },
  },
})

export const { setCredentials, setTokens, updateUser, logout } = authSlice.actions
export default authSlice.reducer
```

Store-da barrel olmadığı üçün birbaşa: `import authReducer from './slices/authSlice'`.

## Yeni fayl necə əlavə olunur

1. `<entity>Slice.js` yarat, `createSlice` ilə `name`, `initialState` və `reducers` təyin et.
2. Action-ları named, reducer-i `export default <entity>Slice.reducer` ilə ixrac et.
3. `store/index.js`-də reducer-i birbaşa fayl yolu ilə import et (barrel yoxdur).
4. `reducer` obyektinə sabit açar əlavə et (məs. `post: postReducer`).
