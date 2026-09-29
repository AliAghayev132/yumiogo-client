/**
 * Legal page section markup — the same rules as the app's Legal screen
 * (mobile screens/profile/LegalScreen.js), blank line = new block:
 *   any text            paragraph
 *   > note              orange note box
 *   | Type | Purpose |  table rows ("|---|" separator lines are skipped; first row = header)
 *   [Label](https://…)  a block of links only → buttons (App Store / Google Play → store badges)
 * A section flagged `highlight` without "> " lines shows its last paragraph as the note box.
 */
const LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g
const ONLY_LINKS = /^(\s*\[[^\]]+\]\(https?:\/\/[^)\s]+\)\s*)+$/

export const parseLegalBody = (body = '', highlight = false) => {
  const blocks = []
  String(body)
    .replace(/\r\n|\u2028|\u2029/g, '\n')
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .forEach((chunk) => {
      const lines = chunk.split('\n').map((l) => l.trim())
      if (lines.every((l) => l.startsWith('|'))) {
        const rows = lines
          .filter((l) => !/^\|[\s:|-]+\|?$/.test(l))
          .map((l) =>
            l
              .replace(/^\|/, '')
              .replace(/\|$/, '')
              .split('|')
              .map((c) => c.trim())
          )
        if (rows.length) blocks.push({ type: 'table', header: rows[0], rows: rows.slice(1) })
      } else if (lines.every((l) => l.startsWith('>'))) {
        blocks.push({ type: 'note', text: lines.map((l) => l.replace(/^>\s?/, '')).join('\n') })
      } else if (ONLY_LINKS.test(chunk)) {
        blocks.push({ type: 'links', links: [...chunk.matchAll(LINK)].map((m) => ({ label: m[1], url: m[2] })) })
      } else {
        blocks.push({ type: 'text', text: chunk })
      }
    })
  if (highlight && !blocks.some((b) => b.type === 'note')) {
    const lastText = [...blocks].reverse().find((b) => b.type === 'text')
    if (lastText) lastText.type = 'note'
  }
  return blocks
}

/** "apple" | "google" for store listing URLs, else null. */
export const storeOf = (url) => {
  if (/apps\.apple\.com|itunes\.apple\.com/i.test(url)) return 'apple'
  if (/play\.google\.com/i.test(url)) return 'google'
  return null
}
