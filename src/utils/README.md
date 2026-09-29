# utils/

Pure helpers, re-exported from `index.js` (`import { getImageUrl } from '@utils'`):

- `apiOrigin.js` — `API_ORIGIN` / `API_BASE_URL`: the one place that decides where the API is
  (same origin by default; `VITE_API_URL` overrides). Used by RTK Query, image URLs and Socket.IO.
- `imageHandle.js` — `getImageUrl(path)` (server-relative upload path → URL; http/blob/data URLs
  pass through), `getImageUrlFor(folder, file)`, `uploadPaths` (mirrors
  `server/constants/shared/paths.js`), `createFileFormData`.
- `formatDate.js` — date formatting on top of `date-fns` (the admin UI uses the Figma helpers
  `timeAgo`, `relativeDay`, `monthYear` from `@components`).
- `download.js` — `saveTextFile(text, filename)` for the CSV exports (adds a BOM for Excel).
- `color.js` — colour helpers for catalog items.

Helpers here must not depend on React or Redux.
