import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Search, Home, Heart, User, Star, Navigation, Sparkles } from 'lucide-react'

/* ── individual app screens rendered inside the phone ── */

const MiniCard = ({ gradient, name, meta }) => (
  <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
    <div className={`h-16 bg-gradient-to-br ${gradient}`} />
    <div className="p-2.5">
      <p className="text-[11px] font-semibold text-gray-900 leading-tight truncate">{name}</p>
      <p className="text-[9px] text-green-600 mt-0.5">
        Open now <span className="text-gray-400">· {meta}</span>
      </p>
    </div>
  </div>
)

const DiscoverScreen = () => (
  <div>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[9px] text-gray-400">Location</p>
        <p className="text-[12px] font-semibold text-gray-900 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-green-500" /> Baku, Azerbaijan
        </p>
      </div>
      <div className="w-7 h-7 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-[9px] font-bold text-green-700">
        LA
      </div>
    </div>
    <div className="mt-3 flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-3 py-2 shadow-sm">
      <Search className="w-3.5 h-3.5 text-gray-400" />
      <span className="text-[10px] text-gray-400">Search restaurants, cuisines...</span>
    </div>
    <p className="mt-4 mb-2 text-[11px] font-bold text-gray-900">Near you</p>
    <div className="grid grid-cols-2 gap-2">
      <MiniCard gradient="from-orange-300 to-rose-400" name="SAHiL Bar & Restaurant" meta="1.2 km" />
      <MiniCard gradient="from-emerald-300 to-teal-500" name="Caravan Baku" meta="800 m" />
    </div>
    <div className="mt-3 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-3 flex items-center justify-between">
      <div>
        <p className="text-[11px] font-bold text-gray-900">Not sure where to eat?</p>
        <p className="text-[9px] text-gray-500">We got you covered.</p>
      </div>
      <span className="text-[10px] font-bold text-white bg-orange-500 rounded-full px-2.5 py-1.5">
        Surprise me
      </span>
    </div>
  </div>
)

const MapScreen = () => (
  <div>
    <div className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-3 py-2 shadow-sm">
      <Search className="w-3.5 h-3.5 text-gray-400" />
      <span className="text-[10px] text-gray-500">All restaurants</span>
    </div>
    {/* fake map */}
    <div className="mt-3 h-[176px] rounded-2xl bg-[#EAF3EC] border border-gray-100 relative overflow-hidden">
      <div className="absolute inset-0 opacity-60">
        <div className="absolute left-0 top-10 w-full h-[3px] bg-white" />
        <div className="absolute left-0 top-24 w-full h-[3px] bg-white" />
        <div className="absolute left-12 top-0 h-full w-[3px] bg-white" />
        <div className="absolute left-32 top-0 h-full w-[3px] bg-white" />
        <div className="absolute right-4 top-6 w-16 h-14 rounded-lg bg-emerald-200/70" />
        <div className="absolute left-4 bottom-6 w-14 h-12 rounded-lg bg-emerald-200/70" />
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
          className="absolute w-7 h-7 rounded-full bg-red-500 border-2 border-white shadow-md flex items-center justify-center"
          style={{ top: p.top, left: p.left }}
        >
          <span className="text-white text-[9px]">🍽</span>
        </motion.div>
      ))}
      <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center">
        <Navigation className="w-3.5 h-3.5 text-green-600" />
      </div>
    </div>
    <div className="mt-3 rounded-2xl bg-white border border-gray-100 shadow-sm p-2.5">
      <p className="text-[11px] font-semibold text-gray-900">Nero Bistro</p>
      <p className="text-[9px] text-gray-400 mt-0.5">Italian · 25₼ · 1.4 km</p>
    </div>
  </div>
)

const ReviewScreen = () => (
  <div>
    <div className="h-20 rounded-2xl bg-gradient-to-br from-amber-200 to-orange-300" />
    <p className="mt-3 text-[13px] font-bold text-gray-900">China Town Restaurant</p>
    <div className="flex items-center gap-1 mt-1">
      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
      <span className="text-[10px] font-semibold text-gray-900">3.8</span>
      <span className="text-[9px] text-gray-400">(128 reviews)</span>
    </div>
    <div className="mt-3 rounded-2xl bg-gray-50 border border-gray-100 p-3">
      <p className="text-[10px] font-bold text-gray-900">How was your experience?</p>
      <div className="mt-2 flex gap-1.5">
        {[
          { e: '😊', l: 'Liked it', active: true },
          { e: '🙂', l: 'Fine', active: false },
          { e: '☹️', l: 'Nope', active: false },
        ].map((s, i) => (
          <motion.div
            key={s.l}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className={`flex-1 rounded-xl border py-2 text-center ${
              s.active ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="text-sm">{s.e}</div>
            <div className={`text-[8px] mt-0.5 ${s.active ? 'text-green-700' : 'text-gray-400'}`}>
              {s.l}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-2 rounded-xl bg-white border border-gray-200 px-2.5 py-2">
        <span className="text-[9px] text-gray-400">Add a comment…</span>
      </div>
      <div className="mt-2 rounded-full bg-orange-500 py-1.5 text-center">
        <span className="text-[10px] font-bold text-white">Post review</span>
      </div>
    </div>
  </div>
)

const SCREENS = [
  { key: 'discover', node: <DiscoverScreen />, label: 'Discover', icon: Home },
  { key: 'map', node: <MapScreen />, label: 'Map search', icon: MapPin },
  { key: 'review', node: <ReviewScreen />, label: 'Reviews', icon: Star },
]

/**
 * PhoneShowcase — device frame that cycles through three live-looking app
 * screens, with floating stat chips orbiting the phone.
 */
export const PhoneShowcase = () => {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SCREENS.length), 3600)
    return () => clearInterval(id)
  }, [])

  const active = SCREENS[index]

  return (
    <div className="relative mx-auto w-[290px] sm:w-[310px]">
      <motion.div
        className="absolute -inset-12 bg-green-400/25 blur-3xl rounded-full"
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      />

      {/* frame */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="relative rounded-[2.8rem] border border-gray-200 bg-white p-2 shadow-2xl shadow-green-900/10"
      >
        <div className="rounded-[2.3rem] bg-gray-50 overflow-hidden">
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="w-24 h-5 bg-gray-900 rounded-full" />
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
                {active.node}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* tab bar */}
          <div className="mx-4 mb-4 flex justify-around rounded-2xl bg-white border border-gray-100 py-2 shadow-sm">
            {[Home, Search, Heart, User].map((Icon, i) => (
              <Icon
                key={i}
                className={`w-4 h-4 ${
                  (index === 0 && i === 0) || (index === 1 && i === 1) || (index === 2 && i === 0)
                    ? 'text-green-500'
                    : 'text-gray-300'
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
            onClick={() => setIndex(i)}
            aria-label={s.label}
            className={`h-2 rounded-full transition-all ${
              i === index ? 'w-7 bg-green-500' : 'w-2 bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>

      {/* floating chips */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-16 top-24 hidden sm:flex items-center gap-1.5 rounded-full bg-white border border-gray-100 px-3 py-2 shadow-lg shadow-gray-200/60"
      >
        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
        <span className="text-xs font-semibold text-gray-900">4.8</span>
        <span className="text-[10px] text-gray-400">(1k+ reviews)</span>
      </motion.div>
      <motion.div
        animate={{ y: [0, 9, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute -right-14 top-52 hidden sm:flex items-center gap-1.5 rounded-full bg-white border border-gray-100 px-3 py-2 shadow-lg shadow-gray-200/60"
      >
        <span className="text-sm">😊</span>
        <span className="text-xs font-semibold text-green-600">Liked it</span>
      </motion.div>
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -right-10 bottom-28 hidden sm:flex items-center gap-1.5 rounded-full bg-white border border-gray-100 px-3 py-2 shadow-lg shadow-gray-200/60"
      >
        <Sparkles className="w-3.5 h-3.5 text-green-500" />
        <span className="text-xs font-semibold text-gray-900">Surprise me</span>
      </motion.div>
    </div>
  )
}

export default PhoneShowcase
