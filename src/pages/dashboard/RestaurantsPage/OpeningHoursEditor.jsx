import { clsx } from 'clsx'
import { Copy, Eraser } from 'lucide-react'
import { Button, Checkbox } from '@components'
import { controlClasses } from '@components/ui/fieldStyles'
import {
  WEEK_DAYS,
  toHoursState,
  hasAnyHours,
  isMondaySet,
  copyMondayToAll,
  describeDay,
} from './openingHours'

/**
 * Weekly opening-hours editor (mon..sun): open / close times, a "Closed"
 * checkbox per day, plus "Copy Monday to all days" and "Clear hours".
 * `value` is the state from toHoursState(); onChange gets the next state.
 */
export const OpeningHoursEditor = ({ value, onChange, disabled = false }) => {
  const setDay = (day, patch) => onChange({ ...value, [day]: { ...value[day], ...patch } })

  return (
    <div>
      <div className="divide-y divide-line overflow-hidden rounded-lg border border-line">
        {WEEK_DAYS.map(({ key, label }) => {
          const day = value[key]
          const note = describeDay(day)
          return (
            <div key={key} className="flex flex-wrap items-center gap-3 bg-surface px-4 py-2">
              <span className="w-24 text-sm font-semibold text-ink">{label}</span>
              <input
                type="time"
                value={day.open}
                onChange={(e) => setDay(key, { open: e.target.value })}
                disabled={disabled || day.closed}
                aria-label={`${label} opening time`}
                className={clsx(controlClasses({ size: 'sm' }), 'w-[128px]')}
              />
              <span className="text-ink-disabled">–</span>
              <input
                type="time"
                value={day.close}
                onChange={(e) => setDay(key, { close: e.target.value })}
                disabled={disabled || day.closed}
                aria-label={`${label} closing time`}
                className={clsx(controlClasses({ size: 'sm' }), 'w-[128px]')}
              />
              <Checkbox
                label="Closed"
                checked={day.closed}
                onChange={(e) => setDay(key, { closed: e.target.checked })}
                disabled={disabled}
              />
              {note && (
                <span className={clsx('ml-auto text-xs', note === 'Needs both times' ? 'text-error' : 'text-ink-muted')}>
                  {note}
                </span>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onChange(copyMondayToAll(value))}
          disabled={disabled || !isMondaySet(value)}
          leftIcon={Copy}
        >
          Copy Monday to all days
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onChange(toHoursState({}))}
          disabled={disabled || !hasAnyHours(value)}
          leftIcon={Eraser}
        >
          Clear hours
        </Button>
      </div>
    </div>
  )
}
