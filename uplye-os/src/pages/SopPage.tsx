import { useState } from 'react'
import { Plus, Play, PencilSimple, Trash, Check, ArrowUp, ArrowDown, Clock, Target } from '@phosphor-icons/react'
import { useStore } from '../store'
import type { Sop, SopRun } from '../types'
import { PEOPLE, fmtDate, uid } from '../utils'
import { PersonAvatar } from '../components/ui'

const CATS: Sop['category'][] = ['Commercial', 'Production', 'Azurpod', 'Équipe', 'Admin']

export default function SopPage() {
  const { state, dispatch } = useStore()
  const admin = state.me !== 'X'
  const [sel, setSel] = useState(state.sops[0]?.id ?? '')
  const [editing, setEditing] = useState(false)
  const [q, setQ] = useState('')
  const [runLabel, setRunLabel] = useState('')
  const sop = state.sops.find((s) => s.id === sel)
  const save = (s: Sop) => dispatch({ type: 'upsert', coll: 'sops', item: { ...s, updatedAt: new Date().toISOString() } })
  const runs = state.runs.filter((r) => r.sopId === sel)
  const list = state.sops.filter((s) => `${s.title} ${s.goal}`.toLowerCase().includes(q.toLowerCase()))
  const newSop = () => { const s: Sop = { id: uid(), title: 'Nouveau process', category: 'Production', goal: '', owner: state.me, duration: '', updatedAt: new Date().toISOString(), steps: [{ id: uid(), text: 'Première étape' }] }; save(s); setSel(s.id); setEditing(true) }
  const start = () => { if (!sop) return; dispatch({ type: 'upsert', coll: 'runs', item: { id: uid(), sopId: sop.id, label: runLabel || `${sop.title} · ${fmtDate(new Date().toISOString())}`, startedAt: new Date().toISOString(), done: [], by: state.me } }); setRunLabel('') }
  const tick = (r: SopRun, stepId: string) => dispatch({ type: 'upsert', coll: 'runs', item: { ...r, done: r.done.includes(stepId) ? r.done.filter((x) => x !== stepId) : [...r.done, stepId] } })
  const move = (i: number, dir: -1 | 1) => { if (!sop) return; const st = [...sop.steps]; const j = i + dir; if (j < 0 || j >= st.length) return; [st[i], st[j]] = [st[j]!, st[i]!]; save({ ...sop, steps: st }) }

  return (
    <div className="flex h-full">
      <div className="w-[320px] shrink-0 overflow-y-auto border-r border-line bg-surface px-5 py-8">
        <div className="flex items-center"><h1 className="h-page flex-1 !text-[34px]">Process</h1>{admin && <button className="btn-secondary !px-2.5 !py-1.5" onClick={newSop} title="Nouveau process"><Plus size={16} /></button>}</div>
        <p className="mt-1 text-[13px] text-ink2">Comment on fait les choses chez Uplye, étape par étape.</p>
        <input className="field mt-4" placeholder="Rechercher un process…" value={q} onChange={(e) => setQ(e.target.value)} />
        {CATS.map((c) => {
          const items = list.filter((s) => s.category === c)
          if (!items.length) return null
          return (
            <div key={c} className="mt-5">
              <div className="tag mb-1.5">{c}</div>
              {items.map((s) => (
                <button key={s.id} onClick={() => { setSel(s.id); setEditing(false) }} className={`mb-1 w-full rounded-xl px-3 py-2 text-left ${sel === s.id ? 'bg-accent' : 'hover:bg-hover'}`}>
                  <div className="font-medium leading-snug">{s.title}</div>
                  <div className="text-[12px] text-ink2">{s.steps.length} étapes{s.duration ? ` · ${s.duration}` : ''}</div>
                </button>
              ))}
            </div>
          )
        })}
      </div>

      {sop && (
        <div className="min-w-0 flex-1 overflow-y-auto px-10 py-8">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="tag">{sop.category} · mis à jour le {fmtDate(sop.updatedAt, { day: 'numeric', month: 'long' })}</div>
              {editing ? <input className="field mt-2 !text-[22px] font-semibold" value={sop.title} onChange={(e) => save({ ...sop, title: e.target.value })} />
                : <h2 className="h-page mt-2 !text-[40px]">{sop.title}</h2>}
            </div>
            {admin && <button className="btn-secondary" onClick={() => setEditing(!editing)}>{editing ? <><Check size={16} />Terminer</> : <><PencilSimple size={16} />Modifier</>}</button>}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="card col-span-2 flex gap-3 p-4"><Target size={20} className="mt-0.5 shrink-0" /><div className="flex-1"><div className="tag">Objectif</div>
              {editing ? <input className="field mt-1" value={sop.goal} onChange={(e) => save({ ...sop, goal: e.target.value })} /> : <div className="mt-1 font-medium">{sop.goal || '—'}</div>}</div></div>
            <div className="card flex items-center gap-3 p-4"><PersonAvatar p={sop.owner} size={32} /><div><div className="tag">Responsable</div><div className="font-medium">{PEOPLE[sop.owner].name}</div>
              <div className="flex items-center gap-1 text-[12px] text-ink2"><Clock size={12} />{editing ? <input className="w-24 bg-transparent" value={sop.duration} onChange={(e) => save({ ...sop, duration: e.target.value })} placeholder="Durée" /> : sop.duration}</div></div></div>
          </div>
          {editing && (
            <div className="mt-3 flex gap-3">
              <select className="field !w-auto" value={sop.category} onChange={(e) => save({ ...sop, category: e.target.value as Sop['category'] })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
              <select className="field !w-auto" value={sop.owner} onChange={(e) => save({ ...sop, owner: e.target.value as Sop['owner'] })}>{Object.entries(PEOPLE).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}</select>
              <button className="btn-ghost ml-auto text-r7" onClick={() => { dispatch({ type: 'remove', coll: 'sops', id: sop.id }); setSel(state.sops.find((s) => s.id !== sop.id)?.id ?? '') }}><Trash size={16} />Supprimer le process</button>
            </div>
          )}

          <div className="card mt-5 p-5">
            <div className="h-sec">Les étapes</div>
            <ol className="mt-4 space-y-3">
              {sop.steps.map((st, i) => (
                <li key={st.id} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent font-semibold">{i + 1}</span>
                  {editing ? (
                    <div className="flex-1 space-y-1.5">
                      <input className="field" value={st.text} onChange={(e) => save({ ...sop, steps: sop.steps.map((x) => (x.id === st.id ? { ...x, text: e.target.value } : x)) })} />
                      <input className="field !text-[13px]" value={st.detail ?? ''} placeholder="Détail, script, exemple (facultatif)" onChange={(e) => save({ ...sop, steps: sop.steps.map((x) => (x.id === st.id ? { ...x, detail: e.target.value } : x)) })} />
                    </div>
                  ) : (
                    <div className="flex-1 pt-0.5"><div className="font-medium">{st.text}</div>{st.detail && <div className="mt-0.5 text-[14px] text-ink2">{st.detail}</div>}</div>
                  )}
                  {editing && <div className="flex flex-col"><button onClick={() => move(i, -1)} className="p-1 text-ink2"><ArrowUp size={14} /></button><button onClick={() => move(i, 1)} className="p-1 text-ink2"><ArrowDown size={14} /></button></div>}
                  {editing && <button onClick={() => save({ ...sop, steps: sop.steps.filter((x) => x.id !== st.id) })} className="self-start p-1 text-ink2 hover:text-r7"><Trash size={15} /></button>}
                </li>
              ))}
            </ol>
            {editing && <button className="mt-3 flex items-center gap-1.5 font-semibold" onClick={() => save({ ...sop, steps: [...sop.steps, { id: uid(), text: 'Nouvelle étape' }] })}><Plus size={15} />Ajouter une étape</button>}
          </div>

          <div className="card mt-5 p-5">
            <div className="flex items-center gap-3"><div className="h-sec flex-1">Suivre ce process</div>
              <input className="field !w-72" value={runLabel} onChange={(e) => setRunLabel(e.target.value)} placeholder="Ex. Onboarding Lucas · R1 Hôtel Les Pins" />
              <button className="btn-primary" onClick={start}><Play size={16} weight="fill" />Lancer</button></div>
            <p className="mt-1 text-[13px] text-ink2">Lance une checklist à partir du process (pour un client, un nouveau membre…) et coche les étapes au fur et à mesure.</p>
            <div className="mt-4 space-y-3">
              {runs.map((r) => {
                const done = sop.steps.filter((s) => r.done.includes(s.id)).length
                return (
                  <div key={r.id} className="rounded-xl border border-line p-4">
                    <div className="flex items-center gap-3"><div className="flex-1"><div className="font-semibold">{r.label}</div><div className="text-[12px] text-ink2">Lancé le {fmtDate(r.startedAt)} par {PEOPLE[r.by].name}</div></div>
                      <span className={`pill ${done === sop.steps.length ? 'bg-g1 text-g7' : 'bg-hover'}`}>{done} / {sop.steps.length}</span>
                      {admin && <button onClick={() => dispatch({ type: 'remove', coll: 'runs', id: r.id })} className="text-ink2 hover:text-r7"><Trash size={14} /></button>}</div>
                    <div className="mt-2 h-1.5 rounded-full bg-app"><div className="h-full rounded-full bg-g7" style={{ width: `${(done / Math.max(1, sop.steps.length)) * 100}%` }} /></div>
                    <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5">
                      {sop.steps.map((s, i) => (
                        <label key={s.id} className="flex cursor-pointer items-start gap-2 text-[13px]"><input type="checkbox" className="mt-0.5 accent-ink" checked={r.done.includes(s.id)} onChange={() => tick(r, s.id)} />
                          <span className={r.done.includes(s.id) ? 'text-ink2 line-through' : ''}>{i + 1}. {s.text}</span></label>
                      ))}
                    </div>
                  </div>
                )
              })}
              {!runs.length && <div className="text-[14px] text-ink2">Aucun suivi en cours pour ce process.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
