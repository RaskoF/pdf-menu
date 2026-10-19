import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { freshData, renderCommercial } from '../test-utils'
import { EventsPage } from './events-page'

const renderPage = (data = freshData()) => renderCommercial([{ path: '/evenements', element: <EventsPage /> }], '/evenements', data)

describe('Événements', () => {
  it('calcule la rentabilité de chaque événement', () => {
    renderPage()
    expect(screen.getByText(/2 700 € signés grâce aux événements, pour 605 € dépensés/)).toBeInTheDocument()
    expect(screen.getByText('ROI ×5,6')).toBeInTheDocument()
    expect(screen.getAllByText('Rentable')).toHaveLength(2)
  })

  it('relance les contacts depuis les messages préparés', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Relire les 3 messages' }))
    const dialog = screen.getByRole('dialog', { name: 'Relire les messages' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Envoyer les 3 messages' }))
    expect(await screen.findByText('3 messages envoyés')).toBeInTheDocument()
    expect(screen.queryByText(/à relancer avant demain/)).not.toBeInTheDocument()
    expect(screen.getAllByText('Relancé')).toHaveLength(5)
  })

  it('affiche l’état vide sans événement suivi', () => {
    renderPage(freshData({ events: [] }))
    expect(screen.getByText('Aucun événement suivi')).toBeInTheDocument()
    expect(screen.getByText('Ce trimestre : aucun événement suivi pour l’instant.')).toBeInTheDocument()
  })

  it('valide puis ajoute un événement à venir', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Nouvel événement' }))
    const sheet = screen.getByRole('dialog', { name: 'Nouvel événement' })
    await userEvent.click(within(sheet).getByRole('button', { name: 'Ajouter l’événement' }))
    expect(within(sheet).getByText('Donnez un nom à l’événement.')).toBeInTheDocument()
    await userEvent.type(within(sheet).getByLabelText('Nom'), 'Afterwork CCI')
    await userEvent.type(within(sheet).getByLabelText('Date'), '2026-12-03')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Ajouter l’événement' }))
    expect(await screen.findByText('Afterwork CCI')).toBeInTheDocument()
  })
})
