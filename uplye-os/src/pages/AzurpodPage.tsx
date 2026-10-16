import { useState } from 'react'
import { CaretLeft, CaretRight, Plus, Warning } from '@phosphor-icons/react'
import { useStore } from '../store'
import type { Booking, Deliverable, Formula } from '../types'
import { FORMULAS, STUDIO_HOURS, atHour, fmt, fmtDate, pct, uid, weekStart } from '../utils'
import { Kpi, Modal, Segmented } from '../components/ui'

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const ROW = 44 // px par heure dans l'agenda
const F_CLS: Record<Formula, string> = { Standard: 'bg-t1 text-t7 border-t7/30', 'Pré-montage': 'bg-b1 text-b7 border-b7/30', 'Clé en main': 'bg-accent text-ink border-ink/20' }
const DEL: Record<Deliverable, string> = { aucun: 'Rien à livrer', a_monter: 'À monter', livre: 'Livré' }

export default function AzurpodPage() {
  const { state, dispatch } = useStore()
  const [tab, setTab] = useState<'agenda' | 'sessions' | 'packs'>('agenda')
  const [week, setWeek] = useState(0)
  const [edit, setEdit] = useState<Booking | null>(null)
  const ws = weekStart(week)
  const days = DAYS.map((_, i) => { const d = new Date(ws); d.setDate(ws.getDate() + i); return d })
  const live = state.bookings.filter((b) => b.status !== 'annulee')
  const inWeek = live.filter((b) => new Date(b.start) >= ws && new Date(b.start) < new Date(ws.getTime() + 6 * 86400000))
  const capacity = DAYS.length * (STUDIO_HOURS.close - STUDIO_HOURS.open)
  const booked = inWeek.reduce((t, b) => t + b.hours, 0)
  const month = new Date().toISOString().slice(0, 7)
  const revenue = live.filter((b) => b.start.slice(0, 7) === month).reduce((t, b) => t + b.amountHT, 0)
  const toEdit = live.filter((b) => b.deliverable === 'a_monter').length
  const client = (id: string) => state.clients.find((c) => c.id === id)?.name ?? '—'
  const newBooking = (start: string): Booking => ({ id: uid(), clientId: state.clients[0]!.id, title: '', start, hours: 1, formula: 'Standard', status: 'confirmee', deliverable: 'aucun', amountHT: 150 })

  return (
    <div className="px-10 py-8">
      <div className="flex items-center justify-between">
        <div><h1 className="h-page">Azurpod</h1><div className="mt-1 text-ink2">Studio podcast · réservations, sessions et packs d’heures</div></div>
        {state.me !== 'X' && <button className="btn-primary" onClick={() => setEdit(newBooking(atHour(new Date(Date.now() + 86400000), 10)))}><Plus size={18} weight="bold" />Nouvelle session</button>}
      </div>
      <div className="mt-6 grid grid-cols-4 gap-4">
        <Kpi label="Occupation de la semaine" value={`${pct(booked, capacity)} %`} hint={`${booked} h réservées sur ${capacity} h`} />
        {state.me === 'X'
          ? <Kpi label="Heures studio du mois" value={`${live.filter((b) => b.start.slice(0, 7) === month).reduce((t, b) => t + b.hours, 0)} h`} hint="sessions confirmées" />
          : <Kpi label="CA Azurpod du mois" value={fmt(revenue)} hint="sessions hors packs, HT" />}
        <Kpi label="Sessions à venir" value={live.filter((b) => new Date(b.start) > new Date()).length} hint="toutes semaines" />
        <Kpi label="Livrables à monter" value={toEdit} hint="sessions Pré-montage / Clé en main" hintClass={toEdit ? 'text-o7' : 'text-ink2'} />
      </div>
      <div className="mt-6 flex items-center gap-3">
        <Segmented value={tab} onChange={setTab} options={[{ id: 'agenda', label: 'Agenda' }, { id: 'sessions', label: 'Sessions' }, { id: 'packs', label: 'Packs d’heures' }]} />
        {tab === 'agenda' && <>
          <span className="flex-1" />
          <button className="btn-secondary !px-2.5" onClick={() => setWeek(week - 1)}><CaretLeft size={16} /></button>
          <button className="btn-secondary" onClick={() => setWeek(0)}>Cette semaine</button>
          <button className="btn-secondary !px-2.5" onClick={() => setWeek(week + 1)}><CaretRight size={16} /></button>
          <span className="w-36 text-center font-semibold">{days[0]!.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – {days[5]!.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
        </>}
      </div>

      {tab === 'agenda' && (
        <div className="card mt-4 overflow-hidden">
          <div className="grid grid-cols-[56px_repeat(6,1fr)] border-b border-line bg-app/60">
            <div />
            {days.map((d, i) => <div key={i} className={`px-3 py-2.5 ${d.toDateString() === new Date().toDateString() ? 'bg-accent/40' : ''}`}><span className="tag">{DAYS[i]}</span> <span className="font-semibold">{d.getDate()}</span></div>)}
          </div>
          <div className="grid grid-cols-[56px_repeat(6,1fr)]">
            <div>{Array.from({ length: STUDIO_HOURS.close - STUDIO_HOURS.open }, (_, i) => <div key={i} className="border-b border-line pr-2 pt-1 text-right font-mono text-[11px] text-ink2" style={{ height: ROW }}>{STUDIO_HOURS.open + i}h</div>)}</div>
            {days.map((d, di) => (
              <div key={di} className="relative border-l border-line">
                {Array.from({ length: STUDIO_HOURS.close - STUDIO_HOURS.open }, (_, i) => (
                  <button key={i} title="Réserver ce créneau" onClick={() => state.me !== 'X' && setEdit(newBooking(atHour(d, STUDIO_HOURS.open + i)))} className="block w-full border-b border-line hover:bg-accent/15" style={{ height: ROW }} />
                ))}
                {inWeek.filter((b) => new Date(b.start).toDateString() === d.toDateString()).map((b) => {
                  const s = new Date(b.start); const top = (s.getHours() + s.getMinutes() / 60 - STUDIO_HOURS.open) * ROW
                  return (
                    <button key={b.id} onClick={() => setEdit(b)} className={`absolute inset-x-1 overflow-hidden rounded-lg border p-1.5 text-left text-[12px] leading-tight ${F_CLS[b.formula]} ${b.status === 'terminee' ? 'opacity-60' : ''}`} style={{ top: top + 2, height: b.hours * ROW - 4 }}>
                      <div className="font-semibold">{client(b.clientId)}</div>
                      <div className="truncate">{b.title}</div>
                      {b.hours >= 1.5 && <div className="mt-0.5 font-mono text-[10px] uppercase">{b.formula}{b.packId ? ' · pack' : ''}</div>}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
          <div className="flex gap-4 border-t border-line px-4 py-2.5 text-[12px] text-ink2">
            {(Object.keys(FORMULAS) as Formula[]).map((f) => <span key={f} className="flex items-center gap-1.5"><span className={`h-3 w-3 rounded border ${F_CLS[f]}`} />{f} · {FORMULAS[f].rate} €/h</span>)}
            <span className="ml-auto">Clique sur un créneau libre pour réserver.</span>
          </div>
        </div>
      )}

      {tab === 'sessions' && (
        <div className="card mt-4 overflow-hidden">
          <table className="w-full text-[14px]">
            <thead className="border-b border-line font-mono text-[11px] uppercase text-ink2"><tr>
              <th className="px-4 py-3 text-left font-normal">Date</th><th className="px-4 py-3 text-left font-normal">Client · session</th><th className="px-4 py-3 text-left font-normal">Formule</th>
              <th className="px-4 py-3 text-left font-normal">Livrable</th><th className="px-4 py-3 text-right font-normal">Montant HT</th>
            </tr></thead>
            <tbody>
              {[...state.bookings].sort((a, b) => b.start.localeCompare(a.start)).map((b) => (
                <tr key={b.id} onClick={() => setEdit(b)} className={`cursor-pointer border-b border-line last:border-0 hover:bg-hover/50 ${b.status === 'annulee' ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3"><div className="font-medium">{fmtDate(b.start, { weekday: 'short', day: 'numeric', month: 'short' })}</div><div className="text-[12px] text-ink2">{new Date(b.start).getHours()}h · {b.hours} h</div></td>
                  <td className="px-4 py-3"><div className="font-semibold">{client(b.clientId)}</div><div className="text-[12px] text-ink2">{b.title}</div></td>
                  <td className="px-4 py-3"><span className={`pill border ${F_CLS[b.formula]}`}>{b.formula}</span></td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <select className="field !w-auto !py-1" value={b.deliverable} onChange={(e) => dispatch({ type: 'upsert', coll: 'bookings', item: { ...b, deliverable: e.target.value as Deliverable } })}>
                      {(Object.keys(DEL) as Deliverable[]).map((k) => <option key={k} value={k}>{DEL[k]}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{b.status === 'annulee' ? 'Annulée' : b.packId ? <span className="text-ink2">Pack</span> : state.me === 'X' ? '—' : fmt(b.amountHT)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'packs' && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          {state.packs.map((p) => {
            const used = live.filter((b) => b.packId === p.id && new Date(b.start) < new Date()).reduce((t, b) => t + b.hours, 0)
            const planned = live.filter((b) => b.packId === p.id && new Date(b.start) >= new Date()).reduce((t, b) => t + b.hours, 0)
            const left = p.hoursTotal - used - planned
            return (
              <div key={p.id} className="card p-5">
                <div className="flex items-start"><div className="flex-1"><div className="text-[17px] font-semibold">{client(p.clientId)}</div><div className="text-ink2">{p.label}{state.me !== 'X' && <> · {fmt(p.priceHT)} HT</>} · valable jusqu’au {fmtDate(p.expiresAt, { day: 'numeric', month: 'short', year: 'numeric' })}</div></div>
                  {left <= 2 && <span className="pill bg-o1 text-o7"><Warning size={13} />Proposer un renouvellement</span>}</div>
                <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-app">
                  <div className="bg-t7" style={{ width: `${pct(used, p.hoursTotal)}%` }} /><div className="bg-t7/40" style={{ width: `${pct(planned, p.hoursTotal)}%` }} />
                </div>
                <div className="mt-2 flex gap-4 text-[13px] text-ink2"><span><b className="text-ink">{used} h</b> utilisées</span><span><b className="text-ink">{planned} h</b> réservées</span><span className="ml-auto"><b className="text-ink">{left} h</b> restantes</span></div>
              </div>
            )
          })}
        </div>
      )}
      {edit && <BookingModal booking={edit} onClose={() => setEdit(null)} />}
    </div>
  )
}

function BookingModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const [b, setB] = useState(booking)
  const exists = state.bookings.some((x) => x.id === b.id)
  const packs = state.packs.filter((p) => p.clientId === b.clientId)
  const start = new Date(b.start), end = new Date(start.getTime() + b.hours * 3600000)
  const conflict = state.bookings.find((x) => x.id !== b.id && x.status !== 'annulee' && new Date(x.start) < end && new Date(new Date(x.start).getTime() + x.hours * 3600000) > start)
  const outside = start.getHours() < STUDIO_HOURS.open || end.getHours() + end.getMinutes() / 60 > STUDIO_HOURS.close
  const amount = b.packId ? 0 : b.hours * FORMULAS[b.formula].rate
  const set = (patch: Partial<Booking>) => setB({ ...b, ...patch })
  const readOnly = state.me === 'X' // réservations client : gérées par Enzo et Allan
  return (
    <Modal title={exists ? 'Session' : 'Nouvelle session'} onClose={onClose}>
      {readOnly && <div className="mb-3 rounded-xl bg-hover p-3 text-[13px] text-ink2">Consultation seule : les réservations sont gérées par Enzo et Allan.</div>}
      <fieldset disabled={readOnly} className="space-y-3">
        <label className="block"><div className="tag mb-1.5">Client</div><select className="field" value={b.clientId} onChange={(e) => set({ clientId: e.target.value, packId: undefined })}>{state.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="block"><div className="tag mb-1.5">Titre de la session</div><input className="field" value={b.title} onChange={(e) => set({ title: e.target.value })} placeholder="Ex. Épisode 3 · invité" /></label>
        <div className="grid grid-cols-3 gap-3">
          <label><div className="tag mb-1.5">Jour</div><input type="date" className="field" value={b.start.slice(0, 10)} onChange={(e) => { const d = new Date(e.target.value + 'T00:00:00'); d.setHours(start.getHours(), start.getMinutes()); set({ start: d.toISOString() }) }} /></label>
          <label><div className="tag mb-1.5">Heure</div><select className="field" value={start.getHours() + start.getMinutes() / 60} onChange={(e) => set({ start: atHour(start, Number(e.target.value)) })}>{Array.from({ length: 20 }, (_, i) => STUDIO_HOURS.open + i / 2).map((h) => <option key={h} value={h}>{Math.floor(h)}h{h % 1 ? '30' : ''}</option>)}</select></label>
          <label><div className="tag mb-1.5">Durée</div><select className="field" value={b.hours} onChange={(e) => set({ hours: Number(e.target.value) })}>{[1, 1.5, 2, 2.5, 3, 4].map((h) => <option key={h} value={h}>{h} h</option>)}</select></label>
        </div>
        <div className="tag">Formule</div>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(FORMULAS) as Formula[]).map((f) => (
            <button key={f} onClick={() => set({ formula: f, deliverable: f === 'Standard' ? 'aucun' : b.deliverable === 'aucun' ? 'a_monter' : b.deliverable })}
              className={`rounded-xl border p-3 text-left ${b.formula === f ? 'border-ink bg-accent/30' : 'border-line hover:bg-hover'}`}>
              <div className="font-semibold">{f}</div><div className="text-[12px] text-ink2">{!readOnly && `${FORMULAS[f].rate} €/h · `}{FORMULAS[f].desc}</div>
            </button>
          ))}
        </div>
        {packs.length > 0 && <label className="block"><div className="tag mb-1.5">Paiement</div><select className="field" value={b.packId ?? ''} onChange={(e) => set({ packId: e.target.value || undefined })}><option value="">Facturer la session</option>{packs.map((p) => <option key={p.id} value={p.id}>Décompter du {p.label}</option>)}</select></label>}
        {conflict && <div className="flex items-center gap-2 rounded-xl bg-r1 p-3 text-[13px] text-r7"><Warning size={16} />Le studio est déjà réservé à ce moment ({state.clients.find((c) => c.id === conflict.clientId)?.name}).</div>}
        {outside && <div className="flex items-center gap-2 rounded-xl bg-o1 p-3 text-[13px] text-o7"><Warning size={16} />Hors des horaires du studio ({STUDIO_HOURS.open}h–{STUDIO_HOURS.close}h).</div>}
      </fieldset>
      <div className="mt-5 flex items-center gap-2">
        {!readOnly && exists && b.status !== 'annulee' && <button className="btn-ghost text-r7" onClick={() => { dispatch({ type: 'upsert', coll: 'bookings', item: { ...b, status: 'annulee' } }); onClose() }}>Annuler la session</button>}
        <span className="flex-1 text-right font-semibold">{readOnly ? '' : b.packId ? 'Décomptée du pack' : `${fmt(amount)} HT`}</span>
        <button className="btn-secondary" onClick={onClose}>Fermer</button>
        {!readOnly && <button className="btn-primary" disabled={!!conflict || outside} onClick={() => { dispatch({ type: 'upsert', coll: 'bookings', item: { ...b, title: b.title || 'Session podcast', amountHT: amount } }); onClose() }}>{exists ? 'Enregistrer' : 'Réserver'}</button>}
      </div>
    </Modal>
  )
}
