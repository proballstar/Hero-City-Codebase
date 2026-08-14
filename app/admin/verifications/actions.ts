'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { issueAndSendClaim } from '@/lib/claim-email'
import { getStripe, stripeConfigured } from '@/lib/stripe'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Authentication required.')
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (user?.role !== 'ADMIN') throw new Error('Administrator access required.')
  return user
}

async function audit(heroProfileId: string, type: string, actorUserId: string, details?: string) {
  await prisma.verificationEvent.create({
    data: { heroProfileId, type, actorUserId, details },
  })
  revalidatePath('/admin/verifications')
}

export async function approveVerification(formData: FormData) {
  const admin = await requireAdmin()
  const heroProfileId = String(formData.get('heroProfileId') ?? '')
  await prisma.heroProfile.update({
    where: { id: heroProfileId },
    data: { verificationStatus: 'VERIFIED', stripeIdentityVerified: true },
  })
  await prisma.heroClaimToken.updateMany({
    where: { heroProfileId, used: false },
    data: { used: true },
  })
  await audit(heroProfileId, 'MANUALLY_APPROVED', admin.id)
}

export async function resendClaim(formData: FormData) {
  const admin = await requireAdmin()
  const heroProfileId = String(formData.get('heroProfileId') ?? '')
  const profile = await prisma.heroProfile.findUnique({ where: { id: heroProfileId } })
  if (!profile?.contactEmail) throw new Error('This profile has no contact email.')
  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'https'
  const { sent } = await issueAndSendClaim({
    heroProfileId,
    heroName: profile.heroName,
    email: profile.contactEmail,
    fallbackOrigin: host ? `${protocol}://${host}` : undefined,
  })
  await audit(heroProfileId, sent ? 'CLAIM_REISSUED' : 'CLAIM_REISSUE_EMAIL_FAILED', admin.id)
}

export async function setPayoutFreeze(formData: FormData) {
  const admin = await requireAdmin()
  const heroProfileId = String(formData.get('heroProfileId') ?? '')
  const frozen = String(formData.get('frozen')) === 'true'
  const profile = await prisma.heroProfile.findUnique({ where: { id: heroProfileId } })
  if (!profile) throw new Error('Hero profile not found.')
  if (profile.stripeAccountId && stripeConfigured()) {
    await getStripe().accounts.update(profile.stripeAccountId, {
      settings: { payouts: { schedule: { interval: frozen ? 'manual' : 'daily' } } },
    })
  }
  await prisma.heroProfile.update({ where: { id: heroProfileId }, data: { payoutsFrozen: frozen } })
  await audit(heroProfileId, frozen ? 'PAYOUTS_FROZEN' : 'PAYOUTS_UNFROZEN', admin.id)
}

export async function setStoriesFlagged(formData: FormData) {
  const admin = await requireAdmin()
  const heroProfileId = String(formData.get('heroProfileId') ?? '')
  const flagged = String(formData.get('flagged')) === 'true'
  await prisma.post.updateMany({ where: { heroProfileId }, data: { flagged } })
  await audit(heroProfileId, flagged ? 'STORIES_FLAGGED' : 'STORIES_UNFLAGGED', admin.id)
}
