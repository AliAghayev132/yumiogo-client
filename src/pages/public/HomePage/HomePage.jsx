import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import {
  MapPin,
  Heart,
  Sparkles,
  Users,
  Star,
  ChevronDown,
  ArrowRight,
  UtensilsCrossed,
  Apple,
  Play,
} from 'lucide-react'
import { SEO } from '@components'
import { PhoneShowcase } from './PhoneShowcase'
import { useCountUp } from './useCountUp'

/* ─────────────────────────── content ─────────────────────────── */

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how' },
  { label: 'FAQ', href: '#faq' },
]

const CUISINES = [
  'Azerbaijani', 'Turkish', 'Italian', 'Japanese', 'Georgian', 'Chinese',
  'Seafood', 'Steakhouse', 'Vegan', 'Cafe', 'Mediterranean', 'Indian',
]

const STATS = [
  { value: 250, suffix: '+', label: 'Restaurants listed' },
  { value: 12, suffix: 'k', label: 'Honest reactions' },
  { value: 40, suffix: '+', label: 'Cuisines covered' },
  { value: 98, suffix: '%', label: 'Would recommend' },
]

const STEPS = [
  { title: 'Sign up', text: 'Create your account in seconds — or browse as a guest first.' },
  { title: 'Set your tastes', text: 'Pick the cuisines and dietary preferences you love.' },
  { title: 'Explore nearby', text: 'Browse the map and see what’s open around you right now.' },
  { title: 'Save favourites', text: 'Heart the spots you love and organize them into lists.' },
  { title: 'Follow friends', text: 'See honest reviews and lists from people you trust.' },
  { title: 'Get surprised', text: 'Can’t decide? Spin once and let Yumio pick for you.' },
]

const FAQS = [
  {
    q: 'What is Yumio?',
    a: 'Yumio is a restaurant discovery app for finding the best places to eat around you — powered by a map, honest reactions from real visitors, and recommendations from friends you follow.',
  },
  {
    q: 'How do ratings work?',
    a: 'Instead of cold star ratings, people react to a visit with “Liked it”, “It was fine” or “Didn’t like it”. We aggregate those reactions into every restaurant’s score, so you always know how a place actually feels.',
  },
  {
    q: 'What are collaborative lists?',
    a: 'Any favourites list can be made collaborative — share the link and everyone you invite can add places. Perfect for planning group dinners, trips, or building the definitive “best kebab in Baku” list together.',
  },
  {
    q: 'What does “Surprise me” do?',
    a: 'One tap picks a random open restaurant near you. Don’t like the pick? Spin again — Yumio never repeats a suggestion in the same session.',
  },
  {
    q: 'Is Yumio free?',
    a: 'Yes — discovering restaurants, writing reviews, and building lists are all completely free.',
  },
]

/* ─────────────────────────── helpers ─────────────────────────── */

const Logo = ({ className = '' }) => (
  <span className={`flex items-center gap-2 ${className}`}>
    <span className="w-9 h-9 rounded-xl bg-green-500 text-white flex items-center justify-center font-extrabold text-lg shadow-sm shadow-green-500/30">
      Y
    </span>
    <span className="text-lg font-bold text-gray-900">
      Yumio<span className="text-green-500">.</span>
    </span>
  </span>
)

const fadeUp = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
}

const StatItem = ({ value, suffix, label, delay }) => {
  const [ref, display] = useCountUp(value)
  return (
    <motion.div ref={ref} {...fadeUp} transition={{ ...fadeUp.transition, delay }} className="text-center">
      <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 tabular-nums">
        {display}
        <span className="text-green-500">{suffix}</span>
      </p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </motion.div>
  )
}

/** Infinite horizontal marquee of cuisine chips. */
const CuisineMarquee = () => (
  <div className="relative overflow-hidden py-6">
    <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10" />
    <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10" />
    <motion.div
      className="flex gap-3 w-max"
      animate={{ x: ['0%', '-50%'] }}
      transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
    >
      {[...CUISINES, ...CUISINES].map((c, i) => (
        <span
          key={`${c}-${i}`}
          className="whitespace-nowrap rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 shadow-sm"
        >
          {c}
        </span>
      ))}
    </motion.div>
  </div>
)

/* ─────────────────────────── page ─────────────────────────── */

export const HomePage = () => {
  const [openFaq, setOpenFaq] = useState(0)
  const heroRef = useRef(null)

  // Page-wide scroll progress bar.
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })

  // Hero parallax — blobs and content drift at different speeds.
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const blobY = useTransform(heroProgress, [0, 1], [0, 140])
  const blobY2 = useTransform(heroProgress, [0, 1], [0, -90])
  const heroFade = useTransform(heroProgress, [0, 0.8], [1, 0.25])

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased selection:bg-green-200">
      <SEO
        title="Yumio — Find your next favourite restaurant"
        description="Discover the best restaurants around you — honest reviews, shared lists with friends, and a little surprise when you can't decide."
      />

      {/* scroll progress */}
      <motion.div
        style={{ scaleX: progress }}
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-600 origin-left z-50"
      />

      {/* ───────── nav ───────── */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#top" aria-label="Yumio">
            <Logo />
          </a>
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="relative text-sm text-gray-500 hover:text-gray-900 transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-green-500 after:transition-all hover:after:w-full"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Log in
            </Link>
            <motion.a
              href="#download"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="text-sm font-semibold rounded-full bg-green-500 text-white px-4 py-2 shadow-sm shadow-green-500/30"
            >
              Get the app
            </motion.a>
          </div>
        </div>
      </header>

      {/* ───────── hero ───────── */}
      <section
        id="top"
        ref={heroRef}
        className="relative overflow-hidden bg-gradient-to-b from-green-50/70 via-white to-white"
      >
        <motion.div
          style={{ y: blobY }}
          className="absolute -top-32 -left-32 w-[480px] h-[480px] bg-green-200/40 blur-3xl rounded-full"
          aria-hidden
        />
        <motion.div
          style={{ y: blobY2 }}
          className="absolute top-40 -right-40 w-[520px] h-[520px] bg-orange-100/60 blur-3xl rounded-full"
          aria-hidden
        />

        <motion.div
          style={{ opacity: heroFade }}
          className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 lg:pt-24 grid lg:grid-cols-2 gap-16 items-center"
        >
          <div>
            <motion.div {...fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-xs font-semibold text-green-700">
                <motion.span
                  animate={{ rotate: [0, 15, -10, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </motion.span>
                Discover · Save · Share
              </span>
            </motion.div>

            <motion.h1
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.08 }}
              className="mt-6 text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.08] tracking-tight"
            >
              Find your next{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">
                  favourite
                </span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
                  className="absolute bottom-1 left-0 right-0 h-3 bg-green-200/60 origin-left rounded-sm"
                  aria-hidden
                />
              </span>{' '}
              restaurant
            </motion.h1>

            <motion.p
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.16 }}
              className="mt-6 text-lg text-gray-500 max-w-md leading-relaxed"
            >
              The best spots around you — honest reactions from real visitors, lists you build with
              friends, and a little surprise when you can’t decide.
            </motion.p>

            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.24 }}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              <motion.a
                href="#download"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="group inline-flex items-center gap-2 rounded-full bg-green-500 text-white font-bold px-7 py-3.5 shadow-lg shadow-green-500/30"
              >
                Get the app
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </motion.a>
              <motion.a
                href="#features"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-7 py-3.5 font-semibold text-gray-700"
              >
                Explore features
              </motion.a>
            </motion.div>

            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.32 }}
              className="mt-10 flex items-center gap-4"
            >
              <div className="flex -space-x-2">
                {['bg-emerald-400', 'bg-orange-400', 'bg-teal-400', 'bg-rose-400'].map((c, i) => (
                  <motion.span
                    key={c}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.08, type: 'spring', stiffness: 300 }}
                    className={`w-8 h-8 rounded-full ${c} border-2 border-white shadow-sm`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-400">
                Loved by food explorers <span className="text-gray-700 font-semibold">across Baku</span>
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
          >
            <PhoneShowcase />
          </motion.div>
        </motion.div>

        {/* cuisine marquee */}
        <div className="relative border-t border-gray-100 bg-white">
          <CuisineMarquee />
        </div>
      </section>

      {/* ───────── stats ───────── */}
      <section className="py-16 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <StatItem key={s.label} {...s} delay={i * 0.08} />
          ))}
        </div>
      </section>

      {/* ───────── features (bento) ───────── */}
      <section id="features" className="relative py-24 bg-gray-50/60">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto">
            <p className="text-sm font-bold uppercase tracking-widest text-green-600">Why Yumio?</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight">
              Everything you need to eat better
            </h2>
            <p className="mt-4 text-gray-500">
              One app for discovering, deciding and remembering every great place you eat.
            </p>
          </motion.div>

          <div className="mt-14 grid md:grid-cols-3 gap-5">
            <motion.div
              {...fadeUp}
              whileHover={{ y: -6 }}
              className="md:col-span-2 rounded-3xl border border-gray-100 bg-white p-8 relative overflow-hidden shadow-sm hover:shadow-xl transition-shadow"
            >
              <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-green-100/70 blur-2xl rounded-full" aria-hidden />
              <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="mt-5 text-xl font-bold">Discover on the map</h3>
              <p className="mt-2 text-gray-500 max-w-md">
                See every restaurant around you in real time — filter by distance, rating, price and
                what’s open right now.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['Open now', '≤ 1 km', '4.5★+', 'Halal', 'Vegan options'].map((chip, i) => (
                  <motion.span
                    key={chip}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + i * 0.06 }}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-xs font-medium text-gray-600"
                  >
                    {chip}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            <motion.div
              {...fadeUp}
              whileHover={{ y: -6 }}
              transition={{ ...fadeUp.transition, delay: 0.08 }}
              className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="mt-5 text-xl font-bold">Honest reactions</h3>
              <p className="mt-2 text-gray-500 text-sm">
                No confusing stars — visits are rated the way people actually feel.
              </p>
              <div className="mt-5 space-y-2">
                {[
                  { t: '😊 Liked it', c: 'bg-green-100 text-green-700' },
                  { t: '🙂 It was fine', c: 'bg-amber-100 text-amber-700' },
                  { t: '☹️ Didn’t like it', c: 'bg-rose-100 text-rose-700' },
                ].map((s, i) => (
                  <motion.span
                    key={s.t}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + i * 0.1 }}
                    className={`flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${s.c}`}
                  >
                    {s.t}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            <motion.div
              {...fadeUp}
              whileHover={{ y: -6 }}
              className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center">
                <Heart className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="mt-5 text-xl font-bold">Lists you build together</h3>
              <p className="mt-2 text-gray-500 text-sm">
                Save favourites into lists — private, public or collaborative, so friends can add
                places too.
              </p>
              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-gray-50 border border-gray-100 p-3">
                <Users className="w-4 h-4 text-green-600 shrink-0" />
                <p className="text-xs text-gray-600">
                  “Date night favourites” <span className="text-gray-400">· 13 places · 3 friends</span>
                </p>
              </div>
            </motion.div>

            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.08 }}
              className="md:col-span-2 rounded-3xl border border-green-200 bg-gradient-to-r from-green-50 to-white p-8 relative overflow-hidden shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center shrink-0"
                >
                  <Sparkles className="w-6 h-6 text-green-600" />
                </motion.div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">Can’t decide? Surprise me.</h3>
                  <p className="mt-2 text-gray-500 max-w-lg">
                    One tap spins the wheel and picks a random open spot near you. Never the same
                    suggestion twice.
                  </p>
                </div>
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="inline-flex w-fit items-center gap-2 rounded-full bg-orange-500 text-white font-bold px-6 py-3 shadow-lg shadow-orange-500/30 cursor-default"
                >
                  <UtensilsCrossed className="w-4 h-4" /> Spin it
                </motion.span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───────── how it works ───────── */}
      <section id="how" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto">
            <p className="text-sm font-bold uppercase tracking-widest text-green-600">How it works</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight">
              From “where should we eat?” to “table for two”
            </h2>
          </motion.div>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                {...fadeUp}
                whileHover={{ y: -5 }}
                transition={{ ...fadeUp.transition, delay: (i % 3) * 0.08 }}
                className="group rounded-3xl border border-gray-100 bg-white p-7 shadow-sm hover:shadow-lg hover:border-green-200 transition-all"
              >
                <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-green-100 text-sm font-extrabold text-green-700 transition-colors group-hover:bg-green-500 group-hover:text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{s.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section id="faq" className="py-24 bg-gray-50/60">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-green-600">FAQ</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight">Common questions</h2>
          </motion.div>

          <div className="mt-12 space-y-3">
            {FAQS.map((f, i) => {
              const open = openFaq === i
              return (
                <motion.div
                  key={f.q}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.05 }}
                  className={`rounded-2xl border bg-white overflow-hidden transition-colors ${
                    open ? 'border-green-200 shadow-md' : 'border-gray-100 shadow-sm'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="font-semibold">{f.q}</span>
                    <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                    </motion.span>
                  </button>
                  <motion.div
                    initial={false}
                    animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-6 text-gray-500 leading-relaxed">{f.a}</p>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ───────── download band ───────── */}
      <section id="download" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            {...fadeUp}
            className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-green-500 to-emerald-600 px-8 py-16 text-center shadow-xl shadow-green-500/25"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-white/15 blur-3xl rounded-full"
              aria-hidden
            />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Ready to eat better?
              </h2>
              <p className="mt-4 text-green-50/90 max-w-md mx-auto">
                Join Yumio today and never ask “where should we eat?” again.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-4">
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-3 rounded-2xl bg-white text-gray-900 px-6 py-3.5 font-semibold shadow-lg"
                >
                  <Apple className="w-6 h-6" />
                  <span className="text-left leading-tight">
                    <span className="block text-[10px] font-medium text-gray-500">Download on the</span>
                    App Store
                  </span>
                </motion.a>
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-3 rounded-2xl border border-white/40 bg-white/10 px-6 py-3.5 font-semibold text-white"
                >
                  <Play className="w-6 h-6" />
                  <span className="text-left leading-tight">
                    <span className="block text-[10px] font-medium text-green-100">Get it on</span>
                    Google Play
                  </span>
                </motion.a>
              </div>
              <p className="mt-5 text-xs text-green-100/80">Coming soon to both stores · Baku first 🇦🇿</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───────── footer ───────── */}
      <footer className="border-t border-gray-100 py-14 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div>
              <Logo />
              <p className="mt-4 text-sm text-gray-400 max-w-xs leading-relaxed">
                Find your next favourite restaurant — discover, save and share the places worth
                eating at.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800">Product</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-gray-900 transition-colors">Features</a></li>
                <li><a href="#how" className="hover:text-gray-900 transition-colors">How it works</a></li>
                <li><a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800">Support</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-gray-400">
                <li>
                  <a href="mailto:support@yumio.app" className="hover:text-gray-900 transition-colors">
                    support@yumio.app
                  </a>
                </li>
                <li><Link to="/login" className="hover:text-gray-900 transition-colors">Admin login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800">Get the app</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-gray-400">
                <li><a href="#download" className="hover:text-gray-900 transition-colors">iOS — coming soon</a></li>
                <li><a href="#download" className="hover:text-gray-900 transition-colors">Android — coming soon</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
            <span>© {new Date().getFullYear()} Yumio. All rights reserved.</span>
            <span className="flex items-center gap-5">
              <span className="hover:text-gray-600 cursor-pointer">Privacy</span>
              <span className="hover:text-gray-600 cursor-pointer">Terms</span>
              <span className="hover:text-gray-600 cursor-pointer">Cookies</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
