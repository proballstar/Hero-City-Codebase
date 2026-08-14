import Link from 'next/link'
import { getUsableClaim } from '@/lib/claims'

export const dynamic = 'force-dynamic'

export default async function ClaimCompletePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const claim = await getUsableClaim(token)
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <h1 className="text-2xl font-bold">Stripe onboarding submitted</h1>
      <p className="mt-3 text-slate-600">
        {claim
          ? `We are waiting for Stripe to finish reviewing ${claim.heroProfile.heroName}'s account. Donations unlock only after all checks pass.`
          : 'This claim has already completed or expired.'}
      </p>
      <Link href="/" className="mt-6 inline-block font-semibold text-brand-700">
        Return to Hero City
      </Link>
    </div>
  )
}
