import { useState } from 'react'
import { CaretDown, CheckCircle, ListChecks } from '@phosphor-icons/react'
import { Button, Card, Chip, Skeleton, useToast } from '@/components/ui'
import { EmptyState } from '@/components/app/empty-state'
import { cn } from '@/lib/utils'
import { pluralize } from '@/lib/format'
import type { InboxEntry, InboxGroup } from '../types'
import type { PoleFilter } from '../use-today'
import { InboxItem } from './inbox-item'

const FILTERS: { value: PoleFilter; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'production', label: 'Production' },
  { value: 'finance', label: 'Finance' },
]
const GROUP_LABELS: Record<InboxGroup, string> = { urgent: 'Urgent', today: 'Aujourd’hui', waiting: 'En attente des autres' }

export interface InboxCardProps {
  loading: boolean
  filter: PoleFilter
  onFilterChange: (f: PoleFilter) => void
  counts: Record<PoleFilter, number>
  groups: Record<InboxGroup, InboxEntry[]>
  done: InboxEntry[]
  nextDeadline?: string
  onDoneChange: (id: string, done: boolean) => void
}

// Figma : carte « À traiter » de l'écran Aujourd'hui (41:1086), états chargement (117:2615) et tout traité (117:3007).
export function InboxCard({ loading, filter, onFilterChange, counts, groups, done, nextDeadline, onDoneChange }: InboxCardProps) {
  const toast = useToast()
  const [showDone, setShowDone] = useState(false)
  const visibleCount = groups.urgent.length + groups.today.length + groups.waiting.length

  const markDone = (item: InboxEntry, value: boolean) => {
    onDoneChange(item.id, value)
    if (value) toast({ message: `« ${item.title} » marqué comme fait`, variant: 'success', action: { label: 'Annuler', onClick: () => onDoneChange(item.id, false) } })
  }

  return (
    <Card className="min-h-0 gap-1 lg:h-full lg:overflow-y-auto" aria-labelledby="inbox-title" aria-busy={loading}>
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <h2 id="inbox-title" className="flex-1 text-h3">
          À traiter
        </h2>
        <div role="group" aria-label="Filtrer par pôle" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Chip key={f.value} active={filter === f.value} count={loading ? undefined : counts[f.value]} onClick={() => onFilterChange(f.value)}>
              {f.label}
            </Chip>
          ))}
        </div>
      </div>

      {loading ? (
        <ul aria-label="Chargement des tâches" className="flex flex-col gap-1 pt-2">
          {[44, 58, 72, 44, 58, 72, 44].map((w, i) => (
            <li key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="size-4 rounded-xs" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3.5" style={{ width: `${w}%` }} />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </li>
          ))}
        </ul>
      ) : visibleCount === 0 ? (
        <EmptyState
          icon={<CheckCircle />}
          title={filter === 'all' ? 'Tout est à jour' : 'Rien dans ce pôle'}
          action={
            done.length > 0 && (
              <Button variant="ghost" size="sm" leadingIcon={<ListChecks />} onClick={() => setShowDone(true)}>
                Voir ce qui a été fait
              </Button>
            )
          }
        >
          {pluralize(done.length, 'action traitée', 'actions traitées')} aujourd’hui.
          {nextDeadline && <> Prochaine échéance {nextDeadline}.</>}
        </EmptyState>
      ) : (
        (Object.keys(GROUP_LABELS) as InboxGroup[]).map(
          (g) =>
            groups[g].length > 0 && (
              <section key={g} aria-labelledby={`group-${g}`}>
                <h3 id={`group-${g}`} className="flex items-center gap-2 pb-1 pt-3 text-meta-md text-muted-foreground">
                  {GROUP_LABELS[g]} <span className="text-meta-sm text-ink-subtle">{groups[g].length}</span>
                </h3>
                <ul>
                  {groups[g].map((item) => (
                    <InboxItem key={item.id} item={item} onDoneChange={(v) => markDone(item, v)} />
                  ))}
                </ul>
              </section>
            ),
        )
      )}

      {!loading && done.length > 0 && (
        <div className="pt-3">
          <button
            type="button"
            aria-expanded={showDone}
            aria-controls="done-list"
            onClick={() => setShowDone((v) => !v)}
            className="focus-ring flex items-center gap-2 rounded-sm text-body-sm text-muted-foreground hover:text-foreground"
          >
            <CheckCircle className="size-3.5 text-success" aria-hidden />
            {pluralize(done.length, 'faite', 'faites')} aujourd’hui
            <CaretDown className={cn('size-3 transition-transform', showDone && 'rotate-180')} aria-hidden />
          </button>
          {showDone && (
            <ul id="done-list" className="pt-1">
              {done.map((item) => (
                <InboxItem key={item.id} item={item} onDoneChange={(v) => onDoneChange(item.id, v)} />
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  )
}
