import { useState } from 'react'
import { useStore } from '../store'
import type { Person, Task, TaskStatus, TaskType } from '../types'
import { PEOPLE, uid } from '../utils'
import { Modal, TASK_STATUSES } from './ui'
import { describe, notif, sensitiveDiff } from './requests'

export function newTask(projectId?: string): Task {
  return { id: uid(), projectId, title: '', assignee: 'X', status: 'todo', type: 'Montage', hours: 2, due: new Date(Date.now() + 3 * 86400000).toISOString() }
}

// Création ou modification d'une tâche, durée libre (2 h comme 20 h).
export default function TaskModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const [t, setT] = useState(task)
  const exists = state.tasks.some((x) => x.id === task.id)
  const restricted = state.me === 'X' && exists
  const diff = restricted ? sensitiveDiff(task, t) : null
  const [reason, setReason] = useState('')
  const save = () => {
    if (!t.title.trim()) return
    if (diff) {
      // le changement sensible reste en attente : la tâche garde ses valeurs actuelles jusqu'à validation
      dispatch({ type: 'upsert', coll: 'tasks', item: { ...t, due: task.due, hours: task.hours, assignee: task.assignee, pending: { ...diff, by: 'X', at: new Date().toISOString(), reason } } })
      dispatch({ type: 'upsert', coll: 'notifs', item: notif('admins', `Alexis demande un changement sur « ${t.title} » : ${describe(task, diff)}${reason ? ` (${reason})` : ''}`, '/kanban', 'demande') })
    } else dispatch({ type: 'upsert', coll: 'tasks', item: state.me === 'X' && !exists ? { ...t, assignee: 'X' } : t })
    onClose()
  }
  return (
    <Modal title={exists ? 'Modifier la tâche' : 'Nouvelle tâche'} onClose={onClose}>
      <div className="space-y-3">
        <L label="Titre"><input autoFocus className="field" value={t.title} onChange={(e) => setT({ ...t, title: e.target.value })} placeholder="Ex. Montage V1 vidéo 30 s" /></L>
        <L label="Projet">
          <select className="field" value={t.projectId ?? ''} onChange={(e) => setT({ ...t, projectId: e.target.value || undefined })}>
            <option value="">Interne (sans projet)</option>
            {state.projects.map((p) => <option key={p.id} value={p.id}>{p.name} · {state.clients.find((c) => c.id === p.clientId)?.name}</option>)}
          </select>
        </L>
        <div className="grid grid-cols-2 gap-3">
          <L label="Assignée à"><select className="field" disabled={state.me === 'X' && !exists} value={state.me === 'X' && !exists ? 'X' : t.assignee} onChange={(e) => setT({ ...t, assignee: e.target.value as Person })}>{(Object.keys(PEOPLE) as Person[]).map((p) => <option key={p} value={p}>{PEOPLE[p].name}</option>)}</select></L>
          <L label="Type"><select className="field" value={t.type} onChange={(e) => setT({ ...t, type: e.target.value as TaskType })}>{['Tournage', 'Montage', 'Admin', 'Commercial', 'Azurpod'].map((x) => <option key={x}>{x}</option>)}</select></L>
          <L label="Statut"><select className="field" value={t.status} onChange={(e) => setT({ ...t, status: e.target.value as TaskStatus })}>{TASK_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></L>
          <L label="Échéance"><input type="date" className="field" value={t.due.slice(0, 10)} onChange={(e) => setT({ ...t, due: new Date(e.target.value + 'T12:00:00').toISOString() })} /></L>
        </div>
        <L label={`Durée estimée · ${t.hours} h`}>
          <div className="flex items-center gap-3">
            <input type="range" min={0.5} max={40} step={0.5} value={t.hours} onChange={(e) => setT({ ...t, hours: Number(e.target.value) })} className="flex-1 accent-ink" />
            <input type="number" min={0.5} step={0.5} value={t.hours} onChange={(e) => setT({ ...t, hours: Math.max(0.5, Number(e.target.value)) })} className="field !w-20 text-right" />
          </div>
        </L>
        {task.pending && <div className="rounded-xl bg-y1 p-3 text-[13px]">Changement en attente de validation : {describe(task, task.pending)}.</div>}
        {diff && (
          <div className="rounded-xl border border-o7/30 bg-o1 p-3 text-[13px] text-o7">
            L’échéance, la durée et l’assignation sont validées par Enzo ou Allan. Ta demande leur sera envoyée.
            <input className="field mt-2 !bg-surface" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Pourquoi ? (ex. retours client arrivés en retard)" />
          </div>
        )}
      </div>
      <div className="mt-5 flex items-center gap-2">
        {exists && !restricted && <button className="btn-ghost text-r7" onClick={() => { dispatch({ type: 'remove', coll: 'tasks', id: t.id }); onClose() }}>Supprimer</button>}
        <span className="flex-1" />
        <button className="btn-secondary" onClick={onClose}>Annuler</button>
        <button className="btn-primary" disabled={!t.title.trim()} onClick={save}>{diff ? 'Demander la validation' : exists ? 'Enregistrer' : 'Créer la tâche'}</button>
      </div>
    </Modal>
  )
}

const L = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block"><div className="tag mb-1.5">{label}</div>{children}</label>
