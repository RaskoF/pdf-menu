import { cn } from '@/lib/utils'
import mark from '@/assets/logo-mark.svg'

// Figma : « Logo » (14:124). Ton sombre dans la barre latérale, clair sur fond carte.
export function Logo({ tone = 'dark', showWordmark = true, className }: { tone?: 'dark' | 'light'; showWordmark?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', tone === 'light' && 'rounded-lg bg-card p-2', className)}>
      <img src={mark} alt="" width={20} height={20} className="size-5" />
      {showWordmark && <span className={cn('text-wordmark', tone === 'dark' ? 'text-sidebar-foreground' : 'text-foreground')}>Uplye OS</span>}
      {!showWordmark && <span className="sr-only">Uplye OS</span>}
    </span>
  )
}
