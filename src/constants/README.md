# constants/

Small shared option lists (`import { roleOptions } from '@constants'`). Keep them in sync with the
server enums in `server/constants/shared/enums.js`.

Content an admin can change (cuisines, cities, report reasons, sort options, copy…) does NOT go
here — it comes from the server (`/api/catalog`, `/api/admin/meta`, Settings).
