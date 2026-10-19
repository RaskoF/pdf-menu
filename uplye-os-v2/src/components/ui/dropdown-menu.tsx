import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from 'react'
import * as Menu from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'

// Figma : « Dropdown Menu » (10:181) et « Menu Item » (10:178)
export const DropdownMenu = Menu.Root
export const DropdownMenuTrigger = Menu.Trigger
export const DropdownMenuGroup = Menu.Group

export const DropdownMenuContent = forwardRef<ElementRef<typeof Menu.Content>, ComponentPropsWithoutRef<typeof Menu.Content>>(
  ({ className, sideOffset = 4, ...props }, ref) => (
    <Menu.Portal>
      <Menu.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn('z-50 min-w-[228px] rounded-lg bg-popover p-1 text-popover-foreground shadow-md animate-pop-in', className)}
        {...props}
      />
    </Menu.Portal>
  ),
)
DropdownMenuContent.displayName = 'DropdownMenuContent'

export const DropdownMenuLabel = forwardRef<ElementRef<typeof Menu.Label>, ComponentPropsWithoutRef<typeof Menu.Label>>(({ className, ...props }, ref) => (
  <Menu.Label ref={ref} className={cn('px-2 py-1.5 text-meta-md text-muted-foreground', className)} {...props} />
))
DropdownMenuLabel.displayName = 'DropdownMenuLabel'

export const DropdownMenuItem = forwardRef<
  ElementRef<typeof Menu.Item>,
  ComponentPropsWithoutRef<typeof Menu.Item> & { icon?: ReactNode; shortcut?: string; destructive?: boolean }
>(({ className, icon, shortcut, destructive = false, children, ...props }, ref) => (
  <Menu.Item
    ref={ref}
    className={cn(
      'flex h-8 cursor-default select-none items-center gap-2 rounded-sm px-2 text-body-md outline-none data-[highlighted]:bg-accent data-[disabled]:text-ink-disabled [&_svg]:size-4 [&_svg]:shrink-0',
      destructive ? 'text-destructive [&_svg]:text-destructive' : 'text-foreground [&_svg]:text-muted-foreground',
      className,
    )}
    {...props}
  >
    {icon}
    <span className="flex-1 truncate">{children}</span>
    {shortcut && <span className="text-meta-sm text-muted-foreground">{shortcut}</span>}
  </Menu.Item>
))
DropdownMenuItem.displayName = 'DropdownMenuItem'

export const DropdownMenuSeparator = forwardRef<ElementRef<typeof Menu.Separator>, ComponentPropsWithoutRef<typeof Menu.Separator>>(
  ({ className, ...props }, ref) => <Menu.Separator ref={ref} className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />,
)
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'
