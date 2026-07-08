import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const MAX_IMAGE_BYTES = 2 * 1024 * 1024

export async function GET() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      authorName: true,
      createdAt: true,
      image: { select: { id: true } },
    },
  })
  return NextResponse.json({ posts })
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()

  const name = String(formData.get('name') ?? '').trim()
  const authorName = String(formData.get('authorName') ?? '').trim()
  const content = String(formData.get('content') ?? '').trim()
  const image = formData.get('image')

  if (!name || !authorName || !content) {
    return NextResponse.json(
      { error: 'name, authorName and content are required.' },
      { status: 400 }
    )
  }
  if (name.length > 120 || authorName.length > 120 || content.length > 20000) {
    return NextResponse.json({ error: 'A field exceeds its maximum length.' }, { status: 400 })
  }

  let imageData: { data: Uint8Array<ArrayBuffer>; mimeType: string } | null = null
  if (image instanceof File && image.size > 0) {
    if (!image.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Cover must be an image file.' }, { status: 400 })
    }
    if (image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: 'Cover image must be 2 MB or smaller.' },
        { status: 400 }
      )
    }
    imageData = {
      data: new Uint8Array(await image.arrayBuffer()),
      mimeType: image.type,
    }
  }

  const post = await prisma.post.create({
    data: {
      name,
      authorName,
      content,
      ...(imageData ? { image: { create: imageData } } : {}),
    },
  })

  return NextResponse.json({ id: post.id }, { status: 201 })
}
