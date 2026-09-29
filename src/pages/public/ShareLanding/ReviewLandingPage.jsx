import { useParams } from 'react-router'
import { Lock, MessageSquareQuote, Star } from 'lucide-react'
import { SEO } from '@components'
import { AppCta, LandingShell, LandingState } from './LandingShell'
import { deepLinks } from './landingUtils'

const OBJECT_ID = /^[a-f\d]{24}$/i

/** Blurred stand-in of a review card (reviews are only readable when signed in). */
const LockedPreview = () => (
  <div className="relative mx-auto w-full max-w-sm select-none" aria-hidden>
    <div className="rounded-xl border border-line bg-canvas p-4 text-left blur-[2px]">
      <div className="flex items-center gap-3">
        <span className="h-9 w-9 rounded-full bg-mint" />
        <span className="flex-1">
          <span className="block h-3 w-28 rounded bg-line" />
          <span className="mt-1.5 block h-2.5 w-16 rounded bg-subtle" />
        </span>
        <span className="flex gap-0.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-star text-star" />
          ))}
        </span>
      </div>
      <span className="mt-4 block h-2.5 w-full rounded bg-line" />
      <span className="mt-2 block h-2.5 w-11/12 rounded bg-line" />
      <span className="mt-2 block h-2.5 w-2/3 rounded bg-line" />
    </div>
    <span className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 font-display text-xs font-semibold text-canvas shadow-lg">
      <Lock className="h-3.5 w-3.5" /> For Yumio members
    </span>
  </div>
)

/**
 * /review/:id — teaser of a shared review. Reviews need a signed-in account, so this page
 * calls no review endpoint and hands the link to the app instead.
 */
export const ReviewLandingPage = () => {
  const { id } = useParams()
  const path = `/review/${id}`

  if (!OBJECT_ID.test(id || '')) {
    return (
      <LandingShell>
        <SEO title="Review not found" path={path} noindex />
        <LandingState
          title="This review link is not valid"
          description="It looks incomplete. Ask the person who shared it to send it again, or discover reviews in the Yumio app."
        >
          <AppCta />
        </LandingState>
      </LandingShell>
    )
  }

  return (
    <LandingShell>
      <SEO
        title="A review on Yumio"
        description="Someone shared a review on Yumio — open it in the app to read it."
        path={path}
        noindex
      />

      <article className="rounded-2xl border border-line bg-surface px-5 py-8 text-center shadow-sm sm:px-10 sm:py-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-mint text-mint-ink">
          <MessageSquareQuote className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-balance font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">
          Someone shared a review on Yumio
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base leading-6 text-ink-tertiary">
          Open it in the app to read the review, see the photos and join the conversation.
        </p>

        <div className="mt-7">
          <LockedPreview />
        </div>

        <AppCta
          className="mx-auto mt-7 max-w-sm"
          deepLink={deepLinks.review(id)}
          hint="Reviews are visible to Yumio members. Signing up is free."
        />
      </article>
    </LandingShell>
  )
}
