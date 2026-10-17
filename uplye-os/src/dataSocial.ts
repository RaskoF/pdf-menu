import type { SocialAccount, SocialPost } from './types'
import { daysAgo } from './utils'

// heure fixe dans n jours (n négatif = passé)
const at = (n: number, h: number, m = 0) => { const d = new Date(Date.now() + n * 86400000); d.setHours(h, m, 0, 0); return d.toISOString() }

export const SEED_SOCIAL_ACCOUNTS: SocialAccount[] = [
  { id: 'studio', instagram: '@uplyestudio', facebook: 'Uplye Studio', status: 'connected', expiresAt: at(41, 0) },
  { id: 'azurpod', instagram: '@azurpod.studio', facebook: 'Azurpod', status: 'expired', expiresAt: daysAgo(2) },
  { id: 'academy', instagram: '', facebook: '', status: 'disconnected' },
]

let i = 0
const P = (brand: SocialPost['brand'], day: number, h: number, status: SocialPost['status'], format: SocialPost['format'], caption: string, extra: Partial<SocialPost> = {}): SocialPost =>
  ({ id: `sp${++i}`, brand, networks: ['instagram', 'facebook'], format, caption, at: at(day, h, h === 18 ? 30 : 0), status, media: format === 'carrousel' ? 4 : 1, by: 'E', ...extra })

export const SEED_SOCIAL_POSTS: SocialPost[] = [
  P('studio', -15, 18, 'published', 'reel', 'Showreel 2026 🎬 Un an de tournages dans le Var, en 60 secondes.', { views: 2310 }),
  P('azurpod', -11, 12, 'published', 'reel', 'Épisode 2 de « Dune » avec Skeals est en ligne 🎙️', { views: 640, networks: ['instagram'] }),
  P('academy', -8, 18, 'published', 'carrousel', 'Lancement de la formation création de contenu : 1 journée pour filmer et monter seul.', { views: 410 }),
  P('studio', -4, 18, 'published', 'reel', 'Coulisses du tournage pour Mayli Spa & Beauty ✨', { views: 980, by: 'X' }),
  P('azurpod', -3, 12, 'published', 'reel', 'Teaser de l’épisode 3 avec Skeals', { views: 720, networks: ['instagram'] }),
  P('azurpod', -2, 19, 'failed', 'story', 'Session du jour au studio', { networks: ['instagram'] }),
  P('academy', -2, 18, 'published', 'carrousel', 'Astuce Lightroom #3 : sauver une photo sous-exposée en 3 réglages.', { views: 530 }),
  P('studio', -1, 18, 'published', 'carrousel', 'Avant / après pour l’Institut Lumière du Sud 💆‍♀️', { views: 1240 }),
  P('studio', 0, 18, 'scheduled', 'reel', 'Notre showreel 2026, version courte.'),
  P('azurpod', 1, 11, 'scheduled', 'carrousel', 'Laforêt Cuers & Toulon enregistre son premier podcast chez nous 🎙️', { by: 'X' }),
  P('academy', 3, 12, 'scheduled', 'carrousel', '5 erreurs qu’on fait tous en filmant au smartphone.'),
  P('studio', 4, 18, 'scheduled', 'reel', 'Cas client : +5 % de clics pour l’Institut Lumière du Sud.'),
  P('azurpod', 5, 18, 'scheduled', 'reel', 'Extrait de l’épisode 3 avec Skeals', { networks: ['instagram'] }),
  P('studio', 6, 18, 'draft', 'reel', 'Coulisses : tournage Mayli, partie 2', { by: 'X' }),
  P('academy', 7, 10, 'scheduled', 'story', 'Quiz : tu filmes à l’horizontale ou à la verticale ?', { networks: ['instagram'] }),
  P('academy', 10, 18, 'draft', 'reel', 'Témoignage de Théo, élève de la formation photo animalière'),
  P('studio', 12, 12, 'scheduled', 'post', 'Pack 5 vidéos pub : produisez en volume, payez moins par vidéo.'),
  P('azurpod', 13, 18, 'draft', 'reel', 'Halloween au studio 🎃'),
]
