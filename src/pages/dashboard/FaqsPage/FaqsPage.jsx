import { useState } from 'react'
import { Plus, Pencil, Trash2, CircleHelp, CircleAlert } from 'lucide-react'
import {
  TableCard,
  Table,
  Badge,
  Button,
  IconButton,
  Switch,
  FilterMenu,
  OrderButtons,
  useBatchedReorder,
  useHeaderSearch,
  useBanner,
  useConfirm,
  errorMessage,
} from '@components'
import {
  useGetAdminFaqsQuery,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
  useReorderFaqsMutation,
} from '@store/api'
import { FaqFormModal } from './FaqFormModal'
import { audienceLabel, audienceTone } from './audiences'

// "App" / "Website" show what that client displays ("both" entries included).
const FILTERS = [
  {
    key: 'audience',
    label: 'Shown in',
    options: [
      { value: 'app', label: 'App' },
      { value: 'web', label: 'Website' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'hidden', label: 'Hidden' },
    ],
  },
]

const COLUMNS = 6

/**
 * FAQ — questions shown on the app's Help & support screen and the website
 * FAQ. Order here is the order users see; it can only be changed while the
 * list is not searched or filtered.
 */
export const FaqsPage = () => {
  const search = useHeaderSearch({ placeholder: 'Search FAQs' })
  const [filters, setFilters] = useState({ audience: '', status: '' })
  const [editing, setEditing] = useState(undefined) // undefined = closed, null = create, obj = edit
  const { data, isLoading, isError, refetch } = useGetAdminFaqsQuery()
  const [updateFaq] = useUpdateFaqMutation()
  const [deleteFaq] = useDeleteFaqMutation()
  const [reorderFaqs] = useReorderFaqsMutation()
  const banner = useBanner()
  const confirm = useConfirm()

  // Moves show at once; quick clicks are saved together in one request.
  const { list: faqs, move } = useBatchedReorder(data?.data?.faqs || [], async (ids) => {
    try {
      await reorderFaqs({ ids }).unwrap()
    } catch (err) {
      banner.error(errorMessage(err, 'Could not save the new order'))
      throw err
    }
  })
  const categories = [...new Set(faqs.map((f) => f.category).filter(Boolean))].sort()

  const { audience, status } = filters
  const term = search.toLowerCase()
  const visible = faqs.filter(
    (f) =>
      (!audience || f.audience === audience || f.audience === 'both') &&
      (!status || (status === 'active' ? f.isActive : !f.isActive)) &&
      (!term ||
        f.question.toLowerCase().includes(term) ||
        f.answer.toLowerCase().includes(term) ||
        (f.category || '').toLowerCase().includes(term))
  )
  const filtering = !!term || !!audience || !!status

  const toggleActive = async (faq) => {
    try {
      await updateFaq({ id: faq._id, isActive: !faq.isActive }).unwrap()
      banner.success(faq.isActive ? 'FAQ hidden' : 'FAQ shown')
    } catch (err) {
      banner.error(errorMessage(err, 'Update failed'))
    }
  }

  const remove = async (faq) => {
    const ok = await confirm({
      tone: 'danger',
      icon: Trash2,
      title: 'Delete FAQ?',
      message: `“${faq.question}” will be removed from the app and the website.`,
      confirmText: 'Delete FAQ',
    })
    if (!ok) return
    try {
      await deleteFaq(faq._id).unwrap()
      banner.success('FAQ deleted')
    } catch (err) {
      banner.error(errorMessage(err, 'Delete failed'))
    }
  }

  const empty = isError ? (
    <Table.Empty
      colSpan={COLUMNS}
      icon={CircleAlert}
      title="Could not load the FAQs"
      description="Check your connection and try again."
      action={
        <Button size="sm" variant="outline" onClick={refetch}>
          Try again
        </Button>
      }
    />
  ) : faqs.length ? (
    <Table.Empty
      colSpan={COLUMNS}
      title="No FAQs match your filters"
      description="Try another search or clear the filters."
    />
  ) : (
    <Table.Empty
      colSpan={COLUMNS}
      icon={CircleHelp}
      title="No FAQs yet"
      description="Add the first question people will see in the app and on the website."
    />
  )

  return (
    <>
      <TableCard
        title="All FAQs"
        subtitle={
          filtering && faqs.length > 1
            ? 'Clear the search and filters to change the order.'
            : "Shown on the app's Help & support screen and the website FAQ, in this order."
        }
        actions={
          <>
            <FilterMenu filters={FILTERS} value={filters} onChange={setFilters} />
            <Button size="sm" leftIcon={Plus} onClick={() => setEditing(null)}>
              Add FAQ
            </Button>
          </>
        }
        pagination={{
          page: 1,
          total: visible.length,
          limit: Math.max(visible.length, 1),
          onPageChange: () => {},
          itemLabel: visible.length === 1 ? 'FAQ' : 'FAQs',
        }}
      >
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head width="6rem">Order</Table.Head>
              <Table.Head>Question</Table.Head>
              <Table.Head>Category</Table.Head>
              <Table.Head>Shown in</Table.Head>
              <Table.Head>Active</Table.Head>
              <Table.Head align="right">Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading ? (
              <Table.Loading rows={5} cols={COLUMNS} avatar={false} />
            ) : (
              visible.map((faq) => {
                const index = faqs.indexOf(faq)
                return (
                  <Table.Row key={faq._id}>
                    <Table.Cell>
                      <OrderButtons index={index} count={faqs.length} onMove={move} disabled={filtering} />
                    </Table.Cell>
                    <Table.Cell className="max-w-md">
                      <p className={faq.isActive ? 'text-ink' : 'text-ink-muted'}>{faq.question}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs font-normal text-ink-muted">{faq.answer}</p>
                    </Table.Cell>
                    <Table.Cell muted nowrap>
                      {faq.category || '—'}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge tone={audienceTone[faq.audience] || 'neutral'} size="sm">
                        {audienceLabel(faq.audience)}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Switch
                        size="sm"
                        checked={faq.isActive}
                        onChange={() => toggleActive(faq)}
                        label={faq.isActive ? 'Hide this FAQ' : 'Show this FAQ'}
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Table.Actions>
                        <IconButton icon={Pencil} label="Edit" onClick={() => setEditing(faq)} />
                        <IconButton icon={Trash2} label="Delete" tone="danger" onClick={() => remove(faq)} />
                      </Table.Actions>
                    </Table.Cell>
                  </Table.Row>
                )
              })
            )}
            {!isLoading && !visible.length && empty}
          </Table.Body>
        </Table>
      </TableCard>

      {editing !== undefined && (
        <FaqFormModal faq={editing} categories={categories} onClose={() => setEditing(undefined)} />
      )}
    </>
  )
}
