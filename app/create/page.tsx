import { auth, signIn, authConfigured } from '@/auth'
import PostForm from '@/components/PostForm'

export const metadata = { title: 'Share a Hero — Hero City' }

export default async function CreatePage() {
  const session = await auth()

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h1 className="text-2xl font-bold">Sign in to share a hero</h1>
        <p className="mt-2 text-slate-600">
          Posts belong to their authors — sign in so you can edit or remove your
          story later.
        </p>
        {authConfigured ? (
          <form
            action={async () => {
              'use server'
              await signIn(undefined, { redirectTo: '/create' })
            }}
          >
            <button
              type="submit"
              className="mt-6 rounded-full bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
            >
              Sign in
            </button>
          </form>
        ) : (
          <p className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            Sign-in is not configured yet. The site owner needs to set the auth
            environment variables (see the README).
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Share a Hero</h1>
      <p className="mt-1 text-slate-600">
        Tell the community about someone doing heroic work. Markdown is supported in
        the story field.
      </p>
      <div className="mt-6">
        <PostForm />
      </div>
    </div>
  )
}
