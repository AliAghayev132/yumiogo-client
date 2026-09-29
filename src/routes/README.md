# routes/

`AppRouter` owns the `BrowserRouter` and splits the app into two lazily loaded route groups, each
in its own chunk:

- `PublicRouter` (`/*`): landing `/`, `/login`, `/forgot-password` (`/register` redirects to
  `/login` — there is no public sign-up), `/legal/:slug`, the share landings (`/list/:slug`,
  `/restaurant/:idOrSlug`, `/invite/:code`, `/review/:id`) and the 404.
- `DashboardRouter` (`/dashboard/*`): every admin page inside `DashboardLayout`, guarded by
  `ProtectedRoute allowedRoles={['admin']}`. Detail routes: `users/:id`, `restaurants/:id`
  (`?tab=overview|general|hours|media|menu`), `catalog/:type` (unknown types fall back to
  cuisines), `content/*`, `profile`.

`index.js` exports only `AppRouter`; the two groups are imported lazily and must not be added to
the barrel (a static re-export would undo the code split).

Adding an admin page: create it under `pages/dashboard/`, export it from
`pages/dashboard/index.js`, add a `<Route>` here and a sidebar item (or an `EXTRA_TITLES` entry
for the header title) in `layouts/dashboard/navigation.js`.
