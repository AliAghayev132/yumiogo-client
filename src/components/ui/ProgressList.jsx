import { clsx } from 'clsx'
import { chartColors } from './tokens'

/**
 * ProgressList — Figma "Top cuisines" rows: label (DM Sans 500 12 #212121) with the share on
 * the right, over a 4px #E0E0E0 track with a coloured fill.
 *   <ProgressList items={[{ label: 'Japanese', value: 28 }, …]} />         // values are %
 *   <ProgressList items={rows} total={sum} format={(v, pct) => `${pct}%`} /> // raw counts
 * Colours default to chartColors.series (green, purple, orange, pink, grey…); per-item `color`.
 */
export const ProgressList = ({ items = [], total, format, className }) => {
  const sum = total ?? null
  return (
    <ul className={clsx('flex flex-col gap-5', className)}>
      {items.map((item, i) => {
        const pct = sum ? (sum > 0 ? Math.round((item.value / sum) * 100) : 0) : Math.round(item.value)
        const color = item.color || chartColors.series[i % chartColors.series.length]
        return (
          <li key={item.key || item.label}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-xs font-medium leading-4 text-ink">
              <span className="truncate">{item.label}</span>
              <span className="shrink-0">{format ? format(item.value, pct) : `${pct}%`}</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: color }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
