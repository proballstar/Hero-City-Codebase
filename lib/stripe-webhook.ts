import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getStripe, recordCompletedSession, stripeConfigured } from '@/lib/stripe'

function accountIdentityChecksPassed(account: Stripe.Account): boolean {
  const requirements = account.requirements
  return Boolean(
    !requirements?.disabled_reason &&
      (requirements?.currently_due?.length ?? 0) === 0 &&
      (requirements?.past_due?.length ?? 0) === 0
  )
}

async function finishVerification(heroProfileId: string, source: string) {
  await prisma.$transaction([
    prisma.heroProfile.update({
      where: { id: heroProfileId },
      data: { verificationStatus: 'VERIFIED', stripeIdentityVerified: true },
    }),
    prisma.heroClaimToken.updateMany({
      where: { heroProfileId, used: false },
      data: { used: true },
    }),
    prisma.verificationEvent.create({
      data: { heroProfileId, type: 'VERIFIED', details: source },
    }),
  ])
}

async function handleAccountUpdated(account: Stripe.Account) {
  const profile = await prisma.heroProfile.findUnique({
    where: { stripeAccountId: account.id },
  })
  if (!profile) return
  const ready = Boolean(
    account.charges_enabled &&
      account.payouts_enabled &&
      accountIdentityChecksPassed(account)
  )
  if (ready) {
    await finishVerification(profile.id, 'account.updated')
  } else if (profile.verificationStatus === 'VERIFIED') {
    await prisma.heroProfile.update({
      where: { id: profile.id },
      data: { verificationStatus: 'PENDING_CLAIM' },
    })
  }
}

export async function stripeWebhook(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripeConfigured() || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 503 })
  }
  const signature = req.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Missing signature.' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    await recordCompletedSession(event.data.object)
  } else if (event.type === 'account.updated') {
    await handleAccountUpdated(event.data.object)
  } else if (event.type === 'identity.verification_session.verified') {
    const verificationSession = event.data.object
    const heroProfileId = verificationSession.metadata?.heroProfileId
    if (heroProfileId) {
      const profile = await prisma.heroProfile.findUnique({ where: { id: heroProfileId } })
      if (profile?.stripeAccountId) {
        const account = await getStripe().accounts.retrieve(profile.stripeAccountId)
        if (!account.deleted && account.charges_enabled && account.payouts_enabled) {
          await finishVerification(heroProfileId, 'identity.verification_session.verified')
        }
      }
    }
  }
  return NextResponse.json({ received: true })
}
