import { Link, useNavigate, useParams } from 'react-router'
import { useSelector } from 'react-redux'
import {
  ArrowLeft,
  BadgeCheck,
  MessageSquareMore,
  Bookmark,
  UserPlus,
  Users,
  AlertTriangle,
  CircleAlert,
  Flag,
  Trash2,
  MoreVertical,
  Shield,
  ShieldOff,
  PauseCircle,
  Ban,
  ChevronRight,
} from 'lucide-react'
import {
  Avatar,
  Badge,
  Banner,
  Button,
  Card,
  ChartCard,
  DropdownMenu,
  EmptyState,
  IconButton,
  Skeleton,
  StatCard,
  StatusPill,
  formatNumber,
  monthYear,
  timeAgo,
} from '@components'
import { useGetAdminUserQuery } from '@store/api'
import { formatDateTime } from '@utils'
import { useUserActions } from './useUserActions'
import { fullName } from './userMeta'

const row = 'flex items-center gap-3 px-[18px] py-3'
const linkRow = `${row} transition-colors hover:bg-canvas`

const SectionList = ({ title, subtitle, empty, children, count }) => (
  <ChartCard title={title} subtitle={subtitle} divider className="pb-2" bodyClassName="-mx-[18px]">
    {count ? <div className="flex flex-col">{children}</div> : <EmptyState compact title={empty} className="py-6" />}
  </ChartCard>
)

/**
 * Full user profile (/dashboard/users/:id) — "Go to full profile" from the quick view: account
 * status and moderation history, counters, warnings (removable), latest reviews, lists and the
 * reports filed against the user, with every moderation action.
 */
export const UserDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, isError, error, refetch } = useGetAdminUserQuery(id)
  const actions = useUserActions()
  const selfId = useSelector((s) => s.auth.user?._id || s.auth.user?.id)

  const back = (
    <Link to="/dashboard/users" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink">
      <ArrowLeft className="h-4 w-4" /> All users
    </Link>
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {back}
        <Card padding="sm" className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3.5 w-64" />
          </div>
        </Card>
      </div>
    )
  }

  if (isError || !data?.data?.user) {
    const missing = error?.status === 404 || error?.status === 400
    return (
      <div className="flex flex-col gap-6">
        {back}
        <Card>
          <EmptyState
            icon={missing ? Users : CircleAlert}
            title={missing ? 'User not found' : 'Could not load this user'}
            description={missing ? 'The account may have been deleted.' : 'Check your connection and try again.'}
            action={!missing && <Button size="sm" variant="outline" onClick={refetch}>Retry</Button>}
          />
        </Card>
      </div>
    )
  }

  const { user, stats = {}, recentReviews = [], lists = [], reports = [] } = data.data
  const isSelf = String(user._id) === String(selfId)
  const name = fullName(user)
  const warnings = [...(user.warnings || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const blocked = user.status === 'suspended' || user.status === 'banned'
  const changedBy = user.statusChangedBy ? fullName(user.statusChangedBy) : null

  const menu = [
    { label: user.verified ? 'Remove verified badge' : 'Add verified badge', icon: BadgeCheck, onSelect: () => actions.verify(user) },
  ]
  if (!isSelf) {
    if (user.status === 'active') menu.push({ label: 'Suspend…', icon: PauseCircle, onSelect: () => actions.suspend(user) })
    if (user.status === 'pending' || user.status === 'suspended') menu.push({ label: 'Ban…', icon: Ban, onSelect: () => actions.ban(user) })
    menu.push({
      label: user.role === 'admin' ? 'Remove admin access' : 'Make admin',
      icon: user.role === 'admin' ? ShieldOff : Shield,
      onSelect: () => actions.setRole(user),
    })
    menu.push(
      { divider: true },
      {
        label: 'Delete user',
        icon: Trash2,
        tone: 'danger',
        onSelect: async () => {
          if (await actions.remove(user)) navigate('/dashboard/users', { replace: true })
        },
      }
    )
  }

  const statCards = [
    { key: 'reviews', icon: MessageSquareMore, tone: 'purple', label: 'Reviews', value: stats.reviews },
    { key: 'lists', icon: Bookmark, tone: 'pink', label: 'Lists', value: stats.lists },
    { key: 'followers', icon: Users, tone: 'blue', label: 'Followers', value: stats.followers },
    { key: 'following', icon: UserPlus, tone: 'green', label: 'Following', value: stats.following },
    { key: 'warnings', icon: AlertTriangle, tone: 'amber', label: 'Warnings', value: stats.warnings },
    { key: 'reports', icon: Flag, tone: 'red', label: 'Reports against', value: stats.reportsAgainst },
  ]

  return (
    <div className="flex flex-col gap-6">
      {back}

      <Card padding="sm" className="flex flex-wrap items-center gap-4">
        <Avatar src={user.avatar} firstName={user.firstName} lastName={user.lastName} seed={user._id} size="xl" />
        <div className="min-w-0 flex-1 basis-64">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl font-medium leading-8 text-ink">{name}</h2>
            {user.verified && <BadgeCheck className="h-5 w-5 text-info" aria-label="Verified" />}
            <StatusPill status={user.status} entity="user" />
            {user.role === 'admin' && <Badge tone="purple" size="sm">Admin</Badge>}
            {isSelf && <Badge tone="neutral" size="sm">You</Badge>}
          </div>
          <p className="mt-1 truncate text-sm text-ink-muted">
            {user.email}
            {user.city ? ` · ${user.city}` : ''} · Joined {monthYear(user.createdAt)}
            {user.lastLogin ? ` · Last sign-in ${timeAgo(user.lastLogin)}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isSelf && user.status === 'active' && (
            <>
              <Button size="sm" variant="outline" leftIcon={AlertTriangle} onClick={() => actions.warn(user)}>
                Warn
              </Button>
              <Button size="sm" variant="soft-danger" leftIcon={Ban} onClick={() => actions.ban(user)}>
                Ban
              </Button>
            </>
          )}
          {user.status === 'pending' && (
            <Button size="sm" variant="success" onClick={() => actions.approve(user)}>
              Approve
            </Button>
          )}
          {!isSelf && blocked && (
            <Button size="sm" variant="success" onClick={() => actions.restore(user)}>
              Restore access
            </Button>
          )}
          <DropdownMenu trigger={<IconButton icon={MoreVertical} label="More actions" variant="secondary" />} items={menu} />
        </div>
      </Card>

      {(blocked || user.status === 'pending') && (
        <Banner tone={user.status === 'banned' ? 'error' : 'warning'}>
          {user.status === 'pending'
            ? 'This account is waiting for approval and cannot sign in yet.'
            : [
                user.status === 'banned' ? 'Banned' : 'Suspended',
                user.suspendedUntil ? ` until ${formatDateTime(user.suspendedUntil)}` : user.status === 'suspended' ? ' until restored' : '',
                changedBy ? ` by ${changedBy}` : '',
                user.statusChangedAt ? ` on ${formatDateTime(user.statusChangedAt)}` : '',
                user.statusReason ? `. Reason: ${user.statusReason}` : '.',
              ].join('')}
        </Banner>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {statCards.map(({ key, ...card }) => (
          <StatCard key={key} {...card} value={card.value ?? 0} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionList
          title="Warnings"
          subtitle={`${formatNumber(warnings.length)} in total`}
          empty="No warnings"
          count={warnings.length}
        >
          {warnings.map((w) => (
            <div key={w._id} className={row}>
              <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{w.reason}</p>
                <p className="text-xs text-ink-muted">
                  {formatDateTime(w.createdAt)}
                  {w.by ? ` · by ${fullName(w.by)}` : ''}
                </p>
              </div>
              <IconButton icon={Trash2} tone="danger" label="Remove warning" onClick={() => actions.removeWarning(user, w)} />
            </div>
          ))}
        </SectionList>

        <SectionList
          title="Recent reviews"
          subtitle={`${formatNumber(stats.reviews || 0)} in total`}
          empty="No reviews yet"
          count={recentReviews.length}
        >
          {recentReviews.map((r) => (
            <Link key={r._id} to={`/dashboard/reviews?review=${r._id}`} className={linkRow}>
              <MessageSquareMore className="h-5 w-5 shrink-0 text-purple" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {r.restaurant?.name || 'Restaurant'}
                  {r.number ? <span className="font-normal text-ink-muted"> · #{r.number}</span> : null}
                </p>
                <p className="truncate text-xs text-ink-muted">{r.comment || 'No comment'}</p>
              </div>
              <StatusPill status={r.status || 'approved'} entity="review" />
              <span className="shrink-0 text-xs text-ink-disabled">{timeAgo(r.createdAt)}</span>
            </Link>
          ))}
        </SectionList>

        <SectionList title="Lists" subtitle={`${formatNumber(stats.lists || 0)} in total`} empty="No lists yet" count={lists.length}>
          {lists.map((l) => (
            <Link key={l._id} to={`/dashboard/lists?list=${l._id}`} className={linkRow}>
              <Bookmark className="h-5 w-5 shrink-0 text-pink" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{l.name}</p>
                <p className="text-xs text-ink-muted">
                  {formatNumber(l.itemCount || 0)} restaurants · {l.privacy || 'private'}
                  {l.isDefault ? ' · default' : ''}
                </p>
              </div>
              <span className="shrink-0 text-xs text-ink-disabled">{timeAgo(l.createdAt)}</span>
            </Link>
          ))}
        </SectionList>

        <SectionList
          title="Reports against this user"
          subtitle={`${formatNumber(stats.reportsAgainst || 0)} received · ${formatNumber(stats.reportsFiled || 0)} filed`}
          empty="No reports"
          count={reports.length}
        >
          {reports.map((r) => (
            <Link key={r._id} to={`/dashboard/reports?report=${r._id}`} className={linkRow}>
              <Flag className="h-5 w-5 shrink-0 text-danger" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {r.number ? `#${r.number} · ` : ''}
                  {r.reason}
                </p>
                <p className="truncate text-xs text-ink-muted">
                  {r.reporter ? `By ${fullName(r.reporter)}` : 'Anonymous'}
                  {r.description ? ` · ${r.description}` : ''}
                </p>
              </div>
              <StatusPill status={r.status} entity="report" />
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-disabled" />
            </Link>
          ))}
        </SectionList>
      </div>
    </div>
  )
}
