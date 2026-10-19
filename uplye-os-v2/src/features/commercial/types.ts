// Modèle de données du module Commercial (devis, clients, événements, réunions).
// Les montants sont en euros HT, les dates au format ISO (AAAA-MM-JJ).

export type DevisStatus = 'a_chiffrer' | 'brouillon' | 'envoye' | 'ouvert' | 'signe' | 'refuse' | 'archive'
/** Étapes affichées dans le pipeline, dans l'ordre */
export type PipelineStatus = Exclude<DevisStatus, 'refuse' | 'archive'>
export type Brand = 'studio' | 'azurpod' | 'academy'
export type MemberId = 'EN' | 'AL' | 'AX'

export interface Member {
  id: MemberId
  name: string
}

export interface DevisLine {
  id: string
  title: string
  description: string
  qty: number
  /** Prix unitaire catalogue HT */
  unitPrice: number
  /** Remise accordée sur la ligne, en euros */
  discount: number
  /** Coût interne estimé de la ligne */
  cost: number
  /** Heures internes, pour expliquer le coût (heures × taux) */
  hours?: number
  offered: boolean
  showDiscount: boolean
  optional: boolean
}

export type SectionId = 'couverture' | 'projet' | 'prestations' | 'realisations' | 'echeancier' | 'deroule' | 'conditions' | 'temoignage'

export interface DevisSection {
  id: SectionId
  label: string
  done: boolean
  /** Section masquée dans la proposition envoyée */
  hidden: boolean
}

export type ActivityKind = 'view' | 'mail' | 'meeting' | 'sent' | 'signed' | 'refused' | 'payment' | 'delivered' | 'note' | 'created'

export interface Activity {
  id: string
  kind: ActivityKind
  title: string
  detail: string
  /** Libellé déjà formaté (« il y a 2 h », « 14 oct. ») */
  when: string
}

export type SuggestionEffect = { type: 'add_line'; line: Omit<DevisLine, 'id'> } | { type: 'schedule'; schedule: number[] }

export interface Suggestion {
  id: string
  title: string
  from: string
  to: string
  quote: string
  effect: SuggestionEffect
}

export interface WinDetails {
  reasons: string[]
  source?: string
  competitors?: string
  quote?: string
}

export interface LossDetails {
  reason: string
  competitor?: string
  price?: string
  changers: string[]
  remindIn3Months: boolean
}

export interface Devis {
  id: string
  /** Numéro attribué à la création, ex. DEV-2026-014 */
  number: string
  clientId: string
  title: string
  status: DevisStatus
  brand: Brand
  owner: MemberId
  /** Sans lignes chiffrées, le montant s'affiche « Sur devis » */
  lines: DevisLine[]
  sections: DevisSection[]
  /** Échéancier en pourcentages, ex. [40, 30, 30] */
  schedule: number[]
  /** Remise commerciale globale, en euros ou en pourcentage du total des lignes */
  globalDiscount?: { mode: 'eur' | 'pct'; value: number }
  createdAt: string
  editedAt: string
  sentAt?: string
  expiresAt?: string
  signedAt?: string
  decidedAt?: string
  views: number
  lastViewed?: string
  /** Origine du prospect, affichée sur la carte « À chiffrer » (« Rencontré au BNI ») */
  origin?: string
  /** Source du client, au sens de l'analyse (« BNI / réseau ») */
  source?: string
  nextAction: string
  /** Relance mise en pause jusqu'à une date (ex. « recontacter en janvier ») */
  snoozed?: boolean
  /** Proposition de date de tournage (point bloquant de la checklist) */
  shootingDate?: string
  paymentNote?: string
  /** Relances automatiques après envoi (onglet « Relances » de l'éditeur) */
  reminders?: { afterDays3: boolean; afterDays7: boolean; beforeExpiry: boolean }
  /** Réalisations jointes à la proposition (section « Nos réalisations ») */
  showcase?: string[]
  assistantDrafts: string[]
  suggestions: Suggestion[]
  activity: Activity[]
  win?: WinDetails
  loss?: LossDetails
}

export type ClientStatus = 'actif' | 'prospect' | 'relancer' | 'perdu'

export interface Contact {
  id: string
  name: string
  initials: string
  role: string
  email: string
  phone: string
  primary?: boolean
}

export type ClientActivityKind = 'meeting' | 'view' | 'payment' | 'delivered' | 'signed' | 'note' | 'mail'

export interface ClientActivity {
  id: string
  kind: ClientActivityKind
  title: string
  detail: string
  date: string
  /** Échange avec le client (filtre « Échanges ») ou événement lié aux devis (filtre « Devis ») */
  category: 'echange' | 'devis'
}

export interface ClientProject {
  id: string
  title: string
  tag: string
  progress: number
  detail: string
}

export interface ClientFile {
  id: string
  name: string
  size: string
  date: string
}

export interface Invoice {
  id: string
  number: string
  amount: number
  status: 'payee' | 'en_attente' | 'en_retard'
  date: string
}

export interface Client {
  id: string
  name: string
  initials: string
  contactName: string
  city: string
  sector: string
  status: ClientStatus
  revenue12m: number
  revenueNote: string
  lastExchange: { label: string; date: string }
  /** « Coralie Ferrero, gérante. La Garde (83). Client depuis septembre 2026, via le BNI. » */
  summary?: string
  sectorTag?: string
  margin?: number
  paymentDelay?: string
  nextMilestone?: { title: string; detail: string }
  contacts: Contact[]
  pinned: string[]
  projects: ClientProject[]
  invoices: Invoice[]
  files: ClientFile[]
  activity: ClientActivity[]
}

export type EventType = 'Salon' | 'Club' | 'Afterwork' | 'BNI' | 'CCI'

export interface CommercialEvent {
  id: string
  name: string
  detail: string
  date: string
  cost: number
  contacts: number
  devis: number
  signed: number
  revenue: number
}

export interface UpcomingEvent {
  id: string
  date: string
  name: string
  detail: string
  type: EventType
  cost: number
  goal: number
  attendees: MemberId[]
  scanCards: boolean
  followUp: boolean
}

export interface MetContact {
  id: string
  name: string
  need: string
  followedUp: boolean
  message: string
}

export interface MeetingAction {
  id: string
  label: string
  owner: MemberId
  due: string
  taskCreated: boolean
}

export interface Meeting {
  id: string
  title: string
  clientId?: string
  /** « Institut Lumière du Sud » ou « Interne » */
  company: string
  initials: string
  kind: 'client' | 'interne'
  date: string
  time: string
  duration: number
  platform: string
  /** Initiales des participants */
  participants: string[]
  summary: string
  highlights: string[]
  actions: MeetingAction[]
  impact?: { title: string; from: string; to: string; quote: string; applied?: boolean; dismissed?: boolean }
  moments: { t: string; label: string }[]
  /** Besoin et budget détectés : point de départ « Depuis le RDV » d'un nouveau devis */
  quoteStart?: { lines: string[]; budget: number }
  transcript: { t: string; speaker: string; text: string }[]
  treated: boolean
}

/** Devis décidé (gagné ou perdu) avant la période affichée : alimente l'analyse gagnés / perdus. */
export interface DecidedDeal {
  id: string
  client: string
  amount: number
  outcome: 'gagne' | 'perdu'
  decidedAt: string
  owner: MemberId
  brand: Brand
  source: string
  win?: WinDetails
  loss?: LossDetails
}
