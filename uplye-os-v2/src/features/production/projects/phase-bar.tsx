import { cn } from '@/lib/utils'
import type { Project } from '../types'

// Figma : « Phase Bar » (62:399). Un segment par phase ; la phase en cours ressort, en rouge si le projet est à surveiller.
export function PhaseBar({ project, alert = false, className }: { project: Pick<Project, 'phases' | 'currentPhase'>; alert?: boolean; className?: string }) {
  const { phases, currentPhase } = project
  const delivered = currentPhase >= phases.length
  const label = delivered ? 'Livré' : `Phase ${currentPhase + 1} sur ${phases.length} : ${phases[currentPhase]?.label}`
  return (
    <span role="img" aria-label={label} className={cn('flex gap-1', className)}>
      {phases.map((p, i) => (
        <span
          key={p.id}
          className={cn(
            'h-[3px] flex-1 rounded-full',
            delivered && i === phases.length - 1
              ? 'bg-foreground'
              : i < currentPhase || delivered
                ? 'bg-surface-3'
                : i === currentPhase
                  ? alert
                    ? 'bg-danger'
                    : 'bg-foreground'
                  : 'bg-surface-1',
          )}
        />
      ))}
    </span>
  )
}
