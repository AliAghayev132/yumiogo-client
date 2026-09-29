import { useId, useState } from 'react'
import { Check, X } from 'lucide-react'
import {
  Badge,
  Button,
  ChipButton,
  Input,
  Modal,
  StatusPill,
  Table,
  TableCard,
  Tabs,
  UserCell,
  relativeDay,
  useBanner,
  useConfirm,
  useHeaderSearch,
  errorMessage,
} from '@components'
import { useGetLabelRequestsQuery, useGetReviewLabelsQuery, useReviewLabelRequestMutation } from '@store/api'

const PAGE_SIZE = 10
const COLS = 6
const STATUS_TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
]

const fullName = (u) => [u?.firstName, u?.lastName].filter(Boolean).join(' ')

/** Approve a label idea, optionally renaming it or moving it to another group. */
const ApproveDialog = ({ request, groups, onClose }) => {
  const [name, setName] = useState(request.label)
  const [group, setGroup] = useState(request.group || '')
  const [touched, setTouched] = useState(false)
  const listId = useId()
  const [review, { isLoading }] = useReviewLabelRequestMutation()
  const banner = useBanner()
  const nameError = name.trim() ? undefined : 'Name is required'

  const submit = async (e) => {
    e.preventDefault()
    setTouched(true)
    if (nameError) return
    try {
      const res = await review({ id: request._id, status: 'approved', name: name.trim(), group: group.trim() }).unwrap()
      banner.success(res?.message || 'Label approved — user notified')
      onClose()
    } catch (err) {
      banner.error(errorMessage(err, 'Could not approve the label'))
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      icon={Check}
      tone="green"
      title={`Approve “${request.label}”?`}
      description="The label is added to the review sheet for everyone. The user who suggested it will be notified."
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <Input
          label="Label name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          error={touched ? nameError : undefined}
          helperText="Fix the spelling or wording before it goes live."
          data-autofocus
        />
        <Input
          label="Group"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          maxLength={40}
          list={listId}
          placeholder="e.g. Good for"
        />
        <datalist id={listId}>
          {groups.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
        <Modal.Footer>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="success" loading={isLoading}>
            Approve
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}

/**
 * Label ideas from the app's "Request a label" dialog (GET /admin/review-labels/requests):
 * approve (creates / re-activates the label, optional rename and group) or reject with a note.
 */
export const LabelRequestsPanel = () => {
  const search = useHeaderSearch({ placeholder: 'Search label requests' })
  const [status, setStatus] = useState('pending')
  const [approving, setApproving] = useState(null)
  const filterKey = `${status}|${search}`
  const [paging, setPaging] = useState({ key: filterKey, page: 1 })
  const page = paging.key === filterKey ? paging.page : 1

  const { data, isLoading, isFetching, isError, refetch } = useGetLabelRequestsQuery({
    status,
    search: search || undefined,
    page,
    limit: PAGE_SIZE,
  })
  const { data: labelsData } = useGetReviewLabelsQuery()
  const [review] = useReviewLabelRequestMutation()
  const confirm = useConfirm()
  const banner = useBanner()

  const requests = data?.data?.requests || []
  const counts = data?.data?.counts || {}
  const total = data?.data?.pagination?.total || 0
  const groups = [...new Set(['Good for', 'What was wrong?', ...(labelsData?.data?.groups || [])])]

  const reject = async (request) => {
    const ok = await confirm({
      tone: 'danger',
      icon: X,
      title: `Reject “${request.label}”?`,
      message: 'The label is not added. The user will be notified, with your note if you add one.',
      confirmText: 'Reject',
      reasonField: {
        label: 'Note to the user (optional)',
        placeholder: 'e.g. We already have a similar label.',
        maxLength: 300,
      },
      onConfirm: (note) => review({ id: request._id, status: 'rejected', note: note || undefined }).unwrap(),
    })
    if (ok) banner.success(ok.result?.message || 'Label request rejected — user notified')
  }

  return (
    <>
      <TableCard
        title="Label requests"
        subtitle="Label ideas people sent from the review sheet in the app"
        toolbar={
          <div className="max-w-full overflow-x-auto scrollbar-thin">
            <Tabs
              variant="pill"
              value={status}
              onChange={setStatus}
              aria-label="Request status"
              items={STATUS_TABS.map((t) => ({ ...t, count: counts[t.value] ?? undefined }))}
            />
          </div>
        }
        pagination={{ page, total, limit: PAGE_SIZE, onPageChange: (p) => setPaging({ key: filterKey, page: p }) }}
      >
        <Table minWidth={860} className={isFetching && !isLoading ? 'opacity-60 transition-opacity' : undefined}>
          <Table.Header>
            <Table.Row>
              <Table.Head>Label</Table.Head>
              <Table.Head width={170}>Group</Table.Head>
              <Table.Head width={200}>Requested by</Table.Head>
              <Table.Head width={112}>Date</Table.Head>
              <Table.Head width={120}>Status</Table.Head>
              <Table.Head align="right" width={150}>
                Actions
              </Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading ? (
              <Table.Loading rows={4} cols={COLS} avatar={false} />
            ) : isError ? (
              <Table.Empty
                colSpan={COLS}
                title="Could not load label requests"
                action={
                  <Button size="sm" variant="outline" onClick={refetch}>
                    Try again
                  </Button>
                }
              />
            ) : requests.length ? (
              requests.map((r) => (
                <Table.Row key={r._id}>
                  <Table.Cell>
                    <p>{r.label}</p>
                    {r.status !== 'pending' && (r.adminNote || r.reviewedBy) && (
                      <p className="max-w-xs truncate text-xs font-normal text-ink-muted">
                        {r.reviewedBy ? `${fullName(r.reviewedBy)}` : ''}
                        {r.reviewedAt ? ` · ${relativeDay(r.reviewedAt)}` : ''}
                        {r.adminNote ? ` · “${r.adminNote}”` : ''}
                      </p>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {r.group ? (
                      <Badge tone="info" size="md">
                        {r.group}
                      </Badge>
                    ) : (
                      <span className="text-ink-placeholder">—</span>
                    )}
                  </Table.Cell>
                  <Table.Cell>{r.user ? <UserCell user={r.user} short /> : <UserCell name="Deleted user" />}</Table.Cell>
                  <Table.Cell nowrap>{relativeDay(r.createdAt)}</Table.Cell>
                  <Table.Cell>
                    <StatusPill status={r.status} />
                  </Table.Cell>
                  <Table.Cell>
                    <Table.Actions>
                      {r.status === 'pending' && (
                        <>
                          <ChipButton tone="success" onClick={() => setApproving(r)}>
                            Approve
                          </ChipButton>
                          <ChipButton tone="danger" onClick={() => reject(r)}>
                            Reject
                          </ChipButton>
                        </>
                      )}
                    </Table.Actions>
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Empty
                colSpan={COLS}
                title={search ? 'No requests match' : status === 'pending' ? 'No label requests waiting' : 'No label requests'}
                description={search ? `Nothing found for “${search}”.` : undefined}
              />
            )}
          </Table.Body>
        </Table>
      </TableCard>
      {approving && <ApproveDialog request={approving} groups={groups} onClose={() => setApproving(null)} />}
    </>
  )
}
