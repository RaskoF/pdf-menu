import { Link } from 'react-router-dom'
import { Avatar, Button, Card, CardHeader } from '@/components/ui'
import { LoadBar } from '@/components/app/load-bar'
import type { TeamLoad } from '../types'
import { RailSkeleton } from './cash-card'

// Figma : carte « Charge cette semaine » (rail de l'écran Aujourd'hui)
export function TeamLoadCard({ team }: { team: TeamLoad[] | null }) {
  if (!team) return <RailSkeleton title="Charge cette semaine" action="Planning" />
  return (
    <Card className="gap-3" aria-labelledby="load-title">
      <CardHeader
        title={<span id="load-title">Charge cette semaine</span>}
        action={
          <Button asChild variant="ghost" size="sm">
            <Link to="/planning">Planning</Link>
          </Button>
        }
      />
      <ul className="flex flex-col gap-3">
        {team.map((m) => (
          <li key={m.id} className="flex items-center gap-3">
            <Avatar initials={m.initials} size="sm" />
            <div className="flex w-24 flex-col gap-0.5">
              <span className="text-title-sm">{m.name}</span>
              {m.alert && <span className="text-body-xs text-danger">{m.alert}</span>}
            </div>
            <LoadBar hours={m.hours} capacity={m.capacity} className="flex-1" />
            <span className="w-16 text-right text-meta-sm text-muted-foreground">
              {m.hours} h / {m.capacity} h
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
