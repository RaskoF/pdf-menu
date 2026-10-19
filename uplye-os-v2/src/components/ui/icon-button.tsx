import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Figma : « Icon Button » (8:95). Ghost dans les lignes et cartes, Outline dans les barres d'outils.
const iconButtonVariants = cva(
  'focus-ring inline-flex shrink-0 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:bg-muted disabled:text-ink-disabled [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-ink-soft',
        brand: 'bg-brand text-brand-foreground hover:bg-brand-hover',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-surface-2',
        outline: 'border border-input bg-card text-foreground hover:bg-accent',
        ghost: 'text-foreground hover:bg-accent disabled:bg-transparent',
      },
      size: {
        sm: 'size-8 [&_svg]:size-4',
        default: 'size-9 [&_svg]:size-[18px]',
        lg: 'size-10 [&_svg]:size-5',
      },
    },
    defaultVariants: { variant: 'ghost', size: 'default' },
  },
)

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof iconButtonVariants> {
  /** Obligatoire : nom lu par les lecteurs d'écran (le bouton n'a pas de texte visible). */
  label: string
  asChild?: boolean
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, label, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        aria-label={label}
        title={label}
        className={cn(iconButtonVariants({ variant, size }), className)}
        {...(!asChild && { type: props.type ?? 'button' })}
        {...props}
      />
    )
  },
)
IconButton.displayName = 'IconButton'
