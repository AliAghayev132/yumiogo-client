import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Search, Home, Heart, User, Star, Navigation, Sparkles } from 'lucide-react'
import { DEFAULT_SENTIMENTS } from '@store/hooks'
import { getImageUrl } from '@utils'

/* ── live restaurant data (top-rated listings; grey placeholders while loading / when empty) ── */

const GRADIENTS = ['from-primary/50 to-pink/50', 'from-mint-line to-brand/70', 'from-warning/40 to-primary/60']

const coverOf = (r) => (r?.coverImages?.[0] ? getImageUrl(r.coverImages[0]) : '')
const metaOf = (r) =>
  [r?.cuisines?.[0], Number(r?.avgPrice) > 0 ? `${Math.round(r.avgPrice)}₼` : null].filter(Boolean).join(' · ')

const Placeholder = ({ className }) => <span className={`block rounded bg-line/70 ${className}`} />

const Cover = ({ restaurant, className, gradient }) => {
  const src = coverOf(restaurant)
  return src ? (
    <img src={src} alt="" className={`${className} object-cover`} loading="lazy" />
  ) : (
    <div className={`${className} bg-linear-to-br ${gradient}`} />
  )
}

/* ── individual app screens rendered inside the phone ── */

const MiniCard = ({ restaurant, gradient }) => (
  <div className="rounded-2xl bg-surface border border-line shadow-sm overflow-hidden">
    <Cover restaurant={restaurant} gradient={gradient} className="h-16 w-full" />
    <div className="p-2.5">
      {restaurant ? (
        <>
          <p className="font-display text-[11px] font-bold text-ink leading-tight truncate">{restaurant.name}</p>
          <p className="font-display text-[9px] mt-0.5 truncate">
            <span className={restaurant.openNow ? 'text-brand' : 'text-ink-muted'}>
              {restaurant.openNow ? 'Open now' : 'Closed'}
            </span>
            {metaOf(restaurant) && <span className="text-ink-secondary"> · {metaOf(restaurant)}</span>}
          </p>
        </>
      ) : (
        <>
          <Placeholder className="h-2.5 w-4/5" />
          <Placeholder className="mt-1.5 h-2 w-1/2" />
        </>
      )}
    </div>
  </div>
)

const DiscoverScreen = ({ cityLabel, restaurants }) => (
  <div>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[9px] text-ink-muted">Location</p>
        <p className="text-[12px] font-semibold text-ink flex items-center gap-1">
          <MapPin className="w-3 h-3 text-ink-secondary" /> {cityLabel}
        </p>
      </div>
      <div className="w-7 h-7 rounded-full bg-mint border border-mint-line flex items-center justify-center font-display text-[9px] font-bold text-mint-ink">
        LA
      </div>
    </div>
    <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface border border-line px-3 py-2">
      <Search className="w-3.5 h-3.5 text-ink-muted" />
      <span className="text-[10px] text-ink-placeholder">Search restaurants, cuisines...</span>
    </div>
    <p className="mt-4 mb-2 font-display text-[11px] font-bold text-ink">Near you</p>
    <div className="grid grid-cols-2 gap-2">
      <MiniCard restaurant={restaurants[0]} gradient={GRADIENTS[0]} />
      <MiniCard restaurant={restaurants[1]} gradient={GRADIENTS[1]} />
    </div>
    <div className="mt-3 rounded-2xl bg-subtle p-3 flex items-center justify-between">
      <div>
        <p className="font-display text-[11px] font-bold text-ink">Not sure where to eat?</p>
        <p className="text-[9px] text-ink-tertiary">We got you covered.</p>
      </div>
      <span className="text-[10px] font-semibold text-canvas bg-primary rounded-md px-2.5 py-1.5">Surprise me</span>
    </div>
  </div>
)

const MapScreen = ({ restaurants }) => (
  <div>
    <div className="flex items-center gap-2 rounded-lg bg-surface border border-line px-3 py-2">
      <Search className="w-3.5 h-3.5 text-ink-muted" />
      <span className="text-[10px] text-ink-tertiary">All restaurants</span>
    </div>
    {/* fake map */}
    <div className="mt-3 h-[176px] rounded-2xl bg-mint/40 border border-line relative overflow-hidden">
      <div className="absolute inset-0 opacity-60">
        <div className="absolute left-0 top-10 w-full h-[3px] bg-surface" />
        <div className="absolute left-0 top-24 w-full h-[3px] bg-surface" />
        <div className="absolute left-12 top-0 h-full w-[3px] bg-surface" />
        <div className="absolute left-32 top-0 h-full w-[3px] bg-surface" />
        <div className="absolute right-4 top-6 w-16 h-14 rounded-lg bg-mint-line/50" />
        <div className="absolute left-4 bottom-6 w-14 h-12 rounded-lg bg-mint-line/50" />
      </div>
      {[
        { top: 26, left: 30, delay: 0 },
        { top: 70, left: 96, delay: 0.15 },
        { top: 118, left: 44, delay: 0.3 },
        { top: 92, left: 150, delay: 0.45 },
      ].map((p, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, y: -8 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.3 + p.delay, type: 'spring', stiffness: 260, damping: 16 }}
          className="absolute w-7 h-7 rounded-full bg-primary border-2 border-surface shadow-md flex items-center justify-center"
          style={{ top: p.top, left: p.left }}
        >
          <span className="text-canvas text-[9px]">🍽</span>
        </motion.div>
      ))}
      <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-surface shadow flex items-center justify-center">
        <Navigation className="w-3.5 h-3.5 text-brand" />
      </div>
    </div>
    <div className="mt-3 rounded-2xl bg-surface border border-line shadow-sm p-2.5">
      {restaurants[2] || restaurants[0] ? (
        <>
          <p className="font-display text-[11px] font-bold text-ink truncate">
            {(restaurants[2] || restaurants[0]).name}
          </p>
          <p className="text-[9px] text-ink-muted mt-0.5 truncate">{metaOf(restaurants[2] || restaurants[0])}</p>
        </>
      ) : (
        <>
          <Placeholder className="h-2.5 w-2/3" />
          <Placeholder className="mt-1.5 h-2 w-1/3" />
        </>
      )}
    </div>
  </div>
)

const ReviewScreen = ({ sentiments, restaurants }) => {
  const r = restaurants[3] || restaurants[1] || restaurants[0]
  return (
    <div>
      <Cover restaurant={r} gradient={GRADIENTS[2]} className="h-20 w-full rounded-2xl" />
      {r ? (
        <>
          <p className="mt-3 font-display text-[13px] font-bold text-ink truncate">{r.name}</p>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 text-star fill-star" />
            <span className="text-[10px] font-medium text-ink">{Number(r.rating || 0).toFixed(1)}</span>
            <span className="text-[9px] text-ink-muted">
              ({r.reviewCount || 0} {r.reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        </>
      ) : (
        <>
          <Placeholder className="mt-3 h-3 w-3/4" />
          <Placeholder className="mt-2 h-2 w-1/3" />
        </>
      )}
      <div className="mt-3 rounded-2xl bg-surface border border-line p-3">
        <p className="font-display text-[10px] font-bold text-ink">How was your experience?</p>
        <div className="mt-2 flex gap-1.5">
          {sentiments.map((s, i) => {
            // The first reaction (liked) is shown as picked.
            const active = i === 0
            return (
              <motion.div
                key={s.key}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className={`flex-1 min-w-0 rounded-xl border py-2 px-1 text-center ${
                  active ? 'border-mint-line bg-mint/50' : 'border-line bg-surface'
                }`}
              >
                <div className="text-sm">{s.emoji}</div>
                <div
                  className={`text-[8px] leading-tight mt-0.5 truncate ${active ? 'text-mint-ink' : 'text-ink-muted'}`}
                >
                  {s.label}
                </div>
              </motion.div>
            )
          })}
        </div>
        <div className="mt-2 rounded-lg bg-canvas border border-line px-2.5 py-2">
          <span className="text-[9px] text-ink-placeholder">Add a comment…</span>
        </div>
        <div className="mt-2 rounded-md bg-primary py-1.5 text-center">
          <span className="text-[10px] font-semibold text-canvas">Post review</span>
        </div>
      </div>
    </div>
  )
}

const SCREENS = [
  { key: 'discover', Screen: DiscoverScreen, label: 'Discover', icon: Home },
  { key: 'map', Screen: MapScreen, label: 'Map search', icon: MapPin },
  { key: 'review', Screen: ReviewScreen, label: 'Reviews', icon: Star },
]

/**
 * PhoneShowcase — device frame that cycles through three app screens, with floating chips
 * orbiting the phone. The content is live: `restaurants` are the top-rated listings (names,
 * covers, cuisine, ₼ price, open now, rating), the location line is the default city and the
 * reactions are the review sentiments from the app config (defaults while loading).
 */
export const PhoneShowcase = ({
  cityLabel = 'Baku, Azerbaijan',
  sentiments = DEFAULT_SENTIMENTS,
  restaurants = [],
}) => {
  const liked = sentiments.find((s) => s.key === 'liked')
  const top = restaurants.find((r) => Number(r.rating) > 0)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SCREENS.length), 3600)
    return () => clearInterval(id)
  }, [])

  const active = SCREENS[index]

  return (
    <div className="relative mx-auto w-[290px] sm:w-[310px]">
      <motion.div
        className="absolute -inset-12 bg-brand/20 blur-3xl rounded-full"
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      />

      {/* frame */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="relative rounded-[2.8rem] border border-line bg-surface p-2 shadow-2xl shadow-mint-deep/10"
      >
        <div className="rounded-[2.3rem] bg-canvas overflow-hidden">
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="w-24 h-5 bg-ink rounded-full" />
          </div>

          <div className="px-4 pb-5 pt-2 min-h-[352px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.key}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <active.Screen cityLabel={cityLabel} sentiments={sentiments} restaurants={restaurants} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* tab bar */}
          <div className="mx-4 mb-4 flex justify-around rounded-2xl bg-surface border border-line py-2 shadow-sm">
            {[Home, Search, Heart, User].map((Icon, i) => (
              <Icon
                key={i}
                className={`w-4 h-4 ${
                  (index === 0 && i === 0) || (index === 1 && i === 1) || (index === 2 && i === 0)
                    ? 'text-brand'
                    : 'text-ink-disabled'
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* screen switcher dots */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {SCREENS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={s.label}
            className={`h-2 rounded-full transition-all ${
              i === index ? 'w-7 bg-brand' : 'w-2 bg-line hover:bg-ink-disabled'
            }`}
          />
        ))}
      </div>

      {/* floating chips (the rating chip names the top-rated restaurant) */}
      {top && (
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-16 top-24 hidden sm:flex items-center gap-1.5 rounded-full bg-surface border border-line px-3 py-2 shadow-lg shadow-ink/5"
        >
          <Star className="w-3.5 h-3.5 text-star fill-star" />
          <span className="text-xs font-semibold text-ink">{Number(top?.rating || 0).toFixed(1)}</span>
          <span className="text-[10px] text-ink-muted truncate max-w-[120px]">{top?.name}</span>
        </motion.div>
      )}
      <motion.div
        animate={{ y: [0, 9, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute -right-14 top-52 hidden sm:flex items-center gap-1.5 rounded-full bg-surface border border-line px-3 py-2 shadow-lg shadow-ink/5"
      >
        <span className="text-sm">{liked?.emoji ?? '😊'}</span>
        <span className="text-xs font-semibold text-brand-hover">{liked?.label || 'Liked it'}</span>
      </motion.div>
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -right-10 bottom-28 hidden sm:flex items-center gap-1.5 rounded-full bg-surface border border-line px-3 py-2 shadow-lg shadow-ink/5"
      >
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-ink">Surprise me</span>
      </motion.div>
    </div>
  )
}

export default PhoneShowcase
