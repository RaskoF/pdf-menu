import { forwardRef, useId, type ReactNode } from 'react'
import { ArrowRight, Microphone, Sparkle, Trash } from '@phosphor-icons/react'
import { Button, ChoiceGroup, Input, Label, Switch, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { formatEur } from '@/lib/format'
import { DISCOUNT_ALERT, devisTotals, formatPercent, formatShortDate, HOURLY_COST, lineMargin } from '../lib'
import type { Contact, Devis, DevisLine, Suggestion } from '../types'

export type InspectorTab = 'section' | 'client' | 'relances'

function SwitchRow({ label, checked, onCheckedChange, hint }: { label: string; checked: boolean; onCheckedChange: (v: boolean) => void; hint?: string }) {
  const id = useId()
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-1 flex-col gap-0.5">
        <Label htmlFor={id} className="font-normal">
          {label}
        </Label>
        {hint && <p className="text-body-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  min = 0,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  suffix?: ReactNode
  min?: number
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
        trailingIcon={suffix}
      />
    </div>
  )
}

interface InspectorProps {
  devis: Devis
  tab: InspectorTab
  onTabChange: (t: InspectorTab) => void
  line: DevisLine | null
  onLineChange: (patch: Partial<DevisLine>) => void
  onRemoveLine: () => void
  meetingDate?: string
  onApplySuggestion: (s: Suggestion) => void
  onDismissSuggestion: (s: Suggestion) => void
  contact: Contact | undefined
  emailError?: string
  onContactChange: (patch: Partial<Contact>) => void
  onRemindersChange: (r: NonNullable<Devis['reminders']>) => void
  onGlobalDiscountChange: (d: NonNullable<Devis['globalDiscount']>) => void
}

// Figma : panneau droit de l'éditeur (33:780) : onglets Section, Client, Relances.
export const Inspector = forwardRef<HTMLInputElement, InspectorProps>(
  (
    {
      devis,
      tab,
      onTabChange,
      line,
      onLineChange,
      onRemoveLine,
      meetingDate,
      onApplySuggestion,
      onDismissSuggestion,
      contact,
      emailError,
      onContactChange,
      onRemindersChange,
      onGlobalDiscountChange,
    },
    emailRef,
  ) => {
    const emailId = useId()
    const nameId = useId()
    const phoneId = useId()
    const margin = line ? lineMargin(line) : null
    const totals = devisTotals(devis)
    const reminders = devis.reminders ?? { afterDays3: true, afterDays7: true, beforeExpiry: false }

    return (
      <Tabs value={tab} onValueChange={(v) => onTabChange(v as InspectorTab)} className="flex flex-col gap-5">
        <TabsList type="underline" aria-label="Réglages">
          <TabsTrigger value="section">Section</TabsTrigger>
          <TabsTrigger value="client">Client</TabsTrigger>
          <TabsTrigger value="relances">Relances</TabsTrigger>
        </TabsList>

        <TabsContent value="section" className="flex flex-col gap-6 outline-none">
          {line ? (
            <section className="flex flex-col gap-4" aria-labelledby="inspector-line">
              <h2 id="inspector-line" className="text-meta-md text-muted-foreground">
                Ligne sélectionnée : {line.title}
              </h2>
              <NumberField label="Prix unitaire HT" value={line.unitPrice} onChange={(unitPrice) => onLineChange({ unitPrice })} suffix="€" />
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Quantité" value={line.qty} min={1} onChange={(qty) => onLineChange({ qty })} />
                <NumberField label="Remise" value={line.discount} onChange={(discount) => onLineChange({ discount })} suffix="€" />
              </div>
              <p className="text-body-xs text-muted-foreground">
                Coût estimé {formatEur(line.cost)}
                {line.hours ? ` (${line.hours} h × ${HOURLY_COST} €)` : ''}
                {margin !== null ? `, marge ${formatPercent(margin)}` : ''}
              </p>
              <SwitchRow label="Afficher la remise au client" checked={line.showDiscount} onCheckedChange={(showDiscount) => onLineChange({ showDiscount })} />
              <SwitchRow label="Ligne optionnelle, au choix du client" checked={line.optional} onCheckedChange={(optional) => onLineChange({ optional })} />
              <SwitchRow label="Offrir cette prestation" checked={line.offered} onCheckedChange={(offered) => onLineChange({ offered })} />
              <Button variant="ghost" size="sm" leadingIcon={<Trash />} className="w-fit text-danger" onClick={onRemoveLine}>
                Retirer la ligne
              </Button>
            </section>
          ) : (
            <p className="rounded-md bg-surface-1 p-4 text-body-sm text-muted-foreground">
              Sélectionnez une prestation dans la proposition pour régler son prix, sa remise et sa marge.
            </p>
          )}

          <section className="flex flex-col gap-3" aria-labelledby="inspector-discount">
            <h2 id="inspector-discount" className="text-meta-md text-muted-foreground">
              Remise commerciale
            </h2>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <NumberField
                  label={devis.globalDiscount?.mode === 'pct' ? 'Remise sur le total (%)' : 'Remise sur le total (€)'}
                  value={devis.globalDiscount?.value ?? 0}
                  onChange={(value) => onGlobalDiscountChange({ mode: devis.globalDiscount?.mode ?? 'eur', value })}
                />
              </div>
              <ChoiceGroup
                appearance="segmented"
                label="Unité de la remise"
                className="mb-1"
                options={[
                  { value: 'eur', label: '€' },
                  { value: 'pct', label: '%' },
                ]}
                value={devis.globalDiscount?.mode ?? 'eur'}
                onValueChange={(mode) => onGlobalDiscountChange({ mode, value: devis.globalDiscount?.value ?? 0 })}
              />
            </div>
            <p className={totals.discountRate > DISCOUNT_ALERT ? 'text-body-xs text-warning' : 'text-body-xs text-muted-foreground'}>
              Remise totale {formatPercent(totals.discountRate)}
              {totals.discountRate > DISCOUNT_ALERT ? ', au-delà du seuil de 20 %' : ', seuil d’alerte à 20 %'}
            </p>
          </section>

          {devis.suggestions.length > 0 && (
            <section className="flex flex-col gap-3" aria-labelledby="inspector-suggestions">
              <div className="flex items-center gap-2">
                <Microphone className="size-4 text-foreground" aria-hidden />
                <h2 id="inspector-suggestions" className="flex-1 text-title-sm text-foreground">
                  {meetingDate ? `Depuis le RDV du ${formatShortDate(meetingDate)}` : 'Suggestions'}
                </h2>
                <span className="text-body-xs text-muted-foreground">
                  {devis.suggestions.length} suggestion{devis.suggestions.length > 1 ? 's' : ''}
                </span>
              </div>
              <ul className="flex flex-col gap-3">
                {devis.suggestions.map((s) => (
                  <li key={s.id} className="flex flex-col gap-2 rounded-lg border border-border p-4">
                    <h3 className="flex items-center gap-2 text-title-sm text-foreground">
                      <Sparkle className="size-4" aria-hidden />
                      {s.title}
                    </h3>
                    <p className="flex items-center gap-2 text-body-sm">
                      <span className="text-muted-foreground">{s.from}</span>
                      <ArrowRight className="size-3.5 text-muted-foreground" aria-label="devient" />
                      <span className="text-title-sm text-foreground">{s.to}</span>
                    </p>
                    <p className="text-body-xs text-muted-foreground">{s.quote}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => onApplySuggestion(s)}>
                        Appliquer
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onDismissSuggestion(s)}>
                        Ignorer
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </TabsContent>

        <TabsContent value="client" className="flex flex-col gap-4 outline-none">
          {contact ? (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={nameId}>Contact</Label>
                <Input id={nameId} value={contact.name} onChange={(e) => onContactChange({ name: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={emailId}>Email d’envoi</Label>
                <Input
                  ref={emailRef}
                  id={emailId}
                  type="email"
                  value={contact.email}
                  aria-invalid={emailError ? true : undefined}
                  aria-describedby={emailError ? `${emailId}-error` : undefined}
                  onChange={(e) => onContactChange({ email: e.target.value })}
                />
                {emailError && (
                  <p id={`${emailId}-error`} className="text-body-sm text-danger">
                    {emailError}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={phoneId}>Téléphone</Label>
                <Input id={phoneId} type="tel" value={contact.phone} onChange={(e) => onContactChange({ phone: e.target.value })} />
              </div>
            </>
          ) : (
            <p className="rounded-md bg-surface-1 p-4 text-body-sm text-muted-foreground">Aucun contact pour ce client. Ajoutez-en un depuis sa fiche.</p>
          )}
        </TabsContent>

        <TabsContent value="relances" className="flex flex-col gap-4 outline-none">
          <p className="text-body-sm text-muted-foreground">Envoyées par l’assistant, uniquement si le client n’a pas répondu.</p>
          <SwitchRow
            label="Relance à J+3"
            hint="Email court, ton du dernier échange"
            checked={reminders.afterDays3}
            onCheckedChange={(afterDays3) => onRemindersChange({ ...reminders, afterDays3 })}
          />
          <SwitchRow
            label="Relance à J+7"
            hint="Avec un appel proposé"
            checked={reminders.afterDays7}
            onCheckedChange={(afterDays7) => onRemindersChange({ ...reminders, afterDays7 })}
          />
          <SwitchRow
            label="Rappel avant expiration"
            hint="5 jours avant la fin de validité"
            checked={reminders.beforeExpiry}
            onCheckedChange={(beforeExpiry) => onRemindersChange({ ...reminders, beforeExpiry })}
          />
        </TabsContent>
      </Tabs>
    )
  },
)
Inspector.displayName = 'Inspector'
