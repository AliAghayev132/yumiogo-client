import { useEffect, useRef, useState } from 'react'
import { MapPin, Minus, Plus } from 'lucide-react'
import { clsx } from 'clsx'

// OpenStreetMap raster tiles (Web Mercator, 256px). Attribution is required by the tile policy.
const TILE = 256
const TILE_URL = (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
const MIN_ZOOM = 3
const MAX_ZOOM = 19
const NUDGE = 32 // px per arrow key press
const CLICK_SLOP = 4 // px a press may move and still count as a click

const project = (lat, lng, z) => {
  const scale = TILE * 2 ** z
  const s = Math.sin((Math.max(-85, Math.min(85, lat)) * Math.PI) / 180)
  return { x: ((lng + 180) / 360) * scale, y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * scale }
}

const unproject = (x, y, z) => {
  const scale = TILE * 2 ** z
  const n = Math.PI - (2 * Math.PI * y) / scale
  // Wrapped into -180…180 (dragging across the antimeridian).
  const lng = ((((x / scale) * 360 - 180 + 540) % 360) + 360) % 360 - 180
  return { lat: (180 / Math.PI) * Math.atan(Math.sinh(n)), lng }
}

const round6 = (n) => Math.round(n * 1e6) / 1e6

/**
 * Map picker for a restaurant's coordinates: OSM tiles with the pin in the centre.
 * Drag the map under the pin, click a spot to move the pin there, or use the arrow keys;
 * +/− zoom. Calls onChange({ lat, lng }) (6 decimals) when the pin moves.
 * Without valid coordinates it shows a hint instead of a map.
 */
export const LocationPicker = ({ lat, lng, onChange, disabled = false, height = 280 }) => {
  const boxRef = useRef(null)
  const pressRef = useRef(null)
  const [width, setWidth] = useState(0)
  const [zoom, setZoom] = useState(16)
  const [offset, setOffset] = useState({ x: 0, y: 0 }) // live drag offset
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const el = boxRef.current
    if (!el) return undefined
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const valid = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 85 && Math.abs(lng) <= 180
  const centre = valid ? project(lat, lng, zoom) : null

  const moveBy = (dx, dy) => {
    if (!centre || disabled) return
    const next = unproject(centre.x + dx, centre.y + dy, zoom)
    onChange?.({ lat: round6(next.lat), lng: round6(next.lng) })
  }

  const onPointerDown = (e) => {
    if (!centre || disabled || e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const rect = e.currentTarget.getBoundingClientRect()
    pressRef.current = { x: e.clientX, y: e.clientY, left: rect.left, top: rect.top, moved: false }
  }
  const onPointerMove = (e) => {
    const press = pressRef.current
    if (!press) return
    const dx = e.clientX - press.x
    const dy = e.clientY - press.y
    if (!press.moved && Math.hypot(dx, dy) > CLICK_SLOP) {
      press.moved = true
      setDragging(true)
    }
    if (press.moved) setOffset({ x: dx, y: dy })
  }
  const onPointerUp = (e) => {
    const press = pressRef.current
    pressRef.current = null
    if (!press) return
    setOffset({ x: 0, y: 0 })
    setDragging(false)
    if (press.moved) {
      // Dragging moves the map: the new centre is where the pin now points.
      moveBy(-(e.clientX - press.x), -(e.clientY - press.y))
    } else {
      // A click moves the pin to that spot.
      moveBy(e.clientX - press.left - width / 2, e.clientY - press.top - height / 2)
    }
  }
  const onKeyDown = (e) => {
    const step = { ArrowLeft: [-NUDGE, 0], ArrowRight: [NUDGE, 0], ArrowUp: [0, -NUDGE], ArrowDown: [0, NUDGE] }[e.key]
    if (step) {
      e.preventDefault()
      moveBy(...step)
    } else if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(MAX_ZOOM, z + 1))
    else if (e.key === '-') setZoom((z) => Math.max(MIN_ZOOM, z - 1))
  }

  // Tiles covering the box (world wraps horizontally; rows outside the world are skipped).
  const tiles = []
  if (centre && width) {
    const left = centre.x - offset.x - width / 2
    const top = centre.y - offset.y - height / 2
    const count = 2 ** zoom
    for (let ty = Math.floor(top / TILE); ty <= Math.floor((top + height) / TILE); ty += 1) {
      if (ty < 0 || ty >= count) continue
      for (let tx = Math.floor(left / TILE); tx <= Math.floor((left + width) / TILE); tx += 1) {
        const wrapped = ((tx % count) + count) % count
        tiles.push({ key: `${zoom}/${tx}/${ty}`, src: TILE_URL(zoom, wrapped, ty), x: tx * TILE - left, y: ty * TILE - top })
      }
    }
  }

  return (
    <div
      ref={boxRef}
      className="relative w-full overflow-hidden rounded-lg border border-line bg-subtle"
      style={{ height }}
    >
      {valid ? (
        <>
          <div
            role="application"
            aria-label="Restaurant location map. Drag or use the arrow keys to move the pin, plus and minus to zoom."
            tabIndex={disabled ? -1 : 0}
            className={clsx(
              'absolute inset-0 touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
              disabled ? 'cursor-default' : dragging ? 'cursor-grabbing' : 'cursor-grab'
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => {
              pressRef.current = null
              setOffset({ x: 0, y: 0 })
              setDragging(false)
            }}
            onKeyDown={onKeyDown}
          >
            {tiles.map((t) => (
              <img
                key={t.key}
                src={t.src}
                alt=""
                draggable={false}
                className="pointer-events-none absolute h-64 w-64 max-w-none"
                style={{ left: t.x, top: t.y }}
              />
            ))}
          </div>

          {/* Pin (its tip marks the centre) */}
          <MapPin
            className="pointer-events-none absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-full fill-danger text-surface drop-shadow"
            strokeWidth={1.5}
            aria-hidden
          />

          <div className="absolute right-2 top-2 flex flex-col overflow-hidden rounded-md border border-line bg-surface shadow-sm">
            <button
              type="button"
              aria-label="Zoom in"
              disabled={zoom >= MAX_ZOOM}
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 1))}
              className="flex h-8 w-8 items-center justify-center text-ink hover:bg-subtle disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              disabled={zoom <= MIN_ZOOM}
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 1))}
              className="flex h-8 w-8 items-center justify-center border-t border-line text-ink hover:bg-subtle disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>

          <p className="pointer-events-none absolute left-2 top-2 rounded-md bg-surface/90 px-2 py-1 text-xs text-ink-secondary shadow-sm">
            {disabled ? 'Location' : 'Drag the map or click to move the pin'}
          </p>
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-0 right-0 rounded-tl-md bg-surface/85 px-1.5 py-0.5 text-[10px] text-ink-tertiary hover:text-ink"
          >
            © OpenStreetMap contributors
          </a>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-1 px-6 text-center">
          <MapPin className="h-6 w-6 text-ink-disabled" />
          <p className="text-sm font-semibold text-ink">No location on the map yet</p>
          <p className="text-xs text-ink-muted">Find the coordinates from the address, use the city centre or type them in.</p>
        </div>
      )}
    </div>
  )
}
