# components/ — Yumio admin design system

Everything here is built from the Figma **Admin Panel** file (`53snbT6bDrO6fk9eOyqaSh`): sidebar
`1264:23061`, stat_card `1270:22018`, chart_card `1274:8054`, Button `1286:24923`, tabbar_section
`1297:29939`, Component 1 (select) `1343:31813`, Theme (menu) `1343:32509`, the modalBox frames and
the snackbar states. Pages must be composed from these parts — do not restyle primitives inline.

```jsx
import { Button, TableCard, Table, useBanner, useConfirm } from '@components'
```

Folders: `ui/` primitives · `feedback/` banners + confirm dialogs · `shell/` header/sidebar pieces
(logo, search, bell, user menu) · `catalog/` catalog-page helpers · `SEO`, `ProtectedRoute`.
The page shell itself is `layouts/DashboardLayout.jsx`.

---

## 1. Theme

Tokens live in `src/App.css` (`@theme`) and become Tailwind utilities. `ui/tokens.js` mirrors them
for JS (recharts, inline styles).

**Fonts** (loaded in `index.html` from Google Fonts)

| Utility | Font | Use for |
|---|---|---|
| `font-sans` (default) | DM Sans | all UI text |
| `font-display` | Plus Jakarta Sans | stat numbers, modal titles, avatar initials, row chips, pagination chips |
| `font-chart` | Inter | chart axis labels, chart/card subtitles, period tabs |

**Colours**

| Token (utility suffix) | Hex | Use |
|---|---|---|
| `primary` / `-hover` / `-soft` | #F97316 / #EA580C / 8% | main actions: + Add, Save changes, Send warning, Add & publish |
| `brand` / `-hover` / `-soft` | #22C55E / #16A34A / 8% | logo, active nav, count badges, switches, approve/restore/resolve buttons |
| `mint` / `mint-line` / `mint-ink` / `mint-deep` | #D3FAE1 / #83EEAA / #114E26 / #0A2914 | admin avatar, active page chip |
| `ink` | #212121 | primary text |
| `ink-secondary` | #424242 | modal body text |
| `ink-tertiary` | #616161 | field labels, sidebar section labels, setting descriptions |
| `ink-muted` | #757575 | table headers, subtitles, "Showing 1–11 of N", icons |
| `ink-placeholder` / `ink-disabled` | #9E9E9E / #BDBDBD | placeholders / timestamps |
| `line` | #E0E0E0 | borders and dividers |
| `subtle` | #F5F5F5 | table header row, hover |
| `canvas` | #FAFAFA | content panel, inputs, modals |
| `surface` | #FFFFFF | cards, sidebar, header |
| `success` / `success-soft` | #009951 / #EBFFEE | Active / Approved / Resolved pills, success snackbar |
| `warning` / `warning-soft` | #E5A000 / #FFFBEB | Pending / Suspended / In review, amber notices |
| `error` / `error-soft` | #B3261E / 10% | Banned / Flagged / Open pills, error snackbar |
| `danger` / `danger-hover` / `danger-soft` | #EC221F / #C81B18 / #FEE9E7 | destructive buttons, red icon tiles |
| `info` / `info-soft` | #3B82F6 / #EFF6FF | blue tiles, "Review" type pill |
| `purple` / `purple-soft` | #6750A4 / 10% | reviews tile |
| `pink` / `pink-soft` | #FF2D55 / 8% | saves tile |
| `star` | #FFCC00 | rating star |
| `chart-green/yellow/orange/red/violet` | #34C759 … | rating donut |

Radii/shadows: `rounded-modal` (28), `rounded-panel` (36), `shadow-menu`, `shadow-modal`,
`shadow-focus`. Layout: `w-sidebar` (236), `h-header` (56). Scrollbars: `scrollbar-thin`.

**Rules:** new code uses these tokens, never raw `gray-*`, `green-*` or hex values. Orange
(`primary`) is for add/create/submit; green (`success` variant) only for positive confirmations;
red (`danger`) for ban/remove/reject/delete. Copy is English and sentence case.

---

## 2. Shell (layouts/DashboardLayout)

White 236px sidebar + white 56px header; the page renders inside a `bg-canvas` panel with a 36px
top-left radius, 24px padding and its own scroll. Below `lg` the sidebar becomes a drawer.

- **Title** — from `layouts/dashboard/navigation.js` (`pageTitleFor(pathname)`); add new routes there
  (`NAV_SECTIONS`, or `EXTRA_TITLES` for routes not in the sidebar).
- **Sidebar sections** — Overview · Management · Catalog · Content · System. Counters come from
  `GET /admin/stats → data.stats`: Reports = `openReports`; Reviews = `reviewsToModerate`, else
  `pendingReviews + flaggedReviews`. Polled every 60 s.
- **Header search** — pages hook into the header box instead of rendering their own search input:
  ```jsx
  const search = useHeaderSearch({ placeholder: 'Search users' }) // debounced (300 ms) string
  const { data } = useGetUsersQuery({ page, search })
  ```
  The query resets when the page unmounts. Pages that do not call it get a "jump to page" search.
- **Notifications bell** — `shell/NotificationBell` (40px bordered button, green unread dot,
  dropdown feed with empty/loading/error states). Data comes from `shell/useAdminNotifications`.
- **User menu** — sidebar footer row (mint avatar, name, "Administrator"); click → Profile,
  Settings, Log out.
- **Page banners** — `<BannerOutlet page />` sits at the top of the panel (sticky while scrolling).

---

## 3. Feedback — `useBanner()` and `useConfirm()`

Never use `window.alert/confirm` or popups. Both hooks work anywhere under `DashboardLayout`.

### useBanner() — Figma inline snackbar

```jsx
const banner = useBanner()
banner.success('Restaurant added successfully')
banner.warning(`Warning sent to ${name}. Notification delivered.`)
banner.error(errorMessage(err, 'Delete failed'))      // errorMessage() reads err.data.message
banner.info('…', { title: 'Heads up', duration: 0, action: { label: 'Undo', onClick } })
banner.dismiss(id); banner.clear()
```
- Shows at the top of the page content — or inside the top-most open **Modal** while one is open
  (form errors appear next to the form). When that modal closes, its success/warning/info
  messages move to the page; its errors are dropped. So `banner.success(); onClose()` just works.
- Auto-hide: success/info 5 s, warning 7 s, error sticky (`duration` ms, 0 = sticky). Max 3 per
  outlet. Page banners older than 0.8 s are cleared on navigation.
- Figma tones: green `success` (saved / approved / resolved), amber `warning` (warned,
  maintenance on), red `error` (deleted — the Figma uses red for "Review #4821 deleted").

### useConfirm() — Figma modalBox confirmation (promise API)

```jsx
const confirm = useConfirm()
const ok = await confirm({
  tone: 'danger',                 // danger | success | warning | primary | info
  icon: Trash2,                   // optional; default per tone
  title: 'Delete Review #4821?',
  message: 'This review will be permanently deleted. The user will be notified with the reason.',
  notice: 'Restaurant rating will be recalculated after deletion.',   // amber inline notice
  confirmText: 'Delete review',
  cancelText: 'Cancel',
  confirmVariant: 'danger',       // optional override of the tone's button colour
  reasonField: {                  // optional text field
    label: 'Reason for deletion',
    placeholder: 'e.g. Violates community guidelines...',
    required: false, multiline: false, maxLength: 300,
  },
  onConfirm: async (reason) => deleteReview({ id, reason }).unwrap(),  // optional
})
if (!ok) return          // cancelled (Cancel / Esc / overlay) → false
ok.reason                // trimmed text ('' without a field)
ok.result                // value returned by onConfirm
banner.error(`Review #${n} deleted — user notified`)
```
With `onConfirm` the button spins until the promise settles; a rejection is shown inside the
dialog (`err.data.message`) and the dialog stays open. Without it the dialog closes at once and
the caller runs the mutation.

Tone → tile / button: `danger` red tile + red button · `success` green tile + green button ·
`warning` amber tile + **orange** button (Figma "Send warning", "Enable maintenance") ·
`primary` orange tile + orange button · `info` blue tile + orange button.

**Figma recipes** (lucide icon in brackets)

| Action | tone | icon | title / button | extra |
|---|---|---|---|---|
| Warn user | warning | AlertTriangle | "Issue a warning to {name}" / "Send warning" | reasonField "Reason for warning" (required), placeholder "e.g. Inappropriate review content..." |
| Ban user | danger | Ban | "Ban {name}?" / "Ban user" | notice "This action can be reversed later from the Users page.", reasonField "Reason for ban" |
| Restore user | success | RotateCcw | "Restore {name}?" / "Restore access" | message "This will reactivate their account. They will be notified and regain full access." |
| Remove restaurant (soft, to Trash) | danger | Trash2 | "Remove {name}?" / "Remove" | message "This restaurant will be removed from the platform and hidden from the app.", notice "It moves to Trash with its reviews. You can restore it from the Trash tab." — truthful copy: the listing is restorable, so the Figma "cannot be undone" text is not used here |
| Remove permanently (Trash only, hard delete) | danger | Trash2 | "Remove {name}?" / "Remove permanently" | the Figma modalBox 1334:28752 copy word for word: message "This restaurant will be permanently removed from the platform.", notice "This action cannot be undone. All linked reviews will be archived." (`DELETE /admin/restaurants/:id`, 409 unless the listing is in Trash) |
| Reject restaurant | danger | X | "Reject {name}?" / "Reject" | reasonField "Reason for rejection" |
| Approve restaurant | success | Check | "Approve {name}?" / "Approve & publish" | |
| Restore restaurant | success | RotateCcw | "Restore {name}?" / "Restore" | |
| Delete review | danger | Trash2 | "Delete Review #{n}?" / "Delete review" | notice about rating recalculation, reasonField "Reason for deletion" |
| Approve review | success | Check | "Approve Review #{n}?" / "Approve" | |
| Resolve report | success | Check | "Resolve Report #{n}?" / "Mark resolved" | reasonField "Resolution note (optional)" |
| Dismiss report | danger | X | "Dismiss Report #{n}?" / "Dismiss report" | |
| Maintenance on | warning | AlertTriangle | "Enable maintenance mode?" / "Enable maintenance" | notice "All active users will be logged out and see a maintenance screen." |

For non-confirm dialogs (quick profile, add forms) use `<Modal>` directly (below).

---

## 4. Components (`ui/`)

### Buttons — `Button`, `IconButton`, `ChipButton`
```jsx
<Button size="sm" leftIcon={Plus}>Add user</Button>                  // card header CTA (orange)
<Button size="sm" variant="outline">Export</Button>
<Button variant="outline" onClick={close}>Cancel</Button>            // modal (md, 40px)
<Button variant="success" loading={saving}>Approve & publish</Button>
<IconButton icon={Pencil} label="Edit" />                            // table action 40x32
<IconButton icon={Trash2} label="Delete" tone="danger" />            // dark, red on hover
<IconButton icon={Bell} label="Notifications" variant="secondary" size="md" />
<ChipButton tone="warning" onClick={warn}>Warn</ChipButton>          // row chips: View·Warn·Ban·Restore·Approve·Reject·Resolve
```
`Button` variants: `primary` (orange, default) · `success` · `danger` · `outline` · `secondary`
(#FAFAFA + border) · `ghost` · `soft-danger` · `soft-success` · `link` (legacy `warning` = primary).
Sizes: `xs` 28 · `sm` 32 (card headers) · `md` 40 (modals, default) · `lg` 48. Props: `leftIcon`,
`rightIcon` (component or element), `loading`, `fullWidth`; `type` defaults to `"button"`.
`ChipButton` tones only tint the hover (default/success/danger/warning).

### Modal
```jsx
<Modal isOpen={open} onClose={close} icon={Plus} tone="orange" title="Add new restaurant"
       description="Fill in the basic details. You can add photos and more info after publishing."
       footer={<><Button variant="outline" onClick={close}>Cancel</Button><Button onClick={save}>Add & publish</Button></>}>
  <div className="flex flex-col gap-3">{/* fields */}</div>
</Modal>
```
448px, radius 28, #FAFAFA, icon tile + 24px Plus Jakarta title, no header bar/X. Sizes `sm` 400 ·
`md` 448 · `lg` 640 · `xl` 896 · `full`. Tones: green, blue, orange, purple, red, amber, pink,
neutral. Esc / overlay close (`closeOnEsc`, `closeOnOverlay`), optional `showCloseButton`, focus
trap, stacked modals, body scroll lock. Prefer the `footer` prop (fixed under the scrolling body);
the legacy `<Modal.Footer>` child still works (hoisted when it is a direct child, otherwise it sits
at the end of the body — keep it inside your `<form>` so `type="submit"` works).

### ConfirmDialog
Declarative version of `useConfirm` (same props + `isOpen`, `onClose`, `onConfirm(reason)`,
`loading`, `error`, `children`). Use it only when the page must control the dialog itself.

### Banner
`<Banner tone="success|warning|error|info" title? onClose? action?>text</Banner>` — the snackbar
visual. Without `onClose` it is the amber notice used inside modals. Pages normally call
`useBanner()` instead; the public sign-in pages (Log in, Forgot password) render it inline.

### TableCard + Table + Pagination
```jsx
<TableCard
  title="All users"
  actions={<>
    <Button size="sm" variant="outline" onClick={exportCsv}>Export</Button>
    <FilterMenu filters={[{ key: 'status', label: 'Status', options: STATUS_OPTIONS }]}
                value={filters} onChange={(f) => { setFilters(f); setPage(1) }} />
    <Button size="sm" leftIcon={Plus} onClick={openAdd}>Add user</Button>
  </>}
  pagination={{ page, total: pagination.total, limit: 11, onPageChange: setPage }}
>
  <Table>
    <Table.Header>
      <Table.Row>
        <Table.Head>User</Table.Head> … <Table.Head align="right">Actions</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {isLoading ? <Table.Loading rows={8} cols={7} /> : users.map((u) => (
        <Table.Row key={u._id}>
          <Table.Cell><UserCell user={u} /></Table.Cell>
          <Table.Cell>{u.email}</Table.Cell>
          <Table.Cell><StatusPill status={u.status} entity="user" /></Table.Cell>
          <Table.Cell nowrap>{monthYear(u.createdAt)}</Table.Cell>
          <Table.Cell><Table.Actions><ChipButton>View</ChipButton>…</Table.Actions></Table.Cell>
        </Table.Row>
      ))}
      {!isLoading && !users.length && <Table.Empty colSpan={7} title="No users found" />}
    </Table.Body>
  </Table>
</TableCard>
```
- TableCard: header 72px (title DM Sans 700 14, optional `subtitle`, `actions` 16px apart,
  optional card-level `search`), dividers, optional `toolbar`, `pagination` or `footer`.
- Table: #F5F5F5 32px header with sentence-case 14px #757575 labels, 60px rows, no separators,
  hover tint. `Table.Cell` props: `muted`, `nowrap`, `align`, plus any `<td>` prop (`colSpan`).
  `Table.Actions` right-aligns row actions. `Table.Empty colSpan` / `Table.Loading rows cols`.
- Pagination: "Showing 1–11 of 24,831" + 22px page chips with ellipsis and chevrons; always
  visible (also for one page). Props `page`, `total`, `limit`, `pages?`, `onPageChange`,
  `itemLabel?`, `bordered`.

### StatCard, TrendPill, ChartCard, ProgressList, charts
```jsx
<StatCard icon={Users} tone="blue" value={stats.totalUsers} label="Total users" trend={stats.usersChange} />
<StatCard icon={CircleAlert} tone="red" value={stats.openReports} label="Pending reports" trend={stats.reportsChange} invertTrend />
<StatCard icon={Star} tone="orange" value={4.62} decimals={2} label="Avg platform rating" />
<ChartCard title="New users" subtitle={`Last ${days} days`} periods={['7d', '30d', '90d']} period={p} onPeriodChange={setP}>
  <ResponsiveContainer height={200}>
    <BarChart data={rows}><XAxis dataKey="day" {...chartAxisProps} /><CartesianGrid {...chartGridProps} />
      <Tooltip {...chartTooltipProps} /><Bar dataKey="count" fill={chartColors.users} radius={[6, 6, 0, 0]} /></BarChart>
  </ResponsiveContainer>
</ChartCard>
<ChartCard title="Top cuisines" subtitle="By review count"><ProgressList items={[{ label: 'Japanese', value: 28 }]} /></ChartCard>
<ChartCard title="Recent activity" divider loading={isLoading} empty={!rows.length && { title: 'No activity yet' }}>…</ChartCard>
```
StatCard tones per Figma: users `blue`, restaurants `orange`, reviews `purple`, reports `red`,
rating `orange`, saves `pink`. `trend` number → "+12%"; red when negative (or positive with
`invertTrend`). Legacy `title` / `change` / `changeType` still work. `loading` shows skeletons.
Chart presets (`ui/chart.js`): `chartAxisProps`, `chartGridProps`, `chartTooltipProps`,
`chartColors` (`rating` donut palette, `series`, `users`, `reviews`).

### Tabs
`<Tabs variant="period|pill|underline" items={['7d','30d']} value onChange />` — items may be
`{ value, label, count, icon, disabled }`; arrow-key navigation.

### Select, menus, filters
```jsx
<Select label="Category" value={cuisine} onValueChange={setCuisine} options={cuisineOptions} searchable />
<Select label="Status" name="status" value={form.status} onChange={handleChange} options={…} />  // event-style, drop-in for the old native select
<DropdownMenu trigger={<IconButton icon={MoreVertical} label="More" />}
              items={[{ label: 'Edit', icon: Pencil, onSelect }, { divider: true }, { label: 'Delete', icon: Trash2, tone: 'danger', onSelect }]} />
<FilterMenu filters={[{ key: 'status', label: 'Status', options: [...] }, { key: 'role', label: 'Role', options: ['user', 'admin'] }]} value={f} onChange={setF} />
```
Select = Figma Component 1: 48px #FAFAFA field, chevron, floating menu card (radius 12, menu
shadow) with a leading check on the selected option; keyboard support; `searchable`;
`clearable` (defaults on when a `placeholder` is given and the field is not `required`); `size`
md/sm; `leftIcon`. `CustomSelect` is a deprecated wrapper (value-based `onChange`).
`Popover` (portal, never clipped, flips above) and `Menu` / `MenuItem` / `MenuDivider` /
`MenuLabel` are the building blocks. FilterMenu applies immediately, shows the active count and a
"Clear filters" item. Like the Figma card-header buttons, Filter and Export are text-only (no icon);
only "+ Add …" carries the `Plus` icon.

### Forms
`Input`, `Textarea` (`showCount` + `maxLength`), `SearchInput` (header style, `onClear`), `Select`,
`Checkbox`, `Radio` (+ `Radio.Group`), `Switch` (40x24, green), `SwitchRow` (Settings row with
description, `danger` for red descriptions), `Field` (label/error wrapper for custom controls).
Fields: label DM Sans 14 #616161, 48px #FAFAFA control, #E0E0E0 border, radius 8, green focus,
red error text. `required` adds an asterisk. `UnsavedBar` floats Save/Discard for long forms.
Read-only values (Figma quick-profile modal): `<Input label="Reviews" value="142" readOnly />`
(`className="text-success"` for the green "Active" value).

### Display
- `Badge tone|variant size` — pills (`sm` = Figma 10px).
- `StatusPill status entity` — Figma colours + capitalised labels via `statusMeta()`:
  user (Active green, Suspended amber, Banned red), restaurant (`closed` → red "Suspended"),
  review (Approved / Pending / Flagged), report (Open red, In review amber, Resolved green,
  Dismissed grey), reportType (Review blue, User amber, Restaurant grey).
- `CountBadge count` (sidebar counter), `Dot` (unread dot).
- `Avatar` (photo or tinted initials; orange/purple/green/blue picked from the user id; sizes
  xs–xl) and `UserCell` (avatar + name + subtitle; `short` → "Leyla H.").
- `IconTile icon tone size` — the 40px tinted tile used by stat cards, modals, activity rows.
- `EmptyState icon title description action`, `Skeleton`, `SkeletonText`, `SkeletonTable`,
  `SkeletonStats`, `SkeletonChart`, `PageLoader`, `CountUp` (`decimals`).
- `Card` (white, radius 12, border, no shadow; `padding="chart"` = 18px) with `Card.Header`
  (`actions`, `divider`), `Card.Title`, `Card.Description`, `Card.Content`, `Card.Footer`.

### Helpers
`timeAgo(date)` → "2m ago" · `relativeDay(date)` → "Today / Yesterday / 2d ago" ·
`monthYear(date)` → "Jan 2025" · `formatNumber(n)` → "24,831" · `statusMeta(status, entity)` ·
`errorMessage(err, fallback)` · `toneClasses(tone)` · `colors`, `chartColors`, `AVATAR_TINTS`.

---

## 5. Icons (Figma Material → lucide)

dashboard → `LayoutDashboard` · insert_chart → `BarChart3` · people_alt → `Users` · store → `Store`
· reviews → `MessageSquareMore` · report → `CircleAlert` · settings → `Settings` · notifications →
`Bell` · search → `Search` · add → `Plus` · edit → `Pencil` · delete_outline → `Trash2` · block →
`Ban` · warning_amber → `AlertTriangle` · restart_alt → `RotateCcw` · done → `Check` · close → `X`
· star_outline → `Star` · bookmark_border → `Bookmark` · check_circle_outline → `CheckCircle2` ·
error_outline → `AlertCircle`. Size 20 in tiles/nav, 16 in buttons/actions.

---

## 6. Rules for page work (Wave B)

1. Lists: `TableCard` (title "All …", actions Export / Filter / + Add) → `Table` → `Pagination`
   footer. Search comes from `useHeaderSearch`, not a page input. Row actions are `ChipButton`s or
   `IconButton`s, status is a `StatusPill`, users are `UserCell`s. The "Actions" header sits at
   the start of its column (as in the Figma); the buttons below are right-aligned (`Table.Actions`).
2. Every create/update/delete/moderation action: confirm with `useConfirm()` where the Figma has a
   modalBox, then report the result with `useBanner()` using the Figma copy.
3. Stats/charts: `StatCard`, `ChartCard`, chart presets — no ad-hoc cards.
4. Forms in modals: `<Modal icon tone title description footer>` with `Input`/`Select`/`Textarea`
   stacked with `gap-3`; submit button orange (`primary`), Cancel `outline`.
5. Tokens only (section 1). No sweetalert2 (removed), no `window.alert/confirm`.
6. New shared UI goes into `ui/` (PascalCase file, named export, `ui/index.js` barrel) and is
   documented here. Files that export components must not export other values (Fast Refresh) —
   put helpers in a `.js` module.

## 7. Catalog helpers (`catalog/`)

`ImageField` (single image upload; errors via `useBanner`), `OrderButtons` + `moveItem` +
`useBatchedReorder` (reorder rows, batched PATCH), `TAXONOMY_TYPES` / `isTaxonomyType` (catalog
routes + sidebar; `plural` names the "All …" table title).

`IonIcon` / `ionToLucide(name)` — the app draws catalog and onboarding icons with Ionicons, which the
admin does not bundle; these map the Ionicons name ("people-outline") to the closest lucide glyph
for tables and previews (`null` → show the name). Extend the map in `catalog/ionIcon.js` when an
admin starts using a new icon name.

## 8. Session + live data

- `ProtectedRoute` sends signed-out visitors to `/login`, and any non-admin session to `/login`
  with the "No admin access" notice. The login page itself turns non-admin accounts away (and ends
  only the session it opened). There is no public sign-up: admins are added under Users → Add user;
  `/forgot-password` resets a password by e-mail code.
- The dashboard shell re-checks the session with GET /auth/me (`useSessionCheck`: on mount, on
  window focus and after any 403 from an admin endpoint) and keeps the sidebar name/photo in step.
- `useAdminLiveUpdates` listens on the socket (`admin:alert`, `notification:new`,
  `app:maintenance`, `account:status`) and invalidates the stats / list caches, so the sidebar
  counters and the bell update without waiting for the 60 s poll.
- Log out ends this browser's session only (`POST /auth/logout { refreshToken }`).
