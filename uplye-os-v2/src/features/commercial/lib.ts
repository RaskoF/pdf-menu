import type { BadgeProps } from '@/components/ui'
import { daysBetween, formatShortDate } from '@/lib/dates'
import type { ClientStatus, Devis, DevisLine, DevisStatus, PipelineStatus } from './types'

// Règles métier pures (sans React) : faciles à tester et à reprendre côté serveur.

export const TVA_RATE = 0.2
export const HOURLY_COST = 45

export const STATUS_LABEL: Record<DevisStatus, string> = {
  a_chiffrer: 'À chiffrer',
  brouillon: 'Brouillon',
  envoye: 'Envoyé',
  ouvert: 'Ouvert',
  signe: 'Signé',
  refuse: 'Refusé',
  archive: 'Archivé',
}

export const STATUS_BADGE: Record<DevisStatus, BadgeProps['variant']> = {
  a_chiffrer: 'secondary',
  brouillon: 'secondary',
  envoye: 'secondary',
  ouvert: 'blue',
  signe: 'green',
  refuse: 'red',
  archive: 'outline',
}

/** Probabilité de signature associée à chaque étape (en-têtes du pipeline) */
export const STATUS_PROBABILITY: Record<PipelineStatus, number> = { a_chiffrer: 0.1, brouillon: 0.2, envoye: 0.4, ouvert: 0.7, signe: 1 }

export const PIPELINE_STATUSES: PipelineStatus[] = ['a_chiffrer', 'brouillon', 'envoye', 'ouvert', 'signe']

export const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = { actif: 'Client actif', prospect: 'Prospect', relancer: 'À relancer', perdu: 'Perdu' }
export const CLIENT_STATUS_BADGE: Record<ClientStatus, BadgeProps['variant']> = { actif: 'green', prospect: 'blue', relancer: 'orange', perdu: 'secondary' }

/** Montant net d'une ligne : quantité × prix − remise, 0 si offerte. */
export const lineNet = (line: DevisLine) => (line.offered ? 0 : Math.max(0, line.qty * line.unitPrice - line.discount))

/** Marge d'une ligne en fraction (0,62 = 62 %), null si la ligne ne rapporte rien. */
export const lineMargin = (line: DevisLine) => {
  const net = lineNet(line)
  return net > 0 ? (net - line.cost) / net : null
}

/** Au-delà de cette part du total, la remise est signalée (décision du 19 oct., docs/REPRISE.md) */
export const DISCOUNT_ALERT = 0.2

export function devisTotals(devis: Pick<Devis, 'lines' | 'globalDiscount'>) {
  const lines = devis.lines.filter((l) => !l.optional)
  const gross = lines.reduce((s, l) => s + (l.offered ? 0 : l.qty * l.unitPrice), 0)
  const linesNet = lines.reduce((s, l) => s + lineNet(l), 0)
  const g = devis.globalDiscount
  const globalAmount = g ? Math.min(linesNet, Math.round(g.mode === 'pct' ? (linesNet * g.value) / 100 : g.value)) : 0
  const ht = linesNet - globalAmount
  const cost = lines.reduce((s, l) => s + l.cost, 0)
  const tva = Math.round(ht * TVA_RATE)
  const discount = gross - ht
  return {
    gross,
    globalAmount,
    discount,
    discountRate: gross > 0 ? discount / gross : 0,
    ht,
    tva,
    ttc: ht + tva,
    cost,
    margin: ht > 0 ? (ht - cost) / ht : null,
  }
}

/** Montant HT, ou null tant que rien n'est chiffré (« Sur devis »). */
export const devisAmount = (devis: Pick<Devis, 'lines' | 'globalDiscount'>) => (devis.lines.some((l) => l.unitPrice > 0) ? devisTotals(devis).ht : null)

export const probabilityOf = (status: DevisStatus) => (status in STATUS_PROBABILITY ? STATUS_PROBABILITY[status as PipelineStatus] : 0)

export const weightedAmount = (devis: Devis) => Math.round((devisAmount(devis) ?? 0) * probabilityOf(devis.status))

export const isOpen = (status: DevisStatus) => status === 'envoye' || status === 'ouvert'

// Dates : utilitaires partagés, réexportés pour les écrans du module
export { addDays, dateBadge, daysBetween, formatShortDate, monthLabel, toIso } from '@/lib/dates'

/** « 54 % » */
export const formatPercent = (fraction: number) => `${Math.round(fraction * 100)} %`

/** Relance due : envoyé ou ouvert depuis plus de 3 jours, sans relance programmée plus tard. */
export const needsFollowUp = (devis: Devis, now: Date) => isOpen(devis.status) && !devis.snoozed && !!devis.sentAt && daysBetween(devis.sentAt, now) > 3

/** Devis chaud : ouvert au moins 3 fois. */
export const isHot = (devis: Devis) => devis.status === 'ouvert' && devis.views >= 3 && !devis.snoozed

/** Brouillon oublié : pas modifié depuis plus de 5 jours. */
export const isStaleDraft = (devis: Devis, now: Date) => devis.status === 'brouillon' && daysBetween(devis.editedAt, now) > 5

/** Points de la checklist « Prêt à envoyer », dans l'ordre de la maquette. */
export function readiness(devis: Devis, contactEmail: string | undefined) {
  const section = (id: string) => devis.sections.find((s) => s.id === id)
  const items = [
    { id: 'client', label: 'Client et contact', ok: !!contactEmail },
    { id: 'prestations', label: 'Prestations chiffrées', ok: devis.lines.some((l) => l.unitPrice > 0) },
    { id: 'echeancier', label: `Échéancier ${devis.schedule.join(' / ')}`, ok: devis.schedule.reduce((a, b) => a + b, 0) === 100 },
    { id: 'realisations', label: 'Réalisations choisies', ok: !!section('realisations')?.done },
    {
      id: 'tournage',
      label: devis.shootingDate ? `Tournage proposé le ${formatShortDate(devis.shootingDate)}` : 'Date de tournage à proposer',
      ok: !!devis.shootingDate,
    },
  ]
  return { items, done: items.filter((i) => i.ok).length, blocking: items.filter((i) => !i.ok) }
}
