const TYPE_LABELS: Record<string, string> = {
  CREATED: 'Post created',
  EDITED: 'Post edited',
  INVITE_SENT: 'Invitation emailed to the hero',
  HERO_VIEWED: 'The hero viewed this story',
}

/** a•••@example.com — keeps accountability without exposing the address. */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  return `${local.slice(0, 1)}•••@${domain}`
}

/**
 * Public, collapsible activity log. Everyone can open it; email addresses
 * are shown in full only to the author and the hero, masked for others.
 */
export default function PostHistory({
  events,
  maskEmails,
}: {
  events: {
    id: string
    type: string
    actorName: string
    actorEmail: string | null
    isHero: boolean
    createdAt: Date
  }[]
  maskEmails: boolean
}) {
  return (
    <details className="mt-8 rounded-2xl border border-slate-200 bg-white open:pb-6">
      <summary className="cursor-pointer select-none px-6 py-4 text-sm font-semibold text-slate-700 hover:text-slate-900">
        Post history ({events.length})
      </summary>
      <ol className="space-y-3 px-6">
        {events.map((event) => (
          <li key={event.id} className="flex items-baseline gap-3 text-sm">
            <span className="whitespace-nowrap text-slate-400">
              {event.createdAt.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
            <span>
              <span className="font-semibold">
                {TYPE_LABELS[event.type] ?? event.type}
              </span>{' '}
              — {event.actorName}
              {event.actorEmail ? (
                <span className="text-slate-500">
                  {' '}
                  ({maskEmails ? maskEmail(event.actorEmail) : event.actorEmail})
                </span>
              ) : null}
              {event.isHero ? (
                <span className="ml-2 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                  hero
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
    </details>
  )
}
