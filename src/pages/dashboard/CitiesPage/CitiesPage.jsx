import { useState } from 'react'
import { Plus, Pencil, Trash2, Star, ExternalLink, MapPin, CircleAlert } from 'lucide-react'
import { clsx } from 'clsx'
import {
  TableCard,
  Table,
  Badge,
  StatusPill,
  Button,
  IconButton,
  OrderButtons,
  useBatchedReorder,
  useHeaderSearch,
  useBanner,
  useConfirm,
  errorMessage,
} from '@components'
import {
  useGetAdminCitiesQuery,
  useUpdateCityMutation,
  useDeleteCityMutation,
  useReorderCitiesMutation,
} from '@store/api'
import { CityFormModal } from './CityFormModal'

// Same rule as the server (City.getDefault): the flagged active city, else
// the first active city in list order.
const effectiveDefault = (cities) =>
  cities.find((c) => c.isDefault && c.isActive) || cities.find((c) => c.isActive) || null

const formatCoord = (n) => (typeof n === 'number' ? n.toFixed(4) : '—')

const COLUMNS = 7

/**
 * Cities restaurants can be listed in (/dashboard/cities): reorder, default
 * city, create / edit / delete. The header search filters the list; the order
 * can only be changed while it is not filtered.
 */
export const CitiesPage = () => {
  const [editing, setEditing] = useState(undefined) // undefined = closed, null = create, obj = edit
  const [defaultingId, setDefaultingId] = useState(null)
  const search = useHeaderSearch({ placeholder: 'Search cities' })
  const { data, isLoading, isError, refetch } = useGetAdminCitiesQuery()
  const [updateCity] = useUpdateCityMutation()
  const [deleteCity] = useDeleteCityMutation()
  const [reorderCities] = useReorderCitiesMutation()
  const banner = useBanner()
  const confirm = useConfirm()

  const cities = data?.data?.cities
  const { list, move } = useBatchedReorder(cities || [], async (ids) => {
    try {
      await reorderCities({ ids }).unwrap()
    } catch (err) {
      banner.error(errorMessage(err, 'Could not save the new order'))
      throw err
    }
  })
  const defaultCity = effectiveDefault(list)

  const term = search.toLowerCase()
  const visible = term
    ? list.filter((c) =>
        [c.name, c.label, c.country].some((value) => (value || '').toLowerCase().includes(term))
      )
    : list
  const filtering = !!term

  const makeDefault = async (city) => {
    setDefaultingId(city._id)
    try {
      await updateCity({ id: city._id, isDefault: true }).unwrap()
      banner.success(`${city.name} is now the default city`)
    } catch (err) {
      banner.error(errorMessage(err, 'Update failed'))
    } finally {
      setDefaultingId(null)
    }
  }

  const remove = async (city) => {
    const count = city.usageCount || 0
    const ok = await confirm({
      tone: 'danger',
      icon: Trash2,
      title: `Delete ${city.name}?`,
      message: `${city.label || city.name} will be removed from the app and the restaurant form.`,
      notice: count ? `${count} restaurant${count === 1 ? '' : 's'} still use this city.` : undefined,
      confirmText: 'Delete city',
    })
    if (!ok) return
    try {
      await deleteCity(city._id).unwrap()
      banner.success('City deleted')
    } catch (err) {
      // e.g. 400 "3 restaurants still use Baku. Move them to another city first."
      banner.error(errorMessage(err, 'Delete failed'))
    }
  }

  const empty = isError ? (
    <Table.Empty
      colSpan={COLUMNS}
      icon={CircleAlert}
      title="Could not load cities"
      description="Check your connection and try again."
      action={
        <Button size="sm" variant="outline" onClick={refetch}>
          Try again
        </Button>
      }
    />
  ) : list.length ? (
    <Table.Empty colSpan={COLUMNS} title="No cities match your search" description="Try another name or country." />
  ) : (
    <Table.Empty
      colSpan={COLUMNS}
      icon={MapPin}
      title="No cities yet"
      description="Add the first city restaurants can be listed in."
    />
  )

  return (
    <>
      <TableCard
        title="All cities"
        subtitle={
          filtering && list.length > 1
            ? 'Clear the search to change the order.'
            : "Cities shown in the app's location picker and offered in the restaurant form. The default city is where the app starts before the user picks a location."
        }
        actions={
          <Button size="sm" leftIcon={Plus} onClick={() => setEditing(null)}>
            Add city
          </Button>
        }
        pagination={{
          page: 1,
          total: visible.length,
          limit: Math.max(visible.length, 1),
          onPageChange: () => {},
          itemLabel: visible.length === 1 ? 'city' : 'cities',
        }}
      >
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head width="6rem">Order</Table.Head>
              <Table.Head>City</Table.Head>
              <Table.Head>Country</Table.Head>
              <Table.Head>Centre</Table.Head>
              <Table.Head align="center">Restaurants</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head align="right">Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading ? (
              <Table.Loading rows={6} cols={COLUMNS} avatar={false} />
            ) : (
              visible.map((city) => {
                const index = list.indexOf(city)
                const isDefault = defaultCity?._id === city._id
                return (
                  <Table.Row key={city._id}>
                    <Table.Cell>
                      <OrderButtons index={index} count={list.length} onMove={move} disabled={filtering} />
                    </Table.Cell>
                    <Table.Cell>
                      <p className={city.isActive ? 'text-ink' : 'text-ink-muted'}>{city.name}</p>
                      <p className="mt-0.5 text-xs font-normal text-ink-muted">{city.label}</p>
                    </Table.Cell>
                    <Table.Cell muted nowrap>
                      {city.country || '—'}
                    </Table.Cell>
                    <Table.Cell nowrap>
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${city.latitude}&mlon=${city.longitude}#map=12/${city.latitude}/${city.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs font-normal text-ink-tertiary transition-colors hover:text-brand-hover"
                        title="Open on the map"
                      >
                        {formatCoord(city.latitude)}, {formatCoord(city.longitude)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Table.Cell>
                    <Table.Cell align="center">{city.usageCount ?? 0}</Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusPill status={city.isActive ? 'active' : 'inactive'} />
                        {isDefault && (
                          <Badge tone="info" size="sm">
                            {city.isDefault ? 'Default' : 'Default (first active)'}
                          </Badge>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Table.Actions>
                        <IconButton
                          icon={
                            <Star className={clsx('h-4 w-4', city.isDefault && 'fill-star text-star')} strokeWidth={2} />
                          }
                          label={city.isDefault ? 'Default city' : 'Make default city'}
                          onClick={() => makeDefault(city)}
                          disabled={!city.isActive || city.isDefault || defaultingId === city._id}
                          // The current default keeps a full-colour star.
                          className={city.isDefault ? 'disabled:opacity-100' : undefined}
                        />
                        <IconButton icon={Pencil} label="Edit" onClick={() => setEditing(city)} />
                        <IconButton icon={Trash2} label="Delete" tone="danger" onClick={() => remove(city)} />
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
        <CityFormModal
          city={editing}
          defaultCountry={defaultCity?.country || ''}
          onClose={() => setEditing(undefined)}
        />
      )}
    </>
  )
}
