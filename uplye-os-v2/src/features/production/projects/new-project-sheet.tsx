import { useEffect, useId, useMemo, useState } from 'react'
import { ArrowRight } from '@phosphor-icons/react'
import {
  Button,
  Field,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  Switch,
  useToast,
} from '@/components/ui'
import { TEAM, type MemberId } from '@/data/session'
import { addDays, formatShortDate, toIso } from '@/lib/dates'
import { formatEur } from '@/lib/format'
import { useClientsById, useCommercial } from '@/features/commercial/store'
import { devisAmount, devisTotals } from '@/features/commercial/lib'
import { useProduction } from '../store'
import { PROCESSES } from '../mock-data'
import type { Project } from '../types'

const FREE = 'libre'

// Figma : « Projets / Nouveau projet » (135:2220). Un projet naît d'un devis signé ; phases et tâches viennent du process.
export function NewProjectSheet({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (id: string) => void }) {
  const toast = useToast()
  const commercial = useCommercial()
  const clients = useClientsById()
  const { data, actions, now } = useProduction()
  const [devisId, setDevisId] = useState(FREE)
  const [clientId, setClientId] = useState('')
  const [title, setTitle] = useState('')
  const [processId, setProcessId] = useState(PROCESSES[0]!.id)
  const [pilot, setPilot] = useState<MemberId>('AL')
  const [shooting, setShooting] = useState('')
  const [delivery, setDelivery] = useState('')
  const [clientSpace, setClientSpace] = useState(true)
  const [notify, setNotify] = useState(true)
  const [error, setError] = useState<string>()
  const spaceId = useId()
  const notifyId = useId()

  const signed = useMemo(() => {
    const linked = new Set((data?.projects ?? []).map((p) => p.devisId))
    return (commercial.data?.devis ?? []).filter((d) => d.status === 'signe' && !linked.has(d.id))
  }, [commercial.data?.devis, data?.projects])
  const devis = signed.find((d) => d.id === devisId)
  const process = PROCESSES.find((p) => p.id === processId)!
  const totals = devis ? devisTotals(devis) : null
  const hours = devis ? Math.max(1, Math.round(devis.lines.reduce((h, l) => h + (l.hours ?? l.cost / 45), 0))) : 0
  const taskCount = process.phases.reduce((n, p) => n + p.tasks.length, 0)
  const contact = clients.get(devis?.clientId ?? clientId)?.contactName

  useEffect(() => {
    if (!open) return
    const first = signed[0]
    setDevisId(first?.id ?? FREE)
    setTitle(first?.title ?? '')
    setClientId(first?.clientId ?? '')
    setShooting('')
    setDelivery(addDays(toIso(now), 14))
    setError(undefined)
    // Réinitialise à chaque ouverture
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const create = () => {
    const owner = devis?.clientId ?? clientId
    if (!owner) return setError('Choisissez le client du projet.')
    if (!title.trim()) return setError('Donnez un nom au projet.')
    if (!delivery) return setError('Indiquez une date de livraison.')
    const today = toIso(now)
    const span = Math.max(process.phases.length, Math.round((new Date(delivery).getTime() - new Date(today).getTime()) / 86_400_000))
    const step = Math.max(1, Math.floor(span / process.phases.length))
    const id = `p-${Date.now()}`
    const project: Project = {
      id,
      title: title.trim(),
      clientId: owner,
      brand: process.brand,
      devisId: devis?.id,
      devisNumber: devis?.number,
      pilot,
      process: process.label,
      phases: process.phases.map((ph, i) => {
        const start = addDays(today, i * step)
        const end = i === process.phases.length - 1 ? delivery : addDays(start, step - 1)
        return {
          id: `${id}-ph${i}`,
          label: ph.label,
          start,
          end,
          tasks: ph.tasks.map((label, j) => ({ id: `${id}-t${i}-${j}`, label, owner: i === 0 ? 'EN' : pilot, due: end, done: false })),
        }
      }),
      currentPhase: 0,
      due: delivery,
      shootingDate: shooting || undefined,
      revenue: devis ? (devisAmount(devis) ?? 0) : 0,
      hoursSold: hours,
      hoursSpent: 0,
      plannedMargin: totals?.margin ?? null,
      revisions: process.brand === 'studio' ? { used: 0, included: 2 } : null,
      clientWaiting: clientSpace ? [{ id: 'w1', title: 'Brief à remplir', detail: `Lien envoyé à ${contact ?? 'la cliente'} à l’instant` }] : [],
      deliverables: [],
      clientSpace,
    }
    actions.createProject(project)
    toast({ message: `Projet créé : ${taskCount} tâches${notify ? ', équipe prévenue' : ''}`, variant: 'success' })
    onOpenChange(false)
    onCreated(id)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title="Nouveau projet"
        description="Créé depuis le devis signé : phases, tâches et espace client sont préparés."
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button variant="brand" leadingIcon={<ArrowRight />} onClick={create}>
              Créer le projet
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-1.5">
          <Label>Depuis le devis</Label>
          <Select
            value={devisId}
            onValueChange={(v) => {
              setDevisId(v)
              const d = signed.find((x) => x.id === v)
              if (d) {
                setTitle(d.title)
                setClientId(d.clientId)
              }
            }}
          >
            <SelectTrigger aria-label="Depuis le devis">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {signed.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.number}, {clients.get(d.clientId)?.name}, {formatEur(devisAmount(d) ?? 0)} HT
                </SelectItem>
              ))}
              <SelectItem value={FREE}>Projet sans devis</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-body-sm text-muted-foreground">
            {devis
              ? `Signé le ${formatShortDate(devis.signedAt ?? toIso(now))}, acompte de ${formatEur(Math.round((totals!.ttc * (devis.schedule[0] ?? 0)) / 100))} à recevoir.`
              : signed.length === 0
                ? 'Aucun devis signé sans projet : signez un devis dans Commercial, ou créez un projet libre.'
                : 'Projet libre, sans budget de référence.'}
          </p>
        </div>

        {!devis && (
          <div className="flex flex-col gap-1.5">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger aria-label="Client">
                <SelectValue placeholder="Choisir un client" />
              </SelectTrigger>
              <SelectContent>
                {(commercial.data?.clients ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Field label="Nom du projet">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Vidéo pub + shooting" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Process</Label>
            <Select value={processId} onValueChange={setProcessId}>
              <SelectTrigger aria-label="Process">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROCESSES.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Pilote</Label>
            <Select value={pilot} onValueChange={(v) => setPilot(v as MemberId)}>
              <SelectTrigger aria-label="Pilote">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEAM.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Field label="Tournage" optional>
            <Input type="date" min={toIso(now)} value={shooting} onChange={(e) => setShooting(e.target.value)} />
          </Field>
          <Field label="Livraison">
            <Input type="date" min={toIso(now)} value={delivery} onChange={(e) => setDelivery(e.target.value)} />
          </Field>
        </div>

        <dl className="grid grid-cols-3 gap-3">
          {[
            ['Budget temps', devis ? `${hours} h` : '—'],
            ['Marge prévue', totals?.margin != null ? `${Math.round(totals.margin * 100)} %` : '—'],
            ['Tâches créées', String(taskCount)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-surface-1 p-4">
              <dt className="text-body-sm text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-stat-md text-foreground">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex items-start gap-3 border-b border-border pb-4">
          <div className="flex-1">
            <label htmlFor={spaceId} className="text-title-sm text-foreground">
              Ouvrir l’espace client
            </label>
            <p className="text-body-xs text-muted-foreground">{contact ?? 'Le client'} reçoit un lien vers le brief</p>
          </div>
          <Switch id={spaceId} checked={clientSpace} onCheckedChange={setClientSpace} />
        </div>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <label htmlFor={notifyId} className="text-title-sm text-foreground">
              Prévenir l’équipe
            </label>
            <p className="text-body-xs text-muted-foreground">
              {TEAM.filter((m) => m.id !== 'EN')
                .map((m) => m.name)
                .join(' et ')}
              , sur WhatsApp
            </p>
          </div>
          <Switch id={notifyId} checked={notify} onCheckedChange={setNotify} />
        </div>
        {error && (
          <p role="alert" className="text-body-sm text-danger">
            {error}
          </p>
        )}
      </SheetContent>
    </Sheet>
  )
}
