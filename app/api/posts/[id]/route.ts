import { NextRequest, NextResponse } from 'next/server'
import type { Session } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { isHeroEmail, normalizeEmail } from '@/lib/hero'
import { readImageField, postFieldsError } from '../shared'
import { issueAndSendClaim } from '@/lib/claim-email'

type Access =
  | { denied: NextResponse }
  | { denied: null; session: Session; isAuthor: boolean; isHero: boolean }

/** Authors always have access; the hero (matching signed-in email) too. */
async function postAccess(id: string): Promise<Access> {
  const session = await auth()
  if (!session?.user?.id) {
    return { denied: NextResponse.json({ error: 'Sign in first.' }, { status: 401 }) }
  }
  const post = await prisma.post.findUnique({
    where: { id },
    select: { authorId: true, heroEmail: true, heroProfileId: true },
  })
  if (!post) {
    return { denied: NextResponse.json({ error: 'Post not found.' }, { status: 404 }) }
  }
  const isAuthor = post.authorId === session.user.id
  const isHero = isHeroEmail(session.user.email, post.heroEmail)
  if (!isAuthor && !isHero) {
    return {
      denied: NextResponse.json(
        { error: 'Only the author or the hero can modify this post.' },
        { status: 403 }
      ),
    }
  }
  return { denied: null, session, isAuthor, isHero }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const access = await postAccess(id)
  if (access.denied) return access.denied

  const formData = await req.formData()
  const name = String(formData.get('name') ?? '').trim()
  const content = String(formData.get('content') ?? '').trim()
  const requestedHeroEmail = normalizeEmail(String(formData.get('heroEmail') ?? ''))

  const fieldsError = postFieldsError(name, content)
  if (fieldsError) return NextResponse.json({ error: fieldsError }, { status: 400 })

  const image = readImageField(formData)
  if (image instanceof NextResponse) return image
  const imageData = image ? await image.load() : null

  const { session, isHero } = access
  const post = await prisma.post.update({
    where: { id },
    data: {
      name,
      content,
      ...(access.isAuthor && requestedHeroEmail
        ? {
            heroEmail: requestedHeroEmail,
            heroProfile: {
              update: { heroName: name, contactEmail: requestedHeroEmail },
            },
          }
        : { heroProfile: { update: { heroName: name } } }),
      // A newly uploaded cover replaces the existing one; omitting the field
      // keeps the current cover.
      ...(imageData
        ? { image: { upsert: { create: imageData, update: imageData } } }
        : {}),
      events: {
        create: {
          type: 'EDITED',
          actorName: session.user.name ?? session.user.email ?? 'Anonymous',
          actorEmail: normalizeEmail(session.user.email),
          isHero,
        },
      },
    },
    select: { id: true, heroProfileId: true, heroEmail: true },
  })

  if (access.isAuthor && requestedHeroEmail && post.heroProfileId) {
    await issueAndSendClaim({
      heroProfileId: post.heroProfileId,
      heroName: name,
      email: requestedHeroEmail,
      fallbackOrigin: req.nextUrl.origin,
    })
  }

  return NextResponse.json({ id })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const access = await postAccess(id)
  if (access.denied) return access.denied
  if (!access.isAuthor) {
    return NextResponse.json(
      { error: 'Only the author can delete this post.' },
      { status: 403 }
    )
  }

  await prisma.post.delete({ where: { id } })
  return NextResponse.json({ deleted: true })
}
