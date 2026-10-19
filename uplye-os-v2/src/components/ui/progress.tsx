import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

// Figma : « Progress » (10:241). Vert à 100 %, rouge au-delà (dépassement).
export interface ProgressProps {
  value: number
  max?: number
  label: string
  className?: string
}

export function Progress({ value, max = 100, label, className }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const tone = value > max ? 'bg-destructive' : value === max ? 'bg-success' : 'bg-primary'
  return (
    <ProgressPrimitive.Root value={Math.min(value, max)} max={max} aria-label={label} className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-chart-track', className)}>
      <ProgressPrimitive.Indicator className={cn('h-full transition-[width]', tone)} style={{ width: `${pct}%` }} />
    </ProgressPrimitive.Root>
  )
}
