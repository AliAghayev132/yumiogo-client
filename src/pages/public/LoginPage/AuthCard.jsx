import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Logo, Card, Banner } from '@components'

/**
 * Shell of the admin sign-in pages (Log in, Forgot password): "Back to home", a card with the
 * yumio logo, a Plus Jakarta 24/700 title + subtitle, an optional inline notice
 * ({ tone, title, message }) and the form; © line underneath.
 */
export const AuthCard = ({ title, subtitle, notice, onDismissNotice, children, footer }) => (
  <div className="flex min-h-screen flex-col bg-canvas px-4 py-8 sm:px-6">
    <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 self-start rounded-md text-sm font-medium text-ink-tertiary transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>

      <Card className="w-full sm:p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/" aria-label="Yumio home">
            <Logo width={96} />
          </Link>
          <h1 className="mt-6 font-display text-2xl font-bold text-ink">{title}</h1>
          {subtitle && <p className="mt-2 break-words font-display text-sm text-ink-tertiary">{subtitle}</p>}
        </div>

        {notice && (
          <Banner tone={notice.tone} title={notice.title} onClose={onDismissNotice} className="mb-4">
            {notice.message}
          </Banner>
        )}

        {children}

        {footer && <div className="mt-6 text-center text-sm font-semibold text-ink-secondary">{footer}</div>}
      </Card>

      <p className="mt-6 text-center text-xs text-ink-muted">© {new Date().getFullYear()} Yumio</p>
    </div>
  </div>
)
