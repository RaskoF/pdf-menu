import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderProduction } from '../test-utils'
import { AzurpodPage } from './azurpod-page'

const renderPage = () => renderProduction([{ path: '/azurpod', element: <AzurpodPage /> }], '/azurpod')

describe('Azurpod', () => {
  it('résume la semaine et fait avancer une livraison', async () => {
    renderPage()
    expect(screen.getByText('Studio podcast. Cette semaine : 2 sessions, 3,5 h occupées sur 50 h.')).toBeInTheDocument()
    expect(screen.getByText('bloqué depuis 2 j')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Monter' }))
    await userEvent.click(screen.getByRole('button', { name: 'Marquer envoyé' }))
    expect(screen.getByText('envoyé le 19 oct.')).toBeInTheDocument()
  })

  it('réserve une séance de pack et décompte les heures', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Nouvelle session' }))
    const sheet = screen.getByRole('dialog', { name: 'Nouvelle session' })
    expect(within(sheet).getByText('Inclus au pack')).toBeInTheDocument()
    await userEvent.click(within(sheet).getByRole('button', { name: 'Réserver' }))
    expect(within(sheet).getByRole('alert')).toHaveTextContent('Choisissez un créneau.')
    const tuesday = within(sheet).getByRole('radiogroup', { name: /Créneaux du Mardi 20 octobre/ })
    await userEvent.click(within(tuesday).getByRole('radio', { name: '14:00' }))
    await userEvent.click(within(sheet).getByRole('button', { name: 'Réserver' }))
    expect(screen.getByText(/Session réservée mardi 20 octobre à 14:00/)).toBeInTheDocument()
    expect(screen.getByText('2 h sur 10')).toBeInTheDocument()
  })

  it('passe en vue mois', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('tab', { name: 'Mois' }))
    const grid = screen.getByRole('grid', { name: 'Octobre 2026' })
    expect(within(grid).getByRole('button', { name: 'Podcast RH' })).toBeInTheDocument()
  })
})
