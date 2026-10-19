import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/lib/utils'

// Figma : « Field » (10:60). Relie le libellé, l'aide et l'erreur au champ (id, aria-describedby, aria-invalid).
export interface FieldProps {
  label: string
  helper?: string
  error?: string
  optional?: boolean
  disabled?: boolean
  className?: string
  /** Un seul champ : Input, Textarea, SelectTrigger… */
  children: ReactElement<Record<string, unknown>>
}

export function Field({ label, helper, error, optional = false, disabled = false, className, children }: FieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : helper ? `${id}-helper` : undefined
  const control = isValidElement(children)
    ? cloneElement(children, { id, disabled, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })
    : children
  return (
    <div className={cn('flex flex-col gap-1.5', disabled && 'opacity-60', className)}>
      <div className="flex items-center gap-1">
        <LabelPrimitive.Root htmlFor={id} className="text-label-sm text-foreground">
          {label}
        </LabelPrimitive.Root>
        {optional && <span className="text-body-sm text-muted-foreground">(facultatif)</span>}
      </div>
      {control}
      {error ? (
        <p id={`${id}-error`} className="text-body-sm text-danger">
          {error}
        </p>
      ) : (
        helper && (
          <p id={`${id}-helper`} className="text-body-sm text-muted-foreground">
            {helper}
          </p>
        )
      )}
    </div>
  )
}

export function Label({ className, ...props }: LabelPrimitive.LabelProps & { children: ReactNode }) {
  return <LabelPrimitive.Root className={cn('text-label-sm text-foreground', className)} {...props} />
}
