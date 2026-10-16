import { useMemo, useState } from 'react'
import { CalendarBlank, Plus, Bell, Check, Lock, ArrowUp, ArrowDown } from '@phosphor-icons/react'
import { useStore, type State } from '../store'
import type { SubCategory, Subscription } from '../types'
import { fmt, fmtDate, lastMonths, monthKey, monthLabel, pct, uid } from '../utils'
import { FilterSelect, Kpi, Modal, Segmented, Toggle } from '../components/ui'
import BarChart from '../components/BarChart'
import { projectStats } from './ProjectsPage'

type Tab = 'synthese' | 'tresorerie' | 'charges' | 'marges'
type Period = 'mois' | 'precedent' | 'trimestre' | 'annee' | '12m'
const C_REV = '#3B5BDB', C_COST = '#B8860B' // paire validée (daltonisme, contraste)
const OPENING_BALANCE = 6280 // solde bancaire fictif du jour

function range(p: Period): [Date, Date, string] {
  const now = new Date(), y = now.getFullYear(), m = now.getMonth()
  if (p === 'mois') return [new Date(y, m, 1), new Date(y, m + 1, 1), 'Ce mois-ci']
  if (p === 'precedent') return [new Date(y, m - 1, 1), new Date(y, m, 1), 'Mois dernier']
  if (p === 'trimestre') { const q = Math.floor(m / 3) * 3; return [new Date(y, q, 1), new Date(y, q + 3, 1), `T${q / 3 + 1} ${y}`] }
  if (p === 'annee') return [new Date(y, 0, 1), new Date(y + 1, 0, 1), `Année ${y}`]
  return [new Date(y, m - 11, 1), new Date(y, m + 1, 1), '12 derniers mois']
}
const prevRange = ([a, b]: [Date, Date, string]): [Date, Date] => { const ms = b.getTime() - a.getTime(); return [new Date(a.getTime() - ms), a] }
const inR = (iso: string | undefined, [a, b]: [Date, Date] | [Date, Date, string]) => !!iso && new Date(iso) >= a && new Date(iso) < b

function figures(s: State, r: [Date, Date] | [Date, Date, string]) {
  const inv = s.invoices.filter((i) => inR(i.issuedAt, r))
  const billed = inv.reduce((t, i) => t + i.amountHT, 0)
  const cashed = s.invoices.filter((i) => inR(i.paidAt, r)).reduce((t, i) => t + i.amountHT, 0)
  const end = Math.min(r[1].getTime(), Date.now())
  const months = Math.max(0, (end - r[0].getTime()) / (30.44 * 86400000))
  const fixed = s.subs.filter((x) => x.active).reduce((t, x) => t + x.monthlyHT, 0) * months
  const variable = s.expenses.filter((e) => inR(e.date, r)).reduce((t, e) => t + e.amountHT, 0)
  const clients = new Set(inv.map((i) => i.clientId)).size
  const paid = inv.filter((i) => i.paidAt)
  const delay = paid.length ? Math.round(paid.reduce((t, i) => t + (new Date(i.paidAt!).getTime() - new Date(i.issuedAt).getTime()) / 86400000, 0) / paid.length) : 0
  return { inv, billed, cashed, fixed, variable, charges: fixed + variable, result: billed - fixed - variable, basket: inv.length ? billed / inv.length : 0, clients, delay }
}

export default function FinancePage() {
  const { state } = useStore()
  const [tab, setTab] = useState<Tab>('synthese')
  const [period, setPeriod] = useState<Period>('annee')
  return (
    <div className="px-10 py-8">
      <div className="flex items-center gap-3">
        <h1 className="h-page flex-1">Finance</h1>
        <span className="flex items-center gap-1.5 rounded-lg bg-hover px-2.5 py-1 text-[12px] text-ink2"><Lock size={13} />Réservé aux admins</span>
        <FilterSelect icon={<CalendarBlank size={16} />} value={period} onChange={setPeriod}
          options={[{ id: 'mois', label: 'Ce mois-ci' }, { id: 'precedent', label: 'Mois dernier' }, { id: 'trimestre', label: 'Ce trimestre' }, { id: 'annee', label: 'Cette année' }, { id: '12m', label: '12 derniers mois' }]} />
      </div>
      <div className="mt-5"><Segmented value={tab} onChange={setTab} options={[{ id: 'synthese', label: 'Synthèse' }, { id: 'tresorerie', label: 'Factures & trésorerie' }, { id: 'charges', label: 'Charges & outils' }, { id: 'marges', label: 'Marge par projet' }]} /></div>
      {tab === 'synthese' && <Synthese state={state} period={period} />}
      {tab === 'tresorerie' && <Tresorerie />}
      {tab === 'charges' && <Charges period={period} />}
      {tab === 'marges' && <Marges />}
    </div>
  )
}

function Delta({ now, before, invert = false }: { now: number; before: number; invert?: boolean }) {
  if (!before || Math.abs(before) < Math.abs(now) / 5) return <span className="text-ink2">pas de période comparable</span>
  const d = Math.round(((now - before) / Math.abs(before)) * 100)
  const good = invert ? d <= 0 : d >= 0
  return <span className={`inline-flex items-center gap-0.5 ${good ? 'text-g7' : 'text-r7'}`}>{d >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}{Math.abs(d)} % vs période précédente</span>
}

function Synthese({ state, period }: { state: State; period: Period }) {
  const r = range(period)
  const f = useMemo(() => figures(state, r), [state, period]) // eslint-disable-line react-hooks/exhaustive-deps
  const p = useMemo(() => figures(state, prevRange(r)), [state, period]) // eslint-disable-line react-hooks/exhaustive-deps
  const months = lastMonths(12)
  const rev = months.map((m) => state.invoices.filter((i) => monthKey(i.issuedAt) === m).reduce((t, i) => t + i.amountHT, 0))
  const fixedM = state.subs.filter((x) => x.active).reduce((t, x) => t + x.monthlyHT, 0)
  const cost = months.map((m) => fixedM + state.expenses.filter((e) => monthKey(e.date) === m).reduce((t, e) => t + e.amountHT, 0))
  const byClient = Object.entries(f.inv.reduce<Record<string, number>>((acc, i) => ({ ...acc, [i.clientId]: (acc[i.clientId] ?? 0) + i.amountHT }), {})).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const recurring = f.inv.filter((i) => i.label === 'Contenus mensuels').reduce((t, i) => t + i.amountHT, 0)
  const curIdx = months.indexOf(monthKey(new Date().toISOString()))

  return (
    <div className="mt-5 space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <Kpi label={`CA facturé · ${r[2]}`} value={fmt(f.billed)} hint={<Delta now={f.billed} before={p.billed} />} />
        <Kpi label="Encaissé" value={fmt(f.cashed)} hint={`${pct(f.cashed, f.billed)} % du facturé`} />
        <Kpi label="Charges" value={fmt(f.charges)} hint={<Delta now={f.charges} before={p.charges} invert />} />
        <Kpi label="Résultat (hors rémunérations)" value={fmt(f.result)} hint={`marge de ${pct(f.result, f.billed)} %`} hintClass={f.result >= 0 ? 'text-g7' : 'text-r7'} />
      </div>
      <div className="grid grid-cols-[1fr_360px] gap-5">
        <div className="card p-5">
          <div className="flex items-baseline"><div className="h-sec flex-1">CA et charges par mois</div><span className="tag">HT · 12 derniers mois</span></div>
          <div className="mt-4"><BarChart labels={months.map((m) => monthLabel(m))} series={[{ name: 'CA facturé', color: C_REV, values: rev }, { name: 'Charges', color: C_COST, values: cost }]} highlight={curIdx} /></div>
        </div>
        <div className="card p-5">
          <div className="h-sec">Indicateurs</div>
          <div className="mt-4 space-y-4">
            {[['Panier moyen', fmt(f.basket), `${f.inv.length} factures`], ['Clients facturés', String(f.clients), r[2].toLowerCase()], ['Part récurrente', `${pct(recurring, f.billed)} %`, 'contenus mensuels'], ['Délai de paiement', `${f.delay} j`, 'en moyenne, de la facture au virement']].map(([l, v, h]) => (
              <div key={l} className="flex items-baseline gap-3 border-b border-line pb-3 last:border-0"><div className="flex-1"><div className="font-semibold">{l}</div><div className="text-[12px] text-ink2">{h}</div></div><div className="font-title text-[26px] font-semibold">{v}</div></div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="h-sec">Compte de résultat · {r[2]}</div>
          <table className="mt-3 w-full text-[14px]">
            <tbody>
              {[['Chiffre d’affaires facturé', f.billed, true], ['Charges variables (freelances, matériel, pub…)', -f.variable, false], ['Charges fixes (local, outils, assurances…)', -f.fixed, false], ['Résultat d’exploitation (hors rémunérations)', f.result, true]].map(([l, v, b]) => (
                <tr key={String(l)} className={`border-b border-line last:border-0 ${b ? 'font-semibold' : ''}`}><td className="py-2.5">{l}</td><td className={`py-2.5 text-right ${Number(v) < 0 ? 'text-ink2' : ''}`}>{fmt(Number(v))}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card p-5">
          <div className="h-sec">Meilleurs clients · {r[2]}</div>
          <div className="mt-4 space-y-3">
            {byClient.map(([id, v]) => (
              <div key={id}>
                <div className="flex justify-between text-[14px]"><span>{state.clients.find((c) => c.id === id)?.name}</span><span className="font-semibold">{fmt(v)}</span></div>
                <div className="mt-1 h-2 rounded-full bg-app"><div className="h-full rounded-full" style={{ width: `${pct(v, byClient[0]![1])}%`, background: C_REV }} /></div>
              </div>
            ))}
            {!byClient.length && <div className="text-ink2">Aucune facture sur la période.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

function Tresorerie() {
  const { state, dispatch } = useStore()
  const [toast, setToast] = useState('')
  const open = state.invoices.filter((i) => !i.paidAt).sort((a, b) => a.dueAt.localeCompare(b.dueAt))
  const late = open.filter((i) => new Date(i.dueAt) < new Date())
  const fixed = state.subs.filter((x) => x.active).reduce((t, x) => t + x.monthlyHT, 0)
  const avgVar = state.expenses.filter((e) => Date.now() - new Date(e.date).getTime() < 92 * 86400000).reduce((t, e) => t + e.amountHT, 0) / 3
  const next = lastMonths(3, new Date(new Date().getFullYear(), new Date().getMonth() + 2, 15))
  let bal = OPENING_BALANCE
  const proj = next.map((m, i) => {
    const inflow = open.filter((x) => (i === 0 ? monthKey(x.dueAt) <= m : monthKey(x.dueAt) === m)).reduce((t, x) => t + x.amountHT * 1.2, 0)
    const outflow = (fixed + avgVar) * 1.2
    bal += inflow - outflow
    return { m, inflow, outflow, bal }
  })
  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(''), 2000) }
  return (
    <div className="mt-5 space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Solde bancaire" value={fmt(OPENING_BALANCE)} hint="synchronisé avec la banque (lecture seule)" />
        <Kpi label="À encaisser" value={fmt(open.reduce((t, i) => t + i.amountHT, 0))} hint={`${open.length} factures HT`} />
        <Kpi label="En retard" value={fmt(late.reduce((t, i) => t + i.amountHT, 0))} hint={`${late.length} factures échues`} hintClass={late.length ? 'text-r7' : 'text-ink2'} />
        <Kpi label="Solde dans 3 mois" value={fmt(proj[2]!.bal)} hint="si tout est payé à l’échéance" hintClass={proj[2]!.bal < 1000 ? 'text-r7' : 'text-g7'} />
      </div>
      <div className="grid grid-cols-[1fr_400px] items-start gap-5">
        <div className="card p-5">
          <div className="h-sec">Factures à encaisser</div>
          <table className="mt-3 w-full text-[14px]">
            <thead className="border-b border-line font-mono text-[11px] uppercase text-ink2"><tr><th className="py-2 text-left font-normal">N°</th><th className="text-left font-normal">Client</th><th className="text-left font-normal">Échéance</th><th className="text-right font-normal">HT</th><th /></tr></thead>
            <tbody>
              {open.map((i) => {
                const isLate = new Date(i.dueAt) < new Date()
                return (
                  <tr key={i.id} className="border-b border-line last:border-0">
                    <td className="py-2.5 font-mono text-[12px] text-ink2">{i.number}</td>
                    <td className="py-2.5"><div className="font-medium">{state.clients.find((c) => c.id === i.clientId)?.name}</div><div className="text-[12px] text-ink2">{i.label}</div></td>
                    <td className="py-2.5">{isLate ? <span className="pill bg-r1 text-r7">En retard · {fmtDate(i.dueAt)}</span> : <span className="text-ink2">{fmtDate(i.dueAt)}</span>}{i.remindedAt && <div className="text-[11px] text-ink2">relancée le {fmtDate(i.remindedAt)}</div>}</td>
                    <td className="py-2.5 text-right font-semibold">{fmt(i.amountHT)}</td>
                    <td className="py-2.5 pl-3 text-right whitespace-nowrap">
                      {isLate && <button title="Envoyer une relance" className="rounded-lg p-1.5 hover:bg-hover" onClick={() => { dispatch({ type: 'upsert', coll: 'invoices', item: { ...i, remindedAt: new Date().toISOString() } }); flash('Relance envoyée au client') }}><Bell size={16} /></button>}
                      <button title="Marquer comme payée" className="rounded-lg p-1.5 hover:bg-hover" onClick={() => { dispatch({ type: 'upsert', coll: 'invoices', item: { ...i, paidAt: new Date().toISOString() } }); flash('Facture marquée payée') }}><Check size={16} /></button>
                    </td>
                  </tr>
                )
              })}
              {!open.length && <tr><td colSpan={5} className="py-6 text-center text-ink2">Tout est encaissé.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="card p-5">
          <div className="h-sec">Prévision sur 3 mois</div>
          <div className="mt-1 text-[13px] text-ink2">TTC · factures à l’échéance, charges fixes et moyenne des dépenses</div>
          <div className="mt-4 space-y-3">
            {proj.map((x) => (
              <div key={x.m} className="rounded-xl bg-app p-3.5">
                <div className="flex items-baseline justify-between"><span className="font-semibold capitalize">{monthLabel(x.m, { month: 'long', year: 'numeric' })}</span><span className={`font-title text-[24px] font-semibold ${x.bal < 1000 ? 'text-r7' : ''}`}>{fmt(x.bal)}</span></div>
                <div className="mt-1 flex justify-between text-[13px] text-ink2"><span className="text-g7">+ {fmt(x.inflow)} encaissements</span><span>− {fmt(x.outflow)} sorties</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {toast && <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-xl bg-ink px-4 py-3 text-ondark shadow-lg">{toast}</div>}
    </div>
  )
}

const CATS: SubCategory[] = ['Local', 'Logiciels', 'Assurance', 'Banque & compta', 'Marketing', 'Télécom']
function Charges({ period }: { period: Period }) {
  const { state, dispatch } = useStore()
  const [edit, setEdit] = useState<Subscription | null>(null)
  const active = state.subs.filter((s) => s.active)
  const monthly = active.reduce((t, s) => t + s.monthlyHT, 0)
  const r = range(period)
  const exp = state.expenses.filter((e) => inR(e.date, r))
  const byCat = Object.entries(exp.reduce<Record<string, number>>((a, e) => ({ ...a, [e.category]: (a[e.category] ?? 0) + e.amountHT }), {})).sort((a, b) => b[1] - a[1])
  const expTotal = exp.reduce((t, e) => t + e.amountHT, 0)
  return (
    <div className="mt-5 space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <Kpi label="Charges fixes" value={fmt(monthly)} hint="HT par mois" />
        <Kpi label="Par an" value={fmt(monthly * 12)} hint={`${active.length} abonnements actifs`} />
        <Kpi label="Logiciels" value={fmt(active.filter((s) => s.category === 'Logiciels').reduce((t, s) => t + s.monthlyHT, 0))} hint="HT par mois" />
        <Kpi label={`Dépenses variables · ${r[2]}`} value={fmt(expTotal)} hint="freelances, matériel, pub, déplacements" />
      </div>
      <div className="grid grid-cols-[1fr_380px] items-start gap-5">
        <div className="card p-5">
          <div className="flex items-center"><div className="h-sec flex-1">Abonnements & outils</div><button className="btn-secondary !py-1.5" onClick={() => setEdit({ id: uid(), label: '', category: 'Logiciels', monthlyHT: 0, active: true })}><Plus size={15} />Ajouter</button></div>
          {CATS.map((c) => {
            const list = state.subs.filter((s) => s.category === c)
            if (!list.length) return null
            return (
              <div key={c} className="mt-4">
                <div className="tag mb-1">{c} · {fmt(list.filter((s) => s.active).reduce((t, s) => t + s.monthlyHT, 0))} / mois</div>
                {list.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 border-b border-line py-2.5 last:border-0">
                    <Toggle on={s.active} onChange={(v) => dispatch({ type: 'upsert', coll: 'subs', item: { ...s, active: v } })} />
                    <button onClick={() => setEdit(s)} className={`flex-1 text-left ${s.active ? '' : 'text-ink2 line-through'}`}>{s.label}{s.note && <span className="ml-2 pill bg-o1 !text-[12px] text-o7">{s.note}</span>}</button>
                    <span className="font-semibold">{fmt(s.monthlyHT)}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
        <div className="card p-5">
          <div className="h-sec">Dépenses variables</div>
          <div className="mt-1 text-[13px] text-ink2">{r[2]} · HT</div>
          <div className="mt-4 space-y-3">
            {byCat.map(([c, v]) => (
              <div key={c}><div className="flex justify-between text-[14px]"><span>{c}</span><span className="font-semibold">{fmt(v)}</span></div>
                <div className="mt-1 h-2 rounded-full bg-app"><div className="h-full rounded-full" style={{ width: `${pct(v, byCat[0]![1])}%`, background: C_COST }} /></div></div>
            ))}
            {!byCat.length && <div className="text-ink2">Aucune dépense sur la période.</div>}
          </div>
        </div>
      </div>
      {edit && <SubModal sub={edit} onClose={() => setEdit(null)} />}
    </div>
  )
}

function SubModal({ sub, onClose }: { sub: Subscription; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const [s, setS] = useState(sub)
  const exists = state.subs.some((x) => x.id === sub.id)
  return (
    <Modal title={exists ? 'Modifier l’abonnement' : 'Nouvel abonnement'} onClose={onClose} width={440}>
      <div className="space-y-3">
        <label className="block"><div className="tag mb-1.5">Nom</div><input autoFocus className="field" value={s.label} onChange={(e) => setS({ ...s, label: e.target.value })} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label><div className="tag mb-1.5">Catégorie</div><select className="field" value={s.category} onChange={(e) => setS({ ...s, category: e.target.value as SubCategory })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label><div className="tag mb-1.5">€ HT / mois</div><input type="number" className="field" value={s.monthlyHT || ''} onChange={(e) => setS({ ...s, monthlyHT: Number(e.target.value) })} /></label>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-2">
        {exists && <button className="btn-ghost text-r7" onClick={() => { dispatch({ type: 'remove', coll: 'subs', id: s.id }); onClose() }}>Supprimer</button>}
        <span className="flex-1" /><button className="btn-secondary" onClick={onClose}>Annuler</button>
        <button className="btn-primary" disabled={!s.label.trim()} onClick={() => { dispatch({ type: 'upsert', coll: 'subs', item: s }); onClose() }}>Enregistrer</button>
      </div>
    </Modal>
  )
}

function Marges() {
  const { state } = useStore()
  const rows = state.projects.map((p) => ({ p, s: projectStats(p, state.tasks) })).sort((a, b) => b.s.marginPct - a.s.marginPct)
  const tot = rows.reduce((t, r) => ({ ca: t.ca + r.p.budget, cost: t.cost + r.s.cost }), { ca: 0, cost: 0 })
  return (
    <div className="mt-5 space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <Kpi label="CA des projets" value={fmt(tot.ca)} hint={`${rows.length} projets`} />
        <Kpi label="Coûts (directs + temps)" value={fmt(tot.cost)} hint="temps valorisé à 35 € HT / h" />
        <Kpi label="Marge globale" value={`${pct(tot.ca - tot.cost, tot.ca)} %`} hint={fmt(tot.ca - tot.cost)} hintClass="text-g7" />
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-[14px]">
          <thead className="border-b border-line font-mono text-[11px] uppercase text-ink2"><tr>
            <th className="px-4 py-3 text-left font-normal">Projet</th><th className="px-4 py-3 text-right font-normal">CA</th><th className="px-4 py-3 text-right font-normal">Coûts directs</th>
            <th className="px-4 py-3 text-right font-normal">Heures</th><th className="px-4 py-3 text-right font-normal">Marge</th><th className="w-56 px-4 py-3 text-left font-normal">Marge %</th>
          </tr></thead>
          <tbody>
            {rows.map(({ p, s }) => (
              <tr key={p.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3"><div className="font-semibold">{p.name}</div><div className="text-[12px] text-ink2">{state.clients.find((c) => c.id === p.clientId)?.name}</div></td>
                <td className="px-4 py-3 text-right">{fmt(p.budget)}</td><td className="px-4 py-3 text-right text-ink2">{fmt(s.direct)}</td>
                <td className="px-4 py-3 text-right text-ink2">{s.hours} h</td><td className={`px-4 py-3 text-right font-semibold ${s.margin < 0 ? 'text-r7' : ''}`}>{fmt(s.margin)}</td>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="h-2 flex-1 rounded-full bg-app"><div className={`h-full rounded-full ${s.marginPct < 30 ? 'bg-r7' : s.marginPct < 50 ? 'bg-o7' : 'bg-g7'}`} style={{ width: `${Math.max(0, Math.min(100, s.marginPct))}%` }} /></div><span className="w-10 text-right font-semibold">{s.marginPct} %</span></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[13px] text-ink2">Repère : en dessous de 30 % de marge, le projet ne paie pas sa part des charges fixes (local, outils, assurances).</p>
    </div>
  )
}
