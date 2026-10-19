import { useCallback, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import * as SheetPrimitive from '@radix-ui/react-dialog'
import { List } from '@phosphor-icons/react'
import { Sidebar, type SidebarUser } from '@/components/app/sidebar'
import { Logo } from '@/components/app/logo'
import { IconButton } from '@/components/ui'
import { useTheme } from '@/hooks/use-theme'
import { useHotkey } from '@/hooks/use-hotkey'
import { CURRENT_USER, NAV_COUNTS } from '@/data/session'

const COLLAPSE_KEY = 'uplye-os-sidebar-collapsed'
const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}

// Cadre de l'application : barre latérale (tiroir sur mobile) + zone principale arrondie.
export function AppShell({ user = CURRENT_USER }: { user?: SidebarUser }) {
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const toggleCollapsed = () =>
    setCollapsed((value) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, value ? '0' : '1')
      } catch {
        // préférence non mémorisée
      }
      return !value
    })

  useHotkey('k', useCallback(() => navigate('/recherche'), [navigate]))
  useHotkey('j', useCallback(() => navigate('/assistant'), [navigate]))

  const sidebarProps = { user, counts: NAV_COUNTS, theme, onToggleTheme: toggle }

  return (
    <div className="flex h-full min-h-0 bg-sidebar md:py-2">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-brand focus:px-3 focus:py-2 focus:text-brand-foreground">
        Aller au contenu
      </a>

      <Sidebar {...sidebarProps} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} className="hidden shrink-0 md:flex" />

      <div className="flex min-w-0 flex-1 flex-col md:pr-2">
        <div className="flex items-center justify-between px-4 py-3 md:hidden">
          <Logo />
          <SheetPrimitive.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetPrimitive.Trigger asChild>
              <IconButton label="Ouvrir le menu" className="text-sidebar-foreground hover:bg-sidebar-hover">
                <List />
              </IconButton>
            </SheetPrimitive.Trigger>
            <SheetPrimitive.Portal>
              <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-surface-overlay animate-fade-in" />
              <SheetPrimitive.Content aria-describedby={undefined} className="fixed inset-y-0 left-0 z-50 shadow-lg animate-fade-in">
                <SheetPrimitive.Title className="sr-only">Menu</SheetPrimitive.Title>
                <Sidebar {...sidebarProps} onNavigate={() => setDrawerOpen(false)} />
              </SheetPrimitive.Content>
            </SheetPrimitive.Portal>
          </SheetPrimitive.Root>
        </div>

        <main id="contenu" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto bg-background md:rounded-xl">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
