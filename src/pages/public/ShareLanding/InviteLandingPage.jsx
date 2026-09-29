import { useParams } from 'react-router'
import { BadgeCheck, UserPlus } from 'lucide-react'
import { SEO, Avatar } from '@components'
import { AppCta, LandingShell, LandingSkeleton, LandingState } from './LandingShell'
import { useGetLandingInviteQuery } from './landingApi'
import { deepLinks, errorKind, personName } from './landingUtils'

/**
 * /invite/:code — "{inviter} invited you to Yumio" (GET /users/invites/:code, public).
 * The app remembers the code when the link opens it, follows the inviter after sign-up.
 */
export const InviteLandingPage = () => {
  const { code } = useParams()
  const { data, isLoading, isFetching, error, refetch } = useGetLandingInviteQuery(code)
  const inviter = data?.data?.inviter
  const path = `/invite/${code}`

  if (isLoading) {
    return (
      <LandingShell>
        <SEO title="You're invited" path={path} noindex />
        <LandingSkeleton picture={false} />
      </LandingShell>
    )
  }

  if (error || !inviter) {
    const kind = errorKind(error)
    return (
      <LandingShell>
        <SEO title={kind === 'notFound' ? 'Invite not found' : "You're invited"} path={path} noindex />
        <LandingState
          kind={kind}
          title={kind === 'notFound' ? 'This invite link is not valid' : 'Could not load this invite'}
          description={
            kind === 'notFound'
              ? 'It may be mistyped, or the account that sent it no longer exists. You can still join Yumio.'
              : 'Check your connection and try again.'
          }
          onRetry={kind === 'error' ? refetch : undefined}
          retrying={isFetching}
        >
          {kind === 'notFound' && <AppCta />}
        </LandingState>
      </LandingShell>
    )
  }

  const name = personName(inviter, 'A friend')
  const firstName = inviter.firstName || 'them'

  return (
    <LandingShell>
      <SEO
        title={`${name} invited you to Yumio`}
        description={`${name} invited you to Yumio — discover the places your friends love.`}
        path={path}
        noindex
      />

      <article className="overflow-hidden rounded-2xl border border-line bg-surface text-center shadow-sm">
        <div className="relative flex justify-center bg-linear-to-br from-brand to-brand-hover px-6 pb-12 pt-10">
          <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-surface/15 px-2.5 py-1 font-display text-xs font-semibold text-canvas">
            <UserPlus className="h-3.5 w-3.5" /> Invite
          </span>
        </div>
        <div className="-mt-10 flex justify-center">
          <Avatar
            src={inviter.avatar}
            firstName={inviter.firstName}
            lastName={inviter.lastName}
            seed={inviter._id}
            size="xl"
            className="h-20! w-20! border-4! border-surface! text-2xl! shadow-md"
          />
        </div>

        <div className="px-5 pb-7 pt-4 sm:px-10 sm:pb-9">
          <h1 className="text-balance font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">
            {name}
            {inviter.verified && (
              <BadgeCheck className="ml-1 inline h-6 w-6 -translate-y-0.5 text-brand" aria-label="Verified" />
            )}{' '}
            invited you to Yumio
          </h1>
          <p className="mx-auto mt-3 max-w-md text-pretty text-base leading-6 text-ink-tertiary">
            Discover the places your friends love — honest reviews, lists you build together and a little surprise
            when you can&apos;t decide.
          </p>

          <AppCta
            className="mx-auto mt-7 max-w-sm"
            deepLink={deepLinks.invite(data?.data?.code || code)}
            hint={`Have the app? Open the invite to follow ${firstName}. New to Yumio? Get the app, then come back to this link.`}
          />
        </div>
      </article>
    </LandingShell>
  )
}
