import { useId, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowSquareOut, Envelope, FileText, Flag, NotePencil, Phone, Plus, PushPin, WarningCircle } from '@phosphor-icons/react'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  Chip,
  Dialog,
  DialogContent,
  Field,
  IconButton,
  Input,
  Progress,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  useToast,
} from '@/components/ui'
import { EmptyState } from '@/components/app/empty-state'
import { formatEur, pluralize } from '@/lib/format'
import { useCommercial } from '../store'
import { CLIENT_STATUS_BADGE, CLIENT_STATUS_LABEL, daysBetween, formatPercent, formatShortDate, monthLabel, toIso } from '../lib'
import { amountLabel } from '../selectors'
import { ActivityIcon } from '../components/activity-icon'
import { Kpi } from '../components/kpi'
import { StatusBadge } from '../components/status-badge'
import { NewDevisSheet } from '../devis/new-devis-sheet'
import { initialsOf } from './client-factory'
import type { ClientActivity } from '../types'

type ActivityFilter = 'tout' | 'echange' | 'devis'

const INVOICE_LABEL = { payee: ['Payée', 'green'], en_attente: ['En attente', 'secondary'], en_retard: ['En retard', 'red'] } as const

/** Regroupe le fil par période : « Cette semaine », puis par mois */
function groupActivity(items: ClientActivity[], now: Date) {
  const groups: { label: string; items: ClientActivity[] }[] = []
  for (const item of [...items].sort((a, b) => b.date.localeCompare(a.date))) {
    const label = daysBetween(item.date, now) <= 7 ? 'Cette semaine' : monthLabel(item.date)
    const last = groups[groups.length - 1]
    if (last?.label === label) last.items.push(item)
    else groups.push({ label, items: [item] })
  }
  return groups
}

// Figma : « Client / Fiche » (34:975)
export function ClientPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { data, loading, actions, now } = useCommercial()
  const noteId = useId()
  const [note, setNote] = useState('')
  const [filter, setFilter] = useState<ActivityFilter>('tout')
  const [newDevis, setNewDevis] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [pinOpen, setPinOpen] = useState(false)
  const client = data?.clients.find((c) => c.id === id)
  const devis = useMemo(() => (data?.devis ?? []).filter((d) => d.clientId === id), [data?.devis, id])

  if (loading)
    return (
      <div className="p-layout-margin">
        <Skeleton className="h-[480px] rounded-lg" />
      </div>
    )
  if (!client) {
    return (
      <div className="grid min-h-full place-content-center p-layout-margin">
        <EmptyState icon={<WarningCircle />} title="Client introuvable" action={<Button onClick={() => navigate('/clients')}>Retour aux clients</Button>}>
          Ce compte n’existe pas ou a été supprimé.
        </EmptyState>
      </div>
    )
  }

  const primary = client.contacts.find((c) => c.primary) ?? client.contacts[0]
  const signed = devis.filter((d) => d.status === 'signe')
  const signedSum = client.revenue12m
  const visible = client.activity.filter((a) => filter === 'tout' || a.category === filter)
  const groups = groupActivity(visible, now)
  const today = toIso(now)

  const addNote = () => {
    const text = note.trim()
    if (!text) return
    actions.updateClient(client.id, (c) => ({
      ...c,
      lastExchange: { label: 'Note ajoutée', date: today },
      activity: [{ id: `note-${Date.now()}`, kind: 'note', title: 'Note de l’équipe', detail: text, date: today, category: 'echange' }, ...c.activity],
    }))
    setNote('')
    toast({ message: 'Note ajoutée au fil d’activité', variant: 'success' })
  }

  return (
    <div className="flex min-h-full flex-col gap-5 p-layout-margin">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 gap-4">
          <span aria-hidden className="grid size-14 shrink-0 place-content-center rounded-lg bg-tag-orange-bg text-title-md text-tag-orange-fg">
            {client.initials}
          </span>
          <div className="flex min-w-0 flex-col gap-1.5">
            <nav aria-label="Fil d’Ariane" className="text-meta-md text-muted-foreground">
              <Link to="/clients" className="focus-ring rounded-sm hover:text-foreground">
                Clients
              </Link>
              <span aria-hidden> / </span>
              <span aria-current="page">{client.name}</span>
            </nav>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-h1 text-foreground">{client.name}</h1>
              <Badge variant={CLIENT_STATUS_BADGE[client.status]}>{CLIENT_STATUS_LABEL[client.status]}</Badge>
              <Badge variant="orange">{client.sectorTag ?? client.sector}</Badge>
            </div>
            <p className="text-body-md text-muted-foreground">{client.summary ?? [client.contactName, client.city].filter(Boolean).join(', ')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {primary?.phone && (
            <IconButton variant="outline" label={`Appeler ${primary.name}`} asChild>
              <a href={`tel:${primary.phone}`}>
                <Phone />
              </a>
            </IconButton>
          )}
          {primary?.email && (
            <IconButton variant="outline" label={`Écrire à ${primary.name}`} asChild>
              <a href={`mailto:${primary.email}`}>
                <Envelope />
              </a>
            </IconButton>
          )}
          <Button leadingIcon={<Plus />} onClick={() => setNewDevis(true)}>
            Nouveau devis
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-5 rounded-lg bg-card p-5 xl:flex-row xl:items-center">
        <dl className="grid flex-1 grid-cols-2 gap-5 sm:grid-cols-4">
          <Kpi label="CA signé" value={formatEur(signedSum)} sub={pluralize(Math.max(signed.length, client.projects.length), 'projet')} size="md" />
          <Kpi
            label="Marge réelle"
            value={client.margin !== undefined ? formatPercent(client.margin) : '—'}
            sub={client.margin !== undefined ? (client.margin >= 0.4 ? 'au-dessus de l’objectif 40 %' : 'sous l’objectif 40 %') : 'pas encore de projet'}
            subTone={client.margin !== undefined ? (client.margin >= 0.4 ? 'success' : 'danger') : 'muted'}
            size="md"
          />
          <Kpi label="Paiement" value={client.paymentDelay ?? '—'} sub={client.paymentDelay ? 'délai moyen, à l’heure' : 'aucune facture'} size="md" />
          <Kpi label="Dernier échange" value={`${daysBetween(client.lastExchange.date, now)} j`} sub={client.lastExchange.label} size="md" />
        </dl>
        {client.nextMilestone && (
          <div className="flex items-center gap-3 rounded-md bg-surface-1 px-4 py-3 xl:w-[480px]">
            <Flag className="size-5 shrink-0 text-foreground" aria-hidden />
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="text-title-sm text-foreground">{client.nextMilestone.title}</p>
              <p className="text-body-sm text-muted-foreground">{client.nextMilestone.detail}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/reunions')}>
              Préparer
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Tabs defaultValue="activite" className="flex min-w-0 flex-col gap-4">
          <TabsList type="underline" aria-label="Fiche client">
            <TabsTrigger value="activite" count={client.activity.length}>
              Activité
            </TabsTrigger>
            <TabsTrigger value="projets" count={client.projects.length}>
              Projets
            </TabsTrigger>
            <TabsTrigger value="devis" count={devis.length + client.invoices.length}>
              Devis et factures
            </TabsTrigger>
            <TabsTrigger value="fichiers" count={client.files.length}>
              Fichiers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activite" className="flex flex-col gap-4 outline-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <form
                className="flex-1"
                onSubmit={(e) => {
                  e.preventDefault()
                  addNote()
                }}
              >
                <label htmlFor={noteId} className="sr-only">
                  Ajouter une note
                </label>
                <Input
                  id={noteId}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  leadingIcon={<NotePencil />}
                  placeholder="Ajouter une note, @ pour mentionner l’équipe"
                />
              </form>
              <div className="flex gap-2" role="group" aria-label="Filtrer l’activité">
                <Chip active={filter === 'tout'} onClick={() => setFilter('tout')}>
                  Tout
                </Chip>
                <Chip active={filter === 'echange'} onClick={() => setFilter('echange')}>
                  Échanges
                </Chip>
                <Chip active={filter === 'devis'} onClick={() => setFilter('devis')}>
                  Devis
                </Chip>
              </div>
            </div>
            <Card className="gap-5">
              {groups.length === 0 && <p className="text-body-sm text-muted-foreground">Rien à afficher pour ce filtre.</p>}
              {groups.map((g) => (
                <section key={g.label} aria-label={g.label} className="flex flex-col gap-4">
                  <h2 className="text-meta-md text-muted-foreground">{g.label}</h2>
                  <ol className="flex flex-col gap-5">
                    {g.items.map((a) => (
                      <li key={a.id} className="flex gap-3">
                        <ActivityIcon kind={a.kind} />
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <p className="text-title-sm text-foreground">{a.title}</p>
                          <p className="text-body-sm text-muted-foreground">{a.detail}</p>
                        </div>
                        <time dateTime={a.date} className="shrink-0 text-body-xs text-muted-foreground">
                          {formatShortDate(a.date)}
                        </time>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </Card>
          </TabsContent>

          <TabsContent value="projets" className="outline-none">
            <Card>
              {client.projects.length === 0 ? (
                <EmptyState icon={<FileText />} title="Pas encore de projet">
                  Un projet est créé automatiquement à la signature d’un devis.
                </EmptyState>
              ) : (
                client.projects.map((p) => (
                  <div key={p.id} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <p className="flex-1 text-title-sm text-foreground">{p.title}</p>
                      <Badge variant="blue">{p.tag}</Badge>
                    </div>
                    <Progress value={Math.round(p.progress * 100)} label={`Avancement de ${p.title}`} />
                    <p className="text-body-sm text-muted-foreground">{p.detail}</p>
                  </div>
                ))
              )}
            </Card>
          </TabsContent>

          <TabsContent value="devis" className="outline-none">
            <Card className="gap-0 p-0">
              {devis.length + client.invoices.length === 0 && (
                <EmptyState
                  icon={<FileText />}
                  title="Aucun devis ni facture"
                  action={
                    <Button variant="outline" onClick={() => setNewDevis(true)}>
                      Créer un devis
                    </Button>
                  }
                />
              )}
              <ul>
                {devis.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-0">
                    <FileText className="size-4 text-muted-foreground" aria-hidden />
                    <Link to={`/devis/${d.id}/editeur`} className="focus-ring min-w-0 flex-1 truncate rounded-sm text-title-sm text-foreground hover:underline">
                      {d.number || 'Prospect'}, {d.title}
                    </Link>
                    <span className="text-title-sm tabular-nums text-foreground">{amountLabel(d)}</span>
                    <StatusBadge status={d.status} />
                  </li>
                ))}
                {client.invoices.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-0">
                    <FileText className="size-4 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-title-sm text-foreground">
                      Facture {f.number}, {formatShortDate(f.date)}
                    </span>
                    <span className="text-title-sm tabular-nums text-foreground">{formatEur(f.amount)}</span>
                    <Badge variant={INVOICE_LABEL[f.status][1]}>{INVOICE_LABEL[f.status][0]}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>

          <TabsContent value="fichiers" className="outline-none">
            <Card className="gap-0 p-0">
              {client.files.length === 0 ? (
                <EmptyState icon={<FileText />} title="Aucun fichier">
                  Les briefs, rushs et livrables partagés avec ce client apparaîtront ici.
                </EmptyState>
              ) : (
                <ul>
                  {client.files.map((f) => (
                    <li key={f.id} className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-0">
                      <FileText className="size-4 text-muted-foreground" aria-hidden />
                      <span className="min-w-0 flex-1 truncate text-body-md text-foreground">{f.name}</span>
                      <span className="text-body-sm text-muted-foreground">{f.size}</span>
                      <span className="w-16 text-right text-body-sm text-muted-foreground">{formatShortDate(f.date)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        <aside className="flex flex-col gap-4" aria-label="Informations du compte">
          <Card>
            <CardHeader
              title="Contacts"
              action={
                <IconButton label="Ajouter un contact" size="sm" onClick={() => setContactOpen(true)}>
                  <Plus />
                </IconButton>
              }
            />
            {client.contacts.length === 0 && <p className="text-body-sm text-muted-foreground">Aucun contact enregistré.</p>}
            <ul className="flex flex-col gap-4">
              {client.contacts.map((c) => (
                <li key={c.id} className="flex items-center gap-3">
                  <Avatar initials={c.initials} size="md" tone="neutral" className="text-label-sm" />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 text-title-sm text-foreground">
                      {c.name}
                      {c.primary && <Badge variant="secondary">Principal</Badge>}
                    </p>
                    <p className="truncate text-body-sm text-muted-foreground">{c.role}</p>
                  </div>
                  {c.phone && (
                    <IconButton label={`Appeler ${c.name}`} size="sm" asChild>
                      <a href={`tel:${c.phone}`}>
                        <Phone />
                      </a>
                    </IconButton>
                  )}
                  {c.email && (
                    <IconButton label={`Écrire à ${c.name}`} size="sm" asChild>
                      <a href={`mailto:${c.email}`}>
                        <Envelope />
                      </a>
                    </IconButton>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader
              title="En cours"
              action={
                client.projects.length > 0 && (
                  <IconButton label="Ouvrir les projets" size="sm" onClick={() => navigate('/projets')}>
                    <ArrowSquareOut />
                  </IconButton>
                )
              }
            />
            {client.projects.length === 0 ? (
              <p className="text-body-sm text-muted-foreground">Aucun projet en cours.</p>
            ) : (
              client.projects.map((p) => (
                <div key={p.id} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <p className="flex-1 text-title-sm text-foreground">{p.title}</p>
                    <Badge variant="blue">{p.tag}</Badge>
                  </div>
                  <Progress value={Math.round(p.progress * 100)} label={`Avancement de ${p.title}`} />
                  <p className="text-body-sm text-muted-foreground">{p.detail}</p>
                </div>
              ))
            )}
          </Card>

          <Card>
            <CardHeader
              title="Épinglé"
              action={
                <IconButton label="Épingler une information" size="sm" onClick={() => setPinOpen(true)}>
                  <Plus />
                </IconButton>
              }
            />
            {client.pinned.length === 0 && <p className="text-body-sm text-muted-foreground">Épinglez ce que toute l’équipe doit savoir sur ce compte.</p>}
            <ul className="flex flex-col gap-3">
              {client.pinned.map((p) => (
                <li key={p} className="flex gap-2.5 text-body-sm text-foreground">
                  <PushPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>

      <NewDevisSheet open={newDevis} onOpenChange={setNewDevis} defaultClientId={client.id} />
      <ContactDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        onSave={(c) => {
          actions.updateClient(client.id, (x) => ({
            ...x,
            contacts: [...x.contacts, { ...c, id: `c-${Date.now()}`, initials: initialsOf(c.name), primary: x.contacts.length === 0 }],
          }))
          setContactOpen(false)
        }}
      />
      <PinDialog
        open={pinOpen}
        onOpenChange={setPinOpen}
        onSave={(text) => {
          actions.updateClient(client.id, (x) => ({ ...x, pinned: [...x.pinned, text] }))
          setPinOpen(false)
        }}
      />
    </div>
  )
}

function ContactDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSave: (c: { name: string; role: string; email: string; phone: string }) => void
}) {
  const formId = useId()
  const [form, setForm] = useState({ name: '', role: '', email: '', phone: '' })
  const [error, setError] = useState(false)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Ajouter un contact"
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" form={formId} variant="brand">
              Ajouter
            </Button>
          </>
        }
      >
        <form
          id={formId}
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!form.name.trim()) return setError(true)
            onSave({ ...form, name: form.name.trim() })
            setForm({ name: '', role: '', email: '', phone: '' })
            setError(false)
          }}
        >
          <Field label="Nom" error={error ? 'Le nom est obligatoire.' : undefined}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          </Field>
          <Field label="Rôle" optional>
            <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Gérante, décide et signe" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" optional>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Téléphone" optional>
              <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PinDialog({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; onSave: (text: string) => void }) {
  const [text, setText] = useState('')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Épingler une information"
        description="Visible par toute l’équipe en haut de la fiche."
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              variant="brand"
              disabled={!text.trim()}
              onClick={() => {
                onSave(text.trim())
                setText('')
              }}
            >
              Épingler
            </Button>
          </>
        }
      >
        <Textarea
          aria-label="Information à épingler"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Réservations via Planity, 86 RDV par mois"
        />
      </DialogContent>
    </Dialog>
  )
}
