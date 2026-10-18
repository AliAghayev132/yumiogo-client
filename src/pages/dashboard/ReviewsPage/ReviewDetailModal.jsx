import { useState } from 'react'
import { Link } from 'react-router'
import {
  Check,
  ExternalLink,
  EyeOff,
  Flag,
  Heart,
  MessageCircle,
  MessageSquareMore,
  RotateCcw,
  Share2,
  Eye,
  Star,
  Trash2,
  Store,
  UserX,
} from 'lucide-react'
import {
  Avatar,
  Badge,
  Banner,
  Button,
  EmptyState,
  IconButton,
  Modal,
  Pagination,
  Skeleton,
  StatusPill,
  Tabs,
  UserCell,
  timeAgo,
  useBanner,
  useConfirm,
} from '@components'
import {
  useGetModerationReviewQuery,
  useGetModerationReviewCommentsQuery,
  useDeleteReviewCommentMutation,
} from '@store/api'
import { getImageUrl } from '@utils'
import { useReviewActions } from './useReviewActions'

const COMMENTS_PER_PAGE = 10

const fullName = (u) => [u?.firstName, u?.lastName].filter(Boolean).join(' ') || 'Deleted user'
const dateLabel = (value) =>
  value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

/** Small titled block inside the details tab. */
const Section = ({ title, children, action }) => (
  <section className="rounded-xl border border-line bg-surface p-4">
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="text-sm font-bold leading-[18px] text-ink">{title}</h3>
      {action}
    </div>
    {children}
  </section>
)

const Stat = ({ icon: Icon, value, label }) => (
  <div className="flex items-center gap-2 rounded-lg bg-subtle px-3 py-2" title={label}>
    <Icon className="h-4 w-4 text-ink-muted" />
    <span className="font-display text-sm font-semibold text-ink">{value ?? 0}</span>
    <span className="text-xs text-ink-muted">{label}</span>
  </div>
)

const DetailsTab = ({ review, sentiment, onRecalculate }) => {
  const restaurant = review.restaurant
  const user = review.user
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Section
          title="Author"
          action={
            user && (
              <Link
                to={`/dashboard/users/${user._id}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-hover hover:underline"
              >
                Open user <ExternalLink className="h-3 w-3" />
              </Link>
            )
          }
        >
          {user ? (
            <div className="flex items-center justify-between gap-2">
              <UserCell user={user} subtitle={user.email} />
              {(user.isDeleted || user.status !== 'active') && (
                <StatusPill status={user.isDeleted ? 'deleted' : user.status} entity="user" />
              )}
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <UserX className="h-4 w-4" /> Account deleted
            </p>
          )}
        </Section>

        <Section
          title="Restaurant"
          action={
            restaurant && (
              <Link
                to={`/dashboard/restaurants/${restaurant._id}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-hover hover:underline"
              >
                Open restaurant <ExternalLink className="h-3 w-3" />
              </Link>
            )
          }
        >
          {restaurant ? (
            <div className="flex items-center gap-3">
              {restaurant.coverImages?.[0] ? (
                <img
                  src={getImageUrl(restaurant.coverImages[0])}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-lg border border-line object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-subtle text-ink-muted">
                  <Store className="h-5 w-5" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{restaurant.name}</p>
                {restaurant.isDeleted && <p className="text-xs text-error">Deleted restaurant</p>}
              </div>
              <Button size="xs" variant="outline" leftIcon={RotateCcw} onClick={() => onRecalculate(restaurant)}>
                Recalculate rating
              </Button>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Restaurant removed</p>
          )}
        </Section>
      </div>

      <Section title="Review">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-ink"
            style={{ borderColor: sentiment?.color }}
          >
            <span aria-hidden="true">{sentiment?.emoji}</span>
            {sentiment?.label || review.sentiment}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink">
            <Star className="h-4 w-4 fill-star text-star" /> {review.score}
          </span>
          {/* Only a visit date the author picked — never the posting date. */}
          {review.visitDate && (
            <Badge tone="neutral" size="sm">
              Visited {dateLabel(review.visitDate)}
            </Badge>
          )}
          <Badge tone="neutral" size="sm" title={new Date(review.createdAt).toLocaleString('en-US')}>
            Posted {dateLabel(review.createdAt)}
          </Badge>
          {review.isStealth && (
            <Badge tone="purple" size="sm" icon={EyeOff}>
              Stealth
            </Badge>
          )}
        </div>
        {review.comment ? (
          <p className="whitespace-pre-wrap text-sm leading-6 text-ink-secondary">{review.comment}</p>
        ) : (
          <p className="text-sm text-ink-muted">No written review — reaction only.</p>
        )}

        {review.photos?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {review.photos.map((photo) => (
              <a key={photo} href={getImageUrl(photo)} target="_blank" rel="noreferrer" title="Open full size">
                <img
                  src={getImageUrl(photo)}
                  alt="Review photo"
                  className="h-24 w-24 rounded-lg border border-line object-cover transition-opacity hover:opacity-80"
                />
              </a>
            ))}
          </div>
        )}

        {(review.labels?.length > 0 || review.favoriteDishes?.length > 0) && (
          <div className="mt-4 flex flex-col gap-2">
            {review.labels?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs text-ink-muted">Labels</span>
                {review.labels.map((l) => (
                  <Badge key={l} tone="info" size="md">
                    {l}
                  </Badge>
                ))}
              </div>
            )}
            {review.favoriteDishes?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs text-ink-muted">Favourite dishes</span>
                {review.favoriteDishes.map((d) => (
                  <Badge key={d.name} tone="orange" size="md">
                    {d.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {review.companions?.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs text-ink-muted">Went with</p>
            <div className="flex flex-wrap gap-3">
              {review.companions.map((c) => (
                <UserCell key={c._id} user={c} short size="xs" />
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Stat icon={Heart} value={review.likeCount} label="likes" />
          <Stat icon={MessageCircle} value={review.commentCount} label="comments" />
          <Stat icon={Share2} value={review.shareCount} label="shares" />
          <Stat icon={Eye} value={review.viewCount} label="views" />
        </div>
      </Section>

      {(review.moderationNote || review.moderatedAt) && (
        <Section title="Moderation">
          <p className="text-sm text-ink-secondary">
            <StatusPill status={review.status} entity="review" />{' '}
            {review.moderatedBy ? `by ${fullName(review.moderatedBy)}` : ''}
            {review.moderatedAt ? ` · ${timeAgo(review.moderatedAt)}` : ''}
          </p>
          {review.moderationNote && <p className="mt-2 text-sm text-ink-secondary">“{review.moderationNote}”</p>}
        </Section>
      )}
    </div>
  )
}

const CommentsTab = ({ reviewId }) => {
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching, isError, refetch } = useGetModerationReviewCommentsQuery({
    id: reviewId,
    page,
    limit: COMMENTS_PER_PAGE,
  })
  const [deleteComment] = useDeleteReviewCommentMutation()
  const confirm = useConfirm()
  const banner = useBanner()
  const comments = data?.data?.comments || []
  const pagination = data?.data?.pagination

  const remove = async (comment) => {
    const ok = await confirm({
      tone: 'danger',
      icon: Trash2,
      title: 'Delete this comment?',
      message: `${fullName(comment.user)}'s comment is removed from the review. Its replies stay visible under a “deleted” placeholder.`,
      confirmText: 'Delete comment',
      onConfirm: () => deleteComment({ commentId: comment._id, reviewId, userId: comment.user?._id }).unwrap(),
    })
    if (ok) banner.success('Comment deleted')
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }
  if (isError) {
    return (
      <EmptyState
        title="Could not load the comments"
        action={
          <Button size="sm" variant="outline" onClick={refetch}>
            Try again
          </Button>
        }
      />
    )
  }
  if (!comments.length) return <EmptyState icon={MessageCircle} title="No comments yet" compact />

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <ul className={isFetching ? 'opacity-60' : undefined}>
        {comments.map((c) => (
          <li key={c._id} className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-b-0">
            <Avatar src={c.user?.avatar} firstName={c.user?.firstName} lastName={c.user?.lastName} seed={c.user?._id} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">
                {fullName(c.user)}
                {c.parent && <span className="ml-2 text-xs font-normal text-ink-muted">reply</span>}
                <span className="ml-2 text-xs font-normal text-ink-placeholder">{timeAgo(c.createdAt)}</span>
              </p>
              {c.isDeleted ? (
                <p className="text-sm italic text-ink-placeholder">Comment deleted</p>
              ) : (
                <p className="whitespace-pre-wrap break-words text-sm text-ink-secondary">{c.text}</p>
              )}
              <p className="mt-1 text-xs text-ink-muted">
                {c.likeCount || 0} likes · {c.replyCount || 0} replies
              </p>
            </div>
            {!c.isDeleted && <IconButton icon={Trash2} label="Delete comment" tone="danger" onClick={() => remove(c)} />}
          </li>
        ))}
      </ul>
      <Pagination
        page={page}
        total={pagination?.total || 0}
        limit={COMMENTS_PER_PAGE}
        onPageChange={setPage}
        itemLabel="comments"
      />
    </div>
  )
}

const ReportsTab = ({ reports }) => {
  if (!reports.length) return <EmptyState icon={Flag} title="No reports about this review" compact />
  return (
    <ul className="overflow-hidden rounded-xl border border-line bg-surface">
      {reports.map((r) => (
        <li key={r._id} className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">
              Report #{r.number} · {r.reason}
            </p>
            <p className="text-xs text-ink-muted">
              {r.reporter ? fullName(r.reporter) : 'System'} · {timeAgo(r.createdAt)}
            </p>
            {r.description && <p className="mt-1 text-sm text-ink-secondary">{r.description}</p>}
          </div>
          <StatusPill status={r.status} entity="report" />
          <Link
            to={`/dashboard/reports?report=${r._id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-hover hover:underline"
          >
            Open <ExternalLink className="h-3 w-3" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

/**
 * Review detail (from a table row, or ?review=<id> links from the bell): author, restaurant,
 * the full review with photos, labels, dishes and companions, its comments (moderate / delete)
 * and reports, plus every moderation action.
 */
export const ReviewDetailModal = ({ reviewId, sentiments = [], onClose }) => {
  const [tab, setTab] = useState('details')
  const { data, isLoading, isError, error, refetch } = useGetModerationReviewQuery(reviewId, { skip: !reviewId })
  const actions = useReviewActions()
  const review = data?.data?.review
  const reports = data?.data?.reports || []
  const sentiment = sentiments.find((s) => s.key === review?.sentiment)
  const live = review && !review.isDeleted

  const run = (fn) => async () => {
    await fn(review)
  }
  const removeAndClose = async () => {
    if (await actions.remove(review)) onClose()
  }

  const status = review?.status
  const footer = (
    <>
      {live && (
        <Button variant="soft-danger" leftIcon={Trash2} onClick={removeAndClose} className="mr-auto">
          Delete
        </Button>
      )}
      <Button variant="outline" onClick={onClose}>
        Close
      </Button>
      {live && (status === 'flagged' || status === 'rejected') && (
        <Button variant="outline" leftIcon={RotateCcw} onClick={run(actions.toPending)}>
          Move to pending
        </Button>
      )}
      {live && status !== 'flagged' && status !== 'rejected' && (
        <Button variant="outline" leftIcon={Flag} onClick={run(actions.flag)}>
          Flag
        </Button>
      )}
      {live && status !== 'rejected' && (
        <Button variant="outline" leftIcon={EyeOff} onClick={run(actions.reject)}>
          Reject
        </Button>
      )}
      {live && status !== 'approved' && (
        <Button variant="success" leftIcon={Check} onClick={run(actions.approve)}>
          Approve
        </Button>
      )}
    </>
  )

  return (
    <Modal
      isOpen={!!reviewId}
      onClose={onClose}
      size="xl"
      icon={MessageSquareMore}
      tone="purple"
      title={review?.number ? `Review #${review.number}` : 'Review'}
      description={
        review && (
          <span className="inline-flex flex-wrap items-center gap-2">
            <StatusPill status={review.isDeleted ? 'deleted' : review.status} entity="review" />
            <span>
              {review.user ? fullName(review.user) : 'Deleted user'} · {review.restaurant?.name || 'Restaurant removed'} ·{' '}
              {timeAgo(review.createdAt)}
            </span>
            {review.openReports > 0 && (
              <Badge tone="error" size="sm">
                {review.openReports} open report{review.openReports === 1 ? '' : 's'}
              </Badge>
            )}
          </span>
        )
      }
      footer={footer}
    >
      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : isError || !review ? (
        <EmptyState
          title={error?.status === 404 ? 'Review not found' : 'Could not load the review'}
          description={error?.status === 404 ? 'It may have been removed.' : undefined}
          action={
            error?.status !== 404 && (
              <Button size="sm" variant="outline" onClick={refetch}>
                Try again
              </Button>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {review.isDeleted && <Banner tone="error">This review was deleted. It is no longer shown in the app.</Banner>}
          <Tabs
            variant="underline"
            value={tab}
            onChange={setTab}
            items={[
              { value: 'details', label: 'Details' },
              { value: 'comments', label: 'Comments', count: review.commentCount || 0 },
              { value: 'reports', label: 'Reports', count: reports.length },
            ]}
          />
          {tab === 'details' && (
            <DetailsTab review={review} sentiment={sentiment} onRecalculate={actions.recalculate} />
          )}
          {tab === 'comments' && <CommentsTab reviewId={review._id} />}
          {tab === 'reports' && <ReportsTab reports={reports} />}
        </div>
      )}
    </Modal>
  )
}
