import { clsx } from 'clsx'
import { SearchInput } from './SearchInput'
import { Pagination } from './Pagination'

/**
 * TableCard — Figma list card (Users / Restaurants / Reviews / Reports):
 * white card (radius 12, #E0E0E0 border) → header row [title (+ subtitle) | search | actions]
 * (padding 12/18, DM Sans 700 14 title, 32px sm buttons with 16px gaps) → full-width divider
 * → optional toolbar row → table → divider → pagination footer.
 *
 *   <TableCard
 *     title="All users"
 *     actions={<>
 *       <Button size="sm" variant="outline" onClick={exportCsv}>Export</Button>
 *       <FilterMenu … />
 *       <Button size="sm" leftIcon={Plus} onClick={openAdd}>Add user</Button>
 *     </>}
 *     pagination={{ page, total, limit, onPageChange: setPage }}
 *   >
 *     <Table>…</Table>
 *   </TableCard>
 *
 * Props: title, subtitle, actions, search ({ value, onChange(value), placeholder } — a
 * card-level search box; pages normally use the header search via useHeaderSearch instead),
 * toolbar (row under the header, e.g. active-filter chips), pagination (Pagination props) or
 * footer (custom node), children, className, bodyClassName.
 */
export const TableCard = ({
  title,
  subtitle,
  actions,
  search,
  toolbar,
  pagination,
  footer,
  children,
  className,
  bodyClassName,
}) => {
  const hasHeader = title || subtitle || actions || search
  return (
    <section className={clsx('overflow-hidden rounded-xl border border-line bg-surface', className)}>
      {hasHeader && (
        <div className="flex min-h-[72px] flex-wrap items-center gap-x-4 gap-y-3 border-b border-line px-[18px] py-3">
          <div className="mr-auto min-w-0">
            {title && <h2 className="truncate text-sm font-bold leading-[18px] text-ink">{title}</h2>}
            {subtitle && (
              <p className="mt-0.5 font-chart text-xs leading-4 tracking-[-0.02em] text-ink-muted">{subtitle}</p>
            )}
          </div>
          {search && (
            <SearchInput
              size="sm"
              value={search.value}
              onChange={(e) => search.onChange?.(e.target.value)}
              onClear={() => search.onChange?.('')}
              placeholder={search.placeholder || 'Search'}
              className="w-full sm:w-64"
            />
          )}
          {actions && <div className="flex flex-wrap items-center gap-4">{actions}</div>}
        </div>
      )}
      {toolbar && <div className="border-b border-line px-[18px] py-3">{toolbar}</div>}
      <div className={bodyClassName}>{children}</div>
      {pagination ? <Pagination {...pagination} /> : footer ? <div className="border-t border-line">{footer}</div> : null}
    </section>
  )
}
