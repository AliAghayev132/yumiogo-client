import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { BadgeCheck, ChevronRight, Users } from 'lucide-react'
import { Button, EmptyState, Modal, Pagination, SearchInput, Skeleton, Tabs, UserCell } from '@components'
import { useGetUserConnectionsQuery } from '@store/api'
import { fullName } from './userMeta'

const PAGE_SIZE = 10

/** One paged, searchable list (followers or following) — remounted per tab and user. */
const ConnectionList = ({ userId, kind, onNavigate }) => {
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [q, setQ] = useState('')

  // Debounced name search; a new search starts again from page 1.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(query.trim())
      setPage(1)
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  const { data, isLoading, isFetching, isError, refetch } = useGetUserConnectionsQuery({
    id: userId,
    kind,
    page,
    limit: PAGE_SIZE,
    q: q || undefined,
  })
  const users = data?.data?.users || []
  const total = data?.data?.pagination?.total || 0

  return (
    <div className="flex flex-col gap-3">
      <SearchInput
        size="sm"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={() => setQuery('')}
        placeholder="Search by name"
      />
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        {isLoading ? (
          <div className="flex flex-col gap-3 p-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            compact
            title="Could not load the list"
            action={
              <Button size="sm" variant="outline" onClick={refetch}>
                Try again
              </Button>
            }
          />
        ) : users.length ? (
          <ul className={isFetching ? 'opacity-60 transition-opacity' : undefined}>
            {users.map((u) => (
              <li key={u._id} className="border-b border-line last:border-b-0">
                <Link
                  to={`/dashboard/users/${u._id}`}
                  onClick={onNavigate}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-canvas"
                >
                  <UserCell user={u} name={fullName(u)} className="min-w-0 flex-1" />
                  {u.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-info" aria-label="Verified" />}
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-disabled" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            compact
            icon={Users}
            title={q ? `Nobody matches “${q}”` : kind === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
            className="py-6"
          />
        )}
        <Pagination page={page} total={total} limit={PAGE_SIZE} onPageChange={setPage} itemLabel="people" />
      </div>
    </div>
  )
}

/**
 * Followers / Following of a user (stat cards on the user page) — GET /users/:id/followers|following
 * (admins see private accounts too). Only active accounts are listed, like in the app.
 * kind: 'followers' | 'following' | null (closed); onKindChange switches the tab.
 */
export const ConnectionsModal = ({ user, stats = {}, kind, onKindChange, onClose }) => (
  <Modal
    isOpen={!!kind}
    onClose={onClose}
    size="lg"
    icon={Users}
    tone="blue"
    title={`${fullName(user)}'s connections`}
    description="Active accounts only — suspended, banned and pending accounts are left out, as in the app."
    footer={
      <Button variant="outline" onClick={onClose}>
        Close
      </Button>
    }
  >
    <div className="flex flex-col gap-4">
      <Tabs
        variant="underline"
        value={kind}
        onChange={onKindChange}
        items={[
          { value: 'followers', label: 'Followers', count: stats.followers ?? undefined },
          { value: 'following', label: 'Following', count: stats.following ?? undefined },
        ]}
      />
      {kind && <ConnectionList key={`${user._id}-${kind}`} userId={user._id} kind={kind} onNavigate={onClose} />}
    </div>
  </Modal>
)
