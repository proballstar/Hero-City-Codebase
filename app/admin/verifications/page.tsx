import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import VerificationQueue, { type VerificationRow } from '@/components/VerificationQueue'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Verification Queue — Hero City' }

export default async function AdminVerificationsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth/signin?callbackUrl=/admin/verifications')
  const admin = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  if (admin?.role !== 'ADMIN') redirect('/')

  const profiles = await prisma.heroProfile.findMany({
    where: {
      OR: [
        { verificationStatus: { in: ['PENDING_CLAIM', 'VERIFIED'] } },
        { claimTokens: { some: { used: false } } },
      ],
    },
    include: {
      stories: { select: { id: true, name: true, content: true, flagged: true } },
      claimTokens: { orderBy: { createdAt: 'desc' }, take: 10 },
      verificationEvents: { orderBy: { createdAt: 'desc' }, take: 30 },
      evidence: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { updatedAt: 'desc' },
  })
  const rows: VerificationRow[] = profiles.map((profile) => ({
    id: profile.id,
    heroName: profile.heroName,
    contactEmail: profile.contactEmail,
    verificationStatus: profile.verificationStatus,
    stripeAccountId: profile.stripeAccountId,
    stripeIdentityVerified: profile.stripeIdentityVerified,
    payoutsFrozen: profile.payoutsFrozen,
    externalProofUrl: profile.externalProofUrl,
    stories: profile.stories,
    claimTokens: profile.claimTokens.map((token) => ({
      id: token.id,
      email: token.email,
      expiresAt: token.expiresAt.toISOString(),
      used: token.used,
    })),
    verificationEvents: profile.verificationEvents.map((event) => ({
      id: event.id,
      type: event.type,
      details: event.details,
      createdAt: event.createdAt.toISOString(),
    })),
    evidence: profile.evidence.map((item) => ({
      id: item.id,
      label: item.label,
      kind: item.kind,
      url: item.url,
      createdAt: item.createdAt.toISOString(),
    })),
  }))

  return <div><div className="mb-6"><p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Admin</p><h1 className="text-3xl font-bold">Hero verification queue</h1><p className="mt-1 text-slate-600">Review claim context, Stripe readiness, evidence, and the full decision trail.</p></div><VerificationQueue rows={rows} /></div>
}
