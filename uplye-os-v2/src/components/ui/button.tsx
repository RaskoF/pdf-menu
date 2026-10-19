import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Slot, Slottable } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { CircleNotch } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

// Figma : composant « Button » (7:437). Une seule action Default ou Brand par écran.
export const buttonVariants = cva(
  'focus-ring inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none disabled:bg-muted disabled:text-ink-disabled aria-busy:opacity-85 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-ink-soft',
        brand: 'bg-brand text-brand-foreground hover:bg-brand-hover',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-surface-2',
        outline: 'border border-input bg-card text-foreground hover:bg-accent disabled:border-border',
        ghost: 'text-foreground hover:bg-accent disabled:bg-transparent',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-danger-hover',
      },
      size: {
        sm: 'h-control-sm gap-1.5 px-3 text-label-sm [&_svg]:size-4',
        default: 'h-control-md gap-2 px-4 text-label-md [&_svg]:size-4',
        lg: 'h-control-lg gap-2 px-5 text-label-md [&_svg]:size-5',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Rend l'enfant (ex. un lien) avec le style du bouton. */
  asChild?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  /** Affiche un indicateur et bloque le bouton pendant une action. */
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, leadingIcon, trailingIcon, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={asChild ? undefined : disabled || loading}
        aria-busy={loading || undefined}
        {...(!asChild && { type: props.type ?? 'button' })}
        {...props}
      >
        {loading ? <CircleNotch className="animate-spin" aria-hidden /> : leadingIcon}
        <Slottable>{children}</Slottable>
        {trailingIcon}
      </Comp>
    )
  },
)
Button.displayName = 'Button'
