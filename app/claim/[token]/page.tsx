import { redirect } from 'next/navigation'
import { auth, authConfigured, signIn } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getUsableClaim } from '@/lib/claims'
import { normalizeEmail } from '@/lib/hero'
import { getStripe, stripeConfigured } from '@/lib/stripe'
import { appOrigin } from '@/lib/appUrl'

export const dynamic = 'force-dynamic'

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const claim = await getUsableClaim(token)
  if (!claim) {
    return <ClaimNotice title="This claim link is invalid or expired." />
  }

  const session = await auth()
  if (!session?.user?.id) {
    return (
      <ClaimNotice title={`Claim ${claim.heroProfile.heroName}'s profile`}>
        <p className="mt-2 text-slate-600">
          Sign in using the email address that received this private link.
        </p>
        {authConfigured ? (
          <form
            action={async () => {
              'use server'
              await signIn(undefined, { redirectTo: `/claim/${encodeURIComponent(token)}` })
            }}
          >
            <button className="mt-6 rounded-full bg-brand-600 px-6 py-3 font-semibold text-white">
              Sign in or create an account
            </button>
          </form>
        ) : (
          <p className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            Authentication is not configured on this server.
          </p>
        )}
      </ClaimNotice>
    )
  }

  if (normalizeEmail(session.user.email) !== claim.email) {
    return (
      <ClaimNotice title="This link belongs to a different email address.">
        <p className="mt-2 text-slate-600">
          Sign out and sign back in with the address that received the claim email.
        </p>
      </ClaimNotice>
    )
  }
  if (!stripeConfigured()) {
    return <ClaimNotice title="Stripe Connect onboarding is not configured." />
  }

  const stripe = getStripe()
  let stripeAccountId = claim.heroProfile.stripeAccountId
  if (!stripeAccountId) {
    const account = await stripe.accounts.create(
      {
        type: 'express',
        email: claim.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { heroProfileId: claim.heroProfileId },
      },
      { idempotencyKey: `hero-connect-${claim.heroProfileId}` }
    )
    stripeAccountId = account.id
  }

  await prisma.$transaction([
    prisma.heroProfile.update({
      where: { id: claim.heroProfileId },
      data: {
        stripeAccountId,
        claimedByUserId: session.user.id,
        contactEmail: claim.email,
        verificationStatus: 'PENDING_CLAIM',
      },
    }),
    prisma.verificationEvent.create({
      data: {
        heroProfileId: claim.heroProfileId,
        type: 'STRIPE_ONBOARDING_STARTED',
        actorUserId: session.user.id,
        details: stripeAccountId,
      },
    }),
  ])

  const origin = appOrigin()
  if (!origin) return <ClaimNotice title="APP_URL is required for Stripe onboarding." />
  const claimPath = `/claim/${encodeURIComponent(token)}`
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    type: 'account_onboarding',
    refresh_url: `${origin}${claimPath}`,
    return_url: `${origin}${claimPath}/complete`,
  })
  redirect(accountLink.url)
}

function ClaimNotice({
  title,
  children,
}: {
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      {children}
    </div>
  )
}
