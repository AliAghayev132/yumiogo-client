import { useRef } from 'react'
import { clsx } from 'clsx'

const normalise = (items) => items.map((i) => (typeof i === 'object' ? i : { value: i, label: String(i) }))

const VARIANTS = {
  // Figma chart_card period tabs (7d / 30d / 90d): Inter 12/16 #757575, padding 4/10.
  period: {
    list: 'inline-flex items-center',
    tab: 'h-6 rounded-md px-2.5 font-chart text-xs leading-4 tracking-[-0.02em]',
    active: 'bg-subtle font-medium text-ink',
    idle: 'text-ink-muted hover:text-ink',
  },
  // Segmented control (status filters inside cards).
  pill: {
    list: 'inline-flex items-center gap-1 rounded-lg bg-subtle p-1',
    tab: 'h-8 rounded-md px-3 text-sm font-medium',
    active: 'bg-surface text-ink shadow-sm',
    idle: 'text-ink-muted hover:text-ink',
  },
  // Underlined page tabs.
  underline: {
    list: 'flex items-center gap-6 border-b border-line',
    tab: '-mb-px h-10 border-b-2 text-sm font-medium',
    active: 'border-brand text-ink',
    idle: 'border-transparent text-ink-muted hover:text-ink',
  },
}

/**
 * Tabs — tab strip.
 *   <Tabs variant="period" items={['7d', '30d', '90d']} value={period} onChange={setPeriod} />
 *   <Tabs variant="underline" items={[{ value: 'open', label: 'Open', count: 5 }, …]} … />
 * variant: period (Figma chart-card tabs, default) | pill | underline.
 * Items: strings or { value, label, count, icon, disabled }. Arrow keys move between tabs.
 */
export const Tabs = ({ items = [], value, onChange, variant = 'period', className, ...aria }) => {
  const listRef = useRef(null)
  const v = VARIANTS[variant] || VARIANTS.period
  const tabs = normalise(items)
  const hasActive = tabs.some((t) => t.value === value)

  const onKeyDown = (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return
    const enabled = tabs.filter((t) => !t.disabled)
    const i = enabled.findIndex((t) => t.value === value)
    const next =
      e.key === 'Home'
        ? enabled[0]
        : e.key === 'End'
          ? enabled[enabled.length - 1]
          : enabled[(i + (e.key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length]
    if (!next) return
    e.preventDefault()
    onChange?.(next.value)
    listRef.current?.querySelector(`[data-value="${CSS.escape(String(next.value))}"]`)?.focus()
  }

  return (
    <div ref={listRef} role="tablist" className={clsx(v.list, className)} onKeyDown={onKeyDown} {...aria}>
      {tabs.map((t) => {
        const active = t.value === value
        const Icon = t.icon
        return (
          <button
            key={String(t.value)}
            type="button"
            role="tab"
            data-value={String(t.value)}
            aria-selected={active}
            tabIndex={active || (!hasActive && t === tabs[0]) ? 0 : -1}
            disabled={t.disabled}
            onClick={() => onChange?.(t.value)}
            className={clsx(
              'inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors outline-none',
              'focus-visible:ring-2 focus-visible:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-40',
              v.tab,
              active ? v.active : v.idle
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {t.label}
            {t.count != null && (
              <span
                className={clsx(
                  'rounded-full px-1.5 text-[10px] font-medium leading-4',
                  active ? 'bg-brand text-canvas' : 'bg-line/70 text-ink-tertiary'
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
