'use client'

import { useState } from 'react'
import {
  approveVerification,
  resendClaim,
  setPayoutFreeze,
  setStoriesFlagged,
} from '@/app/admin/verifications/actions'

export type VerificationRow = {
  id: string
  heroName: string
  contactEmail: string | null
  verificationStatus: string
  stripeAccountId: string | null
  stripeIdentityVerified: boolean
  payoutsFrozen: boolean
  externalProofUrl: string | null
  evidence: { id: string; label: string; kind: string; url: string; createdAt: string }[]
  stories: { id: string; name: string; content: string; flagged: boolean }[]
  claimTokens: { id: string; email: string; expiresAt: string; used: boolean }[]
  verificationEvents: { id: string; type: string; details: string | null; createdAt: string }[]
}

export default function VerificationQueue({ rows }: { rows: VerificationRow[] }) {
  const [selected, setSelected] = useState<VerificationRow | null>(null)
  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr><th className="px-4 py-3">Hero</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Stripe KYC</th><th className="px-4 py-3">Proof</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3"><span className="font-semibold">{row.heroName}</span><span className="block text-xs text-slate-500">{row.contactEmail ?? 'No contact email'}</span></td>
                <td className="px-4 py-3">{row.verificationStatus}{row.payoutsFrozen ? ' · frozen' : ''}</td>
                <td className="px-4 py-3">{row.stripeAccountId ? (row.stripeIdentityVerified ? 'Passed' : 'Pending') : 'Not started'}</td>
                <td className="px-4 py-3">{row.externalProofUrl || row.evidence.length ? <button onClick={() => setSelected(row)} className="text-brand-700 underline">{row.evidence.length + (row.externalProofUrl ? 1 : 0)} item(s)</button> : '—'}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => setSelected(row)} className="font-semibold text-brand-700">Review</button></td>
              </tr>
            ))}
            {!rows.length ? <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No claims in the verification queue.</td></tr> : null}
          </tbody>
        </table>
      </div>
      {selected ? <ReviewDrawer row={selected} close={() => setSelected(null)} /> : null}
    </>
  )
}

function ActionForm({ action, id, fields, label }: { action: (data: FormData) => Promise<void>; id: string; fields?: Record<string, string>; label: string }) {
  return <form action={action}><input type="hidden" name="heroProfileId" value={id} />{Object.entries(fields ?? {}).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}<button className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold">{label}</button></form>
}

function ReviewDrawer({ row, close }: { row: VerificationRow; close: () => void }) {
  const anyFlagged = row.stories.some((story) => story.flagged)
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/30" role="dialog" aria-modal="true">
      <aside className="ml-auto h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="flex justify-between"><div><p className="text-xs font-semibold uppercase text-slate-500">Verification review</p><h2 className="text-2xl font-bold">{row.heroName}</h2></div><button onClick={close} className="text-2xl" aria-label="Close">×</button></div>
        <section className="mt-6 rounded-xl bg-slate-50 p-4 text-sm"><p><b>Status:</b> {row.verificationStatus}</p><p><b>Stripe account:</b> {row.stripeAccountId ?? 'Not created'}</p><p><b>Identity checks:</b> {row.stripeIdentityVerified ? 'Passed' : 'Pending'}</p><p><b>Payout state:</b> {row.payoutsFrozen ? 'Frozen' : 'Active when verified'}</p></section>
        <section className="mt-6"><h3 className="font-bold">Story context</h3>{row.stories.map((story) => <article key={story.id} className="mt-3 rounded-xl border border-slate-200 p-4"><a href={`/posts/${story.id}`} className="font-semibold text-brand-700">{story.name}</a><p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-slate-600">{story.content}</p></article>)}</section>
        <section className="mt-6"><h3 className="font-bold">Claim submissions</h3><ul className="mt-2 space-y-2 text-sm">{row.claimTokens.map((token) => <li key={token.id}>{token.email} · expires {new Date(token.expiresAt).toLocaleString()} · {token.used ? 'used' : 'open'}</li>)}</ul></section>
        <section className="mt-6"><h3 className="font-bold">External proof and documents</h3><ul className="mt-2 space-y-2 text-sm">{row.externalProofUrl ? <li><a href={row.externalProofUrl} target="_blank" rel="noreferrer" className="text-brand-700 underline">Profile proof link</a></li> : null}{row.evidence.map((item) => <li key={item.id}><a href={item.url} target="_blank" rel="noreferrer" className="text-brand-700 underline">{item.label}</a> <span className="text-slate-500">({item.kind})</span></li>)}{!row.externalProofUrl && !row.evidence.length ? <li className="text-slate-500">No external evidence submitted.</li> : null}</ul></section>
        <section className="mt-6"><h3 className="font-bold">Audit trail</h3><ol className="mt-2 space-y-2 text-sm">{row.verificationEvents.map((event) => <li key={event.id}><span className="text-slate-500">{new Date(event.createdAt).toLocaleString()}</span> · <b>{event.type}</b>{event.details ? ` · ${event.details}` : ''}</li>)}</ol></section>
        <section className="mt-6 flex flex-wrap gap-2 border-t border-slate-200 pt-5"><ActionForm action={approveVerification} id={row.id} label="Approve verification" /><ActionForm action={resendClaim} id={row.id} label="Send new claim link" /><ActionForm action={setPayoutFreeze} id={row.id} fields={{ frozen: String(!row.payoutsFrozen) }} label={row.payoutsFrozen ? 'Unfreeze payouts' : 'Freeze payouts'} /><ActionForm action={setStoriesFlagged} id={row.id} fields={{ flagged: String(!anyFlagged) }} label={anyFlagged ? 'Clear story flags' : 'Flag stories'} /></section>
      </aside>
    </div>
  )
}
