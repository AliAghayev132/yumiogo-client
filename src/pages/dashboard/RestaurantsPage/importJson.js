// Bulk restaurant import (ImportRestaurantsPage) — client-side JSON checks before the server
// validates the rows (POST /admin/restaurants/import with dryRun).

export const IMPORT_MODES = [
  { value: 'create', label: 'Create only', description: 'Every row becomes a new restaurant.' },
  {
    value: 'upsert',
    label: 'Create or update',
    description: 'Rows that match an existing restaurant update it; the rest are created.',
  },
]

export const TEMPLATE_FILENAME = 'yumio-restaurants-template.json'

// Result row action → badge (dry run: what will happen; real run: what happened).
export const IMPORT_ACTIONS = {
  create: { tone: 'success', planned: 'Create', done: 'Created' },
  update: { tone: 'info', planned: 'Update', done: 'Updated' },
  skip: { tone: 'neutral', planned: 'Skip', done: 'Skipped' },
  error: { tone: 'error', planned: 'Error', done: 'Failed' },
}

/** Line / column (1-based) of a character offset. */
const lineColumn = (text, offset) => {
  const before = text.slice(0, Math.max(0, offset))
  const lines = before.split('\n')
  return { line: lines.length, column: lines[lines.length - 1].length + 1 }
}

/**
 * JSON.parse error → { message, line?, column? }. Browsers word it differently:
 * V8 "… in JSON at position 42 (line 3 column 5)", Firefox "… at line 3 column 5 of the JSON
 * data", Safari has no position.
 */
const describeJsonError = (err, text) => {
  const raw = String(err?.message || 'Invalid JSON')
  const at = raw.match(/line (\d+) column (\d+)/i)
  const pos = raw.match(/position (\d+)/i)
  const where = at ? { line: Number(at[1]), column: Number(at[2]) } : pos ? lineColumn(text, Number(pos[1])) : {}
  const message = raw
    .replace(/^JSON\.parse:\s*/i, '')
    .replace(/^JSON Parse error:\s*/i, '')
    .replace(/\s*\(line \d+ column \d+\)/i, '')
    .replace(/\s+at line \d+ column \d+ of the JSON data/i, '')
    .replace(/\s+in JSON at position \d+/i, '')
  return { message: message.charAt(0).toUpperCase() + message.slice(1), ...where }
}

/**
 * Pasted / uploaded text → { restaurants } or { error: { message, line?, column? } }.
 * Accepts { "restaurants": [...] } or a bare array; every item must be an object.
 */
export const parseImportJson = (text) => {
  if (!String(text || '').trim()) return { error: { message: 'Paste JSON or drop a .json file.' } }
  let data
  try {
    data = JSON.parse(text)
  } catch (err) {
    return { error: describeJsonError(err, text) }
  }
  const list = Array.isArray(data) ? data : Array.isArray(data?.restaurants) ? data.restaurants : null
  if (!list) return { error: { message: 'Expected an array of restaurants, or an object with a "restaurants" array.' } }
  if (!list.length) return { error: { message: 'The "restaurants" list is empty.' } }
  const bad = list.findIndex((item) => !item || typeof item !== 'object' || Array.isArray(item))
  if (bad !== -1) return { error: { message: `Item #${bad + 1} is not an object.` } }
  return { restaurants: list }
}
