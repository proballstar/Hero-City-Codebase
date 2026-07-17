/**
 * Canonical origin the app is browsed at. Behind proxies (Codespaces port
 * forwarding, tunnels) request-derived origins can be unreachable, so a
 * configured APP_URL/AUTH_URL always wins over the fallback.
 */
export function appOrigin(fallback?: string): string | null {
  const configured = process.env.APP_URL ?? process.env.AUTH_URL
  if (configured) return new URL(configured).origin
  return fallback ?? null
}
