// Vocabulaire des motifs de signature et de refus (anciennes maquettes « Bravo, devis gagné » et
// « Devis perdu, pourquoi ? »). Un vocabulaire fixe rend l'analyse gagnés / perdus comparable.

export const WIN_REASONS = [
  'Nos réalisations',
  'Réactivité',
  'Qualité de la proposition',
  'Prix',
  'Recommandation',
  'Rencontre en personne',
  'Offre groupée',
] as const

export const CLIENT_SOURCES = ['Recommandation', 'BNI / réseau', 'Pub Meta', 'Site web', 'Instagram', 'Prospection'] as const

export const COMPETITION = ['Aucun', '1 autre', '2 ou plus', 'Je ne sais pas'] as const

export interface LossReason {
  label: string
  /** Libellé court proposé au dépôt d'une carte dans « Refusé » */
  short?: string
}

export const LOSS_REASONS: LossReason[] = [
  { label: 'Trop cher', short: 'Budget' },
  { label: 'Budget reporté' },
  { label: 'Concurrent choisi', short: 'Concurrent' },
  { label: 'Plus de nouvelles', short: 'Sans réponse' },
  { label: 'Projet annulé' },
  { label: 'Fait en interne' },
  { label: 'Mauvais timing', short: 'Timing' },
]

export const QUICK_LOSS_REASONS = LOSS_REASONS.filter((r) => r.short)

export const LOSS_CHANGERS = ['Prix plus bas', 'Paiement en plusieurs fois', 'Délai plus court', 'Réalisations du même secteur', 'Appel avant l’envoi'] as const
