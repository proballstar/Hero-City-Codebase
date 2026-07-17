const TYPE_LABELS: Record<string, string> = {
  CREATED: 'Post created',
  EDITED: 'Post edited',
  INVITE_SENT: 'Invitation emailed to the hero',
  HERO_VIEWED: 'The hero viewed this story',
}

/**
 * Full activity log with actor names and emails. Only rendered for the
 * author and the hero — everyone else sees just the badges on the post.
 */
export default function PostHistory({
  events,
  heroEmail,
}: {
  events: {
    id: string
    type: string
    actorName: string
    actorEmail: string | null
    isHero: boolean
    createdAt: Date
  }[]
  heroEmail: string | null
}) {
  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-bold">Post history</h2>
      <p className="mt-1 text-sm text-slate-500">
        Visible only to the author and the hero
        {heroEmail ? (
          <>
            {' '}
            (<span className="font-mono">{heroEmail}</span>)
          </>
        ) : null}
        .
      </p>
      <ol className="mt-4 space-y-3">
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
                <span className="text-slate-500"> ({event.actorEmail})</span>
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
    </div>
  )
}
