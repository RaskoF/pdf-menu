import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Figma : « Input » (9:65). États : défaut, rempli, focus, erreur (aria-invalid), désactivé.
export const fieldBase =
  'w-full rounded-md border border-input bg-card text-body-md text-foreground transition-shadow placeholder:text-ink-subtle focus-visible:border-foreground focus-visible:shadow-focus aria-[invalid=true]:border-destructive disabled:cursor-not-allowed disabled:bg-muted disabled:text-ink-disabled'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, leadingIcon, trailingIcon, ...props }, ref) => {
  const input = <input ref={ref} className={cn(fieldBase, 'h-control-md px-3', leadingIcon && 'pl-9', trailingIcon && 'pr-9', className)} {...props} />
  if (!leadingIcon && !trailingIcon) return input
  return (
    <div className="relative w-full [&_svg]:size-4">
      {leadingIcon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle">{leadingIcon}</span>}
      {input}
      {trailingIcon && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle">{trailingIcon}</span>}
    </div>
  )
})
Input.displayName = 'Input'
