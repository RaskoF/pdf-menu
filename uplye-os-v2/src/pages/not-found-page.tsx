import { Link } from 'react-router-dom'
import { Compass } from '@phosphor-icons/react'
import { Button } from '@/components/ui'
import { EmptyState } from '@/components/app/empty-state'

// Figma : écran « 404 » (page 16 États vides et erreurs)
export function NotFoundPage() {
  return (
    <div className="grid min-h-full place-content-center p-layout-margin">
      <EmptyState
        icon={<Compass />}
        title="Page introuvable"
        action={
          <Button asChild>
            <Link to="/">Retour à Aujourd’hui</Link>
          </Button>
        }
      >
        Le lien est peut-être ancien, ou la page a été déplacée.
      </EmptyState>
    </div>
  )
}
