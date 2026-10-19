import { useId, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  CaretRight,
  Check,
  Clock,
  Eye,
  FileText,
  Folder,
  HourglassMedium,
  ImageSquare,
  ListChecks,
  MicrophoneStage,
  PaperPlaneTilt,
  Plus,
  VideoCamera,
  WarningCircle,
} from '@phosphor-icons/react'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  Checkbox,
  Dialog,
  DialogContent,
  Field,
  Input,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  useToast,
} from '@/components/ui'
import { EmptyState } from '@/components/app/empty-state'
import { TEAM, memberName, type MemberId } from '@/data/session'
import { formatDayLong, formatShortDate, toIso } from '@/lib/dates'
import { pluralize } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useClientsById } from '@/features/commercial/store'
import { useProduction } from '../store'
import { DELIVERABLE_BADGE, hoursBeforeMarginFloor, isDelivered, projectedMargin, watchReasons } from '../lib'
import type { Deliverable, Project, ProjectPhase } from '../types'

const KIND_ICON = { document: FileText, liste: ListChecks, video: VideoCamera, photos: ImageSquare, audio: MicrophoneStage } as const
const pct = (x: number) => `${Math.round(x * 100)} %`
const range = (ph: ProjectPhase) =>
  ph.start === ph.end ? formatShortDate(ph.start) : `${formatShortDate(ph.start).replace(/ \S+$/, '')} – ${formatShortDate(ph.end)}`

// Figma : « Projet / Mayli » (64:342)
export function ProjectPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { data, loading, actions, now } = useProduction()
  const clients = useClientsById()
  const [taskOpen, setTaskOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [timeOpen, setTimeOpen] = useState(false)
  const [expanded, setExpanded] = useState<string[]>([])
  const project = data?.projects.find((p) => p.id === id)

  if (loading)
    return (
      <div className="p-layout-margin">
        <Skeleton className="h-[480px] rounded-lg" />
      </div>
    )
  if (!project) {
    return (
      <div className="grid min-h-full place-content-center p-layout-margin">
        <EmptyState icon={<Folder />} title="Projet introuvable" action={<Button onClick={() => navigate('/projets')}>Retour aux projets</Button>}>
          Il a peut-être été archivé.
        </EmptyState>
      </div>
    )
  }

  const client = clients.get(project.clientId)
  const firstName = client?.contactName.split(' ')[0] ?? 'le client'
  const delivered = isDelivered(project)
  const current = project.phases[project.currentPhase]
  const reasons = watchReasons(project, now)
  const margin = projectedMargin(project)
  const floorHours = hoursBeforeMarginFloor(project)
  const update = (fn: (p: Project) => Project) => actions.updateProject(project.id, fn)

  const setTask = (phaseId: string, taskId: string, done: boolean) =>
    update((p) => ({
      ...p,
      phases: p.phases.map((ph) => (ph.id === phaseId ? { ...ph, tasks: ph.tasks.map((t) => (t.id === taskId ? { ...t, done } : t)) } : ph)),
    }))

  const advance = () => {
    const next = project.currentPhase + 1
    update((p) => ({ ...p, currentPhase: next, ...(next >= p.phases.length ? { deliveredAt: toIso(now), blocked: undefined } : {}) }))
    toast({
      message: next >= project.phases.length ? `${project.title} livré` : `Phase suivante : ${project.phases[next]?.label}`,
      variant: 'success',
      action: { label: 'Annuler', onClick: () => update((p) => ({ ...p, currentPhase: project.currentPhase, deliveredAt: project.deliveredAt })) },
    })
  }

  const subtitle = [
    [client?.name, project.devisNumber].filter(Boolean).join(', '),
    `${memberName(project.pilot)} pilote${project.shootingDate ? `, tournage le ${formatDayLong(project.shootingDate).replace(/^\S+ /, '')}` : ''}`,
  ].join('. ')

  return (
    <div className="flex min-h-full flex-col gap-5 p-layout-margin">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <nav aria-label="Fil d’Ariane" className="text-meta-md text-muted-foreground">
            <Link to="/projets" className="focus-ring rounded-sm hover:text-foreground">
              Projets
            </Link>
          </nav>
          <h1 className="text-h1 text-foreground">{project.title}</h1>
          <p className="text-body-md text-muted-foreground">{subtitle}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" leadingIcon={<Eye />} onClick={() => setPreviewOpen(true)} disabled={!project.clientSpace}>
            Voir l’espace client
          </Button>
          <Button leadingIcon={<Plus />} onClick={() => setTaskOpen(true)} disabled={delivered}>
            Ajouter une tâche
          </Button>
        </div>
      </header>

      <ol className="grid grid-cols-2 gap-y-4 rounded-lg bg-card p-5 sm:grid-cols-3 lg:flex" aria-label="Phases du projet">
        {project.phases.map((ph, i) => {
          const done = i < project.currentPhase
          const now_ = i === project.currentPhase
          return (
            <li key={ph.id} aria-current={now_ ? 'step' : undefined} className="flex flex-1 flex-col gap-2">
              <div className="flex items-center">
                <span
                  className={cn(
                    'grid size-[18px] shrink-0 place-content-center rounded-full border',
                    done ? 'border-transparent bg-surface-3 text-foreground' : now_ ? 'border-transparent bg-brand' : 'border-line-strong',
                  )}
                >
                  {done && <Check className="size-3" aria-hidden />}
                </span>
                {i < project.phases.length - 1 && <span aria-hidden className="mx-1.5 hidden h-px flex-1 bg-line-strong lg:block" />}
              </div>
              <span className={cn('text-title-sm', done || now_ ? 'text-foreground' : 'text-muted-foreground')}>
                {ph.label}
                <span className="sr-only">{done ? ', terminée' : now_ ? ', en cours' : ', à venir'}</span>
              </span>
              <span className="text-body-xs text-muted-foreground">{now_ && ph.start !== ph.end ? `jusqu’au ${formatShortDate(ph.end)}` : range(ph)}</span>
            </li>
          )
        })}
      </ol>

      {reasons.length > 0 && (
        <div role="status" className="flex items-start gap-3 rounded-md bg-danger-tone px-4 py-3">
          <WarningCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          <p className="text-body-sm text-foreground">
            <span className="text-title-sm text-danger">À surveiller : </span>
            {reasons.join(', ')}.
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          {current ? (
            <PhaseCard
              phase={current}
              onToggleTask={(tid, v) => setTask(current.id, tid, v)}
              onAdvance={advance}
              next={project.phases[project.currentPhase + 1]?.label}
            />
          ) : (
            <Card>
              <EmptyState icon={<Check />} title="Projet livré">
                {project.deliveredAt ? `Livré le ${formatShortDate(project.deliveredAt)}.` : 'Toutes les phases sont terminées.'}
              </EmptyState>
            </Card>
          )}

          {project.clientWaiting.length + (project.clientChecklist ? 1 : 0) > 0 && (
            <Card>
              <CardHeader
                title="Attendu côté client"
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    leadingIcon={<PaperPlaneTilt />}
                    onClick={() => toast({ message: `Relance envoyée à ${client?.contactName ?? client?.name}`, variant: 'success' })}
                  >
                    Relancer {firstName}
                  </Button>
                }
              />
              <ul className="flex flex-col gap-2">
                {project.clientWaiting.map((w) => (
                  <li key={w.id} className="flex items-start gap-3 rounded-md bg-surface-1 p-4">
                    <HourglassMedium className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-title-sm text-foreground">{w.title}</p>
                      <p className="text-body-sm text-muted-foreground">{w.detail}</p>
                    </div>
                    <Badge variant="blue">Chez le client</Badge>
                  </li>
                ))}
                {project.clientChecklist && (
                  <li className="flex items-center gap-3 px-4 py-1 text-body-sm text-foreground">
                    <ListChecks className="size-4 text-muted-foreground" aria-hidden />
                    {project.clientChecklist.label} : {project.clientChecklist.done} point sur {project.clientChecklist.total} coché dans son espace
                  </li>
                )}
              </ul>
            </Card>
          )}

          {project.phases.some((_, i) => i > project.currentPhase) && (
            <div className="overflow-hidden rounded-lg bg-card">
              {project.phases.slice(project.currentPhase + 1).map((ph) => {
                const open = expanded.includes(ph.id)
                const owners = [...new Set(ph.tasks.map((t) => memberName(t.owner)))]
                return (
                  <section key={ph.id} className="border-b border-border last:border-0">
                    <h2>
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => setExpanded((e) => (open ? e.filter((x) => x !== ph.id) : [...e, ph.id]))}
                        className="focus-ring flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-surface-hover"
                      >
                        <CaretRight className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-90')} aria-hidden />
                        <span className="text-title-sm text-foreground">{ph.label}</span>
                        <span className="flex-1 truncate text-body-sm text-muted-foreground">
                          {ph.tasks.length ? pluralize(ph.tasks.length, 'tâche') : 'aucune tâche'}
                          {owners.length ? `, ${owners.join(' et ')}` : ''}
                        </span>
                        <span className="text-body-xs text-muted-foreground">{range(ph)}</span>
                      </button>
                    </h2>
                    {open && (
                      <ul className="flex flex-col gap-1 px-5 pb-4">
                        {ph.tasks.length === 0 && <li className="text-body-sm text-muted-foreground">Aucune tâche pour l’instant.</li>}
                        {ph.tasks.map((t) => (
                          <TaskRow key={t.id} task={t} onChange={(v) => setTask(ph.id, t.id, v)} />
                        ))}
                      </ul>
                    )}
                  </section>
                )
              })}
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4" aria-label="Suivi du projet">
          <Card>
            <CardHeader
              title="Budget temps"
              action={
                !delivered && (
                  <Button variant="ghost" size="sm" leadingIcon={<Clock />} onClick={() => setTimeOpen(true)}>
                    Saisir
                  </Button>
                )
              }
            />
            <p className="flex items-baseline gap-2">
              <span className={cn('text-stat-md', project.hoursSpent > project.hoursSold ? 'text-danger' : 'text-foreground')}>{project.hoursSpent} h</span>
              <span className="text-body-sm text-muted-foreground">sur {project.hoursSold} h vendues</span>
            </p>
            <Progress value={project.hoursSpent} max={project.hoursSold} label="Temps passé sur le temps vendu" />
            <p className="text-body-sm text-muted-foreground">
              {margin === null
                ? 'Pack prépayé : le temps est décompté du pack du client.'
                : `Marge ${project.hoursSpent > project.hoursSold ? 'projetée' : 'prévue'} ${pct(margin)}.${floorHours !== null ? ` Elle passe sous 40 % au-delà de ${floorHours} h.` : ''}`}
            </p>
          </Card>

          <Card>
            <CardHeader
              title="Révisions"
              action={
                project.revisions && (
                  <Badge variant={project.revisions.used >= project.revisions.included ? 'red' : 'secondary'}>
                    {project.revisions.used} sur {project.revisions.included}
                  </Badge>
                )
              }
            />
            <p className="text-body-sm text-muted-foreground">
              {project.revisions ? `Une phase supplémentaire est facturée 150 € HT, prévenir ${firstName} avant.` : 'Pas de révision prévue sur ce projet.'}
            </p>
            {project.revisions && !delivered && (
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => update((p) => ({ ...p, revisions: p.revisions && { ...p.revisions, used: p.revisions.used + 1 } }))}
              >
                Compter une révision
              </Button>
            )}
          </Card>

          <Card>
            <CardHeader title="Livrables" />
            {project.deliverables.length === 0 && <p className="text-body-sm text-muted-foreground">Les livrables apparaissent au fil des phases.</p>}
            <ul className="flex flex-col gap-4">
              {project.deliverables.map((d) => (
                <DeliverableRow key={d.id} deliverable={d} />
              ))}
            </ul>
          </Card>
        </aside>
      </div>

      <AddTaskDialog
        open={taskOpen}
        onOpenChange={setTaskOpen}
        phases={project.phases.slice(project.currentPhase)}
        defaultOwner={project.pilot}
        min={toIso(now)}
        onAdd={(phaseId, task) => {
          update((p) => ({ ...p, phases: p.phases.map((ph) => (ph.id === phaseId ? { ...ph, tasks: [...ph.tasks, task] } : ph)) }))
          setTaskOpen(false)
          toast({ message: `Tâche ajoutée pour ${memberName(task.owner)}`, variant: 'success' })
        }}
      />
      <LogTimeDialog
        open={timeOpen}
        onOpenChange={setTimeOpen}
        onLog={(h) => {
          update((p) => ({ ...p, hoursSpent: Math.round((p.hoursSpent + h) * 10) / 10 }))
          setTimeOpen(false)
        }}
      />
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          className="max-w-[560px]"
          title={`Espace client de ${client?.name}`}
          description="Ce que voit le client : pas de montants, pas de marge, pas de tâches internes."
        >
          <ol className="flex flex-col gap-2">
            {project.phases.map((ph, i) => (
              <li key={ph.id} className="flex items-center gap-3 text-body-sm">
                <span
                  className={cn('size-2 rounded-full', i < project.currentPhase ? 'bg-success' : i === project.currentPhase ? 'bg-brand' : 'bg-surface-3')}
                  aria-hidden
                />
                <span className={cn('flex-1', i === project.currentPhase ? 'text-title-sm text-foreground' : 'text-foreground')}>{ph.label}</span>
                <span className="text-muted-foreground">{range(ph)}</span>
              </li>
            ))}
          </ol>
          {project.clientWaiting.length > 0 && (
            <div className="rounded-md bg-surface-1 p-4">
              <p className="text-meta-md text-muted-foreground">À faire de votre côté</p>
              {project.clientWaiting.map((w) => (
                <p key={w.id} className="mt-1 text-title-sm text-foreground">
                  {w.title}
                </p>
              ))}
            </div>
          )}
          <ul className="flex flex-col gap-2">
            {project.deliverables
              .filter((d) => d.status === 'chez_client' || d.status === 'valide')
              .map((d) => (
                <li key={d.id} className="flex items-center justify-between text-body-sm text-foreground">
                  {d.title}
                  <Badge variant={d.status === 'valide' ? 'green' : 'blue'}>{d.status === 'valide' ? 'Validé' : 'À valider'}</Badge>
                </li>
              ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TaskRow({ task, onChange }: { task: ProjectPhase['tasks'][number]; onChange: (done: boolean) => void }) {
  const id = useId()
  return (
    <li className="flex items-center gap-3 rounded-md px-1 py-2">
      <Checkbox id={id} checked={task.done} onCheckedChange={(v) => onChange(v === true)} />
      <label htmlFor={id} className={cn('flex-1 cursor-pointer text-body-md', task.done ? 'text-muted-foreground line-through' : 'text-foreground')}>
        {task.label}
      </label>
      <Avatar initials={task.owner} size="sm" tone="neutral" name={memberName(task.owner)} />
      <span className="w-14 text-right text-body-xs text-muted-foreground">{formatShortDate(task.due)}</span>
    </li>
  )
}

function PhaseCard({
  phase,
  onToggleTask,
  onAdvance,
  next,
}: {
  phase: ProjectPhase
  onToggleTask: (id: string, done: boolean) => void
  onAdvance: () => void
  next?: string
}) {
  const done = phase.tasks.filter((t) => t.done).length
  const all = phase.tasks.length > 0 && done === phase.tasks.length
  return (
    <Card>
      <CardHeader
        title={phase.label}
        action={
          <span className="text-body-xs text-muted-foreground">
            {done} sur {phase.tasks.length}, jusqu’au {formatShortDate(phase.end)}
          </span>
        }
      />
      <ul className="flex flex-col">
        {phase.tasks.map((t) => (
          <TaskRow key={t.id} task={t} onChange={(v) => onToggleTask(t.id, v)} />
        ))}
      </ul>
      {(all || phase.tasks.length === 0) && (
        <Button variant="brand" className="w-fit" onClick={onAdvance}>
          {next ? `Passer à ${next}` : 'Marquer comme livré'}
        </Button>
      )}
    </Card>
  )
}

function DeliverableRow({ deliverable: d }: { deliverable: Deliverable }) {
  const Icon = KIND_ICON[d.kind]
  const badge = DELIVERABLE_BADGE[d.status]
  return (
    <li className="flex items-center gap-3">
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-title-sm text-foreground">{d.title}</p>
        <p className="text-body-sm text-muted-foreground">{d.detail}</p>
      </div>
      <Badge variant={badge.variant}>{badge.label}</Badge>
    </li>
  )
}

function AddTaskDialog({
  open,
  onOpenChange,
  phases,
  defaultOwner,
  min,
  onAdd,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  phases: ProjectPhase[]
  defaultOwner: MemberId
  min: string
  onAdd: (phaseId: string, task: ProjectPhase['tasks'][number]) => void
}) {
  const formId = useId()
  const [label, setLabel] = useState('')
  const [owner, setOwner] = useState<MemberId>(defaultOwner)
  const [due, setDue] = useState('')
  const [phaseId, setPhaseId] = useState('')
  const [error, setError] = useState(false)
  const target = phaseId || phases[0]?.id || ''
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Ajouter une tâche"
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" form={formId} variant="brand">
              Ajouter
            </Button>
          </>
        }
      >
        <form
          id={formId}
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!label.trim() || !due) return setError(true)
            onAdd(target, { id: `t-${Date.now()}`, label: label.trim(), owner, due, done: false })
            setLabel('')
            setDue('')
            setError(false)
          }}
        >
          <Field label="Tâche" error={error && !label.trim() ? 'Décrivez la tâche.' : undefined}>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-label-sm text-foreground">Phase</span>
              <Select value={target} onValueChange={setPhaseId}>
                <SelectTrigger aria-label="Phase">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {phases.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-label-sm text-foreground">Pour</span>
              <Select value={owner} onValueChange={(v) => setOwner(v as MemberId)}>
                <SelectTrigger aria-label="Pour">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAM.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Field label="Échéance" error={error && !due ? 'Choisissez une date.' : undefined}>
              <Input type="date" min={min} value={due} onChange={(e) => setDue(e.target.value)} />
            </Field>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function LogTimeDialog({ open, onOpenChange, onLog }: { open: boolean; onOpenChange: (o: boolean) => void; onLog: (hours: number) => void }) {
  const [hours, setHours] = useState('1')
  const value = Number(hours.replace(',', '.'))
  const valid = Number.isFinite(value) && value > 0 && value <= 12
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Saisir du temps"
        description="Le temps passé met à jour la marge projetée."
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button variant="brand" disabled={!valid} onClick={() => onLog(value)}>
              Ajouter {valid ? `${value} h` : ''}
            </Button>
          </>
        }
      >
        <Field
          label="Heures passées"
          helper="Entre 0,5 et 12 h par saisie"
          error={hours && !valid ? 'Saisissez un nombre d’heures entre 0,5 et 12.' : undefined}
        >
          <Input inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} />
        </Field>
      </DialogContent>
    </Dialog>
  )
}
