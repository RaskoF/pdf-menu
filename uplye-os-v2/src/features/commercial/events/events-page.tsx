import { useId, useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, Handshake, HourglassMedium, Plus, UserPlus } from '@phosphor-icons/react'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Checkbox,
  ChoiceGroup,
  Dialog,
  DialogContent,
  Field,
  Input,
  MultiChoiceGroup,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  Skeleton,
  Switch,
  Textarea,
  useToast,
} from '@/components/ui'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { formatEur, pluralize } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCommercial } from '../store'
import { MEMBERS } from '../mock-data'
import { dateBadge, formatShortDate, toIso } from '../lib'
import { newClient } from '../clients/client-factory'
import type { CommercialEvent, EventType, MemberId, MetContact } from '../types'

const TYPE_BADGE: Record<EventType, 'blue' | 'teal' | 'orange' | 'violet' | 'secondary'> = {
  BNI: 'blue',
  CCI: 'teal',
  Salon: 'orange',
  Club: 'violet',
  Afterwork: 'secondary',
}

/** Verdict d'un événement : rentable s'il a signé, à revoir s'il a coûté sans rien rapporter malgré des contacts. */
function verdict(e: CommercialEvent): { label: string; variant: 'green' | 'red' | 'secondary' } {
  if (e.revenue > 0 && e.revenue >= e.cost) return { label: 'Rentable', variant: 'green' }
  if (e.contacts >= 10) return { label: 'À revoir', variant: 'red' }
  return { label: 'Trop tôt', variant: 'secondary' }
}

// Figma : « Événements » (35:1221), « Aucun événement » (119:3010), « Nouvel événement » (134:4026).
export function EventsPage() {
  const { data, loading, actions } = useCommercial()
  const toast = useToast()
  const [creating, setCreating] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [reviewing, setReviewing] = useState(false)

  const events = data?.events ?? []
  const contacts = data?.metContacts ?? []
  const pending = contacts.filter((c) => !c.followedUp)
  const revenue = events.reduce((s, e) => s + e.revenue, 0)
  const spent = events.reduce((s, e) => s + e.cost, 0)

  return (
    <div className="flex min-h-full flex-col gap-5 p-layout-margin">
      <PageHeader
        title="Événements"
        subtitle={
          loading
            ? 'Chargement…'
            : events.length
              ? `Ce trimestre : ${formatEur(revenue)} signés grâce aux événements, pour ${formatEur(spent)} dépensés`
              : 'Ce trimestre : aucun événement suivi pour l’instant.'
        }
        actions={
          <>
            <Button variant="outline" leadingIcon={<UserPlus />} onClick={() => setScanning(true)}>
              Scanner une carte
            </Button>
            <Button leadingIcon={<Plus />} onClick={() => setCreating(true)}>
              Nouvel événement
            </Button>
          </>
        }
      />

      {pending.length > 0 && (
        <div className="flex flex-col gap-3 rounded-lg bg-brand-soft px-5 py-4 sm:flex-row sm:items-center" role="status">
          <HourglassMedium className="size-5 shrink-0 text-foreground" aria-hidden />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-title-sm text-foreground">{pluralize(pending.length, 'contact')} du BNI du 16 oct. à relancer avant demain 18:00</p>
            <p className="text-body-sm text-muted-foreground">
              Au-delà de 48 h, le taux de réponse chute de moitié. L’assistant a préparé un message par contact.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => document.getElementById('contacts-rencontres')?.scrollIntoView({ behavior: 'smooth' })}>
              Voir les contacts
            </Button>
            <Button variant="brand" size="sm" onClick={() => setReviewing(true)}>
              Relire les {pluralize(pending.length, 'message')}
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="min-h-[320px]">
          <CardHeader title="Ce que rapporte chaque événement" description="De la rencontre à la signature, sur 90 jours" />
          {loading ? (
            <Skeleton className="h-48" />
          ) : events.length === 0 ? (
            <EmptyState
              icon={<Handshake />}
              title="Aucun événement suivi"
              action={
                <Button variant="outline" leadingIcon={<Plus />} onClick={() => setCreating(true)}>
                  Ajouter un événement
                </Button>
              }
            >
              Ajoutez un salon, un club ou un afterwork : l’OS relie ensuite les contacts scannés aux devis signés.
            </EmptyState>
          ) : (
            <ul className="flex flex-col">
              {events.map((e) => {
                const v = verdict(e)
                return (
                  <li
                    key={e.id}
                    className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-t border-border py-4 md:grid-cols-[minmax(0,200px)_1fr_auto_auto]"
                  >
                    <div className="min-w-0">
                      <p className="text-title-sm text-foreground">{e.name}</p>
                      <p className="text-body-sm text-muted-foreground">{e.detail}</p>
                    </div>
                    <p
                      className="order-last col-span-2 flex flex-wrap items-center gap-2 text-body-xs text-foreground md:order-none md:col-span-1"
                      aria-label={`${e.contacts} contacts, ${e.devis} devis, ${e.signed} signé`}
                    >
                      <span>{pluralize(e.contacts, 'contact')}</span>
                      <ArrowRight className="size-3 text-muted-foreground" aria-hidden />
                      <span>{e.devis} devis</span>
                      <ArrowRight className="size-3 text-muted-foreground" aria-hidden />
                      <span>
                        {e.signed} signé{e.signed > 1 ? 's' : ''}
                      </span>
                    </p>
                    <div className="text-right">
                      <p className="text-title-md tabular-nums text-foreground">{formatEur(e.revenue)}</p>
                      <p className="text-body-xs text-muted-foreground">
                        {e.cost === 0 ? 'sans coût' : `ROI ×${(e.revenue / e.cost).toFixed(1).replace('.', ',')}`}
                      </p>
                    </div>
                    <Badge variant={v.variant} className="justify-self-end">
                      {v.label}
                    </Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="À venir" />
            <ul className="flex flex-col gap-4">
              {(data?.upcoming ?? []).map((u) => {
                const b = dateBadge(u.date)
                return (
                  <li key={u.id} className="flex items-center gap-3">
                    <span className="flex w-11 shrink-0 flex-col items-center rounded-md bg-surface-1 py-1" aria-label={formatShortDate(u.date)}>
                      <span className="text-title-md leading-tight text-foreground" aria-hidden>
                        {b.day}
                      </span>
                      <span className="text-meta-sm text-muted-foreground" aria-hidden>
                        {b.month}
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-title-sm text-foreground">{u.name}</p>
                      <p className="truncate text-body-sm text-muted-foreground">{u.detail}</p>
                    </div>
                    <Badge variant={TYPE_BADGE[u.type]}>{u.type}</Badge>
                  </li>
                )
              })}
            </ul>
          </Card>

          {contacts.length > 0 && (
            <Card id="contacts-rencontres">
              <CardHeader
                title="Rencontrés au BNI du 16 oct."
                action={
                  <span className="text-meta-sm text-muted-foreground">
                    {contacts.length - pending.length} / {contacts.length}
                  </span>
                }
              />
              <ul className="flex flex-col gap-3">
                {contacts.map((c) => (
                  <MetContactRow key={c.id} contact={c} onChange={(v) => actions.setFollowUp(c.id, v)} />
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <NewEventSheet open={creating} onOpenChange={setCreating} />
      <ScanDialog open={scanning} onOpenChange={setScanning} />
      <MessagesDialog
        open={reviewing}
        onOpenChange={setReviewing}
        contacts={pending}
        onSend={(ids) => {
          ids.forEach((id) => actions.setFollowUp(id, true))
          toast({ message: `${pluralize(ids.length, 'message envoyé', 'messages envoyés')}`, variant: 'success' })
          setReviewing(false)
        }}
      />
    </div>
  )
}

function MetContactRow({ contact, onChange }: { contact: MetContact; onChange: (v: boolean) => void }) {
  const id = useId()
  return (
    <li className="flex items-center gap-3">
      <Checkbox id={id} checked={contact.followedUp} onCheckedChange={(v) => onChange(v === true)} aria-describedby={`${id}-need`} />
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className={cn('block cursor-pointer truncate text-title-sm', contact.followedUp ? 'text-muted-foreground' : 'text-foreground')}>
          {contact.name}
        </label>
        <p id={`${id}-need`} className="truncate text-body-xs text-muted-foreground">
          {contact.need}
        </p>
      </div>
      <Badge variant={contact.followedUp ? 'green' : 'secondary'}>{contact.followedUp ? 'Relancé' : 'Message prêt'}</Badge>
    </li>
  )
}

function MessagesDialog({
  open,
  onOpenChange,
  contacts,
  onSend,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  contacts: MetContact[]
  onSend: (ids: string[]) => void
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const text = (c: MetContact) => drafts[c.id] ?? c.message
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[600px]"
        title="Relire les messages"
        description="Préparés par l’assistant à partir des notes prises au BNI. Modifiez-les avant l’envoi."
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Plus tard
            </Button>
            <Button variant="brand" disabled={contacts.length === 0 || contacts.some((c) => !text(c).trim())} onClick={() => onSend(contacts.map((c) => c.id))}>
              Envoyer les {pluralize(contacts.length, 'message')}
            </Button>
          </>
        }
      >
        {contacts.map((c) => (
          <div key={c.id} className="flex flex-col gap-1.5">
            <p className="text-title-sm text-foreground">
              {c.name} <span className="text-body-sm text-muted-foreground">· {c.need}</span>
            </p>
            <Textarea
              aria-label={`Message pour ${c.name}`}
              rows={3}
              className="min-h-0"
              value={text(c)}
              onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
            />
          </div>
        ))}
      </DialogContent>
    </Dialog>
  )
}

const TYPES: EventType[] = ['Salon', 'Club', 'Afterwork']

function NewEventSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { actions, now } = useCommercial()
  const toast = useToast()
  const formId = useId()
  const empty = {
    name: '',
    date: '',
    place: '',
    type: 'Salon' as EventType,
    cost: '',
    goal: '',
    attendees: ['EN'] as MemberId[],
    scanCards: true,
    followUp: true,
  }
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState<{ name?: string; date?: string }>({})
  const scanId = useId()
  const followId = useId()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next = { name: form.name.trim() ? undefined : 'Donnez un nom à l’événement.', date: form.date ? undefined : 'Choisissez une date.' }
    setErrors(next)
    if (next.name || next.date) return
    const names = form.attendees.map((a) => MEMBERS.find((m) => m.id === a)?.name).filter(Boolean)
    actions.createUpcoming({
      id: `u-${Date.now()}`,
      date: form.date,
      name: form.name.trim(),
      detail: [form.place.trim(), names.join(' et ')].filter(Boolean).join(', '),
      type: form.type,
      cost: Number(form.cost) || 0,
      goal: Number(form.goal) || 0,
      attendees: form.attendees,
      scanCards: form.scanCards,
      followUp: form.followUp,
    })
    toast({ message: `${form.name.trim()} ajouté aux événements à venir`, variant: 'success' })
    setForm(empty)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title="Nouvel événement"
        description="Pour relier ensuite les contacts scannés aux devis signés."
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" form={formId} variant="brand" leadingIcon={<Plus />}>
              Ajouter l’événement
            </Button>
          </>
        }
      >
        <form id={formId} noValidate onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Nom" error={errors.name}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Salon des entrepreneurs du Var" autoFocus />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date" error={errors.date}>
              <Input type="date" min={toIso(now)} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
            <Field label="Lieu" optional>
              <Input value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} placeholder="Hyères, Forum du Casino" />
            </Field>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-label-sm text-foreground">Type</span>
            <ChoiceGroup appearance="segmented" label="Type" options={TYPES} value={form.type} onValueChange={(type) => setForm({ ...form, type })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Coût" optional>
              <Input
                type="number"
                min={0}
                inputMode="decimal"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                trailingIcon="€"
              />
            </Field>
            <Field label="Objectif" optional>
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                value={form.goal}
                onChange={(e) => setForm({ ...form, goal: e.target.value })}
                trailingIcon="contacts"
              />
            </Field>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-label-sm text-foreground">Qui y va</span>
            <MultiChoiceGroup
              label="Qui y va"
              options={MEMBERS.map((m) => ({ value: m.id, label: m.name }))}
              values={form.attendees}
              onValuesChange={(attendees) => setForm({ ...form, attendees })}
            />
          </div>
          <div className="flex items-start gap-3 border-b border-border pb-4">
            <div className="flex-1">
              <label htmlFor={scanId} className="text-title-sm text-foreground">
                Scanner les cartes sur place
              </label>
              <p className="text-body-xs text-muted-foreground">Les contacts arrivent dans Clients, avec la source</p>
            </div>
            <Switch id={scanId} checked={form.scanCards} onCheckedChange={(scanCards) => setForm({ ...form, scanCards })} />
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <label htmlFor={followId} className="text-title-sm text-foreground">
                Relance préparée à J+1
              </label>
              <p className="text-body-xs text-muted-foreground">L’assistant rédige un message par contact</p>
            </div>
            <Switch id={followId} checked={form.followUp} onCheckedChange={(followUp) => setForm({ ...form, followUp })} />
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

/** Saisie d'une carte de visite. La lecture automatique (photo) arrivera avec l'application mobile. */
function ScanDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data, actions, now } = useCommercial()
  const toast = useToast()
  const formId = useId()
  const sources = useMemo(() => [...(data?.events ?? []).map((e) => e.name), ...(data?.upcoming ?? []).map((u) => u.name)], [data?.events, data?.upcoming])
  const [form, setForm] = useState({ company: '', name: '', email: '', event: '' })
  const [error, setError] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.company.trim()) return setError(true)
    const client = newClient({ name: form.company, contactName: form.name, email: form.email }, toIso(now))
    actions.createClient({ ...client, revenueNote: form.event ? `rencontré : ${form.event}` : 'carte scannée' })
    toast({ message: `${client.name} ajouté aux prospects`, variant: 'success' })
    setForm({ company: '', name: '', email: '', event: '' })
    setError(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Ajouter une carte de visite"
        description="Le contact arrive dans Clients en prospect, avec l’événement comme source."
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" form={formId} variant="brand">
              Ajouter le contact
            </Button>
          </>
        }
      >
        <form id={formId} noValidate onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Entreprise" error={error ? 'Le nom de l’entreprise est obligatoire.' : undefined}>
            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} autoFocus />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact" optional>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Email" optional>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          </div>
          <Field label="Rencontré à" optional>
            <Select value={form.event} onValueChange={(event) => setForm({ ...form, event })}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un événement" />
              </SelectTrigger>
              <SelectContent>
                {sources.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </form>
      </DialogContent>
    </Dialog>
  )
}
