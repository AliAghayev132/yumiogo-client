import { clsx } from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Figma: [1, 2, 3, …, 2258]; middle pages: [1, …, 7, 8, 9, …, 20]; end: [1, …, 18, 19, 20]
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
const pageList = (page, pages) => {
  if (pages <= 6) return range(1, pages)
  if (page <= 3) return [...range(1, Math.max(3, page + 1)), 'gap-r', pages]
  if (page >= pages - 2) return [1, 'gap-l', ...range(Math.min(pages - 2, page - 1), pages)]
  return [1, 'gap-l', page - 1, page, page + 1, 'gap-r', pages]
}

const nf = new Intl.NumberFormat('en-US')

const chip =
  'inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-sm px-1.5 font-display text-[10px] font-medium leading-none transition-colors'

/**
 * Pagination — Figma table-card footer: "Showing 1–11 of 24,831" (DM Sans 600 14 #757575)
 * on the left, 22px page chips on the right (active #D3FAE1 / #0A2914, others #FAFAFA with
 * a #E0E0E0 border, ellipsis, chevrons). Always rendered, also for a single page.
 *
 * Props: page (1-based), total (item count), limit (page size), pages (optional; derived
 * from total/limit), onPageChange(page), itemLabel (optional noun: "Showing 1–10 of 42 users"),
 * bordered (top divider, default true — off when TableCard already draws it), className.
 */
export const Pagination = ({
  page = 1,
  total = 0,
  limit = 10,
  pages,
  onPageChange,
  itemLabel,
  bordered = true,
  className,
}) => {
  const pageCount = Math.max(1, pages ?? Math.ceil(total / Math.max(1, limit)))
  const current = Math.min(Math.max(1, page), pageCount)
  const from = total === 0 ? 0 : (current - 1) * limit + 1
  const to = Math.min(current * limit, total)
  const go = (p) => p !== current && p >= 1 && p <= pageCount && onPageChange?.(p)

  return (
    <nav
      aria-label="Pagination"
      className={clsx(
        'flex flex-wrap items-center justify-between gap-3 py-[11px] pl-6 pr-[18px]',
        bordered && 'border-t border-line',
        className
      )}
    >
      <p className="py-[11px] text-sm font-semibold leading-[18px] text-ink-muted">
        {total === 0
          ? `Showing 0 of 0${itemLabel ? ` ${itemLabel}` : ''}`
          : `Showing ${nf.format(from)}–${nf.format(to)} of ${nf.format(total)}${itemLabel ? ` ${itemLabel}` : ''}`}
      </p>
      <div className="flex items-center gap-1.5">
        {pageCount > 1 && (
          <button
            type="button"
            onClick={() => go(current - 1)}
            disabled={current === 1}
            aria-label="Previous page"
            className={clsx(chip, 'text-ink hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-30')}
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
        )}
        {pageList(current, pageCount).map((p) =>
          typeof p === 'string' ? (
            <span key={p} className={clsx(chip, 'border border-line bg-canvas text-ink')} aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => go(p)}
              aria-current={p === current ? 'page' : undefined}
              aria-label={`Page ${p}`}
              className={clsx(
                chip,
                p === current
                  ? 'bg-mint text-mint-deep'
                  : 'border border-line bg-canvas text-ink hover:border-ink-disabled hover:bg-subtle'
              )}
            >
              {p}
            </button>
          )
        )}
        {pageCount > 1 && (
          <button
            type="button"
            onClick={() => go(current + 1)}
            disabled={current === pageCount}
            aria-label="Next page"
            className={clsx(chip, 'text-ink hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-30')}
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </nav>
  )
}
