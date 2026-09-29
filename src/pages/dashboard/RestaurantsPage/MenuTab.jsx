import { useState } from 'react'
import { Plus, Pencil, Trash2, UtensilsCrossed, ImageOff, CircleAlert } from 'lucide-react'
import {
  Badge,
  Button,
  Checkbox,
  EmptyState,
  IconButton,
  Skeleton,
  Switch,
  OrderButtons,
  useBatchedReorder,
  useBanner,
  useConfirm,
  errorMessage,
} from '@components'
import {
  useGetAdminMenuQuery,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  useDeleteMenuCategoryMutation,
  useReorderMenuCategoriesMutation,
  useReorderMenuItemsMutation,
  useSetMenuPhotosMutation,
  useUploadMenuPhotosMutation,
} from '@store/api'
import { getImageUrl } from '@utils'
import { EditorSection } from './EditorSection'
import { PhotoGrid } from './PhotoGrid'
import { MenuItemModal } from './MenuItemModal'
import { MenuCategoryModal } from './MenuCategoryModal'

const MAX_MENU_PHOTOS = 60
const fmtPrice = (p) => `${Math.round(Number(p || 0) * 100) / 100}₼`

/** "Menu photos" gallery: upload (appends), reorder and remove — saved right away. */
const MenuPhotos = ({ restaurantId, photos = [] }) => {
  const banner = useBanner()
  const confirm = useConfirm()
  const [setMenuPhotos] = useSetMenuPhotosMutation()
  const [uploadMenuPhotos, { isLoading: uploading }] = useUploadMenuPhotosMutation()
  const items = photos.map((p) => ({ _id: p }))
  const { list, move } = useBatchedReorder(items, (ids) =>
    setMenuPhotos({ restaurantId, photos: ids })
      .unwrap()
      .catch((err) => {
        banner.error(errorMessage(err, 'Could not save the order'))
        throw err
      })
  )
  const ordered = list.map((i) => i._id)

  const upload = async (files) => {
    try {
      const formData = new FormData()
      files.slice(0, 10).forEach((f) => formData.append('files', f))
      const res = await uploadMenuPhotos({ restaurantId, formData }).unwrap()
      const n = res?.data?.urls?.length || 0
      banner.success(n === 1 ? 'Menu photo added' : `${n} menu photos added`)
    } catch (err) {
      banner.error(errorMessage(err, 'Upload failed'))
    }
  }

  const remove = async (index) => {
    const ok = await confirm({
      tone: 'danger',
      icon: Trash2,
      title: 'Remove this menu photo?',
      message: 'It is removed from the “Menu photos” gallery in the app.',
      confirmText: 'Remove',
      onConfirm: () => setMenuPhotos({ restaurantId, photos: ordered.filter((_, i) => i !== index) }).unwrap(),
    })
    if (ok) banner.show({ tone: 'success', message: 'Menu photo removed', host: 'page' })
  }

  return (
    <EditorSection
      title="Menu photos"
      description={`Photos of the printed menu, shown in the app's “Menu photos” grid. Up to ${MAX_MENU_PHOTOS}, 10 per upload.`}
    >
      <PhotoGrid
        photos={ordered}
        uploading={uploading}
        max={MAX_MENU_PHOTOS}
        onUpload={upload}
        onMove={move}
        onRemove={remove}
        emptyText="No menu photos yet."
      />
    </EditorSection>
  )
}

const ItemRow = ({ item, index, count, onMove, onEdit, onDelete, onToggle }) => (
  <div className="flex flex-wrap items-center gap-3 border-t border-line py-2.5 first:border-t-0 sm:flex-nowrap">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-subtle">
      {item.image ? (
        <img src={getImageUrl(item.image)} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <ImageOff className="h-4 w-4 text-ink-disabled" />
      )}
    </div>
    <div className="min-w-0 flex-1">
      <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-ink">
        <span className="truncate">{item.name}</span>
        {item.dietary?.map((d) => (
          <Badge key={d} tone="success" size="sm">
            {d}
          </Badge>
        ))}
      </p>
      {item.description && <p className="truncate text-xs text-ink-muted">{item.description}</p>}
    </div>
    <span className="w-16 shrink-0 text-right text-sm font-semibold text-ink">{fmtPrice(item.price)}</span>
    <div className="flex w-20 shrink-0 justify-center">
      <Switch size="sm" checked={!!item.isPopular} onChange={(v) => onToggle(item, 'isPopular', v)} label={`${item.name}: popular`} />
    </div>
    <div className="flex w-20 shrink-0 justify-center">
      <Switch size="sm" checked={item.isAvailable !== false} onChange={(v) => onToggle(item, 'isAvailable', v)} label={`${item.name}: available`} />
    </div>
    <div className="flex shrink-0 items-center">
      <OrderButtons index={index} count={count} onMove={onMove} />
      <IconButton icon={Pencil} label={`Edit ${item.name}`} onClick={() => onEdit(item)} />
      <IconButton icon={Trash2} label={`Delete ${item.name}`} tone="danger" onClick={() => onDelete(item)} />
    </div>
  </div>
)

/** One category: header (name, visibility, reorder / edit / delete) + its dishes. */
const CategoryBlock = ({ restaurantId, category, index, count, onMove, onEditCategory, onDeleteCategory, onAddItem, itemHandlers }) => {
  const banner = useBanner()
  const [reorderItems] = useReorderMenuItemsMutation()
  const { list, move } = useBatchedReorder(category.items || [], (ids) =>
    reorderItems({ restaurantId, ids })
      .unwrap()
      .catch((err) => {
        banner.error(errorMessage(err, 'Could not save the order'))
        throw err
      })
  )
  const loose = !category._id

  return (
    <section className="rounded-lg border border-line">
      <header className="flex flex-wrap items-center gap-3 border-b border-line bg-canvas px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
            {loose ? 'Other (no category)' : category.name}
            <span className="font-normal text-ink-muted">· {list.length} {list.length === 1 ? 'dish' : 'dishes'}</span>
            {category.isActive === false && (
              <Badge tone="neutral" size="sm">
                Hidden
              </Badge>
            )}
          </p>
          {category.description && <p className="truncate text-xs text-ink-muted">{category.description}</p>}
        </div>
        {!loose && (
          <div className="flex items-center">
            <OrderButtons index={index} count={count} onMove={onMove} />
            <IconButton icon={Pencil} label={`Edit ${category.name}`} onClick={() => onEditCategory(category)} />
            <IconButton icon={Trash2} label={`Delete ${category.name}`} tone="danger" onClick={() => onDeleteCategory(category)} />
          </div>
        )}
      </header>
      <div className="px-4">
        {list.length > 0 && (
          <div className="hidden items-center gap-3 pt-2 text-xs font-medium text-ink-muted sm:flex">
            <span className="w-11 shrink-0" />
            <span className="flex-1">Dish</span>
            <span className="w-16 shrink-0 text-right">Price</span>
            <span className="w-20 shrink-0 text-center">Popular</span>
            <span className="w-20 shrink-0 text-center">Available</span>
            <span className="w-[136px] shrink-0" />
          </div>
        )}
        {list.map((item, i) => (
          <ItemRow key={item._id} item={item} index={i} count={list.length} onMove={move} {...itemHandlers} />
        ))}
        <div className="py-2.5">
          <Button size="xs" variant="ghost" leftIcon={Plus} onClick={() => onAddItem(category._id || '')}>
            Add dish{loose ? '' : ` to ${category.name}`}
          </Button>
        </div>
      </div>
    </section>
  )
}

/**
 * Menu tab of the restaurant editor — menu photos plus categories and dishes (admin menu
 * endpoints). Every change is saved right away; order changes are batched.
 */
export const MenuTab = ({ restaurantId, meta, disabled }) => {
  const banner = useBanner()
  const confirm = useConfirm()
  const { data, isLoading, isError, refetch } = useGetAdminMenuQuery(restaurantId, { skip: disabled })
  const [updateItem] = useUpdateMenuItemMutation()
  const [deleteItem] = useDeleteMenuItemMutation()
  const [deleteCategory] = useDeleteMenuCategoryMutation()
  const [reorderCategories] = useReorderMenuCategoriesMutation()
  const [itemModal, setItemModal] = useState(null)
  const [categoryModal, setCategoryModal] = useState(null)

  const menu = data?.data
  const groups = menu?.categories || []
  const categories = groups.filter((c) => c._id)
  const loose = groups.find((c) => !c._id)
  const { list: orderedCategories, move: moveCategory } = useBatchedReorder(categories, (ids) =>
    reorderCategories({ restaurantId, ids })
      .unwrap()
      .catch((err) => {
        banner.error(errorMessage(err, 'Could not save the order'))
        throw err
      })
  )

  if (disabled) {
    return (
      <EditorSection title="Menu">
        <EmptyState compact icon={UtensilsCrossed} title="Restore the restaurant to edit its menu" />
      </EditorSection>
    )
  }

  const toggle = async (item, key, value) => {
    try {
      await updateItem({ id: item._id, restaurantId, [key]: value }).unwrap()
    } catch (err) {
      banner.error(errorMessage(err, 'Could not update the dish'))
    }
  }

  const removeItem = async (item) => {
    const ok = await confirm({
      tone: 'danger',
      icon: Trash2,
      title: `Delete ${item.name}?`,
      message: 'This dish will be removed from the menu.',
      confirmText: 'Delete dish',
      onConfirm: () => deleteItem({ id: item._id, restaurantId }).unwrap(),
    })
    if (ok) banner.show({ tone: 'success', message: `${item.name} deleted`, host: 'page' })
  }

  const removeCategory = async (category) => {
    const n = category.items?.length || 0
    const choice = { deleteItems: false }
    const ok = await confirm({
      tone: 'danger',
      icon: Trash2,
      title: `Delete ${category.name}?`,
      message: 'The category is removed from the menu.',
      notice: n ? `Its ${n === 1 ? 'dish moves' : `${n} dishes move`} to “Other” unless you delete ${n === 1 ? 'it' : 'them'} too.` : undefined,
      children: n ? (
        <Checkbox
          label={n === 1 ? 'Also delete its dish' : `Also delete its ${n} dishes`}
          defaultChecked={false}
          onChange={(e) => (choice.deleteItems = e.target.checked)}
        />
      ) : undefined,
      confirmText: 'Delete category',
      onConfirm: () => deleteCategory({ id: category._id, restaurantId, deleteItems: choice.deleteItems }).unwrap(),
    })
    if (ok) banner.show({ tone: 'success', message: `Category “${category.name}” deleted`, host: 'page' })
  }

  const itemHandlers = {
    onEdit: (item) => setItemModal({ item }),
    onDelete: removeItem,
    onToggle: toggle,
  }

  return (
    <div className="flex flex-col gap-6">
      <MenuPhotos restaurantId={restaurantId} photos={menu?.menuPhotos} />

      <EditorSection
        title="Menu"
        description={
          menu
            ? `${menu.itemCount ?? 0} dishes in ${categories.length} ${categories.length === 1 ? 'category' : 'categories'}. Changes are saved right away.`
            : 'Categories and dishes.'
        }
        actions={
          <>
            <Button size="sm" variant="outline" leftIcon={Plus} onClick={() => setCategoryModal({})}>
              Add category
            </Button>
            <Button size="sm" leftIcon={Plus} onClick={() => setItemModal({ category: categories[0]?._id || '' })}>
              Add dish
            </Button>
          </>
        }
      >
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : isError ? (
          <EmptyState
            compact
            icon={CircleAlert}
            title="Could not load the menu"
            action={
              <Button size="sm" variant="outline" onClick={refetch}>
                Retry
              </Button>
            }
          />
        ) : !groups.length ? (
          <EmptyState
            compact
            icon={UtensilsCrossed}
            title="No menu yet"
            description="Add categories (e.g. Starters, Mains, Desserts) and their dishes."
            action={
              <Button size="sm" leftIcon={Plus} onClick={() => setCategoryModal({})}>
                Add category
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            {orderedCategories.map((c, i) => (
              <CategoryBlock
                key={c._id}
                restaurantId={restaurantId}
                category={c}
                index={i}
                count={orderedCategories.length}
                onMove={moveCategory}
                onEditCategory={(category) => setCategoryModal({ category })}
                onDeleteCategory={removeCategory}
                onAddItem={(category) => setItemModal({ category })}
                itemHandlers={itemHandlers}
              />
            ))}
            {loose && (
              <CategoryBlock
                restaurantId={restaurantId}
                category={loose}
                onAddItem={() => setItemModal({ category: '' })}
                itemHandlers={itemHandlers}
              />
            )}
          </div>
        )}
      </EditorSection>

      <MenuItemModal
        state={itemModal}
        onClose={() => setItemModal(null)}
        restaurantId={restaurantId}
        categories={categories}
        dietaryOptions={meta?.dietary || []}
      />
      <MenuCategoryModal state={categoryModal} onClose={() => setCategoryModal(null)} restaurantId={restaurantId} />
    </div>
  )
}
