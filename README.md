# Yumio admin web

The Yumio admin panel and the public website, one Vite + React 19 single-page app:

- **Admin panel** (`/dashboard/*`, admins only) — built from the Figma "Admin Panel" frames:
  Dashboard, Analytics, Users (+ user profile), Restaurants (+ restaurant editor with menu,
  hours, media and a map picker), Reviews and Reports moderation, the Catalog (cuisines,
  features, tags, dietary, dining options, moods, report reasons, review labels, cities), the
  Content pages (App config & Home, FAQ, legal pages, onboarding), Settings, Broadcast and the
  signed-in admin's Profile.
- **Public site** — the landing page (`/`, fed by live stats, cuisines, FAQs and top-rated
  restaurants), legal pages (`/legal/:slug`), the landing pages of links shared from the app
  (`/list/:slug`, `/restaurant/:idOrSlug`, `/invite/:code`, `/review/:id`), the admin sign-in
  (`/login`, `/forgot-password`) and a 404.

Everything content-like is admin-managed on the server (`/api/catalog`, `/api/content/*`,
Settings); the app holds no copies of it.

## Run

```bash
npm install
npm run dev       # Vite on http://localhost:5173, proxies /api, /uploads, /socket.io
npm run build     # production build → dist/ (served by the API server / nginx)
npm run preview   # serve the build locally
npm run lint      # eslint .
```

The dev server proxies the API paths to `http://localhost:3042`; point it at another local
server with `API_PROXY_TARGET=http://localhost:<port> npm run dev`.

## Environment (`.env`, see `.env.example`)

| Variable | Default | Meaning |
|---|---|---|
| `VITE_API_URL` | empty | Origin of the API. Empty = the site's own origin (nginx in production, the Vite proxy in dev). Set it only to call an API on another origin directly (it must allow CORS). |
| `VITE_SITE_URL` | the page origin | Canonical / Open Graph URL used by `<SEO>`. |

All API, image and socket URLs come from `src/utils/apiOrigin.js`.

## Structure

```
src/
  App.jsx, main.jsx, App.css   providers (Helmet, Redux, Socket) + Tailwind @theme tokens
  components/                  design system (ui/), feedback (useBanner/useConfirm), shell
                               (logo, header search, bell, user menu), catalog helpers,
                               SEO, ProtectedRoute — documented in components/README.md
  layouts/                     DashboardLayout (sidebar + header + content panel)
  pages/dashboard/             one folder per admin page
  pages/public/                landing, legal, share landings, login, forgot password, 404
  routes/                      AppRouter → PublicRouter + DashboardRouter (lazy chunks)
  store/                       RTK Query (api/), auth slice, socket context, hooks
  utils/                       API origin, image URLs, dates, CSV download, colours
```

Aliases (`vite.config.js` + `jsconfig.json`): `@`, `@components`, `@pages`, `@routes`, `@store`,
`@layouts`, `@constants`, `@utils`.

## Conventions

- UI is composed from `@components` and the Tailwind tokens in `App.css` — see
  `src/components/README.md` (theme, Figma recipes for every confirm dialog and snackbar,
  rules for new pages).
- Server calls live in `store/api/*Api.js` (`baseApi.injectEndpoints`); pages never call `fetch`.
- UI copy is English, sentence case, as in the Figma.
- Sessions: only admins can sign in; the shell re-checks `GET /auth/me`, listens to the admin
  socket events and signs the session out when it loses admin rights. Log out ends this browser's
  session only. There is no public sign-up — admins are added under Users → Add user.

## Deploy

`.github/workflows/deploy.yml` builds on the VPS on every push to `main`; the API server
(`server/`) serves `dist/`. `vercel.json` (unused by the VPS deploy) rewrites every path except
`/api`, `/uploads` and `/socket.io` to the SPA.
