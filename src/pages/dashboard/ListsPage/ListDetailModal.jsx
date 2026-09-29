import { Link } from 'react-router'
import { Bookmark, ExternalLink, Store, Trash2 } from 'lucide-react'
import {
  Badge,
  Banner,
  Button,
  EmptyState,
  Modal,
  Skeleton,
  StatusPill,
  UserCell,
  formatNumber,
  timeAgo,
} from '@components'
import { useGetAdminListQuery } from '@store/api'
import { getImageUrl } from '@utils'
import { PRIVACY, ownerName, shareUrl } from './listMeta'
import { useListActions } from './useListActions'

const Section = ({ title, action, children }) => (
  <section className="rounded-xl border border-line bg-surface p-4">
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="text-sm font-bold leading-[18px] text-ink">{title}</h3>
      {action}
    </div>
    {children}
  </section>
)

const Thumb = ({ src }) =>
  src ? (
    <img src={getImageUrl(src)} alt="" className="h-10 w-10 shrink-0 rounded-lg border border-line object-cover" />
  ) : (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-subtle text-ink-muted">
      <Store className="h-4 w-4" />
    </span>
  )

/**
 * List detail (a row's View, or ?list=<id> from the Reports / user pages): owner, privacy and
 * counters, the saved restaurants, collaborators, the reports about the list and "Remove list".
 */
export const ListDetailModal = ({ listId, onClose }) => {
  const { data, isLoading, isError, error, refetch } = useGetAdminListQuery(listId, { skip: !listId })
  const actions = useListActions()
  const list = data?.data?.list
  const reports = data?.data?.reports || []
  const privacy = list && (PRIVACY[list.privacy] || PRIVACY.private)
  const link = shareUrl(list)

  const removeAndClose = async () => {
    if (await actions.remove(list)) onClose()
  }

  const footer = (
    <>
      {list && !list.isDeleted && (
        <Button variant="soft-danger" leftIcon={Trash2} onClick={removeAndClose} className="mr-auto">
          Remove list
        </Button>
      )}
      <Button variant="outline" onClick={onClose}>
        Close
      </Button>
    </>
  )

  return (
    <Modal
      isOpen={!!listId}
      onClose={onClose}
      size="lg"
      icon={Bookmark}
      tone="pink"
      title={list?.name || 'List'}
      description={
        list && (
          <span className="inline-flex flex-wrap items-center gap-2">
            <Badge tone={privacy.tone} size="sm">
              {privacy.label}
            </Badge>
            {list.isDefault && (
              <Badge tone="neutral" size="sm">
                Default list
              </Badge>
            )}
            {list.isDeleted && (
              <Badge tone="error" size="sm">
                Removed
              </Badge>
            )}
            <span>
              {formatNumber(list.itemCount)} {list.itemCount === 1 ? 'restaurant' : 'restaurants'} ·{' '}
              {formatNumber(list.saveCount)} {list.saveCount === 1 ? 'save' : 'saves'} · updated {timeAgo(list.updatedAt)}
            </span>
          </span>
        )
      }
      footer={footer}
    >
      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : isError || !list ? (
        <EmptyState
          title={error?.status === 404 ? 'List not found' : 'Could not load the list'}
          action={
            error?.status !== 404 && (
              <Button size="sm" variant="outline" onClick={refetch}>
                Try again
              </Button>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {list.isDeleted && (
            <Banner tone="info">
              Removed{list.deletedAt ? ` ${timeAgo(list.deletedAt)}` : ''}. It is hidden from the app and its share link no
              longer works.
            </Banner>
          )}

          <Section
            title="Owner"
            action={
              list.owner && (
                <Link
                  to={`/dashboard/users/${list.owner._id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-hover hover:underline"
                >
                  Open profile <ExternalLink className="h-3 w-3" />
                </Link>
              )
            }
          >
            {list.owner ? (
              <UserCell user={list.owner} subtitle={list.owner.email} />
            ) : (
              <p className="text-sm text-ink-muted">{ownerName(null)}</p>
            )}
            {link && !list.isDeleted && (
              <p className="mt-3 text-xs text-ink-muted">
                Share link:{' '}
                <a href={link} target="_blank" rel="noreferrer" className="font-semibold text-brand-hover hover:underline">
                  {link}
                </a>
              </p>
            )}
          </Section>

          <Section title={`Restaurants (${formatNumber(list.items?.length || 0)})`}>
            {list.items?.length ? (
              <ul className="-my-1 max-h-72 overflow-y-auto scrollbar-thin">
                {list.items.map((item, i) => {
                  const r = item.restaurant
                  return (
                    <li key={r?._id || i} className="flex items-center gap-3 py-1.5">
                      <Thumb src={r?.coverImage} />
                      <div className="min-w-0 flex-1">
                        {r ? (
                          <Link
                            to={`/dashboard/restaurants/${r._id}`}
                            className="block truncate text-sm font-semibold text-ink hover:underline"
                          >
                            {r.name}
                          </Link>
                        ) : (
                          <span className="text-sm text-ink-muted">Deleted restaurant</span>
                        )}
                        <p className="truncate text-xs text-ink-muted">
                          {[r?.address, r?.city].filter(Boolean).join(', ') || '—'}
                          {item.savedAt ? ` · saved ${timeAgo(item.savedAt)}` : ''}
                        </p>
                      </div>
                      {r?.isDeleted ? (
                        <Badge tone="error" size="sm">
                          In Trash
                        </Badge>
                      ) : r?.status && r.status !== 'active' ? (
                        <StatusPill status={r.status} entity="restaurant" />
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">No restaurants in this list.</p>
            )}
          </Section>

          {list.collaborators?.length > 0 && (
            <Section title={`Collaborators (${list.collaborators.length})`}>
              <ul className="-my-1 flex flex-col">
                {list.collaborators.map((c, i) => (
                  <li key={c.user?._id || i} className="flex items-center justify-between gap-3 py-1.5">
                    {c.user ? (
                      <UserCell user={c.user} />
                    ) : (
                      <span className="text-sm text-ink-muted">Deleted user</span>
                    )}
                    {c.role && (
                      <Badge tone="neutral" size="sm">
                        {c.role.charAt(0).toUpperCase() + c.role.slice(1)}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title={`Reports about this list (${reports.length})`}>
            {reports.length ? (
              <ul className="-my-1">
                {reports.map((r) => (
                  <li key={r._id} className="flex flex-wrap items-center gap-2 py-1.5">
                    <Link to={`/dashboard/reports?report=${r._id}`} className="text-sm font-semibold text-ink hover:underline">
                      Report #{r.number}
                    </Link>
                    <span className="min-w-0 flex-1 truncate text-sm text-ink-secondary">
                      {r.reason} · {r.reporter ? ownerName(r.reporter) : 'System'} · {timeAgo(r.createdAt)}
                    </span>
                    <StatusPill status={r.status} entity="report" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">Nobody has reported this list.</p>
            )}
          </Section>
        </div>
      )}
    </Modal>
  )
}
