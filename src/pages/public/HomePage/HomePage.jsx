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
  ArrowUp,
  Apple,
  Play,
} from 'lucide-react'
import { SEO, Logo, IconTile, Skeleton } from '@components'
import {
  useGetCatalogQuery,
  useGetPublicFaqsQuery,
  useGetPublicPagesQuery,
  useGetPublicStatsQuery,
  useGetShowcaseRestaurantsQuery,
} from '@store/api'
import { mergeSentiments } from '@store/hooks'
import { getImageUrl } from '@utils'
import { PhoneShowcase } from './PhoneShowcase'
import { useCountUp } from './useCountUp'

/* ─────────────────────────── content ─────────────────────────── */

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how' },
  { label: 'FAQ', href: '#faq' },
]

// Headline numbers from GET /content/stats — a stat that is 0 is hidden.
const STAT_ITEMS = [
  { field: 'restaurants', label: 'Restaurants listed' },
  { field: 'reviews', label: 'Honest reactions' },
  { field: 'cuisines', label: 'Cuisines covered' },
  { field: 'likedPercent', label: 'Liked their visit', percent: true },
]

const STAT_COLS = { 1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4' }

// Filter chips on the map card while the catalog loads (then built from it).
const FALLBACK_FILTER_CHIPS = ['Open now', '≤ 1.5 km', '4.5★+', 'Vegetarian', 'Gluten free']

// 1500 → "1.5 km", 800 → "800 m"
const formatDistance = (m) => (m >= 1000 ? `${Number((m / 1000).toFixed(1))} km` : `${m} m`)

/** A few of the app's real filters: open now, the first distance chip, the top rating, two dietary options. */
const filterChips = (catalog) => {
  if (!catalog) return FALLBACK_FILTER_CHIPS
  const distance = catalog.config?.quickFilters?.distance?.[0]
  const ratings = catalog.config?.filters?.ratingOptions || []
  return [
    'Open now',
    ...(distance ? [`≤ ${formatDistance(distance)}`] : []),
    ...(ratings.length ? [`${Math.max(...ratings)}★+`] : []),
    ...(catalog.dietary || []).slice(0, 2).map((d) => d.name),
  ]
}

// Chip colours on the "Honest reactions" card (labels come from the app config).
const SENTIMENT_CHIP = {
  liked: 'bg-success-soft text-success',
  fine: 'bg-warning-soft text-warning',
  disliked: 'bg-error-soft text-error',
}

// Hero "loved by" avatars (illustrative initials, Figma friends illustration style).
const HERO_AVATARS = [
  { initials: 'SD', tone: 'bg-brand' },
  { initials: 'AP', tone: 'bg-primary' },
  { initials: 'JS', tone: 'bg-purple' },
  { initials: 'LA', tone: 'bg-info' },
]

const STEPS = [
  { title: 'Sign up', text: 'Create your account in seconds — or browse as a guest first.' },
  { title: 'Set your tastes', text: 'Pick the cuisines and dietary preferences you love.' },
  { title: 'Explore nearby', text: 'Browse the map and see what’s open around you right now.' },
  { title: 'Save favourites', text: 'Heart the spots you love and organize them into lists.' },
  { title: 'Follow friends', text: 'See honest reviews and lists from people you trust.' },
  { title: 'Get surprised', text: 'Can’t decide? Spin once and let Yumio pick for you.' },
]

// Shared look of the landing CTAs (Figma button: radius 8, DM Sans 600).
const CTA_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-canvas shadow-lg shadow-primary/25 transition-colors hover:bg-primary-hover active:bg-primary-active'
const FOOTER_LINK = 'transition-colors hover:text-ink'

/* ─────────────────────────── helpers ─────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
}

/**
 * Rounded display parts for a real count: 7 → "7" · 257 → "250+" ·
 * 1234 → "1.2k+" · 12400 → "12k+". `value` is what the count-up animates to;
 * `scale` turns it back into one decimal.
 */
const statParts = (n, percent) => {
  if (percent) return { value: n, suffix: '%' }
  if (n >= 10000) return { value: Math.floor(n / 1000), suffix: n % 1000 ? 'k+' : 'k' }
  if (n >= 1000) return { value: Math.floor(n / 100), scale: 10, suffix: n % 100 ? 'k+' : 'k' }
  if (n >= 100) return { value: Math.floor(n / 10) * 10, suffix: n % 10 ? '+' : '' }
  return { value: n, suffix: '' }
}

const StatItem = ({ value, scale, suffix, label, delay }) => {
  const [ref, display] = useCountUp(value)
  return (
    <motion.div ref={ref} {...fadeUp} transition={{ ...fadeUp.transition, delay }} className="text-center">
      <p className="font-display text-3xl font-bold tabular-nums text-ink sm:text-4xl">
        {scale ? Number((display / scale).toFixed(1)) : display}
        <span className="text-brand">{suffix}</span>
      </p>
      <p className="mt-1 text-sm text-ink-muted">{label}</p>
    </motion.div>
  )
}

/** Figma "cuisines-offer" chip: round photo (or emoji) + Plus Jakarta name. */
const CuisineChip = ({ cuisine }) => {
  const visual = cuisine.image || cuisine.emoji
  return (
    <span
      className={`inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-full border border-line bg-surface pr-4 font-display text-sm font-bold text-ink shadow-sm ${
        visual ? 'pl-2' : 'pl-4'
      }`}
    >
      {cuisine.image ? (
        <img
          src={getImageUrl(cuisine.image)}
          alt=""
          loading="lazy"
          className="h-8 w-8 rounded-full bg-subtle object-cover"
          onError={(e) => {
            e.currentTarget.style.visibility = 'hidden'
          }}
        />
      ) : (
        cuisine.emoji && (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mint text-base">
            {cuisine.emoji}
          </span>
        )
      )}
      {cuisine.name}
    </span>
  )
}

/** Infinite horizontal marquee of cuisine chips (active catalog cuisines). */
const CuisineMarquee = ({ cuisines }) => (
  <div className="relative min-h-[96px] overflow-hidden py-6">
    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-surface to-transparent sm:w-24" />
    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-surface to-transparent sm:w-24" />
    <motion.div
      className="flex w-max gap-3"
      animate={{ x: ['0%', '-50%'] }}
      transition={{ duration: Math.max(26, cuisines.length * 2.2), repeat: Infinity, ease: 'linear' }}
    >
      {[...cuisines, ...cuisines].map((c, i) => (
        <CuisineChip key={`${c._id}-${i}`} cuisine={c} />
      ))}
    </motion.div>
  </div>
)

/* ─────────────────────────── page ─────────────────────────── */

/**
 * App Store / Google Play button. With a store URL it opens the listing; without one (app not
 * published yet) it is a disabled "Coming soon" button.
 */
const StoreButton = ({ href, icon: StoreIcon, caption, store, className, captionClassName }) => {
  const body = (
    <>
      <StoreIcon className="h-6 w-6" />
      <span className="text-left leading-tight">
        <span className={`block text-[10px] font-medium ${captionClassName}`}>{href ? caption : 'Coming soon to'}</span>
        {store}
      </span>
    </>
  )
  const base = `inline-flex items-center gap-3 rounded-xl px-6 py-3.5 font-semibold ${className}`
  if (!href) {
    return (
      <span aria-disabled="true" title={`${store} — coming soon`} className={`${base} cursor-default opacity-80`}>
        {body}
      </span>
    )
  }
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={base}
    >
      {body}
    </motion.a>
  )
}

export const HomePage = () => {
  const [openFaq, setOpenFaq] = useState(0)

  // Live content: catalog (cuisines, contact, sentiments), website FAQs, real stats.
  const { data: catalogData, isLoading: catalogLoading } = useGetCatalogQuery()
  const { data: faqData, isLoading: faqsLoading } = useGetPublicFaqsQuery('web')
  const { data: statsData, isLoading: statsLoading } = useGetPublicStatsQuery()
  // Top-rated live restaurants for the phone mock-up.
  const { data: showcaseRestaurants = [] } = useGetShowcaseRestaurantsQuery(4)
  // Published legal pages (Content → Legal pages) for the footer.
  const { data: pagesData } = useGetPublicPagesQuery()
  const legalPages = pagesData?.data?.pages || []

  const catalog = catalogData?.data
  const cuisines = catalog?.cuisines || []
  const sentiments = mergeSentiments(catalog?.config?.sentiments)
  const supportEmail = catalog?.config?.supportEmail
  const supportPhone = catalog?.config?.supportPhone
  // Store listings (App config → App stores); empty = not published yet ("Coming soon").
  const iosUrl = catalog?.config?.appLinks?.ios || ''
  const androidUrl = catalog?.config?.appLinks?.android || ''
  const storeNote = iosUrl && androidUrl ? null : iosUrl || androidUrl ? 'Coming soon to the other store' : 'Coming soon to both stores'
  // Default city from the catalog (Cities → default), for the hero and CTA copy.
  const homeCity = catalog?.defaultCity?.name || 'Baku'
  const homeCountry = catalog?.defaultCity?.country ?? 'Azerbaijan'
  const faqs = faqData?.data?.faqs || []
  const showFaqs = faqsLoading || faqs.length > 0
  const navLinks = NAV_LINKS.filter((l) => l.href !== '#faq' || showFaqs)
  const rawStats = statsData?.data?.stats || {}
  const stats = STAT_ITEMS.filter((item) => Number(rawStats[item.field]) > 0).map((item) => ({
    label: item.label,
    ...statParts(Number(rawStats[item.field]), item.percent),
  }))
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
    <div className="min-h-screen overflow-x-clip bg-surface text-ink antialiased selection:bg-mint selection:text-mint-deep">
      <SEO
        title="Yumio — Find your next favourite restaurant"
        description="Discover the best restaurants around you — honest reviews, shared lists with friends, and a little surprise when you can't decide."
      />

      {/* scroll progress */}
      <motion.div
        style={{ scaleX: progress }}
        className="fixed left-0 right-0 top-0 z-50 h-1 origin-left bg-linear-to-r from-brand to-brand-hover"
      />

      {/* ───────── nav ───────── */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#top" aria-label="Yumio home" className="shrink-0">
            <Logo width={96} />
          </a>
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="relative text-sm font-medium text-ink-tertiary transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-brand after:transition-all hover:text-ink hover:after:w-full"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-secondary transition-colors hover:bg-subtle hover:text-ink"
            >
              Log in
            </Link>
            <motion.a
              href="#download"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className={`${CTA_PRIMARY} h-10 px-4 text-sm shadow-sm`}
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
        className="relative overflow-hidden bg-linear-to-b from-mint/45 via-surface to-surface"
      >
        <motion.div
          style={{ y: blobY }}
          className="absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full bg-mint/60 blur-3xl"
          aria-hidden
        />
        <motion.div
          style={{ y: blobY2 }}
          className="absolute -right-40 top-40 h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />

        <motion.div
          style={{ opacity: heroFade }}
          className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:pt-24"
        >
          <div>
            <motion.div {...fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-mint-line bg-mint/60 px-4 py-1.5 font-display text-xs font-semibold text-mint-ink">
                <motion.span
                  animate={{ rotate: [0, 15, -10, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </motion.span>
                Discover · Save · Share
              </span>
            </motion.div>

            <motion.h1
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.08 }}
              className="mt-6 font-display text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]"
            >
              Find your next{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-brand">favourite</span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
                  className="absolute bottom-1 left-0 right-0 h-3 origin-left rounded-sm bg-mint"
                  aria-hidden
                />
              </span>{' '}
              restaurant
            </motion.h1>

            <motion.p
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.16 }}
              className="mt-6 max-w-md text-lg leading-relaxed text-ink-tertiary"
            >
              The best spots around you — honest reactions from real visitors, lists you build with
              friends, and a little surprise when you can’t decide.
            </motion.p>

            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.24 }}
              className="mt-9 flex flex-wrap items-center gap-3 sm:gap-4"
            >
              <motion.a
                href="#download"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className={`group ${CTA_PRIMARY} h-12 px-7 text-base`}
              >
                Get the app
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </motion.a>
              <motion.a
                href="#features"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-line bg-surface px-7 text-base font-semibold text-ink transition-colors hover:bg-subtle"
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
                {HERO_AVATARS.map((a, i) => (
                  <motion.span
                    key={a.initials}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.08, type: 'spring', stiffness: 300 }}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface font-display text-[10px] font-bold text-canvas shadow-sm ${a.tone}`}
                    aria-hidden
                  >
                    {a.initials}
                  </motion.span>
                ))}
              </div>
              <p className="text-sm text-ink-muted">
                Loved by food explorers <span className="font-semibold text-ink-secondary">across {homeCity}</span>
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
          >
            <PhoneShowcase
              cityLabel={catalog?.defaultCity?.label}
              sentiments={sentiments}
              restaurants={showcaseRestaurants}
            />
          </motion.div>
        </motion.div>

        {/* cuisine marquee */}
        {(catalogLoading || cuisines.length > 0) && (
          <div className="relative border-t border-line/70 bg-surface">
            <CuisineMarquee cuisines={cuisines} />
          </div>
        )}
      </section>

      {/* ───────── stats ───────── */}
      {statsLoading ? (
        <section className="border-b border-line/70 py-16" aria-hidden>
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-4 sm:px-6 md:grid-cols-4">
            {STAT_ITEMS.map((s) => (
              <div key={s.field} className="flex flex-col items-center gap-2">
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="h-4 w-28 rounded" />
              </div>
            ))}
          </div>
        </section>
      ) : (
        stats.length > 0 && (
          <section className="border-b border-line/70 py-16">
            <div
              className={`mx-auto grid max-w-5xl px-4 sm:px-6 ${stats.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} ${STAT_COLS[stats.length]} gap-8`}
            >
              {stats.map((s, i) => (
                <StatItem key={s.label} {...s} delay={i * 0.08} />
              ))}
            </div>
          </section>
        )
      )}

      {/* ───────── features (bento) ───────── */}
      <section id="features" className="relative scroll-mt-16 bg-canvas py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <p className="font-display text-sm font-bold uppercase tracking-widest text-brand-hover">Why Yumio?</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Everything you need to eat better
            </h2>
            <p className="mt-4 text-ink-tertiary">
              One app for discovering, deciding and remembering every great place you eat.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            <motion.div
              {...fadeUp}
              whileHover={{ y: -6 }}
              className="relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-sm transition-shadow hover:shadow-xl sm:p-8 md:col-span-2"
            >
              <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-mint/70 blur-2xl" aria-hidden />
              <div className="relative">
                <IconTile icon={MapPin} tone="green" size="lg" />
                <h3 className="mt-5 font-display text-xl font-bold text-ink">Discover on the map</h3>
                <p className="mt-2 max-w-md text-ink-tertiary">
                  See every restaurant around you in real time — filter by distance, rating, price and
                  what’s open right now.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {filterChips(catalog).map((chip, i) => (
                    <motion.span
                      key={chip}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.15 + i * 0.06 }}
                      className="rounded-full border border-line bg-canvas px-3.5 py-1.5 text-xs font-medium text-ink-secondary"
                    >
                      {chip}
                    </motion.span>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              {...fadeUp}
              whileHover={{ y: -6 }}
              transition={{ ...fadeUp.transition, delay: 0.08 }}
              className="rounded-2xl border border-line bg-surface p-6 shadow-sm transition-shadow hover:shadow-xl sm:p-8"
            >
              <IconTile icon={Star} tone="amber" size="lg" />
              <h3 className="mt-5 font-display text-xl font-bold text-ink">Honest reactions</h3>
              <p className="mt-2 text-sm text-ink-tertiary">
                No confusing stars — visits are rated the way people actually feel.
              </p>
              <div className="mt-5 space-y-2">
                {sentiments.map((s, i) => (
                  <motion.span
                    key={s.key}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + i * 0.1 }}
                    className={`flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${SENTIMENT_CHIP[s.key]}`}
                  >
                    {s.emoji} {s.label}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            <motion.div
              {...fadeUp}
              whileHover={{ y: -6 }}
              className="rounded-2xl border border-line bg-surface p-6 shadow-sm transition-shadow hover:shadow-xl sm:p-8"
            >
              <IconTile icon={Heart} tone="pink" size="lg" />
              <h3 className="mt-5 font-display text-xl font-bold text-ink">Lists you build together</h3>
              <p className="mt-2 text-sm text-ink-tertiary">
                Save favourites into lists — private, public or collaborative, so friends can add
                places too.
              </p>
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-line bg-canvas p-3">
                <Users className="h-4 w-4 shrink-0 text-brand" />
                <p className="text-xs text-ink-secondary">
                  “Date night favourites” <span className="text-ink-placeholder">· 13 places · 3 friends</span>
                </p>
              </div>
            </motion.div>

            {/* Figma Home "Offer card": #F5F5F5 card, the surprise wheel and the orange Surprise me button */}
            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.08 }}
              className="relative overflow-hidden rounded-2xl border border-line bg-subtle p-6 shadow-sm sm:p-8 md:col-span-2"
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <IconTile icon={Sparkles} tone="orange" size="lg" />
                  <h3 className="mt-5 font-display text-xl font-bold text-ink sm:text-2xl">
                    Not sure where to eat? We got you.
                  </h3>
                  <p className="mt-2 max-w-md text-ink-tertiary">
                    One tap spins the wheel and picks a random open spot near you. Never the same
                    suggestion twice.
                  </p>
                  <motion.a
                    href="#download"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className={`${CTA_PRIMARY} mt-6 h-10 px-5 text-sm`}
                  >
                    Surprise me
                  </motion.a>
                </div>
                <motion.img
                  src="/images/surprise-wheel.png"
                  alt=""
                  width={225}
                  height={168}
                  loading="lazy"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
                  className="-mb-6 w-[180px] self-end sm:-mb-8 sm:w-[225px]"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───────── how it works ───────── */}
      <section id="how" className="scroll-mt-16 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <p className="font-display text-sm font-bold uppercase tracking-widest text-brand-hover">How it works</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              From “where should we eat?” to “table for two”
            </h2>
          </motion.div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                {...fadeUp}
                whileHover={{ y: -5 }}
                transition={{ ...fadeUp.transition, delay: (i % 3) * 0.08 }}
                className="group rounded-2xl border border-line bg-surface p-6 shadow-sm transition-all hover:border-mint-line hover:shadow-lg sm:p-7"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-mint font-display text-sm font-bold text-mint-ink transition-colors group-hover:bg-brand group-hover:text-canvas">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-tertiary">{s.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      {showFaqs && (
        <section id="faq" className="scroll-mt-16 bg-canvas py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <motion.div {...fadeUp} className="text-center">
              <p className="font-display text-sm font-bold uppercase tracking-widest text-brand-hover">FAQ</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Common questions
              </h2>
            </motion.div>

            <div className="mt-12 space-y-3">
              {faqsLoading &&
                [0, 1, 2].map((i) => (
                  <div key={i} className="rounded-2xl border border-line bg-surface px-6 py-5 shadow-sm">
                    <Skeleton className="h-5 w-2/3 rounded" />
                  </div>
                ))}
              {faqs.map((f, i) => {
                const open = openFaq === i
                return (
                  <motion.div
                    key={f._id}
                    {...fadeUp}
                    transition={{ ...fadeUp.transition, delay: i * 0.05 }}
                    className={`overflow-hidden rounded-2xl border bg-surface transition-colors ${
                      open ? 'border-mint-line shadow-md' : 'border-line shadow-sm'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : i)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
                    >
                      <span className="font-semibold text-ink">{f.question}</span>
                      <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className={`h-5 w-5 shrink-0 ${open ? 'text-brand' : 'text-ink-muted'}`} />
                      </motion.span>
                    </button>
                    <motion.div
                      initial={false}
                      animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <p className="whitespace-pre-line px-5 pb-6 leading-relaxed text-ink-tertiary sm:px-6">
                        {f.answer}
                      </p>
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ───────── download band ───────── */}
      <section id="download" className="scroll-mt-16 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            {...fadeUp}
            className="relative overflow-hidden rounded-[2rem] bg-linear-to-br from-brand to-brand-hover px-6 py-14 text-center shadow-xl shadow-brand/25 sm:rounded-[2.5rem] sm:px-8 sm:py-16"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-24 left-1/2 h-[300px] w-[500px] -translate-x-1/2 rounded-full bg-surface/15 blur-3xl"
              aria-hidden
            />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold tracking-tight text-canvas sm:text-4xl">
                Ready to eat better?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-canvas/90">
                Join Yumio today and never ask “where should we eat?” again.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-4">
                <StoreButton
                  href={iosUrl}
                  icon={Apple}
                  caption="Download on the"
                  store="App Store"
                  className="bg-surface text-ink shadow-lg"
                  captionClassName="text-ink-muted"
                />
                <StoreButton
                  href={androidUrl}
                  icon={Play}
                  caption="Get it on"
                  store="Google Play"
                  className="border border-canvas/40 bg-canvas/10 text-canvas"
                  captionClassName="text-canvas/80"
                />
              </div>
              <p className="mt-5 text-xs text-canvas/80">
                {storeNote ? `${storeNote} · ` : ''}
                {homeCity} first{homeCountry === 'Azerbaijan' ? ' 🇦🇿' : ''}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───────── footer ───────── */}
      <footer className="border-t border-line/70 bg-surface py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Logo width={96} />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-muted">
                Find your next favourite restaurant — discover, save and share the places worth
                eating at.
              </p>
            </div>
            <div>
              <h4 className="font-display text-sm font-bold text-ink">Product</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
                <li><a href="#features" className={FOOTER_LINK}>Features</a></li>
                <li><a href="#how" className={FOOTER_LINK}>How it works</a></li>
                {showFaqs && (
                  <li><a href="#faq" className={FOOTER_LINK}>FAQ</a></li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-display text-sm font-bold text-ink">Support</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
                {supportEmail && (
                  <li>
                    <a href={`mailto:${supportEmail}`} className={`${FOOTER_LINK} break-all`}>
                      {supportEmail}
                    </a>
                  </li>
                )}
                {supportPhone && (
                  <li>
                    <a href={`tel:${supportPhone.replace(/[^\d+]/g, '')}`} className={FOOTER_LINK}>
                      {supportPhone}
                    </a>
                  </li>
                )}
                <li><Link to="/login" className={FOOTER_LINK}>Admin login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display text-sm font-bold text-ink">Get the app</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
                <li>
                  {iosUrl ? (
                    <a href={iosUrl} target="_blank" rel="noreferrer" className={FOOTER_LINK}>iOS — App Store</a>
                  ) : (
                    <a href="#download" className={FOOTER_LINK}>iOS — coming soon</a>
                  )}
                </li>
                <li>
                  {androidUrl ? (
                    <a href={androidUrl} target="_blank" rel="noreferrer" className={FOOTER_LINK}>Android — Google Play</a>
                  ) : (
                    <a href="#download" className={FOOTER_LINK}>Android — coming soon</a>
                  )}
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line/70 pt-8 text-xs text-ink-muted sm:flex-row">
            <span>© {new Date().getFullYear()} Yumio. All rights reserved.</span>
            <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {legalPages.map((p) => (
                <Link key={p.slug} to={`/legal/${p.slug}`} className={FOOTER_LINK}>
                  {p.title}
                </Link>
              ))}
              <a href="#top" className={`inline-flex items-center gap-1.5 ${FOOTER_LINK}`}>
                Back to top <ArrowUp className="h-3.5 w-3.5" />
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
