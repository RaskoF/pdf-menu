import { useNavigate } from 'react-router-dom'
import {
  Bell, Buildings, Palette, FileText, Kanban as KanbanIcon, MagnifyingGlass, Moon, Plus, SidebarSimple, SignOut, Sparkle, Sun, User, CalendarPlus,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { NAV_GROUPS } from '@/config/navigation'
import type { Theme } from '@/hooks/use-theme'
import {
  Avatar, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, IconButton, Kbd, Tooltip,
} from '@/components/ui'
import { Logo } from './logo'
import { NavItem } from './nav-item'

// Figma : « Sidebar » (14:147) : espace de travail, recherche + création, navigation par pôle, assistant, compte.
export interface SidebarUser {
  name: string
  role: string
  initials: string
}

export interface SidebarProps {
  user: SidebarUser
  counts?: Partial<Record<string, number>>
  collapsed?: boolean
  onToggleCollapsed?: () => void
  theme: Theme
  onToggleTheme: () => void
  /** Appelé après une navigation (ferme le tiroir sur mobile) */
  onNavigate?: () => void
  className?: string
}

export function Sidebar({ user, counts = {}, collapsed = false, onToggleCollapsed, theme, onToggleTheme, onNavigate, className }: SidebarProps) {
  const navigate = useNavigate()
  const go = (to: string) => {
    navigate(to)
    onNavigate?.()
  }

  return (
    <nav aria-label="Navigation principale" className={cn('flex h-full flex-col gap-3 bg-sidebar px-3 py-4 text-sidebar-foreground', collapsed ? 'w-16' : 'w-sidebar min-w-[248px]', className)}>
      <div className={cn('flex h-12 items-center', collapsed ? 'flex-col justify-center gap-2' : 'pr-2')}>
        <Logo showWordmark={!collapsed} />
        {onToggleCollapsed && (
          <IconButton
            label={collapsed ? 'Déplier le menu' : 'Replier le menu'}
            size="sm"
            onClick={onToggleCollapsed}
            className={cn('text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground [&_svg]:size-[18px]', !collapsed && 'ml-auto')}
          >
            <SidebarSimple />
          </IconButton>
        )}
      </div>

      <div className={cn('flex gap-2', collapsed && 'flex-col items-center')}>
        {collapsed ? (
          <IconButton label="Rechercher" size="sm" onClick={() => go('/recherche')} className="text-sidebar-muted hover:bg-sidebar-hover">
            <MagnifyingGlass />
          </IconButton>
        ) : (
          <button
            type="button"
            onClick={() => go('/recherche')}
            className="focus-visible:shadow-[0_0_0_2px_var(--shell-muted)] flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-field px-2 text-body-md text-sidebar-muted transition-colors hover:text-sidebar-foreground"
          >
            <MagnifyingGlass className="size-4 shrink-0" aria-hidden />
            <span className="flex-1 truncate text-left">Rechercher</span>
            <Kbd keys="K" command tone="dark" />
          </button>
        )}
        <DropdownMenu>
          <Tooltip label="Créer" side={collapsed ? 'right' : 'bottom'}>
            <DropdownMenuTrigger asChild>
              <IconButton label="Créer" variant="brand" size="sm">
                <Plus />
              </IconButton>
            </DropdownMenuTrigger>
          </Tooltip>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Créer</DropdownMenuLabel>
            <DropdownMenuItem icon={<FileText />} onSelect={() => go('/devis')}>Un devis</DropdownMenuItem>
            <DropdownMenuItem icon={<KanbanIcon />} onSelect={() => go('/kanban')}>Une tâche</DropdownMenuItem>
            <DropdownMenuItem icon={<Buildings />} onSelect={() => go('/clients')}>Un client</DropdownMenuItem>
            <DropdownMenuItem icon={<CalendarPlus />} onSelect={() => go('/planning')}>Un créneau</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="-mx-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} role="group" aria-labelledby={`nav-${group.label}`} className="flex flex-col gap-0.5">
            <p id={`nav-${group.label}`} className={cn('px-2 pb-1 text-meta-md text-sidebar-muted', collapsed && 'sr-only')}>
              {group.label}
            </p>
            {group.items.map((item) => (
              <NavItem key={item.to} {...item} count={counts[item.to]} collapsed={collapsed} onNavigate={onNavigate} />
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => go('/assistant')}
          className={cn(
            'focus-visible:shadow-[0_0_0_2px_var(--shell-muted)] flex h-9 items-center gap-3 rounded-md bg-sidebar-field px-2 text-label-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent',
            collapsed && 'justify-center px-0',
          )}
          aria-label={collapsed ? 'Assistant' : undefined}
        >
          <Sparkle className="size-[18px] shrink-0 text-brand" aria-hidden />
          {!collapsed && <span className="flex-1 text-left">Assistant</span>}
          {!collapsed && <Kbd keys="J" command tone="dark" />}
        </button>

        <div className={cn('flex items-center gap-3 border-t border-sidebar-border px-2 pt-3', collapsed && 'flex-col px-0')}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="focus-visible:shadow-[0_0_0_2px_var(--shell-muted)] flex min-w-0 flex-1 items-center gap-3 rounded-md text-left" aria-label={`Compte de ${user.name}`}>
                <Avatar initials={user.initials} tone="yellow" size="md" />
                {!collapsed && (
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-label-md text-sidebar-foreground">{user.name}</span>
                    <span className="truncate text-body-xs text-sidebar-muted">{user.role}</span>
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start">
              <DropdownMenuItem icon={<User />} onSelect={() => go('/compte')}>Mon compte</DropdownMenuItem>
              <DropdownMenuItem icon={theme === 'dark' ? <Sun /> : <Moon />} onSelect={onToggleTheme}>
                {theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'}
              </DropdownMenuItem>
              <DropdownMenuItem icon={<Palette />} onSelect={() => go('/systeme')}>Design system</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem icon={<SignOut />} destructive disabled>
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <IconButton label="Notifications" size="sm" onClick={() => go('/notifications')} className="text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground [&_svg]:size-[18px]">
            <Bell />
          </IconButton>
        </div>
      </div>
    </nav>
  )
}
