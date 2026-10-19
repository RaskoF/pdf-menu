import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, DownloadSimple, Eye, EyeSlash, PaperPlaneTilt, Plus, WarningCircle } from '@phosphor-icons/react'
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
  Input,
  Label,
  Skeleton,
  useToast,
} from '@/components/ui'
import { EmptyState } from '@/components/app/empty-state'
import { cn } from '@/lib/utils'
import { useClientsById, useCommercial } from '../store'
import { addDays, readiness, toIso } from '../lib'
import { makeLine } from '../mock-data'
import { DevisDocument, SHOWCASE_PICK } from './devis-document'
import { Inspector, type InspectorTab } from './inspector'
import type { Contact, Devis, SectionId } from '../types'

const STEPS = [
  { status: 'brouillon', label: 'Brouillon' },
  { status: 'envoye', label: 'Envoyé' },
  { status: 'ouvert', label: 'Ouvert' },
  { status: 'signe', label: 'Signé' },
] as const
const STEP_INDEX: Record<Devis['status'], number> = { a_chiffrer: 0, brouillon: 0, envoye: 1, ouvert: 2, signe: 3, refuse: 2, archive: 0 }

type SendState = { kind: 'idle' } | { kind: 'sending' } | { kind: 'failed'; email: string }

/** Simule l'envoi : une adresse en .invalid est refusée par le serveur du destinataire. */
const sendProposal = (email: string) =>
  new Promise<'ok' | 'bounced'>((resolve) => setTimeout(() => resolve(/\.invalid$/i.test(email.trim()) ? 'bounced' : 'ok'), 1200))

const savedLabel = (seconds: number) => (seconds < 5 ? 'à l’instant' : seconds < 60 ? `il y a ${seconds} s` : `il y a ${Math.floor(seconds / 60)} min`)

// Figma : « Éditeur de devis » (33:780), « Envoi en cours » (119:2378), « Échec d’envoi » (119:2502).
export function DevisEditorPage({ send = sendProposal }: { send?: (email: string) => Promise<'ok' | 'bounced'> }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { data, loading, actions, now } = useCommercial()
  const devis = data?.devis.find((d) => d.id === id)
  const client = useClientsById().get(devis?.clientId ?? '')
  const contact: Contact | undefined = client?.contacts.find((c) => c.primary) ?? client?.contacts[0]
  const meeting = data?.meetings.find((m) => m.clientId && m.clientId === devis?.clientId && m.quoteStart)

  const [preview, setPreview] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionId>('prestations')
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null)
  const [tab, setTab] = useState<InspectorTab>('section')
  const [sendState, setSendState] = useState<SendState>({ kind: 'idle' })
  const [dateOpen, setDateOpen] = useState(false)
  const [savedAt, setSavedAt] = useState(() => Date.now())
  const [, tick] = useState(0)
  const sections = useRef(new Map<SectionId, HTMLElement>())
  const catalogRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const checklistRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 10_000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    if (devis && selectedLineId === null && devis.lines.length) setSelectedLineId(devis.lines[Math.min(1, devis.lines.length - 1)]!.id)
  }, [devis, selectedLineId])

  // « / » place le curseur dans la recherche catalogue (hors champ de saisie)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (e.key !== '/' || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return
      e.preventDefault()
      catalogRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const sectionRef = useCallback(
    (sid: SectionId) => (el: HTMLElement | null) => {
      if (el) sections.current.set(sid, el)
      else sections.current.delete(sid)
    },
    [],
  )

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-4 bg-sidebar p-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="flex-1 rounded-xl" />
      </div>
    )
  }
  if (!devis) {
    return (
      <div className="grid h-full place-content-center bg-background">
        <EmptyState icon={<WarningCircle />} title="Devis introuvable" action={<Button onClick={() => navigate('/devis')}>Retour aux devis</Button>}>
          Il a peut-être été archivé ou le lien est incomplet.
        </EmptyState>
      </div>
    )
  }

  const today = toIso(now)
  const edit = (update: (d: Devis) => Devis) => {
    actions.updateDevis(devis.id, (d) => ({ ...update(d), editedAt: today }))
    setSavedAt(Date.now())
  }
  const ready = readiness(devis, contact?.email)
  const decided = devis.status === 'signe' || devis.status === 'refuse' || devis.status === 'archive'
  const alreadySent = devis.status === 'envoye' || devis.status === 'ouvert'
  const line = devis.lines.find((l) => l.id === selectedLineId) ?? null
  const seconds = Math.floor((Date.now() - savedAt) / 1000)

  const goTo = (sid: SectionId) => {
    setActiveSection(sid)
    sections.current.get(sid)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const fixItem = (itemId: string) => {
    if (itemId === 'client') {
      setTab('client')
      setTimeout(() => emailRef.current?.focus(), 50)
    } else if (itemId === 'prestations') {
      goTo('prestations')
      setTimeout(() => catalogRef.current?.focus(), 300)
    } else if (itemId === 'realisations') goTo('realisations')
    else if (itemId === 'echeancier') goTo('echeancier')
    else if (itemId === 'tournage') setDateOpen(true)
  }

  const doSend = async () => {
    if (!contact) return fixItem('client')
    const snapshot = devis
    setSendState({ kind: 'sending' })
    const result = await send(contact.email)
    if (result === 'bounced') {
      setSendState({ kind: 'failed', email: contact.email })
      return
    }
    setSendState({ kind: 'idle' })
    if (alreadySent) {
      actions.logDevis(devis.id, { kind: 'sent', title: 'Nouvelle version envoyée', detail: `À ${contact.email}`, when: 'à l’instant' })
      toast({ message: `Nouvelle version envoyée à ${client?.name}`, variant: 'success' })
      return
    }
    actions.updateDevis(devis.id, (d) => ({
      ...d,
      status: 'envoye',
      sentAt: today,
      expiresAt: addDays(today, 30),
      nextAction: 'Relance J+3',
      activity: [{ id: `sent-${Date.now()}`, kind: 'sent', title: 'Devis envoyé', detail: 'Par Enzo, lien et PDF', when: 'à l’instant' }, ...d.activity],
    }))
    navigate('/devis')
    toast({
      message: `Devis ${devis.number} envoyé à ${client?.name}`,
      variant: 'success',
      action: { label: 'Annuler', onClick: () => actions.restoreDevis(snapshot) },
    })
  }

  const copyLink = async () => {
    const link = `${window.location.origin}${window.location.pathname}#/p/${devis.id}`
    try {
      await navigator.clipboard.writeText(link)
      toast({ message: 'Lien de la proposition copié', variant: 'success' })
    } catch {
      toast({ message: 'Copie impossible : autorisez le presse-papiers', variant: 'error' })
    }
  }

  const hiddenSections = devis.sections.filter((s) => s.hidden)
  const step = STEP_INDEX[devis.status]

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground print:bg-background">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 print:hidden md:px-5">
        <IconButton label="Retour aux devis" className="text-sidebar-foreground hover:bg-sidebar-hover" asChild>
          <Link to={`/devis?devis=${devis.id}`}>
            <ArrowLeft />
          </Link>
        </IconButton>
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate text-title-md text-sidebar-foreground">{client?.name}</h1>
          <p className="truncate text-body-xs text-sidebar-muted" aria-live="polite">
            {devis.number || 'Prospect'},{' '}
            {decided ? `devis ${devis.status === 'signe' ? 'signé' : devis.status === 'refuse' ? 'refusé' : 'archivé'}` : `enregistré ${savedLabel(seconds)}`}
          </p>
        </div>

        <ol className="order-last flex w-full items-center gap-2 overflow-x-auto lg:order-none lg:mx-auto lg:w-auto" aria-label="Avancement du devis">
          {STEPS.map((s, i) => (
            <li key={s.status} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden className="h-px w-6 bg-sidebar-border sm:w-8" />}
              <span
                aria-current={i === step ? 'step' : undefined}
                className={cn(
                  'rounded-full px-2.5 py-1 text-label-sm',
                  i === step ? 'bg-sidebar-accent text-sidebar-foreground' : i < step ? 'text-sidebar-foreground' : 'text-sidebar-muted',
                )}
              >
                {s.label}
              </span>
            </li>
          ))}
        </ol>

        <div className="ml-auto flex flex-wrap items-center gap-1 lg:ml-0">
          <Button
            variant="ghost"
            leadingIcon={preview ? <EyeSlash /> : <Eye />}
            aria-pressed={preview}
            onClick={() => setPreview((p) => !p)}
            className="text-sidebar-foreground hover:bg-sidebar-hover"
          >
            {preview ? 'Quitter l’aperçu' : 'Aperçu client'}
          </Button>
          <Button variant="ghost" leadingIcon={<DownloadSimple />} onClick={() => window.print()} className="text-sidebar-foreground hover:bg-sidebar-hover">
            PDF
          </Button>
          {!decided && ready.blocking.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-danger hover:bg-sidebar-hover"
              onClick={() => {
                checklistRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                fixItem(ready.blocking[0]!.id)
              }}
            >
              {ready.blocking.length} point{ready.blocking.length > 1 ? 's' : ''} bloquant{ready.blocking.length > 1 ? 's' : ''}
            </Button>
          )}
          {!decided && (
            <Button
              variant="brand"
              leadingIcon={<PaperPlaneTilt />}
              disabled={ready.blocking.length > 0}
              loading={sendState.kind === 'sending'}
              onClick={doSend}
            >
              {sendState.kind === 'sending' ? 'Envoi en cours' : alreadySent ? 'Envoyer la mise à jour' : 'Envoyer au client'}
            </Button>
          )}
        </div>
      </header>

      <div className="mx-2 mb-2 flex min-h-0 flex-1 overflow-hidden rounded-xl bg-background text-foreground print:m-0 print:overflow-visible">
        {!preview && (
          <nav
            aria-label="Sections de la proposition"
            className="hidden w-64 shrink-0 flex-col justify-between gap-4 overflow-y-auto border-r border-border p-5 print:hidden lg:flex"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h2 className="text-meta-md text-muted-foreground">Sections</h2>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <IconButton label="Afficher une section masquée" size="sm" disabled={hiddenSections.length === 0}>
                      <Plus />
                    </IconButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {hiddenSections.map((s) => (
                      <DropdownMenuItem
                        key={s.id}
                        onSelect={() => edit((d) => ({ ...d, sections: d.sections.map((x) => (x.id === s.id ? { ...x, hidden: false } : x)) }))}
                      >
                        {s.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <ul className="flex flex-col gap-0.5">
                {devis.sections.map((s) => {
                  const done =
                    s.id === 'deroule'
                      ? !!devis.shootingDate
                      : s.id === 'realisations'
                        ? !!devis.showcase?.length
                        : s.id === 'prestations'
                          ? devis.lines.length > 0
                          : s.done
                  return (
                    <li key={s.id} className={cn('group flex items-center gap-1 rounded-md pr-1', activeSection === s.id && 'bg-surface-1')}>
                      <button
                        type="button"
                        aria-current={activeSection === s.id ? 'location' : undefined}
                        onClick={() => goTo(s.id)}
                        disabled={s.hidden}
                        className={cn(
                          'focus-ring flex h-10 flex-1 items-center rounded-md px-3 text-left text-label-sm',
                          s.hidden ? 'text-ink-subtle' : 'text-foreground',
                        )}
                      >
                        {s.label}
                      </button>
                      {s.hidden || s.id === 'temoignage' ? (
                        <IconButton
                          size="sm"
                          label={s.hidden ? `Afficher la section ${s.label}` : `Masquer la section ${s.label}`}
                          onClick={() => edit((d) => ({ ...d, sections: d.sections.map((x) => (x.id === s.id ? { ...x, hidden: !x.hidden } : x)) }))}
                        >
                          {s.hidden ? <EyeSlash className="text-muted-foreground" /> : <Eye />}
                        </IconButton>
                      ) : done ? (
                        <CheckCircle className="m-2 size-4 text-success" aria-label="Complète" />
                      ) : (
                        <WarningCircle className="m-2 size-4 text-warning" aria-label="À compléter" />
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>

            <div ref={checklistRef} className="flex flex-col gap-1 rounded-lg bg-surface-1 p-3" aria-labelledby="checklist-title">
              <div className="flex items-center justify-between px-1 pb-1">
                <h2 id="checklist-title" className="text-title-sm text-foreground">
                  Prêt à envoyer
                </h2>
                <span className="text-meta-sm text-muted-foreground">
                  {ready.done} / {ready.items.length}
                </span>
              </div>
              <ul className="flex flex-col">
                {ready.items.map((item) => (
                  <li key={item.id}>
                    {item.ok ? (
                      <p className="flex items-center gap-2 px-1 py-2 text-body-sm text-foreground">
                        <CheckCircle className="size-4 shrink-0 text-success" aria-hidden />
                        {item.label}
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fixItem(item.id)}
                        className="focus-ring flex w-full items-center gap-2 rounded-sm px-1 py-2 text-left text-body-sm text-foreground hover:underline"
                      >
                        <WarningCircle className="size-4 shrink-0 text-danger" aria-hidden />
                        {item.label}
                        <span className="sr-only">, à compléter</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        )}

        <main id="contenu" tabIndex={-1} className="min-w-0 flex-1 overflow-y-auto px-4 py-6 outline-none print:overflow-visible md:px-8">
          {sendState.kind === 'failed' && (
            <Alert
              variant="destructive"
              title="Le devis n’est pas parti"
              className="mx-auto mb-5 max-w-[620px] print:hidden"
              action={
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={copyLink}>
                    Copier le lien
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSendState({ kind: 'idle' })
                      fixItem('client')
                    }}
                  >
                    Corriger l’adresse
                  </Button>
                </div>
              }
            >
              L’adresse {sendState.email} est refusée par son serveur. Le devis reste en brouillon.
            </Alert>
          )}
          {devis.status === 'signe' && (
            <Alert variant="success" title="Devis signé" className="mx-auto mb-5 max-w-[620px] print:hidden">
              Le projet et la facture d’acompte ont été créés. Les modifications ne sont plus envoyées au client.
            </Alert>
          )}
          <DevisDocument
            ref={catalogRef}
            devis={devis}
            client={client}
            preview={preview}
            activeSection={activeSection}
            selectedLineId={selectedLineId}
            sectionRef={sectionRef}
            onSelectLine={(lid) => {
              setSelectedLineId(lid)
              setActiveSection('prestations')
              setTab('section')
            }}
            onAddLine={(item) => {
              const added = makeLine(item)
              edit((d) => ({ ...d, lines: [...d.lines, added] }))
              setSelectedLineId(added.id)
            }}
            onPickShowcase={() =>
              edit((d) => ({ ...d, showcase: SHOWCASE_PICK, sections: d.sections.map((s) => (s.id === 'realisations' ? { ...s, done: true } : s)) }))
            }
            onProposeDate={() => setDateOpen(true)}
          />
        </main>

        {!preview && (
          <aside aria-label="Réglages du devis" className="hidden w-[340px] shrink-0 overflow-y-auto border-l border-border p-5 print:hidden xl:block">
            <Inspector
              ref={emailRef}
              devis={devis}
              tab={tab}
              onTabChange={setTab}
              line={line}
              onLineChange={(patch) => edit((d) => ({ ...d, lines: d.lines.map((l) => (l.id === selectedLineId ? { ...l, ...patch } : l)) }))}
              onRemoveLine={() => {
                edit((d) => ({ ...d, lines: d.lines.filter((l) => l.id !== selectedLineId) }))
                setSelectedLineId(null)
              }}
              meetingDate={meeting?.date}
              onApplySuggestion={(s) => {
                edit((d) => ({
                  ...d,
                  lines: s.effect.type === 'add_line' ? [...d.lines, makeLine(s.effect.line)] : d.lines,
                  schedule: s.effect.type === 'schedule' ? s.effect.schedule : d.schedule,
                  suggestions: d.suggestions.filter((x) => x.id !== s.id),
                }))
                toast({ message: `Suggestion appliquée : ${s.title.toLowerCase()}`, variant: 'success' })
              }}
              onDismissSuggestion={(s) => edit((d) => ({ ...d, suggestions: d.suggestions.filter((x) => x.id !== s.id) }))}
              contact={contact}
              emailError={
                sendState.kind === 'failed' || (contact && /\.invalid$/i.test(contact.email)) ? 'Adresse refusée par le serveur du destinataire' : undefined
              }
              onContactChange={(patch) =>
                client &&
                contact &&
                actions.updateClient(client.id, (c) => ({ ...c, contacts: c.contacts.map((x) => (x.id === contact.id ? { ...x, ...patch } : x)) }))
              }
              onRemindersChange={(reminders) => edit((d) => ({ ...d, reminders }))}
              onGlobalDiscountChange={(globalDiscount) =>
                edit((d) => ({
                  ...d,
                  globalDiscount: { ...globalDiscount, value: globalDiscount.mode === 'pct' ? Math.min(100, globalDiscount.value) : globalDiscount.value },
                }))
              }
            />
          </aside>
        )}
      </div>

      <ShootingDateDialog
        open={dateOpen}
        onOpenChange={setDateOpen}
        min={today}
        onConfirm={(date) => {
          edit((d) => ({ ...d, shootingDate: date, sections: d.sections.map((s) => (s.id === 'deroule' ? { ...s, done: true } : s)) }))
          setDateOpen(false)
          goTo('deroule')
        }}
      />
    </div>
  )
}

function ShootingDateDialog({
  open,
  onOpenChange,
  min,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  min: string
  onConfirm: (date: string) => void
}) {
  const id = useId()
  const [date, setDate] = useState('')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Proposer une date de tournage"
        description="Elle apparaît dans le déroulé ; le client pourra en proposer une autre."
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button variant="brand" disabled={!date} onClick={() => onConfirm(date)}>
              Proposer cette date
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={id}>Date du tournage</Label>
          <Input id={id} type="date" min={min} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
