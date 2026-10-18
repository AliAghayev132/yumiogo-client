import { useGetAdminSettingsQuery } from '@store/api'

/** Server default of Settings.ratingDisplay.minReviewsForPercent (App config → Review sentiments). */
export const DEFAULT_MIN_REVIEWS_FOR_PERCENT = 10

/**
 * How restaurant ratings are shown: the liked % appears from `minReviewsForPercent` reviews,
 * below that the restaurant is "New". Uses the default while the settings load.
 */
export const useRatingDisplay = () => {
  const { data } = useGetAdminSettingsQuery()
  const min = Number(data?.data?.settings?.ratingDisplay?.minReviewsForPercent)
  return { minReviewsForPercent: Number.isFinite(min) && min >= 1 ? min : DEFAULT_MIN_REVIEWS_FOR_PERCENT }
}

export default useRatingDisplay
