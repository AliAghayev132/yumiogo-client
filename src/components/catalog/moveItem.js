/**
 * Move `list[from]` to position `to` (returns a new array; the same array when
 * the move is a no-op or out of range).
 */
export const moveItem = (list, from, to) => {
  if (to < 0 || to >= list.length || from === to) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}
