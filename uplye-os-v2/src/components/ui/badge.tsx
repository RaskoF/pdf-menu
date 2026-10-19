import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Figma : « Badge » (8:135). Couleurs « tag » pour les statuts et les pôles.
export const badgeVariants = cva('inline-flex h-[22px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-label-sm', {
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground',
      brand: 'bg-brand text-brand-foreground',
      secondary: 'bg-tag-neutral-bg text-tag-neutral-fg',
      outline: 'border border-border text-foreground',
      destructive: 'bg-destructive text-destructive-foreground',
      yellow: 'bg-tag-yellow-bg text-tag-yellow-fg',
      orange: 'bg-tag-orange-bg text-tag-orange-fg',
      green: 'bg-tag-green-bg text-tag-green-fg',
      blue: 'bg-tag-blue-bg text-tag-blue-fg',
      violet: 'bg-tag-violet-bg text-tag-violet-fg',
      teal: 'bg-tag-teal-bg text-tag-teal-fg',
      red: 'bg-tag-red-bg text-tag-red-fg',
    },
  },
  defaultVariants: { variant: 'secondary' },
})

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
