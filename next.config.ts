import type { NextConfig } from 'next'

// Inside GitHub Codespaces the browser reaches the app through the port
// forwarding proxy, so a request's Origin header (…app.github.dev) doesn't
// match the host the dev server sees. Server Actions (the sign-in forms)
// fail their CSRF origin check unless that domain is explicitly allowed.
const codespacesDomain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(codespacesDomain
    ? {
        experimental: {
          serverActions: { allowedOrigins: [`*.${codespacesDomain}`] },
        },
      }
    : {}),
}

export default nextConfig
