import { clsx } from 'clsx'

/**
 * Card — Figma card surface: white, radius 12, 1px #E0E0E0 border, no shadow.
 * padding: none | sm (16) | md (24, default) | lg (32) | chart (18, the chart-card inset).
 * shadow: none (default, Figma) | sm | md | lg.
 * Sub-parts: Card.Header (title row; `divider` draws the full-width Figma divider),
 * Card.Title, Card.Description, Card.Content, Card.Footer.
 */
export const Card = ({ children, className, padding = 'md', shadow = 'none', as: Tag = 'div', ...props }) => {
  const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8', chart: 'p-[18px]' }
  const shadows = { none: '', sm: 'shadow-sm', md: 'shadow-md', lg: 'shadow-lg' }
  return (
    <Tag
      className={clsx('rounded-xl border border-line bg-surface', paddings[padding], shadows[shadow], className)}
      {...props}
    >
      {children}
    </Tag>
  )
}

const CardHeader = ({ children, className, actions, divider = false }) => (
  <div
    className={clsx(
      'flex items-start justify-between gap-4',
      divider ? 'mb-4 border-b border-line pb-4' : 'mb-4',
      className
    )}
  >
    <div className="min-w-0">{children}</div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </div>
)

// Figma card title: DM Sans 700 14/18 #212121; subtitle: Inter 400 12/16 #757575.
const CardTitle = ({ children, className, as: Tag = 'h3' }) => (
  <Tag className={clsx('text-sm font-bold leading-[18px] text-ink', className)}>{children}</Tag>
)

const CardDescription = ({ children, className }) => (
  <p className={clsx('mt-0.5 font-chart text-xs leading-4 tracking-[-0.02em] text-ink-muted', className)}>{children}</p>
)

const CardContent = ({ children, className }) => <div className={className}>{children}</div>

const CardFooter = ({ children, className }) => (
  <div className={clsx('mt-4 border-t border-line pt-4', className)}>{children}</div>
)

Card.Header = CardHeader
Card.Title = CardTitle
Card.Description = CardDescription
Card.Content = CardContent
Card.Footer = CardFooter
