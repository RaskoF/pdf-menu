import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Figma : « Page Header » (14:286). Titre H1 en capitales, sous-titre, actions à droite.
export function PageHeader({ title, subtitle, actions, className }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-end', className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h1 className="text-h1 text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-body-md text-muted-foreground" aria-live="polite">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
