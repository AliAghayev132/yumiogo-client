import { createContext, useContext } from 'react'
import { clsx } from 'clsx'
import { Skeleton } from './Skeleton'
import { EmptyState } from './EmptyState'

/*
 * Figma admin tables (Users 1280:8340, Restaurants 1285:9619, Reviews, Reports):
 *  - header row: #F5F5F5, 32px, sentence case DM Sans 500 14 #757575, 24px left inset
 *  - body rows: 60px, no separators, primary values DM Sans 600 14 #212121
 *  - dividers only under the card header and above the pagination footer (TableCard).
 */
const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' }

// Rows inside <Table.Header> keep the 32px header height (no 60px body rhythm / hover).
const SectionContext = createContext('body')

/**
 * Table — Figma table. Compose with Table.Header / Body / Row / Head / Cell, plus
 * Table.Empty (full-width empty state row) and Table.Loading (skeleton rows).
 * Usually rendered inside <TableCard>.
 */
export const Table = ({ children, className, minWidth, ...props }) => (
  <div className="w-full overflow-x-auto">
    <table className={clsx('w-full border-collapse', className)} style={minWidth ? { minWidth } : undefined} {...props}>
      {children}
    </table>
  </div>
)

const TableHeader = ({ children, className }) => (
  <thead className={clsx('bg-subtle', className)}>
    <SectionContext.Provider value="head">{children}</SectionContext.Provider>
  </thead>
)

const TableBody = ({ children, className }) => <tbody className={className}>{children}</tbody>

/** Row — 60px, hover tint; `selected` highlights; `onClick` makes it clickable. */
const TableRow = ({ children, className, onClick, hoverable = true, selected = false, ...props }) => {
  const head = useContext(SectionContext) === 'head'
  return (
    <tr
      className={clsx(
        !head && 'h-[60px] transition-colors',
        !head && (selected ? 'bg-brand-soft' : hoverable && 'hover:bg-canvas'),
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </tr>
  )
}

/** Head — header cell. `align`: left | center | right; `width` fixes the column width. */
const TableHead = ({ children, className, align = 'left', width, ...props }) => (
  <th
    scope="col"
    className={clsx(
      'h-8 whitespace-nowrap px-6 text-sm font-medium leading-[18px] text-ink-muted',
      ALIGN[align],
      className
    )}
    style={width ? { width } : undefined}
    {...props}
  >
    {children}
  </th>
)

/**
 * Cell — body cell. `muted` = secondary text (400, #757575); `nowrap`; `align`.
 * Extra props (colSpan, title, …) go to the <td>.
 */
const TableCell = ({ children, className, align = 'left', muted = false, nowrap = false, ...props }) => (
  <td
    className={clsx(
      'px-6 py-2 text-sm leading-[18px]',
      muted ? 'font-normal text-ink-muted' : 'font-semibold text-ink',
      nowrap && 'whitespace-nowrap',
      ALIGN[align],
      className
    )}
    {...props}
  >
    {children}
  </td>
)

/** Actions cell content — right-aligned row of ChipButtons / IconButtons (6px gap). */
const TableActions = ({ children, className }) => (
  <div className={clsx('flex items-center justify-end gap-1.5', className)}>{children}</div>
)

/** Empty — one full-width row with an EmptyState. Pass `colSpan` = column count. */
const TableEmpty = ({ colSpan = 1, icon, title = 'Nothing here yet', description, action, className }) => (
  <tr>
    <td colSpan={colSpan} className={clsx('px-6 py-10', className)}>
      <EmptyState icon={icon} title={title} description={description} action={action} compact />
    </td>
  </tr>
)

/** Loading — skeleton rows matching the 60px rhythm (first column gets an avatar circle). */
const TableLoading = ({ rows = 6, cols = 5, avatar = true }) =>
  Array.from({ length: rows }).map((_, r) => (
    <tr key={r} className="h-[60px]">
      {Array.from({ length: cols }).map((__, c) => (
        <td key={c} className="px-6 py-2">
          {c === 0 && avatar ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-3.5 w-28" />
            </div>
          ) : (
            <Skeleton className={clsx('h-3.5', c === cols - 1 ? 'ml-auto w-16' : 'w-3/4')} />
          )}
        </td>
      ))}
    </tr>
  ))

Table.Header = TableHeader
Table.Body = TableBody
Table.Row = TableRow
Table.Head = TableHead
Table.Cell = TableCell
Table.Actions = TableActions
Table.Empty = TableEmpty
Table.Loading = TableLoading
