import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { getStripe, recordCompletedSession, stripeConfigured } from '@/lib/stripe'
import { isHeroEmail, normalizeEmail } from '@/lib/hero'
import DonateSection from '@/components/DonateSection'
import DeletePostButton from '@/components/DeletePostButton'
import PostHistory from '@/components/PostHistory'
import ClaimProfileButton from '@/components/ClaimProfileButton'

export const dynamic = 'force-dynamic'

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ session_id?: string }>
}) {
  const { id } = await params
  const { session_id: checkoutSessionId } = await searchParams
  const session = await auth()

  // Returning from Stripe Checkout: record the donation immediately so the
  // donor sees it reflected even if the webhook hasn't arrived yet.
  let justDonated = false
  if (checkoutSessionId && stripeConfigured()) {
    try {
      const checkout = await getStripe().checkout.sessions.retrieve(checkoutSessionId)
      if (checkout.payment_status === 'paid' && checkout.metadata?.postId === id) {
        await recordCompletedSession(checkout)
        justDonated = true
      }
    } catch (err) {
      console.error('Could not verify checkout session', err)
    }
  }

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      image: { select: { id: true } },
      donations: {
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
      },
      events: { orderBy: { createdAt: 'desc' } },
      heroProfile: true,
    },
  })

  if (!post) notFound()

  const isAuthor = Boolean(session?.user?.id && post.authorId === session.user.id)
  const isHero = isHeroEmail(session?.user?.email, post.heroEmail)

  // First time the hero opens their story, note it in the post history so the
  // author can see the hero has engaged.
  if (isHero && !isAuthor && !post.events.some((e) => e.type === 'HERO_VIEWED')) {
    const event = await prisma.postEvent.create({
      data: {
        postId: post.id,
        type: 'HERO_VIEWED',
        actorName: session?.user?.name ?? session?.user?.email ?? 'The hero',
        actorEmail: normalizeEmail(session?.user?.email),
        isHero: true,
      },
    })
    post.events.unshift(event)
  }

  const heroEdited = post.events.some((e) => e.type === 'EDITED' && e.isHero)
  const heroViewed = heroEdited || post.events.some((e) => e.type === 'HERO_VIEWED')
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
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {post.isOwnStory ? (
              <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                Told by the hero themself
              </span>
            ) : null}
            {!post.isOwnStory && post.heroEmail ? (
              heroViewed ? (
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  ✓ The hero has seen this story
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  The hero hasn&apos;t seen this story yet
                </span>
              )
            ) : null}
            {!post.isOwnStory && heroEdited ? (
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                ✓ Edited by the hero
              </span>
            ) : null}
          </div>
          {isAuthor || isHero ? (
            <div className="mt-4 flex items-center gap-2">
              <Link
                href={`/posts/${post.id}/edit`}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-500"
              >
                Edit
              </Link>
              {isAuthor ? <DeletePostButton postId={post.id} /> : null}
            </div>
          ) : null}
          {post.heroProfile?.verificationStatus !== 'VERIFIED' ? (
            <div className="mt-4">
              <ClaimProfileButton postId={post.id} />
            </div>
          ) : (
            <div className="mt-4 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              ✓ Identity and payouts verified
            </div>
          )}
          <div className="prose prose-slate mt-6 max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold">Support this hero</h2>
        {justDonated ? (
          <p className="mt-3 rounded-lg bg-green-50 p-4 text-sm text-green-800">
            Thank you for supporting {post.name}! Your donation has been recorded.
          </p>
        ) : null}
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
          <DonateSection
            postId={post.id}
            enabled={Boolean(
              stripeConfigured() &&
                post.heroProfile?.verificationStatus === 'VERIFIED' &&
                !post.heroProfile.payoutsFrozen &&
                !post.flagged
            )}
            disabledReason={
              stripeConfigured()
                ? 'Donations open after this hero completes identity and payout verification.'
                : undefined
            }
          />
        </div>
      </div>

      <PostHistory events={post.events} maskEmails={!isAuthor && !isHero} />
    </article>
  )
}
