import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Copy, Gift, HandCoins, PaperPlaneTilt, Ticket } from '@phosphor-icons/react'
import { useStore } from '../store'
import type { Referral, ReferralReward } from '../types'
import { TVA, fmt, fmtDate, uid } from '../utils'
import { PROJECT_STEPS, ProjectStatusPill } from '../components/ui'
import { REF_STATUS, referralCode, rewardOf } from '../components/referral'

type Tab = 'projets' | 'factures' | 'parrainage'

// Aperçu de l'espace client (ce que verra le client connecté).
// En prod : l'identité du client vient de sa session, jamais de l'URL.
export default function ClientPortal() {
  const { id } = useParams()
  const { state, dispatch } = useStore()
  const [tab, setTab] = useState<Tab>('parrainage')
  const [form, setForm] = useState({ name: '', company: '', email: '', reward: 'credit' as ReferralReward })
  const [copied, setCopied] = useState(false)
  const [sent, setSent] = useState('')
  const c = state.clients.find((x) => x.id === id)
  if (!c) return <div className="p-10">Client introuvable.</div>

  const projects = state.projects.filter((p) => p.clientId === c.id)
  const invoices = state.invoices.filter((i) => i.clientId === c.id).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
  const refs = state.referrals.filter((r) => r.referrerId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const code = referralCode(c.name)
  const link = `uplye.fr/r/${code}`
  const earned = (k: ReferralReward) => refs.filter((r) => r.reward === k && r.status === 'signe').reduce((s, r) => s + rewardOf(r), 0)
  const creditLeft = refs.filter((r) => r.reward === 'credit' && r.status === 'signe' && !r.settled).reduce((s, r) => s + rewardOf(r), 0)

  const copy = () => { try { navigator.clipboard?.writeText(`https://${link}`) } catch { /* presse-papier indisponible */ } setCopied(true); setTimeout(() => setCopied(false), 1500) }
  const invite = () => {
    if (!form.name.trim() || !form.email.includes('@')) return
    const r: Referral = { id: uid(), referrerId: c.id, name: form.name.trim(), company: form.company.trim() || form.name.trim(), email: form.email.trim(), status: 'invite', amountHT: 0, reward: form.reward, settled: false, createdAt: new Date().toISOString() }
    dispatch({ type: 'upsert', coll: 'referrals', item: r })
    dispatch({ type: 'upsert', coll: 'notifs', item: { id: uid(), at: r.createdAt, to: 'admins', kind: 'info', read: false, link: `/clients/${c.id}`, text: `${c.name} recommande ${r.company} (${r.reward === 'credit' ? '10 % crédit' : '5 % commission'})` } })
    setSent(r.company); setForm({ name: '', company: '', email: '', reward: form.reward })
  }
  const setReward = (r: Referral, reward: ReferralReward) => dispatch({ type: 'upsert', coll: 'referrals', item: { ...r, reward } })

  const TabBtn = ({ t, label }: { t: Tab; label: string }) => (
    <button onClick={() => setTab(t)} className={`border-b-2 px-1 pb-3 font-semibold ${tab === t ? 'border-accent text-ondark' : 'border-transparent text-ondarkm hover:text-ondark'}`}>{label}</button>
  )

  return (
    <div className="min-h-full bg-app">
      <div className="bg-side text-ondark">
        <div className="flex items-center gap-4 px-12 py-4">
          <Link to={`/clients/${c.id}`} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[12px] text-ondarkm hover:text-ondark"><ArrowLeft size={13} />Vue interne</Link>
          <span className="font-title text-[22px] font-semibold uppercase">Uplye Studio</span>
          <span className="ml-auto text-[14px] text-ondarkm">Connecté : <b className="text-ondark">{c.contact.name}</b> · {c.name}</span>
        </div>
        <div className="mx-auto max-w-[1100px] px-6 pt-8">
          <div className="font-mono text-[11px] uppercase text-ondarkm">Espace client</div>
          <h1 className="mt-2 font-title text-[48px] font-semibold uppercase leading-none">Bonjour {c.contact.name.split(' ')[0]}</h1>
          <div className="mt-8 flex gap-8"><TabBtn t="projets" label={`Projets · ${projects.length}`} /><TabBtn t="factures" label={`Factures · ${invoices.length}`} /><TabBtn t="parrainage" label="Parrainage" /></div>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-6 py-10">
        {tab === 'projets' && (
          <div className="space-y-4">
            {projects.map((p) => {
              const idx = PROJECT_STEPS.findIndex((s) => s.id === p.status)
              return (
                <div key={p.id} className="card p-5">
                  <div className="flex items-center gap-3"><div className="h-sec flex-1">{p.name}</div><ProjectStatusPill s={p.status} /></div>
                  <div className="mt-1 text-[13px] text-ink2">Livraison prévue le {fmtDate(p.due, { day: 'numeric', month: 'long' })}</div>
                  <div className="mt-4 grid grid-cols-6 gap-2">
                    {PROJECT_STEPS.map((s, i) => (
                      <div key={s.id}><div className={`h-1.5 rounded-full ${i <= idx ? 'bg-ink' : 'bg-line'}`} /><div className={`mt-1.5 text-[12px] ${i <= idx ? 'font-semibold' : 'text-ink2'}`}>{s.label}</div></div>
                    ))}
                  </div>
                </div>
              )
            })}
            {!projects.length && <div className="card p-10 text-center text-ink2">Aucun projet en cours.</div>}
          </div>
        )}

        {tab === 'factures' && (
          <div className="card divide-y divide-line">
            {invoices.map((i) => (
              <div key={i.id} className="flex items-center gap-4 px-5 py-3">
                <span className="w-28 font-mono text-[12px] text-ink2">{i.number}</span>
                <span className="flex-1">{i.label}</span>
                <span className="text-[13px] text-ink2">{fmtDate(i.issuedAt)}</span>
                <span className="w-24 text-right font-semibold">{fmt(i.amountHT * (1 + TVA))} TTC</span>
                {i.paidAt ? <span className="pill bg-g1 text-g7">Payée</span> : <span className="pill bg-o1 text-o7">À régler</span>}
              </div>
            ))}
            {!invoices.length && <div className="p-10 text-center text-ink2">Aucune facture.</div>}
          </div>
        )}

        {tab === 'parrainage' && (
          <div className="space-y-5">
            <div className="card flex items-center gap-8 bg-side p-8 text-ondark">
              <div className="flex-1">
                <div className="font-mono text-[11px] uppercase text-accent">Programme parrainage</div>
                <div className="mt-2 font-title text-[36px] font-semibold uppercase leading-none">Recommandez Uplye, on vous remercie</div>
                <p className="mt-3 max-w-[520px] text-ondarkm">Pour chaque entreprise que vous nous présentez et qui signe un devis, vous choisissez votre récompense.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="w-[170px] rounded-xl border border-white/15 p-4"><HandCoins size={24} className="text-accent" /><div className="mt-2 font-title text-[32px] font-semibold leading-none">5 %</div><div className="mt-1 text-[13px] text-ondarkm">en commission versée par virement</div></div>
                <div className="w-[170px] rounded-xl border border-accent bg-accent/10 p-4"><Gift size={24} className="text-accent" /><div className="mt-2 font-title text-[32px] font-semibold leading-none">10 %</div><div className="mt-1 text-[13px] text-ondarkm">en crédit sur nos prestations</div></div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="card p-4"><div className="tag">Filleuls</div><div className="mt-1 font-title text-[30px] font-semibold">{refs.length}</div></div>
              <div className="card p-4"><div className="tag">Signés</div><div className="mt-1 font-title text-[30px] font-semibold">{refs.filter((r) => r.status === 'signe').length}</div></div>
              <div className="card p-4"><div className="tag">Crédit disponible</div><div className="mt-1 font-title text-[30px] font-semibold">{fmt(creditLeft)}</div><div className="text-[12px] text-ink2">{fmt(earned('credit'))} gagnés au total</div></div>
              <div className="card p-4"><div className="tag">Commissions</div><div className="mt-1 font-title text-[30px] font-semibold">{fmt(earned('commission'))}</div><div className="text-[12px] text-ink2">HT, sur facture</div></div>
            </div>

            <div className="grid grid-cols-[1fr_400px] items-start gap-5">
              <div className="card p-5">
                <div className="h-sec">Vos recommandations</div>
                <div className="mt-3 divide-y divide-line border-t border-line">
                  {refs.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 py-3">
                      <div className="flex-1 leading-tight"><div className="font-semibold">{r.company}</div><div className="text-[13px] text-ink2">{r.name} · recommandé le {fmtDate(r.createdAt)}</div></div>
                      <select className="field !w-auto !py-1 text-[13px]" value={r.reward} disabled={r.settled} onChange={(e) => setReward(r, e.target.value as ReferralReward)}>
                        <option value="credit">10 % crédit</option><option value="commission">5 % commission</option>
                      </select>
                      <span className={`pill ${REF_STATUS[r.status].cls}`}>{REF_STATUS[r.status].label}</span>
                      <span className="w-20 text-right font-semibold">{r.status === 'signe' ? fmt(rewardOf(r)) : '—'}</span>
                    </div>
                  ))}
                  {!refs.length && <div className="py-8 text-center text-ink2">Pas encore de recommandation. Partagez votre lien !</div>}
                </div>
              </div>

              <div className="space-y-5">
                <div className="card p-5">
                  <div className="h-sec">Votre lien</div>
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-app px-3 py-2.5"><Ticket size={18} /><span className="flex-1 font-mono text-[13px]">{link}</span>
                    <button className="flex items-center gap-1 text-[13px] font-semibold" onClick={copy}>{copied ? <><Check size={14} />Copié</> : <><Copy size={14} />Copier</>}</button></div>
                  <div className="mt-2 text-[13px] text-ink2">Code à donner : <b className="font-mono text-ink">{code}</b></div>
                </div>
                <div className="card space-y-3 p-5">
                  <div className="h-sec">Recommander quelqu’un</div>
                  <input className="field" placeholder="Prénom et nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <input className="field" placeholder="Entreprise" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                  <input className="field" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    {(['credit', 'commission'] as const).map((k) => (
                      <button key={k} onClick={() => setForm({ ...form, reward: k })} className={`rounded-xl border px-3 py-2 text-left text-[13px] ${form.reward === k ? 'border-ink bg-accent/30 font-semibold' : 'border-line'}`}>{k === 'credit' ? '10 % en crédit' : '5 % en commission'}</button>
                    ))}
                  </div>
                  <button className="btn-primary w-full justify-center" onClick={invite}><PaperPlaneTilt size={16} />Envoyer la recommandation</button>
                  {sent && <div className="rounded-lg bg-g1 px-3 py-2 text-[13px] text-g7">Merci ! L’équipe Uplye va contacter {sent}.</div>}
                </div>
              </div>
            </div>

            <div className="card p-5 text-[13px] leading-relaxed text-ink2">
              <div className="h-sec !text-ink">Les règles</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>La récompense est calculée sur le montant HT du premier devis signé par votre filleul, une fois son acompte encaissé.</li>
                <li>Crédit 10 % : utilisable sur toute prestation Uplye Studio ou Azurpod, valable 12 mois, non remboursable.</li>
                <li>Commission 5 % : versée par virement sur présentation d’une facture d’apporteur d’affaires (ou d’une note si vous êtes un particulier).</li>
                <li>Le filleul doit être un nouveau client Uplye. Pas de cumul avec une autre offre sur le même devis.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
