import { Shapes } from 'lucide-react'
import { IonIcon, ionToLucide } from '@components'
import { getImageUrl } from '@utils'

/**
 * The visual the app shows for a catalog item: image > emoji > icon > generic fallback.
 * The app draws Ionicons; here the icon is the closest lucide glyph (ionToLucide), or its
 * name when there is no match.
 */
export const ItemVisual = ({ item }) => {
  if (item.image) {
    return <img src={getImageUrl(item.image)} alt="" className="h-10 w-10 rounded-lg border border-line object-cover" />
  }
  if (item.emoji) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-canvas text-xl">
        {item.emoji}
      </div>
    )
  }
  if (item.icon && ionToLucide(item.icon)) {
    return (
      <div
        title={`Ionicons: ${item.icon}`}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-canvas text-ink-secondary"
      >
        <IonIcon name={item.icon} className="h-5 w-5" strokeWidth={1.75} />
      </div>
    )
  }
  if (item.icon) {
    return (
      <span
        title="Ionicons icon name"
        className="inline-block max-w-[160px] truncate rounded-md bg-subtle px-2 py-1 font-mono text-[11px] text-ink-tertiary"
      >
        {item.icon}
      </span>
    )
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-subtle text-ink-disabled">
      <Shapes className="h-4 w-4" />
    </div>
  )
}
