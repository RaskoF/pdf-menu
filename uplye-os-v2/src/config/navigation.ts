import type { Icon } from '@phosphor-icons/react'
import {
  BookOpen, Buildings, CalendarBlank, ChartLineUp, FileText, Folder, Gauge, Handshake, Kanban, Microphone, ShareNetwork, SquaresFour, Tag, Users,
} from '@phosphor-icons/react'

// Source unique de la navigation (barre latérale + routes). Ordre et libellés : Figma « Sidebar » (14:147).
export interface NavItem {
  label: string
  to: string
  icon: Icon
  /** Écran déjà développé dans la v2 */
  ready?: boolean
}
export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Pilotage',
    items: [
      { label: 'Aujourd’hui', to: '/', icon: SquaresFour, ready: true },
      { label: 'Planning', to: '/planning', icon: CalendarBlank },
      { label: 'Kanban', to: '/kanban', icon: Kanban },
      { label: 'Charge équipe', to: '/charge', icon: Gauge },
    ],
  },
  {
    label: 'Commercial',
    items: [
      { label: 'Devis', to: '/devis', icon: FileText },
      { label: 'Clients', to: '/clients', icon: Buildings },
      { label: 'Événements', to: '/evenements', icon: Handshake },
    ],
  },
  {
    label: 'Production',
    items: [
      { label: 'Projets', to: '/projets', icon: Folder },
      { label: 'Azurpod', to: '/azurpod', icon: Microphone },
      { label: 'Réseaux sociaux', to: '/reseaux-sociaux', icon: ShareNetwork },
    ],
  },
  {
    label: 'Admin',
    items: [
      { label: 'Équipe', to: '/equipe', icon: Users },
      { label: 'Process', to: '/process', icon: BookOpen },
      { label: 'Catalogue', to: '/catalogue', icon: Tag },
      { label: 'Finance', to: '/finance', icon: ChartLineUp },
    ],
  },
]

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items)
