import { useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { Modal, Input, Textarea, Select, SwitchRow, Button, useBanner, errorMessage } from '@components'
import { useCreateFaqMutation, useUpdateFaqMutation } from '@store/api'
import { AUDIENCES } from './audiences'

/** Create / edit one FAQ. `faq` null = create. */
export const FaqFormModal = ({ faq, categories = [], onClose }) => {
  const isEdit = !!faq
  const [createFaq, { isLoading: creating }] = useCreateFaqMutation()
  const [updateFaq, { isLoading: updating }] = useUpdateFaqMutation()
  const banner = useBanner()
  const [form, setForm] = useState({
    question: faq?.question || '',
    answer: faq?.answer || '',
    category: faq?.category || '',
    audience: faq?.audience || 'both',
    isActive: faq?.isActive ?? true,
  })
  const [errors, setErrors] = useState({})

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((errs) => ({ ...errs, [key]: undefined }))
  }

  const submit = async () => {
    const payload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      category: form.category.trim(),
      audience: form.audience,
      isActive: form.isActive,
    }
    const nextErrors = {
      question: payload.question ? undefined : 'Question is required',
      answer: payload.answer ? undefined : 'Answer is required',
    }
    if (nextErrors.question || nextErrors.answer) return setErrors(nextErrors)

    try {
      if (isEdit) await updateFaq({ id: faq._id, ...payload }).unwrap()
      else await createFaq(payload).unwrap()
      banner.success(isEdit ? 'FAQ updated' : 'FAQ added')
      onClose()
    } catch (err) {
      banner.error(errorMessage(err, 'Save failed'))
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      icon={isEdit ? Pencil : Plus}
      tone="orange"
      title={isEdit ? 'Edit FAQ' : 'Add FAQ'}
      description="Shown on the app's Help & support screen and / or the website FAQ."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={creating || updating}>
            {isEdit ? 'Save changes' : 'Add FAQ'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Input
          label="Question"
          value={form.question}
          onChange={set('question')}
          placeholder="How do ratings work?"
          error={errors.question}
          autoFocus
        />
        <Textarea
          label="Answer"
          value={form.answer}
          onChange={set('answer')}
          rows={6}
          placeholder="Write the answer people will read in the app / on the website."
          error={errors.answer}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Input
              label="Category"
              value={form.category}
              onChange={set('category')}
              placeholder="Optional, e.g. Account"
              list="faq-categories"
              helperText="Optional grouping label."
            />
            <datalist id="faq-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <Select
            label="Shown in"
            value={form.audience}
            onChange={set('audience')}
            options={AUDIENCES}
            placeholder="Choose where it appears"
            clearable={false}
          />
        </div>
        <div className="rounded-lg border border-line bg-surface">
          <SwitchRow
            label="Active"
            description="Hidden FAQs stay here but are not shown to users."
            checked={form.isActive}
            onChange={(isActive) => setForm((f) => ({ ...f, isActive }))}
          />
        </div>
      </div>
    </Modal>
  )
}
