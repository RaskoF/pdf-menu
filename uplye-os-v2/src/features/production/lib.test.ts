import { DEMO_NOW } from '@/data/session'
import { PRODUCTION_MOCK } from './mock-data'
import { captionLimit, displayStatus, freeSlots, hoursBeforeMarginFloor, projectedMargin, promisedDate, rewrite, sessionPrice, watchReasons } from './lib'

const project = (id: string) => PRODUCTION_MOCK.projects.find((p) => p.id === id)!
const round = (x: number | null) => (x === null ? null : Math.round(x * 100))

describe('projets', () => {
  it('projette la marge sur le temps réellement passé', () => {
    expect(round(projectedMargin(project('p-mayli')))).toBe(62)
    expect(round(projectedMargin(project('p-dune')))).toBe(38)
    expect(projectedMargin(project('p-laforet'))).toBeNull()
    expect(hoursBeforeMarginFloor(project('p-mayli'))).toBe(30)
  })

  it('explique pourquoi surveiller un projet', () => {
    expect(watchReasons(project('p-dune'), DEMO_NOW)).toEqual(['Visuels client manquants depuis 2 jours', 'Budget temps dépassé de 1 h'])
    expect(watchReasons(project('p-ils'), DEMO_NOW)).toEqual(['Budget temps dépassé de 3 h', 'Révisions incluses épuisées'])
    expect(watchReasons(project('p-mayli'), DEMO_NOW)).toEqual([])
    expect(watchReasons(project('p-ils-photo'), DEMO_NOW)).toEqual([])
  })
})

describe('studio', () => {
  it('tarifie les séances et laisse les packs à 0', () => {
    expect(sessionPrice(PRODUCTION_MOCK.sessions[0]!)).toBe(135)
    expect(sessionPrice(PRODUCTION_MOCK.sessions.find((s) => s.formula === 'pack')!)).toBe(0)
  })

  it('compte les délais en jours ouvrés', () => {
    expect(promisedDate('2026-10-16', 3)).toBe('2026-10-21')
    expect(promisedDate('2026-10-09', 1)).toBe('2026-10-12')
  })

  it('propose des créneaux libres, sans chevauchement ni heure passée', () => {
    const [mon, tue, wed] = freeSlots(PRODUCTION_MOCK.sessions, ['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21'], DEMO_NOW, 1)
    expect(mon!.date).toBe('2026-10-19')
    expect(mon!.slots[0]).toBe('10:00')
    expect(tue!.slots).toHaveLength(8)
    expect(wed!.slots).not.toContain('10:00')
    expect(wed!.slots).not.toContain('11:00')
  })
})

describe('réseaux sociaux', () => {
  it('bloque un post programmé sur un compte déconnecté', () => {
    const reel = PRODUCTION_MOCK.posts.find((p) => p.title.startsWith('Extrait Skeals'))!
    expect(displayStatus(reel, PRODUCTION_MOCK.accounts)).toBe('bloque')
    const connected = PRODUCTION_MOCK.accounts.map((a) => ({ ...a, connected: true }))
    expect(displayStatus(reel, connected)).toBe('programme')
  })

  it('applique la limite de légende la plus stricte et réécrit', () => {
    expect(captionLimit(['facebook', 'linkedin'])).toBe(3000)
    expect(rewrite.shorter('Une phrase. Deux phrases.\n\nAppel ? Fin.')).toBe('Une phrase.\n\nAppel ?')
    expect(rewrite.direct('C’est vraiment très simple.')).toBe('C’est simple.')
    expect(rewrite.hashtags('Texte', 'azurpod')).toContain('#podcast')
  })
})
