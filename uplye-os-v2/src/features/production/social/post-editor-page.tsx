import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarCheck,
  ChartLineUp,
  ChatCircle,
  DotsThree,
  Folder,
  Image as ImageIcon,
  PaperPlaneTilt,
  Plus,
  Repeat,
  Star,
  ThumbsUp,
  X,
} from '@phosphor-icons/react'
import {
  Alert,
  Avatar,
  Button,
  Checkbox,
  ChoiceGroup,
  Dialog,
  DialogContent,
  IconButton,
  Input,
  Label,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
  useToast,
} from '@/components/ui'
import { EmptyState } from '@/components/app/empty-state'
import { formatDayLong, toIso } from '@/lib/dates'
import { cn } from '@/lib/utils'
import { useClientsById } from '@/features/commercial/store'
import { useProduction } from '../store'
import { accountFor, BRAND_LABEL, captionLimit, NETWORK_LABEL, rewrite } from '../lib'
import { BEST_SLOTS } from '../mock-data'
import { NetworkIcon } from './social-bits'
import type { Network, PostFormat, ProductionBrand, SocialPost } from '../types'

const NETWORKS: Network[] = ['instagram', 'facebook', 'linkedin']
const FORMATS: { value: PostFormat; label: string }[] = [
  { value: 'post', label: 'Post' },
  { value: 'carrousel', label: 'Carrousel' },
  { value: 'reel', label: 'Reel' },
  { value: 'story', label: 'Story' },
]
const BRANDS: { value: ProductionBrand; label: string }[] = [
  { value: 'studio', label: 'Uplye Studio' },
  { value: 'azurpod', label: 'Azurpod' },
  { value: 'academy', label: 'Academy' },
]
const MAX_MEDIA = 10
const short = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric' })

type Draft = Omit<SocialPost, 'id'> & { id?: string }

/** Une instance par post : changer de post repart d'un état propre (brouillon, médias, erreurs). */
export function PostEditorRoute() {
  const { id } = useParams()
  return <PostEditorPage key={id} />
}

// Figma : « Éditeur de post » (68:997), aperçu LinkedIn (111:1116), « Publication échouée » (122:2365).
export function PostEditorPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { data, loading, actions, now } = useProduction()
  const clients = useClientsById()
  const existing = id && id !== 'nouveau' ? data?.posts.find((p) => p.id === id) : undefined
  const [draft, setDraft] = useState<Draft | null>(null)
  const [preview, setPreview] = useState<Network>('instagram')
  const [files, setFiles] = useState<{ url: string; name: string }[]>([])
  const [projectOpen, setProjectOpen] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const captionId = useId()
  const dateId = useId()
  const timeId = useId()

  useEffect(() => {
    if (draft || loading) return
    const brand: ProductionBrand = 'studio'
    setDraft(
      existing ?? {
        brand,
        format: 'carrousel',
        title: '',
        caption: '',
        networks: ['instagram', 'facebook'],
        date: params.get('date') ?? undefined,
        time: params.get('date') ? BEST_SLOTS[brand].time : undefined,
        status: 'brouillon',
        media: 0,
      },
    )
  }, [draft, loading, existing, params])

  // Les aperçus locaux sont libérés en quittant l'éditeur
  const filesRef = useRef(files)
  filesRef.current = files
  useEffect(() => () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.url)), [])

  const accounts = data?.accounts ?? []
  const limit = draft ? captionLimit(draft.networks) : 2200
  const offline = useMemo(() => (draft ? draft.networks.filter((n) => accountFor(accounts, draft.brand, n)?.connected === false) : []), [draft, accounts])

  if (loading || !draft)
    return (
      <div className="h-full bg-sidebar p-4">
        <Skeleton className="h-full rounded-xl" />
      </div>
    )
  if (id !== 'nouveau' && !existing) {
    return (
      <div className="grid h-full place-content-center bg-background">
        <EmptyState icon={<ImageIcon />} title="Post introuvable" action={<Button onClick={() => navigate('/reseaux-sociaux')}>Retour au calendrier</Button>} />
      </div>
    )
  }

  const set = (patch: Partial<Draft>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d))
    setErrors([])
  }
  const published = draft.status === 'publie'
  // Un post parti (même en partie) ne se reprogramme pas : on le corrige ou on le duplique
  const locked = published || draft.status === 'echec'
  const mediaCount = draft.media + files.length
  const project = data?.projects.find((p) => p.id === draft.sourceProjectId)
  const today = toIso(now)
  const scheduleLabel = draft.date && draft.time ? `Programmer ${short.format(new Date(`${draft.date}T12:00:00`))} à ${draft.time}` : 'Programmer'
  const title = draft.title || draft.caption.split(/[.!?\n]/)[0]?.slice(0, 80) || 'Nouveau post'

  const persist = (status: SocialPost['status']) => {
    const post: SocialPost = { ...draft, id: draft.id ?? `post-${Date.now()}`, title, status, media: mediaCount, failure: undefined }
    if (existing) actions.updatePost(post.id, () => post)
    else actions.createPost(post)
    return post
  }

  const saveDraft = () => {
    const post = persist(draft.date && draft.status === 'programme' ? 'programme' : 'brouillon')
    setDraft({ ...post })
    setSavedAt(Date.now())
    toast({ message: 'Brouillon enregistré', variant: 'success' })
  }

  const schedule = () => {
    const problems = [
      !draft.networks.length && 'Choisissez au moins un réseau.',
      !draft.caption.trim() && 'Écrivez une légende.',
      draft.caption.length > limit && `La légende dépasse ${limit.toLocaleString('fr-FR')} caractères.`,
      (!draft.date || !draft.time) && 'Choisissez la date et l’heure.',
      draft.date &&
        draft.time &&
        `${draft.date}T${draft.time}` < `${today}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` &&
        'La date est passée.',
      mediaCount === 0 && 'Ajoutez au moins un média.',
    ].filter(Boolean) as string[]
    if (problems.length) return setErrors(problems)
    const before = existing
    const post = persist('programme')
    navigate('/reseaux-sociaux')
    toast({
      message: `Post programmé ${formatDayLong(post.date!).toLowerCase()} à ${post.time}${offline.length ? ', bloqué tant que le compte est déconnecté' : ''}`,
      variant: offline.length ? 'default' : 'success',
      action: { label: 'Annuler', onClick: () => (before ? actions.updatePost(post.id, () => before) : actions.removePost(post.id)) },
    })
  }

  const retry = () => {
    actions.updatePost(existing!.id, (p) => ({ ...p, status: 'publie', failure: undefined }))
    setDraft((d) => (d ? { ...d, status: 'publie', failure: undefined } : d))
    toast({ message: `Carrousel compressé et publié sur ${NETWORK_LABEL[draft.failure!.network]}`, variant: 'success' })
  }

  const visibleNetworks = draft.networks.length ? draft.networks : (['instagram'] as Network[])
  const shown = visibleNetworks.includes(preview) ? preview : visibleNetworks[0]!
  const account = accountFor(accounts, draft.brand, shown)

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:px-5">
        <IconButton label="Retour au calendrier" className="text-sidebar-foreground hover:bg-sidebar-hover" asChild>
          <Link to="/reseaux-sociaux">
            <ArrowLeft />
          </Link>
        </IconButton>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-title-md">
            {existing ? title : 'Nouveau post'}, {BRAND_LABEL[draft.brand]}
          </h1>
          <p className="text-body-xs text-sidebar-muted" aria-live="polite">
            {published
              ? 'Publié'
              : draft.status === 'echec'
                ? 'Publié en partie'
                : savedAt
                  ? 'Brouillon enregistré à l’instant'
                  : existing
                    ? 'Modifications non enregistrées'
                    : 'Nouveau brouillon'}
          </p>
        </div>
        {!locked && (
          <>
            <Button variant="ghost" className="text-sidebar-foreground hover:bg-sidebar-hover" onClick={saveDraft}>
              Enregistrer le brouillon
            </Button>
            <Button variant="brand" leadingIcon={<CalendarCheck />} onClick={schedule}>
              {scheduleLabel}
            </Button>
          </>
        )}
      </header>

      <div className="mx-2 mb-2 grid min-h-0 flex-1 overflow-hidden rounded-xl bg-background text-foreground lg:grid-cols-[minmax(0,1fr)_460px]">
        <main id="contenu" tabIndex={-1} className="flex min-h-0 flex-col gap-6 overflow-y-auto p-6 outline-none md:p-12">
          {draft.failure && (
            <Alert
              variant="destructive"
              title={`${NETWORK_LABEL[draft.failure.network]} a refusé la publication`}
              action={
                <Button size="sm" variant="outline" onClick={retry}>
                  Compresser et renvoyer
                </Button>
              }
            >
              {draft.failure.reason}
            </Alert>
          )}
          {errors.length > 0 && (
            <Alert variant="destructive" title="Avant de programmer">
              <ul className="list-disc pl-4">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </Alert>
          )}
          {offline.length > 0 && !locked && (
            <Alert variant="warning" title={`${offline.map((n) => NETWORK_LABEL[n]).join(' et ')} ${BRAND_LABEL[draft.brand]} est déconnecté`}>
              Le post sera bloqué sur ce réseau tant que le compte n’est pas reconnecté.
            </Alert>
          )}

          <fieldset disabled={locked} className="flex flex-col gap-6 disabled:opacity-80">
            <div className="flex flex-wrap gap-x-10 gap-y-5">
              <div className="flex flex-col gap-2">
                <span className="text-label-sm">Marque</span>
                <ChoiceGroup label="Marque" options={BRANDS} value={draft.brand} onValueChange={(brand) => set({ brand })} />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-label-sm" id="networks-label">
                  Publier sur
                </span>
                <div className="flex flex-wrap gap-4" role="group" aria-labelledby="networks-label">
                  {NETWORKS.map((n) => (
                    <label key={n} className="flex cursor-pointer items-center gap-2 text-body-md">
                      <Checkbox
                        checked={draft.networks.includes(n)}
                        onCheckedChange={(v) => set({ networks: v === true ? [...draft.networks, n] : draft.networks.filter((x) => x !== n) })}
                      />
                      <NetworkIcon network={n} className="size-4" />
                      {NETWORK_LABEL[n]}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-label-sm">Format</span>
              <ChoiceGroup appearance="segmented" label="Format" options={FORMATS} value={draft.format} onValueChange={(format) => set({ format })} />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-label-sm">Médias</span>
                <span className="text-body-xs text-muted-foreground">
                  {mediaCount} sur {MAX_MEDIA}
                </span>
              </div>
              <ul className="flex flex-wrap gap-2" aria-label="Médias du post">
                {Array.from({ length: draft.media }, (_, i) => (
                  <li
                    key={`m${i}`}
                    className="relative grid size-24 place-content-center rounded-md bg-gradient-to-b from-surface-2 to-surface-1 text-body-xs text-muted-foreground"
                  >
                    {i + 1}
                    {!locked && (
                      <IconButton
                        label={`Retirer le média ${i + 1}`}
                        size="sm"
                        className="absolute right-0.5 top-0.5 size-6"
                        onClick={() => set({ media: draft.media - 1 })}
                      >
                        <X />
                      </IconButton>
                    )}
                  </li>
                ))}
                {files.map((f, i) => (
                  <li key={f.url} className="relative size-24 overflow-hidden rounded-md bg-surface-1">
                    <img src={f.url} alt={f.name} className="size-full object-cover" />
                    <IconButton
                      label={`Retirer ${f.name}`}
                      size="sm"
                      className="absolute right-0.5 top-0.5 size-6 bg-background/80"
                      onClick={() => {
                        URL.revokeObjectURL(f.url)
                        setFiles((list) => list.filter((_, j) => j !== i))
                      }}
                    >
                      <X />
                    </IconButton>
                  </li>
                ))}
                {mediaCount < MAX_MEDIA && !locked && (
                  <>
                    <li>
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="focus-ring flex size-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line-strong text-body-xs text-muted-foreground hover:bg-surface-hover"
                      >
                        <Plus className="size-4" aria-hidden />
                        Ajouter
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => setProjectOpen(true)}
                        className="focus-ring flex h-24 w-48 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line-strong text-body-sm text-foreground hover:bg-surface-hover"
                      >
                        <Folder className="size-4" aria-hidden />
                        Depuis un projet
                      </button>
                    </li>
                  </>
                )}
              </ul>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                aria-label="Ajouter des images"
                onChange={(e) => {
                  const picked = Array.from(e.target.files ?? []).slice(0, MAX_MEDIA - mediaCount)
                  setFiles((list) => [...list, ...picked.map((f) => ({ url: URL.createObjectURL(f), name: f.name }))])
                  e.target.value = ''
                }}
              />
              {project && (
                <p className="text-body-xs text-muted-foreground">
                  Depuis « {project.title} », {clients.get(project.clientId)?.name}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <Label htmlFor={captionId}>Légende</Label>
                <span className={cn('text-body-xs', draft.caption.length > limit ? 'text-danger' : 'text-muted-foreground')}>
                  {draft.caption.length} sur {limit.toLocaleString('fr-FR').replace(/ /g, ' ')}
                </span>
              </div>
              <Textarea
                id={captionId}
                rows={5}
                value={draft.caption}
                onChange={(e) => set({ caption: e.target.value })}
                aria-invalid={draft.caption.length > limit || undefined}
              />
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Réécrire la légende">
                <span className="text-body-xs text-muted-foreground">Réécrire :</span>
                <Button size="sm" variant="secondary" disabled={!draft.caption} onClick={() => set({ caption: rewrite.shorter(draft.caption) })}>
                  Plus court
                </Button>
                <Button size="sm" variant="secondary" disabled={!draft.caption} onClick={() => set({ caption: rewrite.direct(draft.caption) })}>
                  Plus direct
                </Button>
                <Button size="sm" variant="secondary" disabled={!draft.caption} onClick={() => set({ caption: rewrite.hashtags(draft.caption, draft.brand) })}>
                  Ajouter des hashtags
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={dateId}>Date</Label>
                <Input
                  id={dateId}
                  type="date"
                  min={today}
                  value={draft.date ?? ''}
                  onChange={(e) => set({ date: e.target.value || undefined })}
                  className="w-48"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={timeId}>Heure</Label>
                <Input
                  id={timeId}
                  type="time"
                  step={900}
                  value={draft.time ?? ''}
                  onChange={(e) => set({ time: e.target.value || undefined })}
                  className="w-32"
                />
              </div>
              <button
                type="button"
                onClick={() => set({ time: BEST_SLOTS[draft.brand].time })}
                className="focus-ring mb-2.5 flex items-center gap-1.5 rounded-sm text-body-xs text-muted-foreground hover:text-foreground"
              >
                <ChartLineUp className="size-4" aria-hidden />
                Meilleur créneau d’après vos stats : {BEST_SLOTS[draft.brand].label}
              </button>
            </div>
          </fieldset>
        </main>

        <aside className="hidden flex-col items-center gap-4 overflow-y-auto bg-card p-8 lg:flex" aria-label="Aperçu">
          <Tabs value={shown} onValueChange={(v) => setPreview(v as Network)}>
            <TabsList aria-label="Aperçu par réseau">
              {visibleNetworks.map((n) => (
                <TabsTrigger key={n} value={n}>
                  {NETWORK_LABEL[n]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Preview
            network={shown}
            draft={draft}
            handle={account?.handle ?? BRAND_LABEL[draft.brand]}
            followers={account?.followers ?? 0}
            media={mediaCount}
            firstImage={files[0]?.url}
          />
          <p className="max-w-[340px] text-center text-body-xs text-muted-foreground">
            {shown === 'linkedin'
              ? 'Sur LinkedIn, la légende passe au-dessus du visuel et le carrousel devient un PDF. Texte adapté automatiquement, modifiable.'
              : 'Aperçu indicatif, le rendu final dépend de l’application.'}
          </p>
        </aside>
      </div>

      <Dialog open={projectOpen} onOpenChange={setProjectOpen}>
        <DialogContent title="Médias depuis un projet" description="Les rushs et photos livrés sont repris tels quels.">
          <ul className="flex flex-col gap-2">
            {(data?.projects ?? []).map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    set({ sourceProjectId: p.id, media: Math.min(MAX_MEDIA - files.length, Math.max(draft.media, 3)) })
                    setProjectOpen(false)
                  }}
                  className="focus-ring flex w-full items-center gap-3 rounded-md bg-surface-1 px-3 py-2 text-left hover:bg-surface-2"
                >
                  <Folder className="size-4 text-muted-foreground" aria-hidden />
                  <span className="flex-1">
                    <span className="block text-title-sm text-foreground">{p.title}</span>
                    <span className="block text-body-xs text-muted-foreground">{clients.get(p.clientId)?.name}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Preview({
  network,
  draft,
  handle,
  followers,
  media,
  firstImage,
}: {
  network: Network
  draft: Draft
  handle: string
  followers: number
  media: number
  firstImage?: string
}) {
  const visual = (
    <div className="relative grid aspect-square place-content-center bg-gradient-to-b from-surface-2 to-surface-1 text-body-xs text-muted-foreground">
      {firstImage ? <img src={firstImage} alt="" className="absolute inset-0 size-full object-cover" /> : null}
      <span className="relative">
        {media ? `${network === 'linkedin' && draft.format === 'carrousel' ? 'Carrousel PDF, ' : ''}1 / ${media}` : 'Aucun média'}
      </span>
    </div>
  )
  const caption = draft.caption || 'La légende apparaîtra ici.'
  if (network === 'linkedin') {
    return (
      <article className="w-full max-w-[360px] overflow-hidden rounded-lg bg-background">
        <header className="flex gap-3 p-4">
          <Avatar
            initials={BRAND_LABEL[draft.brand]
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)}
            tone="yellow"
            size="lg"
          />
          <div className="min-w-0">
            <p className="text-title-sm text-foreground">{handle}</p>
            <p className="text-body-xs text-muted-foreground">{followers.toLocaleString('fr-FR').replace(/ /g, ' ')} abonnés</p>
            {draft.date && draft.time && (
              <p className="text-body-xs text-muted-foreground">
                Programmé {formatDayLong(draft.date).toLowerCase()}, {draft.time}
              </p>
            )}
          </div>
        </header>
        <p className="line-clamp-6 whitespace-pre-line px-4 pb-3 text-body-sm text-foreground">{caption}</p>
        {visual}
        <footer className="flex justify-between px-4 py-3 text-body-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ThumbsUp className="size-4" aria-hidden />
            J’aime
          </span>
          <span className="flex items-center gap-1">
            <ChatCircle className="size-4" aria-hidden />
            Commenter
          </span>
          <span className="flex items-center gap-1">
            <Repeat className="size-4" aria-hidden />
            Republier
          </span>
          <span className="flex items-center gap-1">
            <PaperPlaneTilt className="size-4" aria-hidden />
            Envoyer
          </span>
        </footer>
      </article>
    )
  }
  return (
    <article className="w-full max-w-[360px] overflow-hidden rounded-lg bg-background">
      <header className="flex items-center gap-2 p-3">
        <Avatar initials={handle[0]!.toUpperCase()} size="sm" tone="neutral" />
        <p className="flex-1 text-title-sm text-foreground">{handle}</p>
        <DotsThree className="size-4 text-muted-foreground" aria-hidden />
      </header>
      {network === 'facebook' && <p className="line-clamp-4 whitespace-pre-line px-3 pb-3 text-body-sm text-foreground">{caption}</p>}
      {visual}
      {network === 'instagram' && (
        <div className="flex flex-col gap-2 p-3">
          <span className="flex gap-3 text-foreground">
            <Star className="size-5" aria-hidden />
            <ChatCircle className="size-5" aria-hidden />
            <PaperPlaneTilt className="size-5" aria-hidden />
          </span>
          <p className="line-clamp-2 text-body-sm text-foreground">
            <span className="text-title-sm">{handle}</span> {caption}
          </p>
        </div>
      )}
      {network === 'facebook' && (
        <footer className="flex justify-around px-3 py-2 text-body-xs text-muted-foreground">
          <span>J’aime</span>
          <span>Commenter</span>
          <span>Partager</span>
        </footer>
      )}
    </article>
  )
}
