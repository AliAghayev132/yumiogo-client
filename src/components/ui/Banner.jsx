import { isValidElement } from 'react'
import { clsx } from 'clsx'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

/*
 * Figma Snackbar (789:4877 / 789:4784 / 788:4426): full-width inline bar at the top of the
 * page content, radius 4, padding 14/0/14/16, 24px leading icon, DM Sans 600 14/18 message,
 * 48px close affordance with a #757575 X.
 *   success  #009951 on #EBFFEE (check_circle_outline)
 *   warning  #E5A000 on #FFFBEB (warning_amber)
 *   error    #B3261E on 10% red (error_outline)
 * The same bar without the X is the amber "notice" inside modals
 * ("This action cannot be undone…").
 */
const TONES = {
  success: { box: 'bg-success-soft text-success', icon: CheckCircle2 },
  warning: { box: 'bg-warning-soft text-warning', icon: AlertTriangle },
  error: { box: 'bg-error-soft text-error', icon: AlertCircle },
  info: { box: 'bg-info-soft text-info', icon: Info },
}
TONES.danger = TONES.error

/**
 * Banner — inline dismissible snackbar / notice.
 *   <Banner tone="success" onClose={…}>Restaurant added successfully</Banner>
 *   <Banner tone="warning">This action cannot be undone.</Banner>   // modal notice, no X
 * Props: tone (success | warning | error | info), title (optional bold first line),
 * icon (override; lucide component or element, `false` hides it), action ({ label, onClick }),
 * onClose (shows the X). Prefer the page-level useBanner() API for action feedback.
 */
export const Banner = ({ tone = 'info', title, children, message, icon, action, onClose, className, role }) => {
  const t = TONES[tone] || TONES.info
  const Icon = icon === undefined ? t.icon : icon
  const body = children ?? message

  return (
    <div
      role={role || (tone === 'error' ? 'alert' : 'status')}
      className={clsx(
        'flex w-full items-center gap-2 rounded-sm py-3.5 pl-4',
        onClose ? 'pr-1' : 'pr-4',
        t.box,
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2">
        {Icon &&
          (isValidElement(Icon) ? (
            Icon
          ) : (
            <Icon className="mt-[-3px] h-6 w-6 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          ))}
        <div className="min-w-0 flex-1 text-sm font-semibold leading-[18px]">
          {title && <p>{title}</p>}
          {body && <div className={clsx(title && 'mt-0.5 font-medium opacity-90')}>{body}</div>}
        </div>
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold underline-offset-2 hover:underline"
        >
          {action.label}
        </button>
      )}
      {onClose && (
        // Figma close affordance: 48px target, 40px round state layer, #757575 X.
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="group inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-ink-muted outline-none"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors group-hover:bg-ink/5 group-hover:text-ink group-focus-visible:ring-2 group-focus-visible:ring-ink/20">
            <X className="h-5 w-5" />
          </span>
        </button>
      )}
    </div>
  )
}
