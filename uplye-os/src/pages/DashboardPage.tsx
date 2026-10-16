import { Link, useNavigate } from 'react-router-dom'
import { Warning, Clock, Microphone, FilmStrip, CheckCircle, ArrowRight } from '@phosphor-icons/react'
import { useStore } from '../store'
import type { Task } from '../types'
import { PEOPLE, dueState, fmt, fmtDate, lastMonths, monthKey, monthLabel, relative, totalHT, weekStart } from '../utils'
import { Kpi, PersonAvatar, StagePill, TypePill } from '../components/ui'
import BarChart from '../components/BarChart'
import { useState } from 'react'
import TaskModal from '../components/TaskModal'

const sameDay = (a: string, b: Date) => new Date(a).toDateString() === b.toDateString()

export default function DashboardPage() {
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const [edit, setEdit] = useState<Task | null>(null)
  const me = state.me
  const admin = me !== 'X'
  const today = new Date()
  const ws = weekStart(0), we = new Date(ws.getTime() + 7 * 86400000)
  const inWeek = (iso: string) => new Date(iso) >= ws && new Date(iso) < we
  const client = (id: string) => state.clients.find((c) => c.id === id)?.name ?? '—'
  const month = monthKey(today.toISOString())

  const myTasks = state.tasks.filter((t) => t.assignee === me && t.status !== 'done' && new Date(t.due) <= new Date(today.toDateString() + ' 23:59')).sort((a, b) => a.due.localeCompare(b.due))
  const myWeekHours = state.tasks.filter((t) => t.assignee === me && inWeek(t.due)).reduce((s, t) => s + t.hours, 0)
  const signedMonth = state.devis.filter((d) => d.stage === 'signe' && d.signedAt && monthKey(d.signedAt) === month).reduce((s, d) => s + totalHT(d), 0)
  const inProd = state.projects.filter((p) => p.status !== 'livre').reduce((s, p) => s + p.budget, 0)
  const cashed = state.invoices.filter((i) => i.paidAt && monthKey(i.paidAt) === month).reduce((s, i) => s + i.amountHT, 0)
  const pending = state.devis.filter((d) => d.stage === 'envoye' || d.stage === 'ouvert')

  const alerts: { text: string; to: string }[] = []
  const lateInv = state.invoices.filter((i) => !i.paidAt && new Date(i.dueAt) < today)
  if (admin && lateInv.length) alerts.push({ text: `${lateInv.length} facture${lateInv.length > 1 ? 's' : ''} en retard · ${fmt(lateInv.reduce((s, i) => s + i.amountHT, 0))} HT`, to: '/finance' })
  const lateProj = state.projects.filter((p) => p.status !== 'livre' && new Date(p.due) < today)
  if (lateProj.length) alerts.push({ text: `${lateProj.length} projet${lateProj.length > 1 ? 's' : ''} en retard sur la livraison`, to: '/projets' })
  for (const p of ['E', 'A', 'X'] as const) {
    const h = state.tasks.filter((t) => t.assignee === p && inWeek(t.due)).reduce((s, t) => s + t.hours, 0)
    if (h > PEOPLE[p].capacity) alerts.push({ text: `${PEOPLE[p].name} est en surcharge cette semaine (${h} h / ${PEOPLE[p].capacity} h)`, to: '/planning' })
  }
  const soon = state.tasks.filter((t) => (admin || t.assignee === me) && ['today', 'tomorrow'].includes(dueState(t.due, t.status === 'done') ?? ''))
  if (soon.length) alerts.push({ text: `${soon.length} tâche${soon.length > 1 ? 's' : ''} à rendre aujourd’hui ou demain`, to: '/kanban' })
  const requests = state.tasks.filter((t) => t.pending)
  if (admin && requests.length) alerts.push({ text: `${requests.length} changement${requests.length > 1 ? 's' : ''} d’Alexis à valider`, to: '/kanban' })
  const blocked = state.tasks.filter((t) => t.status === 'blocked')
  if (blocked.length) alerts.push({ text: `${blocked.length} tâche${blocked.length > 1 ? 's' : ''} bloquée${blocked.length > 1 ? 's' : ''}`, to: '/kanban' })
  const toEdit = state.bookings.filter((b) => b.deliverable === 'a_monter' && b.status !== 'annulee')
  if (toEdit.length) alerts.push({ text: `${toEdit.length} session${toEdit.length > 1 ? 's' : ''} Azurpod à monter`, to: '/azurpod' })

  const fromToday = (iso: string) => new Date(iso) >= new Date(today.toDateString())
  const agenda = [
    ...state.bookings.filter((b) => b.status === 'confirmee' && inWeek(b.start)).map((b) => ({ at: b.start, icon: <Microphone size={15} />, t: `Azurpod · ${client(b.clientId)}`, s: `${new Date(b.start).getHours()}h · ${b.hours} h · ${b.formula}` })),
    ...state.projects.filter((p) => p.status !== 'livre' && inWeek(p.due)).map((p) => ({ at: p.due, icon: <FilmStrip size={15} />, t: `Livraison · ${p.name}`, s: client(p.clientId) })),
    ...state.tasks.filter((t) => t.type === 'Tournage' && t.status !== 'done' && inWeek(t.due)).map((t) => ({ at: t.due, icon: <FilmStrip size={15} />, t: t.title, s: state.projects.find((p) => p.id === t.projectId)?.name ?? 'Interne' })),
  ].filter((a) => fromToday(a.at)).sort((a, b) => a.at.localeCompare(b.at))

  const months = lastMonths(6)
  const rev = months.map((m) => state.invoices.filter((i) => monthKey(i.issuedAt) === m).reduce((s, i) => s + i.amountHT, 0))

  return (
    <div className="px-10 py-8">
      <div className="tag">{today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      <h1 className="h-page mt-1">Salut {PEOPLE[me].name}</h1>

      {admin ? (
        <div className="mt-6 grid grid-cols-4 gap-4">
          <Kpi label="CA signé ce mois" value={fmt(signedMonth)} hint="devis signés, HT" />
          <Kpi label="CA en production" value={fmt(inProd)} hint={`${state.projects.filter((p) => p.status !== 'livre').length} projets en cours`} />
          <Kpi label="Encaissé ce mois" value={fmt(cashed)} hint={`${lateInv.length} factures en retard`} hintClass={lateInv.length ? 'text-r7' : 'text-ink2'} />
          <Kpi label="Devis en attente" value={fmt(pending.reduce((s, d) => s + totalHT(d), 0))} hint={`${pending.length} devis envoyés ou ouverts`} />
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-line bg-surface px-4 py-2.5 text-[13px] text-ink2">Vue Production : tes tâches, ton planning et les retours clients. Les devis et les chiffres sont réservés aux admins.</div>
      )}

      {alerts.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {alerts.map((a) => (
            <Link key={a.text} to={a.to} className="flex items-center gap-2 rounded-xl border border-o7/20 bg-o1 px-3 py-2 text-[14px] text-o7 hover:brightness-95"><Warning size={16} />{a.text}<ArrowRight size={14} /></Link>
          ))}
        </div>
      )}

      <div className="mt-5 grid grid-cols-[1fr_400px] items-start gap-5">
        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex items-baseline"><div className="h-sec flex-1">Ma journée</div><span className="tag">{myTasks.reduce((s, t) => s + t.hours, 0)} h prévues · {myWeekHours} h / {PEOPLE[me].capacity} h cette semaine</span></div>
            <div className="mt-3 divide-y divide-line border-t border-line">
              {myTasks.map((t) => {
                const late = !sameDay(t.due, today)
                return (
                  <div key={t.id} className="flex items-center gap-3 py-3">
                    <button title="Marquer comme fait" onClick={() => dispatch({ type: 'upsert', coll: 'tasks', item: { ...t, status: 'done' } })} className="grid h-5 w-5 place-items-center rounded-md border border-line2 hover:border-g7 hover:bg-g1" />
                    <button onClick={() => setEdit(t)} className="flex-1 text-left"><div className="font-medium">{t.title}</div><div className="text-[12px] text-ink2">{state.projects.find((p) => p.id === t.projectId)?.name ?? 'Interne'}</div></button>
                    <TypePill t={t.type} />
                    <span className="flex items-center gap-1 font-mono text-[12px] text-ink2"><Clock size={12} />{t.hours} h</span>
                    {late && <span className="pill bg-r1 text-r7">En retard · {fmtDate(t.due)}</span>}
                  </div>
                )
              })}
              {!myTasks.length && <div className="flex items-center gap-2 py-6 text-g7"><CheckCircle size={18} />Rien d’urgent aujourd’hui.</div>}
            </div>
          </div>
          {admin ? (
            <div className="grid grid-cols-2 gap-5">
              <div className="card p-5">
                <div className="flex items-baseline"><div className="h-sec flex-1">CA facturé</div><span className="tag">6 derniers mois</span></div>
                <div className="mt-3"><BarChart labels={months.map((m) => monthLabel(m))} series={[{ name: 'CA facturé HT', color: '#3B5BDB', values: rev }]} height={170} highlight={5} /></div>
              </div>
              <div className="card p-5">
                <div className="h-sec">Devis à relancer</div>
                <div className="mt-3 space-y-3">
                  {pending.map((d) => (
                    <button key={d.id} onClick={() => nav(`/devis/${d.id}`)} className="flex w-full items-center gap-3 text-left">
                      <div className="flex-1"><div className="font-semibold">{client(d.clientId)}</div><div className="text-[12px] text-ink2">{d.stage === 'ouvert' ? `Ouvert ${d.openedCount} fois · ${relative(d.lastOpenedAt)}` : `Envoyé ${relative(d.sentAt)} · pas encore ouvert`}</div></div>
                      <span className="font-semibold">{fmt(totalHT(d))}</span><StagePill stage={d.stage} />
                    </button>
                  ))}
                  {!pending.length && <div className="text-ink2">Aucun devis en attente.</div>}
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-5">
              <div className="h-sec">Retours clients à traiter</div>
              <div className="mt-3 space-y-2">
                {state.tasks.filter((t) => t.assignee === 'X' && t.status === 'review').map((t) => <button key={t.id} onClick={() => setEdit(t)} className="flex w-full items-center gap-3 rounded-xl bg-app p-3 text-left"><span className="flex-1 font-medium">{t.title}</span><span className="text-[12px] text-ink2">{state.projects.find((p) => p.id === t.projectId)?.name}</span></button>)}
              </div>
            </div>
          )}
        </div>
        <div className="card p-5">
          <div className="h-sec">Cette semaine</div>
          <div className="mt-4 space-y-4">
            {agenda.map((a, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-14 shrink-0"><div className="tag">{new Date(a.at).toLocaleDateString('fr-FR', { weekday: 'short' })}</div><div className="font-title text-[22px] font-semibold leading-none">{new Date(a.at).getDate()}</div></div>
                <div className="flex-1 border-l border-line pl-3"><div className="flex items-center gap-1.5 font-semibold">{a.icon}{a.t}</div><div className="text-[13px] text-ink2">{a.s}</div></div>
              </div>
            ))}
            {!agenda.length && <div className="text-ink2">Semaine calme.</div>}
          </div>
          <div className="mt-5 border-t border-line pt-4">
            <div className="tag mb-2">L’équipe cette semaine</div>
            {(['E', 'A', 'X'] as const).map((p) => {
              const h = state.tasks.filter((t) => t.assignee === p && inWeek(t.due)).reduce((s, t) => s + t.hours, 0)
              const r = h / PEOPLE[p].capacity
              return (
                <div key={p} className="mb-2 flex items-center gap-2.5"><PersonAvatar p={p} size={24} /><span className="w-14 text-[13px]">{PEOPLE[p].name}</span>
                  <div className="h-2 flex-1 rounded-full bg-app"><div className={`h-full rounded-full ${r > 1 ? 'bg-r7' : r > 0.8 ? 'bg-o7' : 'bg-g7'}`} style={{ width: `${Math.min(100, r * 100)}%` }} /></div>
                  <span className="w-16 text-right font-mono text-[11px] text-ink2">{h} / {PEOPLE[p].capacity} h</span></div>
              )
            })}
          </div>
        </div>
      </div>
      {edit && <TaskModal task={edit} onClose={() => setEdit(null)} />}
    </div>
  )
}
