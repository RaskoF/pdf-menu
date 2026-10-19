import { COMMERCIAL_MOCK, DEMO_NOW } from './mock-data'
import { devisAmount, devisTotals, isHot, isStaleDraft, needsFollowUp, readiness, weightedAmount } from './lib'
import { amountNote, devisSubtitle } from './selectors'
import { nextDevisNumber } from './devis/new-devis-sheet'
import { analyse, decidedDeals } from './devis/analysis'
import { parseClientsCsv } from './clients/csv'

const byId = (id: string) => COMMERCIAL_MOCK.devis.find((d) => d.id === id)!
const clientName = (id: string) => COMMERCIAL_MOCK.clients.find((c) => c.id === id)?.name ?? ''

describe('règles des devis', () => {
  it('calcule les totaux de la maquette Mayli (remise, offert, TVA, marge)', () => {
    const t = devisTotals(byId('dev-014'))
    expect(t).toMatchObject({ ht: 850, discount: 250, tva: 170, ttc: 1020 })
    expect(Math.round(t.margin! * 100)).toBe(54)
    expect(weightedAmount(byId('dev-014'))).toBe(595)
  })

  it('affiche « Sur devis » tant que rien n’est chiffré', () => {
    expect(devisAmount(byId('dev-015'))).toBeNull()
    expect(amountNote(byId('dev-015'))).toBe('à chiffrer')
    expect(devisSubtitle(byId('dev-015'))).toBe('Brouillon, vidéo de marque')
    expect(amountNote(byId('dev-010'))).toBe('motif : budget')
  })

  it('repère les relances dues, les devis chauds et les brouillons oubliés', () => {
    const late = COMMERCIAL_MOCK.devis.filter((d) => needsFollowUp(d, DEMO_NOW)).map((d) => d.id)
    expect(late).toEqual(['dev-014', 'dev-013'])
    expect(COMMERCIAL_MOCK.devis.filter(isHot).map((d) => d.id)).toEqual(['dev-014'])
    expect(isStaleDraft(byId('dev-015'), DEMO_NOW)).toBe(true)
  })

  it('liste les points bloquants avant envoi', () => {
    const r = readiness(byId('dev-014'), 'coralie@mayli-spa.example')
    expect(r.done).toBe(4)
    expect(r.blocking.map((i) => i.id)).toEqual(['tournage'])
    expect(readiness(byId('dev-015'), undefined).blocking.map((i) => i.id)).toEqual(['client', 'prestations', 'realisations', 'tournage'])
  })

  it('attribue le numéro suivant de l’année', () => {
    expect(nextDevisNumber(COMMERCIAL_MOCK.devis, DEMO_NOW)).toBe('DEV-2026-016')
  })
})

describe('analyse gagnés / perdus', () => {
  const deals = decidedDeals(COMMERCIAL_MOCK.devis, COMMERCIAL_MOCK.history, clientName)

  it('réunit le pipeline et l’historique', () => {
    const a = analyse(deals, { owner: 'all', brand: 'all', periodDays: 90 }, DEMO_NOW)
    expect(a.won).toHaveLength(13)
    expect(a.lost).toHaveLength(8)
    expect(a.winReasons[0]).toEqual({ label: 'Nos réalisations', value: 8 })
    expect(a.lossReasons[0]).toEqual({ label: 'Trop cher', value: 4 })
  })

  it('filtre par responsable et par période', () => {
    const a = analyse(deals, { owner: 'AL', brand: 'all', periodDays: 30 }, DEMO_NOW)
    expect(a.deals.every((d) => d.owner === 'AL')).toBe(true)
    expect(a.deals.map((d) => d.client)).toEqual(['Laforêt', 'Agence Immo Littoral'])
  })
})

describe('import CSV', () => {
  it('lit les colonnes connues, les guillemets et le point-virgule', () => {
    const csv = '﻿Nom;Ville;Email\n"Boulangerie ""Le Four""";Toulon;four@exemple.fr\n;Hyères;\nGarage Sud;La Seyne;'
    const { rows, skipped } = parseClientsCsv(csv)
    expect(skipped).toBe(1)
    expect(rows).toEqual([
      { name: 'Boulangerie "Le Four"', contactName: 'Boulangerie "Le Four"', city: 'Toulon', sector: 'À préciser', email: 'four@exemple.fr' },
      { name: 'Garage Sud', contactName: 'Garage Sud', city: 'La Seyne', sector: 'À préciser', email: '' },
    ])
  })
})

describe('remise commerciale', () => {
  it('applique une remise globale en % ou en € et signale au-delà de 20 %', () => {
    const club = byId('dev-013')
    expect(devisTotals({ ...club, globalDiscount: { mode: 'pct', value: 10 } })).toMatchObject({ ht: 1350, globalAmount: 150 })
    expect(devisTotals({ ...club, globalDiscount: { mode: 'eur', value: 2000 } }).ht).toBe(0)
    expect(devisTotals(club).discountRate).toBe(0)
    expect(devisTotals(byId('dev-014')).discountRate).toBeGreaterThan(0.2)
  })
})
