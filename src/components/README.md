# components/

## Məqsəd
Bu qovluq bütün tətbiq boyu paylaşılan, hər hansı konkret səhifəyə bağlı olmayan komponentləri saxlayır. Buraya `SEO` (səhifə başına `<head>` teqləri — title, canonical, Open Graph) və `ProtectedRoute` (autentifikasiya və rol əsaslı route mühafizəsi) daxildir. Əlavə olaraq `index.js` barrel-ı `ui/` alt-qovluğundakı bütün UI kitini də yenidən ixrac edir, beləliklə paylaşılan komponentlərin hamısı tək giriş nöqtəsindən — `@components` alias-ından — əlçatan olur.

## Adlandırma / yazılış konvensiyası
Komponent faylları PascalCase `.jsx` adlanır (məsələn `ProtectedRoute.jsx`) və `export const` ilə adlı (named) ixrac verir — default export istifadə olunmur. Hər komponent `index.js` barrel-ında `export * from './ComponentName'` sətri ilə yenidən ixrac olunur. İdxal həmişə `@components` alias-ı vasitəsilə aparılır, nisbi yollarla yox.

## Nümunə
`ProtectedRoute.jsx` route mühafizəçisidir:
```jsx
export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, role } = useSelector((state) => state.auth)
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}
```
`index.js` içində `export * from './ProtectedRoute'` sətri ilə açılır, sonra `routes/DashboardRouter.jsx`-də belə istifadə olunur:
```jsx
import { ProtectedRoute } from '@components'
```

## Yeni fayl necə əlavə olunur
1. `components/` içində PascalCase fayl yarat (məs. `Analytics.jsx`) və `export const Analytics = () => { ... }` şəklində adlı ixrac ver.
2. `index.js`-ə `export * from './Analytics'` sətrini əlavə et.
3. İstənilən yerdə `import { Analytics } from '@components'` ilə idxal et.

Qeyd: sırf təqdimat (presentational) UI primitivi yazırsansa, onu bu qovluqda deyil, `ui/` alt-qovluğunda yerləşdir.
