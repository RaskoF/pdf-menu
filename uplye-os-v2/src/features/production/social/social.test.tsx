import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { freshProduction, renderProduction } from '../test-utils'
import { SocialPage } from './social-page'
import { PostEditorRoute } from './post-editor-page'

const routes = [
  { path: '/reseaux-sociaux', element: <SocialPage /> },
  { path: '/reseaux-sociaux/post/:id', element: <PostEditorRoute /> },
]

describe('Réseaux sociaux', () => {
  it('signale le compte déconnecté et débloque après reconnexion', async () => {
    renderProduction(routes, '/reseaux-sociaux')
    expect(screen.getByText('Semaine du 19 oct. : 4 programmés, 1 bloqué, 2 brouillons.')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Instagram Azurpod est déconnecté depuis le 15 oct.')
    await userEvent.click(screen.getByRole('button', { name: 'Reconnecter le compte' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('Semaine du 19 oct. : 5 programmés, 0 bloqué, 2 brouillons.')).toBeInTheDocument()
  })

  it('affiche l’état vide sans compte connecté', () => {
    const data = freshProduction()
    data.accounts = data.accounts.map((a) => ({ ...a, connected: false }))
    renderProduction(routes, '/reseaux-sociaux', data)
    expect(screen.getByText('Aucun compte connecté')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nouveau post' })).toBeDisabled()
  })

  it('valide puis programme un nouveau post', async () => {
    renderProduction(routes, '/reseaux-sociaux/post/nouveau?date=2026-10-24')
    await userEvent.click(screen.getByRole('button', { name: /Programmer/ }))
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Écrivez une légende.')
    expect(alert).toHaveTextContent('Ajoutez au moins un média.')
    await userEvent.type(screen.getByLabelText('Légende'), 'Nouveau studio, nouvelles lumières.')
    await userEvent.click(screen.getByRole('button', { name: 'Depuis un projet' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Saison Dune/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Programmer sam. 24 à 18:30' }))
    expect(await screen.findByText(/Post programmé samedi 24 octobre à 18:30/)).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/reseaux-sociaux')
    expect(screen.getByText('Nouveau studio, nouvelles lumières')).toBeInTheDocument()
  })

  it('renvoie une publication refusée par LinkedIn', async () => {
    const failed = freshProduction().posts.find((p) => p.status === 'echec')!
    renderProduction(routes, `/reseaux-sociaux/post/${failed.id}`)
    expect(screen.getByRole('alert')).toHaveTextContent('LinkedIn a refusé la publication')
    expect(screen.queryByRole('button', { name: /Programmer/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Compresser et renvoyer' }))
    expect(screen.queryByText('LinkedIn a refusé la publication')).not.toBeInTheDocument()
    expect(screen.getByText('Publié')).toBeInTheDocument()
  })
})
