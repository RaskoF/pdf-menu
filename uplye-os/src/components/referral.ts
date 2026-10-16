import type { Referral } from '../types'

export const REWARD_RATE = { commission: 0.05, credit: 0.1 } as const
export const rewardOf = (r: Referral) => Math.round(r.amountHT * REWARD_RATE[r.reward])
export const REF_STATUS: Record<Referral['status'], { label: string; cls: string }> = {
  invite: { label: 'Recommandé', cls: 'bg-hover text-ink' },
  devis: { label: 'Devis en cours', cls: 'bg-b1 text-b7' },
  signe: { label: 'Signé', cls: 'bg-g1 text-g7' },
  perdu: { label: 'Non signé', cls: 'bg-r1 text-r7' },
}
// code lisible dérivé du nom (prototype) ; en prod : code aléatoire stocké côté serveur
export const referralCode = (name: string) =>
  'UPLYE-' + name.normalize('NFD').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 6)
