import type { HTMLAttributes, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { CheckCircle, Info, Sparkle, Warning, WarningCircle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

// Figma : « Alert » (11:191)
const alertVariants = cva('flex items-start gap-3 rounded-md px-4 py-3 text-foreground [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0', {
  variants: {
    variant: {
      info: 'bg-info-tone [&>svg]:text-info [&_.alert-title]:text-info',
      success: 'bg-success-tone [&>svg]:text-success [&_.alert-title]:text-success',
      warning: 'bg-warning-tone [&>svg]:text-warning [&_.alert-title]:text-warning',
      destructive: 'bg-danger-tone [&>svg]:text-danger [&_.alert-title]:text-danger',
      brand: 'bg-brand-soft',
    },
  },
  defaultVariants: { variant: 'info' },
})

const icons = { info: Info, success: CheckCircle, warning: Warning, destructive: WarningCircle, brand: Sparkle }

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'>, VariantProps<typeof alertVariants> {
  title?: ReactNode
  action?: ReactNode
}

export function Alert({ variant = 'info', title, action, children, className, ...props }: AlertProps) {
  const Icon = icons[variant ?? 'info']
  return (
    <div role={variant === 'destructive' ? 'alert' : 'status'} className={cn(alertVariants({ variant }), className)} {...props}>
      <Icon aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {title && <p className="alert-title text-title-sm">{title}</p>}
        {children && <div className="text-body-sm">{children}</div>}
      </div>
      {action}
    </div>
  )
}
