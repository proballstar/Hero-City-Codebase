'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

const MAX_IMAGE_BYTES = 2 * 1024 * 1024

export default function CreatePostForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const form = event.currentTarget
    const formData = new FormData(form)
    const image = formData.get('image') as File | null
    if (image && image.size > MAX_IMAGE_BYTES) {
      setError('Cover image must be 2 MB or smaller.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/posts', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to create the post.')
        return
      }
      router.push(`/posts/${data.id}`)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-brand-500 focus:outline-none'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-semibold">
          Hero&apos;s name
        </label>
        <input id="name" name="name" required maxLength={120} className={inputClass} />
      </div>

      <div>
        <label htmlFor="authorName" className="block text-sm font-semibold">
          Your name
        </label>
        <input
          id="authorName"
          name="authorName"
          required
          maxLength={120}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="image" className="block text-sm font-semibold">
          Cover image <span className="font-normal text-slate-500">(optional, max 2 MB)</span>
        </label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/*"
          className="mt-1 block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-brand-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-50"
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-semibold">
          Their story
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={10}
          maxLength={20000}
          className={inputClass}
          placeholder="What makes this person a hero? Markdown is supported."
        />
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? 'Publishing…' : 'Publish Post'}
      </button>
    </form>
  )
}
