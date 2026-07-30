import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import Swal from 'sweetalert2'
import { Card, Table, Badge, Button, SkeletonTable } from '@components'
import { useGetAdminReviewsQuery, useDeleteReviewMutation } from '@store/api'

const sentimentMeta = {
  liked: { label: '😊 Liked it', variant: 'success' },
  fine: { label: '🙂 It was fine', variant: 'warning' },
  disliked: { label: '☹️ Didn’t like it', variant: 'danger' },
}

export const ReviewsPage = () => {
  const [sentiment, setSentiment] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useGetAdminReviewsQuery({ sentiment, page, limit: 10 })
  const [deleteReview] = useDeleteReviewMutation()

  const reviews = data?.data?.reviews || []
  const pagination = data?.data?.pagination || {}

  const remove = async (rv) => {
    const res = await Swal.fire({
      icon: 'warning',
      title: 'Remove review?',
      text: 'This review will be hidden from the app.',
      showCancelButton: true,
      confirmButtonText: 'Remove',
      confirmButtonColor: '#EF4444',
    })
    if (!res.isConfirmed) return
    try {
      await deleteReview(rv._id).unwrap()
    } catch (err) {
      Swal.fire({ icon: 'error', text: err?.data?.message || 'Failed' })
    }
  }

  const filters = ['', 'liked', 'fine', 'disliked']

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f || 'all'}
              onClick={() => {
                setSentiment(f)
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sentiment === f ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f ? sentimentMeta[f].label : 'All'}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-500">{pagination.total ?? 0} reviews</span>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={6} />
        ) : (
          <Table>
            <Table.Header>
              <Table.Row hoverable={false}>
                <Table.Head>Reviewer</Table.Head>
                <Table.Head>Restaurant</Table.Head>
                <Table.Head>Sentiment</Table.Head>
                <Table.Head>Comment</Table.Head>
                <Table.Head align="right">Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {reviews.map((rv) => (
                <Table.Row key={rv._id}>
                  <Table.Cell className="font-medium whitespace-nowrap">
                    {rv.user?.firstName} {rv.user?.lastName}
                  </Table.Cell>
                  <Table.Cell className="text-gray-500 whitespace-nowrap">{rv.restaurant?.name}</Table.Cell>
                  <Table.Cell>
                    <Badge variant={sentimentMeta[rv.sentiment]?.variant}>
                      {sentimentMeta[rv.sentiment]?.label}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="max-w-xs">
                    <span className="text-gray-600 line-clamp-1">{rv.comment || '—'}</span>
                  </Table.Cell>
                  <Table.Cell align="right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => remove(rv)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
              {!reviews.length && (
                <Table.Row hoverable={false}>
                  <Table.Cell className="text-center text-gray-400 py-8">No reviews found.</Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        )}
      </Card>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </Button>
          <span className="text-sm text-gray-500">
            Page {pagination.page} / {pagination.pages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
