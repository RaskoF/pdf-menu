import { useMemo, useState, type DragEvent } from 'react'
import { CheckCircle, Clock, CurrencyEur, DotsThree, Eye, HourglassMedium, NotePencil, PaperPlaneTilt, Plus, Tray, XCircle } from '@phosphor-icons/react'
import {
  Avatar,
  Button,
  ChoiceGroup,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  Skeleton,
} from '@/components/ui'
import { formatEur } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useClientsById, useCommercial } from '../store'
import { QUARTER_GOAL } from '../mock-data'
import { daysBetween, devisAmount, formatPercent, PIPELINE_STATUSES, STATUS_LABEL, STATUS_PROBABILITY, weightedAmount } from '../lib'
import { amountLabel, cardAge, cardHint } from '../selectors'
import { QUICK_LOSS_REASONS } from '../reasons'
import type { Devis, PipelineStatus } from '../types'
import type { useDevisOutcome } from './use-devis-outcome'

const COLUMN_ICON = { a_chiffrer: CurrencyEur, brouillon: NotePencil, envoye: PaperPlaneTilt, ouvert: Eye, signe: CheckCircle } as const
const COLUMN_ICON_TONE: Partial<Record<PipelineStatus, string>> = { ouvert: 'text-brand', signe: 'text-success' }
const DRAG_TYPE = 'application/x-uplye-devis'

// Figma : « Devis / Pipeline » (30:451), composants Deal Card (29:377), Column Header (15:447).
export function PipelineView({
  devis,
  periodDays,
  outcome,
  onOpen,
  onAddProspect,
}: {
  devis: Devis[]
  periodDays: number
  outcome: ReturnType<typeof useDevisOutcome>
  onOpen: (id: string) => void
  onAddProspect: () => void
}) {
  const { loading, actions, now } = useCommercial()
  const [dragging, setDragging] = useState<Devis | null>(null)
  const [overColumn, setOverColumn] = useState<string | null>(null)
  const [refusing, setRefusing] = useState<Devis | null>(null)

  const inPeriod = (d: Devis) => !!d.signedAt && daysBetween(d.signedAt, now) <= periodDays
  const byStatus = useMemo(() => {
    const map = Object.fromEntries(PIPELINE_STATUSES.map((s) => [s, [] as Devis[]])) as Record<PipelineStatus, Devis[]>
    devis.forEach((d) => {
      if (d.status in map) map[d.status as PipelineStatus].push(d)
    })
    return map
  }, [devis])

  const open = [...byStatus.envoye, ...byStatus.ouvert]
  const openSum = open.reduce((s, d) => s + (devisAmount(d) ?? 0), 0)
  const weighted = open.reduce((s, d) => s + weightedAmount(d), 0)
  const signedSum = byStatus.signe.filter(inPeriod).reduce((s, d) => s + (devisAmount(d) ?? 0), 0)

  const move = (d: Devis, status: PipelineStatus) => {
    if (d.status === status) return
    if (status === 'signe') outcome.requestSign(d)
    else actions.moveDevis(d.id, status)
  }

  const dropProps = (key: string, onDrop: (d: Devis) => void) => ({
    onDragOver: (e: DragEvent) => {
      if (!dragging) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      if (overColumn !== key) setOverColumn(key)
    },
    onDragLeave: (e: DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverColumn((k) => (k === key ? null : k))
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault()
      if (dragging) onDrop(dragging)
      setDragging(null)
      setOverColumn(null)
    },
  })

  return (
    <div className="flex flex-col gap-5">
      <dl className="flex flex-col gap-5 rounded-lg bg-card p-5 lg:flex-row lg:items-center lg:gap-8">
        <div className="flex gap-8">
          <div>
            <dt className="text-meta-md text-muted-foreground">Ouvert</dt>
            <dd className="mt-1 text-stat-md text-foreground">{loading ? <Skeleton className="h-7 w-20" /> : formatEur(openSum)}</dd>
          </div>
          <div>
            <dt className="text-meta-md text-muted-foreground">Pondéré</dt>
            <dd className="mt-1 text-stat-md text-foreground">{loading ? <Skeleton className="h-7 w-20" /> : formatEur(weighted)}</dd>
          </div>
          <div>
            <dt className="text-meta-md text-muted-foreground">Signé sur {periodDays} jours</dt>
            <dd className="mt-1 text-stat-md text-foreground">{loading ? <Skeleton className="h-7 w-20" /> : formatEur(signedSum)}</dd>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap justify-between gap-2 text-body-sm text-foreground">
            <dt>Objectif du trimestre : {formatEur(QUARTER_GOAL)}</dt>
            <dd>
              {formatPercent(signedSum / QUARTER_GOAL)} signé, {formatPercent((signedSum + weighted) / QUARTER_GOAL)} avec le pondéré
            </dd>
          </div>
          <dd
            className="relative h-2 overflow-hidden rounded-full bg-chart-track"
            role="meter"
            aria-label="Avancement de l’objectif du trimestre"
            aria-valuemin={0}
            aria-valuemax={QUARTER_GOAL}
            aria-valuenow={signedSum}
          >
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-surface-3"
              style={{ width: `${Math.min(100, ((signedSum + weighted) / QUARTER_GOAL) * 100)}%` }}
            />
            <span className="absolute inset-y-0 left-0 rounded-full bg-brand" style={{ width: `${Math.min(100, (signedSum / QUARTER_GOAL) * 100)}%` }} />
          </dd>
        </div>
      </dl>

      <div className="-mx-layout-margin overflow-x-auto px-layout-margin pb-2">
        <div className="grid min-w-[1060px] grid-cols-5 gap-4">
          {PIPELINE_STATUSES.map((status) => {
            const Icon = COLUMN_ICON[status]
            const items = byStatus[status]
            const total = items.reduce((s, d) => s + (devisAmount(d) ?? 0), 0)
            const sub =
              status === 'signe'
                ? `${formatEur(signedSum)} sur ${periodDays} jours`
                : total === 0
                  ? 'Sur devis'
                  : status === 'envoye' || status === 'ouvert'
                    ? `${formatEur(total)}, pondéré ${formatEur(items.reduce((s, d) => s + weightedAmount(d), 0))}`
                    : formatEur(total)
            return (
              <section
                key={status}
                aria-labelledby={`col-${status}`}
                className={cn(
                  'flex min-h-[200px] flex-col gap-3 rounded-lg p-1 transition-colors',
                  overColumn === status && 'bg-surface-1 outline-dashed outline-1 outline-line-strong',
                )}
                {...dropProps(status, (d) => move(d, status))}
              >
                <header className="flex flex-col gap-1 px-1">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('size-4', COLUMN_ICON_TONE[status] ?? 'text-foreground')} aria-hidden />
                    <h2 id={`col-${status}`} className="text-title-sm text-foreground">
                      {STATUS_LABEL[status]}
                    </h2>
                    <span className="text-meta-sm text-muted-foreground">{loading ? '' : items.length}</span>
                    <span className="ml-auto text-meta-sm text-muted-foreground">{formatPercent(STATUS_PROBABILITY[status])}</span>
                  </div>
                  <p className="text-body-sm text-muted-foreground">{loading ? ' ' : sub}</p>
                </header>
                <ul className="flex flex-col gap-3" aria-label={`Devis ${STATUS_LABEL[status].toLowerCase()}`}>
                  {loading ? (
                    <li>
                      <Skeleton className="h-[132px] rounded-lg" />
                    </li>
                  ) : (
                    items.map((d) => (
                      <li key={d.id}>
                        <DealCard
                          devis={d}
                          now={now}
                          dragging={dragging?.id === d.id}
                          onOpen={() => onOpen(d.id)}
                          onDragStart={() => setDragging(d)}
                          onDragEnd={() => {
                            setDragging(null)
                            setOverColumn(null)
                          }}
                          onMove={(s) => move(d, s)}
                          onRefuse={() => setRefusing(d)}
                          onArchive={() => outcome.archive(d)}
                        />
                      </li>
                    ))
                  )}
                </ul>
                {status === 'a_chiffrer' && (
                  <Button variant="ghost" size="sm" leadingIcon={<Plus />} className="w-fit" onClick={onAddProspect}>
                    Ajouter un prospect
                  </Button>
                )}
              </section>
            )
          })}
        </div>
      </div>

      {dragging && (
        <div className="fixed inset-x-0 bottom-24 z-40 flex justify-center px-4" aria-hidden>
          <div className="grid w-full max-w-[540px] grid-cols-2 gap-3 rounded-xl bg-popover/90 p-2 shadow-lg backdrop-blur">
            <div
              {...dropProps('refuse', (d) => setRefusing(d))}
              className={cn(
                'flex items-center gap-3 rounded-lg border border-dashed border-danger px-4 py-3 text-danger transition-colors',
                overColumn === 'refuse' ? 'bg-danger-tone' : 'bg-danger-tone/40',
              )}
            >
              <XCircle className="size-5 shrink-0" />
              <span className="flex flex-col">
                <span className="text-title-sm text-foreground">Refusé</span>
                <span className="text-body-sm text-muted-foreground">Motif demandé au dépôt</span>
              </span>
            </div>
            <div
              {...dropProps('archive', (d) => outcome.archive(d))}
              className={cn(
                'flex items-center gap-3 rounded-lg border border-dashed border-line-strong px-4 py-3 transition-colors',
                overColumn === 'archive' ? 'bg-surface-2' : 'bg-surface-1',
              )}
            >
              <Tray className="size-5 shrink-0 text-foreground" />
              <span className="flex flex-col">
                <span className="text-title-sm text-foreground">Archiver</span>
                <span className="text-body-sm text-muted-foreground">Sans suite, sans motif</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {refusing && (
        <RefusalPanel
          devis={refusing}
          onCancel={() => setRefusing(null)}
          onConfirm={(reason) => {
            outcome.quickRefuse(refusing, reason)
            setRefusing(null)
          }}
          onDetail={(reason) => {
            outcome.requestRefuse(refusing, reason)
            setRefusing(null)
          }}
        />
      )}
    </div>
  )
}

function DealCard({
  devis,
  now,
  dragging,
  onOpen,
  onDragStart,
  onDragEnd,
  onMove,
  onRefuse,
  onArchive,
}: {
  devis: Devis
  now: Date
  dragging: boolean
  onOpen: () => void
  onDragStart: () => void
  onDragEnd: () => void
  onMove: (status: PipelineStatus) => void
  onRefuse: () => void
  onArchive: () => void
}) {
  const client = useClientsById().get(devis.clientId)
  const hint = cardHint(devis)
  const age = cardAge(devis, now)
  const HintIcon = hint.tone === 'success' ? CheckCircle : Eye
  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_TYPE, devis.id)
        e.dataTransfer.effectAllowed = 'move'
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      className={cn(
        'group relative flex cursor-grab flex-col gap-3 rounded-lg bg-card p-3 transition-shadow hover:shadow-sm active:cursor-grabbing',
        dragging && 'opacity-50 ring-2 ring-brand',
      )}
    >
      <div className="flex items-start gap-2">
        <h3 className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onOpen}
            className="focus-ring block w-full truncate rounded-sm text-left text-title-sm text-foreground after:absolute after:inset-0 after:content-['']"
          >
            {client?.name}
          </button>
        </h3>
        <span className="shrink-0 text-title-sm tabular-nums text-foreground">{amountLabel(devis)}</span>
      </div>
      <p className="truncate text-body-sm text-muted-foreground">{devis.title}</p>
      <p className={cn('flex items-center gap-1.5 text-body-sm', hint.tone === 'warning' ? 'text-foreground' : 'text-muted-foreground')}>
        <HintIcon className={cn('size-3.5 shrink-0', hint.tone === 'warning' ? 'text-danger' : 'text-muted-foreground')} aria-hidden />
        <span className="truncate">{hint.label}</span>
      </p>
      <div className="flex items-center gap-2 border-t border-border pt-2.5">
        <Avatar initials={devis.owner} size="xs" tone="neutral" className="text-meta-sm" />
        <span className="min-w-0 flex-1 truncate text-body-sm text-foreground">{devis.nextAction}</span>
        {age && (
          <span
            className={cn('inline-flex shrink-0 items-center gap-1 text-meta-sm', age.late ? 'text-danger' : 'text-muted-foreground')}
            title={age.late ? 'Brouillon oublié' : undefined}
          >
            {age.late ? <HourglassMedium className="size-3.5" aria-hidden /> : <Clock className="size-3.5" aria-hidden />}
            {age.days} j<span className="sr-only">{age.late ? ', en retard' : ''}</span>
          </span>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton
            label={`Actions pour ${client?.name}`}
            size="sm"
            className="absolute right-1.5 top-1.5 z-10 size-7 bg-card opacity-0 shadow-xs focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
          >
            <DotsThree />
          </IconButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Déplacer vers</DropdownMenuLabel>
          {PIPELINE_STATUSES.filter((s) => s !== devis.status).map((s) => (
            <DropdownMenuItem key={s} onSelect={() => onMove(s)}>
              {STATUS_LABEL[s]}
              {s === 'signe' ? '…' : ''}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={onRefuse}>
            Refusé…
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onArchive}>Archiver</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  )
}

/** Figma : popover « Pourquoi ce refus ? » au dépôt dans la zone Refusé (30:451). */
function RefusalPanel({
  devis,
  onCancel,
  onConfirm,
  onDetail,
}: {
  devis: Devis
  onCancel: () => void
  onConfirm: (reason: string) => void
  onDetail: (reason?: string) => void
}) {
  const client = useClientsById().get(devis.clientId)
  const [reason, setReason] = useState<string>(QUICK_LOSS_REASONS[0]!.label)
  const amount = devisAmount(devis)
  const options = [...QUICK_LOSS_REASONS.map((r) => ({ value: r.label, label: r.short! })), { value: 'autre', label: 'Autre' }]
  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="refusal-title"
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
      className="fixed bottom-6 right-6 z-50 flex w-[calc(100vw-3rem)] max-w-[280px] flex-col gap-3 rounded-lg bg-popover p-4 shadow-lg animate-pop-in"
    >
      <h2 id="refusal-title" className="text-title-sm text-foreground">
        Pourquoi ce refus ?
      </h2>
      <p className="text-body-xs text-muted-foreground">
        {client?.name}
        {amount ? `, ${formatEur(amount)}` : ''}. Le motif alimente l’analyse gagnés et perdus.
      </p>
      <ChoiceGroup label="Motif du refus" options={options} value={reason} onValueChange={setReason} />
      <Button variant="destructive" autoFocus onClick={() => (reason === 'autre' ? onDetail(undefined) : onConfirm(reason))}>
        Marquer comme refusé
      </Button>
      <div className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={() => onDetail(reason === 'autre' ? undefined : reason)}>
          Détailler
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  )
}
