import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from '@phosphor-icons/react'
import { useStore } from '../store'
import type { Activity, Person, Project, ProjectStatus, Task } from '../types'
import { HOURLY_COST, PEOPLE, fmt, fmtDate, pct, uid } from '../utils'
import { ActivityPill, Kpi, Modal, PersonAvatar, ProjectStatusPill, PROJECT_STEPS, Segmented } from '../components/ui'

export function projectStats(p: Project, tasks: Task[]) {
  const ts = tasks.filter((t) => t.projectId === p.id)
  const hours = ts.reduce((s, t) => s + t.hours, 0)
  const direct = p.costs.reduce((s, c) => s + c.amount, 0)
  const cost = direct + hours * HOURLY_COST
  const margin = p.budget - cost
  const done = ts.filter((t) => t.status === 'done').length
  return { ts, hours, direct, cost, margin, marginPct: pct(margin, p.budget), progress: ts.length ? Math.round((done / ts.length) * 100) : 0 }
}

export default function ProjectsPage() {
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const [filter, setFilter] = useState<'actifs' | 'livres' | 'tous'>('actifs')
  const [view, setView] = useState<'cartes' | 'kanban'>(() => { try { return (localStorage.getItem('projets-view') as 'cartes' | 'kanban') || 'cartes' } catch { return 'cartes' } })
  const [over, setOver] = useState<ProjectStatus | null>(null)
  const canMove = state.me !== 'X' // le statut d'un projet est piloté par les admins
  const switchView = (v: 'cartes' | 'kanban') => { setView(v); try { localStorage.setItem('projets-view', v) } catch { /* ignoré */ } }
  const dropOn = (status: ProjectStatus, e: React.DragEvent) => {
    e.preventDefault(); setOver(null)
    const p = state.projects.find((x) => x.id === e.dataTransfer.getData('text/plain'))
    if (p && canMove) dispatch({ type: 'upsert', coll: 'projects', item: { ...p, status } })
  }
  const [adding, setAdding] = useState(false)
  const list = state.projects.filter((p) => filter === 'tous' || (filter === 'livres' ? p.status === 'livre' : p.status !== 'livre'))
  const active = state.projects.filter((p) => p.status !== 'livre')
  const late = active.filter((p) => new Date(p.due) < new Date())
  const prod = active.reduce((s, p) => s + p.budget, 0)
  const avgMargin = state.projects.length ? Math.round(state.projects.reduce((s, p) => s + projectStats(p, state.tasks).marginPct, 0) / state.projects.length) : 0
  const client = (id: string) => state.clients.find((c) => c.id === id)?.name ?? '—'

  return (
    <div className="px-10 py-8">
      <div className="flex items-center justify-between">
        <h1 className="h-page">Projets</h1>
        <button className="btn-primary" onClick={() => setAdding(true)}><Plus size={18} weight="bold" />Nouveau projet</button>
      </div>
      {state.me !== 'X' && <div className="mt-6 grid grid-cols-4 gap-4">
        <Kpi label="Projets en cours" value={active.length} hint={`${late.length} en retard`} hintClass={late.length ? 'text-r7' : 'text-ink2'} />
        <Kpi label="CA en production" value={fmt(prod)} hint="HT, projets non livrés" />
        <Kpi label="Marge moyenne" value={`${avgMargin} %`} hint={`après coûts directs et heures à ${HOURLY_COST} €/h`} />
        <Kpi label="Heures planifiées" value={`${state.tasks.filter((t) => t.status !== 'done').reduce((s, t) => s + t.hours, 0)} h`} hint="tâches restantes" />
      </div>}
      <div className="mt-6 flex items-center gap-3">
        <Segmented value={view} onChange={switchView} options={[{ id: 'cartes', label: 'Cartes' }, { id: 'kanban', label: 'Kanban' }]} />
        {view === 'cartes' && <Segmented value={filter} onChange={setFilter} options={[{ id: 'actifs', label: 'En cours' }, { id: 'livres', label: 'Livrés' }, { id: 'tous', label: 'Tous' }]} />}
        {view === 'kanban' && !canMove && <span className="text-[13px] text-ink2">Lecture seule : le statut des projets est géré par Enzo et Allan.</span>}
      </div>
      {view === 'kanban' && (
        <div className="mt-4 flex items-start gap-3">
          {PROJECT_STEPS.map((col) => {
            const items = state.projects.filter((p) => p.status === col.id)
            return (
              <div key={col.id} onDragOver={(e) => { e.preventDefault(); if (canMove) setOver(col.id) }} onDragLeave={() => setOver(null)} onDrop={(e) => dropOn(col.id, e)}
                className={`min-w-0 flex-1 rounded-2xl p-2.5 ${over === col.id ? 'bg-hover ring-2 ring-accent' : 'bg-col'}`}>
                <div className="flex items-center px-1.5 py-1.5"><span className="flex-1 font-semibold">{col.label}</span><span className="font-mono text-[11px] text-ink2">{items.length}{state.me !== 'X' ? ` · ${fmt(items.reduce((t, p) => t + p.budget, 0))}` : ''}</span></div>
                <div className="mt-1 flex flex-col gap-2">
                  {items.map((p) => {
                    const st = projectStats(p, state.tasks)
                    const isLate = p.status !== 'livre' && new Date(p.due) < new Date()
                    return (
                      <div key={p.id} draggable={canMove} onDragStart={(e) => e.dataTransfer.setData('text/plain', p.id)} onClick={() => nav(`/projets/${p.id}`)}
                        className={`${canMove ? 'cursor-grab' : 'cursor-pointer'} rounded-xl bg-surface p-3 hover:ring-1 hover:ring-line2`}>
                        <div className="flex items-center gap-1.5"><ActivityPill activity={p.activity} /><span className="flex-1" /><PersonAvatar p={p.owner} size={22} /></div>
                        <div className="mt-2 font-semibold leading-snug">{p.name}</div>
                        <div className="text-[13px] text-ink2">{client(p.clientId)}</div>
                        <div className="mt-2 h-1.5 rounded-full bg-app"><div className="h-full rounded-full bg-g7" style={{ width: `${st.progress}%` }} /></div>
                        <div className="mt-2 flex justify-between text-[12px]"><span className="text-ink2">{st.progress} % des tâches</span><span className={isLate ? 'font-semibold text-r7' : 'text-ink2'}>{fmtDate(p.due)}</span></div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {view === 'cartes' && <div className="mt-4 grid grid-cols-2 gap-4 xl:grid-cols-3">
        {list.map((p) => {
          const st = projectStats(p, state.tasks)
          const isLate = p.status !== 'livre' && new Date(p.due) < new Date()
          const stepIdx = PROJECT_STEPS.findIndex((s) => s.id === p.status)
          return (
            <button key={p.id} onClick={() => nav(`/projets/${p.id}`)} className="card p-5 text-left hover:ring-1 hover:ring-line2">
              <div className="flex items-center gap-2"><ProjectStatusPill s={p.status} /><ActivityPill activity={p.activity} />{p.recurring && <span className="pill bg-hover">Récurrent</span>}<span className="flex-1" /><PersonAvatar p={p.owner} /></div>
              <div className="mt-3 text-[17px] font-semibold leading-snug">{p.name}</div>
              <div className="text-ink2">{client(p.clientId)}</div>
              <div className="mt-4 flex gap-1">{PROJECT_STEPS.map((s, i) => <span key={s.id} className={`h-1.5 flex-1 rounded-full ${i < stepIdx ? 'bg-g7' : i === stepIdx ? 'bg-accent' : 'bg-line'}`} />)}</div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-[13px]">
                {state.me !== 'X' ? <>
                  <div><div className="tag">Budget</div><div className="mt-0.5 font-semibold">{fmt(p.budget)}</div></div>
                  <div><div className="tag">Marge</div><div className={`mt-0.5 font-semibold ${st.marginPct < 30 ? 'text-r7' : 'text-g7'}`}>{st.marginPct} %</div></div>
                </> : <>
                  <div><div className="tag">Tâches</div><div className="mt-0.5 font-semibold">{st.ts.length}</div></div>
                  <div><div className="tag">Avancement</div><div className="mt-0.5 font-semibold">{st.progress} %</div></div>
                </>}
                <div><div className="tag">Échéance</div><div className={`mt-0.5 font-semibold ${isLate ? 'text-r7' : ''}`}>{fmtDate(p.due)}</div></div>
              </div>
            </button>
          )
        })}
      </div>}
      {adding && <NewProject onClose={() => setAdding(false)} onCreate={(p) => { dispatch({ type: 'upsert', coll: 'projects', item: p }); nav(`/projets/${p.id}`) }} />}
    </div>
  )
}

function NewProject({ onClose, onCreate }: { onClose: () => void; onCreate: (p: Project) => void }) {
  const { state } = useStore()
  const [p, setP] = useState<Project>({ id: uid(), name: '', clientId: state.clients[0]!.id, activity: 'Studio', status: 'preprod', owner: 'E', start: new Date().toISOString(), due: new Date(Date.now() + 21 * 86400000).toISOString(), budget: 0, costs: [] })
  return (
    <Modal title="Nouveau projet" onClose={onClose}>
      <div className="space-y-3">
        <label className="block"><div className="tag mb-1.5">Nom du projet</div><input autoFocus className="field" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label><div className="tag mb-1.5">Client</div><select className="field" value={p.clientId} onChange={(e) => setP({ ...p, clientId: e.target.value })}>{state.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label><div className="tag mb-1.5">Activité</div><select className="field" value={p.activity} onChange={(e) => setP({ ...p, activity: e.target.value as Activity })}><option>Studio</option><option>Azurpod</option><option>Academy</option></select></label>
          <label><div className="tag mb-1.5">Responsable</div><select className="field" value={p.owner} onChange={(e) => setP({ ...p, owner: e.target.value as Person })}>{(Object.keys(PEOPLE) as Person[]).map((x) => <option key={x} value={x}>{PEOPLE[x].name}</option>)}</select></label>
          <label><div className="tag mb-1.5">Budget HT</div><input type="number" className="field" value={p.budget || ''} onChange={(e) => setP({ ...p, budget: Number(e.target.value) })} /></label>
          <label className="col-span-2"><div className="tag mb-1.5">Livraison prévue</div><input type="date" className="field" value={p.due.slice(0, 10)} onChange={(e) => setP({ ...p, due: new Date(e.target.value + 'T12:00:00').toISOString() })} /></label>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2"><button className="btn-secondary" onClick={onClose}>Annuler</button><button className="btn-primary" disabled={!p.name.trim()} onClick={() => onCreate(p)}>Créer le projet</button></div>
    </Modal>
  )
}
