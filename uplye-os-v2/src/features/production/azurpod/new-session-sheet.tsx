import { useEffect, useId, useMemo, useState } from 'react'
import { CalendarCheck } from '@phosphor-icons/react'
import {
  Button,
  ChoiceGroup,
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
import { addDays, formatDayLong, toIso, weekdayLabel } from '@/lib/dates'
import { formatEur } from '@/lib/format'
import { useCommercial } from '@/features/commercial/store'
import { useProduction } from '../store'
import { FORMULA_RATE } from '../mock-data'
import { freeSlots, packLeft, weekDays } from '../lib'
import type { SessionFormula } from '../types'

const FORMULAS: { value: SessionFormula; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'premontage', label: 'Pré-montage' },
  { value: 'cle_en_main', label: 'Clé en main' },
  { value: 'pack', label: 'Pack' },
]
const pad = (h: number) => `${String(h).padStart(2, '0')}:00`

// Figma : « Azurpod / Nouvelle session » (135:2700)
export function NewSessionSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const toast = useToast()
  const commercial = useCommercial()
  const { data, actions, now } = useProduction()
  const confirmId = useId()
  const [clientId, setClientId] = useState('')
  const [formula, setFormula] = useState<SessionFormula>('standard')
  const [slot, setSlot] = useState<{ date: string; start: string } | null>(null)
  const [duration, setDuration] = useState('1')
  const [confirm, setConfirm] = useState(true)
  const [error, setError] = useState<string>()

  const packs = (data?.packs ?? []).filter((p) => p.unit === 'h' && packLeft(p) > 0)
  const clients = commercial.data?.clients ?? []
  const pack = packs.find((p) => p.clientId === clientId)
  const hours = Number(duration)
  const slots = useMemo(() => {
    // Cette semaine et la suivante, trois jours au plus : assez de choix sans noyer l'écran
    const today = toIso(now)
    return freeSlots(data?.sessions ?? [], [...weekDays(today), ...weekDays(addDays(today, 7))], now, hours).slice(0, 3)
  }, [data?.sessions, now, hours])
  const options = FORMULAS.filter((f) => f.value !== 'pack' || pack)

  useEffect(() => {
    if (!open) return
    const first = packs[0]
    setClientId(first?.clientId ?? '')
    setFormula(first ? 'pack' : 'standard')
    setDuration('1')
    setSlot(null)
    setError(undefined)
    // Réinitialise à chaque ouverture
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (formula === 'pack' && !pack) setFormula('standard')
  }, [formula, pack])

  const tooLong = formula === 'pack' && pack && hours > packLeft(pack)
  const book = () => {
    if (!clientId) return setError('Choisissez le client.')
    if (!slot) return setError('Choisissez un créneau.')
    if (tooLong) return setError(`Il ne reste que ${packLeft(pack!)} h sur le pack.`)
    const client = clients.find((c) => c.id === clientId)
    const end = pad(Number(slot.start.slice(0, 2)) + hours)
    actions.createSession({ id: `s-${Date.now()}`, clientId, label: client?.name ?? 'Session', date: slot.date, start: slot.start, end, formula })
    if (formula === 'pack' && pack)
      actions.updatePack(pack.id, (p) => ({ ...p, used: p.used + hours, next: `Prochaine séance ${formatDayLong(slot.date).toLowerCase()}` }))
    toast({
      message: `Session réservée ${formatDayLong(slot.date).toLowerCase()} à ${slot.start}${confirm ? ', confirmation envoyée' : ''}`,
      variant: 'success',
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title="Nouvelle session"
        description="Le client reçoit la confirmation et le lien de paiement."
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button variant="brand" leadingIcon={<CalendarCheck />} onClick={book}>
              Réserver
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-1.5">
          <Label>Client</Label>
          <Select
            value={clientId}
            onValueChange={(v) => {
              setClientId(v)
              setError(undefined)
            }}
          >
            <SelectTrigger aria-label="Client">
              <SelectValue placeholder="Choisir un client" />
            </SelectTrigger>
            <SelectContent>
              {packs.map((p) => (
                <SelectItem key={p.id} value={p.clientId}>
                  {p.label} ({p.used} h utilisée{p.used > 1 ? 's' : ''})
                </SelectItem>
              ))}
              {clients
                .filter((c) => !packs.some((p) => p.clientId === c.id))
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-label-sm text-foreground">Formule</span>
          <ChoiceGroup appearance="segmented" label="Formule" options={options} value={formula} onValueChange={setFormula} />
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-meta-md text-muted-foreground">Créneaux libres</legend>
          {slots.length === 0 && <p className="text-body-sm text-muted-foreground">Aucun créneau de {hours} h libre sur les deux prochaines semaines.</p>}
          {slots.map((d) => (
            <div key={d.date} className="flex flex-col gap-2">
              <p className="text-title-sm text-foreground">
                {weekdayLabel(d.date)}. {Number(d.date.slice(8))} {formatDayLong(d.date).split(' ').pop()}
              </p>
              <ChoiceGroup
                label={`Créneaux du ${formatDayLong(d.date)}`}
                options={d.slots}
                value={slot?.date === d.date ? slot.start : undefined}
                onValueChange={(start) => {
                  setSlot({ date: d.date, start })
                  setError(undefined)
                }}
              />
            </div>
          ))}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Durée</Label>
            <Select
              value={duration}
              onValueChange={(v) => {
                setDuration(v)
                setSlot(null)
              }}
            >
              <SelectTrigger aria-label="Durée">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['1', '2', '3', '4'].map((h) => (
                  <SelectItem key={h} value={h}>
                    {h} h
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-label-sm text-foreground">Prix</span>
            <p className="flex h-control-md items-center rounded-md border border-input bg-muted px-3 text-body-md text-foreground" aria-live="polite">
              {formula === 'pack' ? 'Inclus au pack' : `${formatEur(FORMULA_RATE[formula as Exclude<SessionFormula, 'pack'>] * hours)} HT`}
            </p>
            {formula === 'pack' && pack && (
              <p className={tooLong ? 'text-body-xs text-danger' : 'text-body-xs text-muted-foreground'}>
                {tooLong ? `Il ne reste que ${packLeft(pack)} h sur le pack` : `Reste ${packLeft(pack) - hours} h après cette séance`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-1">
            <label htmlFor={confirmId} className="text-title-sm text-foreground">
              Envoyer la confirmation
            </label>
            <p className="text-body-xs text-muted-foreground">Email et WhatsApp, avec l’adresse du studio</p>
          </div>
          <Switch id={confirmId} checked={confirm} onCheckedChange={setConfirm} />
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
