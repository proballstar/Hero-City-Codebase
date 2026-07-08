import { NextResponse } from 'next/server'

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024
export const MAX_PAGE_SIZE = 50

export function postFieldsError(name: string, content: string): string | null {
  if (!name || !content) return 'name and content are required.'
  if (name.length > 120) return 'Name must be 120 characters or fewer.'
  if (content.length > 20000) return 'Content must be 20,000 characters or fewer.'
  return null
}

/**
 * Validates the optional `image` form field. Returns a NextResponse on
 * validation failure, null when no image was supplied, or a loader whose
 * `load()` resolves to Prisma Image create data.
 */
export function readImageField(formData: FormData) {
  const image = formData.get('image')
  if (!(image instanceof File) || image.size === 0) return null
  if (!image.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Cover must be an image file.' }, { status: 400 })
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: 'Cover image must be 2 MB or smaller.' },
      { status: 400 }
    )
  }
  return {
    async load(): Promise<{ data: Uint8Array<ArrayBuffer>; mimeType: string }> {
      return {
        data: new Uint8Array(await image.arrayBuffer()),
        mimeType: image.type,
      }
    },
  }
}
