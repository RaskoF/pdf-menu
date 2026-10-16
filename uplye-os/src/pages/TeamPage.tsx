import { useState } from 'react'
import { Plus, EnvelopeSimple, Phone, CalendarX, ShieldCheck, Check, X } from '@phosphor-icons/react'
import { useStore } from '../store'
import type { Absence, Member, Person } from '../types'
import { PEOPLE, fmtDate, uid, weekStart } from '../utils'
import { Kpi, Modal, PersonAvatar } from '../components/ui'

const RIGHTS: [string, boolean, boolean][] = [
  ['Dashboard, Kanban, Planning', true, true], ['Projets et tâches', true, true], ['Azurpod', true, true],
  ['Montants des projets', true, false], ['Devis et clients', true, false], ['Événements', true, false], ['Finance, banque, compta', true, false], ['Inviter un membre', true, false],
]

export default function TeamPage() {
  const { state, dispatch } = useStore()
  const [absence, setAbsence] = useState<Member | null>(null)
  const [invite, setInvite] = useState(false)
  const [toast, setToast] = useState('')
  const admin = state.me !== 'X'
  const ws = weekStart(0), we = new Date(ws.getTime() + 7 * 86400000)
  const stats = (p: Person) => {
    const mine = state.tasks.filter((t) => t.assignee === p)
    const week = mine.filter((t) => new Date(t.due) >= ws && new Date(t.due) < we).reduce((s, t) => s + t.hours, 0)
    return { open: mine.filter((t) => t.status !== 'done').length, done: mine.filter((t) => t.status === 'done').length, week, projects: new Set(mine.map((t) => t.projectId).filter(Boolean)).size }
  }
  const away = state.members.flatMap((m) => m.absences.filter((a) => new Date(a.to) >= new Date()).map((a) => ({ m, a }))).sort((x, y) => x.a.from.localeCompare(y.a.from))
  return (
    <div className="px-10 py-8">
      <div className="flex items-center justify-between">
        <h1 className="h-page">Équipe</h1>
        {admin && <button className="btn-primary" onClick={() => setInvite(true)}><Plus size={18} weight="bold" />Inviter un membre</button>}
      </div>
      <div className="mt-6 grid grid-cols-4 gap-4">
        <Kpi label="Membres" value={state.members.length} hint="2 admins · 1 production" />
        <Kpi label="Capacité de la semaine" value={`${Object.values(PEOPLE).reduce((s, p) => s + p.capacity, 0)} h`} hint="hors absences" />
        <Kpi label="Heures planifiées" value={`${(['E', 'A', 'X'] as Person[]).reduce((s, p) => s + stats(p).week, 0)} h`} hint="cette semaine" />
        <Kpi label="Absences à venir" value={away.length} hint={away[0] ? `${PEOPLE[away[0].m.id].name} · ${fmtDate(away[0].a.from)}` : 'personne'} />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-4">
        {state.members.map((m) => {
          const s = stats(m.id), cap = PEOPLE[m.id].capacity, r = s.week / cap
          return (
            <div key={m.id} className="card p-5">
              <div className="flex items-center gap-3"><PersonAvatar p={m.id} size={48} /><div className="flex-1"><div className="text-[18px] font-semibold">{PEOPLE[m.id].name}</div><div className="text-ink2">{PEOPLE[m.id].role}</div></div>
                <span className={`pill ${m.id === 'X' ? 'bg-p1 text-p7' : 'bg-g1 text-g7'}`}>{m.id === 'X' ? 'Production' : 'Admin'}</span></div>
              <div className="mt-4 space-y-1 text-[13px] text-ink2">
                <div className="flex items-center gap-2"><EnvelopeSimple size={14} />{m.email}</div>
                <div className="flex items-center gap-2"><Phone size={14} />{m.phone}</div>
                <div>{m.contract} · depuis {fmtDate(m.since, { month: 'long', year: 'numeric' })}</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">{m.skills.map((k) => <span key={k} className="pill bg-hover !text-[12px]">{k}</span>)}</div>
              <div className="mt-4 h-2 rounded-full bg-app"><div className={`h-full rounded-full ${r > 1 ? 'bg-r7' : r > 0.8 ? 'bg-o7' : 'bg-g7'}`} style={{ width: `${Math.min(100, r * 100)}%` }} /></div>
              <div className="mt-1.5 flex justify-between text-[12px] text-ink2"><span>{s.week} h / {cap} h cette semaine</span><span>{s.open} tâches ouvertes · {s.projects} projets</span></div>
              <div className="mt-4 border-t border-line pt-3">
                <div className="flex items-center"><div className="tag flex-1">Absences</div>{(admin || m.id === state.me) && <button className="text-[13px] font-semibold" onClick={() => setAbsence(m)}>+ Ajouter</button>}</div>
                {m.absences.map((a) => (
                  <div key={a.id} className="mt-2 flex items-center gap-2 text-[13px]"><CalendarX size={14} className="text-o7" /><span className="flex-1">{a.label} · {fmtDate(a.from)} → {fmtDate(a.to)}</span>
                    {(admin || m.id === state.me) && <button onClick={() => dispatch({ type: 'upsert', coll: 'members', item: { ...m, absences: m.absences.filter((x) => x.id !== a.id) } })} className="text-ink2 hover:text-r7"><X size={13} /></button>}</div>
                ))}
                {!m.absences.length && <div className="mt-2 text-[13px] text-ink2">Aucune absence prévue.</div>}
              </div>
            </div>
          )
        })}
      </div>
      <div className="card mt-5 p-5">
        <div className="flex items-center gap-2"><ShieldCheck size={20} /><div className="h-sec flex-1">Qui voit quoi</div><span className="text-[13px] text-ink2">Dans la vraie app, ces droits sont appliqués par la base de données (voir SECURITY.md).</span></div>
        <table className="mt-3 w-full text-[14px]">
          <thead className="border-b border-line font-mono text-[11px] uppercase text-ink2"><tr><th className="py-2 text-left font-normal">Accès</th><th className="w-40 font-normal">Admin</th><th className="w-40 font-normal">Production</th></tr></thead>
          <tbody>{RIGHTS.map(([l, a, p]) => <tr key={l} className="border-b border-line last:border-0"><td className="py-2.5">{l}</td>{[a, p].map((v, i) => <td key={i} className="text-center">{v ? <Check size={16} className="mx-auto text-g7" weight="bold" /> : <X size={16} className="mx-auto text-ink2" />}</td>)}</tr>)}</tbody>
        </table>
      </div>
      {absence && <AbsenceModal onClose={() => setAbsence(null)} onSave={(a) => { dispatch({ type: 'upsert', coll: 'members', item: { ...absence, absences: [...absence.absences, a] } }); setAbsence(null) }} />}
      {invite && <InviteModal onClose={() => setInvite(false)} onDone={(email) => { setInvite(false); setToast(`Invitation prête pour ${email} (non envoyée : prototype)`); setTimeout(() => setToast(''), 2600) }} />}
      {toast && <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-xl bg-ink px-4 py-3 text-ondark shadow-lg">{toast}</div>}
    </div>
  )
}

function AbsenceModal({ onClose, onSave }: { onClose: () => void; onSave: (a: Absence) => void }) {
  const [a, setA] = useState<Absence>({ id: uid(), from: new Date(Date.now() + 7 * 86400000).toISOString(), to: new Date(Date.now() + 8 * 86400000).toISOString(), label: 'Congés' })
  return (
    <Modal title="Ajouter une absence" onClose={onClose} width={420}>
      <div className="space-y-3">
        <label className="block"><div className="tag mb-1.5">Motif</div><select className="field" value={a.label} onChange={(e) => setA({ ...a, label: e.target.value })}>{['Congés', 'École', 'Maladie', 'Formation'].map((x) => <option key={x}>{x}</option>)}</select></label>
        <div className="grid grid-cols-2 gap-3">
          <label><div className="tag mb-1.5">Du</div><input type="date" className="field" value={a.from.slice(0, 10)} onChange={(e) => setA({ ...a, from: new Date(e.target.value + 'T09:00:00').toISOString() })} /></label>
          <label><div className="tag mb-1.5">Au</div><input type="date" className="field" value={a.to.slice(0, 10)} onChange={(e) => setA({ ...a, to: new Date(e.target.value + 'T18:00:00').toISOString() })} /></label>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2"><button className="btn-secondary" onClick={onClose}>Annuler</button><button className="btn-primary" disabled={a.to < a.from} onClick={() => onSave(a)}>Ajouter</button></div>
    </Modal>
  )
}

function InviteModal({ onClose, onDone }: { onClose: () => void; onDone: (email: string) => void }) {
  const [f, setF] = useState({ name: '', email: '', role: 'Production' })
  const valid = f.name.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)
  return (
    <Modal title="Inviter un membre" onClose={onClose} width={440}>
      <div className="space-y-3">
        <label className="block"><div className="tag mb-1.5">Prénom et nom</div><input autoFocus className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label className="block"><div className="tag mb-1.5">E-mail</div><input type="email" className="field" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label className="block"><div className="tag mb-1.5">Rôle</div><select className="field" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}><option>Production</option><option>Admin</option></select></label>
        <p className="text-[13px] text-ink2">Le membre reçoit un lien d’accès à usage unique. Rôle Production : pas d’accès aux devis, aux clients ni à la finance.</p>
      </div>
      <div className="mt-5 flex justify-end gap-2"><button className="btn-secondary" onClick={onClose}>Annuler</button><button className="btn-primary" disabled={!valid} onClick={() => onDone(f.email)}>Préparer l’invitation</button></div>
    </Modal>
  )
}
