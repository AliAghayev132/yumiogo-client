import { Check, EyeOff, Flag, RotateCcw, Trash2 } from 'lucide-react'
import { useBanner, useConfirm } from '@components'
import {
  useSetReviewStatusMutation,
  useDeleteModerationReviewMutation,
  useRecomputeRatingsMutation,
} from '@store/api'

const label = (review) => (review?.number ? `Review #${review.number}` : 'this review')
const idOf = (value) => (value && typeof value === 'object' ? value._id : value) || undefined
// Cache hints: the restaurant and author detail pages refresh after the write.
const hints = (review) => ({ restaurantId: idOf(review.restaurant), userId: idOf(review.user) })

/**
 * Review moderation flows (Figma modalBoxes 1352:6577 approve, 1352:6486 delete) shared by
 * the table rows and the detail modal. Every action confirms first, runs the request inside
 * the dialog (errors stay in the dialog) and reports with the Figma snackbar copy.
 * → { approve, flag, reject, toPending, remove, recalculate } — each resolves true when done.
 */
export const useReviewActions = () => {
  const confirm = useConfirm()
  const banner = useBanner()
  const [setStatus] = useSetReviewStatusMutation()
  const [deleteReview] = useDeleteModerationReviewMutation()
  const [recompute] = useRecomputeRatingsMutation()

  const changeStatus = async (review, status, options, fallback, tone = 'success') => {
    const ok = await confirm({
      ...options,
      onConfirm: (reason) =>
        setStatus({ id: review._id, status, reason: reason || undefined, ...hints(review) }).unwrap(),
    })
    if (!ok) return false
    banner[tone](ok.result?.message || fallback)
    return true
  }

  const approve = (review) =>
    changeStatus(
      review,
      'approved',
      {
        tone: 'success',
        icon: Check,
        title: `Approve ${label(review)}?`,
        message: 'This review will be published. The user will receive a notification.',
        confirmText: 'Approve',
      },
      `${label(review)} approved — user notified`
    )

  const flag = (review) =>
    changeStatus(
      review,
      'flagged',
      {
        tone: 'warning',
        icon: Flag,
        title: `Flag ${label(review)}?`,
        message:
          'The review is hidden from the app until it is approved, and the restaurant rating no longer counts it. The user will be notified.',
        confirmText: 'Flag review',
        reasonField: {
          label: 'Reason (optional)',
          placeholder: 'e.g. Needs a second look...',
          maxLength: 500,
        },
      },
      `${label(review)} flagged — user notified`,
      'warning'
    )

  const reject = (review) =>
    changeStatus(
      review,
      'rejected',
      {
        tone: 'danger',
        icon: EyeOff,
        title: `Reject ${label(review)}?`,
        message:
          'The review will be hidden from the app and its open reports resolved. The user will be notified with the reason.',
        notice: 'Restaurant rating will be recalculated.',
        confirmText: 'Reject review',
        reasonField: {
          label: 'Reason for rejection',
          placeholder: 'e.g. Violates community guidelines...',
          maxLength: 500,
        },
      },
      `${label(review)} rejected — user notified`,
      'warning'
    )

  const toPending = (review) =>
    changeStatus(
      review,
      'pending',
      {
        tone: 'info',
        icon: RotateCcw,
        title: `Move ${label(review)} to pending?`,
        message: 'The review is hidden from the app until a moderator approves it.',
        confirmText: 'Move to pending',
      },
      `${label(review)} moved to pending`,
      'info'
    )

  const remove = async (review) => {
    const ok = await confirm({
      tone: 'danger',
      icon: Trash2,
      title: `Delete ${label(review)}?`,
      message:
        'This review will be removed from the app and its open reports resolved. The user will be notified with the reason.',
      notice: 'Restaurant rating will be recalculated after deletion. The review stays in the admin records.',
      confirmText: 'Delete review',
      reasonField: {
        label: 'Reason for deletion',
        placeholder: 'e.g. Violates community guidelines...',
        maxLength: 500,
      },
      onConfirm: (reason) => deleteReview({ id: review._id, reason: reason || undefined, ...hints(review) }).unwrap(),
    })
    if (!ok) return false
    // Figma 1352:6614: the "deleted" snackbar is red.
    banner.error(ok.result?.message || `${label(review)} deleted — user notified`, { duration: 5000, host: 'page' })
    return true
  }

  /** Recalculate one restaurant's rating (`{ _id, name }`) or every rating (no argument). */
  const recalculate = async (restaurant) => {
    const one = !!restaurant?._id
    const ok = await confirm({
      tone: 'info',
      icon: RotateCcw,
      title: one ? `Recalculate ${restaurant.name}?` : 'Recalculate all ratings?',
      message: one
        ? 'The rating, review count and sentiment split are rebuilt from its approved reviews.'
        : 'Every restaurant rating, review count and sentiment split is rebuilt from the approved reviews.',
      confirmText: 'Recalculate',
      onConfirm: () => recompute(one ? { restaurant: restaurant._id } : {}).unwrap(),
    })
    if (!ok) return false
    const data = ok.result?.data || {}
    if (one) {
      const s = data.summary || {}
      banner.success(`${restaurant.name}: ${s.rating ?? 0} rating from ${s.reviewCount ?? 0} reviews`, {
        title: 'Rating recalculated',
      })
    } else {
      banner.success(`${data.updated ?? 0} of ${data.restaurants ?? 0} restaurants changed`, {
        title: 'Ratings recalculated',
      })
    }
    return true
  }

  return { approve, flag, reject, toPending, remove, recalculate }
}
