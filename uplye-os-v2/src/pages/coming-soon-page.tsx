import { Link, useLocation } from 'react-router-dom'
import { Hourglass } from '@phosphor-icons/react'
import { Button } from '@/components/ui'
import { EmptyState } from '@/components/app/empty-state'
import { PageHeader } from '@/components/app/page-header'
import { ALL_NAV_ITEMS } from '@/config/navigation'

const EXTRA_TITLES: Record<string, string> = {
  '/recherche': 'Recherche', '/assistant': 'Assistant IA', '/notifications': 'Notifications', '/compte': 'Mon compte',
}

/** Écran d'attente pour les modules de la refonte pas encore développés. */
export function ComingSoonPage() {
  const { pathname } = useLocation()
  const title = ALL_NAV_ITEMS.find((i) => i.to === pathname)?.label ?? EXTRA_TITLES[pathname] ?? 'Bientôt'
  return (
    <div className="flex flex-col gap-5 p-layout-margin">
      <PageHeader title={title} />
      <EmptyState
        icon={<Hourglass />}
        title="En cours de refonte"
        action={
          <Button asChild variant="outline">
            <Link to="/">Retour à Aujourd’hui</Link>
          </Button>
        }
      >
        Cet écran existe déjà dans les maquettes Figma et arrive dans une prochaine version de la v2.
      </EmptyState>
    </div>
  )
}
