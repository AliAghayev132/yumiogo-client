import { clsx } from 'clsx'

export const Textarea = ({
  label,
  error,
  helperText,
  className,
  rows = 4,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      )}
      <textarea
        rows={rows}
        className={clsx(
          'w-full px-4 py-2.5 border rounded-lg transition-all outline-none resize-none',
          'focus:ring-2 focus:ring-green-500 focus:border-transparent',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300',
          className
        )}
        {...props}
      />
      {(error || helperText) && (
        <p className={clsx('mt-1.5 text-sm', error ? 'text-red-500' : 'text-gray-500')}>
          {error || helperText}
        </p>
      )}
    </div>
  )
}
