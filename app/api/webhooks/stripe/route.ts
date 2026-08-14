import { NextRequest } from 'next/server'
import { stripeWebhook } from '@/lib/stripe-webhook'

export async function POST(req: NextRequest) {
  return stripeWebhook(req)
}
