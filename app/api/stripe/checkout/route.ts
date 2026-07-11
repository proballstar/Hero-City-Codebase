import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getStripe, stripeConfigured } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  if (!stripeConfigured()) {
    return NextResponse.json(
      { error: 'Donations are not configured on this server.' },
      { status: 503 }
    )
  }

  const body = await req.json().catch(() => null)
  const postId = typeof body?.postId === 'string' ? body.postId : ''
  const amountNumber = Number(body?.amount)

  if (!postId || !Number.isFinite(amountNumber) || amountNumber < 1 || amountNumber > 10000) {
    return NextResponse.json(
      { error: 'A valid postId and an amount between 1 and 10000 are required.' },
      { status: 400 }
    )
  }

  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
  }

  // Prefer the canonical app URL over the request origin: behind proxies
  // (Codespaces port forwarding, some hosts) forwarded headers can produce a
  // scheme/host the browser can't actually reach. AUTH_URL already serves as
  // the canonical URL for sign-in redirects, so reuse it here.
  const configuredUrl = process.env.APP_URL ?? process.env.AUTH_URL
  const origin = configuredUrl
    ? new URL(configuredUrl).origin
    : req.nextUrl.origin
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      submit_type: 'donate',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `Donation for ${post.name} on Hero City` },
            unit_amount: Math.round(amountNumber * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { postId },
      success_url: `${origin}/posts/${postId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/posts/${postId}`,
    })

    await prisma.donation.create({
      data: {
        postId,
        amount: amountNumber.toFixed(2),
        currency: 'USD',
        provider: 'stripe',
        providerRef: session.id,
        status: 'CREATED',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Could not start the Stripe checkout.' },
      { status: 502 }
    )
  }
}
