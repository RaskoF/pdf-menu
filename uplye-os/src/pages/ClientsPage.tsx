import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlass, Plus, X } from '@phosphor-icons/react'
import { useStore } from '../store'
import type { Client } from '../types'
import { fmt, initials, totalHT, uid } from '../utils'
import { Avatar, Kpi } from '../components/ui'

export default function ClientsPage() {
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const stats = (c: Client) => {
    const ds = state.devis.filter((d) => d.clientId === c.id)
    const signed = ds.filter((d) => d.stage === 'signe').reduce((s, d) => s + totalHT(d), 0)
    const open = ds.filter((d) => ['brouillon', 'envoye', 'ouvert'].includes(d.stage)).reduce((s, d) => s + totalHT(d), 0)
    return { count: ds.length, signed, open, active: ds.some((d) => d.stage === 'signe') }
  }
  const rows = state.clients.filter((c) => `${c.name} ${c.sector} ${c.contact.name}`.toLowerCase().includes(q.toLowerCase()))
  const totalSigned = state.clients.reduce((s, c) => s + stats(c).signed, 0)
  const actives = state.clients.filter((c) => stats(c).active).length

  return (
    <div className="px-10 py-8">
      <div className="flex items-center justify-between">
        <h1 className="h-page">Clients</h1>
        <button className="btn-primary" onClick={() => setAdding(true)}><Plus size={18} weight="bold" />Nouveau client</button>
      </div>
      <div className="mt-6 grid grid-cols-4 gap-4">
        <Kpi label="Clients" value={state.clients.length} hint={`${actives} avec un devis signé`} />
        <Kpi label="CA signé" value={fmt(totalSigned)} hint="HT, tous clients" />
        <Kpi label="Panier moyen" value={fmt(actives ? totalSigned / state.devis.filter((d) => d.stage === 'signe').length : 0)} hint="par devis signé" />
        <Kpi label="Prospects" value={state.clients.length - actives} hint="sans devis signé" />
      </div>
      <label className="mt-6 flex w-80 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2">
        <MagnifyingGlass size={16} className="text-ink2" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, secteur, contact…" className="flex-1 bg-transparent" />
      </label>
      <div className="card mt-4 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-line font-mono text-[11px] uppercase text-ink2"><tr>
            <th className="px-4 py-3 text-left font-normal">Client</th><th className="px-4 py-3 text-left font-normal">Secteur</th>
            <th className="px-4 py-3 text-left font-normal">Contact</th><th className="px-4 py-3 text-left font-normal">Statut</th>
            <th className="px-4 py-3 text-right font-normal">Devis</th><th className="px-4 py-3 text-right font-normal">En cours</th><th className="px-4 py-3 text-right font-normal">CA signé</th>
          </tr></thead>
          <tbody>
            {rows.map((c) => { const s = stats(c); return (
              <tr key={c.id} onClick={() => nav(`/clients/${c.id}`)} className="cursor-pointer border-b border-line last:border-0 hover:bg-hover/50">
                <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar text={initials(c.name)} tone="neutral" size={32} /><span className="font-semibold">{c.name}</span></div></td>
                <td className="px-4 py-3 text-ink2">{c.sector}</td>
                <td className="px-4 py-3 text-ink2">{c.contact.name}</td>
                <td className="px-4 py-3">{s.active ? <span className="pill bg-g1 text-g7">Client actif</span> : <span className="pill bg-hover text-ink2">Prospect</span>}</td>
                <td className="px-4 py-3 text-right">{s.count}</td>
                <td className="px-4 py-3 text-right text-ink2">{s.open ? fmt(s.open) : '—'}</td>
                <td className="px-4 py-3 text-right font-semibold">{s.signed ? fmt(s.signed) : '—'}</td>
              </tr>) })}
          </tbody>
        </table>
      </div>
      {adding && <NewClient onClose={() => setAdding(false)} onSave={(c) => { dispatch({ type: 'upsertClient', client: c }); setAdding(false); nav(`/clients/${c.id}`) }} />}
    </div>
  )
}

function NewClient({ onClose, onSave }: { onClose: () => void; onSave: (c: Client) => void }) {
  const [f, setF] = useState({ name: '', sector: '', contact: '', role: '', email: '', phone: '', address: '' })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })
  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-ink/40" onClick={onClose}>
      <div className="card w-[520px] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center"><div className="h-sec flex-1">Nouveau client</div><button onClick={onClose}><X size={18} /></button></div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {([['name', 'Nom de l’entreprise'], ['sector', 'Secteur'], ['contact', 'Contact principal'], ['role', 'Fonction'], ['email', 'E-mail'], ['phone', 'Téléphone']] as const).map(([k, l]) => (
            <label key={k}><div className="tag mb-1.5">{l}</div><input className="field" value={f[k]} onChange={set(k)} /></label>
          ))}
          <label className="col-span-2"><div className="tag mb-1.5">Adresse</div><input className="field" value={f.address} onChange={set('address')} /></label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-primary" disabled={!f.name.trim()} onClick={() => onSave({
            id: uid(), name: f.name, sector: f.sector || '—', address: f.address, notes: [], createdAt: new Date().toISOString(),
            contact: { name: f.contact, role: f.role, phone: f.phone, email: f.email },
          })}>Créer le client</button>
        </div>
      </div>
    </div>
  )
}
