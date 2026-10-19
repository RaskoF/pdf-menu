import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderCommercial } from '../test-utils'
import { DevisPage } from './devis-page'

const renderPage = (url = '/devis') => renderCommercial([{ path: '/devis', element: <DevisPage /> }], url)
const row = (name: string) => screen.getByRole('button', { name: new RegExp(name) }).closest('tr')!

describe('Devis', () => {
  it('affiche la liste, les cartes d’attention et filtre', async () => {
    renderPage()
    expect(screen.getByText('2 relances en retard')).toBeInTheDocument()
    expect(screen.getByText('1 devis chaud')).toBeInTheDocument()
    expect(screen.getByText('1 brouillon oublié')).toBeInTheDocument()
    expect(within(row('Mayli Spa')).getByText('pondéré 595 €')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /^Brouillons/ }))
    expect(screen.getByRole('button', { name: /^Brouillons/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByText('Mayli Spa & Beauty')).not.toBeInTheDocument()
    expect(screen.getByText('Univers Nuisible')).toBeInTheDocument()
  })

  it('ouvre le détail et relance avec le brouillon de l’assistant', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: /Mayli Spa/ }))
    expect(screen.getByTestId('location')).toHaveTextContent('devis=dev-014')
    await userEvent.click(screen.getByRole('button', { name: 'Relire et envoyer' }))
    const dialog = screen.getByRole('dialog', { name: 'Relire la relance' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Envoyer' }))
    expect(await screen.findByText('Relance envoyée à Coralie Bernard')).toBeInTheDocument()
    expect(screen.getAllByText('Relance envoyée').length).toBeGreaterThan(0)
  })

  it('demande les motifs de signature puis met à jour le statut', async () => {
    renderPage('/devis?devis=dev-013')
    await userEvent.click(screen.getByRole('button', { name: 'Plus d’actions' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Marquer signé…' }))
    const dialog = screen.getByRole('dialog', { name: /Bravo, devis gagné/ })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Réactivité' }))
    expect(within(dialog).getByRole('button', { name: 'Réactivité' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Recommandation' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByText(/Club Royalty signé, 1 500 €/)).toBeInTheDocument()
    expect(within(row('Club Royalty')).getAllByText('Signé').length).toBeGreaterThan(0)
  })

  it('exige un motif pour classer un devis en perdu', async () => {
    renderPage('/devis?devis=dev-014')
    await userEvent.click(screen.getByRole('button', { name: 'Plus d’actions' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Marquer refusé…' }))
    const dialog = screen.getByRole('dialog', { name: /Devis perdu/ })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Classer en perdu' }))
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Choisissez un motif')
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Mauvais timing' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Classer en perdu' }))
    expect(await screen.findByText(/classé en perdu : mauvais timing/)).toBeInTheDocument()
    // Annuler remet le devis dans son état précédent
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(within(row('Mayli Spa')).getAllByText('Ouvert').length).toBeGreaterThan(0)
  })

  it('montre le pipeline avec les indicateurs et déplace une carte au clavier', async () => {
    renderPage('/devis?vue=pipeline')
    expect(screen.getByText('2 350 €')).toBeInTheDocument()
    expect(screen.getByText('1 195 €')).toBeInTheDocument()
    const brouillons = screen.getByRole('list', { name: 'Devis brouillon' })
    expect(within(brouillons).getByText('Univers Nuisible')).toBeInTheDocument()
    await userEvent.click(within(brouillons).getByRole('button', { name: 'Actions pour Univers Nuisible' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'À chiffrer' }))
    expect(within(screen.getByRole('list', { name: 'Devis à chiffrer' })).getByText('Univers Nuisible')).toBeInTheDocument()
  })

  it('affiche l’analyse gagnés et perdus', async () => {
    renderPage('/devis?vue=analyse')
    expect(screen.getByText('13 signés sur 21 devis décidés')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pourquoi on perd' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Motifs de refus' })).toHaveTextContent('Trop cher')
  })
})
