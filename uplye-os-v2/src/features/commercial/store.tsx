import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { DEMO_NOW as DEFAULT_NOW, fetchCommercial, type CommercialData } from './mock-data'
import { addDays, toIso } from './lib'
import type { Activity, Client, Devis, DevisStatus, LossDetails, Meeting, UpcomingEvent, WinDetails } from './types'

// Store partagé du module Commercial : un seul état pour les devis, clients, événements et réunions,
// pour qu'un devis signé dans le pipeline se retrouve aussitôt dans l'analyse et la fiche client.

type State = { status: 'loading' } | { status: 'ready'; data: CommercialData }

type Action =
  | { type: 'loaded'; data: CommercialData }
  | { type: 'devis/update'; id: string; update: (d: Devis) => Devis }
  | { type: 'devis/create'; devis: Devis }
  | { type: 'client/update'; id: string; update: (c: Client) => Client }
  | { type: 'client/create'; client: Client }
  | { type: 'meeting/update'; id: string; update: (m: Meeting) => Meeting }
  | { type: 'upcoming/create'; event: UpcomingEvent }
  | { type: 'contact/followUp'; id: string; followedUp: boolean }
  | { type: 'fireflies/set'; connected: boolean }

function reducer(state: State, action: Action): State {
  if (action.type === 'loaded') return { status: 'ready', data: action.data }
  if (state.status !== 'ready') return state
  const data = state.data
  const next = (patch: Partial<CommercialData>): State => ({ status: 'ready', data: { ...data, ...patch } })
  switch (action.type) {
    case 'devis/update':
      return next({ devis: data.devis.map((d) => (d.id === action.id ? action.update(d) : d)) })
    case 'devis/create':
      return next({ devis: [action.devis, ...data.devis] })
    case 'client/update':
      return next({ clients: data.clients.map((c) => (c.id === action.id ? action.update(c) : c)) })
    case 'client/create':
      return next({ clients: [action.client, ...data.clients] })
    case 'meeting/update':
      return next({ meetings: data.meetings.map((m) => (m.id === action.id ? action.update(m) : m)) })
    case 'upcoming/create':
      return next({ upcoming: [...data.upcoming, action.event].sort((a, b) => a.date.localeCompare(b.date)) })
    case 'contact/followUp':
      return next({ metContacts: data.metContacts.map((c) => (c.id === action.id ? { ...c, followedUp: action.followedUp } : c)) })
    case 'fireflies/set':
      return next({ firefliesConnected: action.connected })
  }
}

let activitySeq = 0
const activity = (a: Omit<Activity, 'id'>): Activity => ({ ...a, id: `act-${++activitySeq}` })

function useActions(dispatch: (a: Action) => void, now: Date) {
  return useMemo(() => {
    const today = toIso(now)
    const updateDevis = (id: string, update: (d: Devis) => Devis) => dispatch({ type: 'devis/update', id, update })
    return {
      updateDevis,
      /** Remet un devis tel qu'il était (bouton « Annuler » des toasts) */
      restoreDevis: (snapshot: Devis) => updateDevis(snapshot.id, () => snapshot),
      createDevis: (devis: Devis) => dispatch({ type: 'devis/create', devis }),
      moveDevis: (id: string, status: DevisStatus) =>
        updateDevis(id, (d) => ({
          ...d,
          status,
          ...(status === 'envoye' && !d.sentAt ? { sentAt: today, expiresAt: addDays(today, 30) } : {}),
        })),
      signDevis: (id: string, win?: WinDetails) =>
        updateDevis(id, (d) => ({
          ...d,
          status: 'signe',
          signedAt: today,
          decidedAt: today,
          win,
          nextAction: 'Projet créé',
          paymentNote: 'acompte demandé',
          activity: [activity({ kind: 'signed', title: 'Devis signé', detail: 'Projet et facture d’acompte créés', when: 'à l’instant' }), ...d.activity],
        })),
      refuseDevis: (id: string, loss: LossDetails) =>
        updateDevis(id, (d) => ({
          ...d,
          status: 'refuse',
          decidedAt: today,
          loss,
          snoozed: loss.remindIn3Months,
          nextAction: loss.remindIn3Months ? 'Recontacter dans 3 mois' : 'Aucune',
          activity: [activity({ kind: 'refused', title: 'Devis refusé', detail: `Motif : ${loss.reason.toLowerCase()}`, when: 'à l’instant' }), ...d.activity],
        })),
      archiveDevis: (id: string) => updateDevis(id, (d) => ({ ...d, status: 'archive', decidedAt: today })),
      logDevis: (id: string, a: Omit<Activity, 'id'>) => updateDevis(id, (d) => ({ ...d, activity: [activity(a), ...d.activity] })),
      updateClient: (id: string, update: (c: Client) => Client) => dispatch({ type: 'client/update', id, update }),
      createClient: (client: Client) => dispatch({ type: 'client/create', client }),
      updateMeeting: (id: string, update: (m: Meeting) => Meeting) => dispatch({ type: 'meeting/update', id, update }),
      createUpcoming: (event: UpcomingEvent) => dispatch({ type: 'upcoming/create', event }),
      setFollowUp: (id: string, followedUp: boolean) => dispatch({ type: 'contact/followUp', id, followedUp }),
      setFireflies: (connected: boolean) => dispatch({ type: 'fireflies/set', connected }),
    }
  }, [dispatch, now])
}

export type CommercialActions = ReturnType<typeof useActions>

interface ContextValue {
  state: State
  actions: CommercialActions
  now: Date
}

const CommercialContext = createContext<ContextValue | null>(null)

export interface CommercialProviderProps {
  children: ReactNode
  /** Données injectées (tests) : pas de chargement simulé */
  initialData?: CommercialData
  loader?: () => Promise<CommercialData>
  /** Date de référence (retards, « il y a ») */
  now?: Date
}

export function CommercialProvider({ children, initialData, loader = fetchCommercial, now = DEFAULT_NOW }: CommercialProviderProps) {
  const [state, dispatch] = useReducer(reducer, initialData ? { status: 'ready', data: initialData } : { status: 'loading' })
  const actions = useActions(dispatch, now)

  useEffect(() => {
    if (initialData) return
    let cancelled = false
    loader().then((data) => !cancelled && dispatch({ type: 'loaded', data }))
    return () => {
      cancelled = true
    }
  }, [initialData, loader])

  const value = useMemo(() => ({ state, actions, now }), [state, actions, now])
  return <CommercialContext.Provider value={value}>{children}</CommercialContext.Provider>
}

export function useCommercial() {
  const ctx = useContext(CommercialContext)
  if (!ctx) throw new Error('useCommercial doit être utilisé sous <CommercialProvider>')
  const { state, actions, now } = ctx
  return { loading: state.status === 'loading', data: state.status === 'ready' ? state.data : null, actions, now }
}

/** Accès direct aux clients par identifiant */
export function useClientsById() {
  const { data } = useCommercial()
  return useMemo(() => new Map((data?.clients ?? []).map((c) => [c.id, c])), [data?.clients])
}
