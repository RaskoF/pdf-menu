import { useRef, useState } from 'react'
import { useToast } from '@/components/ui'
import { formatEur } from '@/lib/format'
import { useClientsById, useCommercial } from '../store'
import { devisAmount } from '../lib'
import { ConfettiBurst } from '../components/confetti'
import { LossDialog, WinDialog, type OutcomeTarget } from './outcome-dialogs'
import type { Devis, LossDetails } from '../types'

/**
 * Issue d'un devis (signé, refusé, archivé) depuis n'importe quel écran : ouvre les motifs,
 * met à jour le store, lance les confettis et propose « Annuler » dans le toast.
 * `onSettled` permet de fermer un panneau modal pour que le toast reste cliquable.
 */
export function useDevisOutcome(onSettled?: () => void) {
  const settled = useRef(onSettled)
  settled.current = onSettled
  const { actions } = useCommercial()
  const clients = useClientsById()
  const toast = useToast()
  const [winFor, setWinFor] = useState<Devis | null>(null)
  const [lossFor, setLossFor] = useState<{ devis: Devis; reason?: string } | null>(null)
  const [burst, setBurst] = useState(0)

  const target = (d: Devis | undefined): OutcomeTarget | null =>
    d ? { number: d.number, client: clients.get(d.clientId)?.name ?? '', amount: devisAmount(d), source: d.source } : null

  const undoable = (snapshot: Devis, message: string) => {
    settled.current?.()
    toast({ message, variant: 'success', action: { label: 'Annuler', onClick: () => actions.restoreDevis(snapshot) } })
  }

  const refuse = (devis: Devis, loss: LossDetails) => {
    actions.refuseDevis(devis.id, loss)
    undoable(devis, `${devis.number || clients.get(devis.clientId)?.name} classé en perdu : ${loss.reason.toLowerCase()}`)
  }

  const dialogs = (
    <>
      <WinDialog
        target={target(winFor ?? undefined)}
        open={!!winFor}
        onOpenChange={(open) => !open && setWinFor(null)}
        onConfirm={(win) => {
          if (!winFor) return
          actions.signDevis(winFor.id, win)
          setBurst((b) => b + 1)
          const amount = devisAmount(winFor)
          undoable(winFor, `${clients.get(winFor.clientId)?.name} signé${amount ? `, ${formatEur(amount)}` : ''}. Projet et acompte créés.`)
          setWinFor(null)
        }}
      />
      <LossDialog
        target={target(lossFor?.devis)}
        open={!!lossFor}
        initialReason={lossFor?.reason}
        onOpenChange={(open) => !open && setLossFor(null)}
        onConfirm={(loss) => {
          if (lossFor) refuse(lossFor.devis, loss)
          setLossFor(null)
        }}
      />
      <ConfettiBurst burstKey={burst} />
    </>
  )

  return {
    dialogs,
    requestSign: (devis: Devis) => setWinFor(devis),
    requestRefuse: (devis: Devis, reason?: string) => setLossFor({ devis, reason }),
    quickRefuse: (devis: Devis, reason: string) => refuse(devis, { reason, changers: [], remindIn3Months: false }),
    archive: (devis: Devis) => {
      actions.archiveDevis(devis.id)
      undoable(devis, `${clients.get(devis.clientId)?.name} archivé, sans suite`)
    },
  }
}
