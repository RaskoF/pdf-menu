import type { ReactNode } from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { cn } from '@/lib/utils'

// Choix parmi des pastilles (motifs, sources, types) ou en segments (marque).
// Choix unique : groupe radio Radix (flèches du clavier). Choix multiple : boutons à bascule (aria-pressed).

const chipItem =
  'focus-ring inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-label-sm transition-colors disabled:opacity-40'
const chipState = (active: boolean) => (active ? 'bg-surface-3 text-foreground' : 'bg-surface-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground')

export interface ChoiceOption<T extends string = string> {
  value: T
  label: ReactNode
}

interface BaseProps<T extends string> {
  options: readonly (ChoiceOption<T> | T)[]
  /** Nom du groupe lu par les lecteurs d'écran */
  label: string
  className?: string
}

const normalize = <T extends string>(o: ChoiceOption<T> | T): ChoiceOption<T> => (typeof o === 'string' ? { value: o, label: o } : o)

export function ChoiceGroup<T extends string>({
  options,
  label,
  value,
  onValueChange,
  appearance = 'chips',
  className,
}: BaseProps<T> & { value: T | undefined; onValueChange: (value: T) => void; appearance?: 'chips' | 'segmented' }) {
  const segmented = appearance === 'segmented'
  return (
    <RadioGroupPrimitive.Root
      aria-label={label}
      value={value ?? ''}
      onValueChange={(v) => onValueChange(v as T)}
      orientation="horizontal"
      className={cn(segmented ? 'inline-flex w-fit items-center gap-0.5 rounded-md bg-muted p-0.5' : 'flex flex-wrap gap-2', className)}
    >
      {options.map(normalize).map((o) => (
        <RadioGroupPrimitive.Item
          key={o.value}
          value={o.value}
          className={cn(
            segmented
              ? 'focus-ring inline-flex h-7 items-center whitespace-nowrap rounded-sm px-3 text-label-sm text-muted-foreground transition-colors hover:bg-surface-2 data-[state=checked]:bg-card data-[state=checked]:text-foreground data-[state=checked]:shadow-xs'
              : cn(chipItem, chipState(o.value === value)),
          )}
        >
          {o.label}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  )
}

export function MultiChoiceGroup<T extends string>({
  options,
  label,
  values,
  onValuesChange,
  className,
}: BaseProps<T> & { values: T[]; onValuesChange: (values: T[]) => void }) {
  return (
    <div role="group" aria-label={label} className={cn('flex flex-wrap gap-2', className)}>
      {options.map(normalize).map((o) => {
        const active = values.includes(o.value)
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onValuesChange(active ? values.filter((v) => v !== o.value) : [...values, o.value])}
            className={cn(chipItem, chipState(active))}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
