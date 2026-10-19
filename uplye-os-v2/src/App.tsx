import { HashRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider, TooltipProvider } from '@/components/ui'
import { AppShell } from '@/layouts/app-shell'
import { TodayPage } from '@/features/today/today-page'
import { CommercialProvider } from '@/features/commercial/store'
import { DevisPage } from '@/features/commercial/devis/devis-page'
import { DevisEditorRoute } from '@/features/commercial/editor/devis-editor-page'
import { ClientsPage } from '@/features/commercial/clients/clients-page'
import { ClientPage } from '@/features/commercial/clients/client-page'
import { EventsPage } from '@/features/commercial/events/events-page'
import { MeetingsPage } from '@/features/commercial/meetings/meetings-page'
import { ProductionProvider } from '@/features/production/store'
import { ProjectsPage } from '@/features/production/projects/projects-page'
import { ProjectPage } from '@/features/production/projects/project-page'
import { AzurpodPage } from '@/features/production/azurpod/azurpod-page'
import { SocialPage } from '@/features/production/social/social-page'
import { PostEditorRoute } from '@/features/production/social/post-editor-page'
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
        <CommercialProvider>
          <ProductionProvider>
            <HashRouter>
              <Routes>
                {/* L'éditeur occupe tout l'écran, sans barre latérale (Figma 33:780) */}
                <Route path="devis/:id/editeur" element={<DevisEditorRoute />} />
                <Route path="reseaux-sociaux/post/:id" element={<PostEditorRoute />} />
                <Route element={<AppShell />}>
                  <Route index element={<TodayPage />} />
                  <Route path="devis" element={<DevisPage />} />
                  <Route path="clients" element={<ClientsPage />} />
                  <Route path="clients/:id" element={<ClientPage />} />
                  <Route path="evenements" element={<EventsPage />} />
                  <Route path="reunions" element={<MeetingsPage />} />
                  <Route path="projets" element={<ProjectsPage />} />
                  <Route path="projets/:id" element={<ProjectPage />} />
                  <Route path="azurpod" element={<AzurpodPage />} />
                  <Route path="reseaux-sociaux" element={<SocialPage />} />
                  {PENDING_ROUTES.map((path) => (
                    <Route key={path} path={path} element={<ComingSoonPage />} />
                  ))}
                  <Route path="systeme" element={<DesignSystemPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </HashRouter>
          </ProductionProvider>
        </CommercialProvider>
      </ToastProvider>
    </TooltipProvider>
  )
}
