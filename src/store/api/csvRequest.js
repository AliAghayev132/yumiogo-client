/**
 * fetchBaseQuery args for the admin CSV export endpoints (GET …/export).
 * The body is read as text on success; on an error status the JSON envelope is parsed so
 * `err.data.message` works as for every other endpoint. The result stays serialisable
 * ({ csv, filename }) — save it with utils/saveTextFile.
 *
 *   exportUsers: builder.mutation({ query: (params) => csvRequest('/admin/users/export', params),
 *                                   transformResponse: csvResponse('yumio-users') })
 */
export const csvRequest = (url, params) => ({
  url,
  params,
  cache: 'no-store',
  responseHandler: (response) =>
    response.ok ? response.text() : response.json().catch(() => ({ message: response.statusText })),
})

const pad = (n) => String(n).padStart(2, '0')

// Content-Disposition is not exposed cross-origin in development, so fall back to the
// server's naming scheme ("yumio-users-2026-09-29.csv").
export const csvResponse = (base) => (csv, meta) => {
  const header = meta?.response?.headers?.get?.('Content-Disposition') || ''
  const match = /filename="?([^";]+)"?/i.exec(header)
  const d = new Date()
  const fallback = `${base}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.csv`
  return { csv: String(csv ?? ''), filename: match?.[1] || fallback }
}
