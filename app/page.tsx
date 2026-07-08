import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    include: { image: { select: { id: true } } },
  })

  if (posts.length === 0) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-2xl font-bold">No hero stories yet</h1>
        <p className="mt-2 text-slate-600">
          Be the first to celebrate a hero in your community.
        </p>
        <Link
          href="/create"
          className="mt-6 inline-block rounded-full bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
        >
          Share a Hero
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Hero Stories</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/posts/${post.id}`}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
          >
            {post.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/images/${post.image.id}`}
                alt={`Cover for ${post.name}`}
                className="h-40 w-full object-cover"
              />
            ) : (
              <div className="flex h-40 w-full items-center justify-center bg-brand-100 text-4xl">
                🦸
              </div>
            )}
            <div className="p-4">
              <div className="font-semibold">{post.name}</div>
              <div className="mt-1 text-sm text-slate-500">
                by {post.authorName} ·{' '}
                {post.createdAt.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
