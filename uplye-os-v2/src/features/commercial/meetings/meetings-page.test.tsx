import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderCommercial } from '../test-utils'
import { MeetingsPage } from './meetings-page'

const renderPage = (url = '/reunions?rdv=r1') => renderCommercial([{ path: '/reunions', element: <MeetingsPage /> }], url)

describe('Réunions', () => {
  it('crée les tâches détectées et classe la réunion en traitée', async () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'Point tournage' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Créer les 2 tâches' }))
    expect(await screen.findByText('2 tâches ajoutées au Kanban')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Ignorer' }))
    const treated = screen.getByRole('heading', { name: 'Traitées' }).parentElement!
    expect(treated).toHaveTextContent('Point tournage')
  })

  it('répond aux questions proposées à partir de la transcription', async () => {
    renderPage('/reunions?rdv=r2')
    await userEvent.click(screen.getByRole('button', { name: 'Budget évoqué ?' }))
    expect(screen.getByText(/Aucun budget évoqué|Coralie à/)).toBeInTheDocument()
  })

  it('affiche l’état Fireflies déconnecté et permet de reconnecter', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: /Fireflies connecté/ }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Déconnecter Fireflies' }))
    expect(screen.getByText('Reconnectez Fireflies')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reconnecter Fireflies' }))
    expect(screen.getByRole('heading', { name: 'Point tournage' })).toBeInTheDocument()
  })
})
