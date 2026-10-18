import { useState } from 'react'
import { Plus, Pencil, Trash2, EyeOff, GalleryHorizontalEnd, CircleAlert } from 'lucide-react'
import {
  TableCard,
  Table,
  Button,
  IconButton,
  Switch,
  OrderButtons,
  TranslationBadge,
  documentTranslationStatus,
  useBatchedReorder,
  useBanner,
  useConfirm,
  errorMessage,
} from '@components'
import {
  useGetOnboardingSlidesQuery,
  useUpdateOnboardingSlideMutation,
  useDeleteOnboardingSlideMutation,
  useReorderOnboardingSlidesMutation,
} from '@store/api'
import { SlideFormModal } from './SlideFormModal'
import { SlidePreview } from './SlidePreview'

const COLUMNS = 5

/**
 * Onboarding — the carousel shown the first time the app opens, in this
 * order. Each slide shows its uploaded image, or its Ionicons icon.
 */
export const OnboardingPage = () => {
  const [editing, setEditing] = useState(undefined) // undefined = closed, null = create, obj = edit
  const { data, isLoading, isError, refetch } = useGetOnboardingSlidesQuery()
  const [updateSlide] = useUpdateOnboardingSlideMutation()
  const [deleteSlide] = useDeleteOnboardingSlideMutation()
  const [reorderSlides] = useReorderOnboardingSlidesMutation()
  const banner = useBanner()
  const confirm = useConfirm()

  // Moves show at once; quick clicks are saved together in one request.
  const { list: slides, move } = useBatchedReorder(data?.data?.slides || [], async (ids) => {
    try {
      await reorderSlides({ ids }).unwrap()
    } catch (err) {
      banner.error(errorMessage(err, 'Could not save the new order'))
      throw err
    }
  })
  const activeCount = slides.filter((s) => s.isActive).length

  const toggleActive = async (slide) => {
    if (slide.isActive && activeCount === 1) {
      const ok = await confirm({
        tone: 'warning',
        icon: EyeOff,
        title: 'Hide the last slide?',
        message: 'With no active slides the app keeps showing its built-in slides.',
        confirmText: 'Hide slide',
      })
      if (!ok) return
    }
    try {
      await updateSlide({ id: slide._id, isActive: !slide.isActive }).unwrap()
      banner.success(slide.isActive ? 'Slide hidden' : 'Slide shown')
    } catch (err) {
      banner.error(errorMessage(err, 'Update failed'))
    }
  }

  const remove = async (slide) => {
    const ok = await confirm({
      tone: 'danger',
      icon: Trash2,
      title: 'Delete slide?',
      message: `“${slide.title}” will be removed from the onboarding.`,
      confirmText: 'Delete slide',
    })
    if (!ok) return
    try {
      await deleteSlide(slide._id).unwrap()
      banner.success('Slide deleted')
    } catch (err) {
      banner.error(errorMessage(err, 'Delete failed'))
    }
  }

  return (
    <>
      <TableCard
        title="Onboarding slides"
        subtitle={
          isLoading
            ? 'Shown once, the first time the app opens.'
            : `Shown once, the first time the app opens. ${activeCount} of ${slides.length} slide${slides.length === 1 ? '' : 's'} active.`
        }
        actions={
          <Button size="sm" leftIcon={Plus} onClick={() => setEditing(null)}>
            Add slide
          </Button>
        }
        pagination={{
          page: 1,
          total: slides.length,
          limit: Math.max(slides.length, 1),
          onPageChange: () => {},
          itemLabel: slides.length === 1 ? 'slide' : 'slides',
        }}
      >
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head width="6rem">Order</Table.Head>
              <Table.Head width="6rem">Visual</Table.Head>
              <Table.Head>Slide</Table.Head>
              <Table.Head>Active</Table.Head>
              <Table.Head align="right">Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading ? (
              <Table.Loading rows={4} cols={COLUMNS} avatar={false} />
            ) : (
              slides.map((slide, index) => (
                <Table.Row key={slide._id}>
                  <Table.Cell>
                    <OrderButtons index={index} count={slides.length} onMove={move} />
                  </Table.Cell>
                  <Table.Cell>
                    <SlidePreview slide={slide} compact />
                  </Table.Cell>
                  <Table.Cell className="max-w-lg">
                    <p className={slide.isActive ? 'text-ink' : 'text-ink-muted'}>
                      {slide.title}
                      <TranslationBadge className="ml-1.5" status={documentTranslationStatus(slide, ['title', 'subtitle'])} />
                    </p>
                    {slide.subtitle && (
                      <p className="mt-0.5 line-clamp-2 text-xs font-normal text-ink-muted">{slide.subtitle}</p>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Switch
                      size="sm"
                      checked={slide.isActive}
                      onChange={() => toggleActive(slide)}
                      label={slide.isActive ? 'Hide this slide' : 'Show this slide'}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <Table.Actions>
                      <IconButton icon={Pencil} label="Edit" onClick={() => setEditing(slide)} />
                      <IconButton icon={Trash2} label="Delete" tone="danger" onClick={() => remove(slide)} />
                    </Table.Actions>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
            {!isLoading &&
              !slides.length &&
              (isError ? (
                <Table.Empty
                  colSpan={COLUMNS}
                  icon={CircleAlert}
                  title="Could not load the slides"
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
                  icon={GalleryHorizontalEnd}
                  title="No slides yet"
                  description="The app shows its built-in slides until you add one."
                />
              ))}
          </Table.Body>
        </Table>
      </TableCard>

      {editing !== undefined && <SlideFormModal slide={editing} onClose={() => setEditing(undefined)} />}
    </>
  )
}
