import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderProduction } from '../test-utils'
import { ProjectsPage } from './projects-page'
import { ProjectPage } from './project-page'

const routes = [
  { path: '/projets', element: <ProjectsPage /> },
  { path: '/projets/:id', element: <ProjectPage /> },
]

describe('Projets', () => {
  it('range les projets par état et filtre', async () => {
    renderProduction(routes, '/projets')
    expect(screen.getByText('5 en cours, dont 2 à surveiller. Marge projetée 54 %.')).toBeInTheDocument()
    const watch = screen.getByRole('rowheader', { name: /À surveiller/ }).closest('tbody')!
    expect(within(watch).getByText('Saison Dune, podcast')).toBeInTheDocument()
    expect(within(watch).getByText('Campagne Meta, 2 vidéos')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /^Azurpod/ }))
    expect(screen.queryByText('Vidéo pub + shooting')).not.toBeInTheDocument()
    expect(screen.getByText('Pack 10 h podcast')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /^En cours/ }))
    await userEvent.type(screen.getByLabelText('Rechercher un projet ou un client'), 'mayli')
    expect(screen.getAllByRole('link').map((l) => l.textContent)).toEqual(['Vidéo pub + shooting'])
  })

  it('coche les tâches puis passe à la phase suivante', async () => {
    renderProduction(routes, '/projets/p-mayli')
    expect(screen.getByRole('heading', { level: 1, name: 'Vidéo pub + shooting' })).toBeInTheDocument()
    for (const name of ['Script vidéo pub, accroche 3 s', 'Liste des plans et des photos', 'Préparer le matériel']) {
      await userEvent.click(screen.getByRole('checkbox', { name }))
    }
    await userEvent.click(screen.getByRole('button', { name: 'Passer à Tournage' }))
    expect(screen.getByText('Phase suivante : Tournage')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Tournage' })).toBeInTheDocument()
  })

  it('saisit du temps et recalcule la marge', async () => {
    renderProduction(routes, '/projets/p-ils')
    expect(screen.getByText(/Marge projetée 51 %/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Saisir' }))
    const dialog = screen.getByRole('dialog', { name: 'Saisir du temps' })
    const input = within(dialog).getByLabelText('Heures passées')
    await userEvent.clear(input)
    await userEvent.type(input, '2')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Ajouter 2 h' }))
    expect(screen.getByText('21 h')).toBeInTheDocument()
    expect(screen.getByText(/Marge projetée 46 %/)).toBeInTheDocument()
  })

  it('crée un projet libre et ouvre sa fiche', async () => {
    renderProduction(routes, '/projets')
    await userEvent.click(screen.getByRole('button', { name: 'Nouveau projet' }))
    const sheet = screen.getByRole('dialog', { name: 'Nouveau projet' })
    expect(within(sheet).getByText(/Aucun devis signé sans projet/)).toBeInTheDocument()
    await userEvent.click(within(sheet).getByRole('button', { name: 'Créer le projet' }))
    expect(within(sheet).getByRole('alert')).toHaveTextContent('Choisissez le client du projet.')
    await userEvent.click(within(sheet).getByRole('combobox', { name: 'Client' }))
    await userEvent.click(screen.getByRole('option', { name: 'Univers Nuisible' }))
    await userEvent.type(within(sheet).getByLabelText('Nom du projet'), 'Film de marque')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Créer le projet' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Film de marque' })).toBeInTheDocument()
    expect(screen.getByText('Projet créé : 14 tâches, équipe prévenue')).toBeInTheDocument()
  })
})
