import type { MemberId } from '@/data/session'

// Modèle de données du module Production (projets, studio Azurpod, réseaux sociaux).
// Dates au format ISO court (AAAA-MM-JJ), heures « HH:MM », montants en euros HT.

export type ProductionBrand = 'studio' | 'azurpod' | 'academy'

export interface ProjectTask {
  id: string
  label: string
  owner: MemberId
  due: string
  done: boolean
}

export interface ProjectPhase {
  id: string
  label: string
  start: string
  end: string
  tasks: ProjectTask[]
}

export type DeliverableStatus = 'a_venir' | 'en_cours' | 'chez_client' | 'valide'

export interface Deliverable {
  id: string
  title: string
  detail: string
  kind: 'document' | 'liste' | 'video' | 'photos' | 'audio'
  status: DeliverableStatus
}

export interface ClientWaitingItem {
  id: string
  title: string
  detail: string
}

export interface Project {
  id: string
  title: string
  clientId: string
  brand: ProductionBrand
  devisId?: string
  devisNumber?: string
  pilot: MemberId
  /** Process suivi (« Vidéo pub, 6 phases ») */
  process: string
  phases: ProjectPhase[]
  /** Index de la phase en cours ; égal au nombre de phases quand le projet est livré */
  currentPhase: number
  due: string
  /** Précision sous l'échéance (« envoi ép. 3 bloqué ») */
  dueNote?: string
  blocked?: string
  shootingDate?: string
  revenue: number
  hoursSold: number
  hoursSpent: number
  /** Marge attendue au budget temps vendu (fraction) ; null pour un pack prépayé */
  plannedMargin: number | null
  revisions: { used: number; included: number } | null
  deliveredAt?: string
  clientWaiting: ClientWaitingItem[]
  /** « Préparation du tournage : 1 point sur 3 coché dans son espace » */
  clientChecklist?: { done: number; total: number; label: string }
  deliverables: Deliverable[]
  clientSpace: boolean
}

export type SessionFormula = 'standard' | 'premontage' | 'cle_en_main' | 'pack'

export interface StudioSession {
  id: string
  clientId?: string
  label: string
  date: string
  start: string
  end: string
  formula: SessionFormula
  /** Créneau posé mais pas encore confirmé par le client */
  option?: boolean
}

export type DeliveryStatus = 'bloque' | 'a_monter' | 'en_montage' | 'livre'

export interface StudioDelivery {
  id: string
  title: string
  detail: string
  recordedAt: string
  formula: Exclude<SessionFormula, 'pack'>
  /** Délai promis en jours ouvrés */
  promiseDays: number
  status: DeliveryStatus
  blockedReason?: string
  blockedSince?: string
  deliveredAt?: string
  clientId?: string
}

export interface StudioPack {
  id: string
  clientId: string
  label: string
  unit: 'h' | 'épisodes'
  used: number
  total: number
  next: string
}

export type Network = 'instagram' | 'facebook' | 'linkedin'
export type PostFormat = 'post' | 'carrousel' | 'reel' | 'story'
export type PostStatus = 'brouillon' | 'programme' | 'publie' | 'echec'

export interface SocialAccount {
  brand: ProductionBrand
  network: Network
  handle: string
  followers: number
  connected: boolean
  disconnectedSince?: string
}

export interface SocialPost {
  id: string
  brand: ProductionBrand
  format: PostFormat
  title: string
  caption: string
  networks: Network[]
  date?: string
  time?: string
  status: PostStatus
  media: number
  /** Projet d'où viennent les médias */
  sourceProjectId?: string
  failure?: { network: Network; reason: string }
}
