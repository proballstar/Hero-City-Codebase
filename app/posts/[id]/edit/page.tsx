import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import PostForm from '@/components/PostForm'

export const metadata = { title: 'Edit Post — Hero City' }

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      content: true,
      authorId: true,
      image: { select: { id: true } },
    },
  })

  if (!post) notFound()
  if (!session?.user?.id || post.authorId !== session.user.id) {
    redirect(`/posts/${id}`)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Edit “{post.name}”</h1>
      <div className="mt-6">
        <PostForm
          post={{
            id: post.id,
            name: post.name,
            content: post.content,
            hasImage: Boolean(post.image),
          }}
        />
      </div>
    </div>
  )
}
