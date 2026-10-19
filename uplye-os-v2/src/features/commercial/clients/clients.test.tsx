import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderCommercial } from '../test-utils'
import { ClientsPage } from './clients-page'
import { ClientPage } from './client-page'

const routes = [
  { path: '/clients', element: <ClientsPage /> },
  { path: '/clients/:id', element: <ClientPage /> },
]

describe('Clients', () => {
  it('filtre les prospects et trie par chiffre d’affaires', async () => {
    renderCommercial(routes, '/clients')
    await userEvent.click(screen.getByRole('button', { name: /^Prospects/ }))
    const rows = screen.getAllByRole('row').slice(1)
    expect(rows.map((r) => within(r).getByRole('link').textContent)).toEqual(['Univers Nuisible', 'Restaurant à Hyères'])
  })

  it('crée un client et ouvre sa fiche', async () => {
    renderCommercial(routes, '/clients')
    await userEvent.click(screen.getByRole('button', { name: 'Nouveau client' }))
    const sheet = screen.getByRole('dialog', { name: 'Nouveau client' })
    await userEvent.click(within(sheet).getByRole('button', { name: 'Ajouter le client' }))
    expect(within(sheet).getByText('Le nom du compte est obligatoire.')).toBeInTheDocument()
    await userEvent.type(within(sheet).getByLabelText('Nom du compte'), 'Pâtisserie du Cours')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Ajouter le client' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Pâtisserie du Cours' })).toBeInTheDocument()
    expect(screen.getByText('Aucun contact enregistré.')).toBeInTheDocument()
  })

  it('ajoute une note au fil de la fiche', async () => {
    renderCommercial(routes, '/clients/ils')
    expect(screen.getByRole('heading', { level: 1, name: 'Institut Lumière du Sud' })).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Ajouter une note'), 'Rappeler Coralie après le bilan{Enter}')
    expect(screen.getByText('Rappeler Coralie après le bilan')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Devis' }))
    expect(screen.queryByText('Rappeler Coralie après le bilan')).not.toBeInTheDocument()
  })
})
