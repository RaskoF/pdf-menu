import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

// Figma : « Skeleton » (10:242)
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn('h-4 animate-pulse rounded-sm bg-surface-2', className)} {...props} />
}
