/**
 * Human-readable message from an RTK Query / fetch / JS error:
 * server envelope `{ success:false, message }` → message, otherwise a fallback.
 *   banner.error(errorMessage(err, 'Delete failed'))
 */
export const errorMessage = (err, fallback = 'Something went wrong') =>
  err?.data?.message || (typeof err?.error === 'string' ? err.error : '') || err?.message || fallback
