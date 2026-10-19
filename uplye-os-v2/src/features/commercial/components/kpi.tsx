import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Figma : « Stat Card » (15:230), version sans cadre utilisée dans les bandeaux d'indicateurs.
export function Kpi({
  label,
  value,
  sub,
  subTone = 'muted',
  size = 'lg',
  className,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  subTone?: 'muted' | 'success' | 'danger'
  size?: 'lg' | 'md'
  className?: string
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <dt className="text-meta-md text-muted-foreground">{label}</dt>
      <dd className={cn('text-foreground', size === 'lg' ? 'text-stat-lg' : 'text-stat-md')}>{value}</dd>
      {sub && (
        <dd className={cn('text-body-sm', subTone === 'success' ? 'text-success' : subTone === 'danger' ? 'text-danger' : 'text-muted-foreground')}>{sub}</dd>
      )}
    </div>
  )
}
