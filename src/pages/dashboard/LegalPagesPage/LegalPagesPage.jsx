import { useMemo, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, FileText, Smartphone, CircleAlert } from 'lucide-react'
import { clsx } from 'clsx'
import {
  TableCard,
  Table,
  Card,
  StatusPill,
  Button,
  IconButton,
  Skeleton,
  SkeletonText,
  useBanner,
  useConfirm,
  errorMessage,
} from '@components'
import { useGetContentPagesQuery, useDeleteContentPageMutation } from '@store/api'
import { formatRelative } from '@utils'
import { PageEditor } from './PageEditor'
import { APP_SLUGS, deletePageConfirm } from './pageForm'

const NEW = '__new__'
const COLUMNS = 4

/**
 * Legal pages — Terms / Privacy / Cookies (and any other page addressed by
 * slug) rendered by the app's Legal screen. Pick a page in the list, edit it
 * in the editor below; "New page" creates another slug.
 */
export const LegalPagesPage = () => {
  const { data, isLoading, isFetching, isError, refetch } = useGetContentPagesQuery()
  const [deletePage] = useDeleteContentPageMutation()
  const [selected, setSelected] = useState(null) // slug, NEW, or null = first page
  const dirtyRef = useRef(false)
  const editorRef = useRef(null)
  const banner = useBanner()
  const confirm = useConfirm()

  const pages = useMemo(() => data?.data?.pages || [], [data])
  const slugs = useMemo(() => pages.map((p) => p.slug), [pages])

  const current = selected === NEW ? null : pages.find((p) => p.slug === selected) || null
  // A slug that is not in the list yet (just created, list still refetching).
  const waiting = selected && selected !== NEW && !current && isFetching
  const active = selected === NEW ? null : current || (waiting ? null : pages[0] || null)
  const creating = selected === NEW || (!isLoading && !isError && !pages.length && !waiting)

  // Bring the editor into view when it starts below the fold.
  const revealEditor = () =>
    requestAnimationFrame(() => {
      const node = editorRef.current
      if (node && node.getBoundingClientRect().top > window.innerHeight - 160) {
        node.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })

  const select = async (slug) => {
    if (slug === (active?.slug ?? (creating ? NEW : null))) {
      revealEditor()
      return
    }
    if (dirtyRef.current) {
      const ok = await confirm({
        tone: 'warning',
        title: 'Discard unsaved changes?',
        message: 'Your edits to this page have not been saved.',
        confirmText: 'Discard',
        confirmVariant: 'danger',
      })
      if (!ok) return
    }
    setSelected(slug)
    revealEditor()
  }

  const remove = async (page) => {
    const ok = await confirm(deletePageConfirm(page))
    if (!ok) return
    try {
      await deletePage(page.slug).unwrap()
      banner.success('Page deleted')
      if (active?.slug === page.slug) setSelected(null)
    } catch (err) {
      banner.error(errorMessage(err, 'Delete failed'))
    }
  }

  return (
    <div className="space-y-6">
      <TableCard
        title="Legal pages"
        subtitle="Terms, privacy and cookies are opened from the app's Settings screen, so keep their slugs."
        actions={
          <Button size="sm" leftIcon={Plus} onClick={() => select(NEW)}>
            New page
          </Button>
        }
        pagination={{
          page: 1,
          total: pages.length,
          limit: Math.max(pages.length, 1),
          onPageChange: () => {},
          itemLabel: pages.length === 1 ? 'page' : 'pages',
        }}
      >
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>Page</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head>Updated</Table.Head>
              <Table.Head align="right">Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading ? (
              <Table.Loading rows={3} cols={COLUMNS} avatar={false} />
            ) : (
              pages.map((page) => {
                const isActive = !creating && active?.slug === page.slug
                return (
                  <Table.Row key={page.slug} selected={isActive} onClick={() => select(page.slug)}>
                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        <FileText className={clsx('h-4 w-4 shrink-0', isActive ? 'text-brand' : 'text-ink-muted')} />
                        <div className="min-w-0">
                          <p className="truncate">{page.title}</p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs font-normal text-ink-muted">
                            <code className="font-mono">/{page.slug}</code>
                            {APP_SLUGS.includes(page.slug) && (
                              <span title="Linked from the app's Settings screen" className="inline-flex">
                                <Smartphone className="h-3 w-3" />
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <StatusPill status={page.isPublished ? 'published' : 'draft'} />
                    </Table.Cell>
                    <Table.Cell muted nowrap>
                      {page.updatedAt ? formatRelative(page.updatedAt) : '—'}
                    </Table.Cell>
                    <Table.Cell>
                      {/* Row clicks select the page; the buttons handle their own clicks. */}
                      <Table.Actions>
                        <IconButton
                          icon={Pencil}
                          label="Edit"
                          onClick={(e) => {
                            e.stopPropagation()
                            select(page.slug)
                          }}
                        />
                        <IconButton
                          icon={Trash2}
                          label="Delete"
                          tone="danger"
                          onClick={(e) => {
                            e.stopPropagation()
                            remove(page)
                          }}
                        />
                      </Table.Actions>
                    </Table.Cell>
                  </Table.Row>
                )
              })
            )}
            {!isLoading &&
              !pages.length &&
              (isError ? (
                <Table.Empty
                  colSpan={COLUMNS}
                  icon={CircleAlert}
                  title="Could not load the pages"
                  description="Check your connection and try again."
                  action={
                    <Button size="sm" variant="outline" onClick={refetch}>
                      Try again
                    </Button>
                  }
                />
              ) : (
                <Table.Empty
                  colSpan={COLUMNS}
                  icon={FileText}
                  title="No pages yet"
                  description="Create the first page in the editor below."
                />
              ))}
          </Table.Body>
        </Table>
      </TableCard>

      {/* Editor */}
      <div ref={editorRef} className="min-w-0 scroll-mt-6">
        {isLoading || waiting ? (
          <Card padding="chart">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="mt-2 h-3 w-64" />
            <SkeletonText lines={6} className="mt-6" />
          </Card>
        ) : creating ? (
          <PageEditor
            key={NEW}
            page={null}
            existingSlugs={slugs}
            dirtyRef={dirtyRef}
            onSaved={(slug) => setSelected(slug)}
            onDeleted={() => setSelected(null)}
          />
        ) : (
          active && (
            <PageEditor
              key={`${active.slug}:${active.updatedAt}`}
              page={active}
              existingSlugs={slugs}
              dirtyRef={dirtyRef}
              onSaved={(slug) => setSelected(slug)}
              onDeleted={() => setSelected(null)}
            />
          )
        )}
      </div>
    </div>
  )
}
