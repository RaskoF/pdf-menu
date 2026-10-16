import { Link } from 'react-router-dom'
import { Check, X, Clock, Bell } from '@phosphor-icons/react'
import { useStore, type State } from '../store'
import { DUE_LABEL, dueState, relative } from '../utils'
import { describe, notif } from './requests'

export function notifCount(s: State) {
  const admin = s.me !== 'X'
  const pending = admin ? s.tasks.filter((t) => t.pending).length : 0
  const reminders = s.tasks.filter((t) => t.assignee === s.me && dueState(t.due, t.status === 'done')).length
  const unread = s.notifs.filter((n) => !n.read && (n.to === s.me || (admin && n.to === 'admins')) && n.kind !== 'demande').length
  return pending + reminders + unread
}

// Panneau de notifications : demandes à valider (admins), rappels d'échéance, informations.
export default function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore()
  const admin = state.me !== 'X'
  const pending = admin ? state.tasks.filter((t) => t.pending) : []
  const reminders = state.tasks.filter((t) => t.assignee === state.me && dueState(t.due, t.status === 'done')).sort((a, b) => a.due.localeCompare(b.due))
  const infos = state.notifs.filter((n) => (n.to === state.me || (admin && n.to === 'admins')) && n.kind !== 'demande').slice(0, 8)
  const decide = (id: string, ok: boolean) => {
    const t = state.tasks.find((x) => x.id === id)
    if (!t?.pending) return
    const { due, hours, assignee, by } = t.pending
    const next = ok ? { ...t, due: due ?? t.due, hours: hours ?? t.hours, assignee: assignee ?? t.assignee, pending: undefined } : { ...t, pending: undefined }
    dispatch({ type: 'upsert', coll: 'tasks', item: next })
    dispatch({ type: 'upsert', coll: 'notifs', item: notif(by, `${ok ? 'Validé' : 'Refusé'} par ${state.me === 'E' ? 'Enzo' : 'Allan'} : ${describe(t, t.pending)} sur « ${t.title} »`, '/kanban') })
  }
  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div className="absolute bottom-16 left-[256px] max-h-[80vh] w-[400px] overflow-y-auto rounded-2xl border border-line bg-surface p-4 text-ink shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2"><Bell size={18} /><div className="h-sec flex-1">Notifications</div><button onClick={onClose} className="text-ink2"><X size={16} /></button></div>
        {admin && (
          <section className="mt-4">
            <div className="tag mb-2">À valider · {pending.length}</div>
            {pending.map((t) => (
              <div key={t.id} className="mb-2 rounded-xl border border-o7/30 bg-o1 p-3 text-[13px]">
                <div className="font-semibold text-ink">{t.title}</div>
                <div className="text-o7">Alexis demande : {describe(t, t.pending!)}</div>
                {t.pending!.reason && <div className="mt-1 italic text-ink2">« {t.pending!.reason} »</div>}
                <div className="mt-2 flex gap-2">
                  <button className="btn-primary !px-3 !py-1.5 text-[13px]" onClick={() => decide(t.id, true)}><Check size={14} />Accepter</button>
                  <button className="btn-secondary !px-3 !py-1.5 text-[13px]" onClick={() => decide(t.id, false)}><X size={14} />Refuser</button>
                </div>
              </div>
            ))}
            {!pending.length && <div className="text-[13px] text-ink2">Aucune demande en attente.</div>}
          </section>
        )}
        <section className="mt-4">
          <div className="tag mb-2">Rappels d’échéance · {reminders.length}</div>
          {reminders.map((t) => {
            const st = dueState(t.due, false)!
            return (
              <Link key={t.id} to="/kanban" onClick={onClose} className="mb-1.5 flex items-center gap-2 rounded-xl px-2 py-2 text-[13px] hover:bg-hover">
                <Clock size={15} className={st === 'late' ? 'text-r7' : 'text-o7'} /><span className="flex-1">{t.title}</span>
                <span className={`pill !text-[11px] ${st === 'late' ? 'bg-r1 text-r7' : 'bg-o1 text-o7'}`}>{DUE_LABEL[st]}</span>
              </Link>
            )
          })}
          {!reminders.length && <div className="text-[13px] text-ink2">Rien qui arrive à échéance.</div>}
        </section>
        <section className="mt-4">
          <div className="tag mb-2">Activité</div>
          {infos.map((n) => (
            <Link key={n.id} to={n.link} onClick={() => { dispatch({ type: 'upsert', coll: 'notifs', item: { ...n, read: true } }); onClose() }} className="mb-1.5 flex gap-2 rounded-xl px-2 py-2 text-[13px] hover:bg-hover">
              {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-b7" />}<span className="flex-1">{n.text}</span><span className="text-[11px] text-ink2">{relative(n.at)}</span>
            </Link>
          ))}
          {!infos.length && <div className="text-[13px] text-ink2">Rien de nouveau.</div>}
        </section>
      </div>
    </div>
  )
}
