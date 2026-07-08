'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? 'Failed to delete the post.')
        return
      }
      router.push('/')
      router.refresh()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setDeleting(false)
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
      >
        Delete
      </button>
    )
  }

  return (
    <span className="flex items-center gap-2">
      <span className="text-sm text-slate-600">Delete this post permanently?</span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        {deleting ? 'Deleting…' : 'Yes, delete'}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
      >
        Cancel
      </button>
      {error ? <span className="text-sm text-red-600">{error}</span> : null}
    </span>
  )
}
