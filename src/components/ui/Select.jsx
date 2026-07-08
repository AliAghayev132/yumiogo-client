import { clsx } from 'clsx'
import { ChevronDown } from 'lucide-react'

export const Select = ({
  label,
  error,
  helperText,
  options = [],
  placeholder = 'Select an option',
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      )}
      <div className="relative">
        <select
          className={clsx(
            'w-full px-4 py-2.5 border rounded-lg transition-all outline-none appearance-none bg-white',
            'focus:ring-2 focus:ring-green-500 focus:border-transparent',
            'disabled:bg-gray-100 disabled:cursor-not-allowed',
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300',
            className
          )}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>
      {(error || helperText) && (
        <p className={clsx('mt-1.5 text-sm', error ? 'text-red-500' : 'text-gray-500')}>
          {error || helperText}
        </p>
      )}
    </div>
  )
}
