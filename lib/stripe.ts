import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY.')
  }
  if (!_stripe) {
    // STRIPE_API_BASE lets tests point the SDK at a mock server; unset in
    // real deployments.
    const apiBase = process.env.STRIPE_API_BASE
      ? new URL(process.env.STRIPE_API_BASE)
      : null
    _stripe = new Stripe(key, {
      ...(apiBase
        ? {
            host: apiBase.hostname,
            port: Number(apiBase.port) || (apiBase.protocol === 'https:' ? 443 : 80),
            protocol: apiBase.protocol === 'https:' ? 'https' : 'http',
          }
        : {}),
    })
  }
  return _stripe
}

/**
 * Records a paid Checkout session as a completed donation. Idempotent:
 * safe to call from both the success redirect and the webhook.
 */
export async function recordCompletedSession(session: Stripe.Checkout.Session) {
  if (session.payment_status !== 'paid') return
  const postId = session.metadata?.postId
  if (!postId) return

  const amount = ((session.amount_total ?? 0) / 100).toFixed(2)
  const currency = (session.currency ?? 'usd').toUpperCase()
  const payerName = session.customer_details?.name ?? null

  await prisma.donation.upsert({
    where: { providerRef: session.id },
    update: { status: 'COMPLETED', payerName, amount, currency },
    create: {
      postId,
      amount,
      currency,
      provider: 'stripe',
      providerRef: session.id,
      payerName,
      status: 'COMPLETED',
    },
  })
}
