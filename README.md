# Client (React) — Vite SPA Template

Generic React SPA starter (`starter-client-react`). Bu paket bir Single-Page Application-ın **yenidən istifadə oluna bilən skeletidir**: Vite + React 19 üzərində qurulub, Redux Toolkit + RTK Query ilə state/data qatı, avtomatik token yeniləmə (reauth), `react-router` ilə public/dashboard bölgüsü, route guard, Socket.IO real-time konteksti və Tailwind CSS v4 ilə hazır UI komponentləri gəlir. `server/` template-i ilə birbaşa uyğun işləyir.

- **Build tool:** Vite `^8.1.3` (Rolldown)
- **UI:** React `^19.2.7` + Tailwind CSS `^4.3.2`
- **State/Data:** Redux Toolkit `^2.12.0` + RTK Query
- **Routing:** `react-router` `^8.1.0`
- **Real-time:** `socket.io-client` `^4.8.3`

---

## Məqsəd

Hər yeni frontend layihəsində eyni infrastrukturu təkrar qurmamaq üçün aşağıdakılar artıq işlək vəziyyətdədir:

- **RTK Query data qatı** — mərkəzi `baseApi`, avtomatik `Authorization` başlığı, **401-də tək dəfə token yeniləmə (reauth)** və orijinal sorğunun təkrar oynadılması.
- **`authSlice`** — localStorage ilə sinxronlaşan sessiya (səhifə yeniləyəndə giriş qalır).
- **Routing** — `AppRouter` → lazy `PublicRouter` / `DashboardRouter`, `ProtectedRoute` guard ilə rol-əsaslı qorunma.
- **`@` alias sistemi** — `vite.config.js` + `jsconfig.json` sinxron alias-ları.
- **Socket.IO konteksti** — auth token dəyişəndə avtomatik (re)connect, generic room helper-ləri (`useRoomSocket`).
- **Hazır UI kit** — Button, Input, Card, Modal, Table, Badge, Select, StatCard və s. + `SEO` komponenti (`react-helmet-async`).

---

## Qovluq ağacı (annotasiyalı)

`node_modules` və `dist` xaric:

```
client-react/
├── .env.example              # VITE_API_URL nümunəsi
├── .gitignore
├── eslint.config.js          # ESLint flat config (react-hooks, react-refresh)
├── index.html                # Vite giriş HTML-i (root div + main.jsx, SEO meta)
├── jsconfig.json             # @ alias-larının path xəritəsi (IDE + Vite üçün)
├── vite.config.js            # Vite konfiqurasiyası: react, tailwind, @ alias, manualChunks
├── vercel.json               # SPA rewrite (bütün yollar → index.html)
├── package.json
├── public/
│   └── vite.svg              # Statik favicon
└── src/
    ├── main.jsx              # createRoot → <App /> mount
    ├── App.jsx               # Provider zənciri: Helmet → Redux → Socket → Router
    ├── App.css
    │
    ├── components/
    │   ├── index.js          # SEO, ProtectedRoute, ui/* barrel
    │   ├── ProtectedRoute.jsx# Route guard (isAuthenticated + allowedRoles)
    │   ├── SEO.jsx           # react-helmet-async əsaslı başlıq/meta komponenti
    │   └── ui/               # Tailwind UI kit
    │       ├── index.js      # barrel
    │       ├── Button.jsx  Input.jsx  Textarea.jsx  Select.jsx  CustomSelect.jsx
    │       ├── Checkbox.jsx  Radio.jsx  Card.jsx  Modal.jsx  Table.jsx
    │       ├── Badge.jsx  StatCard.jsx  PageLoader.jsx
    │
    ├── constants/
    │   └── index.js          # statusOptions, roleOptions, statusBadgeVariant (server enum-ları ilə sinxron)
    │
    ├── layouts/
    │   ├── index.js          # PublicLayout, DashboardLayout barrel
    │   ├── PublicLayout.jsx  # Marketing header/footer + <Outlet />
    │   └── DashboardLayout.jsx# Collapsible sidebar shell (framer-motion, logout)
    │
    ├── pages/
    │   ├── index.js          # public + dashboard barrel
    │   ├── public/           # HomePage, LoginPage, RegisterPage, NotFoundPage
    │   └── dashboard/        # DashboardPage, PostsPage, ProfilePage
    │
    ├── routes/
    │   ├── index.js          # AppRouter barrel
    │   ├── AppRouter.jsx      # BrowserRouter + lazy route qrupları
    │   ├── PublicRouter.jsx   # /, /login, /register, 404
    │   └── DashboardRouter.jsx# /dashboard/* (ProtectedRoute ilə)
    │
    ├── store/
    │   ├── index.js          # configureStore (baseApi + auth reducer)
    │   ├── api/
    │   │   ├── index.js       # baseApi + feature endpoint barrel
    │   │   ├── baseApi.js     # fetchBaseQuery + reauth wrapper + tagTypes
    │   │   ├── authApi.js     # /api/auth endpointləri (injectEndpoints)
    │   │   └── postApi.js     # NÜMUNƏ CRUD endpointləri (/api/posts)
    │   ├── slices/
    │   │   └── authSlice.js   # localStorage-backed auth state
    │   ├── context/
    │   │   ├── index.js       # SocketProvider, useSocket barrel
    │   │   └── SocketContext.jsx  # Socket.IO provider (auth token ilə connect)
    │   └── hooks/
    │       ├── index.js       # useRoomSocket barrel
    │       └── useRoomSocket.js   # generic room subscription hook
    │
    └── utils/
        ├── index.js          # formatDate, imageHandle barrel
        ├── formatDate.js      # date-fns: formatDate/formatDateTime/formatRelative
        └── imageHandle.js     # şəkil URL/upload köməkçiləri
```

---

## `@` Alias sistemi

Alias-lar **iki yerdə sinxron** saxlanılır — Vite build/dev üçün `vite.config.js`, IDE avtomatik tamamlama və `jsconfig.json` üçün:

```js
// vite.config.js → resolve.alias
'@'          → ./src
'@components' → ./src/components
'@pages'      → ./src/pages
'@routes'     → ./src/routes
'@hooks'      → ./src/hooks
'@store'      → ./src/store
'@services'   → ./src/services
'@assets'     → ./src/assets
'@layouts'    → ./src/layouts
'@constants'  → ./src/constants
'@utils'      → ./src/utils
```

```jsonc
// jsconfig.json → compilerOptions.paths (eyni siyahı "/*" formasında)
"@/*": ["src/*"], "@components/*": ["src/components/*"], ... , "@utils": ["src/utils/index.js"]
```

İstifadə:

```js
import { AppRouter } from '@routes'
import { store } from '@store'
import { Button, Card } from '@components'
import { useLoginMutation } from '@store/api'
import { setCredentials } from '@store/slices/authSlice'
```

> **Vacib:** yeni alias əlavə edəndə onu **hər iki fayla** yaz — əks halda ya Vite ya da IDE onu tanımayacaq.

---

## RTK Query store axını

### Provider zənciri (`App.jsx`)

```
<HelmetProvider>          (SEO)
  <Provider store={store}>   (Redux)
    <SocketProvider>          (Socket.IO — Redux state-dən token oxuyur)
      <AppRouter />
```

### `store/index.js`

```js
configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,  // RTK Query cache
    auth: authReducer,                        // localStorage-backed sessiya
  },
  middleware: (gDM) => gDM().concat(baseApi.middleware),
})
```

### `baseApi.js` — base query + reauth

Bütün endpoint-lər tək `baseApi`-yə inject olunur:

1. **`fetchBaseQuery`** — `baseUrl = ${VITE_API_URL}/api`, `credentials: 'include'`. `prepareHeaders` auth slice-dəki `accessToken`-i `Authorization: Bearer ...` kimi əlavə edir (əgər başlıq artıq təyin olunmayıbsa — məs. reset token halında).
2. **`baseQueryWithReauth`** — cavab **401** olduqda:
   - `refreshToken` varsa → `POST /auth/refresh` çağırır → uğurlu olsa `auth/setTokens` dispatch edir və **orijinal sorğunu təkrar oynadır**.
   - refresh alınmasa → `auth/logout` dispatch edir.
3. `tagTypes: ['User', 'Post', 'Auth']` — cache invalidasiyası üçün.

### `injectEndpoints` pattern-i

Feature endpoint-ləri ayrı fayllarda `baseApi.injectEndpoints({...})` ilə əlavə olunur və avtomatik hook-lar generasiya edir:

- **`authApi.js`** — `useLoginMutation`, `useRegisterMutation`, `useVerifyOTPMutation`, `useGetMeQuery`, `useLogoutMutation`, `useUpdateProfileMutation`, `useChangePasswordMutation`, `useForgotPasswordMutation`, `useVerifyResetOTPMutation`, `useResetPasswordMutation` və s. — server `/api/auth/*` route-larını birba birə əks etdirir.
- **`postApi.js`** — `useGetPostsQuery`, `useGetPostQuery`, `useCreatePostMutation`, `useUpdatePostMutation`, `useDeletePostMutation`. `providesTags`/`invalidatesTags` ilə `Post` cache-i (per-item + `LIST` tag) idarə olunur. **Bu fayl yeni resurs üçün copy-paste referansıdır.**

### `authSlice.js`

localStorage ilə sinxron sessiya. Reducer-lər:

| Action | Nə edir |
|---|---|
| `setCredentials({ user, tokens })` | Login / verify-otp-dan sonra istifadəçi + token-ları saxlayır, `isAuthenticated=true`, localStorage-a yazır. |
| `setTokens({ accessToken, refreshToken })` | Reauth-dan sonra yeni token-ları yeniləyir. |
| `updateUser(partial)` | Profil dəyişikliyini merge edir. |
| `logout()` | Hər şeyi təmizləyir və localStorage-dən silir. |

İlk state localStorage-dəki `auth` açarından oxunur — beləliklə səhifə yeniləyəndə sessiya itmir.

Tipik istifadə (LoginPage-dən):

```js
const [login, { isLoading }] = useLoginMutation()
const res = await login(form).unwrap()      // envelope: { data: { user, tokens } }
dispatch(setCredentials(res.data))
navigate('/dashboard')
```

---

## Routing

### `AppRouter.jsx`

```
<BrowserRouter>
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/*"          element={<PublicRouter />} />       (lazy)
      <Route path="/dashboard/*" element={<DashboardRouter />} />   (lazy)
```

İki route qrupu `lazy()` ilə ayrı chunk-larda yüklənir.

### `PublicRouter.jsx`

```
<Route element={<PublicLayout />}>   → <Route path="/" element={<HomePage />} />
<Route path="/login"    element={<LoginPage />} />
<Route path="/register" element={<RegisterPage />} />
<Route path="*"         element={<NotFoundPage />} />   (404)
```

### `DashboardRouter.jsx` + `ProtectedRoute`

```
<Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
  <Route index          element={<DashboardPage />} />
  <Route path="posts"   element={<PostsPage />} />
  <Route path="profile" element={<ProfilePage />} />
```

`ProtectedRoute` auth state-i yoxlayır:
- `!isAuthenticated` → `/login`-ə yönləndirir (`state.from` ilə, girişdən sonra geri qayıtmaq üçün).
- `allowedRoles` verilib və rol uyğun deyilsə → `/`-ə yönləndirir.

---

## Kitabxanalar cədvəli

`package.json`-dan **dəqiq versiyalar**:

### `dependencies`

| Paket | Versiya | Rolu |
|---|---|---|
| `react` | `^19.2.7` | UI kitabxanası |
| `react-dom` | `^19.2.7` | DOM renderer |
| `react-router` | `^8.1.0` | SPA routing |
| `@reduxjs/toolkit` | `^2.12.0` | State + RTK Query data qatı |
| `react-redux` | `^9.3.0` | React ↔ Redux bağlantısı |
| `socket.io-client` | `^4.8.3` | Real-time WebSocket client |
| `react-helmet-async` | `^3.0.0` | `<head>` SEO idarəetməsi (`SEO` komponenti) |
| `framer-motion` | `^12.42.2` | Animasiyalar (sidebar, keçidlər) |
| `lucide-react` | `^1.23.0` | İkon dəsti |
| `recharts` | `^3.9.2` | Qrafiklər (dashboard) |
| `sweetalert2` | `^11.26.25` | Modal/alert bildirişləri |
| `date-fns` | `^4.4.0` | Tarix formatlaması (`formatDate`) |
| `clsx` | `^2.1.1` | Şərti className birləşdirmə |

### `devDependencies`

| Paket | Versiya | Rolu |
|---|---|---|
| `vite` | `^8.1.3` | Build tool / dev server (Rolldown) |
| `@vitejs/plugin-react` | `^6.0.3` | React fast-refresh plugini |
| `tailwindcss` | `^4.3.2` | Utility-first CSS |
| `@tailwindcss/vite` | `^4.3.2` | Tailwind v4 Vite plugini |
| `eslint` | `^10.6.0` | Linter |
| `@eslint/js` | `^10.0.1` | ESLint baza qaydaları |
| `eslint-plugin-react-hooks` | `^7.1.1` | Hook qaydaları |
| `eslint-plugin-react-refresh` | `^0.5.3` | Fast-refresh qaydaları |
| `globals` | `^17.7.0` | Global dəyişən tərifləri |
| `@types/react`, `@types/react-dom` | `^19.2.17`, `^19.2.3` | Tip tərifləri (IDE) |

---

## Run əmrləri

```bash
pnpm install

pnpm dev        # → vite  (dev server, default http://localhost:5173)
pnpm build      # → vite build (dist/ istehsal buildi, manualChunks ilə vendor bölgüsü)
pnpm preview    # → vite preview (build-i lokal serve et)
pnpm lint       # → eslint .
```

---

## `.env.example`

```bash
# Backend API-nin baza URL-i (SONDA /api OLMADAN).
# RTK Query base query buna `/api` əlavə edir, Socket.IO isə bu origin-ə qoşulur.
VITE_API_URL=http://localhost:5000
```

Vite mühit dəyişənləri `import.meta.env.VITE_*` kimi oxunur və yalnız `VITE_` prefiksli olanlar client-ə çatır. Təyin olunmadıqda kod `http://localhost:5000`-ə fallback edir.

---

## Yeni page / slice / api / component necə əlavə olunur

### Yeni page

1. `src/pages/dashboard/ReportsPage/ReportsPage.jsx` yarat (mövcud `ProfilePage`/`PostsPage` strukturunu izlə: qovluq + `index.js` re-export).
2. Qovluq `index.js`-i: `export * from './ReportsPage'`.
3. Aid olduğu bölmə barrel-inə əlavə et (`pages/dashboard/index.js`).
4. Route-a bağla:

```jsx
// routes/DashboardRouter.jsx
import { ReportsPage } from '@pages/dashboard'
<Route path="reports" element={<ReportsPage />} />
```

### Yeni API endpoint (RTK Query)

`postApi.js`-i kopyala. Ayrı fayl (`store/api/reportApi.js`) yarat:

```js
import { baseApi } from './baseApi'

export const reportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReports: builder.query({
      query: (params = {}) => ({ url: '/reports', params }),
      providesTags: [{ type: 'Report', id: 'LIST' }],
    }),
    createReport: builder.mutation({
      query: (data) => ({ url: '/reports', method: 'POST', body: data }),
      invalidatesTags: [{ type: 'Report', id: 'LIST' }],
    }),
  }),
})

export const { useGetReportsQuery, useCreateReportMutation } = reportApi
```

Sonra:
- `store/api/index.js`-ə `export * from './reportApi'` əlavə et.
- Yeni tag lazımdırsa `baseApi.js`-dəki `tagTypes` massivinə əlavə et (`['User', 'Post', 'Auth', 'Report']`).

### Yeni slice (lokal UI/state)

```js
// store/slices/uiSlice.js
import { createSlice } from '@reduxjs/toolkit'
const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: true },
  reducers: { toggleSidebar: (s) => { s.sidebarOpen = !s.sidebarOpen } },
})
export const { toggleSidebar } = uiSlice.actions
export default uiSlice.reducer
```

`store/index.js`-də reducer-ə qoş:

```js
import uiReducer from './slices/uiSlice'
reducer: { [baseApi.reducerPath]: baseApi.reducer, auth: authReducer, ui: uiReducer }
```

### Yeni component

1. `src/components/ui/Tabs.jsx` yarat.
2. `src/components/ui/index.js`-ə `export * from './Tabs'` əlavə et.
3. İstənilən yerdə: `import { Tabs } from '@components'`.

### Real-time abunəlik

Real-time feature üçün `useRoomSocket`-i nümunə götür:

```js
import { useRoomSocket } from '@store/hooks'
const { isConnected, handleTyping } = useRoomSocket(roomId, {
  onMessage: (data) => { /* ... */ },
})
```
