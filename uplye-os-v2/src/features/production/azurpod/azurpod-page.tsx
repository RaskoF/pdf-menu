import { useMemo, useState } from 'react'
import { CaretLeft, CaretRight, CheckCircle, Clock, LinkSimple, Plus, WarningCircle } from '@phosphor-icons/react'
import { Badge, Button, Card, CardHeader, Dialog, DialogContent, IconButton, Progress, Skeleton, Tabs, TabsList, TabsTrigger, useToast } from '@/components/ui'
import { PageHeader } from '@/components/app/page-header'
import { addDays, daysBetween, formatDayLong, formatMonthYear, formatShortDate, hourOf, monthGrid, toIso, weekdayLabel } from '@/lib/dates'
import { formatEur, pluralize } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useProduction } from '../store'
import { DELIVERY_BADGE, occupancy, promisedDate, relativeDay, sessionHours, sessionPrice, STUDIO_CLOSE, STUDIO_OPEN, weekDays } from '../lib'
import { NewSessionSheet } from './new-session-sheet'
import type { StudioDelivery, StudioSession } from '../types'

type View = 'jour' | 'semaine' | 'mois'
const FORMULA_LABEL = { standard: 'Standard', premontage: 'Pré-montage', cle_en_main: 'Clé en main', pack: 'Pack' } as const
const BOOKING_URL = 'https://azurpod.fr/reserver'
const HOURS = [9, 11, 13, 15, 17]
const pct = (x: number) => `${Math.round(x * 100)} %`
const decimal = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',')

// Figma : « Azurpod » (66:534), « Azurpod / Mois » (114:1205), « Azurpod / Nouvelle session » (135:2700)
export function AzurpodPage() {
  const toast = useToast()
  const { data, loading, actions, now } = useProduction()
  const today = toIso(now)
  const [view, setView] = useState<View>('semaine')
  const [anchor, setAnchor] = useState(today)
  const [creating, setCreating] = useState(false)
  const [opened, setOpened] = useState<StudioSession | null>(null)

  const sessions = useMemo(() => data?.sessions ?? [], [data?.sessions])
  const thisWeek = weekDays(today)
  const weekLoad = occupancy(sessions, thisWeek)
  const weekCount = sessions.filter((s) => thisWeek.includes(s.date) && !s.option).length

  const month = today.slice(0, 7)
  const monthSessions = sessions.filter((s) => s.date.startsWith(month) && !s.option)
  const monthDays = monthGrid(today).filter((d) => d.startsWith(month) && ![0, 6].includes(new Date(`${d}T12:00:00`).getDay()))
  const monthLoad = occupancy(sessions, monthDays)
  const monthRevenue = monthSessions.reduce((s, x) => s + sessionPrice(x), 0)
  const deliveredThisMonth = (data?.deliveries ?? []).filter((d) => d.status === 'livre' && d.deliveredAt)
  const onTime = deliveredThisMonth.filter((d) => d.deliveredAt! <= promisedDate(d.recordedAt, d.promiseDays)).length

  const shift = (dir: 1 | -1) =>
    setAnchor((a) =>
      view === 'jour' ? addDays(a, dir) : view === 'semaine' ? addDays(a, dir * 7) : toIso(new Date(Number(a.slice(0, 4)), Number(a.slice(5, 7)) - 1 + dir, 1)),
    )

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(BOOKING_URL)
      toast({ message: 'Lien de réservation copié', variant: 'success' })
    } catch {
      toast({ message: `Copie impossible. Le lien : ${BOOKING_URL}`, variant: 'error' })
    }
  }

  const calendarTitle = view === 'mois' ? `${formatMonthYear(anchor).split(' ')[0]} au studio` : view === 'jour' ? formatDayLong(anchor) : 'Semaine du studio'
  const viewDays = view === 'jour' ? [anchor] : weekDays(anchor)

  return (
    <div className="flex min-h-full flex-col gap-5 p-layout-margin">
      <PageHeader
        title="Azurpod"
        subtitle={
          loading
            ? 'Chargement du studio…'
            : `Studio podcast. Cette semaine : ${pluralize(weekCount, 'session')}, ${decimal(weekLoad.hours)} h occupées sur ${weekLoad.capacity} h.`
        }
        actions={
          <>
            <Button variant="outline" leadingIcon={<LinkSimple />} onClick={copyLink}>
              Lien de réservation
            </Button>
            <Button leadingIcon={<Plus />} onClick={() => setCreating(true)}>
              Nouvelle session
            </Button>
          </>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Card>
            <CardHeader title="À livrer" action={<span className="text-body-xs text-muted-foreground">Délai promis au client</span>} />
            {loading ? (
              <Skeleton className="h-40" />
            ) : (
              <ul className="flex flex-col">
                {(data?.deliveries ?? []).map((d) => (
                  <DeliveryRow
                    key={d.id}
                    delivery={d}
                    now={now}
                    onAdvance={(status) => actions.updateDelivery(d.id, (x) => ({ ...x, status, ...(status === 'livre' ? { deliveredAt: today } : {}) }))}
                    onRemind={() => toast({ message: `Relance envoyée : ${d.blockedReason?.toLowerCase() ?? 'élément manquant'}`, variant: 'success' })}
                  />
                ))}
              </ul>
            )}
          </Card>

          <Card className="gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-h3 text-foreground">{calendarTitle}</h2>
              <div className="flex items-center gap-1">
                <IconButton label="Période précédente" size="sm" onClick={() => shift(-1)}>
                  <CaretLeft />
                </IconButton>
                <IconButton label="Période suivante" size="sm" onClick={() => shift(1)}>
                  <CaretRight />
                </IconButton>
                {anchor !== today && (
                  <Button variant="ghost" size="sm" onClick={() => setAnchor(today)}>
                    Aujourd’hui
                  </Button>
                )}
              </div>
              <span className="ml-auto text-body-xs text-muted-foreground">
                {view === 'mois'
                  ? `${pluralize(monthSessions.length, 'session')}, ${pct(monthLoad.rate)} d’occupation`
                  : `${STUDIO_OPEN}:00 – ${STUDIO_CLOSE}:00`}
              </span>
              <Tabs value={view} onValueChange={(v) => setView(v as View)}>
                <TabsList aria-label="Affichage du calendrier">
                  <TabsTrigger value="jour">Jour</TabsTrigger>
                  <TabsTrigger value="semaine">Semaine</TabsTrigger>
                  <TabsTrigger value="mois">Mois</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {loading ? (
              <Skeleton className="h-64" />
            ) : view === 'mois' ? (
              <MonthGrid anchor={anchor} today={today} sessions={sessions} onOpen={setOpened} />
            ) : (
              <Timeline days={viewDays} today={today} sessions={sessions} onOpen={setOpened} />
            )}
          </Card>
        </div>

        <aside className="flex flex-col gap-4" aria-label="Suivi du studio">
          <Card>
            <CardHeader title="Packs et saisons" />
            {(data?.packs ?? []).map((p) => (
              <div key={p.id} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-title-sm text-foreground">{p.label}</p>
                  <p className="text-body-xs text-muted-foreground">
                    {p.used} {p.unit === 'h' ? 'h' : 'épisodes'} sur {p.total}
                  </p>
                </div>
                <Progress value={p.used} max={p.total} label={`${p.label} : ${p.used} sur ${p.total}`} />
                <p className="text-body-sm text-muted-foreground">{p.next}</p>
              </div>
            ))}
          </Card>
          <Card>
            <CardHeader title={formatMonthYear(today).split(' ')[0]!} />
            <dl className="flex flex-col gap-2 text-body-sm">
              {[
                ['Chiffre d’affaires', `${formatEur(monthRevenue)} HT`],
                ['Sessions', String(monthSessions.length)],
                ['Taux d’occupation', pct(monthLoad.rate)],
                ['Délai d’envoi tenu', `${onTime} sur ${deliveredThisMonth.length}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-title-sm text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="text-body-xs text-muted-foreground">Les séances de pack sont prépayées : elles ne comptent pas dans le chiffre du mois.</p>
          </Card>
        </aside>
      </div>

      <NewSessionSheet open={creating} onOpenChange={setCreating} />
      <SessionDialog session={opened} onClose={() => setOpened(null)} />
    </div>
  )
}

function DeliveryRow({
  delivery: d,
  now,
  onAdvance,
  onRemind,
}: {
  delivery: StudioDelivery
  now: Date
  onAdvance: (s: StudioDelivery['status']) => void
  onRemind: () => void
}) {
  const badge = DELIVERY_BADGE[d.status]
  const due = promisedDate(d.recordedAt, d.promiseDays)
  const late = d.status !== 'livre' && daysBetween(due, now) > 0
  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-t border-border py-3 first:border-0 md:grid-cols-[minmax(0,220px)_120px_1fr_auto_auto]">
      <div className="min-w-0">
        <p className="text-title-sm text-foreground">{d.title}</p>
        <p className="truncate text-body-sm text-muted-foreground">{d.detail}</p>
      </div>
      <p className="hidden text-body-sm text-foreground md:block">
        {FORMULA_LABEL[d.formula]}, J+{d.promiseDays}
      </p>
      <p
        className={cn(
          'flex items-center gap-1.5 text-body-sm',
          d.status === 'bloque' || late ? 'text-danger' : d.status === 'livre' ? 'text-success' : 'text-foreground',
        )}
      >
        {d.status === 'livre' ? (
          <CheckCircle className="size-4" aria-hidden />
        ) : d.status === 'bloque' ? (
          <WarningCircle className="size-4" aria-hidden />
        ) : (
          <Clock className="size-4" aria-hidden />
        )}
        {d.status === 'livre'
          ? `envoyé le ${formatShortDate(d.deliveredAt!)}`
          : d.status === 'bloque'
            ? `bloqué depuis ${Math.max(1, daysBetween(d.blockedSince ?? due, now))} j`
            : late
              ? `en retard de ${daysBetween(due, now)} j`
              : relativeDay(due, now)}
      </p>
      <Badge variant={badge.variant} className="justify-self-start">
        {badge.label}
      </Badge>
      <div className="justify-self-end">
        {d.status === 'bloque' && (
          <Button size="sm" variant="outline" onClick={onRemind}>
            Relancer
          </Button>
        )}
        {d.status === 'a_monter' && (
          <Button size="sm" variant="outline" onClick={() => onAdvance('en_montage')}>
            Monter
          </Button>
        )}
        {d.status === 'en_montage' && (
          <Button size="sm" variant="outline" onClick={() => onAdvance('livre')}>
            Marquer envoyé
          </Button>
        )}
      </div>
    </li>
  )
}

function Timeline({ days, today, sessions, onOpen }: { days: string[]; today: string; sessions: StudioSession[]; onOpen: (s: StudioSession) => void }) {
  const span = STUDIO_CLOSE - STUDIO_OPEN
  const pos = (time: string) => ((hourOf(time) - STUDIO_OPEN) / span) * 100
  return (
    <div className="flex flex-col gap-2">
      <div className="ml-20 mr-12 hidden h-4 sm:block" aria-hidden>
        <div className="relative">
          {HOURS.map((h) => (
            <span key={h} className="absolute text-body-xs text-muted-foreground" style={{ left: `${((h - STUDIO_OPEN) / span) * 100}%` }}>
              {h} h
            </span>
          ))}
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {days.map((day) => {
          const list = sessions.filter((s) => s.date === day)
          const load = occupancy(sessions, [day])
          return (
            <li key={day} className="flex items-center gap-3">
              <span className={cn('w-16 shrink-0 text-body-sm', day === today ? 'text-title-sm text-foreground' : 'text-foreground')}>
                {weekdayLabel(day)} {Number(day.slice(8))}
              </span>
              <div className="relative h-10 flex-1 rounded-md bg-surface-1" role="list" aria-label={`Sessions du ${formatDayLong(day)}`}>
                {list.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    role="listitem"
                    onClick={() => onOpen(s)}
                    className={cn(
                      'focus-ring absolute inset-y-0.5 overflow-hidden rounded-sm border-l-2 px-2 text-left',
                      s.option ? 'border-dashed border-line-strong bg-surface-2/60' : 'border-dot-teal bg-tag-teal-bg',
                    )}
                    style={{ left: `${pos(s.start)}%`, width: `${pos(s.end) - pos(s.start)}%` }}
                  >
                    <span className="block truncate text-label-sm text-tag-teal-fg">{s.label}</span>
                    <span className="block truncate text-body-xs text-tag-teal-fg/80">
                      {s.start} – {s.end}
                    </span>
                  </button>
                ))}
              </div>
              <span className="w-9 shrink-0 text-right text-body-xs text-muted-foreground">{pct(load.rate)}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function MonthGrid({ anchor, today, sessions, onOpen }: { anchor: string; today: string; sessions: StudioSession[]; onOpen: (s: StudioSession) => void }) {
  const days = monthGrid(anchor)
  const month = anchor.slice(0, 7)
  const weeks = Array.from({ length: days.length / 7 }, (_, i) => days.slice(i * 7, i * 7 + 7)).filter((w) => w.some((d) => d.startsWith(month)))
  return (
    <div className="-mx-5 -mb-5 overflow-x-auto" role="grid" aria-label={formatMonthYear(anchor)}>
      <div className="grid min-w-[640px] grid-cols-7 border-b border-border" role="row">
        {weeks[0]!.map((d) => (
          <span key={d} role="columnheader" className="px-3 py-2 text-meta-md text-muted-foreground">
            {weekdayLabel(d)}
          </span>
        ))}
      </div>
      {weeks.map((w) => (
        <div key={w[0]} role="row" className="grid min-w-[640px] grid-cols-7 border-b border-border last:border-0">
          {w.map((d) => {
            const list = sessions.filter((s) => s.date === d)
            const out = !d.startsWith(month)
            return (
              <div key={d} role="gridcell" className="flex min-h-24 flex-col gap-1 border-r border-border p-2 last:border-0">
                <span
                  className={cn(
                    'grid size-6 place-content-center rounded-full text-body-sm',
                    d === today ? 'bg-brand text-brand-foreground' : out ? 'text-ink-subtle' : 'text-foreground',
                  )}
                >
                  {Number(d.slice(8))}
                </span>
                {list.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onOpen(s)}
                    className={cn(
                      'focus-ring truncate rounded-sm px-2 py-0.5 text-left text-body-xs',
                      s.option ? 'border border-line-strong text-foreground' : 'bg-tag-teal-bg text-tag-teal-fg',
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function SessionDialog({ session, onClose }: { session: StudioSession | null; onClose: () => void }) {
  const toast = useToast()
  const { data, actions } = useProduction()
  if (!session) return null
  const pack = session.formula === 'pack' ? data?.packs.find((p) => p.clientId === session.clientId && p.unit === 'h') : undefined
  const remove = () => {
    // Annulation : la séance libère le créneau et rend les heures au pack
    actions.removeSession(session.id)
    if (pack) actions.updatePack(pack.id, (p) => ({ ...p, used: Math.max(0, p.used - sessionHours(session)) }))
    toast({ message: `Session annulée : ${session.label}`, variant: 'success' })
    onClose()
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        title={session.label}
        description={`${formatDayLong(session.date)}, ${session.start} – ${session.end}`}
        footer={
          <>
            {session.option && (
              <Button
                variant="outline"
                onClick={() => {
                  actions.updateSession(session.id, (s) => ({ ...s, option: false, label: s.label.replace(/^Option : /, '') }))
                  onClose()
                }}
              >
                Confirmer l’option
              </Button>
            )}
            <Button variant="destructive" onClick={remove}>
              Annuler la session
            </Button>
          </>
        }
      >
        <dl className="grid grid-cols-2 gap-3 text-body-sm">
          <div>
            <dt className="text-muted-foreground">Formule</dt>
            <dd className="text-title-sm text-foreground">{FORMULA_LABEL[session.formula]}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Prix</dt>
            <dd className="text-title-sm text-foreground">{session.formula === 'pack' ? 'Inclus au pack' : `${formatEur(sessionPrice(session))} HT`}</dd>
          </div>
        </dl>
      </DialogContent>
    </Dialog>
  )
}
