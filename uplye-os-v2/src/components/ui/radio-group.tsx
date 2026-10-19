import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { cn } from '@/lib/utils'

// Figma : « Radio » (9:140)
export const RadioGroup = forwardRef<ElementRef<typeof RadioGroupPrimitive.Root>, ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>>(
  ({ className, ...props }, ref) => <RadioGroupPrimitive.Root ref={ref} className={cn('grid gap-2', className)} {...props} />,
)
RadioGroup.displayName = 'RadioGroup'

export const RadioGroupItem = forwardRef<ElementRef<typeof RadioGroupPrimitive.Item>, ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>>(
  ({ className, ...props }, ref) => (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'focus-ring grid size-4 shrink-0 place-content-center rounded-full border border-ink-subtle bg-card',
        'data-[state=checked]:border-[1.5px] data-[state=checked]:border-primary disabled:cursor-not-allowed disabled:border-border disabled:bg-muted',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="size-2 rounded-full bg-primary data-[disabled]:bg-ink-disabled" />
    </RadioGroupPrimitive.Item>
  ),
)
RadioGroupItem.displayName = 'RadioGroupItem'
