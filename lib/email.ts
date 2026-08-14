const RESEND_API_BASE = process.env.RESEND_API_BASE ?? 'https://api.resend.com'

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

/**
 * Emails the hero a link to the post written about them. Returns true when
 * the email was accepted for delivery; false when email isn't configured or
 * sending failed (callers treat the invite as best-effort).
 */
export async function sendHeroInvite(opts: {
  to: string
  postName: string
  postUrl: string
  authorName: string
}): Promise<boolean> {
  if (!emailConfigured()) return false

  const res = await fetch(`${RESEND_API_BASE}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [opts.to],
      subject: `${opts.authorName} shared your story on Hero City`,
      text: [
        `Hi,`,
        ``,
        `${opts.authorName} published "${opts.postName}" on Hero City — a story about you.`,
        ``,
        `Read it here: ${opts.postUrl}`,
        ``,
        `If you sign in with this email address (${opts.to}), you can edit the`,
        `story so it reflects what you actually believe, and see its history.`,
        ``,
        `— Hero City`,
      ].join('\n'),
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    console.error(`Hero invite email failed (${res.status}): ${await res.text()}`)
    return false
  }
  return true
}

export async function sendHeroClaimEmail(opts: {
  to: string
  heroName: string
  claimUrl: string
}): Promise<boolean> {
  if (!emailConfigured()) return false

  const res = await fetch(`${RESEND_API_BASE}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [opts.to],
      subject: `Claim ${opts.heroName}'s Hero City profile`,
      text: [
        'Hi,',
        '',
        `A Hero City profile for ${opts.heroName} is ready to be claimed.`,
        'This private link expires in 7 days:',
        '',
        opts.claimUrl,
        '',
        'Sign in with this email address to continue to Stripe Connect identity',
        'verification and payout onboarding. If you did not request this, ignore it.',
        '',
        '— Hero City',
      ].join('\n'),
    }),
    cache: 'no-store',
  })
  if (!res.ok) {
    console.error(`Hero claim email failed (${res.status}): ${await res.text()}`)
    return false
  }
  return true
}
