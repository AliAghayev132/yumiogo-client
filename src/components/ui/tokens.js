/**
 * JS mirror of the Figma design tokens declared in App.css (@theme). Use the
 * Tailwind utilities (bg-primary, text-ink-muted, …) in markup; use these values
 * only where a raw colour is required (recharts fills/strokes, inline styles).
 */
export const colors = {
  primary: '#F97316',
  primaryHover: '#EA580C',
  brand: '#22C55E',
  brandHover: '#16A34A',
  mint: '#D3FAE1',
  mintLine: '#83EEAA',
  mintInk: '#114E26',

  ink: '#212121',
  inkSecondary: '#424242',
  inkTertiary: '#616161',
  inkMuted: '#757575',
  inkPlaceholder: '#9E9E9E',
  inkDisabled: '#BDBDBD',
  line: '#E0E0E0',
  subtle: '#F5F5F5',
  canvas: '#FAFAFA',
  surface: '#FFFFFF',
  axis: '#54555A',

  success: '#009951',
  successSoft: '#EBFFEE',
  warning: '#E5A000',
  warningSoft: '#FFFBEB',
  error: '#B3261E',
  danger: '#EC221F',
  dangerSoft: '#FEE9E7',
  info: '#3B82F6',
  infoSoft: '#EFF6FF',
  purple: '#6750A4',
  pink: '#FF2D55',
  star: '#FFCC00',
}

/**
 * Chart palettes from the Figma dashboards.
 * - `rating`: Reviews-by-rating donut (5★, 4★, 3★, 1–2★).
 * - `series`: Top cuisines bars / multi-series charts, in order.
 */
export const chartColors = {
  rating: ['#34C759', '#FFCC00', '#FF8D28', '#FF383C'],
  series: ['#22C55E', '#6750A4', '#F97316', '#FF2D55', '#757575', '#3B82F6', '#8979FF'],
  users: '#22C55E',
  reviews: '#6750A4',
  grid: '#F5F5F5',
  axis: '#54555A',
}

/**
 * Tones shared by IconTile, StatCard, Modal/ConfirmDialog headers and EmptyState:
 * `tile` = tile background, `icon` = glyph colour (all from the Figma frames).
 */
export const TONES = {
  green: { tile: 'bg-brand-soft', icon: 'text-brand' },
  success: { tile: 'bg-brand-soft', icon: 'text-brand' },
  blue: { tile: 'bg-info-soft', icon: 'text-info' },
  info: { tile: 'bg-info-soft', icon: 'text-info' },
  orange: { tile: 'bg-primary-soft', icon: 'text-primary' },
  primary: { tile: 'bg-primary-soft', icon: 'text-primary' },
  purple: { tile: 'bg-purple-soft', icon: 'text-purple' },
  red: { tile: 'bg-danger-soft', icon: 'text-danger' },
  danger: { tile: 'bg-danger-soft', icon: 'text-danger' },
  amber: { tile: 'bg-warning-soft', icon: 'text-warning' },
  warning: { tile: 'bg-warning-soft', icon: 'text-warning' },
  pink: { tile: 'bg-pink-soft', icon: 'text-pink' },
  neutral: { tile: 'bg-subtle', icon: 'text-ink-tertiary' },
}

export const toneClasses = (tone) => TONES[tone] || TONES.neutral

/**
 * Avatar tints from the Figma tables (fill / border / initials colour).
 * Picked deterministically per user (see Avatar).
 */
export const AVATAR_TINTS = [
  { bg: '#FFE0C8', border: '#FEC69B', text: '#522505' }, // orange
  { bg: '#EADDFF', border: '#D0BCFF', text: '#6750A4' }, // purple
  { bg: '#D3FAE1', border: '#83EEAA', text: '#114E26' }, // green
  { bg: '#E1EFFF', border: '#B0D5FF', text: '#0F3C70' }, // blue
]
