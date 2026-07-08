# pages/

## Məqsəd
Bu qovluq tətbiqin route-a bağlı ekranlarını (səhifələrini) saxlayır. Qovluğun özündə birbaşa yalnız `index.js` faylı var — o, giriş nöqtəsidir; səhifələr isə iki qrup alt-qovluğuna bölünür: `public/` (autentifikasiya tələb etməyən səhifələr — `HomePage`, `LoginPage`, `RegisterPage`, `NotFoundPage`) və `dashboard/` (autentifikasiyalı panel səhifələri — `DashboardPage`, `PostsPage`, `ProfilePage`). Kök `index.js` `export * from './public'` və `export * from './dashboard'` ilə hər iki qrupu birləşdirir.

## Adlandırma / yazılış konvensiyası
Hər səhifə öz PascalCase qovluğunda yaşayır (məs. `public/HomePage/`), içində PascalCase `.jsx` komponenti (`HomePage.jsx`) və qovluğu bağlayan kiçik `index.js` barrel-ı olur. Qrupun `index.js`-i (məs. `pages/public/index.js`) bütün səhifələri yenidən ixrac edir. Səhifələr `export const` ilə adlı ixrac verir və `@pages/public` və ya `@pages/dashboard` alias-ları ilə idxal olunur (bax `routes/PublicRouter.jsx`).

## Nümunə
`pages/public/HomePage/HomePage.jsx`:
```jsx
import { SEO } from '@components'

export const HomePage = () => (
  <>
    <SEO title="Home" path="/" />
    <section>{/* hero + features */}</section>
  </>
)
```
`HomePage/index.js` -> `export { HomePage } from './HomePage'`, qrup `public/index.js` -> `export { HomePage } from './HomePage'`. Route-da isə: `import { HomePage } from '@pages/public'`.

## Yeni fayl necə əlavə olunur
1. Uyğun qrupda qovluq yarat (məs. `pages/public/AboutPage/`).
2. İçində `AboutPage.jsx` yarat və `export const AboutPage = () => { ... }` yaz.
3. `AboutPage/index.js`-ə `export { AboutPage } from './AboutPage'` əlavə et.
4. Qrupun `index.js`-inə (`pages/public/index.js`) `export { AboutPage } from './AboutPage'` əlavə et.
5. Uyğun router-də `import { AboutPage } from '@pages/public'` idxal edib `<Route>` təyin et.
