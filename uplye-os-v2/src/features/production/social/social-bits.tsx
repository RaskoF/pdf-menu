import { FacebookLogo, Image as ImageIcon, InstagramLogo, LinkedinLogo } from '@phosphor-icons/react'
import { Badge, Button, Dialog, DialogContent } from '@/components/ui'
import { formatShortDate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { useProduction } from '../store'
import { BRAND_LABEL, displayStatus, FORMAT_LABEL, NETWORK_LABEL, POST_STATUS_BADGE } from '../lib'
import type { Network, ProductionBrand, SocialPost } from '../types'

const ICONS = { instagram: InstagramLogo, facebook: FacebookLogo, linkedin: LinkedinLogo } as const

export function NetworkIcon({ network, className }: { network: Network; className?: string }) {
  const Icon = ICONS[network]
  return <Icon className={cn('size-3.5', className)} aria-label={NETWORK_LABEL[network]} />
}

// Figma : « Post Card » (62:487)
export function PostCard({ post, onOpen, draft = false }: { post: SocialPost; onOpen: () => void; draft?: boolean }) {
  const { data } = useProduction()
  const status = displayStatus(post, data?.accounts ?? [])
  const badge = POST_STATUS_BADGE[status]
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'focus-ring flex w-full flex-col gap-2 rounded-lg p-2 text-left transition-colors hover:bg-surface-hover',
        draft ? 'border border-dashed border-line-strong' : 'bg-card',
        status === 'bloque' && 'ring-1 ring-danger',
      )}
    >
      <span className="relative grid aspect-[4/3] place-content-center rounded-md bg-gradient-to-b from-surface-2 to-surface-1 text-muted-foreground">
        <ImageIcon className="size-4" aria-hidden />
        <span className="absolute left-2 top-2 rounded-xs bg-background/80 px-1.5 py-0.5 text-body-xs text-foreground">{FORMAT_LABEL[post.format]}</span>
      </span>
      <span className="flex items-center justify-between px-1 text-body-xs text-muted-foreground">
        {post.time ?? 'sans date'}
        <span className="flex gap-1">
          {post.networks.map((n) => (
            <NetworkIcon key={n} network={n} />
          ))}
        </span>
      </span>
      <span className="line-clamp-2 px-1 text-label-sm text-foreground">{post.title}</span>
      <Badge variant={badge.variant} className="ml-1 w-fit">
        {badge.label}
      </Badge>
    </button>
  )
}

/** Comptes déconnectés : bandeau d'alerte au-dessus du calendrier (Figma 67:690) */
export function DisconnectedBanner({ onReconnect }: { onReconnect: (brand: ProductionBrand, network: Network) => void }) {
  const { data } = useProduction()
  const off = (data?.accounts ?? []).filter((a) => !a.connected)
  if (!off.length || off.length === data?.accounts.length) return null
  const first = off[0]!
  const blocked = (data?.posts ?? []).filter((p) => displayStatus(p, data?.accounts ?? []) === 'bloque')
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-lg bg-danger-tone px-5 py-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span aria-hidden className="mt-0.5 grid size-5 place-content-center rounded-full border border-danger text-body-xs text-danger">
          !
        </span>
        <div>
          <p className="text-title-sm text-danger">
            {NETWORK_LABEL[first.network]} {BRAND_LABEL[first.brand]} est déconnecté
            {first.disconnectedSince ? ` depuis le ${formatShortDate(first.disconnectedSince)}` : ''}
            {off.length > 1 ? `, et ${off.length - 1} autre${off.length > 2 ? 's' : ''}` : ''}.
          </p>
          <p className="text-body-sm text-foreground">
            {blocked.length
              ? `${blocked.length > 1 ? `${blocked.length} posts programmés ne partiront pas` : 'Le post programmé ne partira pas'} tant que le compte n’est pas reconnecté.`
              : 'Aucun post programmé n’est concerné pour l’instant.'}
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={() => onReconnect(first.brand, first.network)}>
        Reconnecter le compte
      </Button>
    </div>
  )
}

/** Connexion des comptes : réservée aux admins (décision du 19 oct.) */
export function AccountsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data, actions } = useProduction()
  const brands: ProductionBrand[] = ['studio', 'azurpod', 'academy']
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[560px]"
        title="Comptes connectés"
        description="Les posts partent à l’heure depuis ces comptes. Seuls les admins peuvent les connecter."
      >
        {brands.map((b) => (
          <section key={b} className="flex flex-col gap-2" aria-label={BRAND_LABEL[b]}>
            <h3 className="text-meta-md text-muted-foreground">{BRAND_LABEL[b]}</h3>
            <ul className="flex flex-col gap-2">
              {(data?.accounts ?? [])
                .filter((a) => a.brand === b)
                .map((a) => (
                  <li key={a.network} className="flex items-center gap-3 rounded-md bg-surface-1 px-3 py-2">
                    <NetworkIcon network={a.network} className="size-4 text-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-title-sm text-foreground">{NETWORK_LABEL[a.network]}</p>
                      <p className="truncate text-body-xs text-muted-foreground">
                        {a.handle}, {a.followers.toLocaleString('fr-FR').replace(/ /g, ' ')} abonnés
                      </p>
                    </div>
                    <Badge variant={a.connected ? 'green' : 'red'}>{a.connected ? 'Connecté' : 'Déconnecté'}</Badge>
                    <Button size="sm" variant={a.connected ? 'ghost' : 'outline'} onClick={() => actions.setAccount(a, !a.connected)}>
                      {a.connected ? 'Déconnecter' : 'Reconnecter'}
                    </Button>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </DialogContent>
    </Dialog>
  )
}
