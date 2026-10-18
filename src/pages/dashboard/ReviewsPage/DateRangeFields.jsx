import { X } from 'lucide-react'
import { IconButton } from '@components'

const field =
  'h-8 rounded-lg border border-line bg-canvas px-2 text-xs text-ink outline-none transition-[border-color,box-shadow] focus:border-brand focus:shadow-focus'

/**
 * "Custom range" of the review Date filter: From / To day inputs (either may be empty — an
 * open-ended range) and a clear button that drops the custom range.
 * value: { from: 'YYYY-MM-DD' | '', to: 'YYYY-MM-DD' | '' }; onChange(value); onClear().
 */
export const DateRangeFields = ({ value, onChange, onClear }) => (
  <div className="inline-flex flex-wrap items-center gap-2 text-xs text-ink-muted">
    <label className="inline-flex items-center gap-1.5">
      From
      <input
        type="date"
        className={field}
        value={value.from}
        max={value.to || undefined}
        onChange={(e) => onChange({ ...value, from: e.target.value })}
      />
    </label>
    <label className="inline-flex items-center gap-1.5">
      to
      <input
        type="date"
        className={field}
        value={value.to}
        min={value.from || undefined}
        onChange={(e) => onChange({ ...value, to: e.target.value })}
      />
    </label>
    <IconButton icon={X} label="Clear date range" size="xs" onClick={onClear} />
  </div>
)
