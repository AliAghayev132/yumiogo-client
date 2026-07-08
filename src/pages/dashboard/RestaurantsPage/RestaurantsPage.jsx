import { useState } from 'react'
import { Search, Trash2, Star, Plus, Pencil } from 'lucide-react'
import Swal from 'sweetalert2'
import { Card, Table, Badge, Button, Input, PageLoader } from '@components'
import {
  useGetAdminRestaurantsQuery,
  useDeleteRestaurantMutation,
  useGetMetaQuery,
} from '@store/api'
import { RestaurantFormModal } from './RestaurantFormModal'

const statusVariant = { active: 'success', pending: 'warning', closed: 'danger' }

export const RestaurantsPage = () => {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(undefined) // undefined = closed, null = create, obj = edit
  const { data, isLoading } = useGetAdminRestaurantsQuery({ search, page, limit: 10 })
  const { data: metaData } = useGetMetaQuery()
  const [deleteRestaurant] = useDeleteRestaurantMutation()

  const restaurants = data?.data?.restaurants || []
  const pagination = data?.data?.pagination || {}
  const meta = metaData?.data

  const remove = async (r) => {
    const res = await Swal.fire({
      icon: 'warning',
      title: 'Delete restaurant?',
      text: `${r.name} will be removed.`,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#EF4444',
    })
    if (!res.isConfirmed) return
    try {
      await deleteRestaurant(r._id).unwrap()
    } catch (err) {
      Swal.fire({ icon: 'error', text: err?.data?.message || 'Delete failed' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search restaurants..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{pagination.total ?? 0} restaurants</span>
          <Button variant="success" onClick={() => setEditing(null)} leftIcon={<Plus className="w-4 h-4" />}>
            Add restaurant
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : (
          <Table>
            <Table.Header>
              <Table.Row hoverable={false}>
                <Table.Head>Restaurant</Table.Head>
                <Table.Head>Cuisines</Table.Head>
                <Table.Head>Price</Table.Head>
                <Table.Head>Rating</Table.Head>
                <Table.Head>Status</Table.Head>
                <Table.Head align="right">Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {restaurants.map((r) => (
                <Table.Row key={r._id}>
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      {r.coverImages?.[0] ? (
                        <img src={r.coverImages[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100" />
                      )}
                      <div>
                        <p className="font-medium">{r.name}</p>
                        <p className="text-xs text-gray-400">{r.city}</p>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell className="text-gray-500">{(r.cuisines || []).slice(0, 2).join(', ')}</Table.Cell>
                  <Table.Cell>{r.priceLevel}</Table.Cell>
                  <Table.Cell>
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      {r.rating?.toFixed(1)} <span className="text-gray-400">({r.reviewCount})</span>
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant={statusVariant[r.status] || 'default'}>{r.status}</Badge>
                  </Table.Cell>
                  <Table.Cell align="right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing(r)}
                        className="text-gray-600 hover:bg-gray-100"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => remove(r)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
              {!restaurants.length && (
                <Table.Row hoverable={false}>
                  <Table.Cell className="text-center text-gray-400 py-8">No restaurants found.</Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        )}
      </Card>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </Button>
          <span className="text-sm text-gray-500">
            Page {pagination.page} / {pagination.pages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {editing !== undefined && (
        <RestaurantFormModal restaurant={editing} meta={meta} onClose={() => setEditing(undefined)} />
      )}
    </div>
  )
}
