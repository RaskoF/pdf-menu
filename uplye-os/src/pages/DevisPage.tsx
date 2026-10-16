import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, UsersThree, Tag, CalendarBlank, Clock, Eye, CheckCircle, Handshake, MagnifyingGlass, CaretUp, CaretDown } from '@phosphor-icons/react'
import { useStore, nextNumber } from '../store'
import type { Activity, Devis, Owner, Stage } from '../types'
import { STAGES, daysBetween, fmt, fmtDate, relative, stageOf, totalHT, uid } from '../utils'
import { ActivityPill, Avatar, FilterSelect, Kpi, Segmented, StagePill } from '../components/ui'

type View = 'liste' | 'pipeline'
type Period = '30' | '90' | '365'

export default function DevisPage() {
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const [view, setView] = useState<View>(() => (localStorage.getItem('devis-view') as View) || 'pipeline')
  const [owner, setOwner] = useState<'all' | Owner>('all')
  const [activity, setActivity] = useState<'all' | Activity>('all')
  const [period, setPeriod] = useState<Period>('90')
  const [q, setQ] = useState('')
  const clientName = (id: string) => state.clients.find((c) => c.id === id)?.name ?? '—'

  const filtered = useMemo(() => state.devis.filter((d) =>
    (owner === 'all' || d.owner === owner) &&
    (activity === 'all' || d.activity === activity) &&
    daysBetween(d.createdAt, new Date().toISOString()) <= Number(period) &&
    (!q || `${d.title} ${clientName(d.clientId)} ${d.number}`.toLowerCase().includes(q.toLowerCase())),
  ), [state.devis, owner, activity, period, q]) // eslint-disable-line react-hooks/exhaustive-deps

  const open = filtered.filter((d) => ['brouillon', 'envoye', 'ouvert'].includes(d.stage))
  const pipeline = open.reduce((s, d) => s + totalHT(d), 0)
  const weighted = filtered.filter((d) => d.stage !== 'signe' && d.stage !== 'refuse').reduce((s, d) => s + totalHT(d) * stageOf(d.stage).proba, 0)
  const decided = filtered.filter((d) => d.stage === 'signe' || d.stage === 'refuse')
  const rate = decided.length ? Math.round((decided.filter((d) => d.stage === 'signe').length / decided.length) * 100) : 0
  const signed = filtered.filter((d) => d.stage === 'signe' && d.sentAt && d.signedAt)
  const delay = signed.length ? Math.round(signed.reduce((s, d) => s + daysBetween(d.sentAt!, d.signedAt!), 0) / signed.length) : 0

  const create = (stage: Stage = 'brouillon') => {
    const d: Devis = {
      id: uid(), number: stage === 'a_chiffrer' ? '' : nextNumber(state.devis), clientId: state.clients[0]!.id,
      title: stage === 'a_chiffrer' ? 'Nouveau prospect' : 'Nouveau devis', intro: '', owner: 'E', activity: 'Studio', stage,
      lines: [], validityDays: 30, schedule: '40/30/30', createdAt: new Date().toISOString(), openedCount: 0,
    }
    dispatch({ type: 'upsertDevis', devis: d })
    nav(`/devis/${d.id}`)
  }
  const switchView = (v: View) => { setView(v); try { localStorage.setItem('devis-view', v) } catch { /* ignoré */ } }

  return (
    <div className="px-10 py-8">
      <div className="flex items-center justify-between">
        <h1 className="h-page">Devis</h1>
        <button className="btn-primary" onClick={() => create()}><Plus size={18} weight="bold" />Nouveau devis</button>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <Kpi label="Pipeline ouvert" value={fmt(pipeline)} hint={`${open.length} devis en cours`} />
        <Kpi label="Pondéré" value={fmt(weighted)} hint="selon la probabilité par étape" />
        <Kpi label="Taux de signature" value={`${rate} %`} hint={`sur ${period} jours`} hintClass="text-g7" />
        <Kpi label="Délai moyen" value={`${delay} j`} hint="de l'envoi à la signature" />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Segmented value={view} onChange={switchView} options={[{ id: 'liste', label: 'Liste' }, { id: 'pipeline', label: 'Pipeline' }]} />
        <FilterSelect icon={<UsersThree size={16} />} value={owner} onChange={setOwner}
          options={[{ id: 'all', label: 'Tous les responsables' }, { id: 'E', label: 'Enzo' }, { id: 'A', label: 'Allan' }]} />
        <FilterSelect icon={<Tag size={16} />} value={activity} onChange={setActivity}
          options={[{ id: 'all', label: 'Toutes activités' }, { id: 'Studio', label: 'Studio' }, { id: 'Azurpod', label: 'Azurpod' }, { id: 'Academy', label: 'Academy' }]} />
        <FilterSelect icon={<CalendarBlank size={16} />} value={period} onChange={setPeriod}
          options={[{ id: '30', label: '30 derniers jours' }, { id: '90', label: '90 derniers jours' }, { id: '365', label: '12 derniers mois' }]} />
        <label className="ml-auto flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2">
          <MagnifyingGlass size={16} className="text-ink2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Client, objet, n°…" className="w-48 bg-transparent" />
        </label>
      </div>

      {view === 'pipeline'
        ? <Pipeline devis={filtered} clientName={clientName} onAddProspect={() => create('a_chiffrer')} />
        : <List devis={filtered} clientName={clientName} />}
    </div>
  )
}

function Pipeline({ devis, clientName, onAddProspect }: { devis: Devis[]; clientName: (id: string) => string; onAddProspect: () => void }) {
  const { dispatch } = useStore()
  const nav = useNavigate()
  const [over, setOver] = useState<Stage | null>(null)
  const [showRefused, setShowRefused] = useState(false)
  const cols = STAGES.filter((s) => s.id !== 'refuse')
  const refused = devis.filter((d) => d.stage === 'refuse')

  const drop = (stage: Stage, e: React.DragEvent) => {
    e.preventDefault(); setOver(null)
    const id = e.dataTransfer.getData('text/plain')
    if (id) dispatch({ type: 'moveDevis', id, stage })
  }
  const colProps = (stage: Stage) => ({
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setOver(stage) },
    onDragLeave: () => setOver(null),
    onDrop: (e: React.DragEvent) => drop(stage, e),
  })

  return (
    <div className="mt-5 flex items-start gap-2.5 overflow-x-auto pb-6">
      {cols.map((s) => {
        const items = devis.filter((d) => d.stage === s.id)
        const sum = items.reduce((t, d) => t + totalHT(d), 0)
        return (
          <div key={s.id} {...colProps(s.id)}
            className={`min-w-[190px] flex-1 rounded-2xl p-2.5 transition-colors ${over === s.id ? 'bg-hover ring-2 ring-accent' : 'bg-col'}`}>
            <div className="flex items-center gap-2 px-1.5 pt-1.5">
              <span className={`h-2 w-2 rounded-full ${s.dot}`} />
              <span className="flex-1 font-semibold">{s.label}</span>
              <span className="font-mono text-[11px] text-ink2">{items.length}</span>
            </div>
            <div className="px-1.5 pb-2 pt-1 font-mono text-[11px] text-ink2">{sum ? fmt(sum) : '—'}</div>
            <div className="flex flex-col gap-2">
              {items.map((d) => <Card key={d.id} d={d} client={clientName(d.clientId)} onOpen={() => nav(`/devis/${d.id}`)} />)}
            </div>
            {s.id === 'a_chiffrer' && (
              <button onClick={onAddProspect} className="mt-2 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-ink2 hover:bg-hover">
                <Plus size={14} /> Ajouter un prospect
              </button>
            )}
          </div>
        )
      })}
      <div {...colProps('refuse')}
        className={`shrink-0 rounded-2xl p-2.5 transition-colors ${over === 'refuse' ? 'bg-r1 ring-2 ring-r7' : 'bg-col'} ${showRefused ? 'w-[210px]' : 'w-12'}`}>
        <button onClick={() => setShowRefused(!showRefused)} className="w-full text-left">
          {showRefused
            ? <div className="flex items-center gap-2 px-1.5 pt-1.5"><span className="h-2 w-2 rounded-full bg-r7" /><span className="flex-1 font-semibold">Refusé</span><span className="font-mono text-[11px] text-ink2">{refused.length}</span></div>
            : <div className="flex flex-col items-center gap-2 py-1.5"><span className="font-mono text-[11px] text-ink2">{refused.length}</span><span className="text-[13px] text-ink2 [writing-mode:vertical-rl]">Refusé · {fmt(refused.reduce((t, d) => t + totalHT(d), 0))}</span></div>}
        </button>
        {showRefused && <div className="mt-3 flex flex-col gap-2">{refused.map((d) => <Card key={d.id} d={d} client={clientName(d.clientId)} onOpen={() => nav(`/devis/${d.id}`)} />)}</div>}
      </div>
    </div>
  )
}

function Card({ d, client, onOpen }: { d: Devis; client: string; onOpen: () => void }) {
  const total = totalHT(d)
  const signal =
    d.stage === 'a_chiffrer' ? (d.source ? { cls: 'bg-hover text-ink', icon: <Handshake size={14} />, text: d.source } : null)
    : d.stage === 'envoye' ? { cls: 'bg-y1 text-ink', icon: <Clock size={14} />, text: `Pas encore ouvert · envoyé ${relative(d.sentAt)}` }
    : d.stage === 'ouvert' ? { cls: 'bg-b1 text-b7', icon: <Eye size={14} />, text: `Ouvert ${d.openedCount} fois · ${relative(d.lastOpenedAt)}` }
    : d.stage === 'signe' ? { cls: 'bg-g1 text-g7', icon: <CheckCircle size={14} />, text: `Signé le ${fmtDate(d.signedAt)}` }
    : null
  const footer = d.stage === 'a_chiffrer' ? 'Devis à faire' : d.stage === 'brouillon' ? `Modifié ${relative(d.createdAt)}`
    : d.stage === 'envoye' ? 'Relance auto envoyée' : d.stage === 'ouvert' ? 'Relance J+3 demain' : d.stage === 'signe' ? 'Projet créé' : 'Archivé'
  return (
    <div draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', d.id); e.dataTransfer.effectAllowed = 'move' }}
      onClick={onOpen}
      className="cursor-grab rounded-xl bg-surface p-3.5 shadow-[0_1px_0_rgba(16,20,0,0.06)] hover:ring-1 hover:ring-line2 active:cursor-grabbing">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-ink2">{d.number || 'LEAD'}</span>
        <span className="font-semibold">{total ? fmt(total) : d.stage === 'brouillon' ? 'Sur devis' : '—'}</span>
      </div>
      <div className="mt-2 font-semibold leading-snug">{client}</div>
      <div className="mt-1 text-[13px] leading-snug text-ink2">{d.title}</div>
      {signal && <div className={`mt-2.5 flex items-center gap-1.5 truncate rounded-lg px-2 py-1 text-[12px] ${signal.cls}`}>{signal.icon}<span className="truncate">{signal.text}</span></div>}
      <div className="mt-2.5 flex items-center gap-2"><Avatar text={d.owner} tone={d.owner === 'A' ? 'dark' : 'accent'} /><span className="tag">{footer}</span></div>
    </div>
  )
}

type SortKey = 'number' | 'client' | 'total' | 'stage' | 'date'
function List({ devis, clientName }: { devis: Devis[]; clientName: (id: string) => string }) {
  const nav = useNavigate()
  const [sort, setSort] = useState<{ k: SortKey; asc: boolean }>({ k: 'date', asc: false })
  const order = STAGES.map((s) => s.id)
  const val = (d: Devis): string | number =>
    sort.k === 'number' ? d.number : sort.k === 'client' ? clientName(d.clientId) : sort.k === 'total' ? totalHT(d)
      : sort.k === 'stage' ? order.indexOf(d.stage) : d.createdAt
  const rows = [...devis].sort((a, b) => (val(a) < val(b) ? -1 : val(a) > val(b) ? 1 : 0) * (sort.asc ? 1 : -1))
  const H = (k: SortKey, label: string, right?: boolean) => (
    <th key={k} className={`px-4 py-3 font-mono text-[11px] font-normal uppercase text-ink2 ${right ? 'text-right' : 'text-left'}`}>
      <button onClick={() => setSort({ k, asc: sort.k === k ? !sort.asc : true })} className="inline-flex items-center gap-1 uppercase">
        {label}{sort.k === k && (sort.asc ? <CaretUp size={10} /> : <CaretDown size={10} />)}
      </button>
    </th>
  )
  if (!rows.length) return <div className="card mt-5 p-10 text-center text-ink2">Aucun devis pour ces filtres.</div>
  return (
    <div className="card mt-5 overflow-hidden">
      <table className="w-full">
        <thead className="border-b border-line"><tr>
          {H('number', 'N°')}{H('client', 'Client')}<th className="px-4 py-3 text-left font-mono text-[11px] font-normal uppercase text-ink2">Objet</th>
          <th className="px-4 py-3 text-left font-mono text-[11px] font-normal uppercase text-ink2">Activité</th>
          {H('stage', 'Statut')}{H('date', 'Créé')}{H('total', 'Total HT', true)}
        </tr></thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.id} onClick={() => nav(`/devis/${d.id}`)} className="cursor-pointer border-b border-line last:border-0 hover:bg-hover/50">
              <td className="px-4 py-3 font-mono text-[12px] text-ink2">{d.number || 'LEAD'}</td>
              <td className="px-4 py-3 font-semibold">{clientName(d.clientId)}</td>
              <td className="px-4 py-3 text-ink2">{d.title}</td>
              <td className="px-4 py-3"><ActivityPill activity={d.activity} /></td>
              <td className="px-4 py-3"><StagePill stage={d.stage} /></td>
              <td className="px-4 py-3 text-ink2">{fmtDate(d.createdAt)}</td>
              <td className="px-4 py-3 text-right font-semibold">{totalHT(d) ? fmt(totalHT(d)) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
