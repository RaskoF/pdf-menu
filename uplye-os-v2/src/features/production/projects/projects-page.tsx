import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Folder, Kanban, MagnifyingGlass, Plus, WarningCircle } from '@phosphor-icons/react'
import { Avatar, Button, Chip, Input, Skeleton } from '@/components/ui'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { CURRENT_USER } from '@/data/session'
import { formatShortDate, toIso } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { useClientsById } from '@/features/commercial/store'
import { useProduction } from '../store'
import { isDelivered, projectedMargin, relativeDay, watchReasons } from '../lib'
import { PhaseBar } from './phase-bar'
import { NewProjectSheet } from './new-project-sheet'
import type { Project } from '../types'

type Filter = 'en_cours' | 'studio' | 'azurpod' | 'mes' | 'livres'
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'en_cours', label: 'En cours' },
  { key: 'studio', label: 'Studio' },
  { key: 'azurpod', label: 'Azurpod' },
  { key: 'mes', label: 'Mes projets' },
  { key: 'livres', label: 'Livrés' },
]
const pct = (x: number) => `${Math.round(x * 100)} %`

// Figma : « Projets » (63:3), « Projets / Chargement » (122:1811)
export function ProjectsPage() {
  const navigate = useNavigate()
  const { data, loading, now } = useProduction()
  const clients = useClientsById()
  const [filter, setFilter] = useState<Filter>('en_cours')
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)

  const projects = useMemo(() => data?.projects ?? [], [data?.projects])
  const active = projects.filter((p) => !isDelivered(p))
  const month = toIso(now).slice(0, 7)
  const deliveredThisMonth = projects.filter((p) => isDelivered(p) && (p.deliveredAt ?? '').startsWith(month))
  const match = (f: Filter) => (p: Project) =>
    f === 'livres' ? isDelivered(p) : !isDelivered(p) && (f === 'en_cours' || (f === 'mes' ? p.pilot === CURRENT_USER.initials : p.brand === f))
  const q = query.trim().toLowerCase()
  const searched = (p: Project) => !q || p.title.toLowerCase().includes(q) || (clients.get(p.clientId)?.name ?? '').toLowerCase().includes(q)

  const visible = projects.filter(match(filter)).filter(searched)
  const watch = visible.filter((p) => watchReasons(p, now).length > 0)
  const onTrack = visible.filter((p) => !isDelivered(p) && watchReasons(p, now).length === 0)
  const delivered = filter === 'livres' ? visible : filter === 'en_cours' ? deliveredThisMonth.filter(searched) : []

  const withMargin = active.filter((p) => projectedMargin(p) !== null)
  const revenue = withMargin.reduce((s, p) => s + p.revenue, 0)
  const margin = revenue ? withMargin.reduce((s, p) => s + p.revenue * projectedMargin(p)!, 0) / revenue : 0
  const watchCount = active.filter((p) => watchReasons(p, now).length).length

  return (
    <div className="flex min-h-full flex-col gap-5 p-layout-margin">
      <PageHeader
        title="Projets"
        subtitle={loading ? 'Chargement des projets…' : `${active.length} en cours, dont ${watchCount} à surveiller. Marge projetée ${pct(margin)}.`}
        actions={
          <>
            <Button variant="outline" leadingIcon={<Kanban />} onClick={() => navigate('/kanban')}>
              Vue kanban
            </Button>
            <Button leadingIcon={<Plus />} onClick={() => setCreating(true)}>
              Nouveau projet
            </Button>
          </>
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les projets">
          {FILTERS.map((f) => (
            <Chip key={f.key} active={filter === f.key} count={loading ? undefined : projects.filter(match(f.key)).length} onClick={() => setFilter(f.key)}>
              {f.label}
            </Chip>
          ))}
        </div>
        <div className="w-full sm:ml-auto sm:w-[220px]">
          <Input
            aria-label="Rechercher un projet ou un client"
            placeholder="Projet ou client"
            leadingIcon={<MagnifyingGlass />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg bg-card">
        <table className="w-full min-w-[960px] border-collapse text-left">
          <caption className="sr-only">Projets</caption>
          <thead>
            <tr className="h-11 border-b border-border text-meta-md text-muted-foreground">
              <th scope="col" className="pl-3 font-normal">
                Projet
              </th>
              <th scope="col" className="w-48 font-normal">
                Phase
              </th>
              <th scope="col" className="w-36 pl-6 font-normal">
                Échéance
              </th>
              <th scope="col" className="w-36 font-normal">
                Budget temps
              </th>
              <th scope="col" className="w-24 font-normal">
                Révisions
              </th>
              <th scope="col" className="w-16 pr-3 font-normal">
                Pilote
              </th>
            </tr>
          </thead>
          {loading ? (
            <tbody>
              {Array.from({ length: 6 }, (_, i) => (
                <tr key={i} className="h-[61px] border-b border-border">
                  <td colSpan={6} className="px-3">
                    <Skeleton className="h-3 w-full" />
                  </td>
                </tr>
              ))}
            </tbody>
          ) : (
            <>
              <Group
                title="À surveiller"
                icon={<WarningCircle className="size-4 text-danger" aria-hidden />}
                projects={watch}
                alert
                onOpen={(id) => navigate(`/projets/${id}`)}
              />
              <Group title="En bonne voie" projects={onTrack} onOpen={(id) => navigate(`/projets/${id}`)} />
              <Group title={filter === 'livres' ? 'Livrés' : 'Livrés ce mois'} projects={delivered} onOpen={(id) => navigate(`/projets/${id}`)} />
            </>
          )}
        </table>
        {!loading && watch.length + onTrack.length + delivered.length === 0 && (
          <EmptyState
            icon={<Folder />}
            title="Aucun projet"
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setQuery('')
                  setFilter('en_cours')
                }}
              >
                Voir les projets en cours
              </Button>
            }
          >
            Rien ne correspond à ce filtre ou à cette recherche.
          </EmptyState>
        )}
      </div>
      <NewProjectSheet open={creating} onOpenChange={setCreating} onCreated={(id) => navigate(`/projets/${id}`)} />
    </div>
  )
}

function Group({
  title,
  icon,
  projects,
  alert = false,
  onOpen,
}: {
  title: string
  icon?: ReactNode
  projects: Project[]
  alert?: boolean
  onOpen: (id: string) => void
}) {
  const { now } = useProduction()
  const clients = useClientsById()
  if (!projects.length) return null
  return (
    <tbody>
      <tr className="h-8 border-b border-border bg-surface-1/50">
        <th scope="rowgroup" colSpan={6} className="px-3 text-left text-meta-md font-normal text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            {icon}
            {title}
            <span className="text-meta-sm">{projects.length}</span>
          </span>
        </th>
      </tr>
      {projects.map((p) => {
        const delivered = isDelivered(p)
        const reasons = watchReasons(p, now)
        const over = p.hoursSpent > p.hoursSold
        const m = projectedMargin(p)
        const revMax = p.revisions && p.revisions.used >= p.revisions.included
        const client = clients.get(p.clientId)?.name ?? ''
        return (
          <tr
            key={p.id}
            className="h-[61px] cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-surface-hover"
            onClick={() => onOpen(p.id)}
          >
            <td className="py-2 pl-3">
              <a
                href={`#/projets/${p.id}`}
                onClick={(e) => e.stopPropagation()}
                className="focus-ring block rounded-sm text-title-sm text-foreground hover:underline"
              >
                {p.title}
              </a>
              <p className="text-body-sm text-muted-foreground">
                {client}
                {p.brand === 'azurpod' ? ', Azurpod' : ''}
              </p>
              {alert && reasons[0] && <p className="sr-only">À surveiller : {reasons.join(', ')}</p>}
            </td>
            <td>
              <p className={cn('text-body-sm', alert ? 'text-danger' : 'text-foreground')}>{delivered ? 'Livré' : p.phases[p.currentPhase]?.label}</p>
              <PhaseBar project={p} alert={alert} className="mt-1.5 w-40" />
            </td>
            <td className="pl-6">
              <p className="text-title-sm text-foreground">
                {delivered ? formatShortDate(p.deliveredAt ?? p.due) : relativeDay(p.due, now) === 'aujourd’hui' ? 'aujourd’hui' : formatShortDate(p.due)}
              </p>
              <p className={cn('text-body-sm', alert && p.dueNote ? 'text-danger' : 'text-muted-foreground')}>
                {delivered ? (p.deliveredAt && p.deliveredAt <= p.due ? 'livré à l’heure' : 'livré en retard') : (p.dueNote ?? relativeDay(p.due, now))}
              </p>
            </td>
            <td>
              <p className={cn('text-title-sm tabular-nums', over && !delivered ? 'text-danger' : 'text-foreground')}>
                {p.hoursSpent} h / {p.hoursSold} h
              </p>
              <p className={cn('text-body-sm', over && !delivered ? 'text-danger' : 'text-muted-foreground')}>
                {m === null ? 'pack prépayé' : p.hoursSpent < p.hoursSold / 2 && !delivered ? `marge ${pct(m)} prévue` : `marge ${pct(m)}`}
              </p>
            </td>
            <td className={cn('text-body-md', revMax && !delivered ? 'text-danger' : 'text-foreground')}>
              {p.revisions ? `${p.revisions.used} / ${p.revisions.included}` : 'Aucune'}
            </td>
            <td className="pr-3">
              <Avatar initials={p.pilot} size="sm" tone="neutral" name={`Pilote : ${p.pilot}`} />
            </td>
          </tr>
        )
      })}
    </tbody>
  )
}
