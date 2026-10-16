import { HashRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import { StoreProvider } from './store'
import DevisPage from './pages/DevisPage'
import DevisEditor from './pages/DevisEditor'
import DevisClientView from './pages/DevisClientView'
import ClientsPage from './pages/ClientsPage'
import ClientDetail from './pages/ClientDetail'

function Soon() {
  const { page } = useParams()
  return (
    <div className="grid h-full place-items-center text-center">
      <div><div className="h-page capitalize">{page}</div><p className="mt-3 text-ink2">Pas encore développé dans ce prototype : seule la partie Commercial est branchée.</p></div>
    </div>
  )
}

function Shell() {
  const loc = useLocation()
  // la page devis côté client s'affiche sans la barre latérale de l'OS
  if (/^\/devis\/[^/]+\/client/.test(loc.pathname)) return <Routes><Route path="/devis/:id/client" element={<DevisClientView />} /></Routes>
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="relative min-w-0 flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/devis" replace />} />
          <Route path="/devis" element={<DevisPage />} />
          <Route path="/devis/:id" element={<DevisEditor />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/bientot/:page" element={<Soon />} />
          <Route path="*" element={<Navigate to="/devis" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return <StoreProvider><HashRouter><Shell /></HashRouter></StoreProvider>
}
