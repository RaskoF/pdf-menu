import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderCommercial } from '../test-utils'
import { DevisEditorPage } from './devis-editor-page'
import { DevisPage } from '../devis/devis-page'

function renderEditor(id: string, send = (email: string) => Promise.resolve(email.endsWith('.invalid') ? ('bounced' as const) : ('ok' as const))) {
  return renderCommercial(
    [
      { path: '/devis/:id/editeur', element: <DevisEditorPage send={send} /> },
      { path: '/devis', element: <DevisPage /> },
    ],
    `/devis/${id}/editeur`,
  )
}

describe('Éditeur de devis', () => {
  it('reprend les totaux et applique une suggestion du RDV', async () => {
    renderEditor('dev-014')
    expect(screen.getByText('Marge 54 %, visible par vous')).toBeInTheDocument()
    expect(screen.getByText('1 020 €')).toBeInTheDocument()
    const suggestion = screen.getByText('Ajouter une vidéo format court').closest('li')!
    await userEvent.click(within(suggestion).getByRole('button', { name: 'Appliquer' }))
    expect(screen.getByText('1 320 €')).toBeInTheDocument()
    expect(screen.queryByText('Ajouter une vidéo format court')).not.toBeInTheDocument()
  })

  it('règle le prix d’une ligne depuis le panneau', async () => {
    renderEditor('dev-014')
    const price = screen.getByLabelText('Prix unitaire HT')
    await userEvent.clear(price)
    await userEvent.type(price, '400')
    expect(screen.getByText('1 080 €')).toBeInTheDocument()
  })

  it('lève les points bloquants, signale l’échec d’envoi puis envoie', async () => {
    renderEditor('dev-015')
    expect(screen.getByRole('button', { name: 'Envoyer au client' })).toBeDisabled()

    const catalog = screen.getByRole('combobox', { name: 'Ajouter une prestation du catalogue' })
    await userEvent.type(catalog, 'film{Enter}')
    expect(screen.getAllByText('Film de marque').length).toBeGreaterThan(0)

    await userEvent.click(screen.getByRole('button', { name: 'Choisir les 3 réalisations proposées' }))
    await userEvent.click(screen.getByRole('button', { name: /Date de tournage à proposer/ }))
    const dialog = screen.getByRole('dialog', { name: 'Proposer une date de tournage' })
    await userEvent.type(within(dialog).getByLabelText('Date du tournage'), '2026-11-05')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Proposer cette date' }))

    await userEvent.click(screen.getByRole('button', { name: 'Envoyer au client' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('paul@univers-nuisible.invalid est refusée')

    await userEvent.click(screen.getByRole('button', { name: 'Corriger l’adresse' }))
    const email = screen.getByLabelText('Email d’envoi')
    await userEvent.clear(email)
    await userEvent.type(email, 'paul@univers-nuisible.example')
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer au client' }))
    expect(await screen.findByText('Devis DEV-2026-015 envoyé à Univers Nuisible')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/devis')
  })
})
