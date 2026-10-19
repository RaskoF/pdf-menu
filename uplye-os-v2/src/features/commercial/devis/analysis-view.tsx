import { useMemo, useState } from 'react'
import { CalendarBlank, Sparkle, Tag, UsersThree } from '@phosphor-icons/react'
import { Badge, Card, CardHeader, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton } from '@/components/ui'
import { EmptyState } from '@/components/app/empty-state'
import { formatEur } from '@/lib/format'
import { useClientsById, useCommercial } from '../store'
import { MEMBERS } from '../mock-data'
import { formatShortDate } from '../lib'
import { BarList } from '../components/bar-list'
import { Kpi } from '../components/kpi'
import { analyse, decidedDeals, type AnalysisFilters } from './analysis'

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// Ancienne maquette « Devis / Analyse gagnés-perdus » (2973:4996), reconstruite avec le nouveau design system.
export function AnalysisView() {
  const { data, loading, now } = useCommercial()
  const clients = useClientsById()
  const [filters, setFilters] = useState<AnalysisFilters>({ owner: 'all', brand: 'all', periodDays: 90 })

  const all = useMemo(() => (data ? decidedDeals(data.devis, data.history, (id) => clients.get(id)?.name ?? '') : []), [data, clients])
  const a = useMemo(() => analyse(all, filters, now), [all, filters, now])
  const set = <K extends keyof AnalysisFilters>(key: K, value: AnalysisFilters[K]) => setFilters((f) => ({ ...f, [key]: value }))

  if (loading) return <Skeleton className="h-[480px] rounded-lg" />

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtres de l’analyse">
        <Select value={filters.owner} onValueChange={(v) => set('owner', v as AnalysisFilters['owner'])}>
          <SelectTrigger className="h-control-sm w-auto gap-2" aria-label="Responsable">
            <UsersThree className="size-4 text-muted-foreground" aria-hidden />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les responsables</SelectItem>
            {MEMBERS.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.brand} onValueChange={(v) => set('brand', v as AnalysisFilters['brand'])}>
          <SelectTrigger className="h-control-sm w-auto gap-2" aria-label="Activité">
            <Tag className="size-4 text-muted-foreground" aria-hidden />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes activités</SelectItem>
            <SelectItem value="studio">Uplye Studio</SelectItem>
            <SelectItem value="azurpod">Azurpod</SelectItem>
            <SelectItem value="academy">Academy</SelectItem>
          </SelectContent>
        </Select>
        <Select value={String(filters.periodDays)} onValueChange={(v) => set('periodDays', Number(v))}>
          <SelectTrigger className="h-control-sm w-auto gap-2" aria-label="Période">
            <CalendarBlank className="size-4 text-muted-foreground" aria-hidden />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 derniers jours</SelectItem>
            <SelectItem value="90">90 derniers jours</SelectItem>
            <SelectItem value="365">12 derniers mois</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {a.deals.length === 0 ? (
        <Card>
          <EmptyState icon={<Sparkle />} title="Pas encore de devis décidé">
            Aucun devis signé ou refusé avec ces filtres. Élargissez la période ou le responsable.
          </EmptyState>
        </Card>
      ) : (
        <>
          <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              className="rounded-lg bg-card p-5"
              label="Taux de signature"
              value={a.pct(a.signatureRate)}
              sub={`${a.won.length} signés sur ${a.deals.length} devis décidés`}
            />
            <Kpi
              className="rounded-lg bg-card p-5"
              label="Panier gagné · perdu"
              value={`${formatEur(a.avgWon)} · ${formatEur(a.avgLost)}`}
              sub={a.avgLost > a.avgWon ? 'on perd surtout les gros devis' : 'le montant pèse peu sur la décision'}
            />
            <Kpi
              className="rounded-lg bg-card p-5"
              label="N°1 des raisons de gain"
              value={a.winReasons[0] ? capitalize(a.winReasons[0].label.replace(/^Nos /, '')) : '—'}
              sub={a.winReasons[0] ? `citées dans ${a.winReasons[0].value} signatures sur ${a.won.length}` : 'aucun motif renseigné'}
              subTone="success"
            />
            <Kpi
              className="rounded-lg bg-card p-5"
              label="N°1 des raisons de perte"
              value={a.lossReasons[0]?.label ?? '—'}
              sub={a.lossReasons[0] ? `${a.lossReasons[0].value} refus sur ${a.lost.length}` : 'aucun refus'}
            />
          </dl>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="Pourquoi on gagne" description={`Motifs cochés à la signature, ${a.won.length} devis`} />
              {a.winReasons.length ? (
                <BarList label="Motifs de signature" items={a.winReasons} tone="success" />
              ) : (
                <p className="text-body-sm text-muted-foreground">Aucun motif renseigné.</p>
              )}
            </Card>
            <Card>
              <CardHeader title="Pourquoi on perd" description={`Motif principal à la clôture, ${a.lost.length} devis`} />
              {a.lossReasons.length ? (
                <BarList label="Motifs de refus" items={a.lossReasons} tone="danger" />
              ) : (
                <p className="text-body-sm text-muted-foreground">Aucun refus sur la période.</p>
              )}
            </Card>
            <Card>
              <CardHeader title="Signature par source" description="Part des devis signés selon l’origine du client" />
              <BarList
                label="Taux de signature par source"
                tone="ink"
                max={1}
                items={a.bySource.map((s) => ({ label: s.label, value: s.rate, display: `${a.pct(s.rate)} · ${s.won}/${s.total}` }))}
              />
            </Card>
            <Card>
              <CardHeader title="Signature par montant" description="Part des devis signés selon le total HT" />
              <BarList
                label="Taux de signature par montant"
                tone="ink"
                max={1}
                items={a.brackets.filter((b) => b.total > 0).map((b) => ({ label: b.label, value: b.rate, display: `${a.pct(b.rate)} · ${b.won}/${b.total}` }))}
              />
            </Card>
          </div>

          {a.insights.length > 0 && (
            <section className="flex flex-col gap-3 rounded-lg bg-primary p-5 text-primary-foreground" aria-labelledby="insights-title">
              <h2 id="insights-title" className="flex flex-wrap items-center gap-2.5 text-h3">
                Ce qu’il faut en retenir
                <Badge variant="brand">Assistant</Badge>
              </h2>
              <ul className="flex flex-col gap-2">
                {a.insights.map((text) => (
                  <li key={text} className="flex gap-3 text-body-md">
                    <span aria-hidden className="text-brand">
                      →
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Card>
            <CardHeader title="Derniers devis décidés" />
            <ul className="flex flex-col">
              {a.deals.slice(0, 6).map((d) => (
                <li
                  key={d.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-t border-border py-3 sm:grid-cols-[minmax(0,220px)_auto_1fr_auto]"
                >
                  <span className="truncate text-title-sm text-foreground">{d.client}</span>
                  <Badge variant={d.outcome === 'gagne' ? 'green' : 'red'} className="justify-self-end sm:justify-self-start">
                    {d.outcome === 'gagne' ? 'Gagné' : 'Perdu'}
                  </Badge>
                  <span className="truncate text-body-sm text-muted-foreground">
                    {d.outcome === 'gagne'
                      ? [...(d.win?.reasons ?? []), d.source].filter(Boolean).join(' · ') || 'Sans motif'
                      : [d.loss?.reason, d.loss?.competitor, d.loss?.price].filter(Boolean).join(' · ')}
                    {' · '}
                    {formatShortDate(d.decidedAt)}
                  </span>
                  <span className="text-right text-title-sm tabular-nums text-foreground">{formatEur(d.amount)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  )
}
