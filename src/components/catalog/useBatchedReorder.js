import { useEffect, useRef, useState } from 'react'
import { moveItem } from './moveItem'

// `items` sorted by their position in `ids` (items missing from `ids` go last).
const orderBy = (items, ids) => {
  const position = new Map(ids.map((id, index) => [String(id), index]))
  const rank = (item) => position.get(String(item._id)) ?? Number.MAX_SAFE_INTEGER
  return [...items].sort((a, b) => rank(a) - rank(b))
}

/**
 * Up / down reordering with batched saves. Each move shows at once, and the
 * final order is saved in ONE request after the admin stops clicking for
 * `delay` ms. Admin writes are rate limited, so one click = one request would
 * run out quickly when an item moves several places.
 *
 * save(ids) → Promise (e.g. a reorder mutation's `.unwrap()`); it runs
 * immediately if the page unmounts while a move is still waiting.
 * → { list, move, pending }
 */
export const useBatchedReorder = (items, save, delay = 700) => {
  const [pendingIds, setPendingIds] = useState(null)
  const timer = useRef(null)
  const latestIds = useRef(null)
  const saveRef = useRef(save)

  useEffect(() => {
    saveRef.current = save
  })

  // Flush a waiting move when the page unmounts.
  useEffect(
    () => () => {
      if (!timer.current) return
      clearTimeout(timer.current)
      saveRef.current(latestIds.current).catch(() => {})
    },
    []
  )

  const list = pendingIds ? orderBy(items, pendingIds) : items

  const move = (from, to) => {
    const next = moveItem(list, from, to)
    if (next === list) return
    const ids = next.map((item) => item._id)
    latestIds.current = ids
    setPendingIds(ids)

    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      timer.current = null
      try {
        await saveRef.current(ids)
      } catch {
        // The caller reports the error; the list falls back to the server order.
      } finally {
        // Keep a newer pending order if the admin kept clicking meanwhile.
        setPendingIds((current) => (current === ids ? null : current))
      }
    }, delay)
  }

  return { list, move, pending: !!pendingIds }
}
