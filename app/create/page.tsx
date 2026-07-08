import CreatePostForm from '@/components/CreatePostForm'

export const metadata = { title: 'Share a Hero — Hero City' }

export default function CreatePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Share a Hero</h1>
      <p className="mt-1 text-slate-600">
        Tell the community about someone doing heroic work. Markdown is supported in
        the story field.
      </p>
      <div className="mt-6">
        <CreatePostForm />
      </div>
    </div>
  )
}
