import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Store, X } from 'lucide-react'
import { clsx } from 'clsx'
import { Button, IconButton, Menu, MenuDivider, MenuItem, Popover, SearchInput, Skeleton } from '@components'
import { useSearchReviewRestaurantsQuery } from '@store/api'

/**
 * Restaurant filter for the review table: outlined card-header button that opens a
 * searchable restaurant list (GET /admin/restaurants?search=, 20 per query).
 * value: { _id, name } | null; onChange(value | null).
 */
export const RestaurantFilter = ({ value, onChange }) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const anchorRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250)
    return () => clearTimeout(t)
  }, [query])

  const { data, isFetching, isError } = useSearchReviewRestaurantsQuery({ search: debounced }, { skip: !open })
  const restaurants = data?.data?.restaurants || []

  const pick = (restaurant) => {
    onChange(restaurant ? { _id: restaurant._id, name: restaurant.name } : null)
    setOpen(false)
  }

  return (
    <>
      <div className="inline-flex items-center">
        <Button
          ref={anchorRef}
          size="sm"
          variant="outline"
          leftIcon={Store}
          rightIcon={ChevronDown}
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={clsx('max-w-[220px]', value && 'rounded-r-none border-brand/60 bg-brand-soft')}
        >
          <span className="truncate">{value ? value.name : 'All restaurants'}</span>
        </Button>
        {value && (
          <IconButton
            icon={X}
            label="Clear restaurant filter"
            onClick={() => pick(null)}
            className="h-8! w-8! rounded-l-none border border-l-0 border-brand/60 bg-brand-soft"
          />
        )}
      </div>
      <Popover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} placement="bottom-end" style={{ width: 280 }}>
        <div className="p-2">
          <SearchInput
            size="sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={() => setQuery('')}
            placeholder="Search restaurants"
            autoFocus
          />
        </div>
        <Menu role="listbox" className="max-h-72">
          <MenuItem role="option" selected={!value} showCheck onSelect={() => pick(null)}>
            All restaurants
          </MenuItem>
          <MenuDivider />
          {isFetching && !restaurants.length ? (
            <div className="space-y-2 px-4 py-2">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3.5 w-36" />
            </div>
          ) : isError ? (
            <p className="px-4 py-3 text-sm text-error">Could not load restaurants.</p>
          ) : restaurants.length ? (
            restaurants.map((r) => (
              <MenuItem
                key={r._id}
                role="option"
                selected={value?._id === r._id}
                showCheck
                description={r.status && r.status !== 'active' ? `Status: ${r.status}` : r.address || undefined}
                onSelect={() => pick(r)}
              >
                {r.name}
              </MenuItem>
            ))
          ) : (
            <p className="px-4 py-3 text-sm text-ink-muted">No restaurants match “{debounced}”.</p>
          )}
        </Menu>
      </Popover>
    </>
  )
}
