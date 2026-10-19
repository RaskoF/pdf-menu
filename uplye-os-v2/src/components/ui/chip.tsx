import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

// Figma : « Chip » (24:280). Filtre à bascule avec compteur ; aria-pressed indique l'état actif.
export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  count?: number
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(({ active = false, count, className, children, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-pressed={active}
    className={cn(
      'focus-ring inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-label-sm text-foreground transition-colors disabled:opacity-40',
      active ? 'bg-surface-3' : 'bg-surface-1 hover:bg-surface-2',
      className,
    )}
    {...props}
  >
    {children}
    {count !== undefined && <span className="text-meta-sm text-muted-foreground">{count}</span>}
  </button>
))
Chip.displayName = 'Chip'
