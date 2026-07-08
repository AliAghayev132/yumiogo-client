# layouts/

## Məqsəd
Bu qovluq route ağacının müxtəlif hissələrini əhatə edən səhifə "qabıqlarını" (shell) saxlayır. `PublicLayout` sadə marketinq qabığıdır (header + `<Outlet/>` + footer), `DashboardLayout` isə yığıla bilən (collapsible) sidebar, animasiyalı naviqasiya və logout ilə autentifikasiyalı panel qabığıdır. Hər ikisi daxili route-ları `<Outlet/>` vasitəsilə render edir.

## Adlandırma / yazılış konvensiyası
Layout faylları PascalCase `.jsx`-dir və `export const` ilə adlı ixrac verir. `index.js` barrel-ı onları açıq şəkildə yenidən ixrac edir (`export { PublicLayout } from './PublicLayout'`). İdxal `@layouts` alias-ı vasitəsilə aparılır və layout-lar əsasən `routes/` qovluğunda parent `<Route>` element kimi istifadə olunur.

## Nümunə
`PublicLayout.jsx`:
```jsx
export const PublicLayout = () => (
  <div className="min-h-screen flex flex-col bg-white">
    <header>{/* ... */}</header>
    <main className="flex-1"><Outlet /></main>
    <footer>{/* ... */}</footer>
  </div>
)
```
`index.js`-də `export { PublicLayout } from './PublicLayout'` var; `routes/PublicRouter.jsx`-də belə bağlanır:
```jsx
import { PublicLayout } from '@layouts'

<Route element={<PublicLayout />}>
  <Route path="/" element={<HomePage />} />
</Route>
```

## Yeni fayl necə əlavə olunur
1. `layouts/` içində PascalCase fayl yarat (məs. `AuthLayout.jsx`) və içində `<Outlet/>` render edən `export const AuthLayout = () => { ... }` yaz.
2. `index.js`-ə `export { AuthLayout } from './AuthLayout'` sətrini əlavə et.
3. Uyğun router faylında `import { AuthLayout } from '@layouts'` idxal et və onu parent `<Route element={<AuthLayout />}>` kimi istifadə et.
