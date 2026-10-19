import { HashRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider, TooltipProvider } from '@/components/ui'
import { AppShell } from '@/layouts/app-shell'
import { TodayPage } from '@/features/today/today-page'
import { ComingSoonPage } from '@/pages/coming-soon-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { DesignSystemPage } from '@/pages/design-system-page'
import { ALL_NAV_ITEMS } from '@/config/navigation'

const PENDING_ROUTES = [...ALL_NAV_ITEMS.filter((i) => !i.ready).map((i) => i.to), '/recherche', '/assistant', '/notifications', '/compte']

// HashRouter : la démo fonctionne en fichier unique, sans configuration serveur.
export default function App() {
  return (
    <TooltipProvider delayDuration={300}>
      <ToastProvider>
        <HashRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<TodayPage />} />
              {PENDING_ROUTES.map((path) => (
                <Route key={path} path={path} element={<ComingSoonPage />} />
              ))}
              <Route path="systeme" element={<DesignSystemPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </HashRouter>
      </ToastProvider>
    </TooltipProvider>
  )
}
