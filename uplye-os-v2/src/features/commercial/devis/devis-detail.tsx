import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowSquareOut, DotsThree, Eye, NotePencil, PaperPlaneTilt, Sparkle, X } from '@phosphor-icons/react'
import {
  Button,
  Dialog,
  DialogContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  Textarea,
  useToast,
} from '@/components/ui'
import { formatEur } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useClientsById, useCommercial } from '../store'
import { devisAmount, formatShortDate, isOpen, probabilityOf, formatPercent } from '../lib'
import { StatusBadge } from '../components/status-badge'
import { ActivityIcon } from '../components/activity-icon'
import type { Devis } from '../types'
import type { useDevisOutcome } from './use-devis-outcome'

// Figma : panneau de détail de la liste des devis (27:3, colonne de droite).
export function DevisDetail({
  devis,
  outcome,
  onClose,
  className,
}: {
  devis: Devis
  outcome: ReturnType<typeof useDevisOutcome>
  onClose?: () => void
  className?: string
}) {
  const navigate = useNavigate()
  const toast = useToast()
  const { actions } = useCommercial()
  const client = useClientsById().get(devis.clientId)
  const [draftIndex, setDraftIndex] = useState(0)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [message, setMessage] = useState('')
  const amount = devisAmount(devis)
  const draft = devis.assistantDrafts[draftIndex % Math.max(1, devis.assistantDrafts.length)]
  const editorPath = `/devis/${devis.id}/editeur`
  const decided = devis.status === 'signe' || devis.status === 'refuse' || devis.status === 'archive'

  const sendReminder = (text?: string) => {
    actions.logDevis(devis.id, {
      kind: 'mail',
      title: 'Relance envoyée',
      detail: text ? 'Message de l’assistant relu' : 'Relance standard',
      when: 'à l’instant',
    })
    actions.updateDevis(devis.id, (d) => ({ ...d, nextAction: 'Attendre la réponse', snoozed: true }))
    toast({ message: `Relance envoyée à ${client?.contactName ?? client?.name}`, variant: 'success' })
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex flex-col gap-4 border-b border-border p-6">
        <div className="flex items-center gap-1">
          <p className="flex-1 text-body-sm text-muted-foreground">{devis.number || 'Prospect à chiffrer'}</p>
          <IconButton label="Ouvrir dans l’éditeur" size="sm" onClick={() => navigate(editorPath)}>
            <ArrowSquareOut />
          </IconButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton label="Plus d’actions" size="sm">
                <DotsThree />
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={decided} onSelect={() => outcome.requestSign(devis)}>
                Marquer signé…
              </DropdownMenuItem>
              <DropdownMenuItem disabled={decided} onSelect={() => outcome.requestRefuse(devis)}>
                Marquer refusé…
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={devis.status === 'archive'} destructive onSelect={() => outcome.archive(devis)}>
                Archiver
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {onClose && (
            <IconButton label="Fermer le détail" size="sm" onClick={onClose}>
              <X />
            </IconButton>
          )}
        </div>
        <h2 className="text-h3 text-foreground">{client?.name}</h2>
        <div className="flex flex-wrap items-center gap-2 text-body-sm text-foreground">
          <StatusBadge status={devis.status} />
          {devis.views > 0 && isOpen(devis.status) && (
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-4 text-danger" aria-hidden />
              {devis.views} vue{devis.views > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {isOpen(devis.status) ? (
            <Button variant="brand" leadingIcon={<PaperPlaneTilt />} onClick={() => sendReminder()}>
              Relancer
            </Button>
          ) : (
            <Button variant="brand" leadingIcon={<NotePencil />} onClick={() => navigate(editorPath)} className="col-span-2">
              {devis.status === 'a_chiffrer' || devis.status === 'brouillon' ? 'Chiffrer dans l’éditeur' : 'Ouvrir l’éditeur'}
            </Button>
          )}
          {isOpen(devis.status) && (
            <Button variant="outline" leadingIcon={<NotePencil />} onClick={() => navigate(editorPath)}>
              Ouvrir l’éditeur
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 p-6">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
          <div>
            <dt className="text-meta-md text-muted-foreground">Montant HT</dt>
            <dd className="mt-1 text-title-md text-foreground">{amount === null ? 'Sur devis' : formatEur(amount)}</dd>
          </div>
          <div>
            <dt className="text-meta-md text-muted-foreground">Probabilité</dt>
            <dd className="mt-1 text-title-md text-foreground">{formatPercent(probabilityOf(devis.status))}</dd>
          </div>
          <div>
            <dt className="text-meta-md text-muted-foreground">{devis.signedAt ? 'Signé' : 'Envoyé'}</dt>
            <dd className="mt-1 text-title-md text-foreground">
              {devis.signedAt ? formatShortDate(devis.signedAt) : devis.sentAt ? formatShortDate(devis.sentAt) : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-meta-md text-muted-foreground">Expire</dt>
            <dd className="mt-1 text-title-md text-foreground">{devis.expiresAt && !decided ? formatShortDate(devis.expiresAt) : '—'}</dd>
          </div>
        </dl>

        {draft && isOpen(devis.status) && (
          <section className="flex flex-col gap-3 rounded-lg bg-surface-1 p-4" aria-labelledby={`draft-${devis.id}`}>
            <h3 id={`draft-${devis.id}`} className="flex items-center gap-2 text-title-sm text-foreground">
              <Sparkle className="size-4" aria-hidden />
              Brouillon de l’assistant
            </h3>
            <p className="text-body-sm text-foreground" aria-live="polite">
              {draft}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setMessage(draft.replace(/^« | »$/g, ''))
                  setReviewOpen(true)
                }}
              >
                Relire et envoyer
              </Button>
              {devis.assistantDrafts.length > 1 && (
                <Button size="sm" variant="ghost" onClick={() => setDraftIndex((i) => i + 1)}>
                  Autre ton
                </Button>
              )}
            </div>
          </section>
        )}

        {devis.loss && (
          <section className="flex flex-col gap-1 rounded-lg bg-surface-1 p-4">
            <h3 className="text-title-sm text-foreground">Motif du refus : {devis.loss.reason}</h3>
            <p className="text-body-sm text-muted-foreground">
              {[devis.loss.competitor, devis.loss.price, ...devis.loss.changers].filter(Boolean).join(', ') || 'Pas de détail renseigné'}
            </p>
          </section>
        )}
        {devis.win && devis.win.reasons.length > 0 && (
          <section className="flex flex-col gap-1 rounded-lg bg-surface-1 p-4">
            <h3 className="text-title-sm text-foreground">Pourquoi c’est signé</h3>
            <p className="text-body-sm text-muted-foreground">{devis.win.reasons.join(', ')}</p>
            {devis.win.quote && <p className="text-body-sm text-foreground">{devis.win.quote}</p>}
          </section>
        )}

        <section className="flex flex-col gap-3" aria-labelledby={`activity-${devis.id}`}>
          <h3 id={`activity-${devis.id}`} className="text-meta-md text-muted-foreground">
            Activité
          </h3>
          <ol className="flex flex-col gap-4">
            {devis.activity.map((a) => (
              <li key={a.id} className="flex gap-3">
                <ActivityIcon kind={a.kind} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="text-title-sm text-foreground">{a.title}</p>
                  <p className="text-body-sm text-muted-foreground">{a.detail}</p>
                </div>
                <span className="shrink-0 text-body-xs text-muted-foreground">{a.when}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent
          title="Relire la relance"
          description={`À ${client?.contactName ?? client?.name}, par email`}
          footer={
            <>
              <Button variant="ghost" onClick={() => setReviewOpen(false)}>
                Annuler
              </Button>
              <Button
                variant="brand"
                leadingIcon={<PaperPlaneTilt />}
                disabled={!message.trim()}
                onClick={() => {
                  sendReminder(message)
                  setReviewOpen(false)
                }}
              >
                Envoyer
              </Button>
            </>
          }
        >
          <Textarea aria-label="Message de relance" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
