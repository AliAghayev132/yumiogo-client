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
        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-offset-0"
        {...props}
      />
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  )
}
