import { useState } from 'react'
import { Check, X, FileText, Store, User as UserIcon } from 'lucide-react'
import Swal from 'sweetalert2'
import { Card, Table, Badge, Button, SkeletonTable } from '@components'
import { useGetReportsQuery, useResolveReportMutation } from '@store/api'

const typeIcon = { review: FileText, restaurant: Store, user: UserIcon }
const statusVariant = { open: 'warning', resolved: 'success', dismissed: 'default' }

export const ReportsPage = () => {
  const [status, setStatus] = useState('open')
  const { data, isLoading } = useGetReportsQuery({ status })
  const [resolveReport] = useResolveReportMutation()

  const reports = data?.data?.reports || []

  const act = async (report, next) => {
    try {
      await resolveReport({ id: report._id, status: next }).unwrap()
    } catch (err) {
      Swal.fire({ icon: 'error', text: err?.data?.message || 'Failed' })
    }
  }

  const tabs = [
    { key: 'open', label: 'Open' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'dismissed', label: 'Dismissed' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatus(t.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              status === t.key ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={5} />
        ) : (
          <Table>
            <Table.Header>
              <Table.Row hoverable={false}>
                <Table.Head>Type</Table.Head>
                <Table.Head>Target</Table.Head>
                <Table.Head>Reason</Table.Head>
                <Table.Head>Reporter</Table.Head>
                <Table.Head>Status</Table.Head>
                <Table.Head align="right">Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {reports.map((r) => {
                const Icon = typeIcon[r.targetType] || FileText
                return (
                  <Table.Row key={r._id}>
                    <Table.Cell>
                      <span className="inline-flex items-center gap-2 capitalize">
                        <Icon className="w-4 h-4 text-gray-400" /> {r.targetType}
                      </span>
                    </Table.Cell>
                    <Table.Cell className="text-gray-700">{r.targetLabel || '—'}</Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900">{r.reason}</p>
                        <p className="text-xs text-gray-400 line-clamp-1">{r.description}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="text-gray-500 whitespace-nowrap">
                      {r.reporter ? `${r.reporter.firstName} ${r.reporter.lastName}` : 'Anonymous'}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                    </Table.Cell>
                    <Table.Cell align="right">
                      {r.status === 'open' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => act(r, 'resolved')}
                            leftIcon={<Check className="w-3.5 h-3.5" />}
                          >
                            Resolve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => act(r, 'dismissed')}
                            leftIcon={<X className="w-3.5 h-3.5" />}
                          >
                            Dismiss
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => act(r, 'open')}>
                          Reopen
                        </Button>
                      )}
                    </Table.Cell>
                  </Table.Row>
                )
              })}
              {!reports.length && (
                <Table.Row hoverable={false}>
                  <Table.Cell className="text-center text-gray-400 py-8">No {status} reports.</Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        )}
      </Card>
    </div>
  )
}
