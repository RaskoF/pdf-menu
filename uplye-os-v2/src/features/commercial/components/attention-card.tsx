import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Figma : « Attention Card » (24:686). Raccourci vers un filtre ; état actif quand le filtre est appliqué.
export function AttentionCard({
  icon,
  title,
  detail,
  tone = 'neutral',
  active = false,
  onClick,
}: {
  icon: ReactNode
  title: string
  detail: string
  tone?: 'danger' | 'neutral'
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'focus-ring flex min-w-0 items-center gap-3 rounded-lg p-4 text-left transition-colors',
        active ? 'bg-surface-2' : 'bg-card hover:bg-surface-1',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'grid size-9 shrink-0 place-content-center rounded-md [&_svg]:size-[18px]',
          tone === 'danger' ? 'bg-danger-tone text-danger' : 'bg-surface-1 text-foreground',
        )}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-title-sm text-foreground">{title}</span>
        <span className="text-body-sm text-muted-foreground">{detail}</span>
      </span>
    </button>
  )
}
