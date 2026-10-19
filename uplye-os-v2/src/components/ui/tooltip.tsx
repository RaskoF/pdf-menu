import type { ReactNode } from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

// Figma : « Tooltip » (10:229). Placer <TooltipProvider> une fois à la racine.
export const TooltipProvider = TooltipPrimitive.Provider

export interface TooltipProps {
  label: ReactNode
  shortcut?: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  children: ReactNode
  className?: string
}

export function Tooltip({ label, shortcut, side = 'top', children, className }: TooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className={cn('z-50 flex items-center gap-2 rounded-sm bg-primary px-2 py-1.5 text-body-sm text-primary-foreground animate-fade-in', className)}
        >
          {label}
          {shortcut && <span className="text-meta-sm text-sidebar-muted">{shortcut}</span>}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
