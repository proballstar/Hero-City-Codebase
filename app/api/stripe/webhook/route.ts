import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe, recordCompletedSession, stripeConfigured } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripeConfigured() || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 503 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature.' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(
      await req.text(),
      signature,
      webhookSecret
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    await recordCompletedSession(event.data.object)
  }

  return NextResponse.json({ received: true })
}
