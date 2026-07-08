import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { captureOrder, paypalConfigured } from '@/lib/paypal'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  if (!paypalConfigured()) {
    return NextResponse.json(
      { error: 'PayPal is not configured on this server.' },
      { status: 503 }
    )
  }

  const { orderId } = await params
  const donation = await prisma.donation.findUnique({ where: { paypalOrderId: orderId } })
  if (!donation) {
    return NextResponse.json({ error: 'Unknown order.' }, { status: 404 })
  }

  try {
    const capture = await captureOrder(orderId)
    const status: string = capture.status ?? 'UNKNOWN'
    const payerName = [capture.payer?.name?.given_name, capture.payer?.name?.surname]
      .filter(Boolean)
      .join(' ')

    await prisma.donation.update({
      where: { paypalOrderId: orderId },
      data: { status, payerName: payerName || null },
    })

    if (status !== 'COMPLETED') {
      return NextResponse.json(
        { error: `Payment not completed (status: ${status}).` },
        { status: 402 }
      )
    }
    return NextResponse.json({ status })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Could not capture PayPal order.' }, { status: 502 })
  }
}
