import { forwardRef } from 'react'
import { clsx } from 'clsx'
import { Search, X } from 'lucide-react'

/**
 * SearchInput — Figma "Search bar" (header): 40px, white, #E0E0E0 border, radius 8, 20px
 * search glyph, 16px text, #9E9E9E placeholder. Shows a clear (X) button when it has a value.
 * Props: value, onChange (native event), onClear, placeholder, size (md 40px | sm 32px),
 * className (wrapper), inputClassName. Other props go to the <input>.
 */
export const SearchInput = forwardRef(
  ({ value, onChange, onClear, placeholder = 'Search', size = 'md', className, inputClassName, ...props }, ref) => (
    <div className={clsx('relative', className)}>
      <Search
        className={clsx(
          'pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-muted',
          size === 'sm' ? 'left-2.5 h-4 w-4' : 'left-3 h-5 w-5'
        )}
        aria-hidden="true"
      />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={clsx(
          'w-full rounded-lg border border-line bg-surface text-ink outline-none transition-[border-color,box-shadow]',
          'placeholder:text-ink-placeholder focus:border-brand focus:shadow-focus [&::-webkit-search-cancel-button]:hidden',
          size === 'sm' ? 'h-8 pl-8 pr-8 text-sm' : 'h-10 pl-11 pr-10 text-base',
          inputClassName
        )}
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-ink-muted hover:bg-subtle hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
)
SearchInput.displayName = 'SearchInput'
