# routes/

## Məqsəd
Bu qovluq tətbiqin route ağacını qurur. `AppRouter` `BrowserRouter`-i və üst səviyyə `<Routes>`-u saxlayır; `PublicRouter` və `DashboardRouter` route qruplarını `React.lazy` ilə tənbəl (lazy) yükləyir ki, hər qrup öz chunk-ında gəlsin. `DashboardRouter` bütün panel route-larını `ProtectedRoute` ilə mühafizə edir.

## Adlandırma / yazılış konvensiyası
Router faylları PascalCase `.jsx`-dir və `export const` ilə adlı ixrac verir. Diqqət: `index.js` yalnız `AppRouter`-i ixrac edir — `PublicRouter` və `DashboardRouter` qəsdən barrel-a əlavə olunmur, çünki onlar `AppRouter` daxilində lazy idxal olunur və statik yenidən ixrac code-splitting-i pozardı. İdxal `@routes` (kök router üçün), həmçinin `@layouts`, `@components` və `@pages/...` alias-ları ilə aparılır.

## Nümunə
`PublicRouter.jsx` layout və səhifələri birləşdirir:
```jsx
import { PublicLayout } from '@layouts'
import { HomePage, LoginPage } from '@pages/public'

export const PublicRouter = () => (
  <Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<HomePage />} />
    </Route>
    <Route path="/login" element={<LoginPage />} />
  </Routes>
)
```
`AppRouter` isə onu lazy yükləyir; `index.js` yalnız `export { AppRouter } from './AppRouter'` verir, giriş nöqtəsi `import { AppRouter } from '@routes'`.

## Yeni fayl necə əlavə olunur
1. Mövcud qrupa route əlavə edirsənsə, sadəcə uyğun router faylına (`PublicRouter.jsx` və ya `DashboardRouter.jsx`) yeni `<Route>` əlavə et və səhifəni `@pages/...`-dan idxal et.
2. Tam yeni route qrupu üçün PascalCase fayl yarat (məs. `AdminRouter.jsx`) və `export const AdminRouter = () => (<Routes>...</Routes>)` yaz.
3. Onu `AppRouter.jsx`-də `lazy(() => import('./AdminRouter').then((m) => ({ default: m.AdminRouter })))` ilə yüklə və `<Route path="/admin/*" element={<AdminRouter />} />` əlavə et. Lazy qrupu `index.js`-ə əlavə ETMƏ.
