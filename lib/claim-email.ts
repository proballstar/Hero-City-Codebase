import { appOrigin } from '@/lib/appUrl'
import { createHeroClaimToken } from '@/lib/claims'
import { sendHeroClaimEmail } from '@/lib/email'

export async function issueAndSendClaim(opts: {
  heroProfileId: string
  heroName: string
  email: string
  fallbackOrigin?: string
}) {
  const origin = appOrigin(opts.fallbackOrigin)
  if (!origin) throw new Error('APP_URL or a request origin is required.')
  const { claim, rawToken } = await createHeroClaimToken(opts.heroProfileId, opts.email)
  const sent = await sendHeroClaimEmail({
    to: claim.email,
    heroName: opts.heroName,
    claimUrl: `${origin}/claim/${encodeURIComponent(rawToken)}`,
  }).catch(() => false)
  return { claim, sent }
}
