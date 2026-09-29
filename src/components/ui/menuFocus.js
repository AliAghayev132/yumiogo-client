// Arrow-key navigation between the enabled buttons of a menu panel.
export const moveFocus = (container, dir) => {
  const items = [...(container?.querySelectorAll('button:not([disabled])') || [])]
  if (!items.length) return
  const i = items.indexOf(document.activeElement)
  const next = dir === 'first' ? 0 : dir === 'last' ? items.length - 1 : (i + dir + items.length) % items.length
  items[next]?.focus()
}
