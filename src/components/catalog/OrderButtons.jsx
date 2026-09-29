import { ChevronUp, ChevronDown } from 'lucide-react'

/**
 * Up / down reorder controls for row `index` of a `count`-long list.
 * onMove(from, to) — pair with moveItem:
 *   reorder({ ids: moveItem(items, from, to).map((i) => i._id) })
 */
export const OrderButtons = ({ index, count, onMove, disabled = false }) => {
  const btn =
    'w-7 h-7 rounded-md flex items-center justify-center text-ink-muted hover:bg-subtle hover:text-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent'

  return (
    <div className="inline-flex items-center gap-0.5">
      <button
        type="button"
        className={btn}
        disabled={disabled || index <= 0}
        onClick={() => onMove(index, index - 1)}
        title="Move up"
        aria-label="Move up"
      >
        <ChevronUp className="w-4 h-4" />
      </button>
      <button
        type="button"
        className={btn}
        disabled={disabled || index >= count - 1}
        onClick={() => onMove(index, index + 1)}
        title="Move down"
        aria-label="Move down"
      >
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  )
}
