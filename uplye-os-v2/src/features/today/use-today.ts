import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchToday } from './mock-data'
import type { InboxEntry, Pole, TodayData } from './types'

export type PoleFilter = 'all' | Pole

/** État de l'écran Aujourd'hui : chargement, filtre par pôle, cases à cocher. */
export function useToday(loader: () => Promise<TodayData> = fetchToday) {
  const [data, setData] = useState<TodayData | null>(null)
  const [filter, setFilter] = useState<PoleFilter>('all')

  useEffect(() => {
    let cancelled = false
    loader().then((d) => !cancelled && setData(d))
    return () => {
      cancelled = true
    }
  }, [loader])

  const setDone = useCallback((id: string, done: boolean) => {
    setData((d) => (d ? { ...d, inbox: d.inbox.map((item) => (item.id === id ? { ...item, done } : item)) } : d))
  }, [])

  const derived = useMemo(() => {
    const inbox = data?.inbox ?? []
    const open = inbox.filter((i) => !i.done)
    const counts: Record<PoleFilter, number> = {
      all: open.length,
      commercial: open.filter((i) => i.pole === 'commercial').length,
      production: open.filter((i) => i.pole === 'production').length,
      finance: open.filter((i) => i.pole === 'finance').length,
    }
    const visible = open.filter((i) => filter === 'all' || i.pole === filter)
    const byGroup = (g: InboxEntry['group']) => visible.filter((i) => i.group === g)
    return {
      counts,
      urgentCount: open.filter((i) => i.group === 'urgent').length,
      groups: { urgent: byGroup('urgent'), today: byGroup('today'), waiting: byGroup('waiting') },
      done: inbox.filter((i) => i.done),
    }
  }, [data, filter])

  return { status: data ? ('ready' as const) : ('loading' as const), data, filter, setFilter, setDone, ...derived }
}
