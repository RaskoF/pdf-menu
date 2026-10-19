import { useId, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Buildings, CaretDown, CaretUp, Plus, UploadSimple } from '@phosphor-icons/react'
import {
  Avatar,
  Badge,
  Button,
  Chip,
  Dialog,
  DialogContent,
  Field,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  Skeleton,
  useToast,
} from '@/components/ui'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { formatEur, pluralize } from '@/lib/format'
import { useCommercial } from '../store'
import { CLIENT_STATUS_BADGE, CLIENT_STATUS_LABEL, daysBetween, formatShortDate, toIso } from '../lib'
import { newClient } from './client-factory'
import { parseClientsCsv, type ImportedClient } from './csv'
import type { ClientStatus } from '../types'

type Filter = 'tous' | ClientStatus
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'tous', label: 'Tous' },
  { key: 'actif', label: 'Clients actifs' },
  { key: 'prospect', label: 'Prospects' },
  { key: 'relancer', label: 'À relancer' },
  { key: 'perdu', label: 'Perdus' },
]

// Figma : « Clients / Liste » (131:3305)
export function ClientsPage() {
  const navigate = useNavigate()
  const { data, loading, now } = useCommercial()
  const [filter, setFilter] = useState<Filter>('tous')
  const [sort, setSort] = useState<'desc' | 'asc'>('desc')
  const [creating, setCreating] = useState(false)
  const [importing, setImporting] = useState(false)

  const clients = useMemo(() => data?.clients ?? [], [data?.clients])
  const rows = useMemo(
    () => clients.filter((c) => filter === 'tous' || c.status === filter).sort((a, b) => (a.revenue12m - b.revenue12m) * (sort === 'asc' ? 1 : -1)),
    [clients, filter, sort],
  )
  const count = (f: Filter) => clients.filter((c) => f === 'tous' || c.status === f).length
  const activeQuarter = clients.filter((c) => c.status === 'actif' && daysBetween(c.lastExchange.date, now) <= 90).length
  const signed = clients.reduce((s, c) => s + c.revenue12m, 0)

  return (
    <div className="flex min-h-full flex-col gap-5 p-layout-margin">
      <PageHeader
        title="Clients"
        subtitle={
          loading
            ? 'Chargement des comptes…'
            : `${pluralize(clients.length, 'compte')}. ${pluralize(activeQuarter, 'actif')} ce trimestre, ${formatEur(signed)} signés sur 12 mois.`
        }
        actions={
          <>
            <Button variant="outline" leadingIcon={<UploadSimple />} onClick={() => setImporting(true)}>
              Importer
            </Button>
            <Button leadingIcon={<Plus />} onClick={() => setCreating(true)}>
              Nouveau client
            </Button>
          </>
        }
      />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les clients">
        {FILTERS.map((f) => (
          <Chip key={f.key} active={filter === f.key} count={loading ? undefined : count(f.key)} onClick={() => setFilter(f.key)}>
            {f.label}
          </Chip>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <caption className="sr-only">Comptes clients</caption>
          <thead>
            <tr className="h-11 border-b border-border text-meta-md text-muted-foreground">
              <th scope="col" className="pl-5 font-normal">
                Client
              </th>
              <th scope="col" className="w-40 font-normal">
                Secteur
              </th>
              <th scope="col" className="w-36 pr-6 text-right font-normal" aria-sort={sort === 'asc' ? 'ascending' : 'descending'}>
                <button
                  type="button"
                  onClick={() => setSort((s) => (s === 'desc' ? 'asc' : 'desc'))}
                  className="focus-ring inline-flex items-center gap-1 rounded-sm uppercase hover:text-foreground"
                >
                  CA sur 12 mois
                  {sort === 'asc' ? <CaretUp className="size-3.5" aria-hidden /> : <CaretDown className="size-3.5" aria-hidden />}
                </button>
              </th>
              <th scope="col" className="w-52 font-normal">
                Dernier échange
              </th>
              <th scope="col" className="w-32 pr-5 font-normal">
                Statut
              </th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }, (_, i) => (
                  <tr key={i} className="h-[61px] border-b border-border last:border-0">
                    <td className="pl-5" colSpan={5}>
                      <Skeleton className="h-4 w-1/3" />
                    </td>
                  </tr>
                ))
              : rows.map((c) => (
                  <tr
                    key={c.id}
                    className="h-[61px] cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-surface-hover"
                    onClick={() => navigate(`/clients/${c.id}`)}
                  >
                    <td className="py-2 pl-5">
                      <div className="flex items-center gap-3">
                        <Avatar initials={c.initials} size="md" tone="neutral" className="text-label-sm" />
                        <div className="min-w-0">
                          <a
                            href={`#/clients/${c.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="focus-ring block truncate rounded-sm text-title-sm text-foreground hover:underline"
                          >
                            {c.name}
                          </a>
                          <p className="truncate text-body-sm text-muted-foreground">{[c.contactName, c.city].filter(Boolean).join(', ')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-body-md text-foreground">{c.sector}</td>
                    <td className="pr-6 text-right">
                      <span className="block text-title-sm tabular-nums text-foreground">{formatEur(c.revenue12m)}</span>
                      <span className="block text-body-sm text-muted-foreground">{c.revenueNote}</span>
                    </td>
                    <td>
                      <span className="block text-title-sm text-foreground">{c.lastExchange.label}</span>
                      <span className="block text-body-sm text-muted-foreground">{formatShortDate(c.lastExchange.date)}</span>
                    </td>
                    <td className="pr-5">
                      <Badge variant={CLIENT_STATUS_BADGE[c.status]}>{CLIENT_STATUS_LABEL[c.status]}</Badge>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && (
          <EmptyState
            icon={<Buildings />}
            title="Aucun compte dans ce filtre"
            action={
              <Button variant="outline" onClick={() => setFilter('tous')}>
                Voir tous les comptes
              </Button>
            }
          />
        )}
      </div>

      <NewClientSheet open={creating} onOpenChange={setCreating} onCreated={(id) => navigate(`/clients/${id}`)} />
      <ImportDialog open={importing} onOpenChange={setImporting} />
    </div>
  )
}

function NewClientSheet({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (id: string) => void }) {
  const { actions, now } = useCommercial()
  const toast = useToast()
  const formId = useId()
  const [form, setForm] = useState({ name: '', contactName: '', email: '', phone: '', city: '', sector: '', status: 'prospect' as ClientStatus })
  const [error, setError] = useState<string>()
  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Le nom du compte est obligatoire.')
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError('L’adresse email semble incomplète.')
    const client = newClient(form, toIso(now))
    actions.createClient(client)
    toast({ message: `${client.name} ajouté aux clients`, variant: 'success' })
    onOpenChange(false)
    setForm({ name: '', contactName: '', email: '', phone: '', city: '', sector: '', status: 'prospect' })
    setError(undefined)
    onCreated(client.id)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title="Nouveau client"
        description="Le compte arrive en prospect ; il passe client actif à la première signature."
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" form={formId} variant="brand" leadingIcon={<Plus />}>
              Ajouter le client
            </Button>
          </>
        }
      >
        <form id={formId} onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <Field label="Nom du compte" error={error && !form.name.trim() ? error : undefined}>
            <Input value={form.name} onChange={set('name')} placeholder="Institut Lumière du Sud" autoFocus />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact" optional>
              <Input value={form.contactName} onChange={set('contactName')} placeholder="Coralie Ferrero" />
            </Field>
            <Field label="Ville" optional>
              <Input value={form.city} onChange={set('city')} placeholder="La Garde" />
            </Field>
            <Field label="Email" optional error={error && form.name.trim() ? error : undefined}>
              <Input type="email" value={form.email} onChange={set('email')} placeholder="contact@exemple.fr" />
            </Field>
            <Field label="Téléphone" optional>
              <Input type="tel" value={form.phone} onChange={set('phone')} />
            </Field>
          </div>
          <Field label="Secteur" optional>
            <Input value={form.sector} onChange={set('sector')} placeholder="Beauté" />
          </Field>
          <Field label="Statut">
            <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as ClientStatus }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CLIENT_STATUS_LABEL) as ClientStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {CLIENT_STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </form>
      </SheetContent>
    </Sheet>
  )
}

/** Import CSV lu dans le navigateur : rien n'est envoyé à un serveur dans ce prototype. */
function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { actions, now } = useCommercial()
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [parsed, setParsed] = useState<{ rows: ImportedClient[]; skipped: number; file: string } | null>(null)
  const [error, setError] = useState<string>()

  const onFile = async (file: File | undefined) => {
    setError(undefined)
    setParsed(null)
    if (!file) return
    if (file.size > 1_000_000) return setError('Fichier trop lourd : 1 Mo maximum.')
    const result = parseClientsCsv(await file.text())
    if (!result.rows.length) return setError('Aucune ligne lisible. Vérifiez que la première ligne contient une colonne « nom ».')
    setParsed({ ...result, file: file.name })
  }

  const confirm = () => {
    if (!parsed) return
    const today = toIso(now)
    parsed.rows.forEach((r) => actions.createClient(newClient(r, today)))
    toast({ message: `${pluralize(parsed.rows.length, 'compte importé', 'comptes importés')}`, variant: 'success' })
    setParsed(null)
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) {
          setParsed(null)
          setError(undefined)
        }
      }}
    >
      <DialogContent
        title="Importer des comptes"
        description="Fichier CSV avec une ligne d’en-tête : nom, contact, ville, secteur, email. Les comptes arrivent en prospects."
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button variant="brand" disabled={!parsed} onClick={confirm}>
              {parsed ? `Importer ${pluralize(parsed.rows.length, 'compte')}` : 'Importer'}
            </Button>
          </>
        }
      >
        <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" aria-label="Fichier CSV" onChange={(e) => onFile(e.target.files?.[0])} />
        <Button variant="outline" leadingIcon={<UploadSimple />} onClick={() => inputRef.current?.click()} className="w-fit">
          Choisir un fichier CSV
        </Button>
        {error && (
          <p role="alert" className="text-body-sm text-danger">
            {error}
          </p>
        )}
        {parsed && (
          <div className="flex flex-col gap-2" aria-live="polite">
            <p className="text-body-sm text-foreground">
              {parsed.file} : {pluralize(parsed.rows.length, 'compte')} prêt{parsed.rows.length > 1 ? 's' : ''}
              {parsed.skipped ? `, ${pluralize(parsed.skipped, 'ligne ignorée', 'lignes ignorées')} (sans nom)` : ''}.
            </p>
            <ul className="max-h-40 overflow-y-auto rounded-md bg-surface-1 p-3 text-body-sm text-muted-foreground">
              {parsed.rows.slice(0, 8).map((r, i) => (
                <li key={i}>
                  {r.name}
                  {r.city ? `, ${r.city}` : ''}
                </li>
              ))}
              {parsed.rows.length > 8 && <li>… et {parsed.rows.length - 8} autres</li>}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
