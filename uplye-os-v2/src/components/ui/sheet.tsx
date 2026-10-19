import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { IconButton } from './icon-button'

// Figma : panneaux « Nouveau devis » (134:3550) et « Nouvel événement » (134:4026).
// Panneau latéral basé sur Radix Dialog : focus piégé, Échap, retour du focus au déclencheur.
export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close

export interface SheetContentProps extends Omit<ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, 'title'> {
  title: ReactNode
  description?: ReactNode
  footer?: ReactNode
  /** Panneau large (détail d'un devis) ou standard (formulaire) */
  size?: 'default' | 'wide'
  /** Contenu qui porte déjà son en-tête et son bouton Fermer : titre réservé aux lecteurs d'écran, sans marges */
  bare?: boolean
}

export const SheetContent = forwardRef<ElementRef<typeof DialogPrimitive.Content>, SheetContentProps>(
  ({ className, title, description, footer, size = 'default', bare = false, children, ...props }, ref) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-surface-overlay animate-fade-in" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-popover text-popover-foreground shadow-lg animate-sheet-in sm:inset-y-4 sm:right-4 sm:w-[calc(100vw-2rem)] sm:rounded-xl sm:border sm:border-border',
          size === 'wide' ? 'sm:max-w-[440px]' : 'sm:max-w-[480px]',
          className,
        )}
        {...(description ? {} : { 'aria-describedby': undefined })}
        {...props}
      >
        {bare ? (
          <div className="sr-only">
            <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
            {description && <DialogPrimitive.Description>{description}</DialogPrimitive.Description>}
          </div>
        ) : (
          <div className="flex items-start gap-3 border-b border-border p-6">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <DialogPrimitive.Title className="text-title-md">{title}</DialogPrimitive.Title>
              {description && <DialogPrimitive.Description className="text-body-sm text-muted-foreground">{description}</DialogPrimitive.Description>}
            </div>
            <DialogPrimitive.Close asChild>
              <IconButton label="Fermer" size="sm">
                <X />
              </IconButton>
            </DialogPrimitive.Close>
          </div>
        )}
        <div className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto', !bare && 'gap-5 p-6')}>{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-6 py-4">{footer}</div>}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  ),
)
SheetContent.displayName = 'SheetContent'
