import { Link } from 'react-router'
import { Apple, Play, RefreshCw, Smartphone, WifiOff } from 'lucide-react'
import { clsx } from 'clsx'
import { Logo, IconTile, Skeleton } from '@components'
import { useGetCatalogQuery, useGetPublicPagesQuery } from '@store/api'
import { isMobileDevice } from './landingUtils'

// Figma button (48px, radius 8, DM Sans 600 16) — same look as the landing and 404 CTAs.
const CTA_BASE =
  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg px-6 text-base font-semibold transition-colors outline-none focus-visible:ring-4'
const CTA_PRIMARY = `${CTA_BASE} bg-primary text-canvas shadow-lg shadow-primary/25 hover:bg-primary-hover active:bg-primary-active focus-visible:ring-primary/30`
const CTA_OUTLINE = `${CTA_BASE} border border-line bg-surface text-ink hover:bg-subtle focus-visible:ring-ink/10`

const CHIP_TONES = {
  neutral: 'bg-subtle text-ink-secondary',
  brand: 'bg-mint text-mint-ink',
  info: 'bg-info-soft text-info',
  orange: 'bg-primary-soft text-primary-active',
  error: 'bg-error-soft text-error',
}

/** Small rounded label (privacy, item count, cuisine, discount…). */
export const Chip = ({ icon: Icon, tone = 'neutral', children, className }) => (
  <span
    className={clsx(
      'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 font-display text-xs font-semibold',
      CHIP_TONES[tone] || CHIP_TONES.neutral,
      className
    )}
  >
    {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />}
    {children}
  </span>
)

/**
 * Page chrome of the shared-link landing pages (/list, /restaurant, /invite, /review):
 * logo header, a centred mobile-first column and a footer with the published legal pages.
 */
export const LandingShell = ({ children, className }) => {
  const { data: pagesData } = useGetPublicPagesQuery()
  const legalPages = pagesData?.data?.pages || []

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-canvas text-ink antialiased selection:bg-mint selection:text-mint-deep">
      {/* soft brand wash behind the header */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-linear-to-b from-mint/70 via-mint/25 to-transparent"
      />

      <header className="relative mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link to="/" aria-label="Yumio home" className="shrink-0">
          <Logo width={88} />
        </Link>
        <Link
          to="/"
          className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-secondary transition-colors hover:bg-surface/70 hover:text-ink"
        >
          Discover Yumio
        </Link>
      </header>

      <main className={clsx('relative mx-auto w-full max-w-2xl flex-1 px-4 pb-14 pt-2 sm:px-6 sm:pt-6', className)}>
        {children}
      </main>

      <footer className="relative border-t border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} Yumio</span>
          {legalPages.length > 0 && (
            <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2">
              {legalPages.map((p) => (
                <Link key={p.slug} to={`/legal/${p.slug}`} className="transition-colors hover:text-ink">
                  {p.title}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </footer>
    </div>
  )
}

/**
 * "Open in Yumio" (the app deep link) plus the App Store / Google Play buttons from
 * App config → App stores (GET /catalog config.appLinks). A store button is hidden while
 * its URL is empty, the row when both are. On a computer a note explains that the app
 * link works on a phone.
 */
export const AppCta = ({ deepLink, label = 'Open in Yumio', hint, className }) => {
  const { data } = useGetCatalogQuery()
  const appLinks = data?.data?.config?.appLinks || {}
  const stores = [
    appLinks.ios && { key: 'ios', href: appLinks.ios, icon: Apple, caption: 'Download on the', name: 'App Store' },
    appLinks.android && { key: 'android', href: appLinks.android, icon: Play, caption: 'Get it on', name: 'Google Play' },
  ].filter(Boolean)
  const desktop = !!deepLink && !isMobileDevice()

  return (
    <div className={clsx('flex flex-col gap-3', className)}>
      {deepLink && (
        <a href={deepLink} className={CTA_PRIMARY}>
          <Smartphone className="h-5 w-5" /> {label}
        </a>
      )}
      {hint && <p className="text-center text-sm leading-5 text-ink-tertiary">{hint}</p>}
      {desktop && (
        <p className="text-center text-xs leading-5 text-ink-muted">
          On a computer? Open this link on your phone to continue in the app.
        </p>
      )}
      {stores.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {stores.map(({ key, href, icon: StoreIcon, caption, name }) => (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="flex min-w-[9.5rem] flex-1 items-center justify-center gap-2.5 rounded-lg bg-ink px-4 py-2 text-canvas transition-colors hover:bg-ink-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink/20"
            >
              <StoreIcon className="h-5 w-5 shrink-0" />
              <span className="text-left leading-tight">
                <span className="block text-[10px] font-medium text-canvas/70">{caption}</span>
                <span className="text-sm font-semibold">{name}</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Not-found (the Figma "couldn't find" cloche) and load-error states. `children` go
 * under the text (e.g. the store buttons).
 */
export const LandingState = ({ kind = 'notFound', title, description, onRetry, retrying, children }) => (
  <section className="flex flex-col items-center rounded-2xl border border-line bg-surface px-5 py-10 text-center shadow-sm sm:px-10">
    {kind === 'notFound' ? (
      <img src="/images/surprise-not-found.gif" alt="" width={132} height={132} className="h-[132px] w-[132px]" />
    ) : (
      <IconTile icon={WifiOff} tone="neutral" size="lg" />
    )}
    <h1 className="mt-4 text-balance font-display text-xl font-bold text-ink sm:text-2xl">{title}</h1>
    {description && <p className="mt-2 max-w-sm text-sm leading-6 text-ink-tertiary">{description}</p>}
    <div className="mt-6 flex w-full max-w-sm flex-col gap-3">
      {onRetry && (
        <button type="button" onClick={onRetry} disabled={retrying} className={clsx(CTA_OUTLINE, 'disabled:opacity-60')}>
          <RefreshCw className={clsx('h-5 w-5', retrying && 'animate-spin')} /> Try again
        </button>
      )}
      {children}
      <Link to="/" className="mt-1 text-sm font-semibold text-brand-hover hover:underline">
        Back to home
      </Link>
    </div>
  </section>
)

/** Loading placeholder: picture block + text lines + button. */
export const LandingSkeleton = ({ picture = true }) => (
  <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm" aria-busy="true" aria-live="polite">
    {picture && <Skeleton className="aspect-[2/1] w-full rounded-none" />}
    <div className="flex flex-col gap-3 p-5 sm:p-6">
      <Skeleton className="h-5 w-24 rounded-full" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="mt-3 h-12 w-full rounded-lg" />
    </div>
  </div>
)
