import { useState } from 'react'
import { Select } from '@components'
import { SUSPEND_OPTIONS } from './userMeta'

/** "Suspension length" select inside the Suspend dialog; reports the choice through onChange. */
export const SuspendLength = ({ initial, onChange }) => {
  const [value, setValue] = useState(initial)
  return (
    <Select
      label="Suspension length"
      value={value}
      options={SUSPEND_OPTIONS}
      clearable={false}
      onValueChange={(v) => {
        setValue(v)
        onChange(v)
      }}
    />
  )
}
