import type { ReactNode } from 'react'
import type { Stage } from '../types'
import { stageOf } from '../utils'

export function Kpi({ label, value, hint, hintClass = 'text-ink2' }: { label: string; value: ReactNode; hint?: ReactNode; hintClass?: string }) {
  return (
    <div className="card px-5 py-4">
      <div className="tag">{label}</div>
      <div className="num mt-3">{value}</div>
      {hint && <div className={`mt-2 text-[13px] ${hintClass}`}>{hint}</div>}
    </div>
  )
}

export function Avatar({ text, tone = 'accent', size = 24 }: { text: string; tone?: 'accent' | 'dark' | 'neutral'; size?: number }) {
  const cls = tone === 'accent' ? 'bg-accent text-ink' : tone === 'dark' ? 'bg-ink text-ondark' : 'bg-hover text-ink'
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${cls}`} style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {text}
    </span>
  )
}

const STAGE_PILL: Record<Stage, string> = {
  a_chiffrer: 'bg-hover text-ink', brouillon: 'bg-hover text-ink2', envoye: 'bg-y1 text-ink',
  ouvert: 'bg-b1 text-b7', signe: 'bg-g1 text-g7', refuse: 'bg-r1 text-r7',
}
export const StagePill = ({ stage }: { stage: Stage }) => <span className={`pill ${STAGE_PILL[stage]}`}>{stageOf(stage).label}</span>

const ACT: Record<string, string> = { Studio: 'bg-o1 text-o7', Azurpod: 'bg-t1 text-t7', Academy: 'bg-p1 text-p7' }
export const ActivityPill = ({ activity }: { activity: string }) => <span className={`pill ${ACT[activity] ?? 'bg-hover'}`}>{activity}</span>

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-xl bg-col p-1">
      {options.map((o) => (
        <button key={o.id} onClick={() => onChange(o.id)}
          className={`rounded-lg px-3.5 py-1.5 text-[14px] font-medium ${value === o.id ? 'bg-surface text-ink shadow-sm' : 'text-ink2 hover:text-ink'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function FilterSelect<T extends string>({ icon, value, options, onChange }: { icon: ReactNode; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <label className="relative inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-[14px]">
      {icon}
      <select className="appearance-none bg-transparent pr-4" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
      <span className="pointer-events-none absolute right-3 text-ink2">▾</span>
    </label>
  )
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className={`relative h-5 w-9 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-line'}`} aria-pressed={on}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-ink transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  )
}

import type { Person, ProjectStatus, TaskStatus, TaskType } from '../types'

export const TASK_STATUSES: { id: TaskStatus; label: string; cls: string }[] = [
  { id: 'todo', label: 'À faire', cls: 'bg-hover text-ink' },
  { id: 'progress', label: 'En cours', cls: 'bg-b1 text-b7' },
  { id: 'review', label: 'En review', cls: 'bg-y1 text-ink' },
  { id: 'blocked', label: 'Bloqué', cls: 'bg-r1 text-r7' },
  { id: 'done', label: 'Fait', cls: 'bg-g1 text-g7' },
]
export const TaskStatusPill = ({ s }: { s: TaskStatus }) => { const x = TASK_STATUSES.find((t) => t.id === s)!; return <span className={`pill ${x.cls}`}>{x.label}</span> }

const TYPE_CLS: Record<TaskType, string> = { Tournage: 'bg-o1 text-o7', Montage: 'bg-p1 text-p7', Admin: 'bg-hover text-ink', Commercial: 'bg-g1 text-g7', Azurpod: 'bg-t1 text-t7' }
export const TypePill = ({ t }: { t: TaskType }) => <span className={`pill !text-[12px] ${TYPE_CLS[t]}`}>{t}</span>

export const PROJECT_STEPS: { id: ProjectStatus; label: string }[] = [
  { id: 'preprod', label: 'Préproduction' }, { id: 'tournage', label: 'Tournage' }, { id: 'montage', label: 'Montage' },
  { id: 'review', label: 'Retours client' }, { id: 'livre', label: 'Livré' },
]
export const ProjectStatusPill = ({ s }: { s: ProjectStatus }) => {
  const cls = s === 'livre' ? 'bg-g1 text-g7' : s === 'review' ? 'bg-y1 text-ink' : s === 'preprod' ? 'bg-hover text-ink' : 'bg-b1 text-b7'
  return <span className={`pill ${cls}`}>{PROJECT_STEPS.find((p) => p.id === s)!.label}</span>
}

export const PersonAvatar = ({ p, size = 24 }: { p: Person; size?: number }) =>
  <Avatar text={p === 'X' ? 'AL' : p} tone={p === 'E' ? 'accent' : p === 'A' ? 'dark' : 'neutral'} size={size} />

export function Modal({ title, onClose, children, width = 520 }: { title: string; onClose: () => void; children: ReactNode; width?: number }) {
  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div className="card max-h-[90vh] overflow-y-auto p-6" style={{ width }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center"><div className="h-sec flex-1">{title}</div><button onClick={onClose} className="rounded p-1 text-ink2 hover:bg-hover">✕</button></div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}
