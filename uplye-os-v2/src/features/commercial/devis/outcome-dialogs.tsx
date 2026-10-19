import { useEffect, useId, useState, type ReactNode } from 'react'
import { Badge, Button, ChoiceGroup, Dialog, DialogContent, Input, Label, MultiChoiceGroup, Switch, Textarea } from '@/components/ui'
import { formatEur } from '@/lib/format'
import { CLIENT_SOURCES, COMPETITION, LOSS_CHANGERS, LOSS_REASONS, WIN_REASONS } from '../reasons'
import type { LossDetails, WinDetails } from '../types'

// Motifs de signature et de refus : contenu des anciennes maquettes (2972:4593 et 2972:4734),
// remis sur le nouveau design system. Le vocabulaire fixe alimente l'onglet Analyse.

export interface OutcomeTarget {
  number: string
  client: string
  amount: number | null
  source?: string
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-2.5 text-meta-md text-muted-foreground">{title}</legend>
      {children}
    </fieldset>
  )
}

const describe = (t: OutcomeTarget) => [t.number, t.client, t.amount !== null ? `${formatEur(t.amount)} HT` : null].filter(Boolean).join(', ')

export function WinDialog({
  target,
  open,
  onOpenChange,
  onConfirm,
}: {
  target: OutcomeTarget | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Sans motif quand l'utilisateur passe l'étape */
  onConfirm: (win: WinDetails | undefined) => void
}) {
  const quoteId = useId()
  const [reasons, setReasons] = useState<string[]>([])
  const [source, setSource] = useState<string | undefined>()
  const [competitors, setCompetitors] = useState<string | undefined>()
  const [quote, setQuote] = useState('')

  useEffect(() => {
    if (!open) return
    setReasons([])
    setSource(target?.source)
    setCompetitors(undefined)
    setQuote('')
  }, [open, target?.source])

  if (!target) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[560px]"
        title={
          <span className="flex items-center gap-2.5">
            <Badge variant="green">Signé</Badge>Bravo, devis gagné
          </span>
        }
        description={`${describe(target)}. Qu’est-ce qui a fait la différence ? 20 secondes, ça nourrit l’analyse.`}
      >
        <Group title="Pourquoi le client a dit oui, plusieurs choix">
          <MultiChoiceGroup label="Pourquoi le client a dit oui" options={WIN_REASONS} values={reasons} onValuesChange={setReasons} />
        </Group>
        <Group title="D’où vient ce client">
          <ChoiceGroup label="D’où vient ce client" options={CLIENT_SOURCES} value={source} onValueChange={setSource} />
        </Group>
        <Group title="Concurrents en lice">
          <ChoiceGroup label="Concurrents en lice" options={COMPETITION} value={competitors} onValueChange={setCompetitors} />
        </Group>
        <div className="flex flex-col gap-2">
          <Label htmlFor={quoteId} className="text-meta-md text-muted-foreground">
            Le mot du client (facultatif)
          </Label>
          <Textarea
            id={quoteId}
            rows={2}
            className="min-h-16"
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="« On a vu la vidéo de la boulangerie et on voulait la même énergie. »"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="flex-1 text-body-sm text-muted-foreground">Le projet et la facture d’acompte sont créés automatiquement.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onConfirm(undefined)}>
              Passer
            </Button>
            <Button variant="brand" onClick={() => onConfirm({ reasons, source, competitors, quote: quote.trim() || undefined })}>
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function LossDialog({
  target,
  open,
  initialReason,
  onOpenChange,
  onConfirm,
}: {
  target: OutcomeTarget | null
  open: boolean
  initialReason?: string
  onOpenChange: (open: boolean) => void
  onConfirm: (loss: LossDetails) => void
}) {
  const competitorId = useId()
  const priceId = useId()
  const remindId = useId()
  const [reason, setReason] = useState<string | undefined>()
  const [competitor, setCompetitor] = useState('')
  const [price, setPrice] = useState('')
  const [changers, setChangers] = useState<string[]>([])
  const [remind, setRemind] = useState(true)
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    if (!open) return
    setReason(initialReason)
    setCompetitor('')
    setPrice('')
    setChangers([])
    setRemind(true)
    setShowError(false)
  }, [open, initialReason])

  if (!target) return null
  const submit = () => {
    if (!reason) {
      setShowError(true)
      return
    }
    onConfirm({ reason, competitor: competitor.trim() || undefined, price: price.trim() || undefined, changers, remindIn3Months: remind })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[560px]"
        title={
          <span className="flex items-center gap-2.5">
            <Badge variant="red">Refusé</Badge>Devis perdu, pourquoi ?
          </span>
        }
        description={`${describe(target)}. Un motif suffit : c’est ce qui permettra de voir où on perd.`}
      >
        <Group title="Motif principal">
          <ChoiceGroup
            label="Motif principal"
            options={LOSS_REASONS.map((r) => r.label)}
            value={reason}
            onValueChange={(v) => {
              setReason(v)
              setShowError(false)
            }}
          />
          {showError && (
            <p role="alert" className="text-body-sm text-danger">
              Choisissez un motif pour classer le devis.
            </p>
          )}
        </Group>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor={competitorId} className="text-meta-md text-muted-foreground">
              Concurrent
            </Label>
            <Input id={competitorId} value={competitor} onChange={(e) => setCompetitor(e.target.value)} placeholder="Agence locale" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={priceId} className="text-meta-md text-muted-foreground">
              Prix constaté
            </Label>
            <Input id={priceId} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="≈ 2 000 € HT" />
          </div>
        </div>
        <Group title="Qu’est-ce qui aurait pu changer la donne ?">
          <MultiChoiceGroup label="Qu’est-ce qui aurait pu changer la donne ?" options={LOSS_CHANGERS} values={changers} onValuesChange={setChangers} />
        </Group>
        <div className="flex items-center gap-3 rounded-md bg-surface-1 px-4 py-3">
          <Label htmlFor={remindId} className="flex-1 text-body-sm font-normal">
            Relancer ce client dans 3 mois (tâche ajoutée au Kanban)
          </Label>
          <Switch id={remindId} checked={remind} onCheckedChange={setRemind} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={submit}>
            Classer en perdu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
