import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Figma : « Card » (11:97). Fond carte, rayon 12, marge 20.
export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn('flex flex-col gap-4 rounded-lg bg-card p-5 text-card-foreground', className)} {...props} />
}

export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  /** Niveau du titre pour la hiérarchie de la page */
  as?: 'h2' | 'h3'
}

export function CardHeader({ title, description, action, as: Heading = 'h2', className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Heading className="text-h3 text-card-foreground">{title}</Heading>
        {description && <p className="text-body-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-2', className)} {...props} />
}
