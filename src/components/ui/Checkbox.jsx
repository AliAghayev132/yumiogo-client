import { clsx } from 'clsx'

export const Checkbox = ({
  label,
  checked,
  onChange,
  disabled = false,
  className,
  ...props
}) => {
  return (
    <label
      className={clsx(
        'flex items-center gap-2 cursor-pointer',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="h-4 w-4 shrink-0 rounded border-line accent-brand focus-visible:outline-2 focus-visible:outline-brand/40"
        {...props}
      />
      {label && <span className="text-sm text-ink">{label}</span>}
    </label>
  )
}
