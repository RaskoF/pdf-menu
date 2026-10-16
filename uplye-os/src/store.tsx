import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import type { Booking, CatalogueItem, Client, Devis, EventItem, Expense, Invoice, Member, Notification, Pack, Person, Project, Referral, Sop, SopRun, Stage, Subscription, Task } from './types'
import { SEED_NOTIFS, SEED_REFERRALS, SEED_RUNS, SEED_SOPS } from './dataExtra'
import { CATALOGUE, SEED_CLIENTS, SEED_DEVIS } from './data'
import { SEED_BOOKINGS, SEED_EVENTS, SEED_MEMBERS, SEED_EXPENSES, SEED_INVOICES, SEED_PACKS, SEED_PROJECTS, SEED_SUBS, SEED_TASKS } from './dataOps'
import { scheduleParts, totalHT, uid } from './utils'

export interface State {
  devis: Devis[]; clients: Client[]
  projects: Project[]; tasks: Task[]; invoices: Invoice[]; expenses: Expense[]; subs: Subscription[]
  bookings: Booking[]; packs: Pack[]
  events: EventItem[]; members: Member[]; catalogue: CatalogueItem[]
  sops: Sop[]; runs: SopRun[]; referrals: Referral[]; notifs: Notification[]
  me: Person // personne connectée (pour tester les vues par rôle)
}
type Coll = 'projects' | 'tasks' | 'invoices' | 'expenses' | 'subs' | 'bookings' | 'packs' | 'events' | 'members' | 'catalogue' | 'clients' | 'sops' | 'runs' | 'referrals' | 'notifs'
type Item = Project | Task | Invoice | Expense | Subscription | Booking | Pack | EventItem | Member | CatalogueItem | Client | Sop | SopRun | Referral | Notification
type Action =
  | { type: 'upsertDevis'; devis: Devis }
  | { type: 'deleteDevis'; id: string }
  | { type: 'moveDevis'; id: string; stage: Stage }
  | { type: 'upsertClient'; client: Client }
  | { type: 'upsert'; coll: Coll; item: Item }
  | { type: 'remove'; coll: Coll; id: string }
  | { type: 'setMe'; me: Person }
  | { type: 'reset' }

const KEY = 'uplye-os-demo-v2'
const seed = (): State => structuredClone({
  devis: SEED_DEVIS, clients: SEED_CLIENTS, projects: SEED_PROJECTS, tasks: SEED_TASKS,
  invoices: SEED_INVOICES, expenses: SEED_EXPENSES, subs: SEED_SUBS, bookings: SEED_BOOKINGS, packs: SEED_PACKS, events: SEED_EVENTS, members: SEED_MEMBERS, catalogue: CATALOGUE, sops: SEED_SOPS, runs: SEED_RUNS, referrals: SEED_REFERRALS, notifs: SEED_NOTIFS, me: 'E' as Person,
})

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...seed(), ...(JSON.parse(raw) as Partial<State>) }
  } catch { /* stockage indisponible : on repart des données de démo */ }
  return seed()
}

export function nextInvoiceNumber(inv: Invoice[]) {
  const max = inv.reduce((m, i) => Math.max(m, Number(i.number.split('-')[2] ?? 0)), 0)
  return `F-${new Date().getFullYear()}-${String(max + 1).padStart(3, '0')}`
}

// Un devis signé crée son projet et sa facture d'acompte (une seule fois).
function onSigned(s: State, d: Devis): State {
  if (s.projects.some((p) => p.devisId === d.id)) return s
  const now = new Date().toISOString()
  const project: Project = {
    id: uid(), name: d.title, clientId: d.clientId, devisId: d.id, activity: d.activity, status: 'preprod',
    owner: d.owner === 'A' ? 'A' : 'E', start: now, due: new Date(Date.now() + 21 * 86400000).toISOString(), budget: totalHT(d), costs: [],
  }
  const first = scheduleParts(d.schedule)[0]!
  const invoice: Invoice = {
    id: uid(), number: nextInvoiceNumber(s.invoices), clientId: d.clientId, projectId: project.id,
    label: `Acompte ${first.pct} % · ${d.number}`, amountHT: Math.round(totalHT(d) * first.pct) / 100,
    issuedAt: now, dueAt: new Date(Date.now() + 15 * 86400000).toISOString(),
  }
  return { ...s, projects: [project, ...s.projects], invoices: [...s.invoices, invoice] }
}

export function nextNumber(devis: Devis[]) {
  const max = devis.reduce((m, d) => Math.max(m, Number(d.number.split('-')[2] ?? 0)), 0)
  return `DEV-2026-${String(max + 1).padStart(3, '0')}`
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'upsertDevis': {
      const exists = s.devis.some((d) => d.id === a.devis.id)
      return { ...s, devis: exists ? s.devis.map((d) => (d.id === a.devis.id ? a.devis : d)) : [a.devis, ...s.devis] }
    }
    case 'deleteDevis':
      return { ...s, devis: s.devis.filter((d) => d.id !== a.id) }
    case 'moveDevis': {
      const next: State = {
        ...s,
        devis: s.devis.map((d) => {
          if (d.id !== a.id) return d
          const now = new Date().toISOString()
          const moved: Devis = { ...d, stage: a.stage }
          // un prospect qui passe en devis reçoit son numéro
          if (!d.number && a.stage !== 'a_chiffrer') moved.number = nextNumber(s.devis)
          if ((a.stage === 'envoye' || a.stage === 'ouvert') && !d.sentAt) moved.sentAt = now
          if (a.stage === 'signe' && !d.signedAt) moved.signedAt = now
          if (a.stage !== 'signe') moved.signedAt = undefined
          return moved
        }),
      }
      const signed = next.devis.find((d) => d.id === a.id)
      return a.stage === 'signe' && signed ? onSigned(next, signed) : next
    }
    case 'upsertClient': {
      const exists = s.clients.some((c) => c.id === a.client.id)
      return { ...s, clients: exists ? s.clients.map((c) => (c.id === a.client.id ? a.client : c)) : [...s.clients, a.client] }
    }
    case 'upsert': {
      const list = s[a.coll] as Item[]
      const exists = list.some((x) => x.id === a.item.id)
      return { ...s, [a.coll]: exists ? list.map((x) => (x.id === a.item.id ? a.item : x)) : [a.item, ...list] }
    }
    case 'remove':
      return { ...s, [a.coll]: (s[a.coll] as Item[]).filter((x) => x.id !== a.id) }
    case 'setMe':
      return { ...s, me: a.me }
    case 'reset':
      return seed()
  }
}

const Ctx = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignoré */ }
  }, [state])
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export function useStore() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useStore hors StoreProvider')
  return c
}
