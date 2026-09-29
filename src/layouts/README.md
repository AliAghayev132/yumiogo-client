# layouts/

Route shells that render nested routes through `<Outlet/>`.

- `DashboardLayout` — the admin shell from the Figma frames: white 236px sidebar
  (`dashboard/Sidebar.jsx`), white 56px header with the page title, search box and notifications
  bell (`dashboard/Header.jsx`), and the page inside a `#FAFAFA` panel with a 36px top-left radius
  that scrolls on its own. It mounts `FeedbackProvider` (`useBanner` / `useConfirm`) and the header
  search context (`useHeaderSearch`), renders the page banner outlet, polls `/admin/stats` for the
  sidebar counters and turns the sidebar into a drawer below `lg`.
- `dashboard/navigation.js` — sidebar sections (Overview, Management, Catalog, Content, System),
  header titles (`pageTitleFor`) and counter mapping (`navBadges`). Add new admin routes here.
- The shell also sets the tab title per page, re-checks the session (`useSessionCheck`), listens
  to the admin socket events (`useAdminLiveUpdates`) and logs out this browser only.
- Public pages (landing, legal, share landings, sign-in) render their own chrome; there is no
  public layout.

Layouts are PascalCase `.jsx` files with named exports, re-exported from `index.js` and used as
parent `<Route element={…}>` in `routes/`. See `components/README.md` for the design system.
