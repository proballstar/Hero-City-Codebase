import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createOrder, paypalConfigured } from '@/lib/paypal'

export async function POST(req: NextRequest) {
  if (!paypalConfigured()) {
    return NextResponse.json(
      { error: 'PayPal is not configured on this server.' },
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
  const amount = amountNumber.toFixed(2)

  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
  }

  try {
    const order = await createOrder(amount, 'USD', `Donation for ${post.name} on Hero City`)
    await prisma.donation.create({
      data: {
        postId,
        amount,
        currency: 'USD',
        paypalOrderId: order.id,
        status: 'CREATED',
      },
    })
    return NextResponse.json({ orderId: order.id })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Could not create PayPal order.' }, { status: 502 })
  }
}
