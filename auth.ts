import NextAuth from 'next-auth'
import type { Provider } from 'next-auth/providers'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

const providers: Provider[] = []

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google)
}

// Passwordless local-development login, enabled only when AUTH_DEV_LOGIN=true.
// Never enable in production: anyone can sign in as any email.
if (process.env.AUTH_DEV_LOGIN === 'true') {
  providers.push(
    Credentials({
      id: 'dev-login',
      name: 'Dev Login (no password)',
      credentials: {
        name: { label: 'Name', type: 'text' },
        email: { label: 'Email', type: 'email' },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? '').trim().toLowerCase()
        const name = String(credentials?.name ?? '').trim() || email.split('@')[0]
        if (!email.includes('@')) return null
        const user = await prisma.user.upsert({
          where: { email },
          update: { name },
          create: { email, name },
        })
        return { id: user.id, email: user.email, name: user.name }
      },
    })
  )
}

export const authConfigured = providers.length > 0

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  trustHost: true,
  providers,
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      return session
    },
  },
})
