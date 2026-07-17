import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { normalizeEmail } from '@/lib/hero'
import { sendHeroInvite } from '@/lib/email'
import { appOrigin } from '@/lib/appUrl'
import { readImageField, postFieldsError, MAX_PAGE_SIZE } from './shared'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(searchParams.get('pageSize')) || 12)
  )

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        authorName: true,
        createdAt: true,
        image: { select: { id: true } },
      },
    }),
    prisma.post.count(),
  ])

  return NextResponse.json({
    posts,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in to create a post.' }, { status: 401 })
  }

  const formData = await req.formData()
  const name = String(formData.get('name') ?? '').trim()
  const content = String(formData.get('content') ?? '').trim()
  const isOwnStory = formData.get('storyType') === 'own'
  const heroEmailRaw = String(formData.get('heroEmail') ?? '').trim()

  const fieldsError = postFieldsError(name, content)
  if (fieldsError) return NextResponse.json({ error: fieldsError }, { status: 400 })

  const sessionEmail = normalizeEmail(session.user.email)
  let heroEmail: string | null = null
  if (isOwnStory) {
    heroEmail = sessionEmail
  } else if (heroEmailRaw) {
    heroEmail = normalizeEmail(heroEmailRaw)
    if (!heroEmail) {
      return NextResponse.json(
        { error: "The hero's email address is not valid." },
        { status: 400 }
      )
    }
  }

  const image = readImageField(formData)
  if (image instanceof NextResponse) return image

  const actorName = session.user.name ?? session.user.email ?? 'Anonymous'
  const post = await prisma.post.create({
    data: {
      name,
      content,
      authorId: session.user.id,
      authorName: actorName,
      isOwnStory,
      heroEmail,
      ...(image ? { image: { create: await image.load() } } : {}),
      events: {
        create: {
          type: 'CREATED',
          actorName,
          actorEmail: sessionEmail,
          isHero: isOwnStory,
        },
      },
    },
  })

  // Invite the hero by email when the story is about someone else. Best
  // effort: a missing email provider or a failed send never blocks the post.
  if (!isOwnStory && heroEmail && heroEmail !== sessionEmail) {
    const origin = appOrigin(req.nextUrl.origin)
    const sent = await sendHeroInvite({
      to: heroEmail,
      postName: name,
      postUrl: `${origin}/posts/${post.id}`,
      authorName: actorName,
    }).catch(() => false)
    if (sent) {
      await prisma.postEvent.create({
        data: {
          postId: post.id,
          type: 'INVITE_SENT',
          actorName,
          actorEmail: sessionEmail,
        },
      })
    }
  }

  return NextResponse.json({ id: post.id }, { status: 201 })
}
