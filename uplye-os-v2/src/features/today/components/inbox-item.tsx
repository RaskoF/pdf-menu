import { useId } from 'react'
import { Button, Checkbox } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { InboxEntry } from '../types'

// Figma : « Inbox Item » (40:421). Action en Outline pour l'urgent, Ghost sinon.
export function InboxItem({ item, onDoneChange, onAction }: { item: InboxEntry; onDoneChange: (done: boolean) => void; onAction?: () => void }) {
  const id = useId()
  return (
    <li className={cn('flex items-center gap-3 rounded-md p-3 transition-colors hover:bg-surface-hover', item.done && 'opacity-70')}>
      <Checkbox id={id} checked={item.done} onCheckedChange={(v) => onDoneChange(v === true)} aria-describedby={`${id}-ctx`} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <label htmlFor={id} className={cn('cursor-pointer text-title-sm text-foreground', item.done && 'text-muted-foreground line-through')}>
          {item.title}
        </label>
        <p id={`${id}-ctx`} className="truncate text-body-sm text-muted-foreground">
          {item.context}
        </p>
      </div>
      {!item.done && (
        <Button size="sm" variant={item.group === 'urgent' ? 'outline' : 'ghost'} onClick={onAction}>
          {item.actionLabel}
        </Button>
      )}
    </li>
  )
}
