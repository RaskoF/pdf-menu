import type { HTMLAttributes } from 'react'
import { Command } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

// Figma : « Kbd » (8:143). Raccourci clavier ; ton sombre dans la barre latérale.
export interface KbdProps extends HTMLAttributes<HTMLElement> {
  keys: string
  /** Préfixe ⌘ */
  command?: boolean
  tone?: 'light' | 'dark'
}

export function Kbd({ keys, command = false, tone = 'light', className, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 shrink-0 items-center justify-center rounded-xs px-1.5 font-body text-meta-sm text-muted-foreground',
        tone === 'dark' ? 'bg-sidebar-field text-sidebar-muted' : 'bg-surface-2',
        className,
      )}
      {...props}
    >
      {command && <Command className="size-[11px]" aria-label="Commande" />}
      {keys}
    </kbd>
  )
}
