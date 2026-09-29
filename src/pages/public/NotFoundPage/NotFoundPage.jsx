import { Link } from 'react-router'
import { ArrowLeft, LayoutDashboard } from 'lucide-react'
import { SEO, Logo } from '@components'

// Link buttons in the Figma button style (48px, radius 8, DM Sans 600 16).
const LINK_BASE =
  'inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-base font-semibold transition-colors outline-none focus-visible:ring-4'
const LINK_PRIMARY = `${LINK_BASE} bg-primary text-canvas hover:bg-primary-hover active:bg-primary-active focus-visible:ring-primary/30`
const LINK_OUTLINE = `${LINK_BASE} border border-line bg-surface text-ink hover:bg-subtle focus-visible:ring-ink/10`

// Shown for unknown public URLs and unknown /dashboard/* URLs. The dashboard link goes
// through ProtectedRoute, so signed-out visitors land on the login page first.
export const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-canvas px-4 text-ink sm:px-6">
      <SEO title="Page not found" noindex />

      <header className="mx-auto flex h-16 w-full max-w-6xl items-center">
        <Link to="/" aria-label="Yumio home">
          <Logo width={96} />
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
        {/* Figma "Surprise me — couldn't find" cloche: the lid lifts on an empty plate. */}
        <img
          src="/images/surprise-not-found.gif"
          alt=""
          width={150}
          height={150}
          className="h-[150px] w-[150px]"
        />
        <p className="mt-2 font-display text-6xl font-bold tracking-tight text-brand sm:text-7xl">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold">Page not found</h1>
        <p className="mt-2 max-w-md text-ink-tertiary">
          We looked under every lid, but this page doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Link to="/" className={LINK_PRIMARY}>
            <ArrowLeft className="h-5 w-5" /> Back to home
          </Link>
          <Link to="/dashboard" className={LINK_OUTLINE}>
            <LayoutDashboard className="h-5 w-5" /> Go to dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}
