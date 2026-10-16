import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import type { Client, Devis, Stage } from './types'
import { SEED_CLIENTS, SEED_DEVIS } from './data'

interface State { devis: Devis[]; clients: Client[] }
type Action =
  | { type: 'upsertDevis'; devis: Devis }
  | { type: 'deleteDevis'; id: string }
  | { type: 'moveDevis'; id: string; stage: Stage }
  | { type: 'upsertClient'; client: Client }
  | { type: 'reset' }

const KEY = 'uplye-os-commercial-v1'
const seed = (): State => ({ devis: structuredClone(SEED_DEVIS), clients: structuredClone(SEED_CLIENTS) })

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as State
  } catch { /* stockage indisponible : on repart des données de démo */ }
  return seed()
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
    case 'moveDevis':
      return {
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
    case 'upsertClient': {
      const exists = s.clients.some((c) => c.id === a.client.id)
      return { ...s, clients: exists ? s.clients.map((c) => (c.id === a.client.id ? a.client : c)) : [...s.clients, a.client] }
    }
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
