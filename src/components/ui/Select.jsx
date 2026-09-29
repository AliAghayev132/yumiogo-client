import { forwardRef, isValidElement, useCallback, useId, useMemo, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Field } from './Field'
import { controlClasses } from './fieldStyles'
import { Popover } from './Popover'
import { Menu, MenuItem } from './Menu'
import { SearchInput } from './SearchInput'
import { moveFocus } from './menuFocus'

const normalise = (options) =>
  options.map((o) => (typeof o === 'object' && o !== null ? o : { value: o, label: String(o) }))

/**
 * Select — Figma "Component 1" select field + "Theme" menu (replaces the native <select>).
 * 48px #FAFAFA field with expand_more / expand_less chevron; the open menu is a floating
 * white card (radius 12, menu shadow) with a leading check on the selected option.
 *
 * Props: label, options ([{ value, label, disabled, description }] or plain strings), value,
 * onChange — called with an event-like `{ target: { name, value } }` (drop-in for the old
 * native select) — and/or onValueChange(value); placeholder ('Select'), name, disabled,
 * required, error, helperText, size (md 48px | sm 40px), leftIcon, searchable (filter box
 * for long lists), clearable (adds the placeholder as an empty first option; defaults to on
 * when a placeholder is passed and the field is not required), className (trigger),
 * containerClassName, menuClassName.
 */
export const Select = forwardRef(
  (
    {
      label,
      error,
      helperText,
      options = [],
      value,
      onChange,
      onValueChange,
      placeholder,
      name,
      disabled = false,
      required = false,
      size = 'md',
      leftIcon: LeftIcon,
      searchable = false,
      clearable,
      className,
      containerClassName,
      menuClassName,
      id,
    },
    ref
  ) => {
    const autoId = useId()
    const triggerId = id || autoId
    const listId = `${triggerId}-list`
    const anchorRef = useRef(null)
    const listRef = useRef(null)
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')

    const items = useMemo(() => normalise(options), [options])
    const selected = items.find((o) => o.value === value) ?? items.find((o) => String(o.value) === String(value))
    const canClear = clearable ?? (placeholder !== undefined && !required)
    const shown = useMemo(() => {
      const q = query.trim().toLowerCase()
      return q ? items.filter((o) => String(o.label).toLowerCase().includes(q)) : items
    }, [items, query])

    const close = useCallback(() => {
      setOpen(false)
      setQuery('')
    }, [])

    const pick = (next) => {
      onChange?.({ target: { name, value: next }, currentTarget: { name, value: next } })
      onValueChange?.(next)
      close()
      anchorRef.current?.focus()
    }

    const openMenu = () => {
      if (disabled) return
      setOpen(true)
      // Focus the selected option (or the search box) once the menu is painted.
      requestAnimationFrame(() => {
        const list = listRef.current
        if (!list) return
        const current = list.querySelector('[aria-selected="true"]')
        if (searchable) list.parentElement?.querySelector('input')?.focus()
        else if (current) current.focus()
        else moveFocus(list, 'first')
      })
    }

    const setRefs = (node) => {
      anchorRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    }

    const Chevron = open ? ChevronUp : ChevronDown

    return (
      <Field
        label={label}
        htmlFor={triggerId}
        error={error}
        helperText={helperText}
        required={required}
        className={containerClassName}
      >
        <button
          ref={setRefs}
          id={triggerId}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-invalid={error ? true : undefined}
          disabled={disabled}
          onClick={() => (open ? close() : openMenu())}
          onKeyDown={(e) => {
            if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key) && !open) {
              e.preventDefault()
              openMenu()
            }
          }}
          className={clsx(
            controlClasses({ error, size }),
            'flex items-center gap-2 pr-2 text-left',
            open && !error && 'border-brand shadow-focus',
            className
          )}
        >
          {LeftIcon &&
            (isValidElement(LeftIcon) ? LeftIcon : <LeftIcon className="h-5 w-5 shrink-0 text-ink-muted" />)}
          <span className={clsx('min-w-0 flex-1 truncate', !selected && 'text-ink-placeholder')}>
            {selected ? selected.label : placeholder ?? 'Select'}
          </span>
          <Chevron className="h-5 w-5 shrink-0 text-ink-muted" />
        </button>
        {name && <input type="hidden" name={name} value={value ?? ''} />}

        <Popover open={open} onClose={close} anchorRef={anchorRef} matchWidth className={menuClassName}>
          {searchable && (
            <div className="border-b border-line p-2">
              <SearchInput
                size="sm"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClear={() => setQuery('')}
                placeholder="Search"
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    moveFocus(listRef.current, 'first')
                  }
                }}
              />
            </div>
          )}
          <Menu
            ref={listRef}
            id={listId}
            role="listbox"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') moveFocus(listRef.current, 1)
              else if (e.key === 'ArrowUp') moveFocus(listRef.current, -1)
              else if (e.key === 'Home') moveFocus(listRef.current, 'first')
              else if (e.key === 'End') moveFocus(listRef.current, 'last')
              else if (e.key === 'Tab') close()
              else return
              e.preventDefault()
            }}
          >
            {canClear && !query && (
              <MenuItem role="option" selected={!selected} onSelect={() => pick('')} className="text-ink-muted!">
                {placeholder ?? 'Select'}
              </MenuItem>
            )}
            {shown.map((o) => {
              const isSel = selected?.value === o.value
              return (
                <MenuItem
                  key={String(o.value)}
                  role="option"
                  selected={isSel}
                  showCheck={isSel}
                  disabled={o.disabled}
                  description={o.description}
                  onSelect={() => pick(o.value)}
                >
                  {o.label}
                </MenuItem>
              )
            })}
            {shown.length === 0 && <p className="px-4 py-3 text-sm text-ink-muted">No options</p>}
          </Menu>
        </Popover>
      </Field>
    )
  }
)
Select.displayName = 'Select'
