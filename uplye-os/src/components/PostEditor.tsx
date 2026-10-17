import { useState } from 'react'
import { CalendarCheck, ChatCircle, Copy, DotsThree, FolderSimple, Heart, Image as ImageIcon, Images, PaperPlaneTilt, Sparkle, Trash, UploadSimple, Warning, X } from '@phosphor-icons/react'
import { useStore } from '../store'
import type { SocialNetwork, SocialPost } from '../types'
import { uid } from '../utils'
import { BRANDS, BRAND_IDS, CAPTION_MAX, FORMATS, NetworkBadge, STATUS } from './social'

const dateValue = (iso: string) => { const d = new Date(iso); const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` }

// Création ou modification d'une publication. Pas d'étape de validation : le contenu est validé de vive voix.
export default function PostEditor({ post, onClose }: { post: SocialPost; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const [p, setP] = useState(post)
  const [preview, setPreview] = useState<SocialNetwork>(p.networks[0] ?? 'instagram')
  const [armed, setArmed] = useState(false)
  const exists = state.socialPosts.some((x) => x.id === p.id)
  const readOnly = p.status === 'published'
  const account = state.socialAccounts.find((a) => a.id === p.brand)
  const blocked = account?.status !== 'connected'
  const when = new Date(p.at)
  const label = `${when.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à ${when.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  const past = when.getTime() < Date.now()

  const save = (status: SocialPost['status']) => { dispatch({ type: 'upsert', coll: 'socialPosts', item: { ...p, status, caption: p.caption.slice(0, CAPTION_MAX) } }); onClose() }
  const toggleNet = (n: SocialNetwork) => setP({ ...p, networks: p.networks.includes(n) ? p.networks.filter((x) => x !== n) : [...p.networks, n] })
  const setDate = (v: string) => { const d = new Date(p.at); const [y, m, day] = v.split('-').map(Number); d.setFullYear(y!, m! - 1, day!); setP({ ...p, at: d.toISOString() }) }
  const setTime = (v: string) => { const d = new Date(p.at); const [h, mi] = v.split(':').map(Number); d.setHours(h!, mi!, 0, 0); setP({ ...p, at: d.toISOString() }) }
  const duplicate = () => { const d = new Date(Date.now() + 2 * 86400000); d.setHours(18, 30, 0, 0); setP({ ...p, id: uid(), status: 'draft', at: d.toISOString(), views: undefined, by: state.me }) }
  const project = state.projects.find((x) => x.id === p.projectId)
  const can = !readOnly && p.networks.length > 0 && p.caption.trim().length > 0

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-ink/45 p-4" onClick={onClose}>
      <div className="flex max-h-[94vh] w-[1040px] flex-col overflow-hidden rounded-[20px] bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-line px-6 py-4">
          <h2 className="font-title text-[32px] font-semibold uppercase leading-none">{exists ? (readOnly ? 'Publication' : 'Modifier le post') : 'Nouveau post'}</h2>
          <span className={`pill ${STATUS[p.status].pill}`}>{STATUS[p.status].label}</span>
          <span className="ml-auto text-[12px] text-ink2">{p.views ? `${p.views.toLocaleString('fr-FR')} vues` : ''}</span>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink2 hover:bg-hover" aria-label="Fermer"><X size={18} /></button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[1fr_340px] gap-8 overflow-y-auto px-6 py-6">
          <fieldset disabled={readOnly} className="min-w-0 space-y-5">
            <div><div className="tag mb-2">Marque</div>
              <div className="flex flex-wrap gap-2">{BRAND_IDS.map((b) => (
                <button key={b} onClick={() => setP({ ...p, brand: b })} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-medium ${p.brand === b ? BRANDS[b].chip : 'border-dashed border-line2 text-ink2'}`}>
                  <span className={`h-2 w-2 rounded-full ${BRANDS[b].dot}`} />{BRANDS[b].label}
                </button>))}</div>
            </div>
            <div><div className="tag mb-2">Publier sur</div>
              {(['instagram', 'facebook'] as const).map((n) => (
                <label key={n} className="flex items-center gap-2.5 py-1">
                  <input type="checkbox" className="h-4 w-4 accent-ink" checked={p.networks.includes(n)} onChange={() => toggleNet(n)} />
                  <NetworkBadge n={n} /><span className="font-semibold">{n === 'instagram' ? 'Instagram' : 'Facebook'}</span>
                  <span className="text-ink2">{(n === 'instagram' ? account?.instagram : account?.facebook) || 'non connecté'}</span>
                </label>))}
              {blocked && !readOnly && <div className="mt-2 flex items-center gap-2 rounded-xl bg-o1 px-3 py-2 text-[13px] text-o7"><Warning size={16} />Le compte {BRANDS[p.brand].label} est {account?.status === 'expired' ? 'à reconnecter' : 'déconnecté'} : tu peux préparer le post, mais il ne pourra pas être programmé.</div>}
            </div>
            <div><div className="tag mb-2">Format</div>
              <div className="inline-flex rounded-xl bg-hover p-1">{FORMATS.map((f) => (
                <button key={f.id} onClick={() => setP({ ...p, format: f.id, media: f.id === 'carrousel' ? Math.max(2, p.media) : Math.min(1, p.media) || 1 })} className={`rounded-lg px-3 py-1.5 text-[14px] ${p.format === f.id ? 'bg-surface font-semibold shadow-sm' : 'text-ink2'}`}>{f.label}</button>))}</div>
            </div>
            <div><div className="tag mb-2">Médias · {p.media} / {p.format === 'carrousel' ? 10 : 1}</div>
              <div className="flex flex-wrap gap-2.5">
                {Array.from({ length: p.media }, (_, i) => (
                  <div key={i} className="group relative grid h-[88px] w-[88px] place-items-center rounded-xl bg-hover text-ink2">
                    <div className="text-center"><ImageIcon size={22} className="mx-auto" /><div className="font-mono text-[11px]">{i + 1}</div></div>
                    {!readOnly && p.media > 1 && <button onClick={() => setP({ ...p, media: p.media - 1 })} className="absolute right-1 top-1 hidden rounded bg-surface p-0.5 group-hover:block" aria-label="Retirer"><X size={12} /></button>}
                  </div>))}
                {!readOnly && (p.format === 'carrousel' ? p.media < 10 : p.media < 1) && (
                  <button onClick={() => setP({ ...p, media: p.media + 1 })} className="grid h-[88px] w-[200px] place-items-center rounded-xl border border-dashed border-line2 text-[12px] text-ink2 hover:bg-hover">
                    <span className="text-center"><UploadSimple size={18} className="mx-auto" />Importer un fichier</span>
                  </button>)}
              </div>
              <label className="mt-2 flex items-center gap-2 text-[13px] text-ink2"><FolderSimple size={15} />Depuis le projet
                <select className="field !w-auto !py-1 text-[13px]" value={p.projectId ?? ''} onChange={(e) => setP({ ...p, projectId: e.target.value || undefined })}>
                  <option value="">Aucun</option>{state.projects.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select></label>
            </div>
            <div><div className="tag mb-2">Légende</div>
              <div className="rounded-xl border border-line2 bg-surface px-3.5 py-3 focus-within:border-ink">
                <textarea className="h-36 w-full resize-none bg-transparent outline-none" maxLength={CAPTION_MAX} value={p.caption} onChange={(e) => setP({ ...p, caption: e.target.value })} placeholder="Écris ta légende, avec les hashtags à la fin…" />
                <div className="flex items-center"><span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink2"><Sparkle size={15} />Améliorer avec l’IA <span className="font-normal">(bientôt)</span></span>
                  <span className={`ml-auto font-mono text-[11px] ${p.caption.length > CAPTION_MAX * 0.9 ? 'text-o7' : 'text-ink2'}`}>{p.caption.length} / {CAPTION_MAX}</span></div>
              </div>
            </div>
            <div><div className="tag mb-2">Programmation</div>
              <div className="flex gap-2.5">
                <input type="date" className="field !w-56" value={dateValue(p.at)} onChange={(e) => e.target.value && setDate(e.target.value)} />
                <input type="time" className="field !w-32" value={new Date(p.at).toTimeString().slice(0, 5)} onChange={(e) => e.target.value && setTime(e.target.value)} />
              </div>
              <div className="mt-1.5 text-[12px] text-ink2">{past && !readOnly ? 'Date passée : le post partira dès que tu le programmes.' : 'Meilleur créneau d’après vos statistiques : 18:00 – 19:30'}</div>
            </div>
          </fieldset>

          <div className="space-y-3">
            <div className="flex gap-1">{(['instagram', 'facebook'] as const).map((n) => (
              <button key={n} onClick={() => setPreview(n)} className={`rounded-full border px-3 py-1 text-[13px] ${preview === n ? 'border-ink bg-accent font-semibold' : 'border-line'}`}>{n === 'instagram' ? 'Instagram' : 'Facebook'}</button>))}</div>
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              <div className="flex items-center gap-2 px-3 py-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-side text-[12px] font-bold text-accent">{BRANDS[p.brand].initial}</span>
                <span className="font-semibold">{preview === 'instagram' ? (account?.instagram || '@compte').replace('@', '') : (account?.facebook || 'Page')}</span>
                <DotsThree size={18} className="ml-auto" />
              </div>
              <div className={`grid place-items-center bg-hover text-ink2 ${p.format === 'story' || p.format === 'reel' ? 'aspect-[9/14]' : 'aspect-square'}`}>
                <div className="text-center">{p.format === 'carrousel' ? <Images size={40} className="mx-auto" /> : <ImageIcon size={40} className="mx-auto" />}<div className="mt-1 font-mono text-[11px]">{p.format === 'carrousel' ? `1 / ${p.media}` : FORMATS.find((f) => f.id === p.format)!.label}</div></div>
              </div>
              <div className="flex gap-3.5 px-3 pt-2.5"><Heart size={22} /><ChatCircle size={22} /><PaperPlaneTilt size={22} /></div>
              <p className="line-clamp-3 px-3 pb-3.5 pt-2 text-[13px]"><b>{preview === 'instagram' ? (account?.instagram || '@compte').replace('@', '') : account?.facebook} </b>{p.caption || 'Ta légende apparaîtra ici.'}</p>
            </div>
            <div className="text-[12px] text-ink2">Aperçu indicatif : le rendu final dépend de l’appli.{project && <> Médias du projet « {project.name} ».</>}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-line bg-app px-6 py-4">
          {exists && !readOnly && (
            <button className={`btn-ghost ${armed ? 'text-r7' : ''}`} onClick={() => { if (armed) { dispatch({ type: 'remove', coll: 'socialPosts', id: p.id }); onClose() } else { setArmed(true); setTimeout(() => setArmed(false), 3000) } }}>
              <Trash size={16} />{armed ? 'Confirmer la suppression' : 'Supprimer'}
            </button>)}
          {readOnly && <button className="btn-secondary" onClick={duplicate}><Copy size={16} />Dupliquer en brouillon</button>}
          <span className="flex-1" />
          {!readOnly && <button className="btn-secondary" disabled={!p.caption.trim()} onClick={() => save('draft')}>Enregistrer le brouillon</button>}
          {!readOnly && (
            <button className="btn-primary" disabled={!can || blocked} title={blocked ? 'Reconnecte le compte dans « Comptes connectés »' : undefined} onClick={() => save('scheduled')}>
              {past ? <><PaperPlaneTilt size={16} />Publier maintenant</> : <><CalendarCheck size={16} />Programmer le {label}</>}
            </button>)}
        </div>
      </div>
    </div>
  )
}
