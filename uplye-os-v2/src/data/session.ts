// Données FICTIVES de démonstration (aucun vrai client) : reprises des maquettes Figma.
import type { SidebarUser } from '@/components/app/sidebar'

export const CURRENT_USER: SidebarUser = { name: 'Enzo Navarro', role: 'Admin', initials: 'EN' }

/** Compteurs affichés dans la barre latérale, par route */
export const NAV_COUNTS: Partial<Record<string, number>> = { '/kanban': 12, '/devis': 3 }

/** Équipe : Enzo et Allan sont admins, Alexis (« AX ») est en production */
export type MemberId = 'EN' | 'AL' | 'AX'
export const TEAM: { id: MemberId; name: string; fullName: string }[] = [
  { id: 'EN', name: 'Enzo', fullName: 'Enzo Navarro' },
  { id: 'AL', name: 'Allan', fullName: 'Allan Petit' },
  { id: 'AX', name: 'Alexis', fullName: 'Alexis' },
]
export const memberName = (id: string) => TEAM.find((m) => m.id === id)?.name ?? id

/** Date de référence de la démo : retards, « il y a » et semaines affichées en dépendent. */
export const DEMO_NOW = new Date('2026-10-19T09:00:00')
