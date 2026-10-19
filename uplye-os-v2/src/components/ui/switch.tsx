import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

// Figma : « Switch » (9:156)
export const Switch = forwardRef<ElementRef<typeof SwitchPrimitive.Root>, ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>>(
  ({ className, ...props }, ref) => (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        'focus-ring peer inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-input px-0.5 transition-colors data-[state=checked]:bg-primary disabled:cursor-not-allowed disabled:bg-muted',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-4 rounded-full bg-card shadow-xs transition-transform data-[state=checked]:translate-x-4 data-[disabled]:bg-surface-2" />
    </SwitchPrimitive.Root>
  ),
)
Switch.displayName = 'Switch'
