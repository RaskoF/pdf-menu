import { useState } from 'react'
import { Plus, Archive, ArrowCounterClockwise } from '@phosphor-icons/react'
import { useStore } from '../store'
import type { Activity, CatalogueItem } from '../types'
import { HOURLY_COST, fmt, pct, uid } from '../utils'
import { ActivityPill, Kpi, Modal, Segmented } from '../components/ui'

const UNIT = { forfait: 'forfait', heure: '/ h', mois: '/ mois' } as const
export const itemMargin = (c: CatalogueItem) => { const cost = (c.hours ?? 0) * HOURLY_COST + (c.directCost ?? 0); return { cost, margin: c.price - cost, pct: pct(c.price - cost, c.price) } }

export default function CataloguePage() {
  const { state, dispatch } = useStore()
  const [act, setAct] = useState<'all' | Activity>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [edit, setEdit] = useState<CatalogueItem | null>(null)
  // nombre de fois où la prestation apparaît dans un devis, et combien ont été signés
  const usage = (c: CatalogueItem) => {
    const ds = state.devis.filter((d) => d.lines.some((l) => l.label === c.label))
    return { used: ds.length, signed: ds.filter((d) => d.stage === 'signe').length }
  }
  const list = state.catalogue.filter((c) => (act === 'all' || c.activity === act) && !!c.archived === showArchived)
  const active = state.catalogue.filter((c) => !c.archived)
  const avg = active.length ? Math.round(active.reduce((s, c) => s + itemMargin(c).pct, 0) / active.length) : 0
  const top = [...active].sort((a, b) => usage(b).signed - usage(a).signed)[0]
  const low = active.filter((c) => itemMargin(c).pct < 40)
  return (
    <div className="px-10 py-8">
      <div className="flex items-center justify-between">
        <div><h1 className="h-page">Catalogue</h1><div className="mt-1 text-ink2">Les prestations et leurs prix, utilisés dans l’éditeur de devis.</div></div>
        <button className="btn-primary" onClick={() => setEdit({ id: uid(), label: '', desc: '', price: 0, activity: 'Studio', unit: 'forfait', hours: 1, directCost: 0 })}><Plus size={18} weight="bold" />Nouvelle prestation</button>
      </div>
      <div className="mt-6 grid grid-cols-4 gap-4">
        <Kpi label="Prestations actives" value={active.length} hint={`${state.catalogue.length - active.length} archivées`} />
        <Kpi label="Marge moyenne estimée" value={`${avg} %`} hint={`temps à ${HOURLY_COST} € HT / h + coûts directs`} />
        <Kpi label="La plus signée" value={top ? top.label.split(' ')[0]! : '—'} hint={top ? `${top.label} · ${usage(top).signed} signée(s)` : ''} />
        <Kpi label="Marge faible" value={low.length} hint="sous 40 % : prix à revoir" hintClass={low.length ? 'text-r7' : 'text-ink2'} />
      </div>
      <div className="mt-6 flex items-center gap-3">
        <Segmented value={act} onChange={setAct} options={[{ id: 'all', label: 'Toutes' }, { id: 'Studio', label: 'Studio' }, { id: 'Azurpod', label: 'Azurpod' }, { id: 'Academy', label: 'Academy' }]} />
        <label className="ml-auto flex items-center gap-2 text-[14px] text-ink2"><input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />Voir les archivées</label>
      </div>
      <div className="card mt-4 overflow-hidden">
        <table className="w-full text-[14px]">
          <thead className="border-b border-line font-mono text-[11px] uppercase text-ink2"><tr>
            <th className="px-4 py-3 text-left font-normal">Prestation</th><th className="px-4 py-3 text-left font-normal">Activité</th><th className="px-4 py-3 text-right font-normal">Prix HT</th>
            <th className="px-4 py-3 text-right font-normal">Temps</th><th className="px-4 py-3 text-right font-normal">Coût estimé</th><th className="w-44 px-4 py-3 text-left font-normal">Marge</th><th className="px-4 py-3 text-right font-normal">Devis · signés</th><th />
          </tr></thead>
          <tbody>
            {list.map((c) => { const m = itemMargin(c), u = usage(c); return (
              <tr key={c.id} onClick={() => setEdit(c)} className="cursor-pointer border-b border-line last:border-0 hover:bg-hover/50">
                <td className="px-4 py-3"><div className="font-semibold">{c.label}</div><div className="text-[12px] text-ink2">{c.desc}</div></td>
                <td className="px-4 py-3"><ActivityPill activity={c.activity} /></td>
                <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">{fmt(c.price)} <span className="font-normal text-ink2">{UNIT[c.unit ?? 'forfait']}</span></td>
                <td className="px-4 py-3 text-right text-ink2">{c.hours ?? 0} h</td>
                <td className="px-4 py-3 text-right text-ink2">{fmt(m.cost)}</td>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="h-2 flex-1 rounded-full bg-app"><div className={`h-full rounded-full ${m.pct < 40 ? 'bg-r7' : m.pct < 60 ? 'bg-o7' : 'bg-g7'}`} style={{ width: `${Math.max(0, m.pct)}%` }} /></div><span className="w-10 text-right font-semibold">{m.pct} %</span></div></td>
                <td className="px-4 py-3 text-right">{u.used} · <span className="text-g7">{u.signed}</span></td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <button title={c.archived ? 'Réactiver' : 'Archiver'} className="rounded-lg p-1.5 text-ink2 hover:bg-hover" onClick={() => dispatch({ type: 'upsert', coll: 'catalogue', item: { ...c, archived: !c.archived } })}>{c.archived ? <ArrowCounterClockwise size={16} /> : <Archive size={16} />}</button>
                </td>
              </tr>) })}
            {!list.length && <tr><td colSpan={8} className="py-8 text-center text-ink2">Aucune prestation.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[13px] text-ink2">Une prestation archivée n’apparaît plus dans l’éditeur de devis ; les devis déjà envoyés ne changent pas.</p>
      {edit && <ItemModal item={edit} onClose={() => setEdit(null)} />}
    </div>
  )
}

function ItemModal({ item, onClose }: { item: CatalogueItem; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const [c, setC] = useState(item)
  const exists = state.catalogue.some((x) => x.id === c.id)
  const m = itemMargin(c)
  return (
    <Modal title={exists ? 'Modifier la prestation' : 'Nouvelle prestation'} onClose={onClose}>
      <div className="space-y-3">
        <label className="block"><div className="tag mb-1.5">Nom</div><input autoFocus className="field" value={c.label} onChange={(e) => setC({ ...c, label: e.target.value })} /></label>
        <label className="block"><div className="tag mb-1.5">Description (visible par le client)</div><input className="field" value={c.desc} onChange={(e) => setC({ ...c, desc: e.target.value })} /></label>
        <div className="grid grid-cols-3 gap-3">
          <label><div className="tag mb-1.5">Activité</div><select className="field" value={c.activity} onChange={(e) => setC({ ...c, activity: e.target.value as Activity })}><option>Studio</option><option>Azurpod</option><option>Academy</option></select></label>
          <label><div className="tag mb-1.5">Prix HT</div><input type="number" className="field" value={c.price || ''} onChange={(e) => setC({ ...c, price: Number(e.target.value) })} /></label>
          <label><div className="tag mb-1.5">Unité</div><select className="field" value={c.unit ?? 'forfait'} onChange={(e) => setC({ ...c, unit: e.target.value as CatalogueItem['unit'] })}><option value="forfait">Forfait</option><option value="heure">Par heure</option><option value="mois">Par mois</option></select></label>
          <label><div className="tag mb-1.5">Temps interne (h)</div><input type="number" step={0.5} className="field" value={c.hours ?? 0} onChange={(e) => setC({ ...c, hours: Number(e.target.value) })} /></label>
          <label className="col-span-2"><div className="tag mb-1.5">Coûts directs estimés (€ HT)</div><input type="number" className="field" value={c.directCost ?? 0} onChange={(e) => setC({ ...c, directCost: Number(e.target.value) })} /></label>
        </div>
        <div className={`rounded-xl p-3 text-[14px] ${m.pct < 40 ? 'bg-r1 text-r7' : 'bg-g1 text-g7'}`}>Marge estimée : <b>{fmt(m.margin)}</b> ({m.pct} %) pour un coût de {fmt(m.cost)}.</div>
      </div>
      <div className="mt-5 flex justify-end gap-2"><button className="btn-secondary" onClick={onClose}>Annuler</button>
        <button className="btn-primary" disabled={!c.label.trim() || c.price <= 0} onClick={() => { dispatch({ type: 'upsert', coll: 'catalogue', item: c }); onClose() }}>Enregistrer</button></div>
    </Modal>
  )
}
