import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Figma : « Avatar » (8:171). Initiales sur pastille ; photo si fournie.
const avatarVariants = cva('relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full', {
  variants: {
    tone: {
      yellow: 'bg-brand text-brand-foreground',
      neutral: 'bg-surface-2 text-foreground',
      dark: 'bg-primary text-primary-foreground',
    },
    size: {
      xs: 'size-5 text-body-xs',
      sm: 'size-6 text-body-xs',
      md: 'size-8 text-title-sm',
      lg: 'size-10 text-title-md',
    },
  },
  defaultVariants: { tone: 'neutral', size: 'md' },
})

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  initials: string
  /** Nom complet, annoncé aux lecteurs d'écran */
  name?: string
  src?: string
  className?: string
}

export function Avatar({ initials, name, src, tone, size, className }: AvatarProps) {
  return (
    <AvatarPrimitive.Root className={cn(avatarVariants({ tone, size }), className)} aria-label={name} role={name ? 'img' : undefined}>
      {src && <AvatarPrimitive.Image src={src} alt="" className="size-full object-cover" />}
      <AvatarPrimitive.Fallback delayMs={src ? 300 : 0} aria-hidden={Boolean(name)}>
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}
