import { useState } from 'react'
import { Link } from 'react-router'
import { ChevronRight, Flag, MessageCircle, Trash2 } from 'lucide-react'
import {
  Button,
  ChartCard,
  EmptyState,
  IconButton,
  Pagination,
  Skeleton,
  StatusPill,
  formatNumber,
  timeAgo,
  useBanner,
  useConfirm,
} from '@components'
import { useDeleteReviewCommentMutation, useGetAdminUserCommentsQuery, useGetAdminUserReportsQuery } from '@store/api'

const PAGE_SIZE = 5
const row = 'flex items-center gap-3 px-[18px] py-3'
const linkRow = `${row} transition-colors hover:bg-canvas`

/** Card body states shared by the paged lists below. */
const PagedBody = ({ query, items, empty, total, page, setPage, children }) => {
  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-3 px-[18px] pb-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    )
  }
  if (query.isError) {
    return (
      <EmptyState
        compact
        title="Could not load the list"
        className="py-6"
        action={
          <Button size="sm" variant="outline" onClick={query.refetch}>
            Retry
          </Button>
        }
      />
    )
  }
  if (!items.length) return <EmptyState compact title={empty} className="py-6" />
  return (
    <>
      <div className={`flex flex-col ${query.isFetching ? 'opacity-60 transition-opacity' : ''}`}>{children}</div>
      {total > PAGE_SIZE && <Pagination page={page} total={total} limit={PAGE_SIZE} onPageChange={setPage} />}
    </>
  )
}

const TARGET_LABEL = { review: 'review', user: 'user', restaurant: 'restaurant', list: 'list' }

/** Reports this user filed (GET /admin/users/:id/reports), paged. */
export const FiledReportsCard = ({ userId, total: knownTotal }) => {
  const [page, setPage] = useState(1)
  const query = useGetAdminUserReportsQuery({ id: userId, page, limit: PAGE_SIZE })
  const reports = query.data?.data?.reports || []
  const total = query.data?.data?.pagination?.total ?? knownTotal ?? 0

  return (
    <ChartCard
      title="Reports filed by this user"
      subtitle={`${formatNumber(total)} in total`}
      divider
      className="pb-2"
      bodyClassName="-mx-[18px]"
    >
      <PagedBody query={query} items={reports} empty="No reports filed" total={total} page={page} setPage={setPage}>
        {reports.map((r) => (
          <Link key={r._id} to={`/dashboard/reports?report=${r._id}`} className={linkRow}>
            <Flag className="h-5 w-5 shrink-0 text-danger" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">
                {r.number ? `#${r.number} · ` : ''}
                {r.reason}
              </p>
              <p className="truncate text-xs text-ink-muted">
                About a {TARGET_LABEL[r.targetType] || r.targetType}
                {r.targetLabel ? `: ${r.targetLabel}` : ''} · {timeAgo(r.createdAt)}
              </p>
            </div>
            <StatusPill status={r.status} entity="report" />
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-disabled" />
          </Link>
        ))}
      </PagedBody>
    </ChartCard>
  )
}

/** Comments this user wrote on reviews (GET /admin/users/:id/comments), paged, deletable. */
export const CommentsCard = ({ userId, total: knownTotal }) => {
  const [page, setPage] = useState(1)
  const query = useGetAdminUserCommentsQuery({ id: userId, page, limit: PAGE_SIZE })
  const [deleteComment] = useDeleteReviewCommentMutation()
  const confirm = useConfirm()
  const banner = useBanner()
  const comments = query.data?.data?.comments || []
  const total = query.data?.data?.pagination?.total ?? knownTotal ?? 0

  const remove = async (comment) => {
    const ok = await confirm({
      tone: 'danger',
      icon: Trash2,
      title: 'Delete this comment?',
      message: 'The comment is removed from the review. Its replies stay visible under a “deleted” placeholder.',
      confirmText: 'Delete comment',
      onConfirm: () => deleteComment({ commentId: comment._id, reviewId: comment.review?._id, userId }).unwrap(),
    })
    if (ok) banner.success('Comment deleted')
  }

  return (
    <ChartCard
      title="Comments"
      subtitle={`${formatNumber(knownTotal ?? 0)} visible · ${formatNumber(total)} written`}
      divider
      className="pb-2"
      bodyClassName="-mx-[18px]"
    >
      <PagedBody query={query} items={comments} empty="No comments yet" total={total} page={page} setPage={setPage}>
        {comments.map((c) => (
          <div key={c._id} className={row}>
            <MessageCircle className="h-5 w-5 shrink-0 text-info" />
            <div className="min-w-0 flex-1">
              {c.isDeleted ? (
                <p className="text-sm italic text-ink-placeholder">Comment deleted</p>
              ) : (
                <p className="truncate text-sm text-ink" title={c.text}>
                  {c.text}
                </p>
              )}
              <p className="truncate text-xs text-ink-muted">
                {c.isReply ? 'Reply on ' : 'On '}
                {c.review ? (
                  <Link to={`/dashboard/reviews?review=${c.review._id}`} className="font-semibold hover:underline">
                    {c.review.number ? `Review #${c.review.number}` : 'a review'}
                    {c.review.restaurant ? ` · ${c.review.restaurant.name}` : ''}
                  </Link>
                ) : (
                  'a removed review'
                )}
                {c.review?.isDeleted ? ' (deleted)' : ''} · {formatNumber(c.likeCount)} likes · {timeAgo(c.createdAt)}
              </p>
            </div>
            {!c.isDeleted && <IconButton icon={Trash2} tone="danger" label="Delete comment" onClick={() => remove(c)} />}
          </div>
        ))}
      </PagedBody>
    </ChartCard>
  )
}
