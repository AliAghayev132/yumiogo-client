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
        className="w-4 h-4 border-gray-300 text-green-600 focus:ring-green-500 focus:ring-offset-0"
        {...props}
      />
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  )
}

const RadioGroup = ({ children, label, className }) => (
  <div className={className}>
    {label && <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>}
    <div className="space-y-2">{children}</div>
  </div>
)

Radio.Group = RadioGroup
