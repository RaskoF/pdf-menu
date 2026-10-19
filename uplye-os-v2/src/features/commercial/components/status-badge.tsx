import { Badge } from '@/components/ui'
import { STATUS_BADGE, STATUS_LABEL } from '../lib'
import type { DevisStatus } from '../types'

export function StatusBadge({ status, className }: { status: DevisStatus; className?: string }) {
  return (
    <Badge variant={STATUS_BADGE[status]} className={className}>
      {STATUS_LABEL[status]}
    </Badge>
  )
}
