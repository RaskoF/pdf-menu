import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider, TooltipProvider } from '@/components/ui'
import { TodayPage } from './today-page'
import { TODAY_MOCK } from './mock-data'
import type { TodayData } from './types'

const NOW = new Date(2026, 9, 18)

function renderPage(data: TodayData = structuredClone(TODAY_MOCK)) {
  const loader = () => Promise.resolve(data)
  return render(
    <TooltipProvider>
      <ToastProvider>
        <MemoryRouter>
          <TodayPage loader={loader} now={NOW} />
        </MemoryRouter>
      </ToastProvider>
    </TooltipProvider>,
  )
}

describe('Aujourd’hui', () => {
  it('affiche le chargement puis les tâches groupées', async () => {
    renderPage()
    expect(screen.getByText(/Synchronisation en cours/)).toBeInTheDocument()
    expect(await screen.findByText('Débloquer l’envoi de l’épisode 3')).toBeInTheDocument()
    expect(screen.getByText('Dimanche 18 octobre. 7 choses à traiter, dont 2 urgentes.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Urgent/ })).toBeInTheDocument()
  })

  it('filtre par pôle', async () => {
    renderPage()
    await screen.findByText('Débloquer l’envoi de l’épisode 3')
    await userEvent.click(screen.getByRole('button', { name: /^Finance/ }))
    expect(screen.getByRole('button', { name: /^Finance/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByText('Relancer Mayli Spa & Beauty')).not.toBeInTheDocument()
    expect(screen.getByText('Facture F-2026-118 échue')).toBeInTheDocument()
  })

  it('cocher une tâche la retire et propose d’annuler', async () => {
    renderPage()
    const checkbox = await screen.findByRole('checkbox', { name: 'Facture F-2026-118 échue' })
    await userEvent.click(checkbox)
    expect(screen.getByText('Dimanche 18 octobre. 6 choses à traiter, dont 1 urgente.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(await screen.findByRole('checkbox', { name: 'Facture F-2026-118 échue' })).not.toBeChecked()
  })

  it('montre l’état « tout est à jour » quand il ne reste rien', async () => {
    const data = structuredClone(TODAY_MOCK)
    data.inbox.forEach((i) => (i.done = true))
    renderPage(data)
    expect(await screen.findByText('Tout est à jour')).toBeInTheDocument()
    expect(screen.getByText(/Rien d’urgent, profitez-en/)).toBeInTheDocument()
    const card = screen.getByRole('region', { name: 'À traiter' })
    expect(within(card).getByText(/9 actions traitées aujourd’hui/)).toBeInTheDocument()
  })

  it('affiche les indicateurs du rail', async () => {
    renderPage()
    expect(await screen.findByText('Cash d’octobre')).toBeInTheDocument()
    expect(screen.getByText('Jeudi en conflit')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Rejoindre/ })).toHaveAttribute('target', '_blank')
  })
})
