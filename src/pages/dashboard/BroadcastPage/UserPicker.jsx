import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Field, IconButton, SearchInput, Skeleton, UserCell } from '@components'
import { useGetUsersQuery } from '@store/api'

const MAX_USERS = 1000 // server limit of userIds

const nameOf = (u) => [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.email || 'User'

/**
 * "Specific people" audience of the Broadcast form: search active accounts by name / e-mail
 * (GET /admin/users?search&status=active) and collect them as removable chips.
 * value: [{ _id, firstName, lastName, email, avatar }]; onChange(value); error.
 */
export const UserPicker = ({ value, onChange, error }) => {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250)
    return () => clearTimeout(t)
  }, [query])

  const { data, isFetching } = useGetUsersQuery(
    { search: debounced, status: 'active', limit: 6, sort: 'name' },
    { skip: !debounced }
  )
  const chosen = new Set(value.map((u) => String(u._id)))
  const results = (data?.data?.users || []).filter((u) => !chosen.has(String(u._id)))

  const add = (user) => {
    if (value.length >= MAX_USERS) return
    onChange([...value, user])
    setQuery('')
  }
  const remove = (id) => onChange(value.filter((u) => String(u._id) !== String(id)))

  return (
    <Field label="People" error={error} helperText={`Search by name or e-mail · up to ${MAX_USERS.toLocaleString()} people`}>
      <div className="flex flex-col gap-2">
        {value.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {value.map((u) => (
              <li
                key={u._id}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas py-0.5 pl-1 pr-0.5"
              >
                <UserCell user={u} name={nameOf(u)} size="xs" />
                <IconButton icon={X} size="xs" label={`Remove ${nameOf(u)}`} onClick={() => remove(u._id)} />
              </li>
            ))}
          </ul>
        )}
        <SearchInput
          size="sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery('')}
          placeholder="Add a person"
        />
        {debounced && (
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            {isFetching && !results.length ? (
              <div className="space-y-2 p-3">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3.5 w-32" />
              </div>
            ) : results.length ? (
              results.map((u) => (
                <button
                  key={u._id}
                  type="button"
                  onClick={() => add(u)}
                  className="flex w-full items-center px-3 py-2 text-left transition-colors hover:bg-canvas"
                >
                  <UserCell user={u} subtitle={u.email} />
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-ink-muted">No active account matches “{debounced}”.</p>
            )}
          </div>
        )}
      </div>
    </Field>
  )
}
