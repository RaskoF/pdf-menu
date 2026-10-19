import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Figma : écrans « … / Tout est traité », « … / Vide » (page 16 États vides et erreurs)
export function EmptyState({ icon, title, children, action, className }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-2 px-6 py-12 text-center', className)}>
      <div className="mb-2 grid size-12 place-content-center rounded-lg bg-surface-1 text-foreground [&_svg]:size-5" aria-hidden>
        {icon}
      </div>
      <h3 className="text-title-md text-foreground">{title}</h3>
      {children && <div className="max-w-[320px] text-body-sm text-muted-foreground">{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
