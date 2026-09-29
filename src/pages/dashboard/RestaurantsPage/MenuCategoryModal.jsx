import { useState } from 'react'
import { FolderPlus, Pencil } from 'lucide-react'
import { Modal, Input, Textarea, Button, SwitchRow, useBanner, errorMessage } from '@components'
import { useCreateMenuCategoryMutation, useUpdateMenuCategoryMutation } from '@store/api'

const CategoryForm = ({ restaurantId, category, onClose }) => {
  const banner = useBanner()
  const [name, setName] = useState(category?.name || '')
  const [description, setDescription] = useState(category?.description || '')
  const [isActive, setIsActive] = useState(category ? category.isActive !== false : true)
  const [error, setError] = useState('')
  const [createCategory, { isLoading: creating }] = useCreateMenuCategoryMutation()
  const [updateCategory, { isLoading: updating }] = useUpdateMenuCategoryMutation()

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    const body = { restaurantId, name: name.trim(), description: description.trim(), isActive }
    try {
      if (category) await updateCategory({ id: category._id, ...body }).unwrap()
      else await createCategory(body).unwrap()
      banner.success(category ? 'Category updated' : `Category “${body.name}” added`)
      onClose()
    } catch (err) {
      banner.error(errorMessage(err, 'Could not save the category'))
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex flex-col gap-3">
        <Input
          label="Category name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
          error={error}
          maxLength={80}
          placeholder="e.g. Appetizers and salads"
        />
        <Textarea label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={300} showCount />
        <SwitchRow
          className="-mx-3"
          label="Visible in the app"
          description="Hidden categories and their dishes are not shown in the app menu."
          checked={isActive}
          onChange={setIsActive}
        />
      </div>
      <Modal.Footer>
        <Button variant="outline" onClick={onClose} disabled={creating || updating}>
          Cancel
        </Button>
        <Button type="submit" loading={creating || updating}>
          {category ? 'Save category' : 'Add category'}
        </Button>
      </Modal.Footer>
    </form>
  )
}

/** Add / edit a menu category (chip row of "Explore full menu"). `state` = null | { category? }. */
export const MenuCategoryModal = ({ state, onClose, restaurantId }) => (
  <Modal
    isOpen={!!state}
    onClose={onClose}
    icon={state?.category ? Pencil : FolderPlus}
    tone="orange"
    title={state?.category ? 'Edit category' : 'Add category'}
    description="Categories group the dishes of the menu, in the order shown here."
  >
    {state && (
      <CategoryForm key={state.category?._id || 'new'} restaurantId={restaurantId} category={state.category} onClose={onClose} />
    )}
  </Modal>
)
