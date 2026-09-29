import { clsx } from 'clsx'
import { Check } from 'lucide-react'
import { Field } from '@components'

/**
 * Multi-select chip grid for catalog lists (cuisines, dining, features, tags, dietary,
 * moods). `inactive` are values the restaurant already has that are no longer active in
 * the catalog: they stay listed (dashed) so they can be kept or removed.
 */
export const ChipMulti = ({ label, options, value, onToggle, inactive = [], emptyText, helperText, disabled = false }) => (
  <Field label={label} helperText={helperText}>
    {options.length ? (
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value.includes(opt)
          const retired = inactive.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              disabled={disabled}
              title={retired ? 'Inactive in the catalog' : undefined}
              aria-pressed={active}
              className={clsx(
                'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors',
                'outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-50',
                retired && 'border-dashed',
                active
                  ? 'border-brand bg-brand-soft text-brand-hover'
                  : 'border-line bg-canvas text-ink-secondary hover:border-ink-disabled hover:bg-subtle'
              )}
            >
              {active && <Check className="h-3.5 w-3.5" />}
              {opt}
            </button>
          )
        })}
      </div>
    ) : (
      <p className="text-sm text-ink-muted">{emptyText}</p>
    )}
  </Field>
)
