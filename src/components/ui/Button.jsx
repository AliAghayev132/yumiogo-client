import { forwardRef, isValidElement } from 'react'
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

/*
 * Figma buttons (Admin Panel):
 *  - md "Primary/Secondary button" (modals): 40px, radius 8, DM Sans 600 14, padding 10/16.
 *  - sm card-header buttons (Export / Filter / + Add user / Save changes): 32px, radius 6,
 *    DM Sans 600 12, padding 8/12, 16px icon.
 *  Colours: primary = orange #F97316 (add / create / submit), success = green #22C55E
 *  (approve / restore / resolve), danger = red #EC221F (ban / remove / reject / delete),
 *  outline = #E0E0E0 border on transparent, secondary = #FAFAFA fill + border.
 */
const VARIANTS = {
  primary:
    'bg-primary text-canvas hover:bg-primary-hover active:bg-primary-active focus-visible:ring-primary/30',
  success: 'bg-brand text-canvas hover:bg-brand-hover focus-visible:ring-brand/30',
  danger: 'bg-danger text-canvas hover:bg-danger-hover focus-visible:ring-danger/30',
  outline:
    'border border-line bg-transparent text-ink hover:bg-subtle active:bg-line/60 focus-visible:ring-ink/10',
  secondary:
    'border border-line bg-canvas text-ink hover:bg-subtle active:bg-line/60 focus-visible:ring-ink/10',
  ghost: 'bg-transparent text-ink hover:bg-subtle active:bg-line/60 focus-visible:ring-ink/10',
  // Soft tinted variants (inline actions that should not shout).
  'soft-danger': 'bg-danger-soft text-danger hover:bg-danger/15 focus-visible:ring-danger/20',
  'soft-success': 'bg-success-soft text-success hover:bg-brand/15 focus-visible:ring-brand/20',
  link: 'bg-transparent text-brand-hover hover:underline underline-offset-2 px-0! h-auto!',
  // Legacy alias: `warning` was the orange CTA before the Figma primary existed.
  warning:
    'bg-primary text-canvas hover:bg-primary-hover active:bg-primary-active focus-visible:ring-primary/30',
}

const SIZES = {
  xs: 'h-7 px-2.5 text-xs gap-1 rounded-md',
  sm: 'h-8 px-3 text-xs gap-1 rounded-md',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-base gap-2 rounded-lg',
}

const ICON_SIZES = { xs: 'w-3.5 h-3.5', sm: 'w-4 h-4', md: 'w-4 h-4', lg: 'w-5 h-5' }

// Accepts a lucide component (Plus) or an element (<Plus />).
const renderIcon = (icon, size) => {
  if (!icon) return null
  if (isValidElement(icon)) return <span className="inline-flex shrink-0">{icon}</span>
  const Icon = icon
  return <Icon className={clsx('shrink-0', ICON_SIZES[size])} strokeWidth={2.25} />
}

/**
 * Button — Figma admin button.
 * variant: primary | success | danger | outline | secondary | ghost | soft-danger |
 *          soft-success | link  (legacy `warning` = primary)
 * size: xs | sm (card headers, 32px) | md (modals, 40px, default) | lg (48px)
 */
export const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className,
      type = 'button',
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      className={clsx(
        'inline-flex items-center justify-center whitespace-nowrap font-sans font-semibold leading-none transition-colors',
        'outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className={clsx('animate-spin shrink-0', ICON_SIZES[size])} /> : renderIcon(leftIcon, size)}
      {children}
      {renderIcon(rightIcon, size)}
    </button>
  )
)
Button.displayName = 'Button'

const ICON_BUTTON_SIZES = {
  sm: { box: 'h-8 w-10 rounded-md', icon: 'w-4 h-4' }, // Figma table action: 40x32, 16px glyph
  md: { box: 'h-10 w-10 rounded-lg', icon: 'w-5 h-5' }, // header bell: 40x40, 20px glyph
  xs: { box: 'h-7 w-7 rounded-md', icon: 'w-3.5 h-3.5' },
}

const ICON_BUTTON_TONES = {
  // Figma "Button" (1286:24923): #212121 glyph on transparent; Hover turns the glyph red.
  default: 'text-ink hover:bg-subtle',
  danger: 'text-ink hover:text-danger',
  muted: 'text-ink-muted hover:text-ink hover:bg-subtle',
  brand: 'text-ink hover:text-brand-hover hover:bg-brand-soft',
}

/**
 * IconButton — square icon-only button.
 * `label` is required: it is the accessible name and the tooltip.
 * tone: default | danger (delete icon: dark, red on hover) | muted | brand
 * variant: ghost (transparent, default) | secondary (#FAFAFA fill + border, e.g. the bell)
 */
export const IconButton = forwardRef(
  (
    { icon: Icon, label, tone = 'default', variant = 'ghost', size = 'sm', className, children, type = 'button', ...props },
    ref
  ) => {
    const s = ICON_BUTTON_SIZES[size] || ICON_BUTTON_SIZES.sm
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        title={label}
        className={clsx(
          'relative inline-flex shrink-0 items-center justify-center transition-colors outline-none',
          'focus-visible:ring-4 focus-visible:ring-ink/10 disabled:cursor-not-allowed disabled:opacity-40',
          s.box,
          variant === 'secondary' && 'border border-line bg-canvas',
          ICON_BUTTON_TONES[tone] || ICON_BUTTON_TONES.default,
          className
        )}
        {...props}
      >
        {isValidElement(Icon) ? Icon : Icon ? <Icon className={s.icon} strokeWidth={2} /> : null}
        {children}
      </button>
    )
  }
)
IconButton.displayName = 'IconButton'

const CHIP_TONES = {
  default: 'text-ink hover:bg-subtle hover:border-ink-disabled',
  success: 'text-ink hover:bg-success-soft hover:text-success hover:border-mint-line',
  danger: 'text-ink hover:bg-danger-soft hover:text-danger hover:border-danger/40',
  warning: 'text-ink hover:bg-warning-soft hover:text-warning hover:border-warning/40',
}

/**
 * ChipButton — the small outlined row action from the Figma tables
 * ("View · Warn · Ban · Restore · Approve · Reject · Resolve"): 22px, radius 4,
 * #FAFAFA fill, #E0E0E0 border, Plus Jakarta Sans 500. The hover tint hints the
 * outcome (tone: default | success | danger | warning).
 * Figma sets the label at 8px; we use 10px so it stays legible on screen.
 */
export const ChipButton = forwardRef(
  ({ children, tone = 'default', icon, className, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={clsx(
        'inline-flex h-[22px] shrink-0 items-center justify-center gap-1 rounded-sm border border-line bg-canvas px-3',
        'font-display text-[10px] font-medium leading-none whitespace-nowrap transition-colors outline-none',
        'focus-visible:ring-2 focus-visible:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-50',
        CHIP_TONES[tone] || CHIP_TONES.default,
        className
      )}
      {...props}
    >
      {renderIcon(icon, 'xs')}
      {children}
    </button>
  )
)
ChipButton.displayName = 'ChipButton'
