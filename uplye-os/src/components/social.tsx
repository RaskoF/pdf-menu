import { FacebookLogo, InstagramLogo } from '@phosphor-icons/react'
import type { SocialBrand, SocialFormat, SocialNetwork, SocialPost, SocialStatus } from '../types'

export const BRANDS: Record<SocialBrand, { label: string; dot: string; chip: string; initial: string }> = {
  studio: { label: 'Uplye Studio', dot: 'bg-o7', chip: 'bg-o1 text-o7 border-o7', initial: 'U' },
  azurpod: { label: 'Azurpod', dot: 'bg-t7', chip: 'bg-t1 text-t7 border-t7', initial: 'A' },
  academy: { label: 'Uplye Academy', dot: 'bg-p7', chip: 'bg-p1 text-p7 border-p7', initial: 'A' },
}
export const BRAND_IDS = Object.keys(BRANDS) as SocialBrand[]

export const STATUS: Record<SocialStatus, { label: string; pill: string; mini: string }> = {
  draft: { label: 'Brouillon', pill: 'bg-hover text-ink2', mini: 'border-dashed border-line2 bg-surface text-ink2' },
  scheduled: { label: 'Programmé', pill: 'bg-b1 text-b7', mini: 'border-line bg-surface text-ink' },
  published: { label: 'Publié', pill: 'bg-g1 text-g7', mini: 'border-line bg-app text-ink2 opacity-75' },
  failed: { label: 'Échec', pill: 'bg-r1 text-r7', mini: 'border-r7/40 bg-r1 text-r7' },
}
export const FORMATS: { id: SocialFormat; label: string }[] = [
  { id: 'post', label: 'Post' }, { id: 'carrousel', label: 'Carrousel' }, { id: 'reel', label: 'Reel' }, { id: 'story', label: 'Story' },
]
export const CAPTION_MAX = 2200 // limite Instagram

export function NetworkBadge({ n, size = 16 }: { n: SocialNetwork; size?: number }) {
  const Icon = n === 'instagram' ? InstagramLogo : FacebookLogo
  return (
    <span className="inline-grid shrink-0 place-items-center rounded-full text-white" style={{ width: size, height: size, background: n === 'instagram' ? '#E1306C' : '#1877F2' }}>
      <Icon size={size * 0.68} weight="bold" />
    </span>
  )
}

export const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
export const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
export const isEditable = (p: SocialPost) => p.status !== 'published'
