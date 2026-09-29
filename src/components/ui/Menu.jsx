import { cloneElement, forwardRef, isValidElement, useCallback, useId, useState } from 'react'
import { clsx } from 'clsx'
import { Check } from 'lucide-react'
import { Popover } from './Popover'
import { moveFocus } from './menuFocus'

/*
 * Figma "Theme" menu (1343:32509) / Menu item/Standard: white card, radius 12, menu shadow,
 * 2px list padding, 36px rows (4px inset, 32px state layer, radius 4, padding 6/12),
 * DM Sans 500 14 #212121, leading check on the selected item, thin #757575 scrollbar.
 */

/** Menu — the list surface. Put MenuItem / MenuDivider / MenuLabel inside. */
export const Menu = forwardRef(({ children, className, role = 'menu', ...props }, ref) => (
  <div
    ref={ref}
    role={role}
    className={clsx('max-h-72 overflow-y-auto py-0.5 scrollbar-thin', className)}
    {...props}
  >
    {children}
  </div>
))
Menu.displayName = 'Menu'

/**
 * MenuItem — one row. Props: icon (lucide component/element), selected (+ showCheck → leading
 * check), tone (default | danger), description (second line), disabled, onSelect, active
 * (keyboard highlight), role (menuitem | option).
 */
export const MenuItem = forwardRef(
  (
    {
      children,
      icon: Icon,
      selected = false,
      showCheck = false,
      tone = 'default',
      description,
      disabled = false,
      onSelect,
      active = false,
      role = 'menuitem',
      className,
      ...props
    },
    ref
  ) => (
    <div className="px-1 py-0.5">
      <button
        ref={ref}
        type="button"
        role={role}
        aria-selected={role === 'option' ? selected : undefined}
        aria-checked={role === 'menuitemcheckbox' ? selected : undefined}
        disabled={disabled}
        onClick={onSelect}
        className={clsx(
          'flex min-h-8 w-full items-center gap-2 rounded-sm px-3 py-1.5 text-left text-sm font-medium leading-[18px] outline-none transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-40',
          tone === 'danger' ? 'text-danger' : 'text-ink',
          active ? 'bg-subtle' : 'hover:bg-subtle focus-visible:bg-subtle',
          className
        )}
        {...props}
      >
        {showCheck && (
          <Check className={clsx('h-5 w-5 shrink-0', selected ? 'opacity-100' : 'opacity-0')} strokeWidth={2} />
        )}
        {Icon && (isValidElement(Icon) ? Icon : <Icon className="h-4 w-4 shrink-0 opacity-80" />)}
        <span className="min-w-0 flex-1">
          <span className="block truncate">{children}</span>
          {description && <span className="block text-xs font-normal text-ink-muted">{description}</span>}
        </span>
      </button>
    </div>
  )
)
MenuItem.displayName = 'MenuItem'

/** Divider between menu groups (Figma two-group menu). */
export const MenuDivider = () => <div role="separator" className="my-1 border-t border-line" />

/** Small group heading inside a menu. */
export const MenuLabel = ({ children }) => (
  <p className="px-4 pb-1 pt-2 text-xs font-medium text-ink-muted">{children}</p>
)

/**
 * DropdownMenu — trigger + action menu (row kebab menus, the header user menu).
 *
 *   <DropdownMenu
 *     trigger={<IconButton icon={MoreVertical} label="Actions" />}
 *     items={[
 *       { label: 'Edit', icon: Pencil, onSelect: edit },
 *       { divider: true },
 *       { label: 'Delete', icon: Trash2, tone: 'danger', onSelect: remove },
 *     ]}
 *   />
 * `trigger` is an element (it receives onClick/aria props and a ref) or a render function
 * ({ open, ...triggerProps }) => element. Items: { label, icon, onSelect, tone, disabled,
 * description, divider, heading }. `header` renders above the items. placement: bottom-end default.
 */
export const DropdownMenu = ({ trigger, items = [], header, placement = 'bottom-end', className, width = 220 }) => {
  const [open, setOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const menuId = useId()
  const close = useCallback(() => setOpen(false), [])

  const triggerProps = {
    ref: setAnchorEl,
    onClick: () => setOpen((o) => !o),
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-controls': open ? menuId : undefined,
    onKeyDown: (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setOpen(true)
        requestAnimationFrame(() => moveFocus(document.getElementById(menuId), 'first'))
      }
    },
  }
  const triggerNode =
    typeof trigger === 'function' ? trigger({ open, ...triggerProps }) : isValidElement(trigger) ? cloneElement(trigger, triggerProps) : null

  return (
    <>
      {triggerNode}
      <Popover open={open} onClose={close} anchorEl={anchorEl} placement={placement} className={className} style={{ width }}>
        {header}
        <Menu
          id={menuId}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') moveFocus(e.currentTarget, 1)
            else if (e.key === 'ArrowUp') moveFocus(e.currentTarget, -1)
            else if (e.key === 'Home') moveFocus(e.currentTarget, 'first')
            else if (e.key === 'End') moveFocus(e.currentTarget, 'last')
            else if (e.key === 'Tab') close()
            else return
            e.preventDefault()
          }}
        >
          {items.filter(Boolean).map((item, i) =>
            item.divider ? (
              <MenuDivider key={`d${i}`} />
            ) : item.heading ? (
              <MenuLabel key={`h${i}`}>{item.heading}</MenuLabel>
            ) : (
              <MenuItem
                key={item.key || item.label}
                icon={item.icon}
                tone={item.tone}
                description={item.description}
                disabled={item.disabled}
                onSelect={() => {
                  close()
                  item.onSelect?.()
                }}
              >
                {item.label}
              </MenuItem>
            )
          )}
        </Menu>
      </Popover>
    </>
  )
}
