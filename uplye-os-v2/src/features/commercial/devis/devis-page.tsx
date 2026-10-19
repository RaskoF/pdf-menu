import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Copy, Plus } from '@phosphor-icons/react'
import {
  Button,
  Chip,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useToast,
} from '@/components/ui'
import { PageHeader } from '@/components/app/page-header'
import { useMediaQuery } from '@/hooks/use-media-query'
import { pluralize } from '@/lib/format'
import { CURRENT_USER } from '@/data/session'
import { useClientsById, useCommercial } from '../store'
import { daysBetween, isOpen } from '../lib'
import { analyse, decidedDeals } from './analysis'
import { DevisListView, ListAttentionCards, ListFilterChips, type ListFilter } from './devis-list-view'
import { PipelineView } from './pipeline-view'
import { AnalysisView } from './analysis-view'
import { DevisDetail } from './devis-detail'
import { NewDevisSheet } from './new-devis-sheet'
import { useDevisOutcome } from './use-devis-outcome'

type View = 'liste' | 'pipeline' | 'analyse'
type PipelineFilter = 'tous' | 'mes' | 'studio' | 'azurpod'
const VIEWS: View[] = ['liste', 'pipeline', 'analyse']

// Figma : page « 20 Commercial », écrans Devis (27:3, 30:451) + Analyse (ancienne maquette 2973:4996).
// La vue et le devis ouvert sont dans l'URL : un lien partagé rouvre le même écran.
export function DevisPage() {
  const { data, actions, now } = useCommercial()
  const clients = useClientsById()
  const toast = useToast()
  const wide = useMediaQuery('(min-width: 1280px)')
  const [params, setParams] = useSearchParams()
  const view: View = VIEWS.includes(params.get('vue') as View) ? (params.get('vue') as View) : 'liste'
  // Le détail en panneau modal est refermé après une issue, sinon le toast « Annuler » serait inaccessible
  const outcome = useDevisOutcome(() => {
    if (!wide || view !== 'liste') update({ devis: null })
  })
  const selectedId = params.get('devis')
  const [listFilter, setListFilter] = useState<ListFilter>('tous')
  const [pipelineFilter, setPipelineFilter] = useState<PipelineFilter>('tous')
  const [periodDays, setPeriodDays] = useState(90)
  const [sheet, setSheet] = useState<{ prospect?: boolean; start?: 'modele' } | null>(null)

  const update = (patch: Record<string, string | null>) =>
    setParams(
      (p) => {
        const next = new URLSearchParams(p)
        Object.entries(patch).forEach(([k, v]) => (v === null ? next.delete(k) : next.set(k, v)))
        return next
      },
      { replace: true },
    )

  const devis = useMemo(() => (data?.devis ?? []).filter((d) => d.status !== 'archive'), [data?.devis])
  const selected = devis.find((d) => d.id === selectedId) ?? null

  const pipelineDevis = useMemo(
    () =>
      devis.filter((d) =>
        pipelineFilter === 'mes'
          ? d.owner === CURRENT_USER.initials
          : pipelineFilter === 'studio' || pipelineFilter === 'azurpod'
            ? d.brand === pipelineFilter
            : true,
      ),
    [devis, pipelineFilter],
  )
  const pipelineCount = (f: PipelineFilter) =>
    devis.filter((d) => d.status !== 'refuse' && (f === 'mes' ? d.owner === CURRENT_USER.initials : f === 'tous' ? true : d.brand === f)).length

  const subtitle = useMemo(() => {
    if (!data) return 'Chargement des devis…'
    const a = analyse(
      decidedDeals(data.devis, data.history, (id) => clients.get(id)?.name ?? ''),
      { owner: 'all', brand: 'all', periodDays: 90 },
      now,
    )
    const delays = data.devis.filter((d) => d.sentAt && d.signedAt).map((d) => daysBetween(d.sentAt!, new Date(`${d.signedAt}T12:00:00`)))
    const avg = delays.length ? Math.round(delays.reduce((s, x) => s + x, 0) / delays.length) : null
    return `Sur 90 jours : ${a.pct(a.signatureRate)} signés${avg !== null ? `, signature en ${pluralize(avg, 'jour')} en moyenne` : ''}`
  }, [data, clients, now])

  const detail = selected && <DevisDetail devis={selected} outcome={outcome} onClose={() => update({ devis: null })} />

  return (
    <div className="flex min-h-full">
      <div className="flex min-w-0 flex-1 flex-col gap-5 p-layout-margin">
        <PageHeader
          title="Devis"
          subtitle={subtitle}
          actions={
            <>
              <Button variant="outline" leadingIcon={<Copy />} onClick={() => setSheet({ start: 'modele' })}>
                Modèles
              </Button>
              <Button leadingIcon={<Plus />} onClick={() => setSheet({})}>
                Nouveau devis
              </Button>
            </>
          }
        />

        {view === 'liste' && <ListAttentionCards filter={listFilter} onFilterChange={setListFilter} />}

        <Tabs value={view} onValueChange={(v) => update({ vue: v === 'liste' ? null : v })} className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <TabsList aria-label="Affichage des devis">
              <TabsTrigger value="liste">Liste</TabsTrigger>
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
              <TabsTrigger value="analyse">Analyse</TabsTrigger>
            </TabsList>
            {view === 'liste' && <ListFilterChips filter={listFilter} onFilterChange={setListFilter} />}
            {view === 'pipeline' && (
              <>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer le pipeline">
                  {(
                    [
                      ['tous', 'Tous'],
                      ['mes', 'Mes devis'],
                      ['studio', 'Studio'],
                      ['azurpod', 'Azurpod'],
                    ] as const
                  ).map(([key, label]) => (
                    <Chip key={key} active={pipelineFilter === key} count={data ? pipelineCount(key) : undefined} onClick={() => setPipelineFilter(key)}>
                      {label}
                    </Chip>
                  ))}
                </div>
                <Select value={String(periodDays)} onValueChange={(v) => setPeriodDays(Number(v))}>
                  <SelectTrigger className="ml-auto w-[180px]" aria-label="Période des signatures">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 derniers jours</SelectItem>
                    <SelectItem value="90">90 derniers jours</SelectItem>
                    <SelectItem value="365">12 derniers mois</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>

          <TabsContent value="liste" className="outline-none">
            <DevisListView
              selectedId={selectedId}
              onSelect={(id) => update({ devis: id === selectedId ? null : id })}
              filter={listFilter}
              onBulkRemind={(ids) => {
                const remindable = ids.filter((id) => isOpen(devis.find((d) => d.id === id)?.status ?? 'brouillon'))
                remindable.forEach((id) => actions.logDevis(id, { kind: 'mail', title: 'Relance envoyée', detail: 'Relance groupée', when: 'à l’instant' }))
                toast({
                  message: remindable.length
                    ? `${pluralize(remindable.length, 'relance envoyée', 'relances envoyées')}`
                    : 'Aucun devis envoyé dans la sélection',
                  variant: remindable.length ? 'success' : 'default',
                })
              }}
              onBulkArchive={(ids) => {
                const snapshots = devis.filter((d) => ids.includes(d.id))
                snapshots.forEach((d) => actions.archiveDevis(d.id))
                toast({
                  message: `${pluralize(snapshots.length, 'devis archivé', 'devis archivés')}`,
                  action: { label: 'Annuler', onClick: () => snapshots.forEach((d) => actions.restoreDevis(d)) },
                })
              }}
            />
          </TabsContent>
          <TabsContent value="pipeline" className="outline-none">
            <PipelineView
              devis={pipelineDevis}
              periodDays={periodDays}
              outcome={outcome}
              onOpen={(id) => update({ devis: id })}
              onAddProspect={() => setSheet({ prospect: true })}
            />
          </TabsContent>
          <TabsContent value="analyse" className="outline-none">
            <AnalysisView />
          </TabsContent>
        </Tabs>
      </div>

      {selected && view === 'liste' && wide && (
        <aside
          aria-label={`Détail du devis ${selected.number}`}
          className="sticky top-0 m-2 ml-0 max-h-[calc(100dvh-2rem)] w-[420px] shrink-0 self-start overflow-y-auto rounded-xl border border-border bg-card"
        >
          {detail}
        </aside>
      )}
      <Sheet open={!!selected && (view !== 'liste' || !wide)} onOpenChange={(open) => !open && update({ devis: null })}>
        {selected && (
          <SheetContent size="wide" title={clients.get(selected.clientId)?.name} description={selected.number || 'Prospect à chiffrer'} bare>
            {detail}
          </SheetContent>
        )}
      </Sheet>

      <NewDevisSheet open={!!sheet} onOpenChange={(open) => !open && setSheet(null)} prospect={sheet?.prospect} defaultStart={sheet?.start} />
      {outcome.dialogs}
    </div>
  )
}
