import { cn } from '@/lib/utils'

export interface BarItem {
  label: string
  value: number
  /** Valeur affichée à droite (sinon la valeur brute) */
  display?: string
}

// Barres horizontales de l'analyse gagnés / perdus (ancienne maquette 2973:4996, reprise avec le nouveau DS).
export function BarList({ items, max, tone, label }: { items: BarItem[]; max?: number; tone: 'success' | 'danger' | 'ink'; label: string }) {
  const top = max ?? Math.max(1, ...items.map((i) => i.value))
  return (
    <ul className="flex flex-col gap-3" aria-label={label}>
      {items.map((item) => (
        <li key={item.label} className="grid grid-cols-[minmax(0,150px)_1fr_auto] items-center gap-3">
          <span className="truncate text-body-sm text-foreground">{item.label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-chart-track" aria-hidden>
            <span
              className={cn('block h-full rounded-full', tone === 'success' ? 'bg-success' : tone === 'danger' ? 'bg-danger' : 'bg-foreground')}
              style={{ width: `${Math.round((item.value / top) * 100)}%` }}
            />
          </span>
          <span className="min-w-8 text-right text-label-sm tabular-nums text-foreground">{item.display ?? item.value}</span>
        </li>
      ))}
    </ul>
  )
}
