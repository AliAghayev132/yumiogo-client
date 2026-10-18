import { Link } from 'react-router'
import { Smartphone } from 'lucide-react'
import { Badge, Button, ChartCard, EmptyState, Skeleton, formatNumber, timeAgo } from '@components'
import { useGetAdminSettingsQuery, useGetAdminUserSessionsQuery, useGetMetaQuery } from '@store/api'
import { formatDateTime } from '@utils'
import { fullName } from './userMeta'

const SIGN_IN = { local: 'E-mail and password', google: 'Google' }
const VISIBILITY = { everyone: 'Everyone', followers: 'Followers only', me: 'Only them' }
const TERMS_METHOD = { register: 'Sign-up form', google: 'Google sign-up' }

// Settings → Notifications switches of the app (server user.settings).
const NOTIFICATION_SETTINGS = [
  { key: 'pushNotifications', label: 'Push notifications' },
  { key: 'emailNotifications', label: 'E-mail notifications' },
  { key: 'followerAlerts', label: 'New follower alerts' },
  { key: 'reservationAlerts', label: 'Reservation alerts' },
]

/** Definition list of the cards: label column + value column; empty values show "—". */
const Rows = ({ rows }) => (
  <dl className="grid grid-cols-[minmax(0,auto)_1fr] gap-x-6 gap-y-2 text-sm">
    {rows.map(({ label, value }) => (
      <div key={label} className="contents">
        <dt className="text-ink-muted">{label}</dt>
        <dd className="min-w-0 break-words text-ink">{value === '' || value === null || value === undefined ? '—' : value}</dd>
      </div>
    ))}
  </dl>
)

const OnOff = ({ on }) => (
  <Badge tone={on ? 'success' : 'neutral'} size="sm">
    {on ? 'On' : 'Off'}
  </Badge>
)

/** Catalog names as chips; names no longer active in the catalog are greyed out. */
const NameChips = ({ names = [], active = [] }) =>
  names.length ? (
    <span className="flex flex-wrap gap-1.5">
      {names.map((name) => {
        const retired = active.length > 0 && !active.includes(name)
        return (
          <Badge key={name} tone={retired ? 'neutral' : 'info'} size="sm" title={retired ? 'No longer in the catalog' : undefined}>
            {name}
          </Badge>
        )
      })}
    </span>
  ) : (
    '—'
  )

/** Profile: contact, bio, language, privacy, sign-in method, consent and food preferences. */
export const ProfileCard = ({ user }) => {
  const { data: settingsData } = useGetAdminSettingsQuery()
  const { data: metaData } = useGetMetaQuery()
  const languages = settingsData?.data?.languages || []
  const language = languages.find((l) => l.code === user.language)?.label || user.language
  const meta = metaData?.data || {}
  const terms = user.terms || {}
  const prefs = user.preferences || {}

  return (
    <ChartCard title="Profile" subtitle={`Updated ${timeAgo(user.updatedAt)}`} divider>
      <Rows
        rows={[
          { label: 'E-mail', value: user.email },
          { label: 'Phone', value: user.phone },
          { label: 'City', value: user.city },
          { label: 'Bio', value: user.bio && <span className="whitespace-pre-wrap">{user.bio}</span> },
          { label: 'Language', value: language },
          { label: 'Account', value: user.isPrivate ? 'Private — activity only for followers' : 'Public' },
          { label: 'Sign-in method', value: SIGN_IN[user.authProvider] || user.authProvider },
          {
            label: 'Terms accepted',
            value: terms.acceptedAt
              ? [
                  formatDateTime(terms.acceptedAt),
                  terms.version ? `version ${terms.version}` : null,
                  TERMS_METHOD[terms.method] || terms.method,
                ]
                  .filter(Boolean)
                  .join(' · ')
              : 'Not recorded',
          },
          { label: 'Favourite cuisines', value: <NameChips names={prefs.cuisines} active={meta.cuisines} /> },
          { label: 'Dietary needs', value: <NameChips names={prefs.dietary} active={meta.dietary} /> },
          ...(user.followRequestCount !== undefined
            ? [{ label: 'Pending follow requests', value: formatNumber(user.followRequestCount) }]
            : []),
          { label: 'Joined', value: formatDateTime(user.createdAt) },
          { label: 'Last updated', value: formatDateTime(user.updatedAt) },
        ]}
      />
    </ChartCard>
  )
}

/** App settings the user chose: notification switches and who sees their reviews / lists. */
export const SettingsCard = ({ user }) => {
  const settings = user.settings || {}
  return (
    <ChartCard title="App settings" subtitle="Notifications and activity visibility" divider>
      <Rows
        rows={[
          ...NOTIFICATION_SETTINGS.map(({ key, label }) => ({ label, value: <OnOff on={settings[key] !== false} /> })),
          { label: 'Who sees reviews', value: VISIBILITY[settings.reviewsVisibility] || 'Everyone' },
          { label: 'Who sees lists', value: VISIBILITY[settings.listsVisibility] || 'Everyone' },
        ]}
      />
    </ChartCard>
  )
}

/** Invite code, who invited them and how many people they brought in. */
export const InvitesCard = ({ user, stats = {} }) => {
  const inviter = user.invitedBy && typeof user.invitedBy === 'object' ? user.invitedBy : null
  return (
    <ChartCard title="Invites" subtitle="Invite friends / Refer a friend" divider>
      <Rows
        rows={[
          { label: 'Invite code', value: user.inviteCode && <span className="font-mono text-xs">{user.inviteCode}</span> },
          {
            label: 'Invited by',
            value: inviter ? (
              inviter.isDeleted ? (
                'Deleted account'
              ) : (
                <Link to={`/dashboard/users/${inviter._id}`} className="font-semibold text-brand-hover hover:underline">
                  {fullName(inviter)}
                </Link>
              )
            ) : user.invitedBy ? (
              'Deleted account'
            ) : (
              'Nobody — signed up directly'
            ),
          },
          { label: 'Invites sent', value: formatNumber(user.invitesSent || 0) },
          { label: 'Joined with their code', value: formatNumber(stats.invited || 0) },
        ]}
      />
    </ChartCard>
  )
}

/** Push-registered devices and refresh-token sessions (no tokens are shown or sent). */
export const SessionsCard = ({ userId }) => {
  const { data, isLoading, isError, refetch } = useGetAdminUserSessionsQuery(userId)
  const info = data?.data
  const sessions = info?.sessions || []

  return (
    <ChartCard
      title="Devices & sessions"
      subtitle={
        info
          ? `${formatNumber(info.pushDevices)} device${info.pushDevices === 1 ? '' : 's'} with push · ${formatNumber(info.activeSessions)} active session${info.activeSessions === 1 ? '' : 's'}`
          : 'Signed-in devices'
      }
      divider
      className="pb-2"
      bodyClassName="-mx-[18px]"
    >
      {isLoading ? (
        <div className="flex flex-col gap-2 px-[18px] pb-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
      ) : isError ? (
        <EmptyState
          compact
          title="Could not load the sessions"
          className="py-6"
          action={
            <Button size="sm" variant="outline" onClick={refetch}>
              Retry
            </Button>
          }
        />
      ) : sessions.length ? (
        <div className="flex flex-col">
          {sessions.slice(0, 8).map((s, i) => (
            <div key={i} className="flex items-center gap-3 px-[18px] py-2.5">
              <Smartphone className={`h-5 w-5 shrink-0 ${s.active ? 'text-success' : 'text-ink-disabled'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">
                  {s.active ? 'Signed in' : 'Signed out / expired'}
                  {s.rememberMe ? <span className="font-normal text-ink-muted"> · Remember me</span> : null}
                </p>
                <p className="text-xs text-ink-muted">
                  Last active {s.lastRefreshAt ? timeAgo(s.lastRefreshAt) : '—'}
                  {s.expiresAt ? ` · ${s.active ? 'expires' : 'expired'} ${formatDateTime(s.expiresAt)}` : ''}
                </p>
              </div>
            </div>
          ))}
          {sessions.length > 8 && (
            <p className="px-[18px] py-2 text-xs text-ink-muted">+{formatNumber(sessions.length - 8)} older sessions</p>
          )}
        </div>
      ) : (
        <EmptyState
          compact
          title="No sessions"
          description={info?.lastLogin ? `Last sign-in ${formatDateTime(info.lastLogin)}` : 'Never signed in'}
          className="py-6"
        />
      )}
    </ChartCard>
  )
}
