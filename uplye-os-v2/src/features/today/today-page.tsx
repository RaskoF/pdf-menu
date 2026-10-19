import { Plus, Sparkle } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { Button, useToast } from '@/components/ui'
import { PageHeader } from '@/components/app/page-header'
import { formatLongDate, pluralize } from '@/lib/format'
import { CURRENT_USER } from '@/data/session'
import { useToday } from './use-today'
import type { TodayData } from './types'
import { InboxCard } from './components/inbox-card'
import { CashCard } from './components/cash-card'
import { TeamLoadCard } from './components/team-load-card'
import { NextMeetingCard } from './components/next-meeting-card'

// Figma : page « 10 Shell & Pilotage », écrans « Aujourd’hui » (41:1086, 117:2615, 117:3007)
export function TodayPage({ loader, now = new Date() }: { loader?: () => Promise<TodayData>; now?: Date }) {
  const navigate = useNavigate()
  const toast = useToast()
  const today = useToday(loader)
  const loading = today.status === 'loading'
  const firstName = CURRENT_USER.name.split(' ')[0]

  const open = today.counts.all
  const subtitle = loading
    ? `${formatLongDate(now)}. Synchronisation en cours…`
    : open === 0
      ? `${formatLongDate(now)}. Rien d’urgent, profitez-en.`
      : `${formatLongDate(now)}. ${pluralize(open, 'chose')} à traiter${today.urgentCount ? `, dont ${pluralize(today.urgentCount, 'urgente')}` : ''}.`

  return (
    <div className="flex min-h-full flex-col gap-5 p-layout-margin lg:h-full">
      <PageHeader
        title={`Bonjour ${firstName}`}
        subtitle={subtitle}
        actions={
          <>
            <Button variant="outline" leadingIcon={<Sparkle />} onClick={() => navigate('/assistant')}>
              Demander à l’assistant
            </Button>
            <Button leadingIcon={<Plus />} onClick={() => navigate('/kanban')}>
              Créer
            </Button>
          </>
        }
      />
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <InboxCard
          loading={loading}
          filter={today.filter}
          onFilterChange={today.setFilter}
          counts={today.counts}
          groups={today.groups}
          done={today.done}
          nextDeadline={today.data?.nextDeadline}
          onDoneChange={today.setDone}
        />
        <aside className="flex flex-col gap-4" aria-label="Indicateurs du jour">
          <CashCard cash={today.data?.cash ?? null} onRemind={() => toast({ message: 'Relance préparée pour Club Royalty', variant: 'success' })} />
          <TeamLoadCard team={today.data?.team ?? null} />
          <NextMeetingCard meeting={today.data?.nextMeeting ?? null} loading={loading} />
        </aside>
      </div>
    </div>
  )
}
