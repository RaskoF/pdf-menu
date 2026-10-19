import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CaretLeft, CaretRight, LinkSimple, Plus, ShareNetwork } from '@phosphor-icons/react'
import { Badge, Button, Card, Chip, IconButton, Skeleton, Tabs, TabsList, TabsTrigger, useToast } from '@/components/ui'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { addDays, formatMonthYear, formatShortDate, monthGrid, startOfWeek, toIso, weekdayLabel } from '@/lib/dates'
import { pluralize } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useProduction } from '../store'
import { BRAND_LABEL, displayStatus, FORMAT_LABEL, NETWORK_LABEL, POST_STATUS_BADGE } from '../lib'
import { BEST_SLOTS } from '../mock-data'
import { AccountsDialog, DisconnectedBanner, NetworkIcon, PostCard } from './social-bits'
import type { ProductionBrand, SocialPost } from '../types'

type View = 'semaine' | 'mois' | 'liste'
type BrandFilter = 'all' | ProductionBrand
const VIEWS: View[] = ['semaine', 'mois', 'liste']
const BRAND_TONE: Record<ProductionBrand, string> = {
  studio: 'bg-surface-2 text-foreground',
  azurpod: 'bg-tag-teal-bg text-tag-teal-fg',
  academy: 'bg-tag-violet-bg text-tag-violet-fg',
}

// Figma : « Réseaux sociaux » semaine (67:690), mois (114:1632), liste (114:2045), aucun compte (122:2144).
// Calendrier séparé du Planning, sans circuit de validation (décisions du 19 oct.).
export function SocialPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data, loading, actions, now } = useProduction()
  const [params, setParams] = useSearchParams()
  const view: View = VIEWS.includes(params.get('vue') as View) ? (params.get('vue') as View) : 'semaine'
  const today = toIso(now)
  const [anchor, setAnchor] = useState(today)
  const [brand, setBrand] = useState<BrandFilter>('all')
  const [accountsOpen, setAccountsOpen] = useState(false)

  const accounts = data?.accounts ?? []
  const posts = useMemo(() => data?.posts ?? [], [data?.posts])
  const noAccount = !loading && accounts.every((a) => !a.connected)
  const weekStart = startOfWeek(anchor)
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const month = anchor.slice(0, 7)

  const inScope = (p: SocialPost) =>
    !p.date
      ? true
      : view === 'mois'
        ? p.date.startsWith(month)
        : view === 'liste'
          ? p.date >= addDays(weekStart, -7) && p.date <= week[6]!
          : week.includes(p.date)
  const scoped = posts.filter(inScope)
  const visible = scoped.filter((p) => brand === 'all' || p.brand === brand)
  const statusOf = (p: SocialPost) => displayStatus(p, accounts)
  const count = (s: ReturnType<typeof statusOf>) => scoped.filter((p) => statusOf(p) === s).length
  const blockedCount = count('bloque')

  const subtitle = loading
    ? 'Chargement des posts…'
    : noAccount
      ? 'Connectez un compte pour programmer vos posts depuis l’OS.'
      : view === 'mois'
        ? `${formatMonthYear(anchor).split(' ')[0]} : ${count('publie')} publiés, ${count('programme')} programmés, ${pluralize(blockedCount, 'bloqué')}, ${pluralize(count('brouillon'), 'brouillon')}.`
        : view === 'liste'
          ? `${pluralize(visible.length, 'post')}, triés par date.${blockedCount ? ` ${pluralize(blockedCount, 'bloqué')} tant qu’un compte est déconnecté.` : ''}`
          : `Semaine du ${formatShortDate(weekStart)} : ${count('programme')} programmés, ${pluralize(blockedCount, 'bloqué')}, ${pluralize(count('brouillon'), 'brouillon')}.`

  const shift = (dir: 1 | -1) =>
    setAnchor((a) => (view === 'mois' ? toIso(new Date(Number(a.slice(0, 4)), Number(a.slice(5, 7)) - 1 + dir, 1)) : addDays(a, dir * 7)))
  const open = (p: SocialPost) => navigate(`/reseaux-sociaux/post/${p.id}`)
  const newPost = (date?: string) => navigate(`/reseaux-sociaux/post/nouveau${date ? `?date=${date}` : ''}`)
  const reconnect = (b: ProductionBrand, n: SocialPost['networks'][number]) => {
    actions.setAccount({ brand: b, network: n }, true)
    toast({ message: `${NETWORK_LABEL[n]} ${BRAND_LABEL[b]} reconnecté`, variant: 'success' })
  }

  const firstFreeDay = week.find((d) => d >= today && !visible.some((p) => p.date === d))
  const brandChips: { key: BrandFilter; label: string }[] = [
    { key: 'all', label: 'Toutes les marques' },
    { key: 'studio', label: 'Uplye Studio' },
    { key: 'azurpod', label: 'Azurpod' },
    { key: 'academy', label: 'Academy' },
  ]
  const drafts = visible.filter((p) => p.status === 'brouillon' && !p.date)

  return (
    <div className="flex min-h-full flex-col gap-5 p-layout-margin">
      <PageHeader
        title="Réseaux sociaux"
        subtitle={subtitle}
        actions={
          <>
            <Button variant="outline" leadingIcon={<LinkSimple />} onClick={() => setAccountsOpen(true)}>
              Comptes connectés
            </Button>
            <Button leadingIcon={<Plus />} onClick={() => newPost()} disabled={noAccount}>
              Nouveau post
            </Button>
          </>
        }
      />

      {noAccount ? (
        <Card>
          <EmptyState
            icon={<ShareNetwork />}
            title="Aucun compte connecté"
            action={
              <Button variant="brand" leadingIcon={<LinkSimple />} onClick={() => setAccountsOpen(true)}>
                Connecter un compte
              </Button>
            }
          >
            Instagram, Facebook et LinkedIn, pour Uplye Studio, Azurpod et Academy. Les posts partent à l’heure, même quand personne n’est devant l’écran.
          </EmptyState>
        </Card>
      ) : (
        <>
          <DisconnectedBanner onReconnect={reconnect} />
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par marque">
              {brandChips.map((c) => (
                <Chip
                  key={c.key}
                  active={brand === c.key}
                  count={loading ? undefined : scoped.filter((p) => c.key === 'all' || p.brand === c.key).length}
                  onClick={() => setBrand(c.key)}
                >
                  {c.label}
                </Chip>
              ))}
            </div>
            <div className="flex items-center gap-2 sm:ml-auto">
              <IconButton variant="outline" label="Période précédente" onClick={() => shift(-1)}>
                <CaretLeft />
              </IconButton>
              <span className="min-w-[120px] text-center text-title-sm text-foreground" aria-live="polite">
                {view === 'mois' ? formatMonthYear(anchor) : `${Number(week[0]!.slice(8))} – ${formatShortDate(week[6]!)}`}
              </span>
              <IconButton variant="outline" label="Période suivante" onClick={() => shift(1)}>
                <CaretRight />
              </IconButton>
            </div>
            <Tabs value={view} onValueChange={(v) => setParams(v === 'semaine' ? {} : { vue: v }, { replace: true })}>
              <TabsList aria-label="Affichage">
                <TabsTrigger value="semaine">Semaine</TabsTrigger>
                <TabsTrigger value="mois">Mois</TabsTrigger>
                <TabsTrigger value="liste">Liste</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {loading ? (
            <Skeleton className="h-72 rounded-lg" />
          ) : view === 'semaine' ? (
            <>
              <div className="-mx-layout-margin overflow-x-auto px-layout-margin">
                <ol className="grid min-w-[900px] grid-cols-7 gap-3" aria-label="Posts de la semaine">
                  {week.map((d) => {
                    const list = visible.filter((p) => p.date === d).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
                    return (
                      <li key={d} className="flex flex-col gap-2">
                        <h2 className={cn('flex items-baseline gap-1.5 text-meta-md', d === today ? 'text-foreground' : 'text-muted-foreground')}>
                          {weekdayLabel(d)}
                          <span className="text-title-md text-foreground">{Number(d.slice(8))}</span>
                        </h2>
                        {list.map((p) => (
                          <PostCard key={p.id} post={p} onOpen={() => open(p)} />
                        ))}
                        {d === firstFreeDay && (
                          <button
                            type="button"
                            onClick={() => newPost(d)}
                            className="focus-ring flex flex-col items-start gap-1 rounded-lg border border-dashed border-line-strong p-3 text-left text-body-xs text-muted-foreground hover:bg-surface-hover"
                          >
                            <Plus className="size-3.5" aria-hidden />
                            Créneau conseillé à {BEST_SLOTS[brand === 'all' ? 'studio' : brand].time}
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ol>
              </div>
              {drafts.length > 0 && (
                <section className="flex flex-col gap-3" aria-labelledby="drafts-title">
                  <h2 id="drafts-title" className="flex items-baseline gap-2 text-title-md text-foreground">
                    Brouillons à programmer <span className="text-meta-sm text-muted-foreground">{drafts.length}</span>
                  </h2>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                    {drafts.map((p) => (
                      <li key={p.id}>
                        <PostCard post={p} draft onOpen={() => open(p)} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          ) : view === 'mois' ? (
            <MonthView anchor={anchor} today={today} posts={visible} onOpen={open} statusOf={statusOf} />
          ) : (
            <ListView posts={visible} onOpen={open} statusOf={statusOf} />
          )}
        </>
      )}
      <AccountsDialog open={accountsOpen} onOpenChange={setAccountsOpen} />
    </div>
  )
}

function MonthView({
  anchor,
  today,
  posts,
  onOpen,
  statusOf,
}: {
  anchor: string
  today: string
  posts: SocialPost[]
  onOpen: (p: SocialPost) => void
  statusOf: (p: SocialPost) => string
}) {
  const days = monthGrid(anchor)
  const month = anchor.slice(0, 7)
  const weeks = Array.from({ length: 6 }, (_, i) => days.slice(i * 7, i * 7 + 7)).filter((w) => w.some((d) => d.startsWith(month)))
  return (
    <div className="overflow-x-auto rounded-lg bg-card">
      <div role="grid" aria-label={formatMonthYear(anchor)} className="min-w-[760px]">
        <div role="row" className="grid grid-cols-7 border-b border-border">
          {weeks[0]!.map((d) => (
            <span key={d} role="columnheader" className="px-3 py-2 text-meta-md text-muted-foreground">
              {weekdayLabel(d)}
            </span>
          ))}
        </div>
        {weeks.map((w) => (
          <div key={w[0]} role="row" className="grid grid-cols-7 border-b border-border last:border-0">
            {w.map((d) => (
              <div key={d} role="gridcell" className="flex min-h-24 flex-col gap-1 border-r border-border p-2 last:border-0">
                <span
                  className={cn(
                    'grid size-6 place-content-center rounded-full text-body-sm',
                    d === today ? 'bg-brand text-brand-foreground' : d.startsWith(month) ? 'text-foreground' : 'text-ink-subtle',
                  )}
                >
                  {Number(d.slice(8))}
                </span>
                {posts
                  .filter((p) => p.date === d)
                  .map((p) => {
                    const blocked = statusOf(p) === 'bloque'
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onOpen(p)}
                        className={cn(
                          'focus-ring truncate rounded-sm px-2 py-0.5 text-left text-body-xs',
                          blocked ? 'bg-danger-tone text-danger' : BRAND_TONE[p.brand],
                        )}
                      >
                        {p.status === 'programme' && p.time ? `${p.time} ` : ''}
                        {p.status === 'programme' ? FORMAT_LABEL[p.format] : p.title}
                        {blocked ? ', bloqué' : ''}
                      </button>
                    )
                  })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

const dayLabel = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

function ListView({
  posts,
  onOpen,
  statusOf,
}: {
  posts: SocialPost[]
  onOpen: (p: SocialPost) => void
  statusOf: (p: SocialPost) => ReturnType<typeof displayStatus>
}) {
  const sorted = [...posts].sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999') || (a.time ?? '').localeCompare(b.time ?? ''))
  if (!sorted.length) {
    return (
      <Card>
        <EmptyState icon={<ShareNetwork />} title="Aucun post sur cette période" />
      </Card>
    )
  }
  return (
    <div className="overflow-x-auto rounded-lg bg-card">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <caption className="sr-only">Posts</caption>
        <thead>
          <tr className="h-11 border-b border-border text-meta-md text-muted-foreground">
            <th scope="col" className="w-36 pl-5 font-normal">
              Date
            </th>
            <th scope="col" className="font-normal">
              Post
            </th>
            <th scope="col" className="w-36 font-normal">
              Marque
            </th>
            <th scope="col" className="w-28 font-normal">
              Réseaux
            </th>
            <th scope="col" className="w-32 pr-5 font-normal">
              Statut
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const badge = POST_STATUS_BADGE[statusOf(p)]
            const label = p.date ? dayLabel.format(new Date(`${p.date}T12:00:00`)) : 'Sans date'
            return (
              <tr key={p.id} className="h-[61px] cursor-pointer border-b border-border last:border-0 hover:bg-surface-hover" onClick={() => onOpen(p)}>
                <td className="pl-5">
                  <p className="text-title-sm text-foreground">{label.charAt(0).toUpperCase() + label.slice(1)}</p>
                  {p.time && <p className="text-body-sm text-muted-foreground">{p.time}</p>}
                </td>
                <td>
                  <a
                    href={`#/reseaux-sociaux/post/${p.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="focus-ring block rounded-sm text-title-sm text-foreground hover:underline"
                  >
                    {p.title}
                  </a>
                  <p className="text-body-sm text-muted-foreground">{FORMAT_LABEL[p.format]}</p>
                </td>
                <td className="text-body-md text-foreground">{BRAND_LABEL[p.brand]}</td>
                <td>
                  <span className="flex gap-2 text-muted-foreground">
                    {p.networks.map((n) => (
                      <NetworkIcon key={n} network={n} className="size-4" />
                    ))}
                  </span>
                </td>
                <td className="pr-5">
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
