import { formatEur } from '@/lib/format'
import { QUICK_LOSS_REASONS } from './reasons'
import { daysBetween, devisAmount, formatShortDate, isStaleDraft, STATUS_LABEL, weightedAmount } from './lib'
import type { Devis } from './types'

// Libellés dérivés d'un devis, partagés par la liste, le pipeline et le panneau de détail.

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

/** « DEV-2026-014, vidéo pub + shooting + campagne » ou « Brouillon, vidéo de marque » */
export function devisSubtitle(d: Devis) {
  if (d.status === 'a_chiffrer' || d.status === 'brouillon' || !d.number) return `${STATUS_LABEL[d.status]}, ${lowerFirst(d.title)}`
  return `${d.number}, ${lowerFirst(d.title)}`
}

export const amountLabel = (d: Devis) => {
  const amount = devisAmount(d)
  return amount === null ? 'Sur devis' : formatEur(amount)
}

const shortLoss = (reason: string) => QUICK_LOSS_REASONS.find((r) => r.label === reason)?.short ?? reason

/** Ligne secondaire sous le montant */
export function amountNote(d: Devis) {
  switch (d.status) {
    case 'a_chiffrer':
    case 'brouillon':
      return devisAmount(d) === null ? 'à chiffrer' : 'non envoyé'
    case 'envoye':
    case 'ouvert':
      return `pondéré ${formatEur(weightedAmount(d))}`
    case 'signe':
      return d.paymentNote ?? 'signé'
    case 'refuse':
      return d.loss ? `motif : ${shortLoss(d.loss.reason).toLowerCase()}` : 'refusé'
    case 'archive':
      return 'sans suite'
  }
}

/** Indice affiché sur la carte du pipeline, avec son ton */
export function cardHint(d: Devis): { label: string; tone: 'muted' | 'warning' | 'success' } {
  switch (d.status) {
    case 'a_chiffrer':
      return { label: d.origin ?? 'Nouveau prospect', tone: 'muted' }
    case 'brouillon':
      return { label: 'Non envoyé', tone: 'muted' }
    case 'envoye':
      return { label: 'Pas encore ouvert', tone: 'muted' }
    case 'ouvert':
      return { label: `${d.views} vue${d.views > 1 ? 's' : ''}${d.lastViewed ? `, ${d.lastViewed}` : ''}`, tone: d.views >= 3 ? 'warning' : 'muted' }
    case 'signe':
      return { label: d.signedAt ? `Signé le ${formatShortDate(d.signedAt)}` : 'Signé', tone: 'success' }
    default:
      return { label: STATUS_LABEL[d.status], tone: 'muted' }
  }
}

/** Ancienneté affichée sur la carte (jours depuis la dernière étape), en retard si brouillon oublié */
export function cardAge(d: Devis, now: Date): { days: number; late: boolean } | null {
  if (d.status === 'signe' || d.status === 'refuse' || d.status === 'archive') return null
  const from = d.status === 'a_chiffrer' ? d.createdAt : d.status === 'brouillon' ? d.editedAt : (d.sentAt ?? d.editedAt)
  return { days: Math.max(0, daysBetween(from, now)), late: isStaleDraft(d, now) }
}
