# store/slices/

`authSlice.js` — `{ user, accessToken, refreshToken, isAuthenticated, role }`, mirrored to
`localStorage` ("auth") so a reload keeps the session and other tabs can pick up rotated tokens.

Actions: `setCredentials({ user, tokens })` after login, `setTokens(tokens)` after a refresh or a
password change, `updateUser(partial)` after profile / avatar changes (and from
`useSessionCheck`), `logout()`.

Server data belongs in RTK Query (`store/api`), not in slices.
