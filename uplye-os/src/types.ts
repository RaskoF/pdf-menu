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
}
