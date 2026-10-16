import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, CheckCircle, DownloadSimple, PlayCircle, WhatsappLogo } from '@phosphor-icons/react'
import { useStore } from '../store'
import { TVA, fmt, fmtDate, grossHT, lineTotal, scheduleParts, totalHT } from '../utils'
import { Avatar } from '../components/ui'

const REFS = [
  { t: 'Boulangerie Maison Rivière', s: 'Commerce · vidéo + photos', g: 'from-[#6b2a1d] to-[#1e0d08]' },
  { t: 'Hôtel Les Pins', s: 'Hôtellerie · film de marque', g: 'from-[#3b4250] to-[#14161b]' },
  { t: 'Domaine Saint-Clair', s: 'Vin · contenus mensuels', g: 'from-[#6a4a2a] to-[#21160c]' },
]
const STEPS = [['Semaine 1', 'Cadrage', 'Appel, script, liste des plans'], ['Semaine 2', 'Tournage', 'Vidéo et shooting le même jour'], ['Semaine 3', 'Montage', 'V1, vos retours, livraison'], ['Ensuite', 'Diffusion', 'Mise en ligne et bilan chiffré']]

// Ce que voit le client quand il ouvre le lien du devis.
export default function DevisClientView() {
  const { id } = useParams()
  const { state, dispatch } = useStore()
  const d = state.devis.find((x) => x.id === id)
  const [confirm, setConfirm] = useState(false)
  const [name, setName] = useState('')
  if (!d) return <div className="p-10">Devis introuvable.</div>
  const client = state.clients.find((c) => c.id === d.clientId)!
  const ht = totalHT(d), ttc = ht * (1 + TVA), saved = grossHT(d) - ht
  const until = new Date(new Date(d.sentAt ?? d.createdAt).getTime() + d.validityDays * 86400000).toISOString()
  const signed = d.stage === 'signe'
  const sign = () => { dispatch({ type: 'moveDevis', id: d.id, stage: 'signe' }); setConfirm(false) }

  return (
    <div className="min-h-full bg-app">
      <div className="bg-side text-ondark">
        <div className="flex items-center gap-4 px-12 py-4">
          <Link to={`/devis/${d.id}`} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[12px] text-ondarkm hover:text-ondark"><ArrowLeft size={13} />Retour à l’éditeur (vue interne)</Link>
          <span className="font-title text-[22px] font-semibold uppercase">Uplye Studio</span>
          <span className="mx-auto font-mono text-[11px] uppercase text-ondarkm">Devis {d.number} · valable jusqu’au {fmtDate(until, { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
          <button className="flex items-center gap-1.5 rounded-xl border border-white/20 px-3 py-2 text-[14px]" onClick={() => window.print()}><DownloadSimple size={16} />PDF</button>
          {!signed && <button className="btn-primary !py-2" onClick={() => setConfirm(true)}><Check size={16} weight="bold" />Bon pour accord</button>}
        </div>
        <div className="flex items-center gap-12 px-[120px] pb-16 pt-10">
          <div className="flex-1">
            <div className="font-mono text-[11px] uppercase text-ondarkm">Préparée pour {client.name} · par {d.owner === 'E' ? 'Enzo' : 'Allan'}</div>
            <h1 className="mt-4 font-title text-[64px] font-semibold uppercase leading-[0.95]">{d.title}</h1>
            <div className="mt-8 flex gap-10">
              {[['20+', 'clients accompagnés en 2026'], ['x20', 'retour sur la pub au lancement d’Azurpod'], ['3 sem.', 'du brief à la livraison']].map(([n, l]) => (
                <div key={n}><div className="font-title text-[36px] font-semibold leading-none">{n}</div><div className="mt-1 w-40 text-[13px] text-ondarkm">{l}</div></div>
              ))}
            </div>
          </div>
          <div className="grid h-[260px] w-[440px] place-items-center rounded-2xl bg-gradient-to-br from-[#5a5642] to-[#23221a]">
            <div className="text-center"><PlayCircle size={56} weight="fill" className="mx-auto text-accent" /><div className="mt-2 text-[13px]">Le mot d’{d.owner === 'E' ? 'Enzo' : 'Allan'} · 45 s</div></div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1200px] items-start gap-12 px-[60px] py-14">
        <div className="flex-1 space-y-12">
          <section><h2 className="h-page !text-[40px]">Votre projet</h2><p className="mt-3 leading-relaxed text-ink2">{d.intro || '—'}</p></section>
          <section>
            <h2 className="h-page !text-[40px]">Ce qui est inclus</h2>
            <div className="card mt-4 divide-y divide-line">
              {d.lines.map((l) => (
                <div key={l.id} className="flex items-center gap-4 px-5 py-4">
                  <CheckCircle size={20} className="text-g7" />
                  <div className="flex-1"><div className="font-semibold">{l.label}{l.qty > 1 ? ` × ${l.qty}` : ''}</div><div className="text-[13px] text-ink2">{l.desc}</div></div>
                  {(l.discount > 0 || l.offered) && <span className="text-[13px] text-ink2 line-through">{fmt(l.qty * l.unitPrice)}</span>}
                  {l.offered ? <span className="pill bg-g1 text-g7">Offert</span> : <span className="font-semibold">{fmt(lineTotal(l))} HT</span>}
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="h-page !text-[40px]">Comment ça se passe</h2>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {STEPS.map(([w, t, s]) => <div key={t} className="card p-4"><span className="rounded-md bg-accent px-2 py-0.5 font-mono text-[11px] uppercase">{w}</span><div className="mt-2 font-semibold">{t}</div><div className="mt-1 text-[13px] text-ink2">{s}</div></div>)}
            </div>
          </section>
          <section>
            <h2 className="h-page !text-[40px]">Ils nous ont fait confiance</h2>
            <div className="mt-4 grid grid-cols-3 gap-4">
              {REFS.map((r) => <div key={r.t}><div className={`grid h-40 place-items-center rounded-2xl bg-gradient-to-br ${r.g}`}><PlayCircle size={40} weight="fill" className="text-accent" /></div><div className="mt-2 font-semibold">{r.t}</div><div className="text-[13px] text-ink2">{r.s}</div></div>)}
            </div>
          </section>
        </div>

        <aside className="sticky top-6 w-[360px] shrink-0">
          <div className="card p-7">
            <div className="tag">Votre investissement</div>
            <div className="mt-3 font-title text-[44px] font-semibold leading-none">{fmt(ttc)} TTC</div>
            <div className="mt-2 text-[13px] text-g7">{fmt(ht)} HT{saved > 0 ? ` · dont ${fmt(saved)} d’économie sur l’offre` : ''}</div>
            <div className="mt-5 space-y-2 rounded-xl bg-app p-4">
              {scheduleParts(d.schedule).map((p) => (
                <div key={p.label} className="flex items-center gap-3 text-[14px]"><span className="w-10 font-semibold">{p.pct} %</span><span className="flex-1 text-ink2">{p.label}</span><span>{fmt(ht * p.pct / 100)} HT</span></div>
              ))}
            </div>
            {signed
              ? <div className="mt-5 flex items-center gap-2 rounded-xl bg-g1 p-4 font-semibold text-g7"><CheckCircle size={20} weight="fill" />Devis signé le {fmtDate(d.signedAt)}</div>
              : <button className="btn-primary mt-5 w-full justify-center !py-3.5" onClick={() => setConfirm(true)}><Check size={18} weight="bold" />Bon pour accord</button>}
            <p className="mt-3 text-[12px] text-ink2">Signature en ligne horodatée. Facture d’acompte envoyée aussitôt.</p>
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-line p-3.5">
              <Avatar text={d.owner} size={32} />
              <div className="flex-1 leading-tight"><div className="font-semibold">Une question ? {d.owner === 'E' ? 'Enzo' : 'Allan'}</div><div className="text-[12px] text-ink2">Réponse en moins de 24 h</div></div>
              <WhatsappLogo size={22} />
            </div>
          </div>
        </aside>
      </div>
      <div className="bg-side px-[120px] py-6 font-mono text-[11px] uppercase text-ondarkm">Uplye SAS · démonstration — données fictives</div>

      {confirm && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-ink/50" onClick={() => setConfirm(false)}>
          <div className="card w-[440px] p-7" onClick={(e) => e.stopPropagation()}>
            <div className="h-sec">Bon pour accord</div>
            <p className="mt-2 text-[14px] text-ink2">En signant, vous acceptez le devis {d.number} de {fmt(ttc)} TTC et ses conditions.</p>
            <label className="mt-4 block"><div className="tag mb-1.5">Nom et prénom</div><input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder={client.contact.name} /></label>
            <div className="mt-5 flex justify-end gap-2"><button className="btn-secondary" onClick={() => setConfirm(false)}>Annuler</button><button className="btn-primary" disabled={!name.trim()} onClick={sign}>Signer le devis</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
