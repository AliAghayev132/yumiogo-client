import { useCallback, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router'
import { Plus, MoreVertical, BadgeCheck, Users as UsersIcon, PauseCircle, Ban, Shield, ShieldOff, Trash2, UserRound } from 'lucide-react'
import {
  TableCard,
  Table,
  Tabs,
  FilterMenu,
  Button,
  ChipButton,
  IconButton,
  DropdownMenu,
  UserCell,
  StatusPill,
  Badge,
  useHeaderSearch,
  useBanner,
  errorMessage,
  monthYear,
  formatNumber,
} from '@components'
import { useGetUsersQuery, useExportUsersMutation } from '@store/api'
import { saveTextFile } from '@utils'
import { useUserActions } from './useUserActions'
import { UserQuickView } from './UserQuickView'
import { AddUserModal } from './AddUserModal'
import { USER_STATUS_TABS, USER_STATUSES } from './userMeta'

// Figma: "Showing 1–11 of 24,831".
const PAGE_SIZE = 11
const COLUMNS = 7

const FILTERS = [
  {
    key: 'role',
    label: 'Role',
    options: [
      { value: 'user', label: 'User' },
      { value: 'admin', label: 'Admin' },
    ],
  },
  {
    key: 'verified',
    label: 'Verified badge',
    options: [
      { value: 'true', label: 'Verified' },
      { value: 'false', label: 'Not verified' },
    ],
  },
  {
    key: 'sort',
    label: 'Sort by',
    allLabel: 'Newest first',
    options: [
      { value: 'oldest', label: 'Oldest first' },
      { value: 'name', label: 'Name' },
      { value: 'lastLogin', label: 'Last sign-in' },
    ],
  },
]
const NO_FILTERS = { role: '', verified: '', sort: '' }

// Page number that falls back to 1 whenever `key` (search / filters / tab) changes.
const usePageFor = (key) => {
  const [state, setState] = useState({ key, page: 1 })
  const page = state.key === key ? state.page : 1
  const setPage = useCallback((next) => setState({ key, page: next }), [key])
  return [page, setPage]
}

const RowActions = ({ user, isSelf, actions, onView }) => {
  const { status } = user
  const menu = []
  if (!isSelf) {
    if (status === 'active') menu.push({ label: 'Suspend…', icon: PauseCircle, onSelect: () => actions.suspend(user) })
    if (status === 'pending') menu.push({ label: 'Ban…', icon: Ban, onSelect: () => actions.ban(user) })
  }
  menu.push({
    label: user.verified ? 'Remove verified badge' : 'Add verified badge',
    icon: BadgeCheck,
    onSelect: () => actions.verify(user),
  })
  if (!isSelf) {
    menu.push({
      label: user.role === 'admin' ? 'Remove admin access' : 'Make admin',
      icon: user.role === 'admin' ? ShieldOff : Shield,
      onSelect: () => actions.setRole(user),
    })
    menu.push({ divider: true }, { label: 'Delete user', icon: Trash2, tone: 'danger', onSelect: () => actions.remove(user) })
  }

  return (
    <Table.Actions>
      <ChipButton onClick={onView}>View</ChipButton>
      {!isSelf && status === 'active' && (
        <>
          <ChipButton tone="warning" onClick={() => actions.warn(user)}>
            Warn
          </ChipButton>
          <ChipButton tone="danger" onClick={() => actions.ban(user)}>
            Ban
          </ChipButton>
        </>
      )}
      {status === 'pending' && (
        <ChipButton tone="success" onClick={() => actions.approve(user)}>
          Approve
        </ChipButton>
      )}
      {!isSelf && (status === 'suspended' || status === 'banned') && (
        <ChipButton tone="success" onClick={() => actions.restore(user)}>
          Restore
        </ChipButton>
      )}
      <DropdownMenu
        trigger={<IconButton icon={MoreVertical} label={`More actions for ${user.firstName || 'user'}`} tone="muted" size="xs" />}
        items={menu}
        width={220}
      />
    </Table.Actions>
  )
}

/**
 * Users (Figma 1280:8340 / 1343:26921): "All users" table card with Export / Filter / + Add user,
 * status tabs with counts, View · Warn · Ban / View · Restore row chips (+ Approve for pending
 * accounts and a "more" menu for suspend, verified badge, role and delete), numbered
 * pagination and the header search. Links: ?status=pending, ?user=<id> (opens the quick view).
 */
export const UsersPage = () => {
  const [params, setParams] = useSearchParams()
  const rawStatus = params.get('status')
  const status = USER_STATUSES.includes(rawStatus) ? rawStatus : 'all'
  const viewId = params.get('user')

  const search = useHeaderSearch({ placeholder: 'Search users by name or e-mail' })
  const [filters, setFilters] = useState(NO_FILTERS)
  const [page, setPage] = usePageFor(`${status}|${search}|${JSON.stringify(filters)}`)
  const [adding, setAdding] = useState(false)
  const selfId = useSelector((s) => s.auth.user?._id || s.auth.user?.id)

  const query = useMemo(() => {
    const q = { status, search: search || undefined }
    Object.entries(filters).forEach(([k, v]) => {
      if (v) q[k] = v
    })
    return q
  }, [status, search, filters])

  const { data, isLoading, isFetching, isError, refetch } = useGetUsersQuery({ ...query, page, limit: PAGE_SIZE })
  const [exportUsers, { isLoading: exporting }] = useExportUsersMutation()
  const actions = useUserActions()
  const banner = useBanner()

  const users = data?.data?.users || []
  const pagination = data?.data?.pagination || { total: 0 }
  const counts = data?.data?.counts || {}
  const viewing = viewId ? users.find((u) => u._id === viewId) : null

  const setParam = (key, value) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: key === 'user' }
    )

  const onExport = async () => {
    try {
      const { csv, filename } = await exportUsers(query).unwrap()
      saveTextFile(csv, filename)
    } catch (err) {
      banner.error(errorMessage(err, 'Export failed'))
    }
  }

  const tabs = USER_STATUS_TABS.map((t) => ({ ...t, count: counts[t.value] }))
  const filtered = !!search || Object.values(filters).some(Boolean) || status !== 'all'

  return (
    <div className="flex flex-col gap-6">
      <TableCard
        title="All users"
        actions={
          <>
            <Button size="sm" variant="outline" onClick={onExport} loading={exporting}>
              Export
            </Button>
            <FilterMenu filters={FILTERS} value={filters} onChange={setFilters} />
            <Button size="sm" leftIcon={Plus} onClick={() => setAdding(true)}>
              Add user
            </Button>
          </>
        }
        toolbar={
          <Tabs
            variant="pill"
            items={tabs}
            value={status}
            onChange={(v) => setParam('status', v === 'all' ? '' : v)}
            aria-label="User status"
            className="max-w-full overflow-x-auto"
          />
        }
        pagination={{ page, total: pagination.total || 0, limit: PAGE_SIZE, onPageChange: setPage }}
      >
        <Table minWidth={960}>
          <Table.Header>
            <Table.Row>
              <Table.Head>User</Table.Head>
              <Table.Head>Email</Table.Head>
              <Table.Head>Reviews</Table.Head>
              <Table.Head>Warnings</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head>Joined</Table.Head>
              <Table.Head>Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body className={isFetching && !isLoading ? 'opacity-60 transition-opacity' : undefined}>
            {isLoading ? (
              <Table.Loading rows={PAGE_SIZE} cols={COLUMNS} />
            ) : isError ? (
              <Table.Empty
                colSpan={COLUMNS}
                title="Could not load users"
                description="Check your connection and try again."
                action={
                  <Button size="sm" variant="outline" onClick={refetch}>
                    Retry
                  </Button>
                }
              />
            ) : users.length ? (
              users.map((u) => (
                <Table.Row key={u._id}>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <UserCell user={u} />
                      {u.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-info" aria-label="Verified" />}
                      {u.role === 'admin' && <Badge tone="purple" size="sm">Admin</Badge>}
                    </div>
                  </Table.Cell>
                  <Table.Cell className="max-w-[240px] truncate" title={u.email}>
                    {u.email}
                  </Table.Cell>
                  <Table.Cell>{formatNumber(u.reviewCount ?? 0)}</Table.Cell>
                  <Table.Cell>{formatNumber(u.warningCount ?? 0)}</Table.Cell>
                  <Table.Cell>
                    <StatusPill status={u.status} entity="user" />
                  </Table.Cell>
                  <Table.Cell nowrap>{monthYear(u.createdAt)}</Table.Cell>
                  <Table.Cell>
                    <RowActions
                      user={u}
                      isSelf={String(u._id) === String(selfId)}
                      actions={actions}
                      onView={() => setParam('user', u._id)}
                    />
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Empty
                colSpan={COLUMNS}
                icon={filtered ? UserRound : UsersIcon}
                title={filtered ? 'No users match these filters' : 'No users yet'}
                description={search ? `Nothing found for “${search}”.` : undefined}
              />
            )}
          </Table.Body>
        </Table>
      </TableCard>

      <UserQuickView userId={viewId} initial={viewing} onClose={() => setParam('user', '')} />
      <AddUserModal isOpen={adding} onClose={() => setAdding(false)} />
    </div>
  )
}
