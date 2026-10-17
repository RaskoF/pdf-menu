import { HashRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import { StoreProvider } from './store'
import DevisPage from './pages/DevisPage'
import DevisEditor from './pages/DevisEditor'
import DevisClientView from './pages/DevisClientView'
import ClientsPage from './pages/ClientsPage'
import ClientDetail from './pages/ClientDetail'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetail from './pages/ProjectDetail'
import KanbanPage from './pages/KanbanPage'
import PlanningPage from './pages/PlanningPage'
import FinancePage from './pages/FinancePage'
import DashboardPage from './pages/DashboardPage'
import AzurpodPage from './pages/AzurpodPage'
import EventsPage from './pages/EventsPage'
import TeamPage from './pages/TeamPage'
import CataloguePage from './pages/CataloguePage'
import SopPage from './pages/SopPage'
import SocialPage from './pages/SocialPage'
import SocialAccountsPage from './pages/SocialAccountsPage'
import ClientPortal from './pages/ClientPortal'
import { useStore } from './store'

function Soon() {
  const { page } = useParams()
  return (
    <div className="grid h-full place-items-center text-center">
      <div><div className="h-page capitalize">{page}</div><p className="mt-3 text-ink2">Pas encore développé dans ce prototype.</p></div>
    </div>
  )
}

// Alexis (Production) n'a pas accès aux chiffres : la route est bloquée, pas seulement cachée du menu.
function AdminOnly({ children }: { children: React.ReactNode }) {
  const { state } = useStore()
  if (state.me === 'X') return <div className="grid h-full place-items-center text-center"><div><div className="h-page">Accès réservé</div><p className="mt-3 text-ink2">Cette page est réservée aux admins.</p></div></div>
  return <>{children}</>
}

function Shell() {
  const loc = useLocation()
  // la page devis côté client s'affiche sans la barre latérale de l'OS
  if (/^\/devis\/[^/]+\/client/.test(loc.pathname)) return <Routes><Route path="/devis/:id/client" element={<DevisClientView />} /></Routes>
  if (/^\/portail\//.test(loc.pathname)) return <Routes><Route path="/portail/:id" element={<AdminOnly><ClientPortal /></AdminOnly>} /></Routes>
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="relative min-w-0 flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/azurpod" element={<AzurpodPage />} />
          <Route path="/evenements" element={<AdminOnly><EventsPage /></AdminOnly>} />
          <Route path="/equipe" element={<TeamPage />} />
          <Route path="/sop" element={<SopPage />} />
          <Route path="/social" element={<SocialPage />} />
          <Route path="/social/comptes" element={<SocialAccountsPage />} />
          <Route path="/catalogue" element={<AdminOnly><CataloguePage /></AdminOnly>} />
          <Route path="/devis" element={<AdminOnly><DevisPage /></AdminOnly>} />
          <Route path="/devis/:id" element={<AdminOnly><DevisEditor /></AdminOnly>} />
          <Route path="/clients" element={<AdminOnly><ClientsPage /></AdminOnly>} />
          <Route path="/clients/:id" element={<AdminOnly><ClientDetail /></AdminOnly>} />
          <Route path="/projets" element={<ProjectsPage />} />
          <Route path="/projets/:id" element={<ProjectDetail />} />
          <Route path="/kanban" element={<KanbanPage />} />
          <Route path="/planning" element={<PlanningPage />} />
          <Route path="/workload" element={<PlanningPage />} />
          <Route path="/finance" element={<AdminOnly><FinancePage /></AdminOnly>} />
          <Route path="/bientot/:page" element={<Soon />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return <StoreProvider><HashRouter><Shell /></HashRouter></StoreProvider>
}
