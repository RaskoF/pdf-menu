export type Stage = 'a_chiffrer' | 'brouillon' | 'envoye' | 'ouvert' | 'signe' | 'refuse'
export type Activity = 'Studio' | 'Azurpod' | 'Academy'
export type Owner = 'E' | 'A'
export type Schedule = '40/30/30' | '50/50' | '100'

export interface Line {
  id: string
  label: string
  desc: string
  qty: number
  unitPrice: number
  discount: number // € HT déduits de la ligne
  offered: boolean
}

export interface Devis {
  id: string
  number: string // vide tant que c'est un prospect « à chiffrer »
  clientId: string
  title: string
  intro: string
  owner: Owner
  activity: Activity
  stage: Stage
  lines: Line[]
  validityDays: number
  schedule: Schedule
  createdAt: string // ISO
  sentAt?: string
  openedCount: number
  lastOpenedAt?: string
  signedAt?: string
  source?: string // ex. « Rencontré au BNI »
}

export interface Client {
  id: string
  name: string
  sector: string
  contact: { name: string; role: string; phone: string; email: string }
  address: string
  notes: string[]
  createdAt: string
}

export interface CatalogueItem {
  id: string
  label: string
  desc: string
  price: number
  activity: Activity
  unit?: 'forfait' | 'heure' | 'mois'
  hours?: number // temps interne estimé
  directCost?: number // coûts directs estimés (freelance, location…)
  archived?: boolean
}

export type Person = 'E' | 'A' | 'X' // Enzo, Allan, Alexis
export type ProjectStatus = 'preprod' | 'tournage' | 'montage' | 'review' | 'livre'
export type TaskStatus = 'todo' | 'progress' | 'review' | 'blocked' | 'done'
export type TaskType = 'Tournage' | 'Montage' | 'Admin' | 'Commercial' | 'Azurpod'

export interface Cost { id: string; label: string; amount: number }

export interface Project {
  id: string
  name: string
  clientId: string
  devisId?: string
  activity: Activity
  status: ProjectStatus
  owner: Person
  start: string
  due: string
  budget: number // CA HT du projet
  costs: Cost[] // coûts directs : freelances, location, pub…
  recurring?: boolean
}

export interface Task {
  id: string
  projectId?: string
  title: string
  assignee: Person
  status: TaskStatus
  type: TaskType
  hours: number
  due: string
  pending?: ChangeRequest
}

export interface Invoice {
  id: string
  number: string
  clientId: string
  projectId?: string
  label: string
  amountHT: number
  issuedAt: string
  dueAt: string
  paidAt?: string
  remindedAt?: string
}

export type ExpenseCategory = 'Freelances' | 'Matériel' | 'Publicité' | 'Déplacements' | 'Divers'
export interface Expense { id: string; date: string; label: string; category: ExpenseCategory; amountHT: number; projectId?: string }

export type SubCategory = 'Local' | 'Logiciels' | 'Assurance' | 'Banque & compta' | 'Marketing' | 'Télécom'
export interface Subscription { id: string; label: string; category: SubCategory; monthlyHT: number; active: boolean; note?: string }

export type Formula = 'Standard' | 'Clé en main' | 'Pré-montage'
export type BookingStatus = 'confirmee' | 'terminee' | 'annulee'
export type Deliverable = 'aucun' | 'a_monter' | 'livre'
export interface Booking {
  id: string
  clientId: string
  start: string // ISO, début de session
  hours: number
  formula: Formula
  status: BookingStatus
  deliverable: Deliverable
  packId?: string // heures décomptées d'un pack au lieu d'être facturées
  amountHT: number
  title: string
}
export interface Pack { id: string; clientId: string; label: string; hoursTotal: number; priceHT: number; expiresAt: string }

export type ContactStatus = 'a_recontacter' | 'prospect' | 'devis' | 'gagne' | 'pas_interesse'
export interface EventContact { id: string; name: string; company: string; role: string; notes: string; status: ContactStatus; clientId?: string; devisId?: string }
export type EventType = 'Networking' | 'Salon' | 'Conférence' | 'Afterwork'
export interface EventItem { id: string; name: string; type: EventType; date: string; place: string; cost: number; attendees: Person[]; contacts: EventContact[]; notes: string }

export interface Absence { id: string; from: string; to: string; label: string }
export interface Member { id: Person; email: string; phone: string; skills: string[]; contract: string; since: string; absences: Absence[] }

// Demande de modification soumise à validation d'un admin (ex. Alexis qui décale une échéance).
export interface ChangeRequest { due?: string; hours?: number; assignee?: Person; by: Person; at: string; reason?: string }
export interface Notification { id: string; at: string; to: 'admins' | Person; text: string; link: string; read: boolean; kind: 'demande' | 'info' }

export interface SopStep { id: string; text: string; detail?: string }
export interface Sop { id: string; title: string; category: 'Commercial' | 'Production' | 'Azurpod' | 'Équipe' | 'Admin'; goal: string; owner: Person; duration: string; updatedAt: string; steps: SopStep[] }
export interface SopRun { id: string; sopId: string; label: string; startedAt: string; done: string[]; by: Person }

export type ReferralReward = 'commission' | 'credit'
export interface Referral { id: string; referrerId: string; name: string; company: string; email: string; status: 'invite' | 'devis' | 'signe' | 'perdu'; amountHT: number; reward: ReferralReward; settled: boolean; createdAt: string }
