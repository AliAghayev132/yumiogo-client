import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Trash2 } from 'lucide-react'
import {
  Badge,
  Button,
  ChipButton,
  IconButton,
  Table,
  TableCard,
  Tabs,
  UserCell,
  formatNumber,
  relativeDay,
  useHeaderSearch,
} from '@components'
import { useGetAdminListsQuery } from '@store/api'
import { LIST_TABS, PRIVACY, TAB_VALUES, tabParams } from './listMeta'
import { ListDetailModal } from './ListDetailModal'
import { useListActions } from './useListActions'

// Figma list pages: "Showing 1–11 of N".
const PAGE_SIZE = 11
const COLS = 7

/**
 * Lists (Management → Lists): moderation of people's favourite lists. Public and collaborative
 * lists appear in feeds and share links, so they can be searched (list name, owner name or
 * e-mail from the header search), filtered by privacy, opened (restaurants, collaborators,
 * reports) and removed with a reason (the owner is notified, open reports are resolved).
 * Links: ?tab=public|collaborative|private|removed, ?owner=<userId>, ?list=<id> opens a list.
 */
export const ListsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const actions = useListActions()
  const search = useHeaderSearch({ placeholder: 'Search lists or owners' })

  const tabParam = searchParams.get('tab')
  const tab = TAB_VALUES.includes(tabParam) ? tabParam : 'all'
  const owner = searchParams.get('owner') || ''
  const openListId = searchParams.get('list')

  const params = { ...tabParams(tab), ...(owner ? { owner } : {}), ...(search ? { search } : {}) }
  const filterKey = JSON.stringify(params)
  const [paging, setPaging] = useState({ key: filterKey, page: 1 })
  const page = paging.key === filterKey ? paging.page : 1
  const setPage = (p) => setPaging({ key: filterKey, page: p })

  const { data, isLoading, isFetching, isError, refetch } = useGetAdminListsQuery({ ...params, page, limit: PAGE_SIZE })
  const lists = data?.data?.lists || []
  const counts = data?.data?.counts || {}
  const total = data?.data?.pagination?.total || 0

  const updateParams = (patch, { push = false } = {}) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([name, value]) => (value ? next.set(name, value) : next.delete(name)))
    setSearchParams(next, { replace: !push })
  }
  const openList = (id) => updateParams({ list: id }, { push: true })
  const closeList = () => updateParams({ list: '' }, { push: true })

  const ownerRow = owner && lists[0]?.owner?._id === owner ? lists[0].owner : null
  const filtering = !!(search || owner || tab !== 'all')

  return (
    <>
      <TableCard
        title="All lists"
        subtitle={
          owner ? (
            <span>
              Lists of {ownerRow ? [ownerRow.firstName, ownerRow.lastName].filter(Boolean).join(' ') : 'one user'} ·{' '}
              <button type="button" className="font-semibold text-brand-hover hover:underline" onClick={() => updateParams({ owner: '' })}>
                Show everyone&apos;s
              </button>
            </span>
          ) : undefined
        }
        toolbar={
          <Tabs
            variant="pill"
            items={LIST_TABS.map((t) => ({ value: t.value, label: t.label, count: counts[t.count] ?? undefined }))}
            value={tab}
            onChange={(v) => updateParams({ tab: v === 'all' ? '' : v })}
            aria-label="List privacy"
            className="max-w-full overflow-x-auto"
          />
        }
        pagination={{ page, total, limit: PAGE_SIZE, onPageChange: setPage, itemLabel: 'lists' }}
      >
        <Table minWidth={960} className={isFetching && !isLoading ? 'opacity-60 transition-opacity' : undefined}>
          <Table.Header>
            <Table.Row>
              <Table.Head>List</Table.Head>
              <Table.Head width={224}>Owner</Table.Head>
              <Table.Head width={136}>Privacy</Table.Head>
              <Table.Head width={120}>Restaurants</Table.Head>
              <Table.Head width={96}>Saves</Table.Head>
              <Table.Head width={112}>Updated</Table.Head>
              {/* Figma: the Actions label sits at the column start, the buttons are right-aligned. */}
              <Table.Head width={120}>Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading ? (
              <Table.Loading rows={6} cols={COLS} avatar={false} />
            ) : isError ? (
              <Table.Empty
                colSpan={COLS}
                title="Could not load the lists"
                action={
                  <Button size="sm" variant="outline" onClick={refetch}>
                    Try again
                  </Button>
                }
              />
            ) : lists.length ? (
              lists.map((list) => {
                const privacy = PRIVACY[list.privacy] || PRIVACY.private
                return (
                  <Table.Row key={list._id}>
                    <Table.Cell>
                      <span className="flex min-w-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openList(list._id)}
                          className="max-w-[260px] truncate text-left outline-none hover:underline focus-visible:underline"
                          title={list.name}
                        >
                          {list.name}
                        </button>
                        {list.isDefault && (
                          <Badge tone="neutral" size="sm">
                            Default
                          </Badge>
                        )}
                        {list.openReports > 0 && (
                          <Badge tone="error" size="sm" title="Open reports about this list">
                            {list.openReports} {list.openReports === 1 ? 'report' : 'reports'}
                          </Badge>
                        )}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      {list.owner ? (
                        <UserCell user={list.owner} short />
                      ) : (
                        <span className="text-sm font-normal text-ink-muted">Deleted user</span>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge tone={privacy.tone} size="sm">
                        {privacy.label}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>{formatNumber(list.itemCount)}</Table.Cell>
                    <Table.Cell>{formatNumber(list.saveCount)}</Table.Cell>
                    <Table.Cell nowrap>{relativeDay(list.isDeleted ? list.deletedAt || list.updatedAt : list.updatedAt)}</Table.Cell>
                    <Table.Cell>
                      <Table.Actions>
                        <ChipButton onClick={() => openList(list._id)}>View</ChipButton>
                        {!list.isDeleted && (
                          <IconButton icon={Trash2} label={`Remove ${list.name}`} tone="danger" onClick={() => actions.remove(list)} />
                        )}
                      </Table.Actions>
                    </Table.Cell>
                  </Table.Row>
                )
              })
            ) : (
              <Table.Empty
                colSpan={COLS}
                title={filtering ? 'No lists match these filters' : 'No lists yet'}
                description={
                  search
                    ? `Nothing found for “${search}”.`
                    : filtering
                      ? undefined
                      : 'Favourite lists people create in the app appear here.'
                }
              />
            )}
          </Table.Body>
        </Table>
      </TableCard>

      <ListDetailModal key={openListId || 'none'} listId={openListId} onClose={closeList} />
    </>
  )
}
