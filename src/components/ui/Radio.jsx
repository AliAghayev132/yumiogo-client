import { clsx } from 'clsx'

export const Radio = ({
  label,
  checked,
  onChange,
  disabled = false,
  name,
  value,
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
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="h-4 w-4 shrink-0 border-line accent-brand focus-visible:outline-2 focus-visible:outline-brand/40"
        {...props}
      />
      {label && <span className="text-sm text-ink">{label}</span>}
    </label>
  )
}

const RadioGroup = ({ children, label, className }) => (
  <div className={className}>
    {label && <p className="mb-2 text-sm leading-[18px] text-ink-tertiary">{label}</p>}
    <div className="space-y-2">{children}</div>
  </div>
)

Radio.Group = RadioGroup
