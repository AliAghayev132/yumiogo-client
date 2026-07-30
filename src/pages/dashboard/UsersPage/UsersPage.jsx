import { useState } from 'react'
import { Search, Ban, CheckCircle2, Trash2, Shield, ShieldOff } from 'lucide-react'
import Swal from 'sweetalert2'
import { Card, Table, Badge, Button, Input, SkeletonTable } from '@components'
import { useGetUsersQuery, useUpdateUserMutation, useDeleteUserMutation } from '@store/api'

const statusVariant = { active: 'success', suspended: 'danger', pending: 'warning' }

export const UsersPage = () => {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching } = useGetUsersQuery({ search, page, limit: 10 })
  const [updateUser] = useUpdateUserMutation()
  const [deleteUser] = useDeleteUserMutation()

  const users = data?.data?.users || []
  const pagination = data?.data?.pagination || {}

  const toggleStatus = async (user) => {
    const next = user.status === 'active' ? 'suspended' : 'active'
    try {
      await updateUser({ id: user._id, status: next }).unwrap()
    } catch (err) {
      Swal.fire({ icon: 'error', text: err?.data?.message || 'Update failed' })
    }
  }

  const toggleRole = async (user) => {
    const next = user.role === 'admin' ? 'user' : 'admin'
    const res = await Swal.fire({
      icon: 'question',
      title: next === 'admin' ? 'Grant admin access?' : 'Remove admin access?',
      text: `${user.firstName} ${user.lastName} will become "${next}".`,
      showCancelButton: true,
      confirmButtonText: 'Confirm',
    })
    if (!res.isConfirmed) return
    try {
      await updateUser({ id: user._id, role: next }).unwrap()
    } catch (err) {
      Swal.fire({ icon: 'error', text: err?.data?.message || 'Update failed' })
    }
  }

  const remove = async (user) => {
    const res = await Swal.fire({
      icon: 'warning',
      title: 'Delete user?',
      text: `${user.firstName} ${user.lastName} will be removed.`,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#EF4444',
    })
    if (!res.isConfirmed) return
    try {
      await deleteUser(user._id).unwrap()
    } catch (err) {
      Swal.fire({ icon: 'error', text: err?.data?.message || 'Delete failed' })
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search by name or email..."
            className="pl-9"
          />
        </div>
        <span className="text-sm text-gray-500">{pagination.total ?? 0} users</span>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={6} />
        ) : (
          <Table>
            <Table.Header>
              <Table.Row hoverable={false}>
                <Table.Head>User</Table.Head>
                <Table.Head>Email</Table.Head>
                <Table.Head>Role</Table.Head>
                <Table.Head>Status</Table.Head>
                <Table.Head align="right">Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {users.map((u) => (
                <Table.Row key={u._id}>
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">
                        {u.firstName?.[0]}
                        {u.lastName?.[0]}
                      </div>
                      <span className="font-medium">
                        {u.firstName} {u.lastName}
                      </span>
                    </div>
                  </Table.Cell>
                  <Table.Cell className="text-gray-500">{u.email}</Table.Cell>
                  <Table.Cell>
                    <Badge variant={u.role === 'admin' ? 'purple' : 'default'}>{u.role}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant={statusVariant[u.status] || 'default'}>{u.status}</Badge>
                  </Table.Cell>
                  <Table.Cell align="right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleRole(u)}
                        className="text-gray-600 hover:bg-gray-100"
                        title={u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                      >
                        {u.role === 'admin' ? (
                          <ShieldOff className="w-4 h-4" />
                        ) : (
                          <Shield className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant={u.status === 'active' ? 'outline' : 'success'}
                        onClick={() => toggleStatus(u)}
                        leftIcon={
                          u.status === 'active' ? (
                            <Ban className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )
                        }
                      >
                        {u.status === 'active' ? 'Suspend' : 'Activate'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => remove(u)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
              {!users.length && (
                <Table.Row hoverable={false}>
                  <Table.Cell className="text-center text-gray-400 py-8" align="center">
                    <span className="block" style={{ gridColumn: '1 / -1' }}>
                      No users found.
                    </span>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        )}
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </Button>
          <span className="text-sm text-gray-500">
            Page {pagination.page} / {pagination.pages} {isFetching && '…'}
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
    </div>
  )
}
