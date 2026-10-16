import { useState } from 'react'
import { Plus, UsersThree, Folder, Clock } from '@phosphor-icons/react'
import { useStore } from '../store'
import type { Person, Task, TaskStatus } from '../types'
import { DUE_LABEL, PEOPLE, dueState, fmtDate } from '../utils'
import { FilterSelect, PersonAvatar, TASK_STATUSES, TypePill } from '../components/ui'
import TaskModal, { newTask } from '../components/TaskModal'

export default function KanbanPage() {
  const { state, dispatch } = useStore()
  const [who, setWho] = useState<'all' | Person>('all')
  const [proj, setProj] = useState('all')
  const [over, setOver] = useState<TaskStatus | null>(null)
  const [edit, setEdit] = useState<Task | null>(null)
  const tasks = state.tasks.filter((t) => (who === 'all' || t.assignee === who) && (proj === 'all' || (proj === 'none' ? !t.projectId : t.projectId === proj)))
  const pname = (id?: string) => (id ? state.projects.find((p) => p.id === id)?.name : 'Interne') ?? '—'
  const drop = (status: TaskStatus, e: React.DragEvent) => {
    e.preventDefault(); setOver(null)
    const t = state.tasks.find((x) => x.id === e.dataTransfer.getData('text/plain'))
    if (t) dispatch({ type: 'upsert', coll: 'tasks', item: { ...t, status } })
  }
  return (
    <div className="px-10 py-8">
      <div className="flex items-center justify-between">
        <h1 className="h-page">Kanban</h1>
        <button className="btn-primary" onClick={() => setEdit(newTask())}><Plus size={18} weight="bold" />Nouvelle tâche</button>
      </div>
      <div className="mt-6 flex gap-2">
        <FilterSelect icon={<UsersThree size={16} />} value={who} onChange={setWho} options={[{ id: 'all', label: 'Toute l’équipe' }, ...(Object.keys(PEOPLE) as Person[]).map((p) => ({ id: p, label: PEOPLE[p].name }))]} />
        <FilterSelect icon={<Folder size={16} />} value={proj} onChange={setProj} options={[{ id: 'all', label: 'Tous les projets' }, ...state.projects.map((p) => ({ id: p.id, label: p.name })), { id: 'none', label: 'Interne' }]} />
      </div>
      <div className="mt-5 flex items-start gap-3">
        {TASK_STATUSES.map((s) => {
          const items = tasks.filter((t) => t.status === s.id).sort((a, b) => a.due.localeCompare(b.due))
          return (
            <div key={s.id} onDragOver={(e) => { e.preventDefault(); setOver(s.id) }} onDragLeave={() => setOver(null)} onDrop={(e) => drop(s.id, e)}
              className={`min-w-0 flex-1 rounded-2xl p-2.5 ${over === s.id ? 'bg-hover ring-2 ring-accent' : 'bg-col'}`}>
              <div className="flex items-center gap-2 px-1.5 py-1.5"><span className={`pill ${s.cls}`}>{s.label}</span><span className="flex-1" /><span className="font-mono text-[11px] text-ink2">{items.length} · {items.reduce((a, t) => a + t.hours, 0)} h</span></div>
              <div className="mt-1 flex flex-col gap-2">
                {items.map((t) => {
                  const ds = dueState(t.due, t.status === 'done')
                  const late = ds === 'late'
                  return (
                    <div key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', t.id)} onClick={() => setEdit(t)}
                      className="cursor-grab rounded-xl bg-surface p-3 hover:ring-1 hover:ring-line2 active:cursor-grabbing">
                      <div className="tag truncate">{pname(t.projectId)}</div>
                      <div className="mt-1 font-semibold leading-snug">{t.title}</div>
                      <div className="mt-2 flex flex-wrap gap-1.5"><TypePill t={t.type} />
                        {ds && <span className={`pill !text-[11px] ${late ? 'bg-r1 text-r7' : 'bg-o1 text-o7'}`}>{DUE_LABEL[ds]}</span>}
                        {t.pending && <span className="pill bg-y1 !text-[11px]">Changement à valider</span>}
                      </div>
                      <div className="mt-2 flex items-center gap-2 whitespace-nowrap">
                        <span className="flex-1" />
                        <span className="flex items-center gap-1 font-mono text-[11px] text-ink2"><Clock size={12} />{t.hours} h</span>
                        <span className={`text-[12px] ${late ? 'font-semibold text-r7' : 'text-ink2'}`}>{fmtDate(t.due)}</span>
                        <PersonAvatar p={t.assignee} size={22} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <button onClick={() => setEdit({ ...newTask(proj !== 'all' && proj !== 'none' ? proj : undefined), status: s.id })} className="mt-2 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-ink2 hover:bg-hover"><Plus size={14} />Ajouter</button>
            </div>
          )
        })}
      </div>
      {edit && <TaskModal task={edit} onClose={() => setEdit(null)} />}
    </div>
  )
}
