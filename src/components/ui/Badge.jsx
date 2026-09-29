import { clsx } from 'clsx'
import { statusMeta } from './status'

// Figma "Badges" (1282:22975…): rounded-full pill, padding 2/6, DM Sans 500 10/12.
const TONES = {
  neutral: 'bg-subtle text-ink-tertiary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  error: 'bg-error-soft text-error',
  info: 'bg-info-soft text-info',
  purple: 'bg-purple-soft text-purple',
  pink: 'bg-pink-soft text-pink',
  orange: 'bg-primary-soft text-primary',
  brand: 'bg-brand text-canvas',
}
// Legacy variant names used before the Figma tones.
const ALIASES = { default: 'neutral', primary: 'success', danger: 'error' }

const SIZES = {
  sm: 'px-1.5 py-0.5 text-[10px] leading-3',
  md: 'px-2 py-0.5 text-xs leading-4',
  lg: 'px-2.5 py-1 text-sm leading-4',
}

/**
 * Badge — coloured pill.
 * tone (or legacy `variant`): neutral | success | warning | error | info | purple | pink |
 * orange | brand (aliases: default, primary, danger). size: sm (Figma 10px) | md | lg.
 */
export const Badge = ({ children, tone, variant = 'default', size = 'md', icon: Icon, className, title }) => {
  const key = tone || ALIASES[variant] || variant
  return (
    <span
      title={title}
      className={clsx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full align-middle font-medium',
        TONES[key] || TONES.neutral,
        SIZES[size] || SIZES.md,
        className
      )}
    >
      {Icon && <Icon className="h-3 w-3 shrink-0" />}
      {children}
    </span>
  )
}

/**
 * StatusPill — Badge with the Figma status colours and capitalised label.
 *   <StatusPill status={user.status} />                   // active → green "Active"
 *   <StatusPill status={r.status} entity="restaurant" />  // closed → red "Suspended"
 *   <StatusPill status={report.targetType} entity="reportType" />
 * entity: user | restaurant | review | report | reportType. `label` / `tone` override.
 */
export const StatusPill = ({ status, entity, label, tone, size = 'sm', className }) => {
  const meta = statusMeta(status, entity)
  return (
    <Badge tone={tone || meta.tone} size={size} className={className}>
      {label ?? meta.label}
    </Badge>
  )
}

/**
 * CountBadge — Figma sidebar trailing counter (green #22C55E pill, DM Sans 500 10 #FAFAFA).
 * Hidden when count is 0 unless `showZero`. `max` caps the label (99+).
 */
export const CountBadge = ({ count = 0, max = 99, tone = 'brand', showZero = false, className }) => {
  if (!showZero && !(count > 0)) return null
  return (
    <span
      className={clsx(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-medium leading-3',
        tone === 'danger' ? 'bg-danger text-canvas' : tone === 'neutral' ? 'bg-subtle text-ink-tertiary' : 'bg-brand text-canvas',
        className
      )}
    >
      {count > max ? `${max}+` : count}
    </span>
  )
}

/** Dot — 6px unread / status dot (Figma bell badge: #22C55E). */
export const Dot = ({ tone = 'brand', className }) => (
  <span
    aria-hidden="true"
    className={clsx(
      'inline-block h-1.5 w-1.5 rounded-full',
      tone === 'danger' ? 'bg-danger' : tone === 'warning' ? 'bg-warning' : 'bg-brand',
      className
    )}
  />
)
