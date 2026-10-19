import { VideoCamera } from '@phosphor-icons/react'
import { Button, Card, CardHeader } from '@/components/ui'
import type { NextMeeting } from '../types'
import { RailSkeleton } from './cash-card'

// Figma : carte « Prochain rendez-vous » (rail de l'écran Aujourd'hui)
export function NextMeetingCard({ meeting, loading }: { meeting: NextMeeting | null; loading: boolean }) {
  if (loading) return <RailSkeleton title="Prochain rendez-vous" />
  return (
    <Card className="gap-3" aria-labelledby="meeting-title">
      <CardHeader title={<span id="meeting-title">Prochain rendez-vous</span>} />
      {meeting ? (
        <div className="flex items-center gap-3">
          <div className="grid size-[52px] shrink-0 place-content-center rounded-md bg-surface-2 text-center">
            <span className="text-title-sm">{meeting.time}</span>
            <span className="text-meta-sm">{meeting.day}</span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-title-sm">{meeting.title}</p>
            <p className="text-body-xs text-muted-foreground">{meeting.place}</p>
          </div>
          <Button asChild variant="outline" size="sm" leadingIcon={<VideoCamera />}>
            <a href={meeting.joinUrl} target="_blank" rel="noreferrer noopener">
              Rejoindre
            </a>
          </Button>
        </div>
      ) : (
        <p className="text-body-sm text-muted-foreground">Aucun rendez-vous prévu.</p>
      )}
    </Card>
  )
}
