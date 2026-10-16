import { useState } from 'react'
import { CaretLeft, CaretRight, Plus } from '@phosphor-icons/react'
import { useStore } from '../store'
import type { Person, Task } from '../types'
import { PEOPLE } from '../utils'
import { PersonAvatar, TypePill } from '../components/ui'
import TaskModal, { newTask } from '../components/TaskModal'
import { describe, notif, sensitiveDiff } from '../components/requests'

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven']
type Layer = 'Uplye Studio' | 'Azurpod' | 'Uplye Academy' | 'Interne'
const LAYERS: { id: Layer; cls: string }[] = [
  { id: 'Uplye Studio', cls: 'bg-o1 text-o7 border-o7/30' }, { id: 'Azurpod', cls: 'bg-t1 text-t7 border-t7/30' },
  { id: 'Uplye Academy', cls: 'bg-p1 text-p7 border-p7/30' }, { id: 'Interne', cls: 'bg-hover text-ink border-line2' },
]
const ALL_ON: Record<Layer, boolean> = { 'Uplye Studio': true, Azurpod: true, 'Uplye Academy': true, Interne: true }
function monday(offset: number) {
  const d = new Date(); d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7)
  return d
}

// Semaine par personne : les tâches tombent sur leur jour d'échéance, la charge est comparée à la capacité.
export default function PlanningPage() {
  const { state, dispatch } = useStore()
  const [week, setWeek] = useState(0)
  const [edit, setEdit] = useState<Task | null>(null)
  const [over, setOver] = useState<string | null>(null)
  // calques affichés : on peut masquer une activité (préférence gardée dans le navigateur)
  const [layers, setLayers] = useState<Record<Layer, boolean>>(() => {
    try { return { ...ALL_ON, ...JSON.parse(localStorage.getItem('planning-layers') ?? '{}') } } catch { return ALL_ON }
  })
  const toggle = (l: Layer) => { const next = { ...layers, [l]: !layers[l] }; setLayers(next); try { localStorage.setItem('planning-layers', JSON.stringify(next)) } catch { /* ignoré */ } }
  const layerOf = (t: Task): Layer => {
    if (t.type === 'Azurpod') return 'Azurpod'
    const p = state.projects.find((x) => x.id === t.projectId)
    return p ? (p.activity === 'Studio' ? 'Uplye Studio' : p.activity === 'Academy' ? 'Uplye Academy' : 'Azurpod') : 'Interne'
  }
  const visible = (t: Task) => layers[layerOf(t)]
  const start = monday(week)
  const days = DAYS.map((_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
  const sameDay = (iso: string, d: Date) => new Date(iso).toDateString() === d.toDateString()
  const pname = (id?: string) => (id ? state.projects.find((p) => p.id === id)?.name : 'Interne') ?? ''
  const people = Object.keys(PEOPLE) as Person[]
  const drop = (p: Person, d: Date, e: React.DragEvent) => {
    e.preventDefault(); setOver(null)
    const t = state.tasks.find((x) => x.id === e.dataTransfer.getData('text/plain'))
    if (!t) return
    const moved = { ...t, assignee: p, due: new Date(d).toISOString() }
    const diff = state.me === 'X' ? sensitiveDiff(t, moved) : null
    if (diff) {
      dispatch({ type: 'upsert', coll: 'tasks', item: { ...t, pending: { ...diff, by: 'X', at: new Date().toISOString() } } })
      dispatch({ type: 'upsert', coll: 'notifs', item: notif('admins', `Alexis demande un changement sur « ${t.title} » : ${describe(t, diff)}`, '/planning', 'demande') })
    } else dispatch({ type: 'upsert', coll: 'tasks', item: moved })
  }
  const label = `${days[0]!.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${days[4]!.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`

  return (
    <div className="px-10 py-8">
      <div className="flex items-center gap-3">
        <h1 className="h-page flex-1">Planning</h1>
        <button className="btn-secondary !px-2.5" onClick={() => setWeek(week - 1)}><CaretLeft size={16} /></button>
        <button className="btn-secondary" onClick={() => setWeek(0)}>Cette semaine</button>
        <button className="btn-secondary !px-2.5" onClick={() => setWeek(week + 1)}><CaretRight size={16} /></button>
        <span className="w-36 text-center font-semibold">{label}</span>
        <button className="btn-primary" onClick={() => setEdit(newTask())}><Plus size={18} weight="bold" />Tâche</button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="tag mr-1">Afficher</span>
        {LAYERS.map((l) => (
          <button key={l.id} onClick={() => toggle(l.id)} aria-pressed={layers[l.id]}
            className={`pill border transition-opacity ${l.cls} ${layers[l.id] ? '' : 'opacity-35 line-through'}`}>{l.id}</button>
        ))}
      </div>
      <div className="card mt-3 overflow-hidden">
        <div className="grid grid-cols-[220px_repeat(5,1fr)] border-b border-line bg-app/60">
          <div className="px-4 py-3 tag">Équipe · charge de la semaine</div>
          {days.map((d, i) => (
            <div key={i} className={`px-3 py-3 ${d.toDateString() === new Date().toDateString() ? 'bg-accent/40' : ''}`}>
              <span className="tag">{DAYS[i]}</span> <span className="font-semibold">{d.getDate()}</span>
            </div>
          ))}
        </div>
        {people.map((p) => {
          const mine = state.tasks.filter((t) => t.assignee === p && visible(t) && days.some((d) => sameDay(t.due, d)))
          const load = mine.reduce((s, t) => s + t.hours, 0)
          const cap = PEOPLE[p].capacity
          const ratio = load / cap
          return (
            <div key={p} className="grid grid-cols-[220px_repeat(5,1fr)] border-b border-line last:border-0">
              <div className="border-r border-line px-4 py-4">
                <div className="flex items-center gap-2.5"><PersonAvatar p={p} size={30} /><div className="leading-tight"><div className="font-semibold">{PEOPLE[p].name}</div><div className="text-[12px] text-ink2">{PEOPLE[p].role}</div></div></div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-app"><div className={`h-full rounded-full ${ratio > 1 ? 'bg-r7' : ratio > 0.8 ? 'bg-o7' : 'bg-g7'}`} style={{ width: `${Math.min(100, ratio * 100)}%` }} /></div>
                <div className={`mt-1.5 text-[12px] ${ratio > 1 ? 'font-semibold text-r7' : 'text-ink2'}`}>{load} h / {cap} h{ratio > 1 ? ' · surcharge' : ''}</div>
              </div>
              {days.map((d, i) => {
                const key = `${p}-${i}`
                return (
                  <div key={i} onDragOver={(e) => { e.preventDefault(); setOver(key) }} onDragLeave={() => setOver(null)} onDrop={(e) => drop(p, d, e)}
                    className={`min-h-[120px] space-y-1.5 border-r border-line p-2 last:border-0 ${over === key ? 'bg-accent/20' : ''}`}>
                    {mine.filter((t) => sameDay(t.due, d)).map((t) => (
                      <div key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', t.id)} onClick={() => setEdit(t)}
                        className={`cursor-grab rounded-lg border border-line bg-surface p-2 text-[13px] hover:ring-1 hover:ring-line2 ${t.status === 'done' ? 'opacity-50' : ''} ${t.pending ? 'ring-1 ring-o7' : ''}`}>
                        <div className="truncate font-mono text-[10px] uppercase text-ink2">{pname(t.projectId)}</div>
                        <div className="font-medium leading-snug">{t.title}</div>
                        <div className="mt-1 flex items-center gap-1.5"><TypePill t={t.type} /><span className="font-mono text-[11px] text-ink2">{t.hours} h</span></div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )
        })}
        {layers.Azurpod && (
          <div className="grid grid-cols-[220px_repeat(5,1fr)] border-t border-line bg-t1/30">
            <div className="border-r border-line px-4 py-4"><div className="font-semibold">Studio Azurpod</div><div className="text-[12px] text-ink2">sessions réservées</div></div>
            {days.map((d, i) => (
              <div key={i} className="space-y-1.5 border-r border-line p-2 last:border-0">
                {state.bookings.filter((b) => b.status !== 'annulee' && sameDay(b.start, d)).map((b) => (
                  <div key={b.id} className="rounded-lg border border-t7/30 bg-t1 p-2 text-[12px] text-t7">
                    <div className="font-semibold">{new Date(b.start).getHours()}h · {state.clients.find((c) => c.id === b.clientId)?.name}</div>
                    <div>{b.hours} h · {b.formula}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="mt-3 text-[13px] text-ink2">Glisse une tâche sur un autre jour ou une autre personne pour la replanifier. La durée se règle dans la tâche (de 30 min à 40 h).</p>
      {edit && <TaskModal task={edit} onClose={() => setEdit(null)} />}
    </div>
  )
}
