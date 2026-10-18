# pages/

Route screens, one PascalCase folder per page (`UsersPage/UsersPage.jsx` + `index.js`), grouped:

- `dashboard/` — the admin panel: Dashboard, Analytics, Users (+ `UserDetailPage`), Restaurants
  (+ `RestaurantDetailPage` with its tabs, `ImportRestaurantsPage` for the bulk JSON import), Reviews, Reports, Settings, Broadcast, Taxonomy
  (Catalog types), Cities, App config, FAQs, Legal pages, Onboarding, Profile. Pages use the
  design system in `@components` (see its README) and the RTK Query hooks from `@store/api`.
- `public/` — landing (`HomePage`), `LegalPage`, the share landings (`ShareLanding/`), the admin
  sign-in (`LoginPage` with its `AuthCard` shell, `ForgotPasswordPage`) and `NotFoundPage`.

Each group's `index.js` re-exports its pages; routers import them from `@pages/dashboard` /
`@pages/public`. Page-local helpers (row actions, filter metadata, modals) live next to the page
in the same folder; anything shared goes to `components/`.

The dashboard shell sets the browser tab title from the sidebar item ("Users | Yumio"); a page
only renders its own `<SEO>` when it needs a different title.
