import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, PencilSimple, Gift, ArrowSquareOut } from '@phosphor-icons/react'
import { useStore, nextNumber } from '../store'
import type { Devis, Referral } from '../types'
import { fmt, fmtDate, initials, totalHT, uid } from '../utils'
import { Avatar, Kpi, StagePill } from '../components/ui'
import { REF_STATUS, rewardOf } from '../components/referral'

export default function ClientDetail() {
  const { id } = useParams()
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const c = state.clients.find((x) => x.id === id)
  const [note, setNote] = useState('')
  if (!c) return <div className="p-10">Client introuvable. <Link className="underline" to="/clients">Retour</Link></div>

  const ds = state.devis.filter((d) => d.clientId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const signed = ds.filter((d) => d.stage === 'signe')
  const ca = signed.reduce((s, d) => s + totalHT(d), 0)
  // acompte encaissé = 1re échéance de chaque devis signé
  const cashed = signed.reduce((s, d) => s + totalHT(d) * (d.schedule === '100' ? 1 : d.schedule === '50/50' ? 0.5 : 0.4), 0)
  const open = ds.filter((d) => ['brouillon', 'envoye', 'ouvert'].includes(d.stage))
  const history = ds.flatMap((d) => [
    { at: d.createdAt, t: `${d.number ? 'Devis créé' : 'Prospect ajouté'} · ${d.title}` },
    ...(d.sentAt ? [{ at: d.sentAt, t: `Devis ${d.number} envoyé` }] : []),
    ...(d.lastOpenedAt ? [{ at: d.lastOpenedAt, t: `Devis ouvert (${d.openedCount} fois)` }] : []),
    ...(d.signedAt ? [{ at: d.signedAt, t: `Devis signé · ${fmt(totalHT(d))} HT` }] : []),
  ]).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8)

  const refs = state.referrals.filter((r) => r.referrerId === c.id)
  const referredBy = state.referrals.find((r) => r.company === c.name)
  const updRef = (r: Referral, patch: Partial<Referral>) => dispatch({ type: 'upsert', coll: 'referrals', item: { ...r, ...patch } })

  const newDevis = () => {
    const d: Devis = { id: uid(), number: nextNumber(state.devis), clientId: c.id, title: 'Nouveau devis', intro: '', owner: 'E', activity: 'Studio', stage: 'brouillon', lines: [], validityDays: 30, schedule: '40/30/30', createdAt: new Date().toISOString(), openedCount: 0 }
    dispatch({ type: 'upsertDevis', devis: d }); nav(`/devis/${d.id}`)
  }
  const addNote = () => { if (!note.trim()) return; dispatch({ type: 'upsertClient', client: { ...c, notes: [...c.notes, note.trim()] } }); setNote('') }

  return (
    <div className="px-10 py-8">
      <Link to="/clients" className="tag flex items-center gap-1 hover:text-ink"><ArrowLeft size={12} />Clients</Link>
      <div className="mt-2 flex items-end gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="h-page">{c.name}</h1>
            <span className="pill bg-o1 text-o7">{c.sector}</span>
            {signed.length ? <span className="pill bg-g1 text-g7">Client actif</span> : <span className="pill bg-hover text-ink2">Prospect</span>}
          </div>
          <div className="mt-2 text-ink2">{c.contact.name} · {c.contact.phone} · {c.address}</div>
        </div>
        <Link to={`/portail/${c.id}`} className="btn-secondary"><ArrowSquareOut size={18} />Espace client</Link>
        <button className="btn-secondary"><PencilSimple size={18} />Modifier</button>
        <button className="btn-primary" onClick={newDevis}><Plus size={18} weight="bold" />Nouveau devis</button>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <Kpi label="CA signé" value={fmt(ca)} hint={`HT · client depuis ${fmtDate(c.createdAt, { month: 'short', year: 'numeric' })}`} />
        <Kpi label="Encaissé (acomptes)" value={fmt(cashed)} hint="1re échéance des devis signés" />
        <Kpi label="En négociation" value={fmt(open.reduce((s, d) => s + totalHT(d), 0))} hint={`${open.length} devis ouverts`} />
        <Kpi label="Devis" value={ds.length} hint={`${signed.length} signé${signed.length > 1 ? 's' : ''}`} />
      </div>

      <div className="mt-5 grid grid-cols-[1fr_420px] items-start gap-5">
        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex items-center"><div className="h-sec flex-1">Devis · {ds.length}</div><button className="font-semibold" onClick={newDevis}>+ Nouveau devis</button></div>
            <div className="mt-3 divide-y divide-line border-t border-line">
              {ds.map((d) => (
                <button key={d.id} onClick={() => nav(`/devis/${d.id}`)} className="flex w-full items-center gap-4 py-3 text-left hover:bg-hover/40">
                  <span className="w-28 font-mono text-[12px] text-ink2">{d.number || 'LEAD'}</span>
                  <span className="flex-1">{d.title}</span>
                  <span className="font-semibold">{totalHT(d) ? fmt(totalHT(d)) : '—'}</span>
                  <StagePill stage={d.stage} />
                </button>
              ))}
              {!ds.length && <div className="py-6 text-center text-ink2">Aucun devis pour ce client.</div>}
            </div>
          </div>
          <div className="card p-5">
            <div className="h-sec">Contacts · 1</div>
            <div className="mt-3 flex items-center gap-3 border-t border-line pt-3">
              <Avatar text={initials(c.contact.name || c.name)} tone="neutral" size={36} />
              <div className="flex-1 leading-tight"><div className="font-semibold">{c.contact.name}</div><div className="text-[13px] text-ink2">{c.contact.role} · {c.contact.phone} · {c.contact.email}</div></div>
              <span className="pill bg-hover">Principal</span>
            </div>
          </div>
        </div>
        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex items-center gap-2"><Gift size={18} /><div className="h-sec flex-1">Parrainage · {refs.length}</div>{referredBy && <span className="pill bg-y1 text-ink">Filleul</span>}</div>
            <div className="mt-3 divide-y divide-line border-t border-line">
              {refs.map((r) => (
                <div key={r.id} className="py-3">
                  <div className="flex items-center gap-2"><span className="flex-1 font-semibold">{r.company}</span><span className="text-[12px] text-ink2">{r.name}</span>{(r.status === 'signe' || r.status === 'perdu') && <span className={`pill ${REF_STATUS[r.status].cls}`}>{REF_STATUS[r.status].label}</span>}</div>
                  <div className="mt-1 flex items-center gap-2 text-[13px] text-ink2">
                    <span className="flex-1">{r.reward === 'credit' ? '10 % crédit' : '5 % commission'}{r.status === 'signe' && <> · <b className="text-ink">{fmt(rewardOf(r))}</b> sur {fmt(r.amountHT)} HT</>}</span>
                    {r.status !== 'signe' && <select className="field !w-auto !py-0.5 text-[12px]" value={r.status} onChange={(e) => updRef(r, { status: e.target.value as Referral['status'] })}>
                      {Object.entries(REF_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>}
                    {r.status === 'signe' && !r.settled && <button className="font-semibold text-ink" onClick={() => updRef(r, { settled: true })}>{r.reward === 'credit' ? 'Crédit utilisé' : 'Marquer versée'}</button>}
                    {r.settled && <span className="pill bg-g1 text-g7">Réglé</span>}
                  </div>
                  {r.status !== 'signe' && r.status !== 'perdu' && <div className="mt-2 flex gap-2"><input className="field !py-1 text-[13px]" type="number" placeholder="Devis signé ? Montant HT puis Entrée" onKeyDown={(e) => { const v = Number((e.target as HTMLInputElement).value); if (e.key === 'Enter' && v > 0) updRef(r, { status: 'signe', amountHT: v }) }} /></div>}
                </div>
              ))}
              {!refs.length && <div className="py-4 text-center text-[13px] text-ink2">Aucun filleul pour l’instant.</div>}
            </div>
          </div>
          <div className="card p-5">
            <div className="h-sec">Historique</div>
            <div className="mt-4 space-y-4">
              {history.map((h, i) => (
                <div key={i} className="flex gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${i === 0 ? 'bg-accent ring-2 ring-ink' : 'bg-ink2'}`} />
                  <div><div className="tag">{fmtDate(h.at)}</div><div className="font-medium">{h.t}</div></div>
                </div>
              ))}
              {!history.length && <div className="text-ink2">Rien pour l’instant.</div>}
            </div>
          </div>
          <div className="card p-5">
            <div className="h-sec">Notes</div>
            <div className="mt-3 space-y-2 text-ink2">{c.notes.map((n, i) => <div key={i}>— {n}</div>)}</div>
            <div className="mt-3 flex gap-2">
              <input className="field" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addNote()} placeholder="Ajouter une note…" />
              <button className="btn-secondary !px-3" onClick={addNote}><Plus size={16} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
