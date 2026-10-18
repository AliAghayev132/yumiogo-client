# store/api/

`baseApi.js` creates the only RTK Query instance: base URL from `@utils/apiOrigin`, the access
token in `Authorization`, and the reauth wrapper — one refresh at a time (the server rotates
refresh tokens, so a replayed one would sign the account out everywhere), tokens shared between
browser tabs through `localStorage`, sign-out only when the server rejects the refresh. A 403 from
an `/admin` endpoint invalidates the `Auth` tag so the shell re-checks the session.
Every request also carries `X-Content-Mode: raw` and `Accept-Language: en`: the server then
returns content with its English fields and the `translations: { az, ru }` object instead of
localizing it (public routes such as `PUT /restaurants/:id` and `/catalog` included), and keeps
its messages in English.

Review labels: `/admin/review-labels` saves the English fields, the group and the az / ru
`translations` (`createReviewLabel` / `updateReviewLabel` send them in one request).

Feature files inject endpoints into it and export their hooks; `index.js` re-exports everything
(`import { useGetUsersQuery } from '@store/api'`):

| File | Area |
|---|---|
| `authApi.js` | login, logout (device scope), `/auth/me` (unwrapped to the user), profile, avatar, change / forgot / reset password, `/auth/config` |
| `adminStatsApi.js` | dashboard stats, analytics |
| `adminUsersApi.js` | users list/detail/create, warn, ban, suspend, restore, approve, verify, role, delete, CSV |
| `adminRestaurantsApi.js` | restaurants list/detail, create/update, moderation, trash + permanent delete, CSV, place lookup, bulk JSON import (template + dry run / real run) |
| `adminMenuApi.js` | menu categories, dishes, menu photos |
| `adminReviewsApi.js` | review moderation, comments, recalculation, review labels + label requests |
| `adminReportsApi.js` | reports queue, resolve / dismiss / delete, CSV |
| `adminSettingsApi.js` | Settings, demo data, broadcast |
| `adminTranslateApi.js` | AI translation: `/admin/translate/status` and `POST /admin/translate` (used by `TranslateButton`) |
| `adminApi.js` | `/admin/meta` (form option lists) and image uploads |
| `catalogApi.js` | Catalog + Content admin CRUD, and the public catalog / FAQs / stats / legal pages / showcase restaurants |
| `csvRequest.js` | helpers for the CSV export endpoints |

Tags (`baseApi.tagTypes`) drive cache refreshes; list endpoints provide `{ type, id: 'LIST' }`
and mutations invalidate what they change (and `AdminStats` for the counters).
