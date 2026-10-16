import type { Expense, ExpenseCategory, Invoice, Project, Subscription, Task } from './types'
import { daysAgo, daysFromNow, lastMonths } from './utils'

// Données fictives de démonstration pour la gestion de projet et la finance.
let n = 0
const id = (p: string) => `${p}${++n}`

export const SEED_PROJECTS: Project[] = [
  { id: 'p1', name: 'Vidéo + photos fait-maison', clientId: 'cl1', devisId: 'd6', activity: 'Studio', status: 'livre', owner: 'E', start: daysAgo(20), due: daysAgo(4), budget: 1000,
    costs: [{ id: 'k1', label: 'Freelance cadreur (½ journée)', amount: 180 }] },
  { id: 'p2', name: 'Pack studio podcast', clientId: 'cl6', devisId: 'd7', activity: 'Azurpod', status: 'tournage', owner: 'A', start: daysAgo(14), due: daysFromNow(30), budget: 648, costs: [] },
  { id: 'p3', name: 'Contenus mensuels', clientId: 'cl5', devisId: 'd9', activity: 'Studio', status: 'montage', owner: 'A', start: daysAgo(58), due: daysFromNow(32), budget: 4200, recurring: true,
    costs: [{ id: 'k2', label: 'Drone (location)', amount: 120 }, { id: 'k3', label: 'Musiques sous licence', amount: 45 }] },
  { id: 'p4', name: 'Captation conférence annuelle', clientId: 'cl8', activity: 'Studio', status: 'preprod', owner: 'E', start: daysAgo(3), due: daysFromNow(21), budget: 1800,
    costs: [{ id: 'k4', label: 'Second cadreur', amount: 350 }] },
  { id: 'p5', name: 'Campagne Meta · mandats exclusifs', clientId: 'cl6', activity: 'Studio', status: 'review', owner: 'E', start: daysAgo(25), due: daysFromNow(6), budget: 1250,
    costs: [{ id: 'k5', label: 'Budget pub avancé', amount: 300 }] },
]

// échéance en jours ouvrés depuis le lundi de la semaine en cours (0 à 4 = cette semaine, 7 à 11 = la suivante)
function wd(n: number) {
  const d = new Date(); d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + n)
  return d.toISOString()
}
const T = (projectId: string | undefined, title: string, assignee: Task['assignee'], status: Task['status'], type: Task['type'], hours: number, due: number): Task =>
  ({ id: id('t'), projectId, title, assignee, status, type, hours, due: wd(due) })

export const SEED_TASKS: Task[] = [
  T('p1', 'Tournage fournée du matin', 'A', 'done', 'Tournage', 5, -7),
  T('p1', 'Montage vidéo 30 s + 15 s', 'X', 'done', 'Montage', 9, -4),
  T('p1', 'Retouche des 20 photos', 'A', 'done', 'Montage', 4, -3),
  T('p2', 'Session 1 · enregistrement', 'A', 'done', 'Azurpod', 2, 0),
  T('p2', 'Session 2 · enregistrement', 'A', 'todo', 'Azurpod', 2, 8),
  T('p2', 'Extraits verticaux épisode 1', 'X', 'progress', 'Montage', 3, 2),
  T('p3', 'Tournage du mois (4 vidéos)', 'A', 'done', 'Tournage', 6, 1),
  T('p3', 'Montage vidéo 1 et 2', 'X', 'review', 'Montage', 6, 3),
  T('p3', 'Montage vidéo 3 et 4', 'X', 'progress', 'Montage', 6, 4),
  T('p3', 'Visuels du mois (8)', 'A', 'todo', 'Montage', 4, 9),
  T('p4', 'Repérage de la salle', 'E', 'todo', 'Tournage', 2, 7),
  T('p4', 'Liste des plans et conducteur', 'A', 'progress', 'Tournage', 3, 2),
  T('p4', 'Réserver le second cadreur', 'E', 'blocked', 'Admin', 1, 1),
  T('p5', 'V2 vidéo après retours client', 'X', 'review', 'Montage', 4, 3),
  T('p5', 'Paramétrage campagne et ciblage', 'E', 'progress', 'Commercial', 3, 2),
  T(undefined, 'Relancer devis Hôtel Les Pins', 'E', 'todo', 'Commercial', 1, 1),
  T(undefined, 'Préparer la facture du mois', 'E', 'todo', 'Admin', 1, 4),
  T(undefined, 'Ranger le NAS (rushs septembre)', 'X', 'todo', 'Admin', 2, 10),
]

export const SEED_SUBS: Subscription[] = [
  { id: 's1', label: 'Loyer du local (charges incluses)', category: 'Local', monthlyHT: 871.75, active: true },
  { id: 's2', label: 'Électricité', category: 'Local', monthlyHT: 62, active: true },
  { id: 's3', label: 'Assurance multirisque pro', category: 'Assurance', monthlyHT: 94.73, active: true },
  { id: 's4', label: 'Box internet pro', category: 'Télécom', monthlyHT: 39.99, active: true },
  { id: 's5', label: 'Google Workspace', category: 'Logiciels', monthlyHT: 34, active: true },
  { id: 's6', label: 'Adobe Creative Cloud', category: 'Logiciels', monthlyHT: 77, active: true },
  { id: 's7', label: 'Frame.io', category: 'Logiciels', monthlyHT: 15, active: true },
  { id: 's8', label: 'Notion', category: 'Logiciels', monthlyHT: 20, active: true },
  { id: 's9', label: 'Canva Pro', category: 'Logiciels', monthlyHT: 12, active: false, note: 'Doublon avec Adobe Express : à résilier' },
  { id: 's10', label: 'Banque pro', category: 'Banque & compta', monthlyHT: 29, active: true },
  { id: 's11', label: 'Expert-comptable en ligne', category: 'Banque & compta', monthlyHT: 109, active: true },
  { id: 's12', label: 'Publicité Uplye (Meta)', category: 'Marketing', monthlyHT: 300, active: true },
]

// Factures et dépenses ponctuelles sur 12 mois, générées de façon déterministe.
const months = lastMonths(12)
const CLIENTS = ['cl1', 'cl2', 'cl3', 'cl4', 'cl5', 'cl6', 'cl7', 'cl8']
const LABELS = ['Vidéo publicitaire', 'Contenus mensuels', 'Shooting photo', 'Session podcast', 'Formation', 'Film corporate', 'Campagne Meta']
let seed = 7
const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
const growth = [0.3, 0.35, 0.4, 0.45, 0.6, 0.75, 0.9, 1, 0.8, 1.05, 1.15, 0.7]

export const SEED_INVOICES: Invoice[] = []
export const SEED_EXPENSES: Expense[] = []
months.forEach((m, mi) => {
  const target = 5200 * growth[mi]!
  let sum = 0
  while (sum < target) {
    const amount = Math.round((300 + rnd() * 1700) / 10) * 10
    const day = 1 + Math.floor(rnd() * 26)
    const issued = new Date(`${m}-${String(day).padStart(2, '0')}T10:00:00`).toISOString()
    if (new Date(issued) > new Date()) break
    const due = new Date(new Date(issued).getTime() + 30 * 86400000).toISOString()
    const age = (Date.now() - new Date(issued).getTime()) / 86400000
    const late = rnd() < 0.15
    const paid = age > 45 || (age > 12 && !late && rnd() < 0.8)
    SEED_INVOICES.push({
      id: id('f'), number: `F-${m.slice(0, 4)}-${String(SEED_INVOICES.length + 1).padStart(3, '0')}`,
      clientId: CLIENTS[Math.floor(rnd() * CLIENTS.length)]!, label: LABELS[Math.floor(rnd() * LABELS.length)]!,
      amountHT: amount, issuedAt: issued, dueAt: due,
      paidAt: paid ? new Date(new Date(issued).getTime() + (8 + rnd() * 25) * 86400000).toISOString() : undefined,
    })
    sum += amount
  }
  const cats: [ExpenseCategory, string, number][] = [['Freelances', 'Cadreur / monteur freelance', 650], ['Matériel', 'Petit matériel', 220], ['Publicité', 'Budgets pub clients avancés', 260], ['Déplacements', 'Carburant et péages', 90], ['Divers', 'Fournitures', 60]]
  for (const [category, label, base] of cats) {
    const v = Math.round(base * growth[mi]! * (0.5 + rnd()))
    if (v > 20) SEED_EXPENSES.push({ id: id('e'), date: `${m}-12T10:00:00.000Z`, label, category, amountHT: v })
  }
})
