import { createHash, randomBytes } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { normalizeEmail } from '@/lib/hero'

const CLAIM_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000

export function hashClaimToken(rawToken: string): string {
  return createHash('sha256').update(rawToken, 'utf8').digest('hex')
}

export async function createHeroClaimToken(heroProfileId: string, rawEmail: string) {
  const email = normalizeEmail(rawEmail)
  if (!email) throw new Error('A valid hero email is required.')

  const rawToken = randomBytes(32).toString('base64url')
  const claim = await prisma.heroClaimToken.create({
    data: {
      token: hashClaimToken(rawToken),
      email,
      heroProfileId,
      expiresAt: new Date(Date.now() + CLAIM_LIFETIME_MS),
    },
  })
  return { claim, rawToken }
}

export async function getUsableClaim(rawToken: string) {
  if (!rawToken || rawToken.length > 256) return null
  const claim = await prisma.heroClaimToken.findUnique({
    where: { token: hashClaimToken(rawToken) },
    include: { heroProfile: true },
  })
  if (!claim || claim.used || claim.expiresAt <= new Date()) return null
  return claim
}
