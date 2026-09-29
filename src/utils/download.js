/**
 * Save text (e.g. a CSV export fetched through RTK Query) as a file download.
 * CSV gets a UTF-8 BOM so Excel shows Azerbaijani letters correctly.
 *
 * @param {string} text
 * @param {string} filename - e.g. "yumio-users-2026-09-29.csv"
 * @param {string} [type] - MIME type (default text/csv)
 */
export const saveTextFile = (text, filename, type = 'text/csv;charset=utf-8') => {
  const bom = String.fromCharCode(0xfeff)
  const body = type.startsWith('text/csv') && !String(text).startsWith(bom) ? `${bom}${text}` : String(text)
  const url = URL.createObjectURL(new Blob([body], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** "yumio-users" → "yumio-users-2026-09-29.csv" (local date). */
export const datedFilename = (base, ext = 'csv') => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${base}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.${ext}`
}
