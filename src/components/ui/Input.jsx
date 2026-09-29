import { forwardRef, isValidElement, useId } from 'react'
import { clsx } from 'clsx'
import { Field } from './Field'
import { controlClasses } from './fieldStyles'

const renderAdornment = (node) => {
  if (!node) return null
  if (isValidElement(node)) return node
  const Icon = node
  return <Icon className="h-5 w-5" />
}

/**
 * Input — Figma text field (48px, #FAFAFA, #E0E0E0 border, radius 8, label 14px #616161).
 * Props: label, error, helperText, leftIcon, rightIcon (lucide component or element),
 * size (md 48px | sm 40px), required (adds * to the label), className (on the <input>),
 * containerClassName. All other props go to the <input>.
 */
export const Input = forwardRef(
  (
    { label, error, helperText, leftIcon, rightIcon, size = 'md', className, containerClassName, id, required, ...props },
    ref
  ) => {
    const autoId = useId()
    const inputId = id || autoId
    return (
      <Field
        label={label}
        htmlFor={inputId}
        error={error}
        helperText={helperText}
        required={required}
        className={containerClassName}
      >
        {/* Only positioned when it has adornments, so an icon a caller absolutely positions over
            the field (older pages do this) still paints above the input. */}
        <div className={clsx((leftIcon || rightIcon) && 'relative')}>
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
              {renderAdornment(leftIcon)}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={error ? true : undefined}
            className={clsx(controlClasses({ error, size }), leftIcon && 'pl-11', rightIcon && 'pr-11', className)}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted">{renderAdornment(rightIcon)}</div>
          )}
        </div>
      </Field>
    )
  }
)
Input.displayName = 'Input'
