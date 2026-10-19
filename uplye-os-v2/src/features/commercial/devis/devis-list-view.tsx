import { useMemo, useState } from 'react'
import { CaretDown, CaretUp, HourglassMedium, Lightning, WarningCircle } from '@phosphor-icons/react'
import { Button, Checkbox, Chip, Skeleton } from '@/components/ui'
import { EmptyState } from '@/components/app/empty-state'
import { formatEur, pluralize } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useClientsById, useCommercial } from '../store'
import { daysBetween, devisAmount, isHot, isStaleDraft, needsFollowUp } from '../lib'
import { amountLabel, amountNote, devisSubtitle } from '../selectors'
import { AttentionCard } from '../components/attention-card'
import { StatusBadge } from '../components/status-badge'
import type { Devis } from '../types'

export type ListFilter = 'tous' | 'chauds' | 'relancer' | 'brouillons'

/** Devis de la liste regroupés par filtre (hors archivés) */
function useDevisGroups() {
  const { data, loading, now } = useCommercial()
  const all = useMemo(() => (data?.devis ?? []).filter((d) => d.status !== 'archive'), [data?.devis])
  const groups = useMemo(
    () => ({
      tous: all,
      chauds: all.filter(isHot),
      relancer: all.filter((d) => needsFollowUp(d, now)),
      brouillons: all.filter((d) => d.status === 'brouillon'),
    }),
    [all, now],
  )
  return { all, groups, loading, now }
}

interface FilterProps {
  filter: ListFilter
  onFilterChange: (f: ListFilter) => void
}

// Figma : « Devis / Liste » (27:3), cartes d'attention au-dessus des onglets.
export function ListAttentionCards({ filter, onFilterChange }: FilterProps) {
  const clients = useClientsById()
  const { all, groups, loading, now } = useDevisGroups()
  const late = groups.relancer
  const hot = groups.chauds[0]
  const stale = all.filter((d) => isStaleDraft(d, now))
  const sum = (list: Devis[]) => formatEur(list.reduce((s, d) => s + (devisAmount(d) ?? 0), 0))
  const toggle = (f: ListFilter) => onFilterChange(filter === f ? 'tous' : f)
  return (
    <div className="grid gap-3 md:grid-cols-3" aria-label="À traiter en priorité" role="group">
      {loading ? (
        Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-[72px] rounded-lg" />)
      ) : (
        <>
          <AttentionCard
            tone="danger"
            icon={<WarningCircle />}
            title={late.length ? `${pluralize(late.length, 'relance')} en retard` : 'Aucune relance en retard'}
            detail={late.length ? `J+3 dépassé, ${sum(late)}` : 'Tout est à jour'}
            active={filter === 'relancer'}
            onClick={() => toggle('relancer')}
          />
          <AttentionCard
            icon={<Lightning />}
            title={`${pluralize(groups.chauds.length, 'devis chaud', 'devis chauds')}`}
            detail={hot ? `Ouvert ${hot.views} fois, ${amountLabel(hot)}` : 'Aucun devis consulté plusieurs fois'}
            active={filter === 'chauds'}
            onClick={() => toggle('chauds')}
          />
          <AttentionCard
            icon={<HourglassMedium />}
            title={`${pluralize(stale.length, 'brouillon oublié', 'brouillons oubliés')}`}
            detail={
              stale[0] ? `${clients.get(stale[0].clientId)?.name}, ${pluralize(daysBetween(stale[0].editedAt, now), 'jour')}` : 'Aucun brouillon en sommeil'
            }
            active={filter === 'brouillons'}
            onClick={() => toggle('brouillons')}
          />
        </>
      )}
    </div>
  )
}

export function ListFilterChips({ filter, onFilterChange }: FilterProps) {
  const { groups, loading } = useDevisGroups()
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrer les devis">
      <Chip active={filter === 'tous'} count={loading ? undefined : groups.tous.length} onClick={() => onFilterChange('tous')}>
        Tous
      </Chip>
      <Chip active={filter === 'chauds'} count={loading ? undefined : groups.chauds.length} onClick={() => onFilterChange('chauds')}>
        <Lightning className="size-3.5" aria-hidden />
        Chauds
      </Chip>
      <Chip active={filter === 'relancer'} count={loading ? undefined : groups.relancer.length} onClick={() => onFilterChange('relancer')}>
        À relancer
      </Chip>
      <Chip active={filter === 'brouillons'} count={loading ? undefined : groups.brouillons.length} onClick={() => onFilterChange('brouillons')}>
        Brouillons
      </Chip>
    </div>
  )
}

// Figma : tableau « Devis / Liste » (27:3) et son état « Chargement » (119:1608).
export function DevisListView({
  selectedId,
  onSelect,
  filter,
  onBulkRemind,
  onBulkArchive,
}: {
  selectedId: string | null
  onSelect: (id: string) => void
  filter: ListFilter
  onBulkRemind: (ids: string[]) => void
  onBulkArchive: (ids: string[]) => void
}) {
  const clients = useClientsById()
  const { groups, loading } = useDevisGroups()
  const [sort, setSort] = useState<'desc' | 'asc' | null>(null)
  const [checked, setChecked] = useState<string[]>([])
  const rows = useMemo(() => {
    const list = [...groups[filter]]
    if (sort) list.sort((a, b) => ((devisAmount(a) ?? -1) - (devisAmount(b) ?? -1)) * (sort === 'asc' ? 1 : -1))
    return list
  }, [groups, filter, sort])
  const visibleChecked = checked.filter((id) => rows.some((r) => r.id === id))
  const allChecked = rows.length > 0 && visibleChecked.length === rows.length

  return (
    <div className="flex flex-col gap-5">
      {visibleChecked.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-surface-1 px-4 py-2" role="region" aria-label="Actions groupées">
          <span className="flex-1 text-label-sm text-foreground">{pluralize(visibleChecked.length, 'devis sélectionné', 'devis sélectionnés')}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onBulkRemind(visibleChecked)
              setChecked([])
            }}
          >
            Relancer
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              onBulkArchive(visibleChecked)
              setChecked([])
            }}
          >
            Archiver
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setChecked([])}>
            Désélectionner
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full table-fixed border-collapse text-left">
          <caption className="sr-only">Liste des devis</caption>
          <thead className="bg-surface-1/40">
            <tr className="h-10 border-b border-border">
              <th scope="col" className="w-12 pl-4">
                <Checkbox
                  aria-label="Tout sélectionner"
                  checked={allChecked ? true : visibleChecked.length ? 'indeterminate' : false}
                  onCheckedChange={(v) => setChecked(v === true ? rows.map((r) => r.id) : [])}
                  disabled={loading || rows.length === 0}
                />
              </th>
              <th scope="col" className="text-meta-md font-normal text-muted-foreground">
                Client et objet
              </th>
              <th scope="col" className="w-32 pr-4 text-right sm:w-40" aria-sort={sort === 'asc' ? 'ascending' : sort === 'desc' ? 'descending' : 'none'}>
                <button
                  type="button"
                  onClick={() => setSort((s) => (s === 'desc' ? 'asc' : 'desc'))}
                  className="focus-ring inline-flex items-center gap-1 rounded-sm text-meta-md text-muted-foreground hover:text-foreground"
                >
                  Montant
                  {sort === 'asc' ? <CaretUp className="size-3.5" aria-hidden /> : <CaretDown className="size-3.5" aria-hidden />}
                </button>
              </th>
              <th scope="col" className="hidden w-28 text-meta-md font-normal text-muted-foreground sm:table-cell">
                Statut
              </th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }, (_, i) => (
                  <tr key={i} className="h-[57px] border-b border-border last:border-0">
                    <td className="pl-4">
                      <Skeleton className="size-4" />
                    </td>
                    <td>
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="mt-2 h-3 w-2/3" />
                    </td>
                    <td className="pr-4">
                      <Skeleton className="ml-auto h-4 w-16" />
                    </td>
                    <td className="hidden sm:table-cell">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </td>
                  </tr>
                ))
              : rows.map((d) => {
                  const client = clients.get(d.clientId)
                  const selected = d.id === selectedId
                  return (
                    <tr
                      key={d.id}
                      className={cn(
                        'h-[57px] cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-surface-hover',
                        selected && 'bg-surface-1',
                      )}
                      onClick={() => onSelect(d.id)}
                    >
                      <td className="pl-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          aria-label={`Sélectionner ${client?.name}`}
                          checked={checked.includes(d.id)}
                          onCheckedChange={(v) => setChecked((c) => (v === true ? [...c, d.id] : c.filter((x) => x !== d.id)))}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <button
                          type="button"
                          aria-current={selected || undefined}
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelect(d.id)
                          }}
                          className="focus-ring block max-w-full rounded-sm text-left"
                        >
                          <span className="block truncate text-title-sm text-foreground">{client?.name}</span>
                          <span className="block truncate text-body-sm text-muted-foreground">{devisSubtitle(d)}</span>
                        </button>
                      </td>
                      <td className="py-2 pr-4 text-right">
                        <span className="block text-title-sm tabular-nums text-foreground">{amountLabel(d)}</span>
                        <span className="block truncate text-body-sm text-muted-foreground">{amountNote(d)}</span>
                        <StatusBadge status={d.status} className="mt-1 sm:hidden" />
                      </td>
                      <td className="hidden sm:table-cell">
                        <StatusBadge status={d.status} />
                      </td>
                    </tr>
                  )
                })}
          </tbody>
        </table>
        {!loading && rows.length === 0 && (
          <EmptyState icon={<Lightning />} title="Rien dans ce filtre">
            Aucun devis ne correspond. Revenez à « Tous » pour voir l’ensemble.
          </EmptyState>
        )}
      </div>
    </div>
  )
}
