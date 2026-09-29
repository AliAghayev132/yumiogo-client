import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'

import {
  SEO,
  Card,
  Table,
  Badge,
  Modal,
  Input,
  Button,
  Select,
  Textarea,
  PageLoader,
  useBanner,
  useConfirm,
  errorMessage,
} from '@components'
import {
  useGetPostsQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
} from '@store/api'
import { statusOptions, statusBadgeVariant } from '@constants'
import { formatDate } from '@utils'

const emptyForm = { title: '', content: '', excerpt: '', status: 'draft' }

// Full CRUD example for the generic `Post` resource: list + create + edit + delete.
export const PostsPage = () => {
  const { data, isLoading } = useGetPostsQuery({ limit: 50 })
  const [createPost, { isLoading: isCreating }] = useCreatePostMutation()
  const [updatePost, { isLoading: isUpdating }] = useUpdatePostMutation()
  const [deletePost] = useDeletePostMutation()
  const banner = useBanner()
  const confirm = useConfirm()

  const posts = data?.data?.posts || []

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setIsModalOpen(true)
  }

  const openEdit = (post) => {
    setEditingId(post._id)
    setForm({
      title: post.title || '',
      content: post.content || '',
      excerpt: post.excerpt || '',
      status: post.status || 'draft',
    })
    setIsModalOpen(true)
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await updatePost({ id: editingId, ...form }).unwrap()
      } else {
        await createPost(form).unwrap()
      }
      setIsModalOpen(false)
      setForm(emptyForm)
      setEditingId(null)
    } catch (err) {
      banner.error(errorMessage(err, 'Could not save the post.'), { title: 'Save failed' })
    }
  }

  const handleDelete = async (post) => {
    const ok = await confirm({
      tone: 'danger',
      title: 'Delete post?',
      message: `"${post.title}" will be removed.`,
      confirmText: 'Delete',
    })
    if (!ok) return
    try {
      await deletePost(post._id).unwrap()
    } catch (err) {
      banner.error(errorMessage(err, 'Could not delete the post.'), { title: 'Delete failed' })
    }
  }

  return (
    <div className="space-y-6">
      <SEO title="Posts" noindex />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Posts</h1>
          <p className="text-sm text-gray-500">Manage your example content.</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>
          New post
        </Button>
      </div>

      <Card padding="none">
        {isLoading ? (
          <PageLoader />
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No posts yet. Create your first one.
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row hoverable={false}>
                <Table.Head>Title</Table.Head>
                <Table.Head>Status</Table.Head>
                <Table.Head align="center">Views</Table.Head>
                <Table.Head>Created</Table.Head>
                <Table.Head align="right">Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {posts.map((post) => (
                <Table.Row key={post._id}>
                  <Table.Cell>
                    <span className="font-medium text-gray-900">{post.title}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant={statusBadgeVariant[post.status] || 'default'}>
                      {post.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell align="center">{post.views || 0}</Table.Cell>
                  <Table.Cell>{formatDate(post.createdAt)}</Table.Cell>
                  <Table.Cell align="right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(post)}
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(post)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit post' : 'New post'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />
          <Textarea
            label="Excerpt"
            name="excerpt"
            value={form.excerpt}
            onChange={handleChange}
            rows={2}
          />
          <Textarea
            label="Content"
            name="content"
            value={form.content}
            onChange={handleChange}
            rows={6}
            required
          />
          <Select
            label="Status"
            name="status"
            value={form.status}
            onChange={handleChange}
            options={statusOptions}
            placeholder="Select status"
          />
          <Modal.Footer className="px-0 pb-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? 'Saving...' : editingId ? 'Save' : 'Create'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}
