import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Plus, Trash2 } from 'lucide-react'
import {
  Badge,
  Button,
  ChipButton,
  FilterMenu,
  IconButton,
  StatusPill,
  Table,
  TableCard,
  relativeDay,
  useBanner,
  useHeaderSearch,
  errorMessage,
} from '@components'
import { useGetModerationReportsQuery, useExportModerationReportsMutation, useGetTaxonomiesQuery } from '@store/api'
import { saveTextFile } from '@utils'
import { AddRestaurantModal } from '../RestaurantsPage/AddRestaurantModal'
import {
  STATUS_OPTIONS,
  STATUS_VALUES,
  TYPE_OPTIONS,
  TYPE_TONES,
  TYPE_VALUES,
  isClosed,
  shortName,
  targetText,
} from './reportMeta'
import { ReportDetailModal } from './ReportDetailModal'
import { ResolveReportDialog } from './ResolveReportDialog'
import { useReportActions } from './useReportActions'

const PAGE_SIZE = 10
const COLS = 7

/**
 * Reports (Figma 1294:16216): one mixed "User reports" table (every type and status), Filter
 * (status / type / reason), header search (reason, reporter, target or "#201"), CSV export,
 * Resolve (with resolution note, review action and reporter notification) / Dismiss / View /
 * delete, and the report detail. Honours the bell links ?report=<id>, ?status= and ?type=.
 */
export const ReportsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const banner = useBanner()
  const actions = useReportActions()
  const search = useHeaderSearch({ placeholder: 'Search reports or #number' })
  const [resolving, setResolving] = useState(null)
  // Figma card header "+ Add restaurants" (same modal as the Restaurants page).
  const [addingRestaurant, setAddingRestaurant] = useState(false)

  // Filters live in the URL so bell links (?status=open, ?report=<id>) land on the right view.
  const statusParam = searchParams.get('status')
  const typeParam = searchParams.get('type')
  const filters = {
    status: STATUS_VALUES.includes(statusParam) ? statusParam : '',
    type: TYPE_VALUES.includes(typeParam) ? typeParam : '',
    reason: searchParams.get('reason') || '',
  }
  const openReportId = searchParams.get('report')

  const params = Object.fromEntries(
    Object.entries({ ...filters, search }).filter(([, value]) => value)
  )
  const filterKey = JSON.stringify(params)
  const [paging, setPaging] = useState({ key: filterKey, page: 1 })
  const page = paging.key === filterKey ? paging.page : 1
  const setPage = (p) => setPaging({ key: filterKey, page: p })

  const { data, isLoading, isFetching, isError, refetch } = useGetModerationReportsQuery({
    ...params,
    page,
    limit: PAGE_SIZE,
  })
  const { data: reasonsData } = useGetTaxonomiesQuery({ type: 'reportReason' })
  const [exportReports, { isLoading: exporting }] = useExportModerationReportsMutation()

  const reports = data?.data?.reports || []
  const counts = data?.data?.counts || {}
  const total = data?.data?.pagination?.total || 0
  const reasons = (reasonsData?.data?.items || []).map((r) => r.name)

  const updateParams = (patch, { push = false } = {}) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([name, value]) => (value ? next.set(name, value) : next.delete(name)))
    setSearchParams(next, { replace: !push })
  }
  const openReport = (id) => updateParams({ report: id }, { push: true })
  const closeReport = () => updateParams({ report: '' }, { push: true })

  const exportCsv = async () => {
    try {
      const { csv, filename } = await exportReports(params).unwrap()
      saveTextFile(csv, filename)
    } catch (err) {
      banner.error(errorMessage(err, 'Export failed'))
    }
  }

  const withCount = (options) =>
    options.map((o) => ({ ...o, label: counts[o.value] != null ? `${o.label} (${counts[o.value]})` : o.label }))

  const filterGroups = [
    { key: 'status', label: 'Status', options: withCount(STATUS_OPTIONS) },
    { key: 'type', label: 'Type', options: TYPE_OPTIONS },
    ...(reasons.length ? [{ key: 'reason', label: 'Reason', options: reasons }] : []),
  ]
  const hasFilters = !!(search || filters.status || filters.type || filters.reason)

  return (
    <>
      <TableCard
        title="User reports"
        actions={
          <>
            <Button size="sm" variant="outline" loading={exporting} onClick={exportCsv}>
              Export
            </Button>
            <FilterMenu filters={filterGroups} value={filters} onChange={(next) => updateParams(next)} />
            <Button size="sm" leftIcon={Plus} onClick={() => setAddingRestaurant(true)}>
              Add restaurants
            </Button>
          </>
        }
        pagination={{ page, total, limit: PAGE_SIZE, onPageChange: setPage }}
      >
        <Table minWidth={960} className={isFetching && !isLoading ? 'opacity-60 transition-opacity' : undefined}>
          <Table.Header>
            <Table.Row>
              <Table.Head width={224}>Reported by</Table.Head>
              <Table.Head width={148}>Type</Table.Head>
              <Table.Head width={172}>Target</Table.Head>
              <Table.Head>Reason</Table.Head>
              <Table.Head width={148}>Status</Table.Head>
              <Table.Head width={112}>Date</Table.Head>
              {/* Figma: the Actions label sits at the column start, the buttons are right-aligned. */}
              <Table.Head width={140}>Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading ? (
              <Table.Loading rows={5} cols={COLS} avatar={false} />
            ) : isError ? (
              <Table.Empty
                colSpan={COLS}
                title="Could not load reports"
                action={
                  <Button size="sm" variant="outline" onClick={refetch}>
                    Try again
                  </Button>
                }
              />
            ) : reports.length ? (
              reports.map((report) => (
                <Table.Row key={report._id}>
                  <Table.Cell nowrap>{shortName(report.reporter)}</Table.Cell>
                  <Table.Cell>
                    <StatusPill status={report.targetType} entity="reportType" tone={TYPE_TONES[report.targetType]} />
                  </Table.Cell>
                  <Table.Cell>
                    <button
                      type="button"
                      onClick={() => openReport(report._id)}
                      className="block max-w-[172px] truncate text-left outline-none hover:underline focus-visible:underline"
                      title={`Open Report #${report.number}`}
                    >
                      {targetText(report)}
                    </button>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="inline-flex max-w-[220px] items-center gap-1.5">
                      <span className="truncate" title={report.description || report.reason}>
                        {report.reason}
                      </span>
                      {report.target?.isDeleted && (
                        <Badge tone="neutral" size="sm">
                          Removed
                        </Badge>
                      )}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <StatusPill status={report.status} entity="report" />
                  </Table.Cell>
                  <Table.Cell nowrap>{relativeDay(report.createdAt)}</Table.Cell>
                  <Table.Cell>
                    <Table.Actions>
                      {isClosed(report) ? (
                        <ChipButton onClick={() => openReport(report._id)}>View</ChipButton>
                      ) : (
                        <ChipButton tone="success" onClick={() => setResolving(report)}>
                          Resolve
                        </ChipButton>
                      )}
                      {report.status === 'open' && (
                        <IconButton
                          icon={Trash2}
                          label={`Delete Report #${report.number}`}
                          tone="danger"
                          onClick={() => actions.remove(report)}
                        />
                      )}
                    </Table.Actions>
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Empty
                colSpan={COLS}
                title={hasFilters ? 'No reports match these filters' : 'No reports yet'}
                description={
                  search
                    ? `Nothing found for “${search}”.`
                    : hasFilters
                      ? undefined
                      : 'Reports people send from the app about reviews, users, restaurants and lists appear here.'
                }
              />
            )}
          </Table.Body>
        </Table>
      </TableCard>

      <AddRestaurantModal isOpen={addingRestaurant} onClose={() => setAddingRestaurant(false)} />
      <ReportDetailModal
        key={openReportId || 'none'}
        reportId={openReportId}
        onClose={closeReport}
        onResolve={setResolving}
        onOpenReport={(id) => updateParams({ report: id })}
      />
      <ResolveReportDialog report={resolving} onClose={() => setResolving(null)} />
    </>
  )
}
