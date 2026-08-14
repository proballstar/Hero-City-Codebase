'use client'

import { useState } from 'react'

const PRESET_AMOUNTS = ['5', '10', '25']

export default function DonateSection({
  postId,
  enabled,
  disabledReason,
}: {
  postId: string
  enabled: boolean
  disabledReason?: string
}) {
  const [amount, setAmount] = useState('5')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!enabled) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        {disabledReason ?? (
          <>Donations are not configured yet. The site owner needs to set <code>STRIPE_SECRET_KEY</code>.</>
        )}
      </p>
    )
  }

  async function donate() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/donate/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, amount }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Could not start the checkout.')
        return
      }
      window.location.href = data.url
    } catch {
      setError('Network error — please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-md">
      <div className="mb-4 flex items-center gap-2">
        {PRESET_AMOUNTS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setAmount(preset)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              amount === preset
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:border-brand-500'
            }`}
          >
            ${preset}
          </button>
        ))}
        <div className="flex items-center gap-1">
          <span className="text-sm text-slate-500">$</span>
          <input
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            aria-label="Custom donation amount in US dollars"
          />
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      ) : null}

      <button
        type="button"
        onClick={donate}
        disabled={busy}
        className="rounded-full bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {busy ? 'Redirecting…' : 'Donate with Stripe'}
      </button>
      <p className="mt-2 text-xs text-slate-500">
        You&apos;ll be taken to Stripe&apos;s secure checkout to complete the donation.
      </p>
    </div>
  )
}
