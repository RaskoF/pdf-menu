import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CaretLeft, CaretRight, Check, Image as ImageIcon, PlugsConnected, Plus, Warning } from '@phosphor-icons/react'
import { useStore } from '../store'
import type { SocialBrand, SocialPost } from '../types'
import { fmtDate, uid } from '../utils'
import { BRANDS, BRAND_IDS, FORMATS, NetworkBadge, STATUS, hhmm, sameDay } from '../components/social'
import PostEditor from '../components/PostEditor'

type View = 'mois' | 'semaine' | 'liste'
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const readLS = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d } catch { return d } }
const writeLS = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignoré */ } }
const monday = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x }

function Mini({ p, onOpen }: { p: SocialPost; onOpen: () => void }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onOpen() }} title={p.caption}
      className={`flex w-full items-center gap-1 rounded-md border px-1.5 py-0.5 text-left text-[12px] hover:ring-1 hover:ring-ink/30 ${STATUS[p.status].mini}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${BRANDS[p.brand].dot}`} />
      <span className="font-mono text-[11px]">{hhmm(p.at)}</span>
      <span className="truncate">{p.caption}</span>
    </button>
  )
}

function Card({ p, onOpen, compact, blocked }: { p: SocialPost; onOpen: () => void; compact?: boolean; blocked?: boolean }) {
  return (
    <button onClick={onOpen} className={`w-full rounded-xl border bg-surface p-2.5 text-left hover:border-ink/40 ${p.status === 'draft' ? 'border-dashed border-line2' : p.status === 'failed' ? 'border-r7/50' : 'border-line'}`}>
      <div className="flex gap-2">
        {!compact && <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-hover text-ink2"><ImageIcon size={18} /></div>}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1"><span className="font-mono text-[11px] text-ink2">{hhmm(p.at)}</span>{p.networks.map((n) => <NetworkBadge key={n} n={n} size={15} />)}</div>
          <div className="line-clamp-2 text-[12px] leading-snug">{p.caption}</div>
        </div>
      </div>
      {blocked && p.status === 'scheduled' && <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-o7"><Warning size={12} />Compte à reconnecter</div>}
      <div className={`mt-2 flex items-center gap-1 ${compact ? 'flex-wrap' : ''}`}>
        <span className="pill bg-hover !text-[11px]">{FORMATS.find((f) => f.id === p.format)!.label}</span>
        <span className={`pill !text-[11px] ${compact ? '' : 'ml-auto'} ${STATUS[p.status].pill}`}>{STATUS[p.status].label}</span>
      </div>
    </button>
  )
}

export default function SocialPage() {
  const { state, dispatch } = useStore()
  const [view, setView] = useState<View>(() => readLS('social-view', 'mois'))
  const [brands, setBrands] = useState<SocialBrand[]>(() => readLS('social-brands', BRAND_IDS))
  const [offset, setOffset] = useState(0)
  const [edit, setEdit] = useState<SocialPost | null>(null)
  useEffect(() => writeLS('social-view', view), [view])
  useEffect(() => writeLS('social-brands', brands), [brands])

  // Simulation de l'envoi : un post programmé dont l'heure est passée part, ou échoue si le compte est déconnecté.
  useEffect(() => {
    for (const p of state.socialPosts) {
      if (p.status !== 'scheduled' || new Date(p.at).getTime() > Date.now()) continue
      const ok = state.socialAccounts.find((a) => a.id === p.brand)?.status === 'connected'
      dispatch({ type: 'upsert', coll: 'socialPosts', item: { ...p, status: ok ? 'published' : 'failed', views: ok ? 0 : undefined } })
    }
  }, [state.socialPosts, state.socialAccounts, dispatch])

  const posts = useMemo(() => state.socialPosts.filter((p) => brands.includes(p.brand)).sort((a, b) => a.at.localeCompare(b.at)), [state.socialPosts, brands])
  const today = new Date()
  const blockedBrand = (b: SocialBrand) => state.socialAccounts.find((a) => a.id === b)?.status !== 'connected'
  const newPost = (day?: Date) => {
    const d = day ? new Date(day) : new Date(Date.now() + 86400000); d.setHours(18, 30, 0, 0)
    setEdit({ id: uid(), brand: brands[0] ?? 'studio', networks: ['instagram', 'facebook'], format: 'reel', caption: '', at: d.toISOString(), status: 'draft', media: 1, by: state.me })
  }
  const toggle = (b: SocialBrand) => setBrands(brands.includes(b) ? brands.filter((x) => x !== b) : [...brands, b])

  // période affichée
  const base = new Date(today.getFullYear(), today.getMonth() + (view === 'mois' ? offset : 0), 1)
  const weekStart = monday(new Date(Date.now() + (view === 'semaine' ? offset * 7 : 0) * 86400000))
  const gridStart = monday(base)
  const weeks = Math.ceil((((base.getDay() + 6) % 7) + new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate()) / 7)
  const title = view === 'mois' ? base.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : view === 'semaine' ? `Semaine du ${fmtDate(weekStart.toISOString(), { day: 'numeric', month: 'long' })}` : 'Toutes les publications'
  const on = (d: Date) => posts.filter((p) => sameDay(new Date(p.at), d))

  const next7 = posts.filter((p) => p.status === 'scheduled' && new Date(p.at) > today && new Date(p.at).getTime() < Date.now() + 7 * 86400000).slice(0, 4)
  const issues = state.socialAccounts.filter((a) => a.status !== 'connected')
  const wk = monday(today), wkEnd = new Date(wk.getTime() + 7 * 86400000)
  const thisWeek = state.socialPosts.filter((p) => new Date(p.at) >= wk && new Date(p.at) < wkEnd)
  const best = [...state.socialPosts].filter((p) => p.views && Date.now() - new Date(p.at).getTime() < 7 * 86400000).sort((a, b) => (b.views ?? 0) - (a.views ?? 0))[0]
  const count = (s: SocialPost['status']) => posts.filter((p) => p.status === s && (s !== 'published' || new Date(p.at) >= wk)).length

  return (
    <div className="px-10 py-8">
      <div className="flex items-end gap-3">
        <div className="flex-1"><h1 className="h-page">Réseaux sociaux</h1><div className="mt-1 text-ink2">Uplye Studio, Azurpod et Uplye Academy · Instagram et Facebook</div></div>
        <Link to="/social/comptes" className="btn-secondary"><PlugsConnected size={18} />Comptes connectés</Link>
        <button className="btn-primary" onClick={() => newPost()}><Plus size={18} weight="bold" />Nouveau post</button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {BRAND_IDS.map((b) => (
          <button key={b} onClick={() => toggle(b)} aria-pressed={brands.includes(b)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-medium ${brands.includes(b) ? BRANDS[b].chip : 'border-dashed border-line2 text-ink2'}`}>
            {brands.includes(b) ? <Check size={12} weight="bold" /> : <span className={`h-2 w-2 rounded-full ${BRANDS[b].dot}`} />}{BRANDS[b].label}
          </button>))}
        <span className="ml-auto text-[13px] text-ink2">{count('scheduled')} programmés · {count('draft')} brouillons{count('failed') ? ` · ${count('failed')} échec` : ''}</span>
        {view !== 'liste' && <div className="flex items-center gap-1 rounded-xl border border-line bg-surface px-1.5 py-1">
          <button className="rounded p-1 hover:bg-hover" onClick={() => setOffset(offset - 1)} aria-label="Précédent"><CaretLeft size={16} /></button>
          <button className={`min-w-40 px-2 font-semibold ${view === 'mois' ? 'capitalize' : ''}`} onClick={() => setOffset(0)}>{title}</button>
          <button className="rounded p-1 hover:bg-hover" onClick={() => setOffset(offset + 1)} aria-label="Suivant"><CaretRight size={16} /></button>
        </div>}
        <div className="flex rounded-xl bg-hover p-1">{(['mois', 'semaine', 'liste'] as View[]).map((v) => (
          <button key={v} onClick={() => { setView(v); setOffset(0) }} className={`rounded-lg px-3 py-1 text-[14px] capitalize ${view === v ? 'bg-surface font-semibold shadow-sm' : 'text-ink2'}`}>{v}</button>))}</div>
      </div>

      <div className={`mt-5 grid items-start gap-5 ${view === 'semaine' ? 'grid-cols-1' : 'grid-cols-[minmax(0,1fr)_300px]'}`}>
        <div className="min-w-0">
          {view === 'mois' && (
            <div className="overflow-hidden rounded-2xl border border-line">
              <div className="grid grid-cols-7 bg-surface">{DAYS.map((d) => <div key={d} className="tag px-2.5 py-2">{d}</div>)}</div>
              <div className="grid grid-cols-7">
                {Array.from({ length: weeks * 7 }, (_, i) => {
                  const d = new Date(gridStart); d.setDate(gridStart.getDate() + i)
                  const out = d.getMonth() !== base.getMonth(), isToday = sameDay(d, today), we = i % 7 >= 5
                  const items = on(d)
                  return (
                    <div key={i} onClick={() => newPost(d)} className={`group min-h-[120px] cursor-pointer border-r border-t border-line p-1.5 [&:nth-child(7n)]:border-r-0 ${out || we ? 'bg-app' : 'bg-surface'}`}>
                      <div className="flex items-center">
                        <span className={`rounded-full px-1.5 font-mono text-[11px] ${isToday ? 'bg-accent font-semibold' : out ? 'text-ink2/50' : ''}`}>{d.getDate()}</span>
                        <Plus size={13} className="ml-auto text-ink2 opacity-0 group-hover:opacity-100" />
                      </div>
                      <div className="mt-1 space-y-1">{items.slice(0, 3).map((p) => <Mini key={p.id} p={p} onOpen={() => setEdit(p)} />)}
                        {items.length > 3 && <div className="px-1 text-[11px] text-ink2">+ {items.length - 3} autres</div>}</div>
                    </div>)
                })}
              </div>
            </div>)}

          {view === 'semaine' && (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }, (_, i) => {
                const d = new Date(weekStart); d.setDate(weekStart.getDate() + i)
                return (
                  <div key={i} className="min-w-0">
                    <div className={`mb-2 rounded-lg px-2 py-1 text-[13px] ${sameDay(d, today) ? 'bg-accent font-semibold' : 'text-ink2'}`}>{DAYS[i]} {d.getDate()}</div>
                    <div className="space-y-2">{on(d).map((p) => <Card key={p.id} p={p} compact blocked={blockedBrand(p.brand)} onOpen={() => setEdit(p)} />)}
                      <button onClick={() => newPost(d)} className="w-full rounded-xl border border-dashed border-line2 py-2 text-[12px] text-ink2 hover:bg-hover">+ Ajouter</button></div>
                  </div>)
              })}
            </div>)}

          {view === 'liste' && (
            <div className="card divide-y divide-line">
              {[...posts].reverse().map((p) => (
                <button key={p.id} onClick={() => setEdit(p)} className="flex w-full items-center gap-4 px-5 py-3 text-left hover:bg-hover/40">
                  <span className="w-32 text-[13px] text-ink2">{fmtDate(p.at, { weekday: 'short', day: 'numeric', month: 'short' })} · {hhmm(p.at)}</span>
                  <span className={`h-2 w-2 rounded-full ${BRANDS[p.brand].dot}`} />
                  <span className="min-w-0 flex-1 truncate">{p.caption}</span>
                  <span className="flex gap-1">{p.networks.map((n) => <NetworkBadge key={n} n={n} />)}</span>
                  <span className="pill bg-hover !text-[12px]">{FORMATS.find((f) => f.id === p.format)!.label}</span>
                  <span className={`pill w-24 justify-center ${STATUS[p.status].pill}`}>{STATUS[p.status].label}</span>
                  <span className="w-20 text-right text-[13px] text-ink2">{p.views ? `${p.views.toLocaleString('fr-FR')} vues` : ''}</span>
                </button>))}
              {!posts.length && <div className="p-10 text-center text-ink2">Aucune publication pour ces marques.</div>}
            </div>)}
        </div>

        {view !== 'semaine' && <div className="space-y-4">
          <div className="card space-y-3 p-4">
            <div className="flex items-center gap-2"><div className="h-sec">Prochaines publications</div><span className="pill bg-b1 text-b7">{next7.length}</span></div>
            <div className="text-[13px] text-ink2">Ce qui part dans les 7 prochains jours.</div>
            {next7.map((p) => <div key={p.id}><div className="tag mb-1">{BRANDS[p.brand].label} · {fmtDate(p.at, { weekday: 'short', day: 'numeric' })}</div><Card p={p} blocked={blockedBrand(p.brand)} onOpen={() => setEdit(p)} /></div>)}
            {!next7.length && <div className="text-[13px] text-ink2">Rien de programmé cette semaine.</div>}
          </div>
          {issues.map((a) => (
            <div key={a.id} className={`space-y-2 rounded-2xl p-4 ${a.status === 'expired' ? 'bg-r1 text-r7' : 'bg-hover text-ink'}`}>
              <div className="flex items-center gap-2 font-semibold"><Warning size={16} />{BRANDS[a.id].label} · {a.status === 'expired' ? 'Instagram à reconnecter' : 'non connecté'}</div>
              <div className="text-[13px]">{a.status === 'expired' ? `L’autorisation Meta a expiré le ${fmtDate(a.expiresAt, { day: 'numeric', month: 'short' })}. Les posts de cette marque ne partent plus.` : 'Connecte le compte pour programmer des posts.'}</div>
              <Link to="/social/comptes" className="inline-block rounded-lg bg-surface px-3 py-1.5 text-[13px] font-semibold text-ink">{a.status === 'expired' ? 'Reconnecter le compte' : 'Connecter'}</Link>
            </div>))}
          <div className="card space-y-2 p-4">
            <div className="tag">Cette semaine</div>
            {[['Publiés', thisWeek.filter((p) => p.status === 'published').length], ['Programmés', thisWeek.filter((p) => p.status === 'scheduled').length], ['Brouillons', thisWeek.filter((p) => p.status === 'draft').length]].map(([k, v]) => (
              <div key={k} className="flex justify-between text-[14px]"><span className="text-ink2">{k}</span><b>{v}</b></div>))}
            {best && <div className="border-t border-line pt-2 text-[13px]"><div className="text-ink2">Meilleur post</div><div className="font-semibold">{best.caption.slice(0, 40)}{best.caption.length > 40 ? '…' : ''} · {best.views?.toLocaleString('fr-FR')} vues</div></div>}
          </div>
        </div>}
      </div>
      {edit && <PostEditor post={edit} onClose={() => setEdit(null)} />}
    </div>
  )
}
