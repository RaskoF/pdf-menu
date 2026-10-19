import { cn } from './utils'
import { formatEur, pluralize } from './format'

describe('cn', () => {
  it('garde un style de texte Figma à côté d’une couleur', () => {
    expect(cn('text-h1', 'text-foreground')).toBe('text-h1 text-foreground')
  })
  it('la dernière taille gagne', () => {
    expect(cn('text-body-md', 'text-label-sm')).toBe('text-label-sm')
  })
})

describe('format', () => {
  it('formate les euros à la française', () => {
    expect(formatEur(1860)).toBe('1\u00a0860\u00a0€')
  })
  it('accorde au pluriel', () => {
    expect(pluralize(1, 'chose')).toBe('1 chose')
    expect(pluralize(7, 'chose')).toBe('7 choses')
  })
})
