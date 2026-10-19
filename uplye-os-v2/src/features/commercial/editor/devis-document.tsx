import { forwardRef } from 'react'
import { Badge, Button } from '@/components/ui'
import { formatEur } from '@/lib/format'
import { cn } from '@/lib/utils'
import { WarningCircle } from '@phosphor-icons/react'
import { DISCOUNT_ALERT, devisTotals, formatPercent, formatShortDate, lineMargin, lineNet } from '../lib'
import { SHOWCASE } from '../mock-data'
import { CatalogSearch } from './catalog-search'
import type { Client, Devis, DevisLine, SectionId } from '../types'

const BRAND_NAME = { studio: 'Uplye Studio', azurpod: 'Azurpod', academy: 'Uplye Academy' } as const

const longDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

interface DocumentProps {
  devis: Devis
  client: Client | undefined
  preview: boolean
  activeSection: SectionId
  selectedLineId: string | null
  onSelectLine: (id: string) => void
  onAddLine: (line: Omit<DevisLine, 'id'>) => void
  onPickShowcase: () => void
  onProposeDate: () => void
  sectionRef: (id: SectionId) => (el: HTMLElement | null) => void
}

// Figma : proposition au centre de l'éditeur (33:780). En aperçu client, marges et sections masquées disparaissent.
export const DevisDocument = forwardRef<HTMLInputElement, DocumentProps>(
  ({ devis, client, preview, activeSection, selectedLineId, onSelectLine, onAddLine, onPickShowcase, onProposeDate, sectionRef }, catalogRef) => {
    const totals = devisTotals(devis)
    const visible = (id: SectionId) => {
      const s = devis.sections.find((x) => x.id === id)
      return !!s && !(s.hidden && preview)
    }
    const sectionClass = (id: SectionId) =>
      cn(
        'scroll-mt-6 border-x border-transparent px-6 py-6 sm:px-8',
        !preview && activeSection === id && 'border-y border-line-strong border-x-line-strong bg-card',
      )
    const discountedLines = devis.lines.filter((l) => l.discount > 0 && l.showDiscount && !l.offered)
    const amountAt = (pct: number) => formatEur(Math.round((totals.ttc * pct) / 100))

    return (
      <article
        className="mx-auto w-full max-w-[620px] overflow-hidden rounded-xl border border-border bg-background shadow-sm print:border-0 print:shadow-none"
        aria-label="Proposition commerciale"
      >
        <header
          ref={sectionRef('couverture')}
          className="flex flex-col gap-3 bg-sidebar px-6 pb-7 pt-9 text-sidebar-foreground sm:px-8 print:bg-background print:text-foreground"
        >
          <p className="text-meta-md opacity-70">
            Proposition pour {client?.name}, {longDate.format(new Date(`${devis.createdAt}T12:00:00`))}
          </p>
          <h1 className="text-h1 uppercase">
            {client?.name} x {BRAND_NAME[devis.brand]}
          </h1>
        </header>

        {visible('projet') && (
          <section ref={sectionRef('projet')} className={sectionClass('projet')} aria-labelledby="doc-projet">
            <h2 id="doc-projet" className="text-h3 text-foreground">
              Le projet
            </h2>
            <p className="mt-2 text-body-md text-muted-foreground">
              {devis.title}. Une proposition pensée pour {client?.name}, à ajuster ensemble avant le lancement.
            </p>
          </section>
        )}

        <section ref={sectionRef('prestations')} className={sectionClass('prestations')} aria-labelledby="doc-prestations">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="doc-prestations" className="flex-1 text-h3 text-foreground">
              Prestations
            </h2>
            {!preview && totals.margin !== null && <Badge variant="secondary">Marge {formatPercent(totals.margin)}, visible par vous</Badge>}
          </div>
          <ul className="mt-4 flex flex-col gap-1">
            {devis.lines.length === 0 && (
              <li className="rounded-md bg-surface-1 px-4 py-3 text-body-sm text-muted-foreground">Aucune prestation pour l’instant.</li>
            )}
            {devis.lines.map((line) => {
              const margin = lineMargin(line)
              const selected = !preview && line.id === selectedLineId
              const content = (
                <>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-title-sm text-foreground">
                      {line.title}
                      {line.optional && <span className="ml-2 text-body-xs text-muted-foreground">(optionnelle)</span>}
                    </span>
                    <span className="truncate text-body-sm text-muted-foreground">{line.description}</span>
                  </span>
                  <span className="w-6 text-right text-body-sm tabular-nums text-foreground">{line.qty}</span>
                  <span
                    className={cn(
                      'hidden w-16 text-right text-body-sm tabular-nums sm:block',
                      line.discount > 0 || line.offered ? 'text-muted-foreground' : 'text-foreground',
                    )}
                  >
                    {formatEur(line.unitPrice)}
                  </span>
                  {!preview && (
                    <span className="hidden w-24 justify-end sm:flex">
                      {line.offered ? (
                        <Badge variant="red">Offert</Badge>
                      ) : margin !== null ? (
                        <Badge variant={margin >= 0.4 ? 'green' : 'orange'}>Marge {formatPercent(margin)}</Badge>
                      ) : null}
                    </span>
                  )}
                  {preview && line.offered && <Badge variant="green">Offert</Badge>}
                  <span className="w-16 text-right text-title-sm tabular-nums text-foreground">{formatEur(lineNet(line))}</span>
                </>
              )
              return (
                <li key={line.id}>
                  {preview ? (
                    <div className="flex items-center gap-3 px-3 py-3">{content}</div>
                  ) : (
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onSelectLine(line.id)}
                      className={cn(
                        'focus-ring flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition-colors hover:bg-surface-hover',
                        selected && 'bg-surface-1',
                      )}
                    >
                      {content}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
          {!preview && (
            <div className="mt-3">
              <CatalogSearch ref={catalogRef} onAdd={onAddLine} />
            </div>
          )}
          <dl className="mt-3 flex flex-col gap-1.5 rounded-md bg-surface-1 px-4 py-3 text-body-sm">
            <div className="flex justify-between text-muted-foreground">
              <dt>Total HT</dt>
              <dd className="tabular-nums">{formatEur(totals.ht)}</dd>
            </div>
            {discountedLines.map((l) => (
              <div key={l.id} className="flex justify-between text-muted-foreground">
                <dt>dont remise {l.title.toLowerCase().split(' ')[0]}</dt>
                <dd className="tabular-nums">-{formatEur(l.discount)}</dd>
              </div>
            ))}
            {totals.globalAmount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <dt>dont remise commerciale{devis.globalDiscount?.mode === 'pct' ? ` (${devis.globalDiscount.value}\u00a0%)` : ''}</dt>
                <dd className="tabular-nums">-{formatEur(totals.globalAmount)}</dd>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <dt>TVA 20 %</dt>
              <dd className="tabular-nums">{formatEur(totals.tva)}</dd>
            </div>
            <div className="flex items-baseline justify-between text-foreground">
              <dt className="text-title-sm">Total TTC</dt>
              <dd className="text-title-md tabular-nums">{formatEur(totals.ttc)}</dd>
            </div>
          </dl>
          {!preview && totals.discountRate > DISCOUNT_ALERT && (
            <p role="status" className="mt-2 flex items-center gap-2 text-body-sm text-warning">
              <WarningCircle className="size-4 shrink-0" aria-hidden />
              Remise totale de {formatPercent(totals.discountRate)} : au-delà de 20 %, à valider avant l’envoi.
            </p>
          )}
        </section>

        {visible('realisations') && (
          <section ref={sectionRef('realisations')} className={sectionClass('realisations')} aria-labelledby="doc-realisations">
            <h2 id="doc-realisations" className="text-h3 text-foreground">
              Nos réalisations
            </h2>
            {devis.showcase?.length ? (
              <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                {devis.showcase.map((s) => (
                  <li key={s} className="flex aspect-[4/3] items-end rounded-md bg-surface-2 p-3 text-body-xs text-foreground">
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <p className="mt-2 text-body-sm text-muted-foreground">
                  L’assistant propose les 3 projets les plus proches : même secteur, format, budget similaire.
                </p>
                {!preview && (
                  <Button size="sm" variant="outline" className="mt-3" onClick={onPickShowcase}>
                    Choisir les 3 réalisations proposées
                  </Button>
                )}
              </>
            )}
          </section>
        )}

        {visible('echeancier') && (
          <section ref={sectionRef('echeancier')} className={sectionClass('echeancier')} aria-labelledby="doc-echeancier">
            <h2 id="doc-echeancier" className="text-h3 text-foreground">
              Échéancier
            </h2>
            <ol className="mt-3 flex flex-col gap-1 text-body-sm">
              {devis.schedule.map((pct, i) => (
                <li key={i} className="flex justify-between rounded-md bg-surface-1 px-4 py-2 text-foreground">
                  <span>
                    {i === 0 ? 'Acompte à la signature' : i === devis.schedule.length - 1 ? 'Solde à la livraison' : 'Au tournage'}, {pct}&nbsp;%
                  </span>
                  <span className="tabular-nums">{amountAt(pct)}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {visible('deroule') && (
          <section ref={sectionRef('deroule')} className={sectionClass('deroule')} aria-labelledby="doc-deroule">
            <h2 id="doc-deroule" className="text-h3 text-foreground">
              Déroulé
            </h2>
            <p className="mt-2 text-body-sm text-muted-foreground">
              Préparation, tournage{devis.shootingDate ? ` le ${formatShortDate(devis.shootingDate)}` : ''}, montage puis deux allers-retours de révision.
            </p>
            {!devis.shootingDate && !preview && (
              <Button size="sm" variant="outline" className="mt-3" onClick={onProposeDate}>
                Proposer une date de tournage
              </Button>
            )}
          </section>
        )}

        {visible('conditions') && (
          <section ref={sectionRef('conditions')} className={sectionClass('conditions')} aria-labelledby="doc-conditions">
            <h2 id="doc-conditions" className="text-h3 text-foreground">
              Conditions
            </h2>
            <p className="mt-2 text-body-sm text-muted-foreground">
              Proposition valable 30 jours{devis.expiresAt ? `, jusqu’au ${formatShortDate(devis.expiresAt)}` : ''}. Droits de diffusion inclus sur les réseaux
              sociaux et le site du client.
            </p>
          </section>
        )}

        {visible('temoignage') && (
          <section ref={sectionRef('temoignage')} className={sectionClass('temoignage')} aria-labelledby="doc-temoignage">
            <h2 id="doc-temoignage" className="text-h3 text-foreground">
              Témoignage
            </h2>
            <blockquote className="mt-2 text-body-md text-foreground">
              « Validées au premier aller-retour, et l’agenda des soins visage s’est rempli. » Coralie, Institut Lumière du Sud
            </blockquote>
          </section>
        )}
      </article>
    )
  },
)
DevisDocument.displayName = 'DevisDocument'

export const SHOWCASE_PICK = SHOWCASE.slice(0, 3)
