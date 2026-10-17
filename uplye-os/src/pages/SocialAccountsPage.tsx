import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowsClockwise, PlugsConnected, ShieldCheck } from '@phosphor-icons/react'
import { useStore } from '../store'
import type { SocialAccount } from '../types'
import { fmtDate } from '../utils'
import { BRANDS, BRAND_IDS, NetworkBadge } from '../components/social'

const STATE: Record<SocialAccount['status'], { label: string; cls: string; action: string }> = {
  connected: { label: 'Connecté', cls: 'bg-g1 text-g7', action: 'Déconnecter' },
  expired: { label: 'À reconnecter', cls: 'bg-o1 text-o7', action: 'Reconnecter' },
  disconnected: { label: 'Déconnecté', cls: 'bg-hover text-ink2', action: 'Connecter' },
}
const HANDLES: Record<string, [string, string]> = { studio: ['@uplyestudio', 'Uplye Studio'], azurpod: ['@azurpod.studio', 'Azurpod'], academy: ['@uplye.academy', 'Uplye Academy'] }

// Connexion simulée : en vrai, passage par la connexion Facebook (Meta) côté serveur, accès chiffrés, jamais dans le navigateur.
export default function SocialAccountsPage() {
  const { state, dispatch } = useStore()
  const admin = state.me !== 'X'
  const act = (a: SocialAccount) => {
    const item: SocialAccount = a.status === 'connected'
      ? { ...a, status: 'disconnected', expiresAt: undefined }
      : { ...a, status: 'connected', instagram: a.instagram || HANDLES[a.id]![0], facebook: a.facebook || HANDLES[a.id]![1], expiresAt: new Date(Date.now() + 60 * 86400000).toISOString() }
    dispatch({ type: 'upsert', coll: 'socialAccounts', item })
  }
  const lastPost = (id: string) => state.socialPosts.filter((p) => p.brand === id && p.status === 'published').sort((a, b) => b.at.localeCompare(a.at))[0]

  return (
    <div className="px-10 py-8">
      <Link to="/social" className="tag flex items-center gap-1 hover:text-ink"><ArrowLeft size={12} />Réseaux sociaux</Link>
      <h1 className="h-page mt-2">Comptes connectés</h1>
      <div className="mt-1 text-ink2">Un compte Instagram professionnel et sa Page Facebook par marque.</div>
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_360px] items-start gap-6">
        <div className="space-y-3">
          {BRAND_IDS.map((id) => {
            const a = state.socialAccounts.find((x) => x.id === id) ?? { id, instagram: '', facebook: '', status: 'disconnected' as const }
            const last = lastPost(id)
            return (
              <div key={id} className="card flex items-center gap-3 p-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-side font-title text-[20px] font-semibold text-accent">{BRANDS[id].initial}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 font-semibold">{BRANDS[id].label}{a.instagram && <NetworkBadge n="instagram" />}{a.facebook && <NetworkBadge n="facebook" />}</div>
                  <div className="text-[13px] text-ink2">
                    {a.status === 'disconnected' ? 'Aucun compte connecté'
                      : `${a.instagram} · Page ${a.facebook} · ${a.status === 'expired' ? `autorisation expirée le ${fmtDate(a.expiresAt, { day: 'numeric', month: 'short' })}` : `valable jusqu’au ${fmtDate(a.expiresAt, { day: 'numeric', month: 'short' })}${last ? ` · dernière publication ${fmtDate(last.at)}` : ''}`}`}
                  </div>
                </div>
                <span className={`pill ${STATE[a.status].cls}`}>{STATE[a.status].label}</span>
                <button className={a.status === 'connected' ? 'btn-ghost' : 'btn-secondary'} disabled={!admin} title={admin ? undefined : 'Réservé à Enzo et Allan'} onClick={() => act(a)}>
                  {a.status === 'expired' ? <ArrowsClockwise size={16} /> : a.status === 'disconnected' ? <PlugsConnected size={16} /> : null}{STATE[a.status].action}
                </button>
              </div>)
          })}
          <div className="card space-y-3 p-5">
            <div className="h-sec">Comment ça marche</div>
            {[
              [PlugsConnected, 'On se connecte avec le compte Facebook qui administre la Page. Le compte Instagram doit être professionnel et relié à cette Page.'],
              [ArrowsClockwise, 'Meta demande de renouveler l’autorisation environ tous les 60 jours. L’OS prévient avant, puis les posts du compte concerné ne partent plus.'],
              [ShieldCheck, 'Les accès sont stockés chiffrés côté serveur, jamais dans le navigateur. Seuls Enzo et Allan peuvent connecter ou retirer un compte.'],
            ].map(([Icon, t], i) => { const I = Icon as typeof ShieldCheck; return <div key={i} className="flex gap-3 text-ink2"><I size={18} className="mt-0.5 shrink-0 text-ink" />{t as string}</div> })}
          </div>
        </div>
        <div className="card p-5">
          <div className="h-sec">Qui fait quoi</div>
          <div className="mt-3 divide-y divide-line border-t border-line">
            {[['Préparer un post', 'Tous'], ['Programmer un post', 'Tous'], ['Publier tout de suite', 'Tous'], ['Supprimer un post', 'Tous'], ['Connecter un compte', 'Enzo, Allan']].map(([a, w]) => (
              <div key={a} className="flex items-center py-2.5"><span className="flex-1">{a}</span><span className={`pill ${w === 'Tous' ? 'bg-g1 text-g7' : 'bg-accent text-ink'}`}>{w}</span></div>))}
          </div>
          <p className="mt-3 text-[13px] text-ink2">Pas de validation dans l’outil : les posts sont validés de vive voix avant d’être programmés. Seule la connexion des comptes est réservée aux admins, pour la sécurité des accès.</p>
        </div>
      </div>
    </div>
  )
}
