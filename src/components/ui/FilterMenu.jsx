import { useRef, useState } from 'react'
import { Button } from './Button'
import { Popover } from './Popover'
import { Menu, MenuDivider, MenuItem, MenuLabel } from './Menu'

const normalise = (options) => options.map((o) => (typeof o === 'object' ? o : { value: o, label: String(o) }))

/**
 * FilterMenu — the Figma "Filter" card-header button (outlined, 32px) opening a grouped menu
 * (Figma two-group "Theme" menu) with one single-choice group per filter. Choosing an option
 * applies it immediately; each group starts with "All" (empty value).
 *
 *   <FilterMenu
 *     filters={[
 *       { key: 'status', label: 'Status', options: [{ value: 'active', label: 'Active' }, …] },
 *       { key: 'role', label: 'Role', options: ['user', 'admin'] },
 *     ]}
 *     value={{ status, role }}
 *     onChange={(next) => { setFilters(next); setPage(1) }}
 *   />
 * The button is text-only like the Figma one and shows the number of active filters;
 * "Clear filters" resets every group.
 */
export const FilterMenu = ({ filters = [], value = {}, onChange, label = 'Filter', allLabel = 'All', width = 240 }) => {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef(null)
  const active = filters.filter((f) => value[f.key] !== undefined && value[f.key] !== '' && value[f.key] !== null).length

  const set = (key, v) => onChange?.({ ...value, [key]: v })
  const reset = () => onChange?.(Object.fromEntries(filters.map((f) => [f.key, ''])))

  return (
    <>
      <Button
        ref={anchorRef}
        size="sm"
        variant="outline"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={active ? 'border-brand/60 bg-brand-soft' : undefined}
      >
        {label}
        {active > 0 && (
          <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-medium text-canvas">
            {active}
          </span>
        )}
      </Button>
      <Popover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} placement="bottom-end" style={{ width }}>
        <Menu className="max-h-96">
          {filters.map((f, i) => {
            const current = value[f.key] ?? ''
            return (
              <div key={f.key} role="group" aria-label={f.label}>
                {i > 0 && <MenuDivider />}
                <MenuLabel>{f.label}</MenuLabel>
                {[{ value: '', label: f.allLabel || allLabel }, ...normalise(f.options || [])].map((o) => (
                  <MenuItem
                    key={String(o.value)}
                    role="menuitemradio"
                    aria-checked={String(current) === String(o.value)}
                    selected={String(current) === String(o.value)}
                    showCheck
                    onSelect={() => set(f.key, o.value)}
                  >
                    {o.label}
                  </MenuItem>
                ))}
              </div>
            )
          })}
          {active > 0 && (
            <>
              <MenuDivider />
              <MenuItem onSelect={reset} tone="danger">
                Clear filters
              </MenuItem>
            </>
          )}
        </Menu>
      </Popover>
    </>
  )
}
