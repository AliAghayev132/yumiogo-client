/**
 * "#22C55E" → "rgba(34, 197, 94, 0.15)" for soft badge backgrounds.
 * @param {string} hex - #RGB, #RRGGBB or #RRGGBBAA (the alpha pair is ignored)
 * @param {number} alpha
 * @returns {string|undefined} undefined when `hex` is not a hex colour
 */
export const tint = (hex, alpha) => {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})(?:[0-9a-f]{2})?$/i.exec(hex || '')
  if (!match) return undefined
  const full = match[1].length === 3 ? [...match[1]].map((c) => c + c).join('') : match[1]
  const n = parseInt(full, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}
