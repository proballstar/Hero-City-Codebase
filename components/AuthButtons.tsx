import Image from 'next/image'
import { auth, signIn, signOut, authConfigured } from '@/auth'

export default async function AuthButtons() {
  const session = await auth()

  if (!authConfigured) return null

  if (!session?.user) {
    return (
      <form
        action={async () => {
          'use server'
          await signIn()
        }}
      >
        <button
          type="submit"
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-500"
        >
          Sign in
        </button>
      </form>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-2 text-sm text-slate-600">
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-full"
            unoptimized
          />
        ) : null}
        {session.user.name ?? session.user.email}
      </span>
      <form
        action={async () => {
          'use server'
          await signOut({ redirectTo: '/' })
        }}
      >
        <button
          type="submit"
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-500"
        >
          Sign out
        </button>
      </form>
    </div>
  )
}
