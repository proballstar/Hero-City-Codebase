'use client'

import { useState, type FormEvent } from 'react'

export default function ClaimProfileButton({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage(null)
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '')
    try {
      const res = await fetch('/api/hero-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, email }),
      })
      const data = await res.json()
      setMessage(data.message ?? data.error ?? 'Could not create the claim.')
    } catch {
      setMessage('Network error — please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-brand-300 px-4 py-2 text-sm font-semibold text-brand-700"
      >
        Is this you? Claim this profile
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Claim this hero profile</h2>
                <p className="mt-1 text-sm text-slate-600">
                  We&apos;ll email a private, 7-day verification link to the hero.
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-2xl text-slate-400">×</button>
            </div>
            <form onSubmit={submit} className="mt-5">
              <label htmlFor="claim-email" className="text-sm font-semibold">Hero&apos;s email</label>
              <input id="claim-email" name="email" type="email" required maxLength={254} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
              {message ? <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">{message}</p> : null}
              <button disabled={busy} className="mt-4 rounded-full bg-brand-600 px-5 py-2.5 font-semibold text-white disabled:opacity-50">
                {busy ? 'Sending…' : 'Send secure claim link'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
