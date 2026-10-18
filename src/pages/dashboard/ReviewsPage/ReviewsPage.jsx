import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Image as ImageIcon, MoreVertical, Plus, RotateCcw, Star, Tags, Trash2, Lightbulb, User, X } from 'lucide-react'
import {
  Badge,
  Button,
  ChipButton,
  relativeDay,
  DropdownMenu,
  FilterMenu,
  IconButton,
  StatusPill,
  Table,
  TableCard,
  Tabs,
  UserCell,
  useBanner,
  useHeaderSearch,
  errorMessage,
} from '@components'
import {
  useGetModerationReviewsQuery,
  useExportModerationReviewsMutation,
  useGetAdminSettingsQuery,
  useGetLabelRequestsQuery,
} from '@store/api'
import { mergeSentiments } from '@store/hooks'
import { saveTextFile } from '@utils'
import { AddRestaurantModal } from '../RestaurantsPage/AddRestaurantModal'
import { DATE_OPTIONS, SORT_OPTIONS, STATUS_TABS, STATUS_VALUES, reviewQueryParams } from './reviewFilters'
import { RestaurantFilter } from './RestaurantFilter'
import { DateRangeFields } from './DateRangeFields'
import { ReviewDetailModal } from './ReviewDetailModal'
import { useReviewActions } from './useReviewActions'

const PAGE_SIZE = 10
const COLS = 8
const NO_RANGE = { from: '', to: '' }

const EMPTY_TITLES = {
  all: 'No reviews yet',
  pending: 'No reviews waiting for approval',
  flagged: 'No flagged reviews',
  approved: 'No approved reviews',
  rejected: 'No rejected reviews',
}

/**
 * Reviews (Figma 1291:11978): "Review moderation" table card — status tabs with counts,
 * Filter (sentiment / date / sort) + restaurant filter, header search (text, author,
 * restaurant or "#123"), CSV export, Approve / Delete row actions (Figma modalBoxes and
 * snackbars) and the review detail (?review=<id>) with flag / reject / comments / reports.
 * Honours the bell links ?status=<status> and ?review=<id>, and the detail-page links
 * ?restaurant=<id> / ?user=<id> (read from the URL on every change, not only on mount).
 */
export const ReviewsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const banner = useBanner()
  const actions = useReviewActions()
  const search = useHeaderSearch({ placeholder: 'Search reviews or #number' })

  const statusParam = searchParams.get('status')
  const status = STATUS_VALUES.includes(statusParam) ? statusParam : 'all'
  const openReviewId = searchParams.get('review')
  const restaurantParam = searchParams.get('restaurant')
  const userParam = searchParams.get('user')

  const [filters, setFilters] = useState({ sentiment: '', date: '', sort: '' })
  const [range, setRange] = useState(NO_RANGE)
  // Figma card header "+ Add restaurants" (same modal as the Restaurants page).
  const [addingRestaurant, setAddingRestaurant] = useState(false)
  // Names of restaurants picked in the filter (the URL only carries the id).
  const [restaurantNames, setRestaurantNames] = useState({})
  const restaurant = restaurantParam ? { _id: restaurantParam, name: restaurantNames[restaurantParam] || '' } : null

  const params = reviewQueryParams({ status, search, filters, restaurant, user: userParam, range })
  // Any filter change starts again from page 1 (no effect needed: the page is keyed to the filters).
  const filterKey = JSON.stringify(params)
  const [paging, setPaging] = useState({ key: filterKey, page: 1 })
  const page = paging.key === filterKey ? paging.page : 1
  const setPage = (p) => setPaging({ key: filterKey, page: p })

  const { data, isLoading, isFetching, isError, refetch } = useGetModerationReviewsQuery({
    ...params,
    page,
    limit: PAGE_SIZE,
  })
  const { data: settingsData } = useGetAdminSettingsQuery()
  const { data: requestsData } = useGetLabelRequestsQuery({ status: 'pending', limit: 1 })
  const [exportReviews, { isLoading: exporting }] = useExportModerationReviewsMutation()

  const sentiments = useMemo(() => mergeSentiments(settingsData?.data?.settings?.sentiments), [settingsData])
  const sentimentByKey = Object.fromEntries(sentiments.map((s) => [s.key, s]))
  const reviews = data?.data?.reviews || []
  const counts = data?.data?.counts || {}
  const total = data?.data?.pagination?.total || 0
  const pendingRequests = requestsData?.data?.counts?.pending || 0
  const hasFilters = !!(search || restaurant || userParam || Object.values(filters).some(Boolean))

  // A ?restaurant=<id> link only carries the id: take the name from the loaded rows.
  const restaurantLabel =
    restaurant && !restaurant.name
      ? { ...restaurant, name: reviews.find((r) => r.restaurant?._id === restaurant._id)?.restaurant?.name || 'Selected restaurant' }
      : restaurant
  // ?user=<id> (User detail → "View all"): the author's name from the loaded rows.
  const author = userParam ? reviews.find((r) => r.user?._id === userParam)?.user : null

  // Opening / closing the detail is a history entry; filter changes replace the current one.
  const updateParams = (patch, { push = false } = {}) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([name, value]) => (value ? next.set(name, value) : next.delete(name)))
    setSearchParams(next, { replace: !push })
  }

  const setStatus = (value) => updateParams({ status: value === 'all' ? '' : value })
  const openReview = (review) => updateParams({ review: review._id }, { push: true })
  const closeReview = () => updateParams({ review: '' }, { push: true })
  const changeRestaurant = (value) => {
    if (value?._id) setRestaurantNames((names) => ({ ...names, [value._id]: value.name }))
    updateParams({ restaurant: value?._id || '' })
  }
  const changeFilters = (next) => {
    if (next.date !== 'custom') setRange(NO_RANGE)
    setFilters(next)
  }

  const exportCsv = async () => {
    try {
      const { csv, filename } = await exportReviews(params).unwrap()
      saveTextFile(csv, filename)
    } catch (err) {
      banner.error(errorMessage(err, 'Export failed'))
    }
  }

  const filterGroups = [
    {
      key: 'sentiment',
      label: 'Sentiment',
      options: sentiments.map((s) => ({ value: s.key, label: `${s.emoji} ${s.label}` })),
    },
    { key: 'date', label: 'Date', allLabel: 'Any time', options: DATE_OPTIONS },
    { key: 'sort', label: 'Sort', allLabel: 'Newest first', options: SORT_OPTIONS },
  ]

  const moreItems = [
    { label: 'Recalculate all ratings', icon: RotateCcw, onSelect: () => actions.recalculate() },
    { divider: true },
    { label: 'Review labels', icon: Tags, onSelect: () => navigate('/dashboard/catalog/reviewLabel') },
    {
      label: pendingRequests ? `Label requests (${pendingRequests})` : 'Label requests',
      icon: Lightbulb,
      onSelect: () => navigate('/dashboard/catalog/reviewLabel?tab=requests'),
    },
  ]

  return (
    <>
      <TableCard
        title="Review moderation"
        actions={
          <>
            <Button size="sm" variant="outline" loading={exporting} onClick={exportCsv}>
              Export
            </Button>
            <FilterMenu filters={filterGroups} value={filters} onChange={changeFilters} />
            <Button size="sm" leftIcon={Plus} onClick={() => setAddingRestaurant(true)}>
              Add restaurants
            </Button>
            <DropdownMenu
              trigger={<IconButton icon={MoreVertical} label="More review tools" />}
              items={moreItems}
              width={240}
            />
          </>
        }
        toolbar={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="max-w-full overflow-x-auto scrollbar-thin">
              <Tabs
                variant="pill"
                value={status}
                onChange={setStatus}
                aria-label="Review status"
                items={STATUS_TABS.map((t) => ({ ...t, count: counts[t.value] ?? undefined }))}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {filters.date === 'custom' && (
                <DateRangeFields
                  value={range}
                  onChange={setRange}
                  onClear={() => changeFilters({ ...filters, date: '' })}
                />
              )}
              {userParam && (
                <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-brand/60 bg-brand-soft pl-3 pr-1 text-sm font-semibold text-ink">
                  <User className="h-4 w-4" />
                  <span className="max-w-[160px] truncate">
                    {author ? [author.firstName, author.lastName].filter(Boolean).join(' ') : 'Selected user'}
                  </span>
                  <IconButton icon={X} label="Clear author filter" size="xs" onClick={() => updateParams({ user: '' })} />
                </span>
              )}
              <RestaurantFilter value={restaurantLabel} onChange={changeRestaurant} />
            </div>
          </div>
        }
        pagination={{ page, total, limit: PAGE_SIZE, onPageChange: setPage }}
      >
        <Table minWidth={1120} className={isFetching && !isLoading ? 'opacity-60 transition-opacity' : undefined}>
          <Table.Header>
            <Table.Row>
              <Table.Head width={80}>No.</Table.Head>
              <Table.Head width={224}>User</Table.Head>
              <Table.Head width={200}>Restaurant</Table.Head>
              <Table.Head width={112}>Rating</Table.Head>
              <Table.Head>Reviews</Table.Head>
              <Table.Head width={164}>Status</Table.Head>
              <Table.Head width={104}>Date</Table.Head>
              {/* Figma: the Actions label sits at the column start, the buttons are right-aligned. */}
              <Table.Head width={150}>Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading ? (
              <Table.Loading rows={6} cols={COLS} />
            ) : isError ? (
              <Table.Empty
                colSpan={COLS}
                title="Could not load reviews"
                action={
                  <Button size="sm" variant="outline" onClick={refetch}>
                    Try again
                  </Button>
                }
              />
            ) : reviews.length ? (
              reviews.map((review) => {
                const sentiment = sentimentByKey[review.sentiment]
                return (
                  <Table.Row key={review._id}>
                    <Table.Cell nowrap>
                      <span className="text-ink-muted">{review.number ? `#${review.number}` : '—'}</span>
                    </Table.Cell>
                    <Table.Cell>
                      {review.user ? (
                        <UserCell user={review.user} short />
                      ) : (
                        <UserCell name="Deleted user" />
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <span className="block max-w-[200px] truncate" title={review.restaurant?.name}>
                        {review.restaurant?.name || '—'}
                      </span>
                    </Table.Cell>
                    <Table.Cell nowrap>
                      <span className="inline-flex items-center gap-3" title={sentiment?.label}>
                        <Star className="h-4 w-4 fill-star text-star" aria-hidden="true" />
                        {review.score}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <button
                        type="button"
                        onClick={() => openReview(review)}
                        className="flex max-w-[320px] items-center gap-2 text-left hover:underline focus-visible:underline outline-none"
                        title={`Open Review #${review.number}`}
                      >
                        <span className="truncate">
                          {review.comment || (
                            <span className="font-normal text-ink-muted">
                              {sentiment?.emoji} {sentiment?.label || review.sentiment}
                            </span>
                          )}
                        </span>
                        {review.photos?.length > 0 && (
                          <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-normal text-ink-muted">
                            <ImageIcon className="h-3.5 w-3.5" />
                            {review.photos.length}
                          </span>
                        )}
                      </button>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="inline-flex flex-wrap items-center gap-1.5">
                        <StatusPill status={review.status} entity="review" />
                        {review.openReports > 0 && (
                          <Badge tone="error" size="sm" title="Open reports about this review">
                            {review.openReports} report{review.openReports === 1 ? '' : 's'}
                          </Badge>
                        )}
                      </span>
                    </Table.Cell>
                    <Table.Cell nowrap>
                      <span title={new Date(review.createdAt).toLocaleString('en-US')}>{relativeDay(review.createdAt)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <Table.Actions>
                        {review.status !== 'approved' && (
                          <ChipButton tone="success" onClick={() => actions.approve(review)}>
                            Approve
                          </ChipButton>
                        )}
                        <IconButton
                          icon={Trash2}
                          label={`Delete Review #${review.number}`}
                          tone="danger"
                          onClick={() => actions.remove(review)}
                        />
                      </Table.Actions>
                    </Table.Cell>
                  </Table.Row>
                )
              })
            ) : (
              <Table.Empty
                colSpan={COLS}
                title={hasFilters ? 'No reviews match these filters' : EMPTY_TITLES[status]}
                description={search ? `Nothing found for “${search}”.` : undefined}
              />
            )}
          </Table.Body>
        </Table>
      </TableCard>

      <AddRestaurantModal isOpen={addingRestaurant} onClose={() => setAddingRestaurant(false)} />
      <ReviewDetailModal key={openReviewId || 'none'} reviewId={openReviewId} sentiments={sentiments} onClose={closeReview} />
    </>
  )
}
