import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import DonateSection from '@/components/DonateSection'
import DeletePostButton from '@/components/DeletePostButton'

export const dynamic = 'force-dynamic'

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      image: { select: { id: true } },
      donations: {
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!post) notFound()

  const isAuthor = Boolean(session?.user?.id && post.authorId === session.user.id)
  const totalRaised = post.donations.reduce(
    (sum, donation) => sum + Number(donation.amount),
    0
  )

  return (
    <article>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {post.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/images/${post.image.id}`}
            alt={`Cover for ${post.name}`}
            className="max-h-96 w-full object-cover"
          />
        ) : null}
        <div className="p-6">
          <h1 className="text-3xl font-bold">{post.name}</h1>
          <p className="mt-1 text-slate-500">
            by {post.authorName} ·{' '}
            {post.createdAt.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          {isAuthor ? (
            <div className="mt-4 flex items-center gap-2">
              <Link
                href={`/posts/${post.id}/edit`}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-500"
              >
                Edit
              </Link>
              <DeletePostButton postId={post.id} />
            </div>
          ) : null}
          <div className="prose prose-slate mt-6 max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold">Support this hero</h2>
        {totalRaised > 0 ? (
          <p className="mt-1 text-sm text-slate-600">
            ${totalRaised.toFixed(2)} raised from {post.donations.length}{' '}
            {post.donations.length === 1 ? 'donation' : 'donations'} so far.
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-600">
            Be the first to support {post.name}.
          </p>
        )}
        <div className="mt-4">
          <DonateSection postId={post.id} postName={post.name} />
        </div>
      </div>
    </article>
  )
}
