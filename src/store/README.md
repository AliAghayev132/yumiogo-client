# store/

Redux Toolkit store (`index.js`): the RTK Query cache (`api/`) and the persisted `auth` slice
(`slices/authSlice.js`). `setupListeners` is enabled so queries can opt into `refetchOnFocus`.

- `api/` — every server call (`baseApi` + one `*Api.js` file per area), see `api/README.md`.
- `slices/` — `authSlice`: user, access/refresh tokens and role, mirrored to `localStorage`.
- `context/` — `SocketProvider` / `useSocket`: the signed-in admin's Socket.IO connection.
- `hooks/` — `useSessionCheck`, `useAdminLiveUpdates`, `useSentiments`.
