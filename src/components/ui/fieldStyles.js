import { clsx } from 'clsx'

/** Shared control classes (48px, #FAFAFA fill, #E0E0E0 border, radius 8, 16px value). */
export const controlClasses = ({ error, size = 'md' } = {}) =>
  clsx(
    'w-full rounded-lg border bg-canvas text-ink outline-none transition-[border-color,box-shadow]',
    'placeholder:text-ink-placeholder focus:border-brand focus:shadow-focus',
    'disabled:cursor-not-allowed disabled:bg-subtle disabled:text-ink-muted',
    size === 'sm' ? 'h-10 px-3 text-sm' : 'h-12 px-4 text-base',
    error ? 'border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgb(236_34_31/0.15)]' : 'border-line'
  )
