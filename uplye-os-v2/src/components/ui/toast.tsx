import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

// Figma : « Toast » (11:205). Message court en bas d'écran, action facultative (ex. Annuler).
type ToastVariant = 'default' | 'success' | 'error'
interface ToastOptions {
  message: string
  variant?: ToastVariant
  action?: { label: string; onClick: () => void }
}
interface ToastItem extends ToastOptions {
  id: number
}

const ToastContext = createContext<((options: ToastOptions) => void) | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const toast = useCallback((options: ToastOptions) => setItems((list) => [...list, { ...options, id: Date.now() + Math.random() }]), [])
  const remove = (id: number) => setItems((list) => list.filter((t) => t.id !== id))
  const value = useMemo(() => toast, [toast])

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="down" duration={5000} label="Notification">
        {children}
        {items.map(({ id, message, variant = 'default', action }) => (
          <ToastPrimitive.Root
            key={id}
            onOpenChange={(open) => !open && remove(id)}
            className="flex w-[360px] max-w-[calc(100vw-2rem)] items-center gap-3 rounded-lg bg-primary px-4 py-3 text-primary-foreground shadow-lg animate-pop-in data-[state=closed]:animate-fade-in"
          >
            {variant === 'success' && <CheckCircle className="size-4 shrink-0 text-success" aria-hidden />}
            {variant === 'error' && <WarningCircle className="size-4 shrink-0 text-danger" aria-hidden />}
            <ToastPrimitive.Description className="flex-1 text-body-md">{message}</ToastPrimitive.Description>
            {action && (
              <ToastPrimitive.Action altText={action.label} asChild>
                <button type="button" onClick={action.onClick} className={cn('focus-ring rounded-sm text-label-sm underline-offset-2 hover:underline')}>
                  {action.label}
                </button>
              </ToastPrimitive.Action>
            )}
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 flex-col gap-2 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast doit être utilisé sous <ToastProvider>')
  return ctx
}
