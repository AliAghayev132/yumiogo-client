import { Link } from 'react-router'
import { Check, CircleAlert, ExternalLink, Hourglass, List, RotateCcw, Star, Store, Trash2, X } from 'lucide-react'
import {
  Avatar,
  Badge,
  Banner,
  Button,
  EmptyState,
  Modal,
  Skeleton,
  StatusPill,
  UserCell,
  timeAgo,
} from '@components'
import { useGetModerationReportQuery } from '@store/api'
import { getImageUrl } from '@utils'
import { ACTION_LABELS, TYPE_TONES, fullName, isClosed, targetLink, targetText } from './reportMeta'
import { useReportActions } from './useReportActions'

const Section = ({ title, action, children }) => (
  <section className="rounded-xl border border-line bg-surface p-4">
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="text-sm font-bold leading-[18px] text-ink">{title}</h3>
      {action}
    </div>
    {children}
  </section>
)

const Thumb = ({ src, icon: Icon }) =>
  src ? (
    <img src={getImageUrl(src)} alt="" className="h-12 w-12 shrink-0 rounded-lg border border-line object-cover" />
  ) : (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-subtle text-ink-muted">
      <Icon className="h-5 w-5" />
    </span>
  )

/** Preview of the reported review / user / restaurant / list. */
const TargetPreview = ({ report }) => {
  const t = report.target
  if (!t) return <p className="text-sm text-ink-muted">The reported {report.targetType} no longer exists.</p>

  const deleted = t.isDeleted && (
    <Badge tone="error" size="sm">
      Deleted
    </Badge>
  )

  switch (report.targetType) {
    case 'review':
      return (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {t.author ? <UserCell user={t.author} short /> : <span className="text-sm text-ink-muted">Deleted user</span>}
            <span className="text-sm text-ink-muted">on</span>
            <span className="text-sm font-semibold text-ink">{t.restaurant?.name || 'a removed restaurant'}</span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink">
              <Star className="h-4 w-4 fill-star text-star" /> {t.score}
            </span>
            <StatusPill status={t.status} entity="review" />
            {deleted}
          </div>
          {t.comment ? (
            <p className="whitespace-pre-wrap text-sm leading-6 text-ink-secondary">{t.comment}</p>
          ) : (
            <p className="text-sm text-ink-muted">No written review — reaction only.</p>
          )}
          {t.photos?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {t.photos.map((p) => (
                <a key={p} href={getImageUrl(p)} target="_blank" rel="noreferrer">
                  <img src={getImageUrl(p)} alt="Review photo" className="h-20 w-20 rounded-lg border border-line object-cover" />
                </a>
              ))}
            </div>
          )}
        </div>
      )
    case 'user':
      return (
        <div className="flex items-center gap-3">
          <Avatar src={t.avatar} name={t.name} seed={t._id} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{t.name}</p>
            <p className="truncate text-xs text-ink-muted">{t.email}</p>
          </div>
          <StatusPill status={t.status} entity="user" />
          {deleted}
        </div>
      )
    case 'restaurant':
      return (
        <div className="flex items-center gap-3">
          <Thumb src={t.coverImage} icon={Store} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{t.name}</p>
            {t.address && <p className="truncate text-xs text-ink-muted">{t.address}</p>}
          </div>
          <StatusPill status={t.status} entity="restaurant" />
          {deleted}
        </div>
      )
    default:
      return (
        <div className="flex items-center gap-3">
          <Thumb icon={List} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{t.name}</p>
            <p className="text-xs text-ink-muted">
              {t.itemCount} place{t.itemCount === 1 ? '' : 's'} · {t.privacy}
              {t.owner ? ` · by ${fullName(t.owner)}` : ''}
            </p>
          </div>
          {deleted}
        </div>
      )
  }
}

/**
 * Who owns the reported item: the server's `targetOwner` (id or { _id, firstName, lastName })
 * when it sends one, else the review author / list owner from the preview. null for users /
 * restaurants without an owner account.
 */
const ownerOf = (report) => {
  const owner = report.targetOwner
  if (owner && typeof owner === 'object') return owner
  if (owner) return { _id: owner }
  if (report.targetType === 'review') return report.target?.author || null
  if (report.targetType === 'list') return report.target?.owner || null
  return null
}

const UserLink = ({ user, fallback = 'Unknown' }) =>
  user?._id ? (
    <Link to={`/dashboard/users/${user._id}`} className="font-semibold text-brand-hover hover:underline">
      {user.firstName || user.lastName ? fullName(user) : 'Open profile'}
    </Link>
  ) : (
    fallback
  )

/**
 * Report detail (a row's View action, or ?report=<id> from the bell): reason and description,
 * a preview of the reported item with a link to its admin page, the resolution, the other
 * reports about the same item, and every status action.
 */
export const ReportDetailModal = ({ reportId, onClose, onResolve, onOpenReport }) => {
  const { data, isLoading, isError, error, refetch } = useGetModerationReportQuery(reportId, { skip: !reportId })
  const actions = useReportActions()
  const report = data?.data?.report
  const related = data?.data?.related || []
  const link = report && targetLink(report)
  const closed = report && isClosed(report)
  const owner = report && ownerOf(report)

  const removeAndClose = async () => {
    if (await actions.remove(report)) onClose()
  }

  const footer = report && (
    <>
      <Button variant="soft-danger" leftIcon={Trash2} onClick={removeAndClose} className="mr-auto">
        Delete
      </Button>
      <Button variant="outline" onClick={onClose}>
        Close
      </Button>
      {closed ? (
        <Button variant="outline" leftIcon={RotateCcw} onClick={() => actions.reopen(report)}>
          Reopen
        </Button>
      ) : (
        <>
          {report.status === 'open' && (
            <Button variant="outline" leftIcon={Hourglass} onClick={() => actions.markInReview(report)}>
              Mark in review
            </Button>
          )}
          <Button variant="outline" leftIcon={X} onClick={() => actions.dismiss(report)}>
            Dismiss
          </Button>
          <Button variant="success" leftIcon={Check} onClick={() => onResolve(report)}>
            Resolve
          </Button>
        </>
      )}
    </>
  )

  return (
    <Modal
      isOpen={!!reportId}
      onClose={onClose}
      size="lg"
      icon={CircleAlert}
      tone="red"
      title={report?.number ? `Report #${report.number}` : 'Report'}
      description={
        report && (
          <span className="inline-flex flex-wrap items-center gap-2">
            <StatusPill status={report.status} entity="report" />
            <StatusPill status={report.targetType} entity="reportType" tone={TYPE_TONES[report.targetType]} />
            <span>
              {report.reporter ? (
                <>
                  Reported by <UserLink user={report.reporter} />
                </>
              ) : (
                'System report'
              )}{' '}
              · {timeAgo(report.createdAt)}
            </span>
          </span>
        )
      }
      footer={footer}
    >
      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : isError || !report ? (
        <EmptyState
          title={error?.status === 404 ? 'Report not found' : 'Could not load the report'}
          description={error?.status === 404 ? 'It may have been deleted.' : undefined}
          action={
            error?.status !== 404 && (
              <Button size="sm" variant="outline" onClick={refetch}>
                Try again
              </Button>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          <Section title="Reason">
            <p className="text-sm font-semibold text-ink">{report.reason}</p>
            {report.description ? (
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink-secondary">{report.description}</p>
            ) : (
              <p className="mt-1 text-sm text-ink-muted">No description.</p>
            )}
          </Section>

          <Section
            title={`Reported ${report.targetType}: ${targetText(report)}`}
            action={
              link && (
                <Link
                  to={link}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-hover hover:underline"
                >
                  Open {report.targetType} <ExternalLink className="h-3 w-3" />
                </Link>
              )
            }
          >
            <TargetPreview report={report} />
            {owner && report.targetType !== 'user' && (
              <p className="mt-3 border-t border-line pt-3 text-sm text-ink-muted">
                {report.targetType === 'review' ? 'Written by' : 'Owned by'} <UserLink user={owner} />
              </p>
            )}
          </Section>

          {closed && (
            <Banner tone={report.status === 'resolved' ? 'success' : 'info'}>
              {report.status === 'resolved' ? 'Resolved' : 'Dismissed'}
              {report.resolvedBy ? ` by ${fullName(report.resolvedBy)}` : ''}
              {report.resolvedAt ? ` · ${timeAgo(report.resolvedAt)}` : ''}
              {report.action && report.action !== 'none' ? ` · ${ACTION_LABELS[report.action]}` : ''}
              {report.resolutionNote ? ` — “${report.resolutionNote}”` : ''}
            </Banner>
          )}

          <Section title={`Other reports about this ${report.targetType} (${related.length})`}>
            {related.length ? (
              <ul className="-my-1">
                {related.map((r) => (
                  <li key={r._id} className="flex flex-wrap items-center gap-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenReport(r._id)}
                      className="text-sm font-semibold text-ink hover:underline"
                    >
                      Report #{r.number}
                    </button>
                    <span className="min-w-0 flex-1 truncate text-sm text-ink-secondary">
                      {r.reason} · <UserLink user={r.reporter} fallback="System" /> · {timeAgo(r.createdAt)}
                    </span>
                    <StatusPill status={r.status} entity="report" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">No other reports.</p>
            )}
          </Section>
        </div>
      )}
    </Modal>
  )
}
