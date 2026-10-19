import { CheckCircle, CurrencyEur, Envelope, Eye, Microphone, NotePencil, PaperPlaneTilt, Plus, XCircle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { ActivityKind, ClientActivityKind } from '../types'

const ICONS = {
  view: Eye,
  mail: Envelope,
  meeting: Microphone,
  sent: PaperPlaneTilt,
  signed: CheckCircle,
  refused: XCircle,
  payment: CurrencyEur,
  delivered: CheckCircle,
  note: NotePencil,
  created: Plus,
} as const

const TONES: Partial<Record<ActivityKind, string>> = {
  view: 'text-foreground',
  mail: 'text-info',
  meeting: 'text-tag-violet-fg',
  payment: 'text-success',
  refused: 'text-danger',
}

// Pastille d'icône des fils d'activité (« Activity Item », 24:815)
export function ActivityIcon({ kind, className }: { kind: ActivityKind | ClientActivityKind; className?: string }) {
  const Icon = ICONS[kind]
  return (
    <span
      aria-hidden
      className={cn('grid size-7 shrink-0 place-content-center rounded-full bg-surface-1 [&_svg]:size-3.5', TONES[kind] ?? 'text-muted-foreground', className)}
    >
      <Icon />
    </span>
  )
}
