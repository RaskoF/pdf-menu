import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, DownloadSimple, PaperPlaneTilt, Plus, Trash, DotsSixVertical, Gift, CheckCircle, X, Copy } from '@phosphor-icons/react'
import { useStore } from '../store'
import type { Activity, Devis, Line, Owner, Schedule, Stage } from '../types'
import { CATALOGUE } from '../data'
import { STAGES, TVA, fmt, fmt2, fmtDate, grossHT, lineTotal, scheduleParts, totalHT, uid } from '../utils'
import { Segmented, Toggle } from '../components/ui'

const FLOW: Stage[] = ['brouillon', 'envoye', 'ouvert', 'signe']

export default function DevisEditor() {
  const { id } = useParams()
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const d = state.devis.find((x) => x.id === id)
  const [tab, setTab] = useState<'reglages' | 'suivi'>('reglages')
  const [picker, setPicker] = useState(false)
  const [toast, setToast] = useState('')
  const [relances, setRelances] = useState({ j3: true, j7: true, open: true })
  if (!d) return <div className="p-10">Devis introuvable. <Link className="underline" to="/devis">Retour aux devis</Link></div>
  const client = state.clients.find((c) => c.id === d.clientId)

  const save = (patch: Partial<Devis>) => dispatch({ type: 'upsertDevis', devis: { ...d, ...patch } })
  const setLine = (lid: string, patch: Partial<Line>) => save({ lines: d.lines.map((l) => (l.id === lid ? { ...l, ...patch } : l)) })
  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(''), 2200) }
  const move = (stage: Stage) => dispatch({ type: 'moveDevis', id: d.id, stage })

  const ht = totalHT(d), tva = ht * TVA, ttc = ht + tva, saved = grossHT(d) - ht
  const missing = [
    !d.lines.length && 'au moins une prestation',
    !d.intro.trim() && 'le texte « Le projet »',
    !client?.contact.email && 'l’e-mail du client',
  ].filter(Boolean) as string[]
  const ready = 3 - missing.length

  const send = () => {
    if (missing.length) return flash(`Il manque ${missing.join(', ')}`)
    move('envoye')
    try { navigator.clipboard?.writeText(`${location.origin}${location.pathname}#/devis/${d.id}/client`) } catch { /* ignoré */ }
    flash('Lien envoyé au client et copié dans le presse-papier')
  }

  return (
    <div className="flex h-full flex-col">
      {/* Barre du haut */}
      <div className="flex items-center gap-4 border-b border-line bg-surface px-6 py-3">
        <button onClick={() => nav('/devis')} className="rounded-xl border border-line p-2 hover:bg-hover"><ArrowLeft size={18} /></button>
        <div className="min-w-0 leading-tight">
          <div className="truncate font-semibold">{client?.name}</div>
          <div className="tag">{d.number || 'Prospect'} · enregistré automatiquement</div>
        </div>
        <div className="mx-auto flex items-center gap-1">
          {d.stage === 'a_chiffrer' || d.stage === 'refuse'
            ? <span className={`pill ${d.stage === 'refuse' ? 'bg-r1 text-r7' : 'bg-hover'}`}>{STAGES.find((s) => s.id === d.stage)!.label}</span>
            : FLOW.map((s, i) => {
              const idx = FLOW.indexOf(d.stage)
              return (
                <div key={s} className="flex items-center gap-1.5">
                  {i > 0 && <span className="h-px w-3 bg-line2" />}
                  <button onClick={() => move(s)} title="Changer l’étape"
                    className={`pill ${i === idx ? 'bg-accent text-ink' : i < idx ? 'bg-g1 text-g7' : 'bg-hover text-ink2'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${i <= idx ? 'bg-ink' : 'bg-ink2/50'}`} />{STAGES.find((x) => x.id === s)!.label}
                  </button>
                </div>
              )
            })}
        </div>
        <Link to={`/devis/${d.id}/client`} className="btn-ghost"><Eye size={18} />Aperçu client</Link>
        <button className="btn-secondary" onClick={() => window.print()}><DownloadSimple size={18} />PDF</button>
        {d.stage === 'a_chiffrer'
          ? <button className="btn-primary" onClick={() => move('brouillon')}>Chiffrer ce prospect</button>
          : <button className="btn-primary" onClick={send}><PaperPlaneTilt size={18} />Envoyer le lien</button>}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Document */}
        <div className="flex-1 overflow-y-auto px-10 py-8">
          <div className="mx-auto max-w-[760px] overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="bg-side px-8 py-7 text-ondark">
              <div className="tag !text-ondarkm">Préparée pour {client?.name} · {fmtDate(d.createdAt, { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
              <input value={d.title} onChange={(e) => save({ title: e.target.value })}
                className="mt-2 w-full bg-transparent font-title text-[40px] font-semibold uppercase leading-none" />
              <div className="mt-5 grid h-40 place-items-center rounded-xl bg-gradient-to-br from-[#4a4636] to-[#1d1c12] text-[13px] text-ondarkm">
                Image de couverture · choisir dans la médiathèque du site
              </div>
            </div>

            <section className="border-b border-line px-8 py-7">
              <div className="h-sec">Le projet</div>
              <textarea value={d.intro} onChange={(e) => save({ intro: e.target.value })} rows={3}
                placeholder="En deux phrases : ce que le client veut obtenir, et comment on va l’y aider."
                className="mt-3 w-full resize-none rounded-xl border border-transparent bg-transparent p-0 leading-relaxed hover:border-line focus:border-line focus:p-2" />
            </section>

            <section className="border-b border-line px-8 py-7">
              <div className="flex items-center">
                <div className="h-sec flex-1">Prestations</div>
                <button className="btn-ghost !py-1.5" onClick={() => setPicker(true)}><Plus size={16} />Ajouter depuis le Catalogue</button>
              </div>
              <table className="mt-4 w-full">
                <thead><tr className="border-b border-line font-mono text-[11px] uppercase text-ink2">
                  <th className="w-6" /><th className="py-2 text-left font-normal">Prestation</th><th className="w-14 text-center font-normal">Qté</th>
                  <th className="w-24 text-right font-normal">Prix</th><th className="w-24 text-right font-normal">Remise</th>
                  <th className="w-24 text-right font-normal">Total HT</th><th className="w-16" />
                </tr></thead>
                <tbody>
                  {d.lines.map((l) => (
                    <tr key={l.id} className="group border-b border-line align-top">
                      <td className="pt-4 text-line2"><DotsSixVertical size={14} /></td>
                      <td className="py-3 pr-3">
                        <input value={l.label} onChange={(e) => setLine(l.id, { label: e.target.value })} className="w-full bg-transparent font-semibold" />
                        <input value={l.desc} onChange={(e) => setLine(l.id, { desc: e.target.value })} className="w-full bg-transparent text-[13px] text-ink2" />
                      </td>
                      <td className="py-3"><input type="number" min={1} value={l.qty} onChange={(e) => setLine(l.id, { qty: Math.max(1, Number(e.target.value)) })} className="w-full rounded-lg bg-transparent text-center hover:bg-hover" /></td>
                      <td className="py-3"><input type="number" min={0} value={l.unitPrice} onChange={(e) => setLine(l.id, { unitPrice: Number(e.target.value) })} className="w-full rounded-lg bg-transparent text-right hover:bg-hover" /></td>
                      <td className="py-3 text-right">
                        {l.offered ? <span className="pill bg-g1 text-g7">Offert</span>
                          : <input type="number" min={0} value={l.discount || ''} placeholder="—" onChange={(e) => setLine(l.id, { discount: Number(e.target.value) })} className="w-full rounded-lg bg-transparent text-right text-g7 hover:bg-hover" />}
                      </td>
                      <td className="py-3 text-right font-semibold">{fmt(lineTotal(l))}</td>
                      <td className="py-3 text-right opacity-0 group-hover:opacity-100">
                        <button title={l.offered ? 'Ne plus offrir' : 'Offrir cette ligne'} onClick={() => setLine(l.id, { offered: !l.offered })} className="rounded p-1 hover:bg-hover"><Gift size={15} /></button>
                        <button title="Supprimer" onClick={() => save({ lines: d.lines.filter((x) => x.id !== l.id) })} className="rounded p-1 hover:bg-hover"><Trash size={15} /></button>
                      </td>
                    </tr>
                  ))}
                  {!d.lines.length && <tr><td colSpan={7} className="py-8 text-center text-ink2">Aucune prestation. Ajoute-en depuis le Catalogue.</td></tr>}
                </tbody>
              </table>
              <button onClick={() => save({ lines: [...d.lines, { id: uid(), label: 'Prestation libre', desc: 'Description', qty: 1, unitPrice: 0, discount: 0, offered: false }] })}
                className="mt-2 flex items-center gap-1.5 text-[13px] text-ink2 hover:text-ink"><Plus size={13} />Ligne libre</button>
              <div className="mt-5 ml-auto w-72 rounded-xl bg-app px-4 py-3 text-[14px]">
                {saved > 0 && <Row l="Économie client" r={`− ${fmt2(saved)}`} cls="text-g7" />}
                <Row l="Total HT" r={fmt2(ht)} /><Row l="TVA 20 %" r={fmt2(tva)} />
                <Row l="Total TTC" r={fmt2(ttc)} cls="mt-1 font-semibold text-[15px]" />
              </div>
            </section>

            <section className="px-8 py-6">
              <div className="flex items-center justify-between">
                <div><span className="font-semibold">Échéancier</span> <span className="ml-2 text-[13px] text-ink2">{scheduleParts(d.schedule).map((p) => `${p.pct} % ${p.label.toLowerCase()} (${fmt(ht * p.pct / 100)})`).join(' · ')}</span></div>
              </div>
            </section>
          </div>
        </div>

        {/* Panneau de droite */}
        <aside className="w-[320px] shrink-0 overflow-y-auto border-l border-line bg-surface p-5">
          <Segmented value={tab} onChange={setTab} options={[{ id: 'reglages', label: 'Réglages' }, { id: 'suivi', label: 'Suivi' }]} />
          {tab === 'reglages' ? (
            <div className="mt-5 space-y-4">
              <Field label="Client">
                <select className="field" value={d.clientId} onChange={(e) => save({ clientId: e.target.value })}>
                  {state.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {client && <div className="mt-1.5 text-[12px] text-ink2">{client.contact.name} · {client.contact.role} · {client.contact.email}</div>}
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Responsable">
                  <select className="field" value={d.owner} onChange={(e) => save({ owner: e.target.value as Owner })}><option value="E">Enzo</option><option value="A">Allan</option></select>
                </Field>
                <Field label="Activité">
                  <select className="field" value={d.activity} onChange={(e) => save({ activity: e.target.value as Activity })}><option>Studio</option><option>Azurpod</option><option>Academy</option></select>
                </Field>
                <Field label="Validité">
                  <select className="field" value={d.validityDays} onChange={(e) => save({ validityDays: Number(e.target.value) })}>{[15, 30, 45, 60].map((n) => <option key={n} value={n}>{n} jours</option>)}</select>
                </Field>
                <Field label="Échéancier">
                  <select className="field" value={d.schedule} onChange={(e) => save({ schedule: e.target.value as Schedule })}><option value="40/30/30">40 / 30 / 30</option><option value="50/50">50 / 50</option><option value="100">100 % signature</option></select>
                </Field>
              </div>
              <div>
                <div className="tag mb-2">Relances et alertes</div>
                <ToggleRow label="Relance auto J+3 si non ouvert" on={relances.j3} set={(v) => setRelances({ ...relances, j3: v })} />
                <ToggleRow label="Relance auto J+7 si non signé" on={relances.j7} set={(v) => setRelances({ ...relances, j7: v })} />
                <ToggleRow label="Me prévenir à chaque ouverture" on={relances.open} set={(v) => setRelances({ ...relances, open: v })} />
              </div>
              <div className="rounded-xl border border-line bg-app p-3.5">
                <div className="flex items-center justify-between font-semibold">Prêt à envoyer <span className="font-mono text-[11px] text-ink2">{ready} / 3</span></div>
                <div className="mt-1 text-[13px] text-ink2">{missing.length ? `Il manque ${missing.join(', ')}.` : 'Tout est prêt.'}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary flex-1 justify-center !px-2 text-[13px]" onClick={() => {
                  const copy = { ...structuredClone(d), id: uid(), number: '', stage: 'brouillon' as Stage, createdAt: new Date().toISOString(), sentAt: undefined, signedAt: undefined, openedCount: 0 }
                  dispatch({ type: 'upsertDevis', devis: copy }); dispatch({ type: 'moveDevis', id: copy.id, stage: 'brouillon' }); nav(`/devis/${copy.id}`)
                }}><Copy size={15} />Dupliquer</button>
                <button className="btn-secondary flex-1 justify-center !px-2 text-[13px] text-r7" onClick={() => move('refuse')}><X size={15} />Refusé</button>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-3 text-[14px]">
              <Event on={!!d.createdAt} label="Créé" date={d.createdAt} />
              <Event on={!!d.sentAt} label="Envoyé au client" date={d.sentAt} />
              <Event on={d.openedCount > 0} label={`Ouvert ${d.openedCount} fois`} date={d.lastOpenedAt} />
              <Event on={!!d.signedAt} label="Signé · projet créé" date={d.signedAt} />
              {d.stage === 'signe' && <div className="flex items-center gap-2 rounded-xl bg-g1 p-3 text-g7"><CheckCircle size={18} />Facture d’acompte prête dans Finance</div>}
            </div>
          )}
        </aside>
      </div>

      {picker && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-ink/40" onClick={() => setPicker(false)}>
          <div className="card max-h-[80vh] w-[560px] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center"><div className="h-sec flex-1">Catalogue</div><button onClick={() => setPicker(false)}><X size={18} /></button></div>
            {(['Studio', 'Azurpod', 'Academy'] as const).map((a) => (
              <div key={a} className="mt-4">
                <div className="tag mb-2">{a}</div>
                {CATALOGUE.filter((c) => c.activity === a).map((c) => (
                  <button key={c.id} onClick={() => { save({ lines: [...d.lines, { id: uid(), label: c.label, desc: c.desc, qty: 1, unitPrice: c.price, discount: 0, offered: false }] }); setPicker(false) }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-hover">
                    <div className="flex-1"><div className="font-semibold">{c.label}</div><div className="text-[13px] text-ink2">{c.desc}</div></div>
                    <div className="font-semibold">{fmt(c.price)}</div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      {toast && <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-xl bg-ink px-4 py-3 text-ondark shadow-lg">{toast}</div>}
    </div>
  )
}

const Row = ({ l, r, cls = '' }: { l: string; r: string; cls?: string }) => <div className={`flex justify-between py-0.5 ${cls}`}><span className="text-ink2">{l}</span><span>{r}</span></div>
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block"><div className="tag mb-1.5">{label}</div>{children}</label>
const ToggleRow = ({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) => <div className="flex items-center justify-between py-1.5 text-[13px]">{label}<Toggle on={on} onChange={set} /></div>
const Event = ({ on, label, date }: { on: boolean; label: string; date?: string }) => (
  <div className={`flex items-center gap-3 ${on ? '' : 'opacity-40'}`}>
    <span className={`h-2.5 w-2.5 rounded-full ${on ? 'bg-ink' : 'border border-ink2'}`} />
    <span className="flex-1">{label}</span><span className="font-mono text-[11px] text-ink2">{on ? fmtDate(date) : '—'}</span>
  </div>
)
