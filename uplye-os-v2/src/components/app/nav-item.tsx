import { NavLink } from 'react-router-dom'
import type { Icon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui'

// Figma : « Nav Item » (14:143) : Default, Hover, Active.
export interface NavItemProps {
  to: string
  label: string
  icon: Icon
  count?: number
  collapsed?: boolean
  onNavigate?: () => void
}

export function NavItem({ to, label, icon: IconCmp, count, collapsed = false, onNavigate }: NavItemProps) {
  const link = (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'focus-visible:shadow-[0_0_0_2px_var(--shell-muted)] flex h-8 items-center gap-3 rounded-md px-2 text-label-md transition-colors',
          isActive ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground',
          collapsed && 'justify-center px-0',
        )
      }
    >
      {({ isActive }) => (
        <>
          <IconCmp className="size-[18px] shrink-0" weight="regular" aria-hidden />
          {!collapsed && <span className="flex-1 truncate">{label}</span>}
          {!collapsed && count !== undefined && (
            <span className={cn('text-meta-sm', isActive ? 'text-sidebar-foreground' : 'text-sidebar-muted')}>
              {count}
              <span className="sr-only"> éléments</span>
            </span>
          )}
          {collapsed && <span className="sr-only">{label}</span>}
        </>
      )}
    </NavLink>
  )
  return collapsed ? (
    <Tooltip label={label} side="right">
      {link}
    </Tooltip>
  ) : (
    link
  )
}
