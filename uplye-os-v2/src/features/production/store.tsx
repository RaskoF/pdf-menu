import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { DEMO_NOW } from '@/data/session'
import { toIso } from '@/lib/dates'
import { fetchProduction, type ProductionData } from './mock-data'
import type { Project, SocialAccount, SocialPost, StudioDelivery, StudioPack, StudioSession } from './types'

// Store partagé du module Production : projets, studio et réseaux sociaux dans un seul état,
// pour qu'un post « depuis un projet » ou une séance de pack restent cohérents entre écrans.

type Collection = 'projects' | 'sessions' | 'deliveries' | 'packs' | 'posts'
type Item<C extends Collection> = ProductionData[C][number]

type State = { status: 'loading' } | { status: 'ready'; data: ProductionData }
type Action =
  | { type: 'loaded'; data: ProductionData }
  | { type: 'update'; collection: Collection; id: string; update: (item: never) => unknown }
  | { type: 'create'; collection: Collection; item: unknown }
  | { type: 'remove'; collection: Collection; id: string }
  | { type: 'account'; account: Pick<SocialAccount, 'brand' | 'network'>; connected: boolean; today: string }

function reducer(state: State, action: Action): State {
  if (action.type === 'loaded') return { status: 'ready', data: action.data }
  if (state.status !== 'ready') return state
  const data = state.data
  switch (action.type) {
    case 'update': {
      const list = data[action.collection] as { id: string }[]
      return { status: 'ready', data: { ...data, [action.collection]: list.map((x) => (x.id === action.id ? action.update(x as never) : x)) } }
    }
    case 'create':
      return { status: 'ready', data: { ...data, [action.collection]: [action.item, ...data[action.collection]] } }
    case 'remove':
      return { status: 'ready', data: { ...data, [action.collection]: (data[action.collection] as { id: string }[]).filter((x) => x.id !== action.id) } }
    case 'account':
      return {
        status: 'ready',
        data: {
          ...data,
          accounts: data.accounts.map((a) =>
            a.brand === action.account.brand && a.network === action.account.network
              ? { ...a, connected: action.connected, disconnectedSince: action.connected ? undefined : action.today }
              : a,
          ),
        },
      }
  }
}

function useActions(dispatch: (a: Action) => void, now: Date) {
  return useMemo(() => {
    const update =
      <C extends Collection>(collection: C) =>
      (id: string, fn: (item: Item<C>) => Item<C>) =>
        dispatch({ type: 'update', collection, id, update: fn as (item: never) => unknown })
    const create =
      <C extends Collection>(collection: C) =>
      (item: Item<C>) =>
        dispatch({ type: 'create', collection, item })
    const today = toIso(now)
    return {
      updateProject: update('projects') as (id: string, fn: (p: Project) => Project) => void,
      createProject: create('projects') as (p: Project) => void,
      updateSession: update('sessions') as (id: string, fn: (s: StudioSession) => StudioSession) => void,
      createSession: create('sessions') as (s: StudioSession) => void,
      updateDelivery: update('deliveries') as (id: string, fn: (d: StudioDelivery) => StudioDelivery) => void,
      updatePack: update('packs') as (id: string, fn: (p: StudioPack) => StudioPack) => void,
      updatePost: update('posts') as (id: string, fn: (p: SocialPost) => SocialPost) => void,
      createPost: create('posts') as (p: SocialPost) => void,
      removePost: (id: string) => dispatch({ type: 'remove', collection: 'posts', id }),
      removeSession: (id: string) => dispatch({ type: 'remove', collection: 'sessions', id }),
      setAccount: (account: Pick<SocialAccount, 'brand' | 'network'>, connected: boolean) => dispatch({ type: 'account', account, connected, today }),
    }
  }, [dispatch, now])
}

export type ProductionActions = ReturnType<typeof useActions>

const ProductionContext = createContext<{ state: State; actions: ProductionActions; now: Date } | null>(null)

export function ProductionProvider({
  children,
  initialData,
  loader = fetchProduction,
  now = DEMO_NOW,
}: {
  children: ReactNode
  initialData?: ProductionData
  loader?: () => Promise<ProductionData>
  now?: Date
}) {
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
  return <ProductionContext.Provider value={value}>{children}</ProductionContext.Provider>
}

export function useProduction() {
  const ctx = useContext(ProductionContext)
  if (!ctx) throw new Error('useProduction doit être utilisé sous <ProductionProvider>')
  const { state, actions, now } = ctx
  return { loading: state.status === 'loading', data: state.status === 'ready' ? state.data : null, actions, now }
}
