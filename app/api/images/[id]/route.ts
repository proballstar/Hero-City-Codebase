import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const image = await prisma.image.findUnique({ where: { id } })
  if (!image) {
    return NextResponse.json({ error: 'Image not found.' }, { status: 404 })
  }

  return new NextResponse(new Uint8Array(image.data), {
    headers: {
      'Content-Type': image.mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
