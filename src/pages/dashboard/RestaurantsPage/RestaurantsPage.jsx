import { useCallback, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { Plus, Pencil, Trash2, Star, Store, SearchX } from 'lucide-react'
import {
  TableCard,
  Table,
  Tabs,
  FilterMenu,
  Button,
  ChipButton,
  IconButton,
  StatusPill,
  useHeaderSearch,
  useBanner,
  errorMessage,
  formatNumber,
} from '@components'
import { useGetAdminRestaurantsQuery, useExportRestaurantsMutation, useGetMetaQuery } from '@store/api'
import { saveTextFile } from '@utils'
import { AddRestaurantModal } from './AddRestaurantModal'
import { useRestaurantActions } from './useRestaurantActions'
import { RESTAURANT_STATUS_TABS, RESTAURANT_TABS, RESTAURANT_SORTS } from './restaurantMeta'

// Figma: "Showing 1–11 of 1,204".
const PAGE_SIZE = 11
const COLUMNS = 7
const NO_FILTERS = { cuisine: '', city: '', sort: '' }

// Page number that falls back to 1 whenever `key` (search / filters / tab) changes.
const usePageFor = (key) => {
  const [state, setState] = useState({ key, page: 1 })
  const page = state.key === key ? state.page : 1
  const setPage = useCallback((next) => setState({ key, page: next }), [key])
  return [page, setPage]
}

// Figma row actions by status: active → edit + delete icons; pending → Approve · Reject chips;
// suspended → Restore chip + delete. Rejected / legacy closed → Restore; Trash → Restore +
// "Remove permanently" (hard delete).
// Suspending a live restaurant is done from its page header (keeps the Figma row layout).
const RowActions = ({ r, trash, actions, onEdit }) => {
  if (trash) {
    return (
      <Table.Actions>
        <ChipButton tone="success" onClick={() => actions.restore(r)}>
          Restore
        </ChipButton>
        <IconButton icon={Trash2} label={`Remove ${r.name} permanently`} tone="danger" onClick={() => actions.purge(r)} />
      </Table.Actions>
    )
  }
  return (
    <Table.Actions>
      {r.status === 'pending' && (
        <>
          <ChipButton tone="success" onClick={() => actions.approve(r)}>
            Approve
          </ChipButton>
          <ChipButton tone="danger" onClick={() => actions.reject(r)}>
            Reject
          </ChipButton>
        </>
      )}
      {['suspended', 'rejected', 'closed'].includes(r.status) && (
        <ChipButton tone="success" onClick={() => actions.restore(r)}>
          Restore
        </ChipButton>
      )}
      {r.status === 'active' && <IconButton icon={Pencil} label={`Edit ${r.name}`} onClick={onEdit} />}
      {r.status !== 'pending' && (
        <IconButton icon={Trash2} label={`Remove ${r.name}`} tone="danger" onClick={() => actions.remove(r)} />
      )}
    </Table.Actions>
  )
}

/**
 * Restaurants (Figma 1285:9619 / 1343:26926): "All restaurants" table card with Export / Filter /
 * + Add restaurants, status tabs (incl. Trash) with counts, status-dependent row actions,
 * numbered pagination and the header search. Links: ?status=pending, ?restaurant=<id> (opens
 * the restaurant page).
 */
export const RestaurantsPage = () => {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const rawTab = params.get('status')
  const tab = RESTAURANT_TABS.includes(rawTab) ? rawTab : 'all'
  const trash = tab === 'trash'
  const linked = params.get('restaurant')

  const search = useHeaderSearch({ placeholder: 'Search restaurants by name or address' })
  const [filters, setFilters] = useState(NO_FILTERS)
  const [page, setPage] = usePageFor(`${tab}|${search}|${JSON.stringify(filters)}`)
  const [adding, setAdding] = useState(false)
  const { data: metaData } = useGetMetaQuery()
  const meta = metaData?.data

  const query = useMemo(() => {
    const q = { search: search || undefined }
    if (trash) q.deleted = true
    else q.status = tab
    Object.entries(filters).forEach(([k, v]) => {
      if (v) q[k] = v
    })
    return q
  }, [tab, trash, search, filters])

  const { data, isLoading, isFetching, isError, refetch } = useGetAdminRestaurantsQuery({
    ...query,
    page,
    limit: PAGE_SIZE,
  })
  // In the Trash view the list counts are the trash's; fetch the live counts for the tabs.
  const { data: liveData } = useGetAdminRestaurantsQuery(
    { search: query.search, cuisine: query.cuisine, city: query.city, limit: 1 },
    { skip: !trash }
  )
  const [exportRestaurants, { isLoading: exporting }] = useExportRestaurantsMutation()
  const actions = useRestaurantActions()
  const banner = useBanner()

  const restaurants = data?.data?.restaurants || []
  const pagination = data?.data?.pagination || { total: 0 }
  const counts = (trash ? liveData?.data?.counts : data?.data?.counts) || {}
  const trashCount = data?.data?.counts?.deleted

  const filterGroups = useMemo(
    () => [
      { key: 'cuisine', label: 'Category', options: meta?.cuisines || [] },
      { key: 'city', label: 'Location', options: meta?.cities || [] },
      { key: 'sort', label: 'Sort by', allLabel: 'Newest first', options: RESTAURANT_SORTS },
    ],
    [meta]
  )

  // Old links (?restaurant=<id>) open the restaurant page.
  if (linked) return <Navigate to={`/dashboard/restaurants/${linked}`} replace />

  const setTab = (value) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value === 'all') next.delete('status')
      else next.set('status', value)
      return next
    })

  const onExport = async () => {
    try {
      const { csv, filename } = await exportRestaurants(query).unwrap()
      saveTextFile(csv, filename)
    } catch (err) {
      banner.error(errorMessage(err, 'Export failed'))
    }
  }

  const tabs = RESTAURANT_STATUS_TABS.filter((t) => !t.legacy || counts[t.value] > 0 || tab === t.value).map((t) => ({
    value: t.value,
    label: t.label,
    count: t.value === 'trash' ? trashCount : counts[t.value],
  }))
  const filtered = !!search || Object.values(filters).some(Boolean) || tab !== 'all'
  const open = (r, detailTab) => navigate(`/dashboard/restaurants/${r._id}${detailTab ? `?tab=${detailTab}` : ''}`)

  return (
    <div className="flex flex-col gap-6">
      <TableCard
        title={trash ? 'Removed restaurants' : 'All restaurants'}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={onExport} loading={exporting}>
              Export
            </Button>
            <FilterMenu filters={filterGroups} value={filters} onChange={setFilters} />
            <Button size="sm" leftIcon={Plus} onClick={() => setAdding(true)}>
              Add restaurants
            </Button>
          </>
        }
        toolbar={
          <Tabs
            variant="pill"
            items={tabs}
            value={tab}
            onChange={setTab}
            aria-label="Restaurant status"
            className="max-w-full overflow-x-auto"
          />
        }
        pagination={{ page, total: pagination.total || 0, limit: PAGE_SIZE, onPageChange: setPage }}
      >
        <Table minWidth={960}>
          <Table.Header>
            <Table.Row>
              <Table.Head>Restaurant</Table.Head>
              <Table.Head>Category</Table.Head>
              <Table.Head>Location</Table.Head>
              <Table.Head>Rating</Table.Head>
              <Table.Head>Reviews</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head>Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body className={isFetching && !isLoading ? 'opacity-60 transition-opacity' : undefined}>
            {isLoading ? (
              <Table.Loading rows={PAGE_SIZE} cols={COLUMNS} avatar={false} />
            ) : isError ? (
              <Table.Empty
                colSpan={COLUMNS}
                title="Could not load restaurants"
                description="Check your connection and try again."
                action={
                  <Button size="sm" variant="outline" onClick={refetch}>
                    Retry
                  </Button>
                }
              />
            ) : restaurants.length ? (
              restaurants.map((r) => (
                <Table.Row key={r._id}>
                  <Table.Cell className="max-w-[260px]">
                    <Link to={`/dashboard/restaurants/${r._id}`} className="block truncate hover:text-brand-hover" title={r.address || r.name}>
                      {r.name}
                    </Link>
                  </Table.Cell>
                  <Table.Cell nowrap>{r.cuisines?.[0] || <span className="text-ink-disabled">—</span>}</Table.Cell>
                  <Table.Cell nowrap title={r.address || undefined}>
                    {r.city || <span className="text-ink-disabled">—</span>}
                  </Table.Cell>
                  <Table.Cell nowrap>
                    <span className="inline-flex items-center gap-2">
                      <Star className="h-4 w-4 fill-star text-star" />
                      {r.reviewCount ? Number(r.rating || 0).toFixed(1) : '—'}
                    </span>
                  </Table.Cell>
                  <Table.Cell>{formatNumber(r.reviewCount ?? 0)}</Table.Cell>
                  <Table.Cell nowrap>
                    {trash ? <StatusPill status="deleted" label="Removed" /> : <StatusPill status={r.status} entity="restaurant" />}
                    {r.temporarilyClosed && r.status === 'active' && !trash && (
                      <p className="mt-1 text-[10px] font-medium text-ink-muted">Temporarily closed</p>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <RowActions r={r} trash={trash} actions={actions} onEdit={() => open(r, 'general')} />
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Empty
                colSpan={COLUMNS}
                icon={filtered ? SearchX : Store}
                title={
                  trash
                    ? 'Trash is empty'
                    : filtered
                      ? 'No restaurants match these filters'
                      : 'No restaurants yet'
                }
                description={search ? `Nothing found for “${search}”.` : undefined}
                action={
                  !filtered && (
                    <Button size="sm" leftIcon={Plus} onClick={() => setAdding(true)}>
                      Add restaurants
                    </Button>
                  )
                }
              />
            )}
          </Table.Body>
        </Table>
      </TableCard>

      <AddRestaurantModal isOpen={adding} onClose={() => setAdding(false)} />
    </div>
  )
}
