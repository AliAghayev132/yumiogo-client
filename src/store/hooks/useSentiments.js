import { useMemo } from 'react'
import { useGetAdminSettingsQuery } from '@store/api'

/**
 * Review sentiments (label, emoji, colour) are edited in App config and stored
 * in Settings.sentiments. These are the server defaults, used until settings
 * load (or when a stored field is blank) so the UI never renders empty labels.
 */
export const DEFAULT_SENTIMENTS = [
  { key: 'liked', label: 'Liked it', emoji: '😊', color: '#22C55E' },
  { key: 'fine', label: 'It was fine', emoji: '🙂', color: '#FFCC00' },
  { key: 'disliked', label: "Didn't like it", emoji: '☹️', color: '#EC221F' },
]

/** Stored sentiments merged over the defaults, in key order (liked, fine, disliked). */
export const mergeSentiments = (saved) =>
  DEFAULT_SENTIMENTS.map((fallback) => {
    const s = (saved || []).find((item) => item.key === fallback.key) || {}
    return {
      key: fallback.key,
      label: s.label || fallback.label,
      emoji: s.emoji ?? fallback.emoji,
      color: s.color || fallback.color,
    }
  })

/** Sentiments from the admin settings (defaults while loading). */
export const useSentiments = () => {
  const { data } = useGetAdminSettingsQuery()
  const saved = data?.data?.settings?.sentiments
  return useMemo(() => mergeSentiments(saved), [saved])
}

export default useSentiments
