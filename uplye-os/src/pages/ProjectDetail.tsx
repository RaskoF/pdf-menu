import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash, Check } from '@phosphor-icons/react'
import { useStore } from '../store'
import type { Task } from '../types'
import { HOURLY_COST, PEOPLE, fmt, fmtDate, uid } from '../utils'
import { ActivityPill, Kpi, PersonAvatar, PROJECT_STEPS, TaskStatusPill, TypePill } from '../components/ui'
import TaskModal, { newTask } from '../components/TaskModal'
import { projectStats } from './ProjectsPage'

export default function ProjectDetail() {
  const { id } = useParams()
  const { state, dispatch } = useStore()
  const p = state.projects.find((x) => x.id === id)
  const [edit, setEdit] = useState<Task | null>(null)
  const [cost, setCost] = useState({ label: '', amount: '' })
  if (!p) return <div className="p-10">Projet introuvable. <Link to="/projets" className="underline">Retour</Link></div>
  const client = state.clients.find((c) => c.id === p.clientId)
  const devis = state.devis.find((d) => d.id === p.devisId)
  const st = projectStats(p, state.tasks)
  const invoices = state.invoices.filter((i) => i.projectId === p.id || (i.clientId === p.clientId && p.recurring))
  const save = (patch: Partial<typeof p>) => dispatch({ type: 'upsert', coll: 'projects', item: { ...p, ...patch } })
  const stepIdx = PROJECT_STEPS.findIndex((s) => s.id === p.status)
  const addCost = () => { if (!cost.label || !Number(cost.amount)) return; save({ costs: [...p.costs, { id: uid(), label: cost.label, amount: Number(cost.amount) }] }); setCost({ label: '', amount: '' }) }

  return (
    <div className="px-10 py-8">
      <Link to="/projets" className="tag flex items-center gap-1 hover:text-ink"><ArrowLeft size={12} />Projets</Link>
      <div className="mt-2 flex items-end gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3"><h1 className="h-page">{p.name}</h1><ActivityPill activity={p.activity} /></div>
          <div className="mt-2 text-ink2">
            <Link to={`/clients/${p.clientId}`} className="font-semibold text-ink hover:underline">{client?.name}</Link>
            {devis && <> · <Link to={`/devis/${devis.id}`} className="hover:underline">{devis.number}</Link></>} · du {fmtDate(p.start)} au {fmtDate(p.due)}
          </div>
        </div>
        {state.me === 'X'
          ? <div className="flex items-center gap-2 text-[13px] text-ink2">Responsable <span className="font-semibold text-ink">{PEOPLE[p.owner].name}</span></div>
          : <label className="flex items-center gap-2 text-[13px] text-ink2">Responsable
              <select className="field !w-auto" value={p.owner} onChange={(e) => save({ owner: e.target.value as typeof p.owner })}>{Object.entries(PEOPLE).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}</select>
            </label>}
      </div>

      {/* étapes cliquables */}
      <div className="card mt-6 flex items-center gap-2 p-3">
        {PROJECT_STEPS.map((s, i) => (
          <button key={s.id} disabled={state.me === 'X'} title={state.me === 'X' ? 'Géré par Enzo et Allan' : undefined} onClick={() => save({ status: s.id })}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 font-medium ${i === stepIdx ? 'bg-accent' : i < stepIdx ? 'bg-g1 text-g7' : 'text-ink2 hover:bg-hover'}`}>
            {i < stepIdx && <Check size={14} weight="bold" />}{s.label}
          </button>
        ))}
      </div>

      {state.me !== 'X' && <div className="mt-5 grid grid-cols-4 gap-4">
        <Kpi label="Budget" value={fmt(p.budget)} hint="CA HT du projet" />
        <Kpi label="Coûts" value={fmt(st.cost)} hint={`${fmt(st.direct)} directs + ${st.hours} h × ${HOURLY_COST} €`} />
        <Kpi label="Marge" value={`${st.marginPct} %`} hint={fmt(st.margin)} hintClass={st.marginPct < 30 ? 'text-r7' : 'text-g7'} />
        <Kpi label="Avancement" value={`${st.progress} %`} hint={`${st.ts.filter((t) => t.status === 'done').length} tâches faites sur ${st.ts.length}`} />
      </div>}

      <div className="mt-5 grid grid-cols-[1fr_380px] items-start gap-5">
        <div className="card p-5">
          <div className="flex items-center"><div className="h-sec flex-1">Tâches · {st.ts.length}</div><button className="btn-secondary !py-1.5" onClick={() => setEdit(newTask(p.id))}><Plus size={15} />Tâche</button></div>
          <div className="mt-3 divide-y divide-line border-t border-line">
            {[...st.ts].sort((a, b) => a.due.localeCompare(b.due)).map((t) => (
              <div key={t.id} role="button" tabIndex={0} onClick={() => setEdit(t)} onKeyDown={(e) => e.key === 'Enter' && setEdit(t)} className="flex w-full cursor-pointer items-center gap-3 py-3 text-left hover:bg-hover/40">
                <button title="Marquer comme fait" onClick={(e) => { e.stopPropagation(); dispatch({ type: 'upsert', coll: 'tasks', item: { ...t, status: t.status === 'done' ? 'todo' : 'done' } }) }}
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${t.status === 'done' ? 'border-g7 bg-g7 text-white' : 'border-line2'}`}>{t.status === 'done' && <Check size={12} weight="bold" />}</button>
                <span className={`flex-1 ${t.status === 'done' ? 'text-ink2 line-through' : 'font-medium'}`}>{t.title}</span>
                <TypePill t={t.type} /><TaskStatusPill s={t.status} />
                <span className="w-12 text-right font-mono text-[12px] text-ink2">{t.hours} h</span>
                <span className="w-16 text-right text-[13px] text-ink2">{fmtDate(t.due)}</span>
                <PersonAvatar p={t.assignee} />
              </div>
            ))}
            {!st.ts.length && <div className="py-6 text-center text-ink2">Aucune tâche. Ajoute la première.</div>}
          </div>
        </div>
        {state.me !== 'X' && <div className="space-y-5">
          <div className="card p-5">
            <div className="h-sec">Coûts directs</div>
            <div className="mt-3 space-y-2">
              {p.costs.map((c) => (
                <div key={c.id} className="group flex items-center gap-2"><span className="flex-1">{c.label}</span><span className="font-semibold">{fmt(c.amount)}</span>
                  <button onClick={() => save({ costs: p.costs.filter((x) => x.id !== c.id) })} className="opacity-0 group-hover:opacity-100"><Trash size={14} /></button></div>
              ))}
              <div className="flex items-center gap-2 border-t border-line pt-2 text-ink2"><span className="flex-1">Temps passé ({st.hours} h × {HOURLY_COST} €)</span><span className="font-semibold text-ink">{fmt(st.hours * HOURLY_COST)}</span></div>
            </div>
            <div className="mt-3 flex gap-2">
              <input className="field" placeholder="Freelance, location…" value={cost.label} onChange={(e) => setCost({ ...cost, label: e.target.value })} />
              <input className="field !w-24" placeholder="€ HT" type="number" value={cost.amount} onChange={(e) => setCost({ ...cost, amount: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addCost()} />
              <button className="btn-secondary !px-3" onClick={addCost}><Plus size={15} /></button>
            </div>
          </div>
          <div className="card p-5">
            <div className="h-sec">Factures</div>
            <div className="mt-3 space-y-2">
              {invoices.slice(-5).map((i) => (
                <div key={i.id} className="flex items-center gap-2 text-[14px]"><span className="font-mono text-[12px] text-ink2">{i.number}</span><span className="flex-1 truncate">{i.label}</span><span className="font-semibold">{fmt(i.amountHT)}</span>
                  <span className={`pill !text-[12px] ${i.paidAt ? 'bg-g1 text-g7' : new Date(i.dueAt) < new Date() ? 'bg-r1 text-r7' : 'bg-y1'}`}>{i.paidAt ? 'Payée' : new Date(i.dueAt) < new Date() ? 'En retard' : 'En attente'}</span></div>
              ))}
              {!invoices.length && <div className="text-ink2">Aucune facture liée.</div>}
            </div>
          </div>
        </div>}
      </div>
      {edit && <TaskModal task={edit} onClose={() => setEdit(null)} />}
    </div>
  )
}
