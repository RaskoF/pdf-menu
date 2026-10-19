import type { BadgeProps } from '@/components/ui'
import { addDays, daysBetween, hourOf, startOfWeek, toIso } from '@/lib/dates'
import { FORMULA_RATE } from './mock-data'
import type {
  DeliverableStatus,
  DeliveryStatus,
  Network,
  PostFormat,
  PostStatus,
  ProductionBrand,
  Project,
  SocialAccount,
  SocialPost,
  StudioPack,
  StudioSession,
} from './types'

// Règles métier du module Production, sans React : testables et réutilisables côté serveur.

export const BRAND_LABEL: Record<ProductionBrand, string> = { studio: 'Uplye Studio', azurpod: 'Azurpod', academy: 'Academy' }
export const NETWORK_LABEL: Record<Network, string> = { instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn' }
export const FORMAT_LABEL: Record<PostFormat, string> = { post: 'Post', carrousel: 'Carrousel', reel: 'Reel', story: 'Story' }
/** Longueur maximale d'une légende par réseau */
export const CAPTION_LIMIT: Record<Network, number> = { instagram: 2200, facebook: 63206, linkedin: 3000 }

export const DELIVERABLE_BADGE: Record<DeliverableStatus, { label: string; variant: BadgeProps['variant'] }> = {
  a_venir: { label: 'À venir', variant: 'outline' },
  en_cours: { label: 'En cours', variant: 'secondary' },
  chez_client: { label: 'Chez le client', variant: 'blue' },
  valide: { label: 'Validé', variant: 'green' },
}

export const DELIVERY_BADGE: Record<DeliveryStatus, { label: string; variant: BadgeProps['variant'] }> = {
  bloque: { label: 'Bloqué', variant: 'red' },
  a_monter: { label: 'À monter', variant: 'secondary' },
  en_montage: { label: 'En montage', variant: 'blue' },
  livre: { label: 'Livré', variant: 'green' },
}

/* ---------- Projets ---------- */

export const isDelivered = (p: Project) => p.currentPhase >= p.phases.length

/** Coût interne d'une heure, déduit de la marge prévue au budget temps vendu */
const hourlyCost = (p: Project) => (p.plannedMargin === null || p.hoursSold === 0 ? 0 : ((1 - p.plannedMargin) * p.revenue) / p.hoursSold)

/** Marge projetée : le temps compté est le plus grand du temps vendu et du temps passé */
export const projectedMargin = (p: Project) =>
  p.plannedMargin === null || p.revenue === 0 ? null : 1 - (hourlyCost(p) * Math.max(p.hoursSold, p.hoursSpent)) / p.revenue

/** Heures au-delà desquelles la marge passe sous le seuil (40 % par défaut) */
export const hoursBeforeMarginFloor = (p: Project, floor = 0.4) => {
  const cost = hourlyCost(p)
  return cost > 0 ? Math.floor(((1 - floor) * p.revenue) / cost) : null
}

/** Raisons de surveiller un projet : blocage, budget temps dépassé, révisions épuisées, échéance passée */
export function watchReasons(p: Project, now: Date) {
  if (isDelivered(p)) return []
  const reasons: string[] = []
  if (p.blocked) reasons.push(p.blocked)
  if (p.hoursSpent > p.hoursSold) reasons.push(`Budget temps dépassé de ${p.hoursSpent - p.hoursSold} h`)
  if (p.revisions && p.revisions.used >= p.revisions.included) reasons.push('Révisions incluses épuisées')
  if (daysBetween(p.due, now) > 0) reasons.push('Échéance dépassée')
  return reasons
}

/** « aujourd’hui », « dans 12 jours », « il y a 3 jours » */
export function relativeDay(iso: string, now: Date) {
  const d = -daysBetween(iso, now)
  if (d === 0) return 'aujourd’hui'
  if (d === 1) return 'demain'
  if (d > 0) return `dans ${d} jours`
  return d === -1 ? 'hier' : `il y a ${-d} jours`
}

/* ---------- Studio Azurpod ---------- */

export const sessionHours = (s: Pick<StudioSession, 'start' | 'end'>) => hourOf(s.end) - hourOf(s.start)
export const sessionPrice = (s: StudioSession) => (s.formula === 'pack' ? 0 : Math.round(FORMULA_RATE[s.formula] * sessionHours(s)))

export const STUDIO_OPEN = 9
export const STUDIO_CLOSE = 19
const DAY_HOURS = STUDIO_CLOSE - STUDIO_OPEN

/** Jours ouvrés (lundi → vendredi) de la semaine qui contient la date */
export const weekDays = (iso: string) => Array.from({ length: 5 }, (_, i) => addDays(startOfWeek(iso), i))

export const occupancy = (sessions: StudioSession[], days: string[]) => {
  const hours = sessions.filter((s) => days.includes(s.date) && !s.option).reduce((h, s) => h + sessionHours(s), 0)
  return { hours, capacity: days.length * DAY_HOURS, rate: days.length ? hours / (days.length * DAY_HOURS) : 0 }
}

/** Créneaux d'une heure libres, à partir de maintenant, sur les jours donnés */
export function freeSlots(sessions: StudioSession[], days: string[], now: Date, duration = 1) {
  const today = toIso(now)
  return days
    .filter((d) => d >= today)
    .map((date) => {
      const taken = sessions.filter((s) => s.date === date).map((s) => [hourOf(s.start), hourOf(s.end)] as const)
      const slots: string[] = []
      for (let h = 10; h + duration <= STUDIO_CLOSE - 1; h++) {
        if (date === today && h <= now.getHours()) continue
        if (taken.every(([a, b]) => h + duration <= a || h >= b)) slots.push(`${String(h).padStart(2, '0')}:00`)
      }
      return { date, slots }
    })
    .filter((d) => d.slots.length > 0)
}

/** Échéance promise d'une livraison : date d'enregistrement + délai en jours ouvrés */
export function promisedDate(recordedAt: string, promiseDays: number) {
  let date = recordedAt
  let left = promiseDays
  while (left > 0) {
    date = addDays(date, 1)
    const day = new Date(`${date}T12:00:00`).getDay()
    if (day !== 0 && day !== 6) left--
  }
  return date
}

export const packLeft = (pack: StudioPack) => pack.total - pack.used

/* ---------- Réseaux sociaux ---------- */

export const accountFor = (accounts: SocialAccount[], brand: ProductionBrand, network: Network) =>
  accounts.find((a) => a.brand === brand && a.network === network)

/** Statut affiché : un post programmé sur un compte déconnecté est bloqué */
export function displayStatus(post: SocialPost, accounts: SocialAccount[]): PostStatus | 'bloque' {
  if (post.status === 'programme' && post.networks.some((n) => accountFor(accounts, post.brand, n)?.connected === false)) return 'bloque'
  return post.status
}

export const POST_STATUS_BADGE: Record<PostStatus | 'bloque', { label: string; variant: BadgeProps['variant'] }> = {
  brouillon: { label: 'Brouillon', variant: 'secondary' },
  programme: { label: 'Programmé', variant: 'blue' },
  publie: { label: 'Publié', variant: 'green' },
  bloque: { label: 'Bloqué', variant: 'red' },
  echec: { label: 'Échec partiel', variant: 'red' },
}

export const captionLimit = (networks: Network[]) => (networks.length ? Math.min(...networks.map((n) => CAPTION_LIMIT[n])) : CAPTION_LIMIT.instagram)

const FILLERS = /\b(vraiment|très|un peu|tout simplement|en fait|juste)\s+/gi
const HASHTAGS: Record<ProductionBrand, string> = {
  studio: '#vidéo #toulon #var #marketinglocal',
  azurpod: '#podcast #studio #toulon #azurpod',
  academy: '#formation #montagevidéo #créateurs',
}

/** Réécritures proposées sous la légende */
export const rewrite = {
  /** Garde la première phrase de chaque paragraphe */
  shorter: (text: string) =>
    text
      .split(/\n\n+/)
      .map((p) => p.match(/^[^.!?]*[.!?]/)?.[0] ?? p)
      .join('\n\n'),
  /** Retire les mots de remplissage */
  direct: (text: string) => text.replace(FILLERS, '').replace(/ {2,}/g, ' '),
  hashtags: (text: string, brand: ProductionBrand) => (text.includes('#') ? text : `${text.trimEnd()}\n\n${HASHTAGS[brand]}`),
}
