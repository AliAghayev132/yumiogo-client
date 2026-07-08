import { clsx } from 'clsx'

export const Input = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          className={clsx(
            'w-full px-4 py-2.5 border rounded-lg transition-all outline-none',
            'focus:ring-2 focus:ring-green-500 focus:border-transparent',
            'disabled:bg-gray-100 disabled:cursor-not-allowed',
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {(error || helperText) && (
        <p className={clsx('mt-1.5 text-sm', error ? 'text-red-500' : 'text-gray-500')}>
          {error || helperText}
        </p>
      )}
    </div>
  )
}
