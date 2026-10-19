import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { ToastProvider, TooltipProvider } from '@/components/ui'
import { CommercialProvider } from './store'
import { COMMERCIAL_MOCK, DEMO_NOW, type CommercialData } from './mock-data'

export const freshData = (patch: Partial<CommercialData> = {}): CommercialData => ({ ...structuredClone(COMMERCIAL_MOCK), ...patch })

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname + location.search}</output>
}

/** Monte un écran du module avec les données de démo, sans délai de chargement. */
export function renderCommercial(routes: { path: string; element: ReactElement }[], url: string, data = freshData()) {
  return render(
    <TooltipProvider>
      <ToastProvider>
        <CommercialProvider initialData={data} now={DEMO_NOW}>
          <MemoryRouter initialEntries={[url]}>
            <Routes>
              {routes.map((r) => (
                <Route key={r.path} path={r.path} element={r.element} />
              ))}
              <Route path="*" element={null} />
            </Routes>
            <LocationProbe />
          </MemoryRouter>
        </CommercialProvider>
      </ToastProvider>
    </TooltipProvider>,
  )
}
