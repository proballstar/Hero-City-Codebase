'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'

const PRESET_AMOUNTS = ['5', '10', '25']

export default function DonateSection({
  postId,
  postName,
}: {
  postId: string
  postName: string
}) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const router = useRouter()
  const [amount, setAmount] = useState('5')
  const [message, setMessage] = useState<string | null>(null)

  if (!clientId) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        Donations are not configured yet. The site owner needs to set{' '}
        <code>NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> (see the README).
      </p>
    )
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

      {message ? (
        <p className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-800">
          {message}
        </p>
      ) : null}

      <PayPalScriptProvider options={{ clientId, currency: 'USD', intent: 'capture' }}>
        <PayPalButtons
          style={{ layout: 'vertical', label: 'donate' }}
          forceReRender={[amount]}
          createOrder={async () => {
            const res = await fetch('/api/paypal/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ postId, amount }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error ?? 'Failed to create order')
            return data.orderId
          }}
          onApprove={async (data) => {
            const res = await fetch(`/api/paypal/orders/${data.orderID}/capture`, {
              method: 'POST',
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error ?? 'Failed to capture order')
            setMessage(`Thank you for supporting ${postName}!`)
            router.refresh()
          }}
          onError={(err) => {
            console.error(err)
            setMessage('Something went wrong with the donation. Please try again.')
          }}
        />
      </PayPalScriptProvider>
    </div>
  )
}
