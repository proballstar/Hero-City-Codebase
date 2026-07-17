export function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = (email ?? '').trim().toLowerCase()
  return trimmed.includes('@') ? trimmed : null
}

/** Whether the signed-in email identifies the post's hero. */
export function isHeroEmail(
  sessionEmail: string | null | undefined,
  heroEmail: string | null
): boolean {
  const email = normalizeEmail(sessionEmail)
  return Boolean(email && heroEmail && email === heroEmail)
}
