import { cn } from '@/lib/utils'

// Figma : « Load » (40:504) : barre de charge (heures planifiées / capacité). Rouge en cas de dépassement.
export function LoadBar({ hours, capacity, className }: { hours: number; capacity: number; className?: string }) {
  const pct = Math.min(100, (hours / capacity) * 100)
  const over = hours > capacity
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={capacity}
      aria-valuenow={hours}
      aria-label={`${hours} heures sur ${capacity}`}
      className={cn('h-1 w-full overflow-hidden rounded-full bg-chart-track', className)}
    >
      <div className={cn('h-full', over ? 'bg-danger' : 'bg-ink-subtle')} style={{ width: `${pct}%` }} />
    </div>
  )
}
