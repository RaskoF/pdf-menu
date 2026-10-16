import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MapPin, UserPlus, ArrowRight } from '@phosphor-icons/react'
import { useStore } from '../store'
import type { ContactStatus, Devis, EventContact, EventItem, EventType, Person } from '../types'
import { PEOPLE, fmt, totalHT, uid } from '../utils'
import { Kpi, Modal, PersonAvatar, Segmented } from '../components/ui'

const STATUS: Record<ContactStatus, { label: string; cls: string }> = {
  a_recontacter: { label: 'À recontacter', cls: 'bg-y1 text-ink' }, prospect: { label: 'Prospect', cls: 'bg-hover text-ink' },
  devis: { label: 'Devis en cours', cls: 'bg-b1 text-b7' }, gagne: { label: 'Client', cls: 'bg-g1 text-g7' }, pas_interesse: { label: 'Pas intéressé', cls: 'bg-hover text-ink2' },
}

export default function EventsPage() {
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const [view, setView] = useState<'avenir' | 'passes'>('passes')
  const [open, setOpen] = useState<string | null>('ev1')
  const [addEvent, setAddEvent] = useState(false)
  const [addContact, setAddContact] = useState<EventItem | null>(null)
  const now = new Date()
  const list = state.events.filter((e) => (view === 'avenir' ? new Date(e.date) >= now : new Date(e.date) < now)).sort((a, b) => (view === 'avenir' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)))
  const contacts = state.events.flatMap((e) => e.contacts)
  // CA signé par les clients rencontrés en événement
  const won = (e: EventItem) => e.contacts.filter((c) => c.clientId).flatMap((c) => state.devis.filter((d) => d.clientId === c.clientId && d.stage === 'signe')).reduce((s, d) => s + totalHT(d), 0)
  const totalWon = state.events.reduce((s, e) => s + won(e), 0)
  const save = (e: EventItem) => dispatch({ type: 'upsert', coll: 'events', item: e })
  const setStatus = (e: EventItem, c: EventContact, status: ContactStatus) => save({ ...e, contacts: e.contacts.map((x) => (x.id === c.id ? { ...x, status } : x)) })
  // transforme un contact en client + prospect « à chiffrer » dans le pipeline des devis
  const toProspect = (e: EventItem, c: EventContact) => {
    const clientId = c.clientId ?? uid()
    if (!c.clientId) dispatch({ type: 'upsert', coll: 'clients', item: { id: clientId, name: c.company, sector: '—', contact: { name: c.name, role: c.role, phone: '', email: '' }, address: '', notes: [c.notes].filter(Boolean), createdAt: new Date().toISOString() } })
    const d: Devis = { id: uid(), number: '', clientId, title: c.notes || 'Nouveau prospect', intro: '', owner: 'E', activity: 'Studio', stage: 'a_chiffrer', lines: [], validityDays: 30, schedule: '40/30/30', createdAt: new Date().toISOString(), openedCount: 0, source: `Rencontré · ${e.name}` }
    dispatch({ type: 'upsertDevis', devis: d })
    save({ ...e, contacts: e.contacts.map((x) => (x.id === c.id ? { ...x, clientId, devisId: d.id, status: 'devis' } : x)) })
    nav('/devis')
  }

  return (
    <div className="px-10 py-8">
      <div className="flex items-center justify-between">
        <div><h1 className="h-page">Événements</h1><div className="mt-1 text-ink2">Networking, salons et conférences : qui on a rencontré, et ce que ça rapporte.</div></div>
        <button className="btn-primary" onClick={() => setAddEvent(true)}><Plus size={18} weight="bold" />Nouvel événement</button>
      </div>
      <div className="mt-6 grid grid-cols-4 gap-4">
        <Kpi label="Événements" value={state.events.filter((e) => new Date(e.date) < now).length} hint={`${state.events.filter((e) => new Date(e.date) >= now).length} à venir`} />
        <Kpi label="Contacts rencontrés" value={contacts.length} hint={`${contacts.filter((c) => c.status === 'a_recontacter').length} à recontacter`} hintClass="text-o7" />
        <Kpi label="Devenus clients" value={contacts.filter((c) => c.status === 'gagne').length} hint={`${contacts.filter((c) => c.status === 'devis').length} devis en cours`} />
        <Kpi label="CA signé issu des événements" value={fmt(totalWon)} hint={`pour ${fmt(state.events.reduce((s, e) => s + e.cost, 0))} de frais d’inscription`} hintClass="text-g7" />
      </div>
      <div className="mt-6"><Segmented value={view} onChange={setView} options={[{ id: 'passes', label: 'Passés' }, { id: 'avenir', label: 'À venir' }]} /></div>
      <div className="mt-4 space-y-3">
        {list.map((e) => (
          <div key={e.id} className="card overflow-hidden">
            <button onClick={() => setOpen(open === e.id ? null : e.id)} className="flex w-full items-center gap-5 p-5 text-left">
              <div className="w-14 text-center"><div className="tag">{new Date(e.date).toLocaleDateString('fr-FR', { month: 'short' })}</div><div className="font-title text-[30px] font-semibold leading-none">{new Date(e.date).getDate()}</div></div>
              <div className="flex-1"><div className="text-[17px] font-semibold">{e.name}</div><div className="flex items-center gap-1.5 text-[13px] text-ink2"><span className="pill bg-hover !text-[12px]">{e.type}</span><MapPin size={13} />{e.place}{e.cost ? ` · ${fmt(e.cost)}` : ''}</div></div>
              <div className="flex -space-x-1.5">{e.attendees.map((p) => <PersonAvatar key={p} p={p} size={28} />)}</div>
              <div className="w-32 text-right"><div className="font-semibold">{e.contacts.length} contact{e.contacts.length > 1 ? 's' : ''}</div><div className="text-[12px] text-g7">{won(e) ? `${fmt(won(e))} signés` : ''}</div></div>
            </button>
            {open === e.id && (
              <div className="border-t border-line bg-app/40 px-5 py-4">
                {e.notes && <div className="mb-3 text-[14px] text-ink2">{e.notes}</div>}
                <div className="space-y-2">
                  {e.contacts.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 rounded-xl bg-surface p-3">
                      <div className="flex-1"><div className="font-semibold">{c.name} <span className="font-normal text-ink2">· {c.role}, {c.company}</span></div><div className="text-[13px] text-ink2">{c.notes}</div></div>
                      <select className={`rounded-lg px-2 py-1 text-[13px] font-medium ${STATUS[c.status].cls}`} value={c.status} onChange={(ev) => setStatus(e, c, ev.target.value as ContactStatus)}>
                        {(Object.keys(STATUS) as ContactStatus[]).map((k) => <option key={k} value={k}>{STATUS[k].label}</option>)}
                      </select>
                      {c.devisId ? <button className="btn-ghost !py-1.5 text-[13px]" onClick={() => nav(`/devis/${c.devisId}`)}>Voir le devis<ArrowRight size={14} /></button>
                        : c.status !== 'pas_interesse' && c.status !== 'gagne' && <button className="btn-secondary !py-1.5 text-[13px]" onClick={() => toProspect(e, c)}>Créer le prospect</button>}
                    </div>
                  ))}
                  {!e.contacts.length && <div className="text-[14px] text-ink2">Pas encore de contact. Ajoute les personnes rencontrées juste après l’événement.</div>}
                </div>
                <button className="mt-3 flex items-center gap-1.5 text-[14px] font-semibold" onClick={() => setAddContact(e)}><UserPlus size={16} />Ajouter un contact rencontré</button>
              </div>
            )}
          </div>
        ))}
        {!list.length && <div className="card p-10 text-center text-ink2">Aucun événement.</div>}
      </div>
      {addEvent && <EventModal onClose={() => setAddEvent(false)} onSave={(e) => { save(e); setAddEvent(false); setView(new Date(e.date) >= now ? 'avenir' : 'passes'); setOpen(e.id) }} />}
      {addContact && <ContactModal onClose={() => setAddContact(null)} onSave={(c) => { save({ ...addContact, contacts: [...addContact.contacts, c] }); setAddContact(null) }} />}
    </div>
  )
}

function EventModal({ onClose, onSave }: { onClose: () => void; onSave: (e: EventItem) => void }) {
  const [e, setE] = useState<EventItem>({ id: uid(), name: '', type: 'Networking', date: new Date(Date.now() + 7 * 86400000).toISOString(), place: '', cost: 0, attendees: ['E'], contacts: [], notes: '' })
  return (
    <Modal title="Nouvel événement" onClose={onClose}>
      <div className="space-y-3">
        <label className="block"><div className="tag mb-1.5">Nom</div><input autoFocus className="field" value={e.name} onChange={(x) => setE({ ...e, name: x.target.value })} placeholder="Ex. BNI · petit-déjeuner" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label><div className="tag mb-1.5">Type</div><select className="field" value={e.type} onChange={(x) => setE({ ...e, type: x.target.value as EventType })}>{['Networking', 'Salon', 'Conférence', 'Afterwork'].map((t) => <option key={t}>{t}</option>)}</select></label>
          <label><div className="tag mb-1.5">Date</div><input type="date" className="field" value={e.date.slice(0, 10)} onChange={(x) => setE({ ...e, date: new Date(x.target.value + 'T18:00:00').toISOString() })} /></label>
          <label><div className="tag mb-1.5">Lieu</div><input className="field" value={e.place} onChange={(x) => setE({ ...e, place: x.target.value })} /></label>
          <label><div className="tag mb-1.5">Coût (€)</div><input type="number" className="field" value={e.cost || ''} onChange={(x) => setE({ ...e, cost: Number(x.target.value) })} /></label>
        </div>
        <div><div className="tag mb-1.5">Qui y va</div><div className="flex gap-2">{(Object.keys(PEOPLE) as Person[]).map((p) => {
          const on = e.attendees.includes(p)
          return <button key={p} onClick={() => setE({ ...e, attendees: on ? e.attendees.filter((x) => x !== p) : [...e.attendees, p] })} className={`pill border ${on ? 'border-ink bg-accent' : 'border-line'}`}>{PEOPLE[p].name}</button>
        })}</div></div>
      </div>
      <div className="mt-5 flex justify-end gap-2"><button className="btn-secondary" onClick={onClose}>Annuler</button><button className="btn-primary" disabled={!e.name.trim()} onClick={() => onSave(e)}>Créer</button></div>
    </Modal>
  )
}

function ContactModal({ onClose, onSave }: { onClose: () => void; onSave: (c: EventContact) => void }) {
  const [c, setC] = useState<EventContact>({ id: uid(), name: '', company: '', role: '', notes: '', status: 'a_recontacter' })
  return (
    <Modal title="Contact rencontré" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <label><div className="tag mb-1.5">Nom</div><input autoFocus className="field" value={c.name} onChange={(x) => setC({ ...c, name: x.target.value })} /></label>
        <label><div className="tag mb-1.5">Entreprise</div><input className="field" value={c.company} onChange={(x) => setC({ ...c, company: x.target.value })} /></label>
        <label className="col-span-2"><div className="tag mb-1.5">Fonction</div><input className="field" value={c.role} onChange={(x) => setC({ ...c, role: x.target.value })} /></label>
        <label className="col-span-2"><div className="tag mb-1.5">Besoin, contexte</div><input className="field" value={c.notes} onChange={(x) => setC({ ...c, notes: x.target.value })} placeholder="Ex. veut des vidéos pour recruter" /></label>
      </div>
      <div className="mt-5 flex justify-end gap-2"><button className="btn-secondary" onClick={onClose}>Annuler</button><button className="btn-primary" disabled={!c.name.trim() || !c.company.trim()} onClick={() => onSave(c)}>Ajouter</button></div>
    </Modal>
  )
}
