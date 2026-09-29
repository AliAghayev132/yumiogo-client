import { Link, useParams } from 'react-router'
import { Apple, ArrowLeft, ExternalLink, FileText, Play } from 'lucide-react'
import { clsx } from 'clsx'
import { SEO, Logo, Button, EmptyState, Skeleton } from '@components'
import { useGetPublicPageQuery, useGetPublicPagesQuery } from '@store/api'
import { parseLegalBody, storeOf } from './legalMarkup'

const dateLabel = (value) =>
  value ? new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''

/** One parsed body block: paragraph, note box, table or link buttons / store badges. */
const Block = ({ block }) => {
  switch (block.type) {
    case 'note':
      return (
        <p className="whitespace-pre-wrap rounded-lg border border-primary/20 bg-primary-soft px-4 py-3 text-sm font-medium leading-6 text-ink-secondary">
          {block.text}
        </p>
      )
    case 'table':
      return (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-subtle text-ink">
              <tr>
                {block.header.map((cell, i) => (
                  <th key={i} className="px-4 py-2 font-semibold">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-ink-secondary">
              {block.rows.map((row, r) => (
                <tr key={r} className="border-t border-line">
                  {row.map((cell, i) => (
                    <td key={i} className="px-4 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'links':
      return (
        <div className="flex flex-wrap gap-3">
          {block.links.map((link) => {
            const store = storeOf(link.url)
            return store ? (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-surface transition-opacity hover:opacity-90"
              >
                {store === 'apple' ? <Apple className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                <span className="text-left leading-tight">
                  <span className="block text-[9px] font-medium uppercase">
                    {store === 'apple' ? 'Download on the' : 'Get it on'}
                  </span>
                  <span className="text-sm font-semibold">{store === 'apple' ? 'App Store' : 'Google Play'}</span>
                </span>
              </a>
            ) : (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:bg-subtle"
              >
                {link.label} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )
          })}
        </div>
      )
    default:
      return <p className="whitespace-pre-wrap text-sm leading-6 text-ink-secondary">{block.text}</p>
  }
}

/**
 * Public legal page (/legal/:slug — Terms, Privacy, Cookies…), the same content the app shows,
 * edited under Content → Legal pages. Other published pages are linked at the bottom.
 */
export const LegalPage = () => {
  const { slug } = useParams()
  const { data, isLoading, isError, error, refetch } = useGetPublicPageQuery(slug)
  const { data: listData } = useGetPublicPagesQuery()
  const page = data?.data?.page
  const others = (listData?.data?.pages || []).filter((p) => p.slug !== slug)
  const notFound = error?.status === 404

  return (
    <div className="flex min-h-screen flex-col bg-canvas px-4 text-ink sm:px-6">
      <SEO title={page?.title || 'Legal'} path={`/legal/${slug}`} noindex={notFound} />

      <header className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between">
        <Link to="/" aria-label="Yumio home">
          <Logo width={96} />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-ink-tertiary transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 pb-16 pt-6">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : isError || !page ? (
          <EmptyState
            icon={FileText}
            title={notFound ? 'Page not found' : 'Could not load this page'}
            description={notFound ? 'This page does not exist or is not published.' : 'Check your connection and try again.'}
            action={
              notFound ? (
                <Link to="/" className="text-sm font-semibold text-brand-hover hover:underline">
                  Back to home
                </Link>
              ) : (
                <Button size="sm" variant="outline" onClick={refetch}>
                  Try again
                </Button>
              )
            }
          />
        ) : (
          <article>
            <h1 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">{page.title}</h1>
            {page.updatedAt && <p className="mt-2 text-sm text-ink-muted">Last updated {dateLabel(page.updatedAt)}</p>}
            {page.intro && <p className="mt-6 whitespace-pre-wrap text-base leading-7 text-ink-secondary">{page.intro}</p>}
            <div className="mt-8 flex flex-col gap-4">
              {(page.sections || []).map((section, i) => (
                <section
                  key={`${section.heading}-${i}`}
                  className={clsx(
                    'rounded-xl border p-5',
                    section.highlight ? 'border-mint-line bg-mint' : 'border-line bg-surface'
                  )}
                >
                  {section.heading && (
                    <h2 className={clsx('font-display text-lg font-bold', section.highlight ? 'text-mint-ink' : 'text-ink')}>
                      {section.heading}
                    </h2>
                  )}
                  {section.body && (
                    <div className={clsx('mt-2 flex flex-col gap-3', section.highlight && 'text-mint-ink')}>
                      {parseLegalBody(section.body).map((block, b) => (
                        <Block key={b} block={block} />
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </article>
        )}

        {others.length > 0 && (
          <nav aria-label="Other legal pages" className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-6 text-sm">
            {others.map((p) => (
              <Link key={p.slug} to={`/legal/${p.slug}`} className="font-medium text-ink-tertiary hover:text-ink">
                {p.title}
              </Link>
            ))}
          </nav>
        )}
      </main>
    </div>
  )
}
