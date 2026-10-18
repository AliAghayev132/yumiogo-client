import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import {
  Badge,
  Button,
  FilterMenu,
  IconButton,
  OrderButtons,
  StatusPill,
  Switch,
  Table,
  TableCard,
  Tabs,
  TAXONOMY_TYPES,
  TranslationBadge,
  documentTranslationStatus,
  useBatchedReorder,
  useBanner,
  useConfirm,
  useHeaderSearch,
  errorMessage,
} from '@components'
import {
  useGetTaxonomiesQuery,
  useUpdateTaxonomyMutation,
  useDeleteTaxonomyMutation,
  useReorderTaxonomiesMutation,
  useDeleteReviewLabelMutation,
  useGetLabelRequestsQuery,
} from '@store/api'
import { ItemVisual } from './ItemVisual'
import { TaxonomyFormModal } from './TaxonomyFormModal'
import { LabelRequestsPanel } from './LabelRequestsPanel'
import { HELP, PREFERENCE_TYPES, plural, usageNoun } from './taxonomyMeta'

const STATUS_FILTER = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

/** The catalog list for one type: search, filter, reorder, create / edit / delete. */
const TaxonomyList = ({ type }) => {
  const config = TAXONOMY_TYPES[type]
  const isCuisine = type === 'cuisine'
  const isLabel = type === 'reviewLabel'
  // Cuisines and dietary items can be offered on the app's onboarding preference page.
  const isPreference = PREFERENCE_TYPES.includes(type)
  const noun = usageNoun(type)
  const search = useHeaderSearch({ placeholder: `Search ${config.label.toLowerCase()}` })

  const [filters, setFilters] = useState({ status: '', group: '' })
  const [editing, setEditing] = useState(undefined) // undefined = closed, null = create, obj = edit
  const [togglingId, setTogglingId] = useState(null)
  const { data, isLoading, isError, refetch } = useGetTaxonomiesQuery({ type })
  const [updateTaxonomy] = useUpdateTaxonomyMutation()
  const [deleteTaxonomy] = useDeleteTaxonomyMutation()
  const [deleteReviewLabel] = useDeleteReviewLabelMutation()
  const [reorderTaxonomies] = useReorderTaxonomiesMutation()
  const banner = useBanner()
  const confirm = useConfirm()

  const items = data?.data?.items
  const { list, move } = useBatchedReorder(items || [], async (ids) => {
    try {
      await reorderTaxonomies({ type, ids }).unwrap()
    } catch (err) {
      banner.error(errorMessage(err, 'Could not save the new order'))
      throw err
    }
  })

  const groups = [...new Set(list.map((i) => i.group).filter(Boolean))]
  const query = search.toLowerCase()
  const visible = list.filter(
    (i) =>
      (!query || i.name.toLowerCase().includes(query) || i.slug?.includes(query) || i.group?.toLowerCase().includes(query)) &&
      (!filters.status || (filters.status === 'active') === !!i.isActive) &&
      (!filters.group || i.group === filters.group)
  )
  const filtered = visible.length !== list.length
  const inactiveCount = list.filter((i) => !i.isActive).length
  const onboardingCount = list.filter((i) => i.isActive && i.showInOnboarding).length
  const cols = 6 + (isCuisine ? 1 : 0) + (isLabel ? 1 : 0) + (isPreference ? 1 : 0)

  const toggleOnboarding = async (item) => {
    setTogglingId(item._id)
    try {
      await updateTaxonomy({ id: item._id, showInOnboarding: !item.showInOnboarding }).unwrap()
      banner.success(
        item.showInOnboarding
          ? `${item.name} removed from the onboarding preferences`
          : `${item.name} added to the onboarding preferences`
      )
    } catch (err) {
      banner.error(errorMessage(err, 'Update failed'))
    } finally {
      setTogglingId(null)
    }
  }

  const toggleHome = async (item) => {
    setTogglingId(item._id)
    try {
      await updateTaxonomy({ id: item._id, showOnHome: !item.showOnHome }).unwrap()
      banner.success(item.showOnHome ? `${item.name} removed from the Home rail` : `${item.name} added to the Home rail`)
    } catch (err) {
      banner.error(errorMessage(err, 'Update failed'))
    } finally {
      setTogglingId(null)
    }
  }

  const remove = async (item) => {
    const count = item.usageCount || 0
    let notice
    if (type === 'reportReason' && count) {
      notice = `${plural(count, 'report')} use this reason. They keep their reason text.`
    } else if (isLabel && count) {
      notice = `It is on ${plural(count, 'review')}. Deleting it removes it from ${count === 1 ? 'that review' : 'those reviews'}. To stop offering it without changing reviews, deactivate it instead.`
    } else if (count) {
      notice =
        `It is used by ${plural(count, 'restaurant')}. Deleting it removes it from ` +
        `${count === 1 ? 'that restaurant' : 'all of them'}` +
        `${PREFERENCE_TYPES.includes(type) ? " and from users' food preferences" : ''}. ` +
        'To hide it without changing restaurants, deactivate it instead.'
    }
    const ok = await confirm({
      tone: 'danger',
      icon: Trash2,
      title: `Delete ${item.name}?`,
      message: `"${item.name}" will be removed from ${config.label.toLowerCase()}.`,
      notice,
      confirmText: 'Delete',
      onConfirm: () => (isLabel ? deleteReviewLabel(item._id) : deleteTaxonomy(item._id)).unwrap(),
    })
    if (ok) banner.success(`${item.name} deleted`)
  }

  const filterGroups = [
    { key: 'status', label: 'Status', options: STATUS_FILTER },
    ...(isLabel && groups.length ? [{ key: 'group', label: 'Group', options: groups }] : []),
  ]

  return (
    <>
      <TableCard
        title={`All ${(config.plural || config.label).toLowerCase()}`}
        subtitle={<span className="block max-w-2xl">{HELP[type]}</span>}
        actions={
          <>
            <span className="text-xs text-ink-muted">
              {plural(list.length, 'item')}
              {inactiveCount ? ` · ${inactiveCount} inactive` : ''}
              {isPreference && !isLoading
                ? onboardingCount
                  ? ` · ${onboardingCount} in onboarding`
                  : ' · onboarding shows all'
                : ''}
            </span>
            <FilterMenu filters={filterGroups} value={filters} onChange={setFilters} />
            <Button size="sm" leftIcon={Plus} onClick={() => setEditing(null)}>
              Add {config.singular.toLowerCase()}
            </Button>
          </>
        }
        pagination={{
          page: 1,
          total: visible.length,
          limit: Math.max(visible.length, 1),
          itemLabel: config.label.toLowerCase(),
        }}
      >
        <Table minWidth={isLabel || isPreference ? 960 : 800}>
          <Table.Header>
            <Table.Row>
              <Table.Head width={96}>Order</Table.Head>
              <Table.Head>{config.singular}</Table.Head>
              {isLabel && <Table.Head width={180}>Group</Table.Head>}
              <Table.Head width={200}>Slug</Table.Head>
              <Table.Head align="center" width={120}>
                {noun === 'report' ? 'Reports' : noun === 'review' ? 'Reviews' : 'Restaurants'}
              </Table.Head>
              {isCuisine && (
                <Table.Head align="center" width={96}>
                  Home
                </Table.Head>
              )}
              {isPreference && (
                <Table.Head align="center" width={112}>
                  Onboarding
                </Table.Head>
              )}
              <Table.Head width={112}>Status</Table.Head>
              <Table.Head align="right" width={120}>
                Actions
              </Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading ? (
              <Table.Loading rows={6} cols={cols} avatar={false} />
            ) : isError ? (
              <Table.Empty
                colSpan={cols}
                title={`Could not load ${config.label.toLowerCase()}`}
                action={
                  <Button size="sm" variant="outline" onClick={refetch}>
                    Try again
                  </Button>
                }
              />
            ) : visible.length ? (
              visible.map((item, index) => (
                <Table.Row key={item._id} className={item.isActive ? undefined : 'opacity-60'}>
                  <Table.Cell>
                    <OrderButtons index={index} count={visible.length} onMove={move} disabled={filtered} />
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      <ItemVisual item={item} />
                      <div className="min-w-0">
                        <p className="inline-flex items-center gap-1.5">
                          {item.color && (
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                          )}
                          {item.name}
                          <TranslationBadge
                            status={documentTranslationStatus(
                              item,
                              isLabel ? ['name', 'description', 'group'] : ['name', 'description']
                            )}
                          />
                        </p>
                        {item.description && (
                          <p className="line-clamp-1 max-w-xs text-xs font-normal text-ink-muted">{item.description}</p>
                        )}
                      </div>
                    </div>
                  </Table.Cell>
                  {isLabel && (
                    <Table.Cell>
                      {item.group ? (
                        <Badge tone="info" size="md">
                          {item.group}
                        </Badge>
                      ) : (
                        <span className="text-ink-placeholder">—</span>
                      )}
                    </Table.Cell>
                  )}
                  <Table.Cell muted className="font-mono text-xs">
                    {item.slug}
                  </Table.Cell>
                  <Table.Cell align="center">{item.usageCount ?? 0}</Table.Cell>
                  {isCuisine && (
                    <Table.Cell align="center">
                      <Switch
                        size="sm"
                        checked={!!item.showOnHome}
                        onChange={() => toggleHome(item)}
                        disabled={togglingId === item._id}
                        label={item.showOnHome ? 'Shown in the Home rail' : 'Hidden from the Home rail'}
                      />
                    </Table.Cell>
                  )}
                  {isPreference && (
                    <Table.Cell align="center">
                      <Switch
                        size="sm"
                        checked={!!item.showInOnboarding}
                        onChange={() => toggleOnboarding(item)}
                        disabled={togglingId === item._id}
                        label={
                          item.showInOnboarding
                            ? 'Offered on the onboarding preference page'
                            : 'Not offered on the onboarding preference page'
                        }
                      />
                    </Table.Cell>
                  )}
                  <Table.Cell>
                    <StatusPill status={item.isActive ? 'active' : 'inactive'} />
                  </Table.Cell>
                  <Table.Cell>
                    <Table.Actions>
                      <IconButton icon={Pencil} label={`Edit ${item.name}`} onClick={() => setEditing(item)} />
                      <IconButton icon={Trash2} label={`Delete ${item.name}`} tone="danger" onClick={() => remove(item)} />
                    </Table.Actions>
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Empty
                colSpan={cols}
                title={filtered || query ? `No ${config.label.toLowerCase()} match` : `No ${config.label.toLowerCase()} yet`}
                description={query ? `Nothing found for “${search}”.` : undefined}
                action={
                  !filtered &&
                  !query && (
                    <Button size="sm" leftIcon={Plus} onClick={() => setEditing(null)}>
                      Add {config.singular.toLowerCase()}
                    </Button>
                  )
                }
              />
            )}
          </Table.Body>
        </Table>
      </TableCard>

      {filtered && list.length > 1 && (
        <p className="mt-3 text-xs text-ink-muted">Clear the search and filters to change the order.</p>
      )}

      {editing !== undefined && (
        <TaxonomyFormModal type={type} item={editing} groups={groups} onClose={() => setEditing(undefined)} />
      )}
    </>
  )
}

/** Review labels: the label list plus the queue of label ideas sent from the app (?tab=requests). */
const ReviewLabelsView = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'requests' ? 'requests' : 'labels'
  const { data } = useGetLabelRequestsQuery({ status: 'pending', limit: 1 })
  const pending = data?.data?.counts?.pending

  const setTab = (value) => {
    const next = new URLSearchParams(searchParams)
    if (value === 'requests') next.set('tab', 'requests')
    else next.delete('tab')
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        variant="underline"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'labels', label: 'Labels' },
          { value: 'requests', label: 'Label requests', count: pending || undefined },
        ]}
      />
      {tab === 'labels' ? <TaxonomyList type="reviewLabel" /> : <LabelRequestsPanel />}
    </div>
  )
}

/**
 * Catalog list for one taxonomy type (/dashboard/catalog/:type): cuisines, features, tags,
 * dietary, dining options, moods, report reasons and review labels (with groups and the
 * label-request queue).
 */
export const TaxonomyPage = ({ type: typeProp }) => {
  const params = useParams()
  const type = typeProp ?? params.type
  if (type === 'reviewLabel') return <ReviewLabelsView />
  return <TaxonomyList type={type} />
}
