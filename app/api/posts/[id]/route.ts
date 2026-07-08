import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { readImageField, postFieldsError } from '../shared'

async function authorizePostAccess(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })
  }
  const post = await prisma.post.findUnique({ where: { id }, select: { authorId: true } })
  if (!post) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
  }
  if (post.authorId !== session.user.id) {
    return NextResponse.json({ error: 'Only the author can modify this post.' }, { status: 403 })
  }
  return null
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const denied = await authorizePostAccess(id)
  if (denied) return denied

  const formData = await req.formData()
  const name = String(formData.get('name') ?? '').trim()
  const content = String(formData.get('content') ?? '').trim()

  const fieldsError = postFieldsError(name, content)
  if (fieldsError) return NextResponse.json({ error: fieldsError }, { status: 400 })

  const image = readImageField(formData)
  if (image instanceof NextResponse) return image
  const imageData = image ? await image.load() : null

  await prisma.post.update({
    where: { id },
    data: {
      name,
      content,
      // A newly uploaded cover replaces the existing one; omitting the field
      // keeps the current cover.
      ...(imageData
        ? { image: { upsert: { create: imageData, update: imageData } } }
        : {}),
    },
  })

  return NextResponse.json({ id })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const denied = await authorizePostAccess(id)
  if (denied) return denied

  await prisma.post.delete({ where: { id } })
  return NextResponse.json({ deleted: true })
}
