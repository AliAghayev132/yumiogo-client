import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { clsx } from 'clsx'
import { Card, IconTile } from '@components'
import { toNum } from './settingsForm'

/** A titled settings card (Figma card header + divider); `id` is the anchor used by the jump links. */
export const ConfigCard = ({ id, icon, title, description, action, children }) => (
  <Card id={id} padding="none" className="scroll-mt-24">
    <div className="flex items-start gap-3 border-b border-line px-[18px] py-4">
      {icon && <IconTile icon={icon} tone="green" size="sm" />}
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-bold leading-[18px] text-ink">{title}</h2>
        {description && <div className="mt-1 text-xs leading-4 text-ink-muted">{description}</div>}
      </div>
      {action}
    </div>
    <div className="p-[18px]">{children}</div>
  </Card>
)

/** Small heading inside a card. */
export const SubHeading = ({ children, className }) => (
  <p className={clsx('mb-3 text-xs font-semibold text-ink-tertiary', className)}>{children}</p>
)

/** Monospace key chip (e.g. "price_asc") so admins can see which fixed key a row edits. */
export const KeyChip = ({ children }) => (
  <code className="inline-block rounded bg-subtle px-1.5 py-0.5 font-mono text-[11px] text-ink-muted">{children}</code>
)

/**
 * Editable list of numbers shown as chips (filter options, quick-filter cycles).
 * Values stay unique and sorted ascending, like the server stores them.
 */
export const NumberListField = ({
  label,
  hint,
  values,
  onChange,
  format,
  step = 'any',
  placeholder = 'Add value',
  error,
}) => {
  const [draft, setDraft] = useState('')
  const [draftError, setDraftError] = useState('')

  const add = () => {
    const n = toNum(draft)
    if (n === null || n < 0) return setDraftError('Enter a number ≥ 0')
    if (values.includes(n)) return setDraftError('Already in the list')
    onChange([...values, n].sort((a, b) => a - b))
    setDraft('')
    setDraftError('')
  }

  const message = draftError || error
  return (
    <div>
      {label && <label className="mb-2 block text-sm leading-[18px] text-ink-tertiary">{label}</label>}
      <div
        className={clsx(
          'flex min-h-12 flex-wrap items-center gap-2 rounded-lg border bg-canvas px-2 py-2 transition-[border-color,box-shadow] focus-within:border-brand focus-within:shadow-focus',
          message ? 'border-error' : 'border-line'
        )}
      >
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-1 rounded-full border border-mint-line bg-mint py-1 pl-3 pr-1 text-sm font-medium text-mint-ink"
          >
            {format ? format(value) : value}
            <button
              type="button"
              onClick={() => onChange(values.filter((v) => v !== value))}
              className="flex h-5 w-5 items-center justify-center rounded-full text-mint-ink hover:bg-mint-line/60"
              title="Remove"
              aria-label={`Remove ${value}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {!values.length && <span className="px-1 text-sm text-ink-placeholder">No values</span>}
        <div className="flex min-w-[140px] flex-1 items-center gap-1">
          <input
            type="number"
            min="0"
            step={step}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              setDraftError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                add()
              }
            }}
            placeholder={placeholder}
            aria-label={label ? `Add to ${label}` : 'Add value'}
            className="min-w-0 flex-1 bg-transparent px-2 py-1 text-sm text-ink outline-none placeholder:text-ink-placeholder"
          />
          <button
            type="button"
            onClick={add}
            disabled={draft === ''}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-brand-hover hover:bg-brand-soft disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>
      {(message || hint) && (
        <p className={clsx('mt-1.5 text-xs leading-4', message ? 'text-error' : 'text-ink-muted')}>{message || hint}</p>
      )}
    </div>
  )
}

/** "Shown / Hidden" label + switch used by the keyed rows. */
export const VisibilityLabel = ({ active }) => (
  <span className="w-12 text-right text-xs text-ink-muted">{active ? 'Shown' : 'Hidden'}</span>
)
