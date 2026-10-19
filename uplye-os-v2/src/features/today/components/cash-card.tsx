import { CheckCircle, FileText, Receipt, WarningCircle } from '@phosphor-icons/react'
import { Card, CardHeader, Skeleton } from '@/components/ui'
import { formatEur } from '@/lib/format'
import type { CashSummary } from '../types'

// Figma : carte « Cash d’octobre » (rail de l'écran Aujourd'hui)
export function CashCard({ cash, onRemind }: { cash: CashSummary | null; onRemind?: () => void }) {
  if (!cash) return <RailSkeleton title="Cash du mois" meta="Objectif" />
  const pct = (v: number) => `${Math.min(100, (v / cash.goal) * 100)}%`
  const rate = Math.round((cash.collected / cash.goal) * 100)
  const rows = [
    { icon: CheckCircle, label: 'Encaissé', value: cash.collected, className: 'text-success' },
    { icon: Receipt, label: 'Facturé, pas encore payé', value: cash.invoicedUnpaid, className: 'text-muted-foreground' },
    { icon: FileText, label: 'Pondéré à signer', value: cash.weightedToSign, className: 'text-muted-foreground' },
  ]
  return (
    <Card className="gap-3" aria-labelledby="cash-title">
      <CardHeader title={<span id="cash-title">Cash d’{cash.month}</span>} action={<span className="text-meta-sm text-muted-foreground">Objectif {formatEur(cash.goal)}</span>} />
      <p className="flex items-baseline gap-2">
        <span className="text-stat-lg">{formatEur(cash.collected)}</span>
        <span className="text-body-sm text-muted-foreground">encaissés, {rate} %</span>
      </p>
      <div
        className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-chart-track"
        role="img"
        aria-label={`${formatEur(cash.collected)} encaissés, ${formatEur(cash.invoicedUnpaid)} facturés, ${formatEur(cash.weightedToSign)} pondérés à signer, sur un objectif de ${formatEur(cash.goal)}`}
      >
        <div className="bg-chart-highlight" style={{ width: pct(cash.collected) }} />
        <div className="bg-chart-axis" style={{ width: pct(cash.invoicedUnpaid) }} />
        <div className="bg-ink-disabled" style={{ width: pct(cash.weightedToSign) }} />
      </div>
      <dl className="flex flex-col gap-1.5">
        {rows.map(({ icon: Icon, label, value, className }) => (
          <div key={label} className="flex items-center gap-2">
            <Icon className={`size-3.5 shrink-0 ${className}`} aria-hidden />
            <dt className="flex-1 text-body-sm text-muted-foreground">{label}</dt>
            <dd className="text-title-sm">{formatEur(value)}</dd>
          </div>
        ))}
      </dl>
      {cash.late && (
        <div className="flex items-center gap-2 rounded-md bg-danger-tone px-3 py-2 text-danger">
          <WarningCircle className="size-3.5 shrink-0" aria-hidden />
          <p className="flex-1 text-body-sm">
            {formatEur(cash.late.amount)} en retard chez {cash.late.client}
          </p>
          <button type="button" onClick={onRemind} className="focus-ring rounded-sm text-label-sm hover:underline">
            Relancer
          </button>
        </div>
      )}
    </Card>
  )
}

export function RailSkeleton({ title, meta, action }: { title: string; meta?: string; action?: string }) {
  return (
    <Card className="gap-3" aria-busy>
      <CardHeader title={title} action={meta ? <span className="text-meta-sm text-muted-foreground">{meta}</span> : action && <span className="text-label-sm">{action}</span>} />
      {[0, 1].map((i) => (
        <div key={i} className="flex items-center gap-3 py-1">
          <Skeleton className="size-4 rounded-xs" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </Card>
  )
}
