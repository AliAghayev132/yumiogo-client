import { forwardRef, useId } from 'react'
import { clsx } from 'clsx'
import { Field } from './Field'
import { controlClasses } from './fieldStyles'

/**
 * Textarea — same Figma field style as Input, multi-line.
 * Props: label, error, helperText, rows (4), resize (false), required, className (on the
 * <textarea>), containerClassName; `maxLength` + `showCount` renders a "12/300" counter.
 */
export const Textarea = forwardRef(
  (
    { label, error, helperText, className, containerClassName, rows = 4, resize = false, id, required, showCount, ...props },
    ref
  ) => {
    const autoId = useId()
    const inputId = id || autoId
    const count = showCount && props.maxLength ? `${String(props.value ?? '').length}/${props.maxLength}` : null
    return (
      <Field
        label={label}
        htmlFor={inputId}
        error={error}
        helperText={helperText}
        required={required}
        className={containerClassName}
        labelAction={count && <span className="text-xs text-ink-muted">{count}</span>}
      >
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          required={required}
          aria-invalid={error ? true : undefined}
          className={clsx(
            controlClasses({ error }),
            'h-auto! py-3 leading-6',
            resize ? 'resize-y' : 'resize-none',
            className
          )}
          {...props}
        />
      </Field>
    )
  }
)
Textarea.displayName = 'Textarea'
