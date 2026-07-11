import type { NextConfig } from 'next'

// Inside GitHub Codespaces the browser reaches the app through the port
// forwarding proxy, so a request's Origin header (…app.github.dev) doesn't
// match the host the dev server sees. Server Actions (the sign-in forms)
// fail their CSRF origin check unless that domain is explicitly allowed.
const codespacesDomain =
  process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN ??
  // CODESPACES=true is always set in a codespace; fall back to the default
  // forwarding domain in case the more specific variable is absent.
  (process.env.CODESPACES === 'true' ? 'app.github.dev' : undefined)

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(codespacesDomain
    ? {
        experimental: {
          serverActions: {
            // Requests arrive with mismatched origin/x-forwarded-host pairs in
            // both directions: browser on the public URL with the dev server
            // seeing localhost, or (VS Code port forwarding) browser on
            // localhost with the proxy stamping the public host. Allow both.
            allowedOrigins: [
              `*.${codespacesDomain}`,
              'localhost:3000',
              '127.0.0.1:3000',
            ],
          },
        },
      }
    : {}),
}

export default nextConfig
