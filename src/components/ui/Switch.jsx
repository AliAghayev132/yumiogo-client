import { useId } from 'react'
import { clsx } from 'clsx'

/**
 * Switch — Figma switch: 40x24 track (#22C55E on / #E0E0E0 off), 16px white handle.
 * onChange(nextChecked); `label` is the accessible name (and tooltip) when there is no
 * visible text. size: md (Figma 40x24) | sm (32x20). tone: green (default) | orange.
 */
export const Switch = ({ checked, onChange, disabled = false, label, size = 'md', tone = 'green', id, ...aria }) => {
  const small = size === 'sm'
  const tones = { green: 'bg-brand', orange: 'bg-primary' }

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={!!checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={clsx(
        'relative inline-flex shrink-0 items-center rounded-full transition-colors outline-none',
        'focus-visible:ring-4 focus-visible:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-50',
        small ? 'h-5 w-8' : 'h-6 w-10',
        checked ? tones[tone] || tones.green : 'bg-line'
      )}
      {...aria}
    >
      <span
        className={clsx(
          'absolute rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.2)] transition-[left]',
          small ? 'h-3.5 w-3.5' : 'h-4 w-4',
          checked ? (small ? 'left-[15px]' : 'left-5') : small ? 'left-[3px]' : 'left-1'
        )}
      />
    </button>
  )
}

/**
 * SwitchRow — Figma settings row (Moderation settings): label (DM Sans 500 14 #212121) +
 * description (DM Sans 400 12 #616161, or red with `danger`, e.g. "Platform goes offline")
 * and a trailing Switch. Props: label, description, checked, onChange, disabled, danger.
 */
export const SwitchRow = ({ label, description, checked, onChange, disabled, danger = false, className }) => {
  const id = useId()
  return (
    <div className={clsx('flex items-center gap-2 rounded-sm p-3', className)}>
      <label htmlFor={id} className={clsx('min-w-0 flex-1', !disabled && 'cursor-pointer')}>
        <span className="block text-sm font-medium leading-5 text-ink">{label}</span>
        {description && (
          <span className={clsx('block text-xs leading-4', danger ? 'text-danger' : 'text-ink-tertiary')}>
            {description}
          </span>
        )}
      </label>
      <Switch id={id} checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  )
}
