// Données FICTIVES de démonstration (aucun vrai client) : reprises des maquettes Figma.
import type { SidebarUser } from '@/components/app/sidebar'

export const CURRENT_USER: SidebarUser = { name: 'Enzo Navarro', role: 'Admin', initials: 'EN' }

/** Compteurs affichés dans la barre latérale, par route */
export const NAV_COUNTS: Partial<Record<string, number>> = { '/kanban': 12, '/devis': 3 }
