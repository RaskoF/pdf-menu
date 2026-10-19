import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { ToastProvider, TooltipProvider } from '@/components/ui'
import { DEMO_NOW } from '@/data/session'
import { CommercialProvider } from '@/features/commercial/store'
import { COMMERCIAL_MOCK, type CommercialData } from '@/features/commercial/mock-data'
import { ProductionProvider } from './store'
import { PRODUCTION_MOCK, type ProductionData } from './mock-data'

export const freshProduction = (patch: Partial<ProductionData> = {}): ProductionData => ({ ...structuredClone(PRODUCTION_MOCK), ...patch })

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname + location.search}</output>
}

/** Monte un écran Production (avec le module Commercial pour les clients et les devis). */
export function renderProduction(
  routes: { path: string; element: ReactElement }[],
  url: string,
  data = freshProduction(),
  commercial: CommercialData = structuredClone(COMMERCIAL_MOCK),
) {
  return render(
    <TooltipProvider>
      <ToastProvider>
        <CommercialProvider initialData={commercial} now={DEMO_NOW}>
          <ProductionProvider initialData={data} now={DEMO_NOW}>
            <MemoryRouter initialEntries={[url]}>
              <Routes>
                {routes.map((r) => (
                  <Route key={r.path} path={r.path} element={r.element} />
                ))}
                <Route path="*" element={null} />
              </Routes>
              <LocationProbe />
            </MemoryRouter>
          </ProductionProvider>
        </CommercialProvider>
      </ToastProvider>
    </TooltipProvider>,
  )
}
