import { useId, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  CalendarBlank,
  Check,
  CheckCircle,
  Clock,
  DotsThree,
  Export,
  FileText,
  LinkSimple,
  Microphone,
  Plus,
  Sparkle,
  VideoCamera,
  WarningCircle,
} from '@phosphor-icons/react'
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
  Input,
  Skeleton,
  useToast,
} from '@/components/ui'
import { EmptyState } from '@/components/app/empty-state'
import { pluralize } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCommercial } from '../store'
import { MEMBERS } from '../mock-data'
import { formatShortDate } from '../lib'
import type { Meeting } from '../types'

type Filter = 'traiter' | 'clients' | 'internes'

const dayTime = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const memberName = (initials: string) => MEMBERS.find((m) => m.id === initials)?.name ?? initials

/** Réponses de l'assistant aux questions proposées (prototype : pas encore relié à Fireflies). */
function answer(m: Meeting, question: string) {
  const q = question.toLowerCase()
  if (q.includes('budget')) {
    const hit = m.transcript.find((t) => /budget|€|euros?/i.test(t.text))
    return hit ? `${hit.speaker} à ${hit.t} : « ${hit.text} »` : 'Aucun budget évoqué pendant ce rendez-vous.'
  }
  if (q.includes('résumé') || q.includes('resume')) {
    const todo = m.actions.filter((a) => !a.taskCreated)
    return `${m.summary} ${todo.length ? `Reste à créer : ${todo.map((a) => a.label.toLowerCase()).join(', ')}.` : 'Toutes les actions sont créées.'}`
  }
  return 'Je n’ai pas trouvé de passage qui réponde à cette question dans la transcription.'
}

// Figma : « Réunions » (37:1407) et « Fireflies déconnecté » (119:2707).
export function MeetingsPage() {
  const { data, loading, actions } = useCommercial()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<Filter>('traiter')

  const meetings = useMemo(() => [...(data?.meetings ?? [])].sort((a, b) => b.date.localeCompare(a.date)), [data?.meetings])
  const filtered = meetings.filter((m) => (filter === 'traiter' ? true : filter === 'clients' ? m.kind === 'client' : m.kind === 'interne'))
  const toTreat = filtered.filter((m) => !m.treated)
  const treated = filtered.filter((m) => m.treated)
  const selected = meetings.find((m) => m.id === params.get('rdv')) ?? toTreat[0] ?? filtered[0]
  const connected = data?.firefliesConnected ?? true

  const select = (id: string) => setParams({ rdv: id }, { replace: true })

  const exportNotes = (m: Meeting) => {
    const lines = [
      `${m.title} — ${m.company}`,
      `${formatShortDate(m.date)} à ${m.time}, ${m.duration} min, ${m.platform}`,
      '',
      'En 30 secondes',
      m.summary,
      ...m.highlights.map((h) => `- ${h}`),
      '',
      'Points d’action',
      ...m.actions.map((a) => `- [${a.taskCreated ? 'x' : ' '}] ${a.label} (${memberName(a.owner)}, ${a.due})`),
    ]
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `compte-rendu-${m.id}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid min-h-full lg:h-full lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)_300px]">
      <section aria-labelledby="reunions-title" className="flex flex-col gap-4 border-border p-layout-margin lg:overflow-y-auto lg:border-r">
        <div className="flex items-start justify-between gap-2">
          <h1 id="reunions-title" className="text-h1 text-foreground">
            Réunions
          </h1>
          <IconButton variant="outline" label="Exporter le compte rendu" disabled={!selected} onClick={() => selected && exportNotes(selected)}>
            <Export />
          </IconButton>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn('focus-ring -mt-2 flex w-fit items-center gap-1.5 rounded-sm text-body-sm', connected ? 'text-muted-foreground' : 'text-danger')}
            >
              {connected ? <CheckCircle className="size-4 text-success" aria-hidden /> : <WarningCircle className="size-4" aria-hidden />}
              {connected ? 'Fireflies connecté, synchronisé il y a 4 min' : 'Fireflies déconnecté depuis le 17 oct.'}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {connected ? (
              <>
                <DropdownMenuItem onSelect={() => toast({ message: 'Synchronisation lancée', variant: 'success' })}>Synchroniser maintenant</DropdownMenuItem>
                <DropdownMenuItem destructive onSelect={() => actions.setFireflies(false)}>
                  Déconnecter Fireflies
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onSelect={() => actions.setFireflies(true)}>Reconnecter Fireflies</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les réunions">
          <Chip active={filter === 'traiter'} count={meetings.filter((m) => !m.treated).length} onClick={() => setFilter('traiter')}>
            À traiter
          </Chip>
          <Chip active={filter === 'clients'} count={meetings.filter((m) => m.kind === 'client').length} onClick={() => setFilter('clients')}>
            Clients
          </Chip>
          <Chip active={filter === 'internes'} count={meetings.filter((m) => m.kind === 'interne').length} onClick={() => setFilter('internes')}>
            Internes
          </Chip>
        </div>
        {loading ? (
          <Skeleton className="h-64 rounded-lg" />
        ) : (
          connected && (
            <>
              <MeetingGroup title="À traiter" items={toTreat} selectedId={selected?.id} onSelect={select} />
              <MeetingGroup title="Traitées" items={treated} selectedId={selected?.id} onSelect={select} />
            </>
          )
        )}
      </section>

      {!connected ? (
        <div className="grid place-content-center p-layout-margin lg:col-span-1 xl:col-span-2">
          <EmptyState
            icon={<Microphone />}
            title="Reconnectez Fireflies"
            action={
              <Button variant="brand" leadingIcon={<LinkSimple />} onClick={() => actions.setFireflies(true)}>
                Reconnecter Fireflies
              </Button>
            }
          >
            Les réunions depuis le 17 oct. n’ont pas été importées. Une fois reconnecté, l’OS récupère les comptes rendus et les actions.
          </EmptyState>
        </div>
      ) : selected ? (
        <MeetingDetail key={selected.id} meeting={selected} />
      ) : (
        <div className="grid place-content-center p-layout-margin">
          <EmptyState icon={<Microphone />} title="Aucune réunion">
            Les rendez-vous enregistrés par Fireflies apparaîtront ici avec leur compte rendu.
          </EmptyState>
        </div>
      )}
    </div>
  )
}

function MeetingGroup({ title, items, selectedId, onSelect }: { title: string; items: Meeting[]; selectedId?: string; onSelect: (id: string) => void }) {
  if (!items.length) return null
  return (
    <div className="flex flex-col gap-1">
      <h2 className="mb-1 text-meta-md text-muted-foreground">{title}</h2>
      <ul className="flex flex-col gap-1">
        {items.map((m) => {
          const todo = m.actions.filter((a) => !a.taskCreated).length
          return (
            <li key={m.id}>
              <button
                type="button"
                aria-current={m.id === selectedId || undefined}
                onClick={() => onSelect(m.id)}
                className={cn(
                  'focus-ring flex w-full gap-3 rounded-lg p-3 text-left transition-colors hover:bg-surface-hover',
                  m.id === selectedId && 'bg-card',
                )}
              >
                <Avatar initials={m.initials} size="md" tone="neutral" className="text-label-sm" />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-title-sm text-foreground">{m.title}</span>
                  <span className="truncate text-body-sm text-muted-foreground">{m.company}</span>
                  <span className="text-body-xs text-muted-foreground">
                    {formatShortDate(m.date)}, {m.duration} min{!m.treated && todo ? `, ${pluralize(todo, 'action')} à traiter` : ''}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function MeetingDetail({ meeting: m }: { meeting: Meeting }) {
  const { actions } = useCommercial()
  const toast = useToast()
  const questionId = useId()
  const [transcriptOpen, setTranscriptOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [reply, setReply] = useState<{ q: string; a: string } | null>(null)
  const pending = m.actions.filter((a) => !a.taskCreated)

  const update = (fn: (x: Meeting) => Meeting) =>
    actions.updateMeeting(m.id, (x) => {
      const next = fn(x)
      const done = next.actions.every((a) => a.taskCreated) && (!next.impact || !!next.impact.applied || !!next.impact.dismissed)
      return { ...next, treated: done }
    })
  const createTasks = (ids: string[]) => {
    update((x) => ({ ...x, actions: x.actions.map((a) => (ids.includes(a.id) ? { ...a, taskCreated: true } : a)) }))
    toast({ message: `${pluralize(ids.length, 'tâche ajoutée', 'tâches ajoutées')} au Kanban`, variant: 'success' })
  }
  const ask = (q: string) => {
    if (!q.trim()) return
    setReply({ q, a: answer(m, q) })
    setQuestion('')
  }

  return (
    <>
      <article className="flex min-w-0 flex-col gap-6 border-border p-layout-margin lg:overflow-y-auto xl:border-r" aria-labelledby="rdv-title">
        <header className="flex flex-col gap-2">
          <p className="text-meta-md text-muted-foreground">
            {m.company}, {m.kind === 'client' ? 'RDV client' : 'réunion interne'}
          </p>
          <div className="flex flex-wrap items-start gap-3">
            <h2 id="rdv-title" className="flex-1 text-h1 text-foreground">
              {m.title}
            </h2>
            <Button variant="outline" leadingIcon={<FileText />} onClick={() => setTranscriptOpen(true)}>
              Transcription
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton variant="outline" label="Plus d’actions">
                  <DotsThree />
                </IconButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => actions.updateMeeting(m.id, (x) => ({ ...x, treated: !x.treated }))}>
                  {m.treated ? 'Remettre à traiter' : 'Marquer comme traitée'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="flex flex-wrap items-center gap-x-5 gap-y-2 text-body-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarBlank className="size-4" aria-hidden />
              {capitalize(dayTime.format(new Date(`${m.date}T12:00:00`)))}, {m.time}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden />
              {m.duration} min
            </span>
            <span className="inline-flex items-center gap-1.5">
              <VideoCamera className="size-4" aria-hidden />
              {m.platform}
            </span>
            <span className="flex -space-x-1" aria-label={`Participants : ${m.participants.join(', ')}`}>
              {m.participants.map((p) => (
                <Avatar key={p} initials={p} size="sm" tone="neutral" className="ring-2 ring-background" />
              ))}
            </span>
          </p>
        </header>

        <section className="flex flex-col gap-3 rounded-lg bg-card p-5" aria-labelledby="rdv-summary">
          <h3 id="rdv-summary" className="flex items-center gap-2 text-title-md text-foreground">
            <Sparkle className="size-4" aria-hidden />
            En 30 secondes
          </h3>
          <p className="text-body-md text-foreground">{m.summary}</p>
          <ul className="flex flex-col gap-1.5">
            {m.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2 text-body-sm text-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                {h}
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="rdv-actions">
          <div className="flex flex-wrap items-center gap-3">
            <h3 id="rdv-actions" className="flex-1 text-title-md text-foreground">
              Points d’action détectés
            </h3>
            {pending.length > 0 && (
              <Button variant="brand" size="sm" leadingIcon={<Plus />} onClick={() => createTasks(pending.map((a) => a.id))}>
                Créer {pending.length > 1 ? `les ${pending.length} tâches` : 'la tâche'}
              </Button>
            )}
          </div>
          <ul className="flex flex-col gap-2">
            {m.actions.map((a) => (
              <li key={a.id} className="flex items-center gap-3 rounded-lg bg-card px-4 py-3">
                <Checkbox
                  checked={a.taskCreated}
                  disabled={a.taskCreated}
                  onCheckedChange={(v) => v === true && createTasks([a.id])}
                  aria-label={`Créer la tâche : ${a.label}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-title-sm text-foreground">{a.label}</p>
                  <p className="text-body-xs text-muted-foreground">
                    {memberName(a.owner)}, {a.due}
                  </p>
                </div>
                <Avatar initials={a.owner} size="sm" tone="neutral" />
                {a.taskCreated ? (
                  <Badge variant="green">Tâche créée</Badge>
                ) : (
                  <Button size="sm" variant="outline" leadingIcon={<Plus />} onClick={() => createTasks([a.id])}>
                    Créer la tâche
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>

        {m.impact && !m.impact.dismissed && (
          <section className="flex flex-col gap-3" aria-labelledby="rdv-impact">
            <h3 id="rdv-impact" className="text-title-md text-foreground">
              Impact sur le projet
            </h3>
            <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
              <p className="flex items-center gap-2 text-title-sm text-foreground">
                <Sparkle className="size-4" aria-hidden />
                {m.impact.title}
              </p>
              <p className="flex items-center gap-2 text-body-sm">
                <span className="text-muted-foreground">{m.impact.from}</span>
                <ArrowRight className="size-3.5 text-muted-foreground" aria-label="devient" />
                <span className="text-title-sm text-foreground">{m.impact.to}</span>
              </p>
              <p className="text-body-xs text-muted-foreground">{m.impact.quote}</p>
              {m.impact.applied ? (
                <Badge variant="green" className="w-fit">
                  Appliqué au déroulé
                </Badge>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      update((x) => ({ ...x, impact: x.impact && { ...x.impact, applied: true } }))
                      toast({ message: 'Déroulé du tournage mis à jour', variant: 'success' })
                    }}
                  >
                    Appliquer
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => update((x) => ({ ...x, impact: x.impact && { ...x.impact, dismissed: true } }))}>
                    Ignorer
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}
      </article>

      <aside
        className="flex flex-col justify-between gap-6 p-layout-margin lg:col-span-2 xl:col-span-1 xl:overflow-y-auto"
        aria-label="Moments clés et assistant"
      >
        <section className="flex flex-col gap-3" aria-labelledby="rdv-moments">
          <h3 id="rdv-moments" className="text-meta-md text-muted-foreground">
            Moments clés
          </h3>
          <ol className="flex flex-col gap-3">
            {m.moments.map((k) => (
              <li key={k.t} className="flex items-start gap-3">
                <span className="rounded-xs bg-surface-1 px-1.5 py-0.5 text-meta-sm tabular-nums text-foreground">{k.t}</span>
                <span className="text-body-sm text-foreground">{k.label}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col gap-2 rounded-lg bg-card p-4" aria-labelledby="rdv-ask">
          <h3 id="rdv-ask" className="flex items-center gap-2 text-title-sm text-foreground">
            <Sparkle className="size-4" aria-hidden />
            Demander à l’assistant
          </h3>
          {['Budget évoqué ?', 'Résumé pour Allan'].map((q) => (
            <Button key={q} variant="ghost" size="sm" className="justify-start" onClick={() => ask(q)}>
              {q}
            </Button>
          ))}
          {reply && (
            <div className="rounded-md bg-surface-1 p-3 text-body-sm text-foreground" aria-live="polite">
              <p className="mb-1 text-label-sm text-muted-foreground">{reply.q}</p>
              {reply.a}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              ask(question)
            }}
          >
            <label htmlFor={questionId} className="sr-only">
              Poser une question sur ce RDV
            </label>
            <Input id={questionId} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Poser une question sur ce RDV" />
          </form>
        </section>
      </aside>

      <Dialog open={transcriptOpen} onOpenChange={setTranscriptOpen}>
        <DialogContent className="max-w-[640px]" title="Transcription" description={`${m.title}, ${m.company}. Extraits horodatés par Fireflies.`}>
          <ol className="flex flex-col gap-3">
            {m.transcript.map((t) => (
              <li key={t.t} className="flex gap-3">
                <span className="w-12 shrink-0 text-meta-sm tabular-nums text-muted-foreground">{t.t}</span>
                <p className="text-body-sm text-foreground">
                  <span className="text-title-sm">{t.speaker} : </span>
                  {t.text}
                </p>
              </li>
            ))}
          </ol>
        </DialogContent>
      </Dialog>
    </>
  )
}
