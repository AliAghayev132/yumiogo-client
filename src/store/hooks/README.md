# store/hooks/

- `useSessionCheck({ onDenied })` — re-validates the stored session with GET /auth/me (mount,
  window focus, after an admin 403) and copies name / photo / role changes into the auth slice;
  calls `onDenied` when the account is no longer an admin. Used by `DashboardLayout`.
- `useAdminLiveUpdates({ onSignedOut })` — socket listeners that refresh the sidebar counters, the
  bell and the affected lists on `admin:alert` / `notification:new`, the settings on
  `app:maintenance`, and sign out on `account:status` (suspended / banned).
- `useSentiments()` — review sentiments (label, emoji, colour) from Settings, with
  `DEFAULT_SENTIMENTS` / `mergeSentiments` as fallbacks.
- `useRatingDisplay()` — `{ minReviewsForPercent }` from Settings.ratingDisplay (default
  `DEFAULT_MIN_REVIEWS_FOR_PERCENT` = 10): below it a restaurant shows "New" instead of its
  liked %.

Hooks are named `useXxx.js`, export `useXxx` (and a default) and are re-exported from `index.js`.
