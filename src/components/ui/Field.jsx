import { clsx } from 'clsx'

/**
 * Label + control + helper/error wrapper shared by Input, Textarea and Select.
 * Figma "Text field": label DM Sans 400 14/18 #616161, 8px gap, error text below.
 */
export const Field = ({ label, htmlFor, error, helperText, required, className, children, labelAction }) => (
  <div className={clsx('w-full', className)}>
    {(label || labelAction) && (
      <div className="mb-2 flex items-center justify-between gap-2">
        {label && (
          <label htmlFor={htmlFor} className="block text-sm leading-[18px] text-ink-tertiary">
            {label}
            {required && <span className="ml-0.5 text-danger">*</span>}
          </label>
        )}
        {labelAction}
      </div>
    )}
    {children}
    {(error || helperText) && (
      <p className={clsx('mt-1.5 text-xs leading-4', error ? 'text-error' : 'text-ink-muted')}>
        {error || helperText}
      </p>
    )}
  </div>
)
