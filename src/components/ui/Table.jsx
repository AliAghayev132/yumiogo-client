import { clsx } from 'clsx'

export const Table = ({ children, className }) => (
  <div className="overflow-x-auto">
    <table className={clsx('w-full', className)}>{children}</table>
  </div>
)

const TableHeader = ({ children, className }) => (
  <thead className={clsx('bg-gray-50', className)}>{children}</thead>
)

const TableBody = ({ children, className }) => (
  <tbody className={clsx('divide-y divide-gray-200', className)}>{children}</tbody>
)

const TableRow = ({ children, className, onClick, hoverable = true }) => (
  <tr
    className={clsx(
      hoverable && 'hover:bg-gray-50 transition-colors',
      onClick && 'cursor-pointer',
      className
    )}
    onClick={onClick}
  >
    {children}
  </tr>
)

const TableHead = ({ children, className, align = 'left' }) => (
  <th
    className={clsx(
      'px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider',
      align === 'left' && 'text-left',
      align === 'center' && 'text-center',
      align === 'right' && 'text-right',
      className
    )}
  >
    {children}
  </th>
)

const TableCell = ({ children, className, align = 'left' }) => (
  <td
    className={clsx(
      'px-4 py-4 text-sm text-gray-900',
      align === 'left' && 'text-left',
      align === 'center' && 'text-center',
      align === 'right' && 'text-right',
      className
    )}
  >
    {children}
  </td>
)

Table.Header = TableHeader
Table.Body = TableBody
Table.Row = TableRow
Table.Head = TableHead
Table.Cell = TableCell
