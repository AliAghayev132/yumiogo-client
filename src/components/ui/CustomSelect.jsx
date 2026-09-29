import { Select } from './Select'

/**
 * @deprecated Use <Select>. Kept for the old value-based API:
 * onChange(value), options as strings or { value, label }, `icon` = leading lucide icon,
 * size sm | md. Renders the Figma Select.
 */
export const CustomSelect = ({ value, onChange, options = [], placeholder = 'Select...', icon, label, size = 'md', className }) => (
  <Select
    value={value}
    onValueChange={onChange}
    options={options}
    placeholder={placeholder}
    clearable={false}
    leftIcon={icon}
    label={label}
    size={size === 'sm' ? 'sm' : 'md'}
    containerClassName={className}
  />
)
