import { clsx } from 'clsx'
import { Inbox } from 'lucide-react'
import { IconTile } from './IconTile'

/**
 * EmptyState — centred icon tile + title + description + optional action.
 * Use inside cards / TableCard (Table.Empty wraps it in a full-width row).
 * Props: icon (lucide, default Inbox), tone (IconTile tone, default neutral), title,
 * description, action (e.g. <Button size="sm" leftIcon={Plus}>Add cuisine</Button>), compact.
 */
export const EmptyState = ({ icon = Inbox, tone = 'neutral', title, description, action, compact = false, className }) => (
  <div className={clsx('flex flex-col items-center justify-center text-center', compact ? 'py-2' : 'py-12', className)}>
    <IconTile icon={icon} tone={tone} size={compact ? 'md' : 'lg'} />
    {title && <p className="mt-3 text-base font-semibold text-ink">{title}</p>}
    {description && <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)
