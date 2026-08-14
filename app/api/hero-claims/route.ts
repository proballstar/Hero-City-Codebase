import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeEmail } from '@/lib/hero'
import { issueAndSendClaim } from '@/lib/claim-email'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const postId = typeof body?.postId === 'string' ? body.postId : ''
  const email = normalizeEmail(typeof body?.email === 'string' ? body.email : '')
  if (!postId || !email) {
    return NextResponse.json({ error: 'A story and valid email are required.' }, { status: 400 })
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { heroProfile: true },
  })
  if (!post) return NextResponse.json({ error: 'Story not found.' }, { status: 404 })
  if (!post.heroProfile || post.heroProfile.verificationStatus === 'VERIFIED') {
    return NextResponse.json({ error: 'This profile cannot be claimed.' }, { status: 409 })
  }

  await prisma.heroProfile.update({
    where: { id: post.heroProfile.id },
    data: { contactEmail: email },
  })
  const { sent } = await issueAndSendClaim({
    heroProfileId: post.heroProfile.id,
    heroName: post.heroProfile.heroName,
    email,
    fallbackOrigin: req.nextUrl.origin,
  })
  await prisma.verificationEvent.create({
    data: {
      heroProfileId: post.heroProfile.id,
      type: sent ? 'SELF_CLAIM_EMAIL_SENT' : 'SELF_CLAIM_EMAIL_NOT_CONFIGURED',
      details: email,
    },
  })
  return NextResponse.json({
    message: sent
      ? 'Check that inbox for a secure claim link.'
      : 'The claim was created, but email delivery is not configured.',
  })
}
