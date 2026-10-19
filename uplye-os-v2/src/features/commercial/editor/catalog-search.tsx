import { forwardRef, useId, useMemo, useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import { Kbd } from '@/components/ui'
import { formatEur } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CATALOG } from '../mock-data'
import type { DevisLine } from '../types'

// Figma : ligne « Ajouter depuis le catalogue, ou tapez / pour chercher » (33:780).
// Combobox ARIA : flèches pour parcourir, Entrée pour ajouter, Échap pour fermer.
export const CatalogSearch = forwardRef<HTMLInputElement, { onAdd: (line: Omit<DevisLine, 'id'>) => void }>(({ onAdd }, ref) => {
  const listId = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CATALOG.filter((c) => !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
  }, [query])

  const add = (index: number) => {
    const item = results[index]
    if (!item) return
    onAdd(item)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="relative">
      <div className="flex h-11 items-center gap-2 rounded-md border border-dashed border-line-strong px-3 focus-within:border-foreground">
        <Plus className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          ref={ref}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
          aria-label="Ajouter une prestation du catalogue"
          value={query}
          placeholder="Ajouter depuis le catalogue, ou tapez / pour chercher"
          className="h-full min-w-0 flex-1 bg-transparent text-body-sm text-foreground outline-none placeholder:text-muted-foreground"
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
            setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setOpen(true)
              setActive((i) => Math.min(results.length - 1, i + 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((i) => Math.max(0, i - 1))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              add(active)
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
        />
        <Kbd keys="/" />
      </div>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Prestations du catalogue"
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg bg-popover p-1 shadow-md"
        >
          {results.length === 0 && <li className="px-3 py-2 text-body-sm text-muted-foreground">Aucune prestation ne correspond</li>}
          {results.map((item, i) => (
            <li
              key={item.title}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => add(i)}
              className={cn('flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2', i === active && 'bg-accent')}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-title-sm text-foreground">{item.title}</span>
                <span className="truncate text-body-xs text-muted-foreground">{item.description}</span>
              </span>
              <span className="text-label-sm tabular-nums text-foreground">{formatEur(item.unitPrice)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
})
CatalogSearch.displayName = 'CatalogSearch'
