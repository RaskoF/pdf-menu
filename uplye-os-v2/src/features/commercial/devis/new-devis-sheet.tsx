import { useEffect, useId, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CaretRight, Copy, FileText, Microphone, Plus } from '@phosphor-icons/react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { Button, ChoiceGroup, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Sheet, SheetContent } from '@/components/ui'
import { formatEur } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCommercial } from '../store'
import { CATALOG, makeLine, makeSections } from '../mock-data'
import { addDays, formatShortDate, toIso } from '../lib'
import { newClient } from '../clients/client-factory'
import type { Brand, Client, Devis, DevisLine } from '../types'

type Start = 'rdv' | 'modele' | 'dupliquer' | 'vierge'

const TEMPLATES = [
  { id: 'video-pub', label: 'Vidéo pub', lines: ['Vidéo publicitaire', 'Vidéo format court'] },
  { id: 'shooting', label: 'Shooting', lines: ['Shooting photo'] },
  { id: 'azurpod', label: 'Pack Azurpod', lines: ['Pack 10 h podcast'] },
] as const

const BRANDS: { value: Brand; label: string }[] = [
  { value: 'studio', label: 'Uplye Studio' },
  { value: 'azurpod', label: 'Azurpod' },
  { value: 'academy', label: 'Academy' },
]

const fromCatalog = (titles: readonly string[]): DevisLine[] =>
  titles.flatMap((t) => {
    const item = CATALOG.find((c) => c.title === t)
    return item ? [makeLine(item)] : []
  })


/** Prochain numéro de devis de l'année : DEV-2026-016 */
export function nextDevisNumber(devis: Devis[], now: Date) {
  const year = now.getFullYear()
  const max = devis.reduce((m, d) => {
    const match = d.number.match(new RegExp(`^DEV-${year}-(\\d+)$`))
    return match ? Math.max(m, Number(match[1])) : m
  }, 0)
  return `DEV-${year}-${String(max + 1).padStart(3, '0')}`
}

// Figma : « Devis / Nouveau devis » (134:3550)
export function NewDevisSheet({
  open,
  onOpenChange,
  defaultClientId,
  defaultStart,
  prospect = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultClientId?: string
  defaultStart?: Start
  /** « Ajouter un prospect » : crée une carte « À chiffrer » sans ouvrir l'éditeur */
  prospect?: boolean
}) {
  const navigate = useNavigate()
  const { data, actions, now } = useCommercial()
  const clientInputId = useId()
  const listId = useId()
  const [clientName, setClientName] = useState('')
  const [start, setStart] = useState<Start>('vierge')
  const [templateId, setTemplateId] = useState<string>(TEMPLATES[0].id)
  const [duplicateId, setDuplicateId] = useState<string>('')
  const [brand, setBrand] = useState<Brand>('studio')
  const [error, setError] = useState<string>()

  const clients = data?.clients ?? []
  const devis = data?.devis ?? []
  const client: Client | undefined = clients.find((c) => c.name.toLowerCase() === clientName.trim().toLowerCase())
  const meeting = useMemo(() => data?.meetings.find((m) => m.clientId && m.clientId === client?.id && m.quoteStart), [data?.meetings, client?.id])
  const duplicable = devis.filter((d) => d.lines.length > 0)
  const number = nextDevisNumber(devis, now)

  useEffect(() => {
    if (!open) return
    const c = clients.find((x) => x.id === defaultClientId)
    setClientName(c ? c.name : '')
    setStart(defaultStart ?? 'vierge')
    setBrand('studio')
    setError(undefined)
    setDuplicateId(duplicable[0]?.id ?? '')
    // Réinitialise le formulaire à chaque ouverture uniquement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Le RDV est le point de départ conseillé dès qu'il existe
  useEffect(() => {
    if (meeting && !defaultStart) setStart('rdv')
    if (!meeting) setStart((s) => (s === 'rdv' ? 'vierge' : s))
  }, [meeting, defaultStart])

  const create = () => {
    const name = clientName.trim()
    if (!name) {
      setError('Choisissez un client ou tapez le nom d’un prospect.')
      return
    }
    let clientId = client?.id
    if (!clientId) {
      const created = newClient({ name }, toIso(now))
      clientId = created.id
      actions.createClient(created)
    }
    const source = devis.find((d) => d.id === duplicateId)
    const lines =
      start === 'rdv' && meeting?.quoteStart
        ? fromCatalog(meeting.quoteStart.lines)
        : start === 'modele'
          ? fromCatalog(TEMPLATES.find((t) => t.id === templateId)?.lines ?? [])
          : start === 'dupliquer' && source
            ? source.lines.map((l) => makeLine(l))
            : []
    const today = toIso(now)
    const id = `dev-${Date.now()}`
    actions.createDevis({
      id,
      number: prospect ? '' : number,
      clientId,
      title: prospect ? 'Nouveau besoin' : source && start === 'dupliquer' ? source.title : (lines[0]?.title ?? 'Nouveau devis'),
      status: prospect ? 'a_chiffrer' : 'brouillon',
      brand,
      owner: 'EN',
      lines: prospect ? [] : lines,
      sections: makeSections({ couverture: true, conditions: true, prestations: lines.length > 0 }),
      schedule: source && start === 'dupliquer' ? [...source.schedule] : [40, 30, 30],
      createdAt: today,
      editedAt: today,
      expiresAt: addDays(today, 30),
      views: 0,
      origin: prospect ? 'Ajouté à la main' : undefined,
      source: client ? undefined : 'Prospection',
      nextAction: prospect ? 'Chiffrer le besoin' : 'Finaliser le brouillon',
      assistantDrafts: [],
      suggestions: [],
      activity: [{ id: 'a1', kind: 'created', title: prospect ? 'Prospect ajouté' : 'Brouillon créé', detail: 'Par Enzo', when: 'à l’instant' }],
    })
    onOpenChange(false)
    if (!prospect) navigate(`/devis/${id}/editeur`)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={prospect ? 'Ajouter un prospect' : 'Nouveau devis'}
        description={
          prospect ? 'Il arrive dans « À chiffrer », à transformer en devis plus tard.' : 'Choisissez un point de départ, tout reste modifiable dans l’éditeur.'
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button variant="brand" leadingIcon={prospect ? <Plus /> : <ArrowRight />} onClick={create}>
              {prospect ? 'Ajouter le prospect' : 'Créer le devis'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={clientInputId}>Client</Label>
          <Input
            id={clientInputId}
            list={listId}
            value={clientName}
            autoComplete="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={`${clientInputId}-help`}
            onChange={(e) => {
              setClientName(e.target.value)
              setError(undefined)
            }}
            placeholder="Univers Nuisible"
          />
          <datalist id={listId}>
            {clients.map((c) => (
              <option key={c.id} value={c.name}>
                {c.contactName}
              </option>
            ))}
          </datalist>
          <p id={`${clientInputId}-help`} className={cn('text-body-sm', error ? 'text-danger' : 'text-muted-foreground')}>
            {error ?? (clientName && !client ? `« ${clientName.trim()} » sera créé comme prospect.` : 'Ou tapez un nom pour créer un prospect.')}
          </p>
        </div>

        {!prospect && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-meta-md text-muted-foreground">Point de départ</legend>
            <RadioGroupPrimitive.Root value={start} onValueChange={(v) => setStart(v as Start)} className="flex flex-col" aria-label="Point de départ">
              <StartOption
                value="rdv"
                disabled={!meeting}
                icon={<Microphone />}
                title={meeting ? `Depuis le RDV du ${formatShortDate(meeting.date)}` : 'Depuis un RDV'}
                detail={
                  meeting?.quoteStart ? `Fireflies : besoin, budget évoqué ${formatEur(meeting.quoteStart.budget)}` : 'Aucun RDV enregistré pour ce client'
                }
                badge={meeting ? 'Conseillé' : undefined}
              />
              <StartOption value="modele" icon={<Copy />} title="Partir d’un modèle" detail="Vidéo pub, shooting, pack Azurpod" />
              <StartOption
                value="dupliquer"
                icon={<FileText />}
                title="Dupliquer un devis"
                detail={duplicable[0] ? `Ex. ${duplicable.find((d) => d.status === 'signe')?.number ?? duplicable[0].number}` : 'Aucun devis à dupliquer'}
                disabled={duplicable.length === 0}
              />
              <StartOption value="vierge" icon={<Plus />} title="Devis vierge" detail="Les prestations du catalogue restent à portée" />
            </RadioGroupPrimitive.Root>
            {start === 'modele' && (
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger aria-label="Modèle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {start === 'dupliquer' && duplicable.length > 0 && (
              <Select value={duplicateId} onValueChange={setDuplicateId}>
                <SelectTrigger aria-label="Devis à dupliquer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {duplicable.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.number} · {clients.find((c) => c.id === d.clientId)?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </fieldset>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-label-sm text-foreground">Marque</span>
          <ChoiceGroup appearance="segmented" label="Marque" options={BRANDS} value={brand} onValueChange={setBrand} />
        </div>

        {!prospect && (
          <p className="text-body-sm text-muted-foreground">Numéro attribué à la création : {number}. Validité 30 jours, échéancier 40 / 30 / 30 par défaut.</p>
        )}
      </SheetContent>
    </Sheet>
  )
}

function StartOption({
  value,
  icon,
  title,
  detail,
  badge,
  disabled,
}: {
  value: Start
  icon: ReactNode
  title: string
  detail: string
  badge?: string
  disabled?: boolean
}) {
  return (
    <RadioGroupPrimitive.Item
      value={value}
      disabled={disabled}
      className="focus-ring group flex items-center gap-3 border-b border-border px-1 py-3 text-left last:border-0 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-surface-1 sm:rounded-md sm:px-3"
    >
      <span className="text-muted-foreground group-data-[state=checked]:text-foreground [&_svg]:size-4" aria-hidden>
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-title-sm text-foreground">{title}</span>
        <span className="text-body-xs text-muted-foreground">{detail}</span>
      </span>
      {badge && <span className="text-body-sm text-foreground">{badge}</span>}
      <CaretRight className="size-4 text-muted-foreground" aria-hidden />
    </RadioGroupPrimitive.Item>
  )
}
